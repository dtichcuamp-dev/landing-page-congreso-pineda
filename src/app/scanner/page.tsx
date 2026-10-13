"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  CheckCircle,
  XCircle,
  Camera,
  Users,
  Building,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  AlertTriangle,
  Search,
  RefreshCw,
  LogOut,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  SALONES_INFO,
  TURNOS_HORARIOS,
  DAYS_CONGRESO,
  computeAforoAlert,
  type SalonKey,
  type TurnoKey,
} from "@/data/pricing";

interface ValidationResult {
  status: "idle" | "loading" | "success" | "warning" | "error";
  message: string;
  id?: string;
  cedula?: string;
  nombres?: string;
  tipo?: string;
  institucion?: string;
  salon?: string;
  jornada?: string;
  turno?: string;
  assignedSalon?: string;
  occupancy?: number;
  capacity?: number;
  remaining?: number;
  alreadyScanned?: boolean;
  mismatch?: boolean;
  paymentPending?: boolean;
  horaValidacion?: string;
}

export default function ScannerPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState("");
  const [salonKey, setSalonKey] = useState<SalonKey>("principal");
  const [jornada, setJornada] = useState("2026-11-02");
  const [turnoKey, setTurnoKey] = useState<TurnoKey>(() => {
    const h = new Date().getHours();
    return h >= 13 ? "tarde" : "manana";
  });
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [cedulaInput, setCedulaInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Aforo en vivo
  const [occupancy, setOccupancy] = useState<number>(0);
  const [isRefreshingOccupancy, setIsRefreshingOccupancy] = useState(false);

  // Resultado de validación
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    status: "idle",
    message: "",
  });

  // Prevenir escaneos dobles rápidos en cámara
  const [lastScanned, setLastScanned] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const currentSalon = SALONES_INFO[salonKey];
  const currentTurno = TURNOS_HORARIOS[turnoKey];
  const currentCapacity = currentSalon.capacity;
  const remainingSeats = Math.max(0, currentCapacity - occupancy);
  const activeAlert = computeAforoAlert(salonKey, occupancy);

  // Cargar credenciales guardadas
  useEffect(() => {
    const savedPass = localStorage.getItem("scanner_password");
    const savedUser = localStorage.getItem("scanner_user");
    if (savedPass && savedUser) {
      setPassword(savedPass);
      setUser(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  // Consultar aforo al cambiar configuración o iniciar sesión
  const fetchOccupancy = async (sKey = salonKey, j = jornada, tKey = turnoKey) => {
    if (!isAuthenticated) return;
    setIsRefreshingOccupancy(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_occupancy",
          password,
          salon: sKey,
          jornada: j,
          turno: tKey,
        }),
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setOccupancy(Number(json.data.occupancy) || 0);
      }
    } catch (err) {
      console.error("Error al obtener aforo:", err);
    } finally {
      setIsRefreshingOccupancy(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOccupancy(salonKey, jornada, turnoKey);
    }
  }, [isAuthenticated, salonKey, jornada, turnoKey]);

  // Sonidos de feedback con Web Audio API
  const playAudioBeep = (type: "success" | "warning" | "error") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else if (type === "warning") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(370, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Ignorar si el navegador bloquea audio sin interacción previa
    }
  };

  // Ejecutar validación hacia el backend
  const handleValidate = async (queryToValidate: string, force = false) => {
    const cleanQuery = queryToValidate.trim();
    if (!cleanQuery) return;

    setValidationResult({
      status: "loading",
      message: `Validando ${cleanQuery}...`,
    });

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_access",
          password,
          query: cleanQuery,
          salon: salonKey,
          jornada,
          turno: turnoKey,
          user,
          force,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        playAudioBeep("error");
        setValidationResult({
          status: "error",
          message: json.error || "No se pudo validar el acceso.",
        });
        return;
      }

      const data = json.data;

      // Actualizar aforo si vino en la respuesta
      if (typeof data.occupancy === "number") {
        setOccupancy(data.occupancy);
      } else {
        fetchOccupancy();
      }

      if (data.warning) {
        playAudioBeep("warning");
        setValidationResult({
          status: "warning",
          message: data.message || "Advertencia de acceso.",
          id: data.id,
          cedula: data.cedula,
          nombres: data.nombres,
          tipo: data.tipo,
          institucion: data.institucion,
          assignedSalon: data.assignedSalon,
          alreadyScanned: data.alreadyScanned,
          mismatch: data.mismatch,
          paymentPending: data.paymentPending,
          salon: data.salon,
          jornada: data.jornada,
          turno: data.turno,
        });
      } else {
        playAudioBeep("success");
        setValidationResult({
          status: "success",
          message: "¡Ingreso Autorizado con Éxito!",
          id: data.id,
          cedula: data.cedula,
          nombres: data.nombres,
          tipo: data.tipo,
          institucion: data.institucion,
          salon: data.salon,
          jornada: data.jornada,
          turno: data.turno,
          horaValidacion: data.horaValidacion,
          occupancy: data.occupancy,
          remaining: data.remaining,
        });

        // Limpiar input manual tras éxito
        setCedulaInput("");

        // Cerrar feedback de éxito tras 4 segundos en modo cámara
        if (activeTab === "camera") {
          setTimeout(() => {
            setValidationResult((prev) => (prev.status === "success" ? { status: "idle", message: "" } : prev));
            setLastScanned("");
          }, 3800);
        }
      }
    } catch (err: any) {
      playAudioBeep("error");
      setValidationResult({
        status: "error",
        message: err.message || "Error de conexión con el servidor.",
      });
    }
  };

  // Inicialización de cámara QR
  useEffect(() => {
    if (!isAuthenticated || activeTab !== "camera") {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        if (decodedText === lastScanned) return;
        setLastScanned(decodedText);
        handleValidate(decodedText, false);
      },
      () => {
        // Ignorar fallas continuas de lectura cuadro a cuadro
      }
    );

    return () => {
      scanner.clear().catch(console.error);
      scannerRef.current = null;
    };
  }, [isAuthenticated, activeTab, salonKey, jornada, turnoKey, password, user, lastScanned]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !password) return;
    localStorage.setItem("scanner_password", password);
    localStorage.setItem("scanner_user", user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("scanner_password");
    localStorage.removeItem("scanner_user");
    setIsAuthenticated(false);
  };

  // Pantalla de inicio de sesión de validadores
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-clinic-50 px-4 py-8">
        <form onSubmit={handleLogin} className="glass w-full max-w-sm rounded-3xl p-8 shadow-xl border border-brand-100">
          <div className="flex justify-center mb-6">
            <div className="bg-brand-600 p-3.5 rounded-2xl text-white shadow-md shadow-brand-500/20">
              <Camera className="size-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-ink mb-1 text-center">Control de Acceso</h1>
          <p className="text-xs text-ink-mute text-center mb-6">
            XIV Congreso HCUAMP 2026 · Validación y Control de Aforo
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">
                Nombre del Validador
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Ej. Puerta Principal 1"
                className="glass-input w-full rounded-xl p-3 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">
                Contraseña de Validación
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full rounded-xl p-3 pr-10 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-mute hover:text-ink transition"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 transition shadow-md shadow-brand-600/30 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="size-5" />
            Iniciar Sesión
          </button>
        </form>
      </main>
    );
  }

  // Porcentaje de ocupación
  const occupancyPercent = Math.min(100, Math.round((occupancy / currentCapacity) * 100));

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <div className="max-w-md mx-auto w-full min-h-screen flex flex-col bg-slate-950 border-x border-slate-800 shadow-2xl">
        {/* Cabecera superior */}
        <header className="bg-slate-900/90 backdrop-blur px-4 py-3 border-b border-slate-800 flex justify-between items-center z-10 sticky top-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-bold text-sm text-white tracking-tight">Scanner & Aforo Pineda</h1>
            </div>
            <p className="text-[11px] text-slate-400">Validador: <span className="text-slate-200 font-semibold">{user}</span></p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-900/50 transition"
          >
            <LogOut className="size-3.5" />
            Salir
          </button>
        </header>

        {/* Panel de Configuración Rápida (Salón, Día y Turno con Horario) */}
        <section className="bg-slate-900 px-4 py-3 border-b border-slate-800 space-y-2.5">
          {/* Selector de Salón */}
          <div className="grid grid-cols-2 gap-2">
            {(["principal", "alterno"] as SalonKey[]).map((key) => {
              const info = SALONES_INFO[key];
              const isSelected = salonKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSalonKey(key)}
                  className={`p-2 rounded-xl text-left border transition text-xs font-semibold flex flex-col justify-between ${
                    isSelected
                      ? "bg-brand-600/30 border-brand-500 text-brand-200 shadow-sm"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold">{info.name}</span>
                    {isSelected && <Check className="size-3.5 text-brand-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">Cap: {info.capacity} puestos</span>
                </button>
              );
            })}
          </div>

          {/* Selectores de Jornada y Turno */}
          <div className="grid grid-cols-2 gap-2">
            {/* Día */}
            <div className="relative">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Jornada
              </label>
              <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-xl px-2.5 py-1.5 border border-slate-700">
                <Calendar className="size-3.5 text-brand-400 shrink-0" />
                <select
                  value={jornada}
                  onChange={(e) => setJornada(e.target.value)}
                  className="bg-transparent text-xs font-medium text-white outline-none w-full cursor-pointer"
                >
                  {DAYS_CONGRESO.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.shortLabel} ({d.weekday})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Turno con horario oficial */}
            <div className="relative">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Turno Oficial
              </label>
              <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-xl px-2.5 py-1.5 border border-slate-700">
                <Clock className="size-3.5 text-brand-400 shrink-0" />
                <select
                  value={turnoKey}
                  onChange={(e) => setTurnoKey(e.target.value as TurnoKey)}
                  className="bg-transparent text-xs font-medium text-white outline-none w-full cursor-pointer"
                >
                  <option value="manana" className="bg-slate-900 text-white">
                    Mañana (08:00 a 12:45)
                  </option>
                  <option value="tarde" className="bg-slate-900 text-white">
                    Tarde (13:00 a 18:00)
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Tarjeta de Aforo en Tiempo Real y Restante de Espacio */}
        <section className="bg-slate-900/60 p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-brand-400" />
              <span className="text-xs font-bold text-slate-200">Aforo en Sala</span>
              <span className="text-[10px] text-slate-400">· {currentTurno.horario}</span>
            </div>
            <button
              onClick={() => fetchOccupancy()}
              disabled={isRefreshingOccupancy}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition disabled:opacity-50"
              title="Actualizar Aforo"
            >
              <RefreshCw className={`size-3 ${isRefreshingOccupancy ? "animate-spin text-brand-400" : ""}`} />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="flex items-end justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Ocupación Actual</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-white">{occupancy}</span>
                <span className="text-xs text-slate-400 font-medium">/ {currentCapacity} puestos</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Espacio Restante</p>
              <div className={`inline-flex items-baseline gap-1 px-2.5 py-1 rounded-xl font-black text-lg mt-0.5 ${
                remainingSeats === 0
                  ? "bg-rose-900/50 text-rose-300 border border-rose-700/60"
                  : remainingSeats <= (salonKey === "principal" ? 20 : 10)
                  ? "bg-amber-900/50 text-amber-300 border border-amber-700/60"
                  : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
              }`}>
                <span>{remainingSeats}</span>
                <span className="text-[11px] font-semibold text-slate-300">libres</span>
              </div>
            </div>
          </div>

          {/* Barra de Progreso de Capacidad */}
          <div className="mt-2.5">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  occupancyPercent >= 90
                    ? "bg-rose-500"
                    : occupancyPercent >= 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>0</span>
              <span className="font-semibold text-slate-300">{occupancyPercent}% lleno</span>
              <span>Max: {currentCapacity}</span>
            </div>
          </div>

          {/* Alertas Automáticas según puestos completados */}
          {activeAlert && (
            <div
              className={`mt-2.5 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
                activeAlert.level === "danger" || activeAlert.level === "max"
                  ? "bg-rose-950/80 border border-rose-600 text-rose-200"
                  : activeAlert.level === "warning"
                  ? "bg-amber-950/80 border border-amber-600 text-amber-200"
                  : "bg-blue-950/80 border border-blue-600 text-blue-200"
              }`}
            >
              <AlertTriangle className="size-4 shrink-0 text-current" />
              <div className="leading-tight">{activeAlert.text}</div>
            </div>
          )}
        </section>

        {/* Pestañas de Modo de Validación: Cámara QR vs Cédula Manual */}
        <div className="flex border-b border-slate-800 bg-slate-900 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "camera"
                ? "border-brand-500 text-white bg-slate-800/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="size-4" />
            <span>Escáner QR (Cámara)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "manual"
                ? "border-brand-500 text-white bg-slate-800/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Search className="size-4" />
            <span>Buscar por Cédula / Código</span>
          </button>
        </div>

        {/* Área Principal de Entrada */}
        <div className="flex-grow flex flex-col relative bg-slate-950">
          {activeTab === "camera" ? (
            <div className="flex-1 flex flex-col justify-center items-center relative min-h-[340px] bg-black">
              <div id="reader" className="w-full h-full border-none" />
              <p className="text-[11px] text-slate-400 p-2 text-center absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur">
                Apunta la cámara al código QR impreso o en el teléfono del asistente.
              </p>
            </div>
          ) : (
            <div className="p-4 flex-1 flex flex-col justify-start">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleValidate(cedulaInput, false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Número de Cédula de Identidad o Código QR
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cedulaInput}
                      onChange={(e) => setCedulaInput(e.target.value)}
                      placeholder="Ej. 12345678 o CP26-0001"
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-lg font-mono text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                      autoFocus
                    />
                    {cedulaInput && (
                      <button
                        type="button"
                        onClick={() => setCedulaInput("")}
                        className="absolute inset-y-0 right-0 pr-4 text-xs text-slate-400 hover:text-white"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Puedes escribir solo los números (ej. 15482910) o el código de comprobante.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!cedulaInput.trim() || validationResult.status === "loading"}
                  className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
                >
                  <UserCheck className="size-5" />
                  <span>Validar Ingreso</span>
                </button>
              </form>

              {/* Atajos numéricos o ayuda */}
              <div className="mt-8 p-3 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-brand-400" />
                  Instrucciones para validadores
                </p>
                <p>• Si el asistente no tiene su código QR a mano, solicita su documento de identidad.</p>
                <p>• El sistema verifica automáticamente la asignación de salón para el día y turno en curso.</p>
                <p>• Ante cualquier discrepancia de turno, se solicitará autorización antes de admitting.</p>
              </div>
            </div>
          )}

          {/* Modal / Overlay de Resultados de Validación */}
          {validationResult.status !== "idle" && (
            <div
              className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-5 ${
                validationResult.status === "loading"
                  ? "bg-black/75 backdrop-blur-md"
                  : validationResult.status === "success"
                  ? "bg-emerald-950/95 backdrop-blur-md"
                  : validationResult.status === "warning"
                  ? "bg-amber-950/95 backdrop-blur-md"
                  : "bg-rose-950/95 backdrop-blur-md"
              } transition-all duration-300 text-white`}
            >
              {/* Cargando */}
              {validationResult.status === "loading" && (
                <div className="text-center">
                  <RefreshCw className="size-14 text-brand-400 animate-spin mx-auto mb-4" />
                  <p className="text-xl font-bold text-white">{validationResult.message}</p>
                  <p className="text-xs text-slate-300 mt-2">Consultando asistencia y aforo...</p>
                </div>
              )}

              {/* Éxito */}
              {validationResult.status === "success" && (
                <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-200">
                  <div className="size-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-400/40">
                    <CheckCircle className="size-10 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black text-emerald-300 mb-1">{validationResult.message}</h2>
                  <p className="text-lg font-bold text-white mb-0.5">{validationResult.nombres}</p>
                  <p className="text-xs text-emerald-200/90 font-mono mb-3">CI: {validationResult.cedula} · {validationResult.id}</p>

                  <div className="bg-emerald-900/60 border border-emerald-700/60 rounded-2xl p-3 text-left space-y-1.5 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Tipo:</span>
                      <span className="font-semibold text-white">{validationResult.tipo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Institución:</span>
                      <span className="font-semibold text-white">{validationResult.institucion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Salón:</span>
                      <span className="font-semibold text-white">{validationResult.salon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Turno:</span>
                      <span className="font-semibold text-white">{validationResult.turno}</span>
                    </div>
                    {validationResult.horaValidacion && (
                      <div className="flex justify-between border-t border-emerald-800/80 pt-1">
                        <span className="text-emerald-300">Hora Ingreso:</span>
                        <span className="font-mono font-bold text-white">{validationResult.horaValidacion}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setValidationResult({ status: "idle", message: "" });
                      setLastScanned("");
                    }}
                    className="w-full bg-white text-emerald-950 font-black py-3 rounded-xl hover:bg-emerald-100 transition shadow-lg"
                  >
                    Continuar Validando
                  </button>
                </div>
              )}

              {/* Advertencia / Mismatch / Ya Registrado */}
              {validationResult.status === "warning" && (
                <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-200">
                  <div className="size-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-400/40">
                    <AlertTriangle className="size-10 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-black text-amber-300 mb-2">Advertencia de Ingreso</h2>
                  <p className="text-sm font-semibold text-white mb-2 leading-snug">{validationResult.message}</p>
                  
                  <div className="bg-amber-900/60 border border-amber-700/60 rounded-2xl p-3 text-left space-y-1.5 text-xs mb-4">
                    <p className="font-bold text-white text-sm">{validationResult.nombres}</p>
                    <p className="text-amber-200 font-mono">CI: {validationResult.cedula} · {validationResult.id}</p>
                    {validationResult.assignedSalon && (
                      <p className="text-amber-100">
                        <strong className="text-amber-300">Salón Programado:</strong> {validationResult.assignedSalon}
                      </p>
                    )}
                    <p className="text-amber-100">
                      <strong className="text-amber-300">Salón Actual:</strong> {SALONES_INFO[salonKey].name}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleValidate(validationResult.cedula || validationResult.id || "", true)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition shadow-lg"
                    >
                      Autorizar Ingreso Excepcional
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValidationResult({ status: "idle", message: "" });
                        setLastScanned("");
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl transition"
                    >
                      Rechazar / Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Error / Acceso Denegado */}
              {validationResult.status === "error" && (
                <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-200">
                  <div className="size-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-400/40">
                    <XCircle className="size-10 text-rose-400" />
                  </div>
                  <h2 className="text-2xl font-black text-rose-300 mb-2">Acceso Denegado</h2>
                  <p className="text-sm font-medium text-rose-100 mb-6 leading-relaxed">
                    {validationResult.message}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setValidationResult({ status: "idle", message: "" });
                      setLastScanned("");
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition border border-slate-700"
                  >
                    Intentar de Nuevo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barra de estado inferior */}
        <footer className="bg-slate-900 border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400 flex justify-between items-center">
          <span>{currentSalon.name}</span>
          <span className="font-semibold text-slate-300">{currentTurno.label}</span>
        </footer>
      </div>
    </main>
  );
}

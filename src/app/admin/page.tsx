"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  ExternalLink,
  RefreshCw,
  LogOut,
  Eye,
  EyeOff,
  Mail,
  Send,
  Search,
  Check,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  FileCheck2,
  Building,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  Filter,
} from "lucide-react";
import {
  usd,
  DAYS_CONGRESO,
  CAPACIDADES_SALON,
  SALONES_INFO,
  TURNOS_HORARIOS,
  computeAforoAlert,
  type SalonKey,
  type TurnoKey,
} from "@/data/pricing";
import { getCapacities } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Registration {
  id: string;
  fecha: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  sexo: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  tipo: string;
  monto: number;
  comprobante: string;
  estado: string;
  turnosTexto?: string;
  turnosJson?: string;
  dias?: string;
  numDias?: number;
}

interface RosterModalState {
  isOpen: boolean;
  diaLabel: string;
  turnoLabel: string;
  salonName: string;
  capacity: number;
  occupied: number;
  participants: Registration[];
}

/** Helper para parsear turnos de un participante de forma segura */
function parseTurnos(r: Registration): Record<string, { manana?: string; tarde?: string }> {
  if (r.turnosJson) {
    try {
      const parsed = typeof r.turnosJson === "string" ? JSON.parse(r.turnosJson) : r.turnosJson;
      if (parsed && typeof parsed === "object") return parsed;
    } catch (_) {}
  }
  // Fallback si no hay JSON pero hay texto legible
  if (r.turnosTexto) {
    const res: Record<string, { manana?: string; tarde?: string }> = {};
    for (const dia of DAYS_CONGRESO) {
      if (r.turnosTexto.includes(dia.shortLabel) || r.turnosTexto.includes(dia.dateLabel)) {
        const lower = r.turnosTexto.toLowerCase();
        if (lower.includes("mañana")) {
          const s = lower.includes("alterno") ? "alterno" : "principal";
          res[dia.id] = { ...res[dia.id], manana: s };
        }
        if (lower.includes("tarde")) {
          const s = lower.includes("alterno") ? "alterno" : "principal";
          res[dia.id] = { ...res[dia.id], tarde: s };
        }
      }
    }
    return res;
  }
  return {};
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<Registration[]>([]);
  const [serverCapacities, setServerCapacities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados para reenvío de comprobantes y QR
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFilter, setBulkFilter] = useState<"all" | "approved_only" | "selected">("all");
  const [bulkSending, setBulkSending] = useState(false);
  const [mailQuota, setMailQuota] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  // Filtros de búsqueda para la tabla
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [salonFilter, setSalonFilter] = useState<string>("all");
  const [turnoFilter, setTurnoFilter] = useState<string>("all");

  // Control de Aforo por Día, Turno y Salón
  const [selectedAforoDay, setSelectedAforoDay] = useState<string>("all");
  const [rosterModal, setRosterModal] = useState<RosterModalState | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>("");

  // Recuperar sesión si ya existe
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_password");
    if (saved) {
      setPassword(saved);
      fetchData(saved);
    }
  }, []);

  const fetchData = async (pass: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_data", password: pass }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al autenticar");

      setData(json.data);
      if (typeof json.mailQuota === "number") {
        setMailQuota(json.mailQuota);
      }
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_password", pass);

      // Sincronizar capacidades en tiempo real del servidor
      try {
        const caps = await getCapacities();
        if (caps) setServerCapacities(caps);
      } catch (_) {}
    } catch (err: any) {
      setError(err.message);
      setIsAuthenticated(false);
      sessionStorage.removeItem("admin_password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_password");
    setIsAuthenticated(false);
    setPassword("");
    setData([]);
    setSelectedIds([]);
  };

  const approvePayment = async (id: string, correo: string) => {
    if (
      !confirm(
        `¿Estás seguro de aprobar el pago del registro ${id}? Se enviará automáticamente su comprobante y código QR a ${correo}.`
      )
    )
      return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", password, id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al aprobar");

      // Actualizar estado localmente
      setData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: "Aprobado" } : r))
      );
      setNotification({
        type: "success",
        message: `✓ Pago aprobado para ${id}. Se ha remitido el comprobante y pase QR oficial a ${correo}.`,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Reenvío individual de comprobante con código QR
  const handleResendSingle = async (row: Registration) => {
    if (
      !confirm(
        `¿Reenviar comprobante oficial y código QR a ${row.nombres} ${row.apellidos} (${row.correo})?`
      )
    )
      return;
    setResendingId(row.id);
    setNotification(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_email", password, id: row.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo reenviar el comprobante");

      setNotification({
        type: "success",
        message: `✓ Comprobante con código QR reenviado exitosamente a ${row.correo} (${row.id}).`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Error al reenviar a ${row.correo}: ${err.message}`,
      });
    } finally {
      setResendingId(null);
    }
  };

  // Reenvío masivo de comprobantes
  const handleResendBulk = async () => {
    setBulkSending(true);
    setNotification(null);
    try {
      const payload: any = {
        action: "resend_bulk_emails",
        password,
        filter: bulkFilter === "approved_only" ? "approved_only" : "all",
      };
      if (bulkFilter === "selected" && selectedIds.length > 0) {
        payload.ids = selectedIds;
      }

      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        // Si el servidor retornó error explícito de cuota
        if (json.quotaExceeded || json.error?.includes("demasiadas veces") || json.error?.toLowerCase().includes("cuota")) {
          setMailQuota(0);
          throw new Error(
            "Límite diario de envíos de Google alcanzado («Servicio solicitado demasiadas veces para un mismo día: email»). Google restablece automáticamente esta cuota en 24 horas."
          );
        }
        throw new Error(json.error || "Error en el reenvío masivo");
      }

      const sentCount: number = json.data?.sentCount ?? 0;
      const totalCount: number = json.data?.totalCount ?? 0;
      const failed: any[] = json.data?.failed || [];

      if (typeof json.mailQuota === "number") {
        setMailQuota(json.mailQuota);
      } else if (typeof json.data?.quotaRemaining === "number") {
        setMailQuota(json.data.quotaRemaining);
      }

      const isQuotaStopped =
        json.quotaExceeded ||
        json.stoppedByQuota ||
        json.data?.quotaExceeded ||
        json.data?.stoppedByQuota ||
        failed.some(
          (f) =>
            f.isQuota ||
            f.error?.includes("demasiadas veces") ||
            f.error?.toLowerCase().includes("quota")
        );

      const invalidEmailFails = failed.filter(
        (f) =>
          f.isInvalidEmail ||
          f.error?.includes("Correo inválido") ||
          f.error?.includes("ausente")
      );

      const otherFails = failed.filter(
        (f) =>
          !f.isQuota &&
          !f.isInvalidEmail &&
          !f.error?.includes("demasiadas veces") &&
          !f.error?.toLowerCase().includes("quota")
      );

      setShowBulkModal(false);
      setSelectedIds([]);

      if (isQuotaStopped) {
        setMailQuota(0);
        setNotification({
          type: "warning",
          message: `⚠️ Límite de envíos diarios de Google alcanzado: Se enviaron ${sentCount} correos. Google suspendió los envíos restantes («Servicio solicitado demasiadas veces para un mismo día: email»). Esta cuota es restablecida por Google automáticamente cada 24 horas.`,
        });
      } else if (sentCount > 0 && failed.length === 0) {
        setNotification({
          type: "success",
          message: `✓ Reenvío masivo completado exitosamente: Se enviaron los ${sentCount} correos con comprobante y código QR oficial de ${totalCount} participantes.`,
        });
      } else if (failed.length > 0) {
        const detailParts: string[] = [];
        if (invalidEmailFails.length > 0) {
          detailParts.push(`${invalidEmailFails.length} por dirección de correo no válida`);
        }
        if (otherFails.length > 0) {
          detailParts.push(`${otherFails.length} por error de red/servidor`);
        }
        setNotification({
          type: sentCount > 0 ? "warning" : "error",
          message: `${
            sentCount > 0
              ? `✓ Se enviaron ${sentCount} correos.`
              : "No se pudo realizar el envío."
          } ${detailParts.length > 0 ? `(${detailParts.join(", ")})` : `(${failed.length} fallos detectados)`}`,
        });
      } else {
        setNotification({
          type: "info",
          message: `No se encontraron registros pendientes bajo el filtro seleccionado.`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Error en reenvío masivo: ${err.message}`,
      });
    } finally {
      setBulkSending(false);
    }
  };

  // Computar conteo de reservas por cada combinación de Día, Turno y Salón
  const reservationsBySlot = useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        aprobados: number;
        pendientes: number;
        registrations: Registration[];
      }
    > = {};

    // Inicializar los 20 slots posibles (5 días * 2 turnos * 2 salones)
    for (const dia of DAYS_CONGRESO) {
      for (const turnoKey of ["manana", "tarde"] as const) {
        for (const salonKey of ["principal", "alterno"] as const) {
          const key = `${dia.id}_${turnoKey}_${salonKey}`;
          map[key] = {
            total: 0,
            aprobados: 0,
            pendientes: 0,
            registrations: [],
          };
        }
      }
    }

    // Agregar inscripciones reales
    data.forEach((r) => {
      const turnos = parseTurnos(r);
      for (const [diaId, t] of Object.entries(turnos)) {
        if (t.manana && (t.manana === "principal" || t.manana === "alterno")) {
          const key = `${diaId}_manana_${t.manana}`;
          if (map[key]) {
            map[key].total++;
            if (r.estado === "Aprobado" || r.estado === "Exonerado") {
              map[key].aprobados++;
            } else {
              map[key].pendientes++;
            }
            map[key].registrations.push(r);
          }
        }
        if (t.tarde && (t.tarde === "principal" || t.tarde === "alterno")) {
          const key = `${diaId}_tarde_${t.tarde}`;
          if (map[key]) {
            map[key].total++;
            if (r.estado === "Aprobado" || r.estado === "Exonerado") {
              map[key].aprobados++;
            } else {
              map[key].pendientes++;
            }
            map[key].registrations.push(r);
          }
        }
      }
    });

    return map;
  }, [data]);

  // Filtrado de la tabla de participantes
  const filteredData = useMemo(() => {
    return data.filter((r) => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        `${r.nombres} ${r.apellidos}`.toLowerCase().includes(search) ||
        r.cedula.toLowerCase().includes(search) ||
        r.correo.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search) ||
        r.tipo.toLowerCase().includes(search) ||
        (r.turnosTexto && r.turnosTexto.toLowerCase().includes(search));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Aprobado" && r.estado === "Aprobado") ||
        (statusFilter === "Exonerado" && r.estado === "Exonerado") ||
        (statusFilter === "Pendiente" && r.estado === "Pendiente de verificación");

      // Filtros opcionales de aforo
      let matchesDay = true;
      let matchesSalon = true;
      let matchesTurno = true;

      if (dayFilter !== "all" || salonFilter !== "all" || turnoFilter !== "all") {
        const turnos = parseTurnos(r);
        if (dayFilter !== "all") {
          matchesDay = !!turnos[dayFilter];
        }
        if (salonFilter !== "all") {
          matchesSalon = Object.values(turnos).some(
            (t) => t.manana === salonFilter || t.tarde === salonFilter
          );
        }
        if (turnoFilter !== "all") {
          matchesTurno = Object.values(turnos).some((t) =>
            turnoFilter === "manana" ? !!t.manana : !!t.tarde
          );
        }
      }

      return matchesSearch && matchesStatus && matchesDay && matchesSalon && matchesTurno;
    });
  }, [data, searchTerm, statusFilter, dayFilter, salonFilter, turnoFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length && filteredData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-clinic-50 px-4">
        <form onSubmit={handleLogin} className="glass w-full max-w-sm rounded-3xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-ink mb-6 text-center">Acceso Administrativo</h1>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink-soft mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full rounded-xl p-3 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-mute hover:text-ink transition"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Entrar al Dashboard"}
          </button>
        </form>
      </main>
    );
  }

  const totalInscritos = data.length;
  const totalMonto = data.reduce((acc, r) => acc + (Number(r.monto) || 0), 0);
  const pendientes = data.filter((r) => r.estado === "Pendiente de verificación").length;
  const aprobados = data.filter((r) => r.estado === "Aprobado").length;
  const exonerados = data.filter((r) => r.estado === "Exonerado").length;

  // Estadísticas Demográficas
  const tipoStatsMap: Record<string, number> = {};
  const sexoStatsMap: Record<string, number> = { Femenino: 0, Masculino: 0 };
  const edadStatsMap: Record<string, number> = {
    "18-25": 0,
    "26-35": 0,
    "36-45": 0,
    "46-55": 0,
    "56+": 0,
  };
  const currentYear = new Date().getFullYear();

  data.forEach((r) => {
    tipoStatsMap[r.tipo] = (tipoStatsMap[r.tipo] || 0) + 1;
    if (r.sexo === "F") sexoStatsMap.Femenino++;
    else if (r.sexo === "M") sexoStatsMap.Masculino++;

    if (r.fechaNacimiento) {
      const birthYear = new Date(r.fechaNacimiento).getFullYear();
      const age = currentYear - birthYear;
      if (age >= 18 && age <= 25) edadStatsMap["18-25"]++;
      else if (age >= 26 && age <= 35) edadStatsMap["26-35"]++;
      else if (age >= 36 && age <= 45) edadStatsMap["36-45"]++;
      else if (age >= 46 && age <= 55) edadStatsMap["46-55"]++;
      else if (age >= 56) edadStatsMap["56+"]++;
    }
  });

  const tipoData = Object.entries(tipoStatsMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const sexoData = [
    { name: "Femenino", value: sexoStatsMap.Femenino, color: "#ec4899" },
    { name: "Masculino", value: sexoStatsMap.Masculino, color: "#3b82f6" },
  ].filter((d) => d.value > 0);
  const edadData = Object.entries(edadStatsMap).map(([name, value]) => ({ name, value }));

  // Helper para renderizar tarjeta de aforo por Salón
  const renderSalonCard = (
    dia: (typeof DAYS_CONGRESO)[number],
    turnoKey: "manana" | "tarde",
    salonKey: "principal" | "alterno"
  ) => {
    const key = `${dia.id}_${turnoKey}_${salonKey}`;
    const slot = reservationsBySlot[key] || {
      total: 0,
      aprobados: 0,
      pendientes: 0,
      registrations: [],
    };
    const cap = SALONES_INFO[salonKey].capacity;
    // Si el servidor reporta un número mayor, respetamos la ocupación máxima
    const occ = Math.max(slot.total, serverCapacities[key] || 0);
    const rem = Math.max(0, cap - occ);
    const pct = Math.min(100, Math.round((occ / cap) * 100));
    const alert = computeAforoAlert(salonKey, occ);
    const isFull = occ >= cap;

    const isPrincipal = salonKey === "principal";
    const turnoLabel =
      turnoKey === "manana" ? "Mañana (08:00 a 12:45)" : "Tarde (13:00 a 18:00)";

    // Colores de la barra de progreso
    let barColor = "bg-emerald-500";
    if (isFull) {
      barColor = "bg-red-600";
    } else if (alert?.level === "danger") {
      barColor = "bg-rose-600";
    } else if (alert?.level === "warning") {
      barColor = "bg-amber-500";
    } else if (alert?.level === "info") {
      barColor = "bg-yellow-500";
    }

    return (
      <div
        key={key}
        className={`rounded-2xl p-4 transition shadow-xs border ${
          isFull
            ? "bg-red-50/80 border-red-300 ring-1 ring-red-300"
            : alert
              ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-200"
              : "bg-white/90 border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 ${
                isPrincipal
                  ? "bg-blue-100 text-blue-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {SALONES_INFO[salonKey].name}
            </span>
            <div className="text-xs text-ink-mute">
              Capacidad Total: <b>{cap} puestos</b>
            </div>
          </div>

          {/* Badge de Estado / Alerta */}
          {isFull ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
              <AlertTriangle className="size-2.5" /> Cupos Completos
            </span>
          ) : alert ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                alert.level === "danger"
                  ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                  : "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
              }`}
            >
              <AlertTriangle className="size-2.5" /> Alerta: {alert.threshold} ocupados
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              🟢 {rem} puestos libres
            </span>
          )}
        </div>

        {/* Cifras Grandes de Aforo */}
        <div className="flex items-baseline justify-between mt-3 mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-ink">{occ}</span>
            <span className="text-xs text-ink-mute">/ {cap} ocupados</span>
          </div>
          <div className="text-right">
            <span className={`text-sm font-black ${isFull ? "text-red-600" : rem <= 20 ? "text-amber-600" : "text-emerald-600"}`}>
              {rem} libres
            </span>
            <span className="block text-[10px] text-ink-mute">{pct}% ocupación</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden mb-3">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Desglose de aprobados vs pendientes */}
        <div className="flex items-center justify-between text-[11px] text-ink-soft border-t border-black/5 pt-2 mb-3">
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <CheckCircle className="size-3" /> {slot.aprobados} Confirmados
          </span>
          <span className="flex items-center gap-1 font-semibold text-amber-700">
            <Clock className="size-3" /> {slot.pendientes} Por Verificar
          </span>
        </div>

        {/* Mensaje descriptivo de alerta oficial */}
        {alert && (
          <div
            className={`rounded-xl p-2 text-[10px] leading-snug mb-3 flex items-start gap-1.5 font-medium ${
              alert.level === "max" || alert.level === "danger"
                ? "bg-red-100/90 text-red-900 border border-red-200"
                : "bg-amber-100/90 text-amber-950 border border-amber-200"
            }`}
          >
            <ShieldAlert className="size-3.5 shrink-0 mt-0.5 text-amber-700" />
            <span>{alert.text}</span>
          </div>
        )}

        {/* Botón para ver lista de participantes */}
        <button
          type="button"
          onClick={() =>
            setRosterModal({
              isOpen: true,
              diaLabel: dia.dateLabel,
              turnoLabel,
              salonName: SALONES_INFO[salonKey].name,
              capacity: cap,
              occupied: occ,
              participants: slot.registrations,
            })
          }
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 py-1.5 text-xs font-bold text-ink-soft hover:text-brand-600 transition shadow-2xs"
        >
          <Users className="size-3.5" /> Ver participantes ({slot.registrations.length})
        </button>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-clinic-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-ink">Dashboard del Congreso</h1>
            <p className="text-xs sm:text-sm text-ink-soft">
              Panel de control de inscripciones, conteo de reservas por salón y emisión de credenciales
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Indicador de Cuota de Envíos de Google */}
            {mailQuota !== null && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                  mailQuota === 0
                    ? "bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200"
                    : mailQuota < 20
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
                title="Cuota de correos diarios restantes en la cuenta de Google de Apps Script"
              >
                <Mail className="size-3.5" />
                <span>
                  Cuota Google: <b>{mailQuota}</b> envíos disponibles hoy
                </span>
              </div>
            )}

            {/* Botón Reenvío Masivo de Comprobantes */}
            <button
              onClick={() => {
                setBulkFilter(selectedIds.length > 0 ? "selected" : "all");
                setShowBulkModal(true);
              }}
              disabled={data.length === 0}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 via-brand-700 to-clinic-600 hover:brightness-110 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-brand-500/25 transition disabled:opacity-50"
              title="Reenviar comprobante y código QR masivamente"
            >
              <Send className="size-4" />
              {selectedIds.length > 0
                ? `Reenviar a Seleccionados (${selectedIds.length})`
                : "Reenvío Masivo de Comprobantes"}
            </button>

            <button
              onClick={() => fetchData(password)}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-ink-soft shadow-sm hover:text-brand-600 hover:border-brand-200 transition"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100 transition"
            >
              <LogOut className="size-4" /> Salir
            </button>
          </div>
        </div>

        {/* Notificación Toast / Feedback */}
        {notification && (
          <div
            className={`flex items-center justify-between gap-3 p-4 rounded-2xl shadow-sm text-xs sm:text-sm font-semibold transition ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : notification.type === "warning"
                  ? "bg-amber-50 text-amber-900 border border-amber-300 ring-1 ring-amber-200"
                  : notification.type === "error"
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle className="size-5 text-emerald-600 shrink-0" />
              ) : notification.type === "warning" ? (
                <AlertTriangle className="size-5 text-amber-600 shrink-0" />
              ) : (
                <AlertTriangle className="size-5 text-red-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Tarjetas Métricas Globales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5 flex flex-col border-b-4 border-brand-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Total Inscritos
              </span>
              <Users className="size-5 text-brand-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-ink">{totalInscritos}</span>
              <span className="text-xs text-ink-mute">({exonerados} exonerados)</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 flex flex-col border-b-4 border-emerald-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Monto Total (USD)
              </span>
              <DollarSign className="size-5 text-emerald-500" />
            </div>
            <span className="text-3xl font-black text-ink">{usd(totalMonto)}</span>
          </div>

          <div className="glass rounded-2xl p-5 flex flex-col border-b-4 border-amber-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Por Verificar
              </span>
              <Clock className="size-5 text-amber-500" />
            </div>
            <span className="text-3xl font-black text-ink">{pendientes}</span>
          </div>

          <div className="glass rounded-2xl p-5 flex flex-col border-b-4 border-clinic-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Aprobados
              </span>
              <CheckCircle className="size-5 text-clinic-500" />
            </div>
            <span className="text-3xl font-black text-ink">{aprobados}</span>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════════ */}
        {/* SECCIÓN NUEVA: CONTEO DE RESERVAS Y AFORO POR DÍA, TURNO Y SALÓN          */}
        {/* ═════════════════════════════════════════════════════════════════════════ */}
        <div className="glass rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h2 className="text-xl font-black text-ink">
                  Control de Reservas y Aforo por Salón
                </h2>
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                Monitoreo en tiempo real de reservas por Día, Turnos (Mañana 08:00 a 12:45 / Tarde 13:00 a 18:00) y Salones (Principal 240 / Alterno 60)
              </p>
            </div>

            {/* Selector de Día (Pills) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedAforoDay("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedAforoDay === "all"
                    ? "bg-brand-600 text-white shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-white/60"
                }`}
              >
                Matriz Consolidada (5 Días)
              </button>
              {DAYS_CONGRESO.map((dia) => (
                <button
                  key={dia.id}
                  type="button"
                  onClick={() => setSelectedAforoDay(dia.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedAforoDay === dia.id
                      ? "bg-brand-600 text-white shadow-xs"
                      : "text-ink-soft hover:text-ink hover:bg-white/60"
                  }`}
                >
                  {dia.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* VISTA 1: MATRIZ CONSOLIDADA DE LOS 5 DÍAS */}
          {selectedAforoDay === "all" ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-ink-soft font-bold">
                      <th className="p-3.5 pl-4">Día / Fecha</th>
                      <th className="p-3.5 text-center bg-blue-50/40">
                        Mañana: Salón Principal (1)
                        <span className="block font-normal text-[10px] text-ink-mute">Cap. 240</span>
                      </th>
                      <th className="p-3.5 text-center bg-emerald-50/40">
                        Mañana: Salón Alterno (2)
                        <span className="block font-normal text-[10px] text-ink-mute">Cap. 60</span>
                      </th>
                      <th className="p-3.5 text-center bg-blue-50/40">
                        Tarde: Salón Principal (1)
                        <span className="block font-normal text-[10px] text-ink-mute">Cap. 240</span>
                      </th>
                      <th className="p-3.5 text-center bg-emerald-50/40">
                        Tarde: Salón Alterno (2)
                        <span className="block font-normal text-[10px] text-ink-mute">Cap. 60</span>
                      </th>
                      <th className="p-3.5 text-right pr-4">Total Reservas Día</th>
                      <th className="p-3.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DAYS_CONGRESO.map((dia) => {
                      const occM1 = Math.max(
                        reservationsBySlot[`${dia.id}_manana_principal`]?.total || 0,
                        serverCapacities[`${dia.id}_manana_principal`] || 0
                      );
                      const occM2 = Math.max(
                        reservationsBySlot[`${dia.id}_manana_alterno`]?.total || 0,
                        serverCapacities[`${dia.id}_manana_alterno`] || 0
                      );
                      const occT1 = Math.max(
                        reservationsBySlot[`${dia.id}_tarde_principal`]?.total || 0,
                        serverCapacities[`${dia.id}_tarde_principal`] || 0
                      );
                      const occT2 = Math.max(
                        reservationsBySlot[`${dia.id}_tarde_alterno`]?.total || 0,
                        serverCapacities[`${dia.id}_tarde_alterno`] || 0
                      );
                      const diaTotal = occM1 + occM2 + occT1 + occT2;

                      const alertM1 = computeAforoAlert("principal", occM1);
                      const alertM2 = computeAforoAlert("alterno", occM2);
                      const alertT1 = computeAforoAlert("principal", occT1);
                      const alertT2 = computeAforoAlert("alterno", occT2);

                      return (
                        <tr key={dia.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3.5 pl-4">
                            <div className="font-bold text-ink">{dia.dateLabel}</div>
                            <div className="text-[10px] text-ink-mute font-mono">{dia.id}</div>
                          </td>

                          {/* Mañana Salón 1 */}
                          <td className="p-3.5 text-center bg-blue-50/20">
                            <span
                              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                                occM1 >= 240
                                  ? "bg-red-600 text-white"
                                  : alertM1
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-blue-50 text-blue-800"
                              }`}
                            >
                              {occM1} / 240
                              <span className="text-[9px] font-normal opacity-80">
                                ({Math.max(0, 240 - occM1)} lib)
                              </span>
                            </span>
                          </td>

                          {/* Mañana Salón 2 */}
                          <td className="p-3.5 text-center bg-emerald-50/20">
                            <span
                              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                                occM2 >= 60
                                  ? "bg-red-600 text-white"
                                  : alertM2
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-emerald-50 text-emerald-800"
                              }`}
                            >
                              {occM2} / 60
                              <span className="text-[9px] font-normal opacity-80">
                                ({Math.max(0, 60 - occM2)} lib)
                              </span>
                            </span>
                          </td>

                          {/* Tarde Salón 1 */}
                          <td className="p-3.5 text-center bg-blue-50/20">
                            <span
                              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                                occT1 >= 240
                                  ? "bg-red-600 text-white"
                                  : alertT1
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-blue-50 text-blue-800"
                              }`}
                            >
                              {occT1} / 240
                              <span className="text-[9px] font-normal opacity-80">
                                ({Math.max(0, 240 - occT1)} lib)
                              </span>
                            </span>
                          </td>

                          {/* Tarde Salón 2 */}
                          <td className="p-3.5 text-center bg-emerald-50/20">
                            <span
                              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                                occT2 >= 60
                                  ? "bg-red-600 text-white"
                                  : alertT2
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-emerald-50 text-emerald-800"
                              }`}
                            >
                              {occT2} / 60
                              <span className="text-[9px] font-normal opacity-80">
                                ({Math.max(0, 60 - occT2)} lib)
                              </span>
                            </span>
                          </td>

                          {/* Total Reservas Día */}
                          <td className="p-3.5 text-right pr-4 font-black text-ink">
                            {diaTotal}
                          </td>

                          {/* Botón Ver Detalle */}
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedAforoDay(dia.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition"
                            >
                              Detallar día <ChevronRight className="size-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VISTA 2: DETALLE DEL DÍA SELECCIONADO POR TURNOS Y SALONES */
            (() => {
              const dia = DAYS_CONGRESO.find((d) => d.id === selectedAforoDay);
              if (!dia) return null;

              return (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="size-5 text-brand-600" />
                      <div>
                        <h3 className="text-base font-bold text-ink">{dia.dateLabel}</h3>
                        <p className="text-xs text-ink-mute">
                          Control de aforo por turnos de mañana y tarde
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAforoDay("all")}
                      className="text-xs font-bold text-brand-700 underline hover:text-brand-900"
                    >
                      ← Volver a Matriz Consolidada
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* COLUMNA 1: TURNO MAÑANA (08:00 a 12:45) */}
                    <div className="space-y-3.5 rounded-3xl bg-slate-50/70 p-4 ring-1 ring-slate-200">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-brand-600" />
                          <h4 className="font-black text-ink text-sm">Turno Mañana</h4>
                        </div>
                        <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md ring-1 ring-brand-200">
                          08:00 a 12:45
                        </span>
                      </div>

                      <div className="space-y-3">
                        {renderSalonCard(dia, "manana", "principal")}
                        {renderSalonCard(dia, "manana", "alterno")}
                      </div>
                    </div>

                    {/* COLUMNA 2: TURNO TARDE (13:00 a 18:00) */}
                    <div className="space-y-3.5 rounded-3xl bg-slate-50/70 p-4 ring-1 ring-slate-200">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-clinic-600" />
                          <h4 className="font-black text-ink text-sm">Turno Tarde</h4>
                        </div>
                        <span className="text-[11px] font-bold text-clinic-700 bg-clinic-50 px-2 py-0.5 rounded-md ring-1 ring-clinic-200">
                          13:00 a 18:00
                        </span>
                      </div>

                      <div className="space-y-3">
                        {renderSalonCard(dia, "tarde", "principal")}
                        {renderSalonCard(dia, "tarde", "alterno")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* Gráficos Estadísticos Demográficos */}
        {totalInscritos > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass rounded-3xl p-6 flex flex-col items-center">
              <h3 className="text-base font-bold text-ink mb-4 w-full text-center">
                Inscritos por Sexo
              </h3>
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sexoData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={5}
                    >
                      {sexoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 flex flex-col items-center">
              <h3 className="text-base font-bold text-ink mb-4 w-full text-center">
                Inscritos por Edades
              </h3>
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edadData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 flex flex-col items-center">
              <h3 className="text-base font-bold text-ink mb-4 w-full text-center">
                Inscritos por Categoría
              </h3>
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tipoData} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Filtros y Búsqueda */}
        <div className="glass rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, correo o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 pl-10 pr-4 py-2 text-xs sm:text-sm text-ink placeholder:text-ink-mute focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro Estado */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-ink-soft">Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink focus:border-brand-500 focus:outline-none"
              >
                <option value="all">Todos ({data.length})</option>
                <option value="Aprobado">Aprobados ({aprobados})</option>
                <option value="Exonerado">Exonerados ({exonerados})</option>
                <option value="Pendiente">Pendientes ({pendientes})</option>
              </select>
            </div>

            {/* Filtro Día */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-ink-soft">Día:</span>
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink focus:border-brand-500 focus:outline-none"
              >
                <option value="all">Todos los días</option>
                {DAYS_CONGRESO.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Salón */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-ink-soft">Salón:</span>
              <select
                value={salonFilter}
                onChange={(e) => setSalonFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink focus:border-brand-500 focus:outline-none"
              >
                <option value="all">Todos los salones</option>
                <option value="principal">Salón Principal (1)</option>
                <option value="alterno">Salón Alterno (2)</option>
              </select>
            </div>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-brand-700 underline font-semibold ml-2"
              >
                Limpiar selección ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Participantes */}
        <div className="glass rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/60 text-ink-soft font-semibold text-xs border-b border-brand-100">
                <tr>
                  <th className="p-4 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-ink-mute hover:text-brand-600 transition"
                      title={
                        selectedIds.length === filteredData.length
                          ? "Deseleccionar todos"
                          : "Seleccionar todos"
                      }
                    >
                      {selectedIds.length > 0 && selectedIds.length === filteredData.length ? (
                        <CheckSquare className="size-4 text-brand-600" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 px-4">ID / Registro</th>
                  <th className="p-4">Participante & Contacto</th>
                  <th className="p-4">Cédula</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Turnos y Salones</th>
                  <th className="p-4 text-right">Monto</th>
                  <th className="p-4 text-center">Comprobante</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filteredData.map((row) => {
                  const isSelected = selectedIds.includes(row.id);
                  const isResending = resendingId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-white/50 transition ${isSelected ? "bg-brand-50/40" : ""}`}
                    >
                      {/* Checkbox de selección */}
                      <td className="p-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelect(row.id)}
                          className="text-ink-mute hover:text-brand-600 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="size-4 text-brand-600" />
                          ) : (
                            <Square className="size-4" />
                          )}
                        </button>
                      </td>

                      {/* ID y Fecha */}
                      <td className="p-4 px-4">
                        <div className="font-mono font-bold text-brand-700">{row.id}</div>
                        <div className="text-[11px] text-ink-mute mt-0.5">
                          {new Date(row.fecha).toLocaleDateString("es-VE", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Nombre y Correo */}
                      <td className="p-4">
                        <div className="font-bold text-ink leading-tight">
                          {row.nombres} {row.apellidos}
                        </div>
                        <div className="text-xs text-ink-soft font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="size-3 text-brand-500 shrink-0" />
                          <span>{row.correo}</span>
                        </div>
                      </td>

                      {/* Cédula */}
                      <td className="p-4 text-xs font-mono font-medium text-ink-soft">
                        {row.cedula}
                      </td>

                      {/* Categoría */}
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-clinic-100 text-clinic-800 text-[11px] font-bold">
                          {row.tipo}
                        </span>
                      </td>

                      {/* Turnos y Salones Asignados */}
                      <td className="p-4 max-w-xs">
                        {row.turnosTexto ? (
                          <div
                            className="text-xs text-ink-soft whitespace-normal leading-tight font-medium"
                            title={row.turnosTexto}
                          >
                            {row.turnosTexto}
                          </div>
                        ) : (
                          <span className="text-xs text-ink-mute">-</span>
                        )}
                      </td>

                      {/* Monto */}
                      <td className="p-4 text-right font-bold text-ink">
                        {Number(row.monto) > 0 ? (
                          usd(Number(row.monto))
                        ) : (
                          <span className="text-clinic-700 font-semibold text-xs">Exonerado</span>
                        )}
                      </td>

                      {/* Comprobante bancario */}
                      <td className="p-4 text-center">
                        {row.comprobante ? (
                          <a
                            href={row.comprobante}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 transition"
                          >
                            Ver <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-ink-mute">-</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="p-4 text-center">
                        {row.estado === "Aprobado" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <CheckCircle className="size-3" /> Aprobado
                          </span>
                        ) : row.estado === "Exonerado" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-clinic-700 bg-clinic-50 border border-clinic-200 px-2.5 py-1 rounded-lg">
                            <Check className="size-3" /> Exonerado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            <Clock className="size-3" /> Por Verificar
                          </span>
                        )}
                      </td>

                      {/* Acciones: Aprobar pago y Reenviar Comprobante / QR */}
                      <td className="p-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {row.estado === "Pendiente de verificación" && (
                            <button
                              onClick={() => approvePayment(row.id, row.correo)}
                              className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-emerald-700 transition shadow-sm"
                              title="Aprobar pago y enviar QR"
                            >
                              <Check className="size-3.5" /> Aprobar
                            </button>
                          )}

                          <button
                            onClick={() => handleResendSingle(row)}
                            disabled={isResending}
                            className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-600 text-ink-soft font-semibold px-2.5 py-1.5 rounded-xl text-xs shadow-2xs transition disabled:opacity-50"
                            title="Reenviar comprobante oficial y código QR a este participante"
                          >
                            <Mail
                              className={`size-3.5 text-brand-500 ${isResending ? "animate-spin" : ""}`}
                            />
                            {isResending ? "Enviando..." : "Reenviar QR"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ────────────────── MODAL DE PARTICIPANTES POR SALÓN Y TURNO ────────────────── */}
        {rosterModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10 space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-black text-ink">{rosterModal.salonName}</h3>
                  <p className="text-xs text-ink-soft">
                    {rosterModal.diaLabel} · {rosterModal.turnoLabel} (
                    <b>
                      {rosterModal.occupied} de {rosterModal.capacity} puestos ocupados
                    </b>
                    )
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRosterModal(null);
                    setRosterSearch("");
                  }}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink transition"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Búsqueda dentro del salón */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
                <input
                  type="text"
                  placeholder="Buscar en este salón por nombre, cédula o correo..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Lista con scroll */}
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1">
                {rosterModal.participants
                  .filter((p) => {
                    const s = rosterSearch.toLowerCase();
                    return (
                      !s ||
                      `${p.nombres} ${p.apellidos}`.toLowerCase().includes(s) ||
                      p.cedula.toLowerCase().includes(s) ||
                      p.correo.toLowerCase().includes(s) ||
                      p.tipo.toLowerCase().includes(s)
                    );
                  })
                  .map((p) => (
                    <div
                      key={p.id}
                      className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg transition"
                    >
                      <div>
                        <div className="font-bold text-ink">
                          {p.nombres} {p.apellidos}
                        </div>
                        <div className="text-[11px] text-ink-soft font-mono">
                          {p.cedula} · {p.correo}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                          {p.tipo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            p.estado === "Aprobado"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.estado === "Exonerado"
                                ? "bg-clinic-100 text-clinic-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {p.estado}
                        </span>
                      </div>
                    </div>
                  ))}

                {rosterModal.participants.length === 0 && (
                  <div className="text-center py-8 text-xs text-ink-mute">
                    No hay participantes registrados todavía en este salón y turno.
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setRosterModal(null);
                    setRosterSearch("");
                  }}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-ink transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────── MODAL DE REENVÍO MASIVO ────────────────── */}
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <Send className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-ink">Reenvío Masivo de Comprobantes</h3>
                    <p className="text-xs text-ink-soft">
                      Emisión y reenvío de comprobantes oficiales con código QR
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-ink transition"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-3 pt-2 text-xs sm:text-sm">
                <p className="text-ink-soft">
                  Selecciona a qué grupo de participantes deseas reenviar su comprobante oficial y pase QR por correo electrónico:
                </p>

                <div className="space-y-2 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  {selectedIds.length > 0 && (
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="bulkOption"
                        checked={bulkFilter === "selected"}
                        onChange={() => setBulkFilter("selected")}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-bold text-brand-800">
                        Solo a los seleccionados manualmente ({selectedIds.length} participantes)
                      </span>
                    </label>
                  )}

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkOption"
                      checked={bulkFilter === "all"}
                      onChange={() => setBulkFilter("all")}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>
                      <b>Todos los participantes registrados</b> ({data.length} participantes)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkOption"
                      checked={bulkFilter === "approved_only"}
                      onChange={() => setBulkFilter("approved_only")}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>
                      <b>Solo confirmados</b> (Aprobados y Exonerados: {aprobados + exonerados} participantes)
                    </span>
                  </label>
                </div>

                {mailQuota === 0 && (
                  <div className="rounded-2xl bg-rose-50 p-4 text-xs text-rose-900 border border-rose-300 ring-1 ring-rose-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-rose-700">
                      <AlertTriangle className="size-4 shrink-0 text-rose-600" />
                      <span>Cuota diaria de correos agotada en Google (0 envíos disponibles hoy)</span>
                    </div>
                    <p className="text-rose-800 leading-relaxed">
                      Google impone un límite máximo diario de correos salientes («<i>Servicio solicitado demasiadas veces para un mismo día: email</i>»). Cualquier reenvío en este momento rebotará hasta que <b>Google restablezca automáticamente la cuota en las próximas 24 horas</b>.
                    </p>
                  </div>
                )}

                {typeof mailQuota === "number" && mailQuota > 0 && (
                  <div className="rounded-2xl bg-emerald-50 p-3.5 text-xs text-emerald-900 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-emerald-600 shrink-0" />
                      <span><b>Cuota disponible hoy:</b> ~{mailQuota} correos restantes en Google</span>
                    </div>
                    {mailQuota < data.length && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-white/70 px-2 py-0.5 rounded-md border border-emerald-300">
                        Recomendado: Por selección manual
                      </span>
                    )}
                  </div>
                )}

                <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-900 border border-brand-200 space-y-1">
                  <p className="font-semibold text-brand-950">
                    ℹ️ Información sobre límites de envío de Google:
                  </p>
                  <p className="text-brand-800 leading-relaxed text-[11px]">
                    Las cuentas estándar de Gmail tienen un límite estricto de 100 correos/día, mientras que las cuentas Google Workspace permiten hasta 1.500 correos/día. Para volúmenes altos, se recomienda marcar participantes manualmente y reenviar por lotes.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={bulkSending}
                  onClick={() => setShowBulkModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-ink-soft hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={bulkSending || mailQuota === 0}
                  onClick={handleResendBulk}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-clinic-600 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={mailQuota === 0 ? "Cuota de Google agotada hoy. Espera 24 horas." : "Iniciar reenvío"}
                >
                  {bulkSending ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Procesando reenvío masivo...
                    </>
                  ) : mailQuota === 0 ? (
                    <>
                      <AlertTriangle className="size-4" />
                      Cuota Agotada Hoy (0 envíos)
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Iniciar Reenvío Masivo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  User,
  BookOpen,
  Sparkles,
  ChevronRight,
  PartyPopper,
  GraduationCap,
  X,
  Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos y constantes
// ─────────────────────────────────────────────────────────────────────────────

interface TurnoPreinscrito {
  diaId: string;
  diaLabel: string;
  turno: "manana" | "tarde";
  turnoLabel: string;
  salon: string;
  salonLabel: string;
}

interface ParticipantData {
  nombres: string;
  apellidos: string;
  cedula: string;
  correo?: string;
  telefono?: string;
  tipoParticipante: string;
  tipoLabel?: string;
  turnosPreinscritos: TurnoPreinscrito[];
  yaConfirmado?: boolean;
  confirmacion?: {
    diaId: string;
    diaLabel: string;
    turno: string;
    turnoLabel: string;
    salon: string;
    salonLabel: string;
  };
}

const DIAS_DISPONIBLES = [
  {
    id: "2026-11-02",
    label: "Lunes 02/11/2026",
    shortLabel: "Lun 02/11",
    turnos: [
      { id: "tarde", label: "Tarde (13:00 – 18:00)", shortLabel: "Tarde" },
    ],
  },
  {
    id: "2026-11-03",
    label: "Martes 03/11/2026",
    shortLabel: "Mar 03/11",
    turnos: [
      { id: "manana", label: "Mañana (08:00 – 12:45)", shortLabel: "Mañana" },
      { id: "tarde", label: "Tarde (13:00 – 18:00)", shortLabel: "Tarde" },
    ],
  },
  {
    id: "2026-11-04",
    label: "Miércoles 04/11/2026",
    shortLabel: "Mié 04/11",
    turnos: [
      { id: "manana", label: "Mañana (08:00 – 12:45)", shortLabel: "Mañana" },
      { id: "tarde", label: "Tarde (13:00 – 18:00)", shortLabel: "Tarde" },
    ],
  },
  {
    id: "2026-11-05",
    label: "Jueves 05/11/2026",
    shortLabel: "Jue 05/11",
    turnos: [
      { id: "manana", label: "Mañana (08:00 – 12:45)", shortLabel: "Mañana" },
      { id: "tarde", label: "Tarde (13:00 – 18:00)", shortLabel: "Tarde" },
    ],
  },
  {
    id: "2026-11-06",
    label: "Viernes 06/11/2026",
    shortLabel: "Vie 06/11",
    turnos: [
      { id: "manana", label: "Mañana (08:00 – 12:45)", shortLabel: "Mañana" },
      { id: "tarde", label: "Tarde (13:00 – 18:00)", shortLabel: "Tarde" },
    ],
  },
] as const;

const SALONES = [
  { id: "principal", label: "Salón Principal (1)", shortLabel: "Salón (1)" },
  { id: "alterno", label: "Salón Alterno (2)", shortLabel: "Salón (2)" },
] as const;

type DiaId = (typeof DIAS_DISPONIBLES)[number]["id"];
type TurnoId = "manana" | "tarde";
type SalonId = "principal" | "alterno";

type Step = "cedula" | "datos" | "seleccion" | "confirmado";

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function ConfirmacionBachilleresPage() {
  // ── Estado general ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("cedula");
  const [nacionalidad, setNacionalidad] = useState<"V" | "E">("V");
  const [cedulaInput, setCedulaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ParticipantData | null>(null);

  // ── Selección definitiva ────────────────────────────────────────────────────
  const [selectedDia, setSelectedDia] = useState<DiaId | null>(null);
  const [selectedTurno, setSelectedTurno] = useState<TurnoId | null>(null);
  const [selectedSalon, setSelectedSalon] = useState<SalonId | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Paso 1 — Búsqueda por cédula con interpretación flexible
  // ─────────────────────────────────────────────────────────────────────────
  const handleCedulaChange = (raw: string) => {
    let text = raw.trim().toUpperCase();
    if (text.startsWith("E-") || text.startsWith("E")) {
      setNacionalidad("E");
      text = text.replace(/^E-?/, "");
    } else if (text.startsWith("V-") || text.startsWith("V")) {
      setNacionalidad("V");
      text = text.replace(/^V-?/, "");
    }
    const digits = text.replace(/\D/g, "");
    setCedulaInput(digits);
    setError(null);
  };

  const handleBuscar = useCallback(async () => {
    const digits = cedulaInput.replace(/\D/g, "");
    if (digits.length < 5) {
      setError("Ingresa un número de cédula válido (mínimo 5 dígitos).");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const fullCedula = `${nacionalidad}-${digits}`;
      const res = await fetch(
        `/api/confirmacion-bachilleres?cedula=${encodeURIComponent(fullCedula)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!data.ok || !data.participant) {
        setError(
          data.error ??
            `No se encontró un participante con la cédula ${fullCedula} (o ${digits}) en la lista de Bachilleres / Estudiantes de Pregrado. Verifica el número o comunícate con el equipo organizador.`
        );
        setLoading(false);
        return;
      }
      setParticipant(data.participant);
      setStep("datos");
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [cedulaInput, nacionalidad]);

  // ─────────────────────────────────────────────────────────────────────────
  // Paso 3 — Confirmar selección definitiva
  // ─────────────────────────────────────────────────────────────────────────
  const handleConfirmar = useCallback(async () => {
    if (!participant || !selectedDia || !selectedTurno || !selectedSalon) {
      setError("Debes seleccionar un día, un turno y un salón antes de confirmar.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/confirmacion-bachilleres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cedula: participant.cedula || `${nacionalidad}-${cedulaInput}`,
          diaId: selectedDia,
          turno: selectedTurno,
          salon: selectedSalon,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo confirmar la inscripción. Intenta nuevamente.");
        setSubmitting(false);
        return;
      }
      setStep("confirmado");
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta nuevamente.");
      setSubmitting(false);
    }
  }, [participant, selectedDia, selectedTurno, selectedSalon, nacionalidad, cedulaInput]);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers de visualización
  // ─────────────────────────────────────────────────────────────────────────
  const getDiaInfo = (id: DiaId) =>
    DIAS_DISPONIBLES.find((d) => d.id === id);
  const getTurnoLabel = (t: TurnoId) =>
    t === "manana" ? "Mañana (08:00 – 12:45)" : "Tarde (13:00 – 18:00)";
  const getSalonLabel = (s: SalonId) =>
    s === "principal" ? "Salón Principal (1)" : "Salón Alterno (2)";

  // Siempre se muestran todos los días disponibles para que puedan seleccionar libremente
  const diasAMostrar = DIAS_DISPONIBLES;

  // ─────────────────────────────────────────────────────────────────────────
  // Render por pasos
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/20 to-clinic-50/30 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-congreso-pineda.png"
            alt="XIV Congreso Pineda"
            className="h-9 w-auto"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
              XIV Congreso Pineda 2026
            </p>
            <h1 className="text-sm font-black text-ink leading-tight truncate">
              Confirmación de Inscripción — Bachilleres
            </h1>
          </div>
        </div>
      </header>

      {/* ── Indicador de Pasos ── */}
      <div className="bg-white/60 border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3">
          <ol className="flex items-center gap-2 text-xs overflow-x-auto">
            {[
              { key: "cedula", label: "Cédula", icon: Search },
              { key: "datos", label: "Mis Datos", icon: User },
              { key: "seleccion", label: "Mi Turno", icon: Calendar },
              { key: "confirmado", label: "Listo", icon: CheckCircle2 },
            ].map(({ key, label, icon: Icon }, i, arr) => {
              const isActive = step === key;
              const isDone =
                ["cedula", "datos", "seleccion", "confirmado"].indexOf(step) >
                ["cedula", "datos", "seleccion", "confirmado"].indexOf(key);
              return (
                <li key={key} className="flex items-center gap-2 shrink-0">
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition ${
                      isActive
                        ? "bg-brand-600 text-white shadow-md"
                        : isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <Icon className="size-3" />
                    <span>{label}</span>
                  </span>
                  {i < arr.length - 1 && (
                    <ChevronRight className="size-3 text-slate-300 shrink-0" />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ── Contenido Principal ── */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        {/* ═══════════════════════════════════════════════════════════════════
            PASO 1 — Ingreso de Cédula
        ════════════════════════════════════════════════════════════════════ */}
        {step === "cedula" && (
          <div className="mx-auto max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-brand-600 to-clinic-600 text-white shadow-lg mb-4">
                <GraduationCap className="size-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-ink">
                Confirmación de Inscripción
              </h2>
              <p className="mt-2 text-sm text-ink-soft max-w-sm mx-auto leading-relaxed">
                Este formulario es exclusivo para participantes de tipo{" "}
                <strong>Bachiller</strong> y{" "}
                <strong>Bachiller / Estudiante de Pregrado</strong>. Ingresa tu
                número de cédula para continuar.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
              <label
                htmlFor="cedula"
                className="block text-sm font-bold text-ink mb-2"
              >
                Número de Cédula de Identidad
              </label>
              <div className="flex gap-2 sm:gap-3">
                {/* Selector Nacionalidad V / E */}
                <select
                  value={nacionalidad}
                  onChange={(e) => {
                    setNacionalidad(e.target.value as "V" | "E");
                    setError(null);
                  }}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer shrink-0"
                  aria-label="Nacionalidad"
                >
                  <option value="V">V-</option>
                  <option value="E">E-</option>
                </select>

                <div className="relative flex-1">
                  <input
                    id="cedula"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej. 31930086 o V-31930086"
                    value={cedulaInput}
                    onChange={(e) => handleCedulaChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                    maxLength={14}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-mono font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleBuscar}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-700 active:scale-95 transition disabled:opacity-60 shrink-0"
                >
                  {loading ? (
                    <span className="inline-block size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  <span>{loading ? "Buscando…" : "Buscar"}</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-6 rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 text-xs text-amber-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Info className="size-3.5" />
                  <span>Información Importante</span>
                </div>
                <p>
                  Solo pueden usar este formulario quienes ya se pre-inscribieron
                  como <strong>Bachiller</strong> o{" "}
                  <strong>Bachiller / Estudiante de Pregrado</strong> en el XIV
                  Congreso Pineda 2026.
                </p>
                <p>
                  Si no apareces en el sistema, comunícate con el equipo
                  organizador del congreso.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PASO 2 — Confirmación de Datos del Participante
        ════════════════════════════════════════════════════════════════════ */}
        {step === "datos" && participant && (
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-ink">
                ¡Hola, {participant.nombres.split(" ")[0]}!
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Verifica que tus datos sean correctos antes de continuar.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
              {/* Datos personales */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-brand-100 text-brand-700">
                    <User className="size-4" />
                  </div>
                  <h3 className="text-base font-bold text-ink">
                    Datos del Participante
                  </h3>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Nombres", value: participant.nombres },
                    { label: "Apellidos", value: participant.apellidos },
                    { label: "Cédula", value: participant.cedula },
                    {
                      label: "Tipo",
                      value: participant.tipoLabel ?? participant.tipoParticipante,
                    },
                    ...(participant.correo
                      ? [{ label: "Correo", value: participant.correo }]
                      : []),
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl bg-slate-50 p-3 border border-slate-100"
                    >
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-ink break-all">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Turnos pre-inscritos */}
              {participant.turnosPreinscritos &&
                participant.turnosPreinscritos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                        <BookOpen className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-ink">
                          Días y Turnos Pre-inscritos
                        </h3>
                        <p className="text-xs text-ink-mute">
                          Tienes{" "}
                          {participant.turnosPreinscritos.length === 1
                            ? "1 turno pre-inscrito"
                            : `${participant.turnosPreinscritos.length} turnos pre-inscritos`}
                          . Deberás elegir solo uno definitivo.
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {participant.turnosPreinscritos.map((t, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm"
                        >
                          <Calendar className="size-4 text-amber-600 shrink-0" />
                          <span className="font-semibold text-ink">
                            {t.diaLabel}
                          </span>
                          <span className="text-ink-soft">·</span>
                          <span className="text-ink-soft">{t.turnoLabel}</span>
                          {t.salonLabel && (
                            <>
                              <span className="text-ink-soft">·</span>
                              <span className="text-ink-soft">{t.salonLabel}</span>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Alerta si ya estaba confirmado */}
              {participant.yaConfirmado && participant.confirmacion && (
                <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">Ya tienes una confirmación registrada</p>
                    <p>
                      <strong>{participant.confirmacion.diaLabel}</strong> ·{" "}
                      {participant.confirmacion.turnoLabel} ·{" "}
                      {participant.confirmacion.salonLabel}
                    </p>
                    <p className="mt-2 text-xs text-emerald-700">
                      Si deseas cambiarla, puedes continuar y seleccionar una nueva
                      opción. La selección anterior será reemplazada.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("cedula");
                    setParticipant(null);
                    setError(null);
                  }}
                  className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-ink-soft hover:bg-slate-50 transition"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => setStep("seleccion")}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-700 transition"
                >
                  <span>Seleccionar mi Turno</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PASO 3 — Selección definitiva de Día, Turno y Salón
        ════════════════════════════════════════════════════════════════════ */}
        {step === "seleccion" && participant && (
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-ink">
                Elige tu Turno Definitivo
              </h2>
              <p className="mt-1 text-sm text-ink-soft max-w-md mx-auto">
                Selecciona <strong>1 día</strong>, <strong>1 turno</strong> y{" "}
                <strong>1 salón</strong>. Esta será tu inscripción definitiva e
                irrevocable en el congreso.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-8">
              {/* ── Selector de Día ── */}
              <fieldset>
                <legend className="flex items-center gap-2 text-sm font-bold text-ink mb-3">
                  <Calendar className="size-4 text-brand-600" />
                  Paso 1 — Selecciona el día
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {diasAMostrar.map((dia) => {
                    const isSelected = selectedDia === dia.id;
                    const isPreinscrito = participant.turnosPreinscritos?.some(
                      (t) => t.diaId === dia.id
                    );
                    return (
                      <button
                        key={dia.id}
                        type="button"
                        onClick={() => {
                          setSelectedDia(dia.id);
                          setSelectedTurno(null);
                          setSelectedSalon(null);
                          setError(null);
                        }}
                        className={`rounded-2xl p-3.5 text-left transition border text-sm font-bold relative ${
                          isSelected
                            ? "bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-400/50"
                            : "bg-slate-50 text-ink border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="block text-base">{dia.shortLabel}</span>
                          {isPreinscrito && (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${
                                isSelected
                                  ? "bg-amber-300 text-slate-900"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              Pre-inscrito
                            </span>
                          )}
                        </div>
                        <span
                          className={`block text-[11px] font-normal mt-0.5 ${
                            isSelected ? "text-brand-100" : "text-ink-mute"
                          }`}
                        >
                          {dia.turnos.map((t) => t.shortLabel).join(" / ")}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="size-4 mt-1.5 text-brand-200" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* ── Selector de Turno ── */}
              {selectedDia && (
                <fieldset>
                  <legend className="flex items-center gap-2 text-sm font-bold text-ink mb-3">
                    <Clock className="size-4 text-brand-600" />
                    Paso 2 — Selecciona el turno
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {diasAMostrar
                      .find((d) => d.id === selectedDia)
                      ?.turnos.map((turno) => {
                        const isSelected = selectedTurno === turno.id;
                        return (
                          <button
                            key={turno.id}
                            type="button"
                            onClick={() => {
                              setSelectedTurno(turno.id as TurnoId);
                              setSelectedSalon(null);
                              setError(null);
                            }}
                            className={`rounded-2xl p-4 text-left transition border ${
                              isSelected
                                ? "bg-clinic-600 text-white border-clinic-600 shadow-md ring-2 ring-clinic-400/50"
                                : "bg-slate-50 text-ink border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold">
                                {turno.label}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="size-5 text-clinic-200 shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </fieldset>
              )}

              {/* ── Selector de Salón ── */}
              {selectedTurno && (
                <fieldset>
                  <legend className="flex items-center gap-2 text-sm font-bold text-ink mb-3">
                    <MapPin className="size-4 text-brand-600" />
                    Paso 3 — Selecciona el salón
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SALONES.map((salon) => {
                      const isSelected = selectedSalon === salon.id;
                      return (
                        <button
                          key={salon.id}
                          type="button"
                          onClick={() => {
                            setSelectedSalon(salon.id as SalonId);
                            setError(null);
                          }}
                          className={`rounded-2xl p-4 text-left transition border ${
                            isSelected
                              ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-400/50"
                              : "bg-slate-50 text-ink border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="block text-sm font-bold">
                                {salon.label}
                              </span>
                              <span
                                className={`block text-xs font-normal mt-0.5 ${
                                  isSelected ? "text-amber-900" : "text-ink-mute"
                                }`}
                              >
                                {salon.id === "principal"
                                  ? "Capacidad: 240 personas"
                                  : "Capacidad: 60 personas"}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="size-5 text-amber-900 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* ── Resumen de la selección ── */}
              {selectedDia && selectedTurno && selectedSalon && (
                <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-clinic-50 border border-brand-200/80 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-brand-800">
                    <Sparkles className="size-4 text-brand-600" />
                    <span>Resumen de tu selección</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="rounded-xl bg-white/80 p-2.5 border border-brand-100">
                      <Calendar className="size-4 mx-auto text-brand-600 mb-1" />
                      <span className="block font-bold text-ink">
                        {getDiaInfo(selectedDia)?.shortLabel}
                      </span>
                      <span className="text-ink-mute">Día</span>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2.5 border border-brand-100">
                      <Clock className="size-4 mx-auto text-clinic-600 mb-1" />
                      <span className="block font-bold text-ink">
                        {selectedTurno === "manana" ? "Mañana" : "Tarde"}
                      </span>
                      <span className="text-ink-mute">Turno</span>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2.5 border border-brand-100">
                      <MapPin className="size-4 mx-auto text-amber-600 mb-1" />
                      <span className="block font-bold text-ink">
                        {getSalonLabel(selectedSalon).replace("Salón ", "")}
                      </span>
                      <span className="text-ink-mute">Salón</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep("datos");
                    setError(null);
                  }}
                  className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-ink-soft hover:bg-slate-50 transition"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={
                    submitting ||
                    !selectedDia ||
                    !selectedTurno ||
                    !selectedSalon
                  }
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Confirmando…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>Confirmar Inscripción</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-[11px] text-ink-mute leading-relaxed">
                Al confirmar, aceptas que esta selección es <strong>definitiva e irrevocable</strong>. Si tienes
                alguna duda, comunícate con el equipo organizador antes de confirmar.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PASO 4 — Confirmación Exitosa / Mensaje de Agradecimiento
        ════════════════════════════════════════════════════════════════════ */}
        {step === "confirmado" && participant && (
          <div className="mx-auto max-w-lg text-center">
            {/* Ícono animado de éxito */}
            <div className="relative inline-flex mb-6">
              <div className="absolute -inset-4 rounded-full bg-emerald-400/20 blur-xl animate-pulse" />
              <div className="relative flex items-center justify-center size-24 rounded-full bg-gradient-to-br from-emerald-400 to-clinic-500 shadow-2xl">
                <PartyPopper className="size-12 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-black text-ink leading-tight">
              ¡Inscripción Confirmada!
            </h2>
            <p className="mt-2 text-lg font-semibold text-ink-soft">
              {participant.nombres} {participant.apellidos}
            </p>

            {/* Tarjeta de resumen */}
            <div className="mt-8 bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 text-left space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <span>Tu turno definitivo ha sido registrado exitosamente</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-brand-50 border border-brand-100 p-4">
                  <Calendar className="size-6 mx-auto text-brand-600 mb-2" />
                  <span className="block text-sm font-black text-ink">
                    {getDiaInfo(selectedDia!)?.shortLabel ?? selectedDia}
                  </span>
                  <span className="block text-[11px] text-ink-mute mt-0.5">
                    Día
                  </span>
                </div>
                <div className="rounded-2xl bg-clinic-50 border border-clinic-100 p-4">
                  <Clock className="size-6 mx-auto text-clinic-600 mb-2" />
                  <span className="block text-sm font-black text-ink">
                    {selectedTurno === "manana" ? "Mañana" : "Tarde"}
                  </span>
                  <span className="block text-[11px] text-ink-mute mt-0.5">
                    Turno
                  </span>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                  <MapPin className="size-6 mx-auto text-amber-600 mb-2" />
                  <span className="block text-sm font-black text-ink">
                    {getSalonLabel(selectedSalon!).replace("Salón ", "")}
                  </span>
                  <span className="block text-[11px] text-ink-mute mt-0.5">
                    Salón
                  </span>
                </div>
              </div>

              {/* Mensaje de agradecimiento */}
              <div className="rounded-2xl bg-gradient-to-br from-brand-50/70 via-white to-clinic-50/50 border border-brand-100/80 p-5 space-y-3">
                <div className="flex items-center gap-2 text-brand-800 font-bold text-sm">
                  <Sparkles className="size-4 text-brand-600" />
                  <span>¡Gracias por tu participación!</span>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">
                  En nombre del Comité Organizador del{" "}
                  <strong>XIV Congreso Pineda 2026</strong>, queremos expresarte
                  nuestro más sincero agradecimiento por tu interés y tu
                  entusiasmo por participar en este importante evento académico y
                  científico.
                </p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Tu presencia como <strong>Bachiller</strong> enriquece el
                  espacio del conocimiento y demuestra la vocación médica que
                  caracteriza a los futuros profesionales de la salud de nuestra
                  región. Esperamos que este congreso sea una experiencia
                  transformadora y memorable en tu formación.
                </p>
                <p className="text-sm font-semibold text-brand-700">
                  ¡Te esperamos en el Hotel Biotel Suites, Barquisimeto!
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-ink-soft space-y-1.5">
                <p className="font-bold text-slate-600">📋 Recuerda:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>
                    Lleva contigo tu cédula de identidad el día del evento.
                  </li>
                  <li>
                    Preséntate con al menos <strong>15 minutos de anticipación</strong> al salón seleccionado.
                  </li>
                  <li>
                    Tu acreditación será procesada en la entrada del congreso.
                  </li>
                  <li>
                    Ante cualquier consulta, acércate al stand de inscripciones.
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep("cedula");
                setParticipant(null);
                setCedulaInput("");
                setSelectedDia(null);
                setSelectedTurno(null);
                setSelectedSalon(null);
                setError(null);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-ink-soft hover:bg-slate-50 transition"
            >
              <X className="size-4" />
              Cerrar o registrar otro participante
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/80 bg-white/60 mt-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            © 2026 XIV Congreso Pineda · HCUAMP · Todos los derechos reservados
          </span>
          <span>
            Formulario exclusivo para Bachilleres y Estudiantes de Pregrado
          </span>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Info, Users, Clock, AlertTriangle, X, ShieldAlert } from "lucide-react";
import { DAYS_CONGRESO, CAPACIDADES_SALON } from "@/data/pricing";
import type { SalonId, SeleccionTurnos, TurnosPorDia } from "@/types/registration";

interface Props {
  value: SeleccionTurnos;
  onChange: (value: SeleccionTurnos) => void;
  capacities?: Record<string, number>;
  error?: string;
}

interface FullAlertState {
  diaLabel: string;
  turnoLabel: string;
  salonName: string;
  capacity: number;
  occupied: number;
}

export function TurnosSalonPicker({ value, onChange, capacities = {}, error }: Props) {
  const [fullAlert, setFullAlert] = useState<FullAlertState | null>(null);

  const setTurno = (diaId: string, turnoKey: "manana" | "tarde", salon: SalonId | "") => {
    const curDia: TurnosPorDia = value[diaId] || {};
    const newDia: TurnosPorDia = {
      ...curDia,
      [turnoKey]: salon ? salon : undefined,
    };

    // Si ya no tiene ni mañana ni tarde, lo dejamos limpio
    const next = { ...value };
    if (!newDia.manana && !newDia.tarde) {
      delete next[diaId];
    } else {
      next[diaId] = newDia;
    }
    onChange(next);
  };

  const getOccupied = (diaId: string, turnoKey: "manana" | "tarde", salon: SalonId) => {
    const key = `${diaId}_${turnoKey}_${salon}`;
    return capacities[key] || 0;
  };

  const handleSalonClick = (
    dia: (typeof DAYS_CONGRESO)[number],
    turnoKey: "manana" | "tarde",
    salon: SalonId
  ) => {
    const occ = getOccupied(dia.id, turnoKey, salon);
    const cap = CAPACIDADES_SALON[salon];
    const isFull = occ >= cap;
    const isSelected = value[dia.id]?.[turnoKey] === salon;

    // Si está lleno y el usuario intenta seleccionarlo, se bloquea y se emite la advertencia inmediata
    if (isFull && !isSelected) {
      const turnoLabel =
        turnoKey === "manana" ? "Mañana (08:00 a 12:45)" : "Tarde (13:00 a 18:00)";
      const salonName =
        salon === "principal" ? "Salón Principal (1)" : "Salón Alterno (2)";

      setFullAlert({
        diaLabel: dia.dateLabel,
        turnoLabel,
        salonName,
        capacity: cap,
        occupied: occ,
      });
      return;
    }

    // Si ya estaba seleccionado, lo deselecciona; si no, lo asigna
    setTurno(dia.id, turnoKey, isSelected ? "" : salon);
  };

  const countActiveDays = Object.values(value).filter((d) => d.manana || d.tarde).length;

  return (
    <fieldset className="space-y-4" aria-describedby={error ? "turnos-error" : undefined}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <legend className="text-sm font-bold text-ink">
          Días, Turnos y Salones de Asistencia<span className="ml-0.5 text-brand-500">*</span>
        </legend>
        <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full self-start sm:self-auto ring-1 ring-brand-200">
          {countActiveDays} {countActiveDays === 1 ? "día seleccionado" : "días seleccionados"}
        </span>
      </div>

      {/* Alerta Preventiva sobre Aforo y Transferencias */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/90 p-3.5 text-xs text-amber-950 ring-1 ring-amber-200/80 shadow-sm">
        <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" aria-hidden />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">
            Aviso importante sobre control de aforo y pagos:
          </p>
          <p className="text-amber-800 leading-relaxed">
            Los cupos se validan en tiempo real. Si un salón indica <b>&quot;Cupos Completos&quot;</b>, está agotado y no admite nuevas reservas. <b>NO realices transferencias ni depósitos bancarios para turnos agotados</b>, ya que no se podrán emitir credenciales de acceso para horarios sin disponibilidad física.
          </p>
        </div>
      </div>

      {/* Info de aforo de salones */}
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 p-2.5 text-blue-900 ring-1 ring-blue-100">
          <Users className="size-4 shrink-0 text-blue-600" aria-hidden />
          <span>
            <b>Salón Principal (1):</b> Capacidad máxima de <b>{CAPACIDADES_SALON.principal} puestos</b> por turno.
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/70 p-2.5 text-emerald-900 ring-1 ring-emerald-100">
          <Users className="size-4 shrink-0 text-emerald-600" aria-hidden />
          <span>
            <b>Salón Alterno (2):</b> Capacidad máxima de <b>{CAPACIDADES_SALON.alterno} puestos</b> por turno.
          </span>
        </div>
      </div>

      {/* Lista interactiva de los 5 días */}
      <div className="space-y-3">
        {DAYS_CONGRESO.map((dia) => {
          const diaState = value[dia.id] || {};
          const isDiaActive = !!(diaState.manana || diaState.tarde);

          // Cálculos para Turno Mañana
          const occMananaPrinc = getOccupied(dia.id, "manana", "principal");
          const occMananaAlt = getOccupied(dia.id, "manana", "alterno");
          const fullMananaPrinc = occMananaPrinc >= CAPACIDADES_SALON.principal;
          const fullMananaAlt = occMananaAlt >= CAPACIDADES_SALON.alterno;
          const remMananaPrinc = Math.max(0, CAPACIDADES_SALON.principal - occMananaPrinc);
          const remMananaAlt = Math.max(0, CAPACIDADES_SALON.alterno - occMananaAlt);
          const selMananaPrinc = diaState.manana === "principal";
          const selMananaAlt = diaState.manana === "alterno";

          // Cálculos para Turno Tarde
          const occTardePrinc = getOccupied(dia.id, "tarde", "principal");
          const occTardeAlt = getOccupied(dia.id, "tarde", "alterno");
          const fullTardePrinc = occTardePrinc >= CAPACIDADES_SALON.principal;
          const fullTardeAlt = occTardeAlt >= CAPACIDADES_SALON.alterno;
          const remTardePrinc = Math.max(0, CAPACIDADES_SALON.principal - occTardePrinc);
          const remTardeAlt = Math.max(0, CAPACIDADES_SALON.alterno - occTardeAlt);
          const selTardePrinc = diaState.tarde === "principal";
          const selTardeAlt = diaState.tarde === "alterno";

          return (
            <div
              key={dia.id}
              className={`rounded-2xl p-4 transition-all ${
                isDiaActive
                  ? "bg-gradient-to-br from-white to-brand-50/40 ring-2 ring-brand-500/50 shadow-sm"
                  : "bg-white/60 ring-1 ring-black/5 hover:bg-white/90"
              }`}
            >
              <div className="flex items-center justify-between border-b border-black/5 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex size-7 items-center justify-center rounded-lg text-xs font-bold ${
                      isDiaActive
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {dia.day}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{dia.dateLabel}</h4>
                    <p className="text-[11px] text-ink-mute">Elige tu turno y salón de asistencia</p>
                  </div>
                </div>

                {isDiaActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-clinic-100 px-2.5 py-0.5 text-xs font-semibold text-clinic-700">
                    <Check className="size-3" strokeWidth={3} />
                    Asistiendo
                  </span>
                ) : (
                  <span className="text-xs text-ink-mute">Sin turnos seleccionados</span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* ────────────────── Turno Mañana (08:00 a 12:45) ────────────────── */}
                <div className="space-y-2 rounded-xl bg-slate-50/70 p-3 ring-1 ring-black/5">
                  <div className="flex items-center justify-between text-xs font-bold text-ink">
                    <span className="flex items-center gap-1.5 text-brand-800">
                      <Clock className="size-3.5 text-brand-600" />
                      Turno Mañana
                    </span>
                    <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md ring-1 ring-brand-200">
                      08:00 a 12:45
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Salón Principal (1) */}
                    <button
                      type="button"
                      onClick={() => handleSalonClick(dia, "manana", "principal")}
                      className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition text-center ${
                        selMananaPrinc
                          ? "bg-brand-600 text-white shadow-md font-bold ring-2 ring-brand-700"
                          : fullMananaPrinc
                            ? "bg-red-50/90 text-red-900 border-2 border-red-300 hover:bg-red-100 hover:border-red-400 cursor-pointer shadow-xs"
                            : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50 hover:text-ink shadow-xs"
                      }`}
                    >
                      <span className={`font-semibold ${selMananaPrinc ? "text-white" : fullMananaPrinc ? "text-red-950 font-bold" : "text-ink"}`}>
                        Salón Principal (1)
                      </span>

                      {selMananaPrinc ? (
                        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-blue-100 font-bold">
                          <Check className="size-3" strokeWidth={3} /> Seleccionado ({remMananaPrinc} libres)
                        </span>
                      ) : fullMananaPrinc ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                            <AlertTriangle className="size-2.5" /> Cupos Completos
                          </span>
                          <span className="text-[9px] font-bold text-red-600 mt-0.5">
                            0 libres · Toca p/ info
                          </span>
                        </div>
                      ) : remMananaPrinc <= 20 ? (
                        <span className="mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full ring-1 ring-amber-200">
                          ¡Últimos {remMananaPrinc} cupos!
                        </span>
                      ) : (
                        <span className="mt-1 text-[10px] text-ink-mute">
                          {remMananaPrinc} cupos libres
                        </span>
                      )}
                    </button>

                    {/* Salón Alterno (2) */}
                    <button
                      type="button"
                      onClick={() => handleSalonClick(dia, "manana", "alterno")}
                      className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition text-center ${
                        selMananaAlt
                          ? "bg-clinic-600 text-white shadow-md font-bold ring-2 ring-clinic-700"
                          : fullMananaAlt
                            ? "bg-red-50/90 text-red-900 border-2 border-red-300 hover:bg-red-100 hover:border-red-400 cursor-pointer shadow-xs"
                            : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50 hover:text-ink shadow-xs"
                      }`}
                    >
                      <span className={`font-semibold ${selMananaAlt ? "text-white" : fullMananaAlt ? "text-red-950 font-bold" : "text-ink"}`}>
                        Salón Alterno (2)
                      </span>

                      {selMananaAlt ? (
                        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-emerald-100 font-bold">
                          <Check className="size-3" strokeWidth={3} /> Seleccionado ({remMananaAlt} libres)
                        </span>
                      ) : fullMananaAlt ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                            <AlertTriangle className="size-2.5" /> Cupos Completos
                          </span>
                          <span className="text-[9px] font-bold text-red-600 mt-0.5">
                            0 libres · Toca p/ info
                          </span>
                        </div>
                      ) : remMananaAlt <= 10 ? (
                        <span className="mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full ring-1 ring-amber-200">
                          ¡Últimos {remMananaAlt} cupos!
                        </span>
                      ) : (
                        <span className="mt-1 text-[10px] text-ink-mute">
                          {remMananaAlt} cupos libres
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Aviso contextual si algún salón está agotado */}
                  {(fullMananaPrinc || fullMananaAlt) && (
                    <div className="rounded-lg bg-red-50/70 p-1.5 text-[10px] font-semibold text-red-800 border border-red-200/80 flex items-center gap-1">
                      <AlertTriangle className="size-3 text-red-600 shrink-0" />
                      <span>
                        {fullMananaPrinc && fullMananaAlt
                          ? "Cupos agotados en ambos salones para la mañana. No deposites para este turno."
                          : fullMananaPrinc
                            ? "Salón Principal agotado en la mañana. No deposites para este salón."
                            : "Salón Alterno agotado en la mañana. No deposites para este salón."}
                      </span>
                    </div>
                  )}

                  {diaState.manana && (
                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={() => setTurno(dia.id, "manana", "")}
                        className="text-[10px] font-semibold text-ink-mute underline hover:text-red-600 transition"
                      >
                        Quitar selección de mañana
                      </button>
                    </div>
                  )}
                </div>

                {/* ────────────────── Turno Tarde (13:00 a 18:00) ────────────────── */}
                <div className="space-y-2 rounded-xl bg-slate-50/70 p-3 ring-1 ring-black/5">
                  <div className="flex items-center justify-between text-xs font-bold text-ink">
                    <span className="flex items-center gap-1.5 text-clinic-800">
                      <Clock className="size-3.5 text-clinic-600" />
                      Turno Tarde
                    </span>
                    <span className="text-[10px] font-semibold text-clinic-700 bg-clinic-50 px-2 py-0.5 rounded-md ring-1 ring-clinic-200">
                      13:00 a 18:00
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Salón Principal (1) */}
                    <button
                      type="button"
                      onClick={() => handleSalonClick(dia, "tarde", "principal")}
                      className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition text-center ${
                        selTardePrinc
                          ? "bg-brand-600 text-white shadow-md font-bold ring-2 ring-brand-700"
                          : fullTardePrinc
                            ? "bg-red-50/90 text-red-900 border-2 border-red-300 hover:bg-red-100 hover:border-red-400 cursor-pointer shadow-xs"
                            : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50 hover:text-ink shadow-xs"
                      }`}
                    >
                      <span className={`font-semibold ${selTardePrinc ? "text-white" : fullTardePrinc ? "text-red-950 font-bold" : "text-ink"}`}>
                        Salón Principal (1)
                      </span>

                      {selTardePrinc ? (
                        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-blue-100 font-bold">
                          <Check className="size-3" strokeWidth={3} /> Seleccionado ({remTardePrinc} libres)
                        </span>
                      ) : fullTardePrinc ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                            <AlertTriangle className="size-2.5" /> Cupos Completos
                          </span>
                          <span className="text-[9px] font-bold text-red-600 mt-0.5">
                            0 libres · Toca p/ info
                          </span>
                        </div>
                      ) : remTardePrinc <= 20 ? (
                        <span className="mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full ring-1 ring-amber-200">
                          ¡Últimos {remTardePrinc} cupos!
                        </span>
                      ) : (
                        <span className="mt-1 text-[10px] text-ink-mute">
                          {remTardePrinc} cupos libres
                        </span>
                      )}
                    </button>

                    {/* Salón Alterno (2) */}
                    <button
                      type="button"
                      onClick={() => handleSalonClick(dia, "tarde", "alterno")}
                      className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition text-center ${
                        selTardeAlt
                          ? "bg-clinic-600 text-white shadow-md font-bold ring-2 ring-clinic-700"
                          : fullTardeAlt
                            ? "bg-red-50/90 text-red-900 border-2 border-red-300 hover:bg-red-100 hover:border-red-400 cursor-pointer shadow-xs"
                            : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50 hover:text-ink shadow-xs"
                      }`}
                    >
                      <span className={`font-semibold ${selTardeAlt ? "text-white" : fullTardeAlt ? "text-red-950 font-bold" : "text-ink"}`}>
                        Salón Alterno (2)
                      </span>

                      {selTardeAlt ? (
                        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-emerald-100 font-bold">
                          <Check className="size-3" strokeWidth={3} /> Seleccionado ({remTardeAlt} libres)
                        </span>
                      ) : fullTardeAlt ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                            <AlertTriangle className="size-2.5" /> Cupos Completos
                          </span>
                          <span className="text-[9px] font-bold text-red-600 mt-0.5">
                            0 libres · Toca p/ info
                          </span>
                        </div>
                      ) : remTardeAlt <= 10 ? (
                        <span className="mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full ring-1 ring-amber-200">
                          ¡Últimos {remTardeAlt} cupos!
                        </span>
                      ) : (
                        <span className="mt-1 text-[10px] text-ink-mute">
                          {remTardeAlt} cupos libres
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Aviso contextual si algún salón está agotado */}
                  {(fullTardePrinc || fullTardeAlt) && (
                    <div className="rounded-lg bg-red-50/70 p-1.5 text-[10px] font-semibold text-red-800 border border-red-200/80 flex items-center gap-1">
                      <AlertTriangle className="size-3 text-red-600 shrink-0" />
                      <span>
                        {fullTardePrinc && fullTardeAlt
                          ? "Cupos agotados en ambos salones para la tarde. No deposites para este turno."
                          : fullTardePrinc
                            ? "Salón Principal agotado en la tarde. No deposites para este salón."
                            : "Salón Alterno agotado en la tarde. No deposites para este salón."}
                      </span>
                    </div>
                  )}

                  {diaState.tarde && (
                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={() => setTurno(dia.id, "tarde", "")}
                        className="text-[10px] font-semibold text-ink-mute underline hover:text-red-600 transition"
                      >
                        Quitar selección de tarde
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="flex items-start gap-1.5 text-xs text-ink-mute leading-relaxed">
        <Info className="size-3.5 shrink-0 mt-0.5 text-brand-600" aria-hidden />
        <span>
          En un mismo turno solo es posible registrarse en un salón. Puedes asistir tanto en la mañana como en la tarde; la tarifa se calcula por día asistido.
        </span>
      </p>

      {error && (
        <p id="turnos-error" role="alert" className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
          {error}
        </p>
      )}

      {/* ────────────────── MODAL DE ALERTA INMEDIATA: CUPOS COMPLETOS ────────────────── */}
      {fullAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cupos-title"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header del Modal con Icono */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-4 ring-red-50">
                  <ShieldAlert className="size-6" />
                </div>
                <div>
                  <h3 id="modal-cupos-title" className="text-lg font-black text-red-950">
                    ¡Cupos Completos en este Salón!
                  </h3>
                  <p className="text-xs font-semibold text-red-600">
                    Capacidad máxima alcanzada (0 cupos libres)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFullAlert(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink transition"
                aria-label="Cerrar ventana de alerta"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Ficha del Salón Seleccionado */}
            <div className="rounded-2xl bg-slate-50 p-3.5 text-xs space-y-1.5 ring-1 ring-slate-200">
              <div className="flex justify-between items-center text-ink">
                <span className="font-semibold text-ink-mute">Salón:</span>
                <span className="font-bold text-ink">{fullAlert.salonName}</span>
              </div>
              <div className="flex justify-between items-center text-ink">
                <span className="font-semibold text-ink-mute">Día de Congreso:</span>
                <span className="font-bold text-ink">{fullAlert.diaLabel}</span>
              </div>
              <div className="flex justify-between items-center text-ink">
                <span className="font-semibold text-ink-mute">Turno y Horario:</span>
                <span className="font-bold text-brand-700">{fullAlert.turnoLabel}</span>
              </div>
              <div className="flex justify-between items-center text-ink border-t border-slate-200 pt-1.5 mt-1.5">
                <span className="font-semibold text-ink-mute">Aforo alcanzado:</span>
                <span className="font-bold text-red-600">
                  {fullAlert.occupied} de {fullAlert.capacity} puestos ocupados (100%)
                </span>
              </div>
            </div>

            {/* ADVERTENCIA CRÍTICA: NO REALIZAR DEPÓSITOS */}
            <div className="rounded-2xl bg-red-50 p-4 text-xs text-red-900 border-2 border-red-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-red-700 uppercase tracking-wide">
                <AlertTriangle className="size-4 shrink-0 text-red-600" />
                <span>Advertencia Importante sobre Pagos</span>
              </div>
              <p className="font-semibold leading-relaxed">
                <b>NO realices transferencias ni depósitos bancarios para este turno y salón</b>. No es posible asignar nuevos participantes ni emitir credenciales de acreditación para horarios cuyo aforo físico se encuentre completo.
              </p>
            </div>

            {/* Sugerencias de acción */}
            <div className="rounded-xl bg-blue-50/70 p-3 text-xs text-blue-900 ring-1 ring-blue-100 space-y-1">
              <p className="font-bold">¿Qué opciones tienes disponibles?</p>
              <ul className="list-disc pl-4 space-y-0.5 text-blue-800">
                <li>Verifica si el salón alterno para este mismo turno aún cuenta con cupos.</li>
                <li>Selecciona el turno contrario (mañana o tarde) u otro día del Congreso.</li>
              </ul>
            </div>

            {/* Botón de Confirmación / Cierre */}
            <button
              type="button"
              onClick={() => setFullAlert(null)}
              className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-500/25 transition hover:brightness-110"
            >
              Entendido, elegiré otro turno o salón disponible
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}

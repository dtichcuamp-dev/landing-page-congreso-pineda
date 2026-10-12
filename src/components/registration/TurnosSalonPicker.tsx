"use client";

import { Calendar, Check, Info, Users, Clock } from "lucide-react";
import { DAYS_CONGRESO, CAPACIDADES_SALON } from "@/data/pricing";
import type { SalonId, SeleccionTurnos, TurnosPorDia } from "@/types/registration";

interface Props {
  value: SeleccionTurnos;
  onChange: (value: SeleccionTurnos) => void;
  capacities?: Record<string, number>;
  error?: string;
}

export function TurnosSalonPicker({ value, onChange, capacities = {}, error }: Props) {
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

      {/* Info de aforo de salones */}
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 p-2.5 text-blue-900 ring-1 ring-blue-100">
          <Users className="size-4 shrink-0 text-blue-600" aria-hidden />
          <span>
            <b>Salón Principal:</b> Capacidad máxima de <b>{CAPACIDADES_SALON.principal} puestos</b> por turno.
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/70 p-2.5 text-emerald-900 ring-1 ring-emerald-100">
          <Users className="size-4 shrink-0 text-emerald-600" aria-hidden />
          <span>
            <b>Salón Alterno:</b> Capacidad máxima de <b>{CAPACIDADES_SALON.alterno} puestos</b> por turno.
          </span>
        </div>
      </div>

      {/* Lista interactiva de los 5 días */}
      <div className="space-y-3">
        {DAYS_CONGRESO.map((dia) => {
          const diaState = value[dia.id] || {};
          const isDiaActive = !!(diaState.manana || diaState.tarde);

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
                    <p className="text-[11px] text-ink-mute">Elige tu turno y salón</p>
                  </div>
                </div>

                {isDiaActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-clinic-100 px-2.5 py-0.5 text-xs font-semibold text-clinic-700">
                    <Check className="size-3" strokeWidth={3} />
                    Asistiendo
                  </span>
                ) : (
                  <span className="text-xs text-ink-mute">Sin turnos</span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Turno Mañana */}
                <div className="space-y-1.5 rounded-xl bg-slate-50/60 p-2.5 ring-1 ring-black/5">
                  <div className="flex items-center justify-between text-xs font-bold text-ink">
                    <span className="flex items-center gap-1.5 text-brand-800">
                      <Clock className="size-3 text-brand-600" />
                      Turno Mañana
                    </span>
                    <span className="text-[10px] font-normal text-ink-mute">8:00 AM - 12:30 PM</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Salón Principal */}
                    {(() => {
                      const selected = diaState.manana === "principal";
                      const occ = getOccupied(dia.id, "manana", "principal");
                      const full = occ >= CAPACIDADES_SALON.principal;

                      return (
                        <button
                          type="button"
                          disabled={full && !selected}
                          onClick={() => setTurno(dia.id, "manana", selected ? "" : "principal")}
                          className={`relative flex flex-col items-center justify-center rounded-lg px-2 py-2 text-xs font-medium transition ${
                            selected
                              ? "bg-brand-600 text-white shadow-sm font-bold"
                              : full
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-100 hover:text-ink"
                          }`}
                        >
                          <span>Salón Principal</span>
                          <span className={`text-[10px] ${selected ? "text-blue-100" : "text-ink-mute"}`}>
                            {full ? "Agotado" : "Cap. 240"}
                          </span>
                        </button>
                      );
                    })()}

                    {/* Salón Alterno */}
                    {(() => {
                      const selected = diaState.manana === "alterno";
                      const occ = getOccupied(dia.id, "manana", "alterno");
                      const full = occ >= CAPACIDADES_SALON.alterno;

                      return (
                        <button
                          type="button"
                          disabled={full && !selected}
                          onClick={() => setTurno(dia.id, "manana", selected ? "" : "alterno")}
                          className={`relative flex flex-col items-center justify-center rounded-lg px-2 py-2 text-xs font-medium transition ${
                            selected
                              ? "bg-clinic-600 text-white shadow-sm font-bold"
                              : full
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-100 hover:text-ink"
                          }`}
                        >
                          <span>Salón Alterno</span>
                          <span className={`text-[10px] ${selected ? "text-emerald-100" : "text-ink-mute"}`}>
                            {full ? "Agotado" : "Cap. 60"}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                  {diaState.manana && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setTurno(dia.id, "manana", "")}
                        className="text-[10px] text-ink-mute underline hover:text-red-600"
                      >
                        Quitar turno mañana
                      </button>
                    </div>
                  )}
                </div>

                {/* Turno Tarde */}
                <div className="space-y-1.5 rounded-xl bg-slate-50/60 p-2.5 ring-1 ring-black/5">
                  <div className="flex items-center justify-between text-xs font-bold text-ink">
                    <span className="flex items-center gap-1.5 text-clinic-800">
                      <Clock className="size-3 text-clinic-600" />
                      Turno Tarde
                    </span>
                    <span className="text-[10px] font-normal text-ink-mute">2:00 PM - 6:00 PM</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Salón Principal */}
                    {(() => {
                      const selected = diaState.tarde === "principal";
                      const occ = getOccupied(dia.id, "tarde", "principal");
                      const full = occ >= CAPACIDADES_SALON.principal;

                      return (
                        <button
                          type="button"
                          disabled={full && !selected}
                          onClick={() => setTurno(dia.id, "tarde", selected ? "" : "principal")}
                          className={`relative flex flex-col items-center justify-center rounded-lg px-2 py-2 text-xs font-medium transition ${
                            selected
                              ? "bg-brand-600 text-white shadow-sm font-bold"
                              : full
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-100 hover:text-ink"
                          }`}
                        >
                          <span>Salón Principal</span>
                          <span className={`text-[10px] ${selected ? "text-blue-100" : "text-ink-mute"}`}>
                            {full ? "Agotado" : "Cap. 240"}
                          </span>
                        </button>
                      );
                    })()}

                    {/* Salón Alterno */}
                    {(() => {
                      const selected = diaState.tarde === "alterno";
                      const occ = getOccupied(dia.id, "tarde", "alterno");
                      const full = occ >= CAPACIDADES_SALON.alterno;

                      return (
                        <button
                          type="button"
                          disabled={full && !selected}
                          onClick={() => setTurno(dia.id, "tarde", selected ? "" : "alterno")}
                          className={`relative flex flex-col items-center justify-center rounded-lg px-2 py-2 text-xs font-medium transition ${
                            selected
                              ? "bg-clinic-600 text-white shadow-sm font-bold"
                              : full
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-100 hover:text-ink"
                          }`}
                        >
                          <span>Salón Alterno</span>
                          <span className={`text-[10px] ${selected ? "text-emerald-100" : "text-ink-mute"}`}>
                            {full ? "Agotado" : "Cap. 60"}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                  {diaState.tarde && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setTurno(dia.id, "tarde", "")}
                        className="text-[10px] text-ink-mute underline hover:text-red-600"
                      >
                        Quitar turno tarde
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
        <p id="turnos-error" role="alert" className="text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

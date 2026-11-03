"use client";

import { Check, Info, Users, Clock, AlertTriangle } from "lucide-react";
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

  const handleSalonClick = (
    dia: (typeof DAYS_CONGRESO)[number],
    turnoKey: "manana" | "tarde",
    salon: SalonId
  ) => {
    const isSelected = value[dia.id]?.[turnoKey] === salon;
    // Permite la selección directa sin restricciones de aforo
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

      {/* Alerta Preventiva sobre Aforo y Llegada Temprana */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/90 p-3.5 text-xs text-amber-950 ring-1 ring-amber-200/80 shadow-sm">
        <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" aria-hidden />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">
            Aviso importante sobre el acceso a los salones:
          </p>
          <p className="text-amber-800 leading-relaxed">
            El acceso a las conferencias se efectúa por <b>estricto orden de llegada</b> hasta completar la capacidad física de cada sala. Se recomienda a todos los participantes <b>llegar temprano para garantizar su puesto</b> en el salón seleccionado.
          </p>
        </div>
      </div>

      {/* Info de aforo de salones */}
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 p-2.5 text-blue-900 ring-1 ring-blue-100">
          <Users className="size-4 shrink-0 text-blue-600" aria-hidden />
          <span>
            <b>Salón Principal (1):</b> Capacidad de <b>{CAPACIDADES_SALON.principal} puestos</b> por turno.
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/70 p-2.5 text-emerald-900 ring-1 ring-emerald-100">
          <Users className="size-4 shrink-0 text-emerald-600" aria-hidden />
          <span>
            <b>Salón Alterno (2):</b> Capacidad de <b>{CAPACIDADES_SALON.alterno} puestos</b> por turno.
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
          const highMananaPrinc = occMananaPrinc >= CAPACIDADES_SALON.principal;
          const highMananaAlt = occMananaAlt >= CAPACIDADES_SALON.alterno;
          const selMananaPrinc = diaState.manana === "principal";
          const selMananaAlt = diaState.manana === "alterno";

          // Cálculos para Turno Tarde
          const occTardePrinc = getOccupied(dia.id, "tarde", "principal");
          const occTardeAlt = getOccupied(dia.id, "tarde", "alterno");
          const highTardePrinc = occTardePrinc >= CAPACIDADES_SALON.principal;
          const highTardeAlt = occTardeAlt >= CAPACIDADES_SALON.alterno;
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
                      className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition text-center cursor-pointer ${
                        selMananaPrinc
                          ? "bg-brand-600 text-white shadow-md font-bold ring-2 ring-brand-700"
                          : highMananaPrinc
                            ? "bg-amber-50/80 text-ink ring-1 ring-amber-300 hover:bg-amber-100/70 shadow-xs"
                            : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50 hover:text-ink shadow-xs"
                      }`}
                    >
                      <span className={`font-semibold ${selMananaPrinc ? "text-white" : highMananaPrinc ? "text-amber-950 font-bold" : "text-ink"}`}>
                        Salón Principal (1)
                      </span>

                      {selMananaPrinc ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-100 font-bold">
                            <Check className="size-3" strokeWidth={3} /> Seleccionado
                          </span>
                          {highMananaPrinc && (
                            <span className="text-[9px] text-amber-200 font-medium mt-0.5">
                              Llegar temprano para puesto
                            </span>
                          )}
                        </div>
                      ) : highMananaPrinc ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-800 px-2 py-0.5 text-[9px] font-bold border border-amber-300">
                            <AlertTriangle className="size-2.5 text-amber-600" /> Alta afluencia
                          </span>
                          <span className="text-[9px] font-semibold text-amber-700 mt-0.5">
                            Llegar temprano para puesto
                          </span>
                        </div>
                      ) : (
                        <span className="mt-1 text-[10px] text-ink-mute">
                          Disponible
                        </span>
                      )}
                    </button>

                    {/* Salón Alterno (2) */}
                    <button
                      type="button"
                      onClick={() => handleSalonClick(dia, "manana", "alterno")}
                      className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition text-center cursor-pointer ${
                        selMananaAlt
                          ? "bg-clinic-600 text-white shadow-md font-bold ring-2 ring-clinic-700"
                          : highMananaAlt
                            ? "bg-amber-50/80 text-ink ring-1 ring-amber-300 hover:bg-amber-100/70 shadow-xs"
                            : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50 hover:text-ink shadow-xs"
                      }`}
                    >
                      <span className={`font-semibold ${selMananaAlt ? "text-white" : highMananaAlt ? "text-amber-950 font-bold" : "text-ink"}`}>
                        Salón Alterno (2)
                      </span>

                      {selMananaAlt ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-100 font-bold">
                            <Check className="size-3" strokeWidth={3} /> Seleccionado
                          </span>
                          {highMananaAlt && (
                            <span className="text-[9px] text-amber-200 font-medium mt-0.5">
                              Llegar temprano para puesto
                            </span>
                          )}
                        </div>
                      ) : highMananaAlt ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-800 px-2 py-0.5 text-[9px] font-bold border border-amber-300">
                            <AlertTriangle className="size-2.5 text-amber-600" /> Alta afluencia
                          </span>
                          <span className="text-[9px] font-semibold text-amber-700 mt-0.5">
                            Llegar temprano para puesto
                          </span>
                        </div>
                      ) : (
                        <span className="mt-1 text-[10px] text-ink-mute">
                          Disponible
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Advertencia de alta afluencia y llegada temprana */}
                  {(highMananaPrinc || highMananaAlt) && (
                    <div className="rounded-xl bg-amber-50/90 p-2.5 text-[10px] font-semibold text-amber-900 border border-amber-200 flex items-center gap-1.5 shadow-xs">
                      <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
                      <span>
                        Turno de alta concurrencia. Debe llegar temprano para garantizar su puesto en la sala.
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
                      className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition text-center cursor-pointer ${
                        selTardePrinc
                          ? "bg-brand-600 text-white shadow-md font-bold ring-2 ring-brand-700"
                          : highTardePrinc
                            ? "bg-amber-50/80 text-ink ring-1 ring-amber-300 hover:bg-amber-100/70 shadow-xs"
                            : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50 hover:text-ink shadow-xs"
                      }`}
                    >
                      <span className={`font-semibold ${selTardePrinc ? "text-white" : highTardePrinc ? "text-amber-950 font-bold" : "text-ink"}`}>
                        Salón Principal (1)
                      </span>

                      {selTardePrinc ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-100 font-bold">
                            <Check className="size-3" strokeWidth={3} /> Seleccionado
                          </span>
                          {highTardePrinc && (
                            <span className="text-[9px] text-amber-200 font-medium mt-0.5">
                              Llegar temprano para puesto
                            </span>
                          )}
                        </div>
                      ) : highTardePrinc ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-800 px-2 py-0.5 text-[9px] font-bold border border-amber-300">
                            <AlertTriangle className="size-2.5 text-amber-600" /> Alta afluencia
                          </span>
                          <span className="text-[9px] font-semibold text-amber-700 mt-0.5">
                            Llegar temprano para puesto
                          </span>
                        </div>
                      ) : (
                        <span className="mt-1 text-[10px] text-ink-mute">
                          Disponible
                        </span>
                      )}
                    </button>

                    {/* Salón Alterno (2) */}
                    <button
                      type="button"
                      onClick={() => handleSalonClick(dia, "tarde", "alterno")}
                      className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition text-center cursor-pointer ${
                        selTardeAlt
                          ? "bg-clinic-600 text-white shadow-md font-bold ring-2 ring-clinic-700"
                          : highTardeAlt
                            ? "bg-amber-50/80 text-ink ring-1 ring-amber-300 hover:bg-amber-100/70 shadow-xs"
                            : "bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50 hover:text-ink shadow-xs"
                      }`}
                    >
                      <span className={`font-semibold ${selTardeAlt ? "text-white" : highTardeAlt ? "text-amber-950 font-bold" : "text-ink"}`}>
                        Salón Alterno (2)
                      </span>

                      {selTardeAlt ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-100 font-bold">
                            <Check className="size-3" strokeWidth={3} /> Seleccionado
                          </span>
                          {highTardeAlt && (
                            <span className="text-[9px] text-amber-200 font-medium mt-0.5">
                              Llegar temprano para puesto
                            </span>
                          )}
                        </div>
                      ) : highTardeAlt ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-800 px-2 py-0.5 text-[9px] font-bold border border-amber-300">
                            <AlertTriangle className="size-2.5 text-amber-600" /> Alta afluencia
                          </span>
                          <span className="text-[9px] font-semibold text-amber-700 mt-0.5">
                            Llegar temprano para puesto
                          </span>
                        </div>
                      ) : (
                        <span className="mt-1 text-[10px] text-ink-mute">
                          Disponible
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Advertencia de alta afluencia y llegada temprana */}
                  {(highTardePrinc || highTardeAlt) && (
                    <div className="rounded-xl bg-amber-50/90 p-2.5 text-[10px] font-semibold text-amber-900 border border-amber-200 flex items-center gap-1.5 shadow-xs">
                      <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
                      <span>
                        Turno de alta concurrencia. Debe llegar temprano para garantizar su puesto en la sala.
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
    </fieldset>
  );
}

"use client";

import { ArrowUpRight, Mic } from "lucide-react";
import { SPECIALTIES, TOTAL_TALKS } from "@/data/specialties";
import { findSpecialtySlot, SALON_LABEL, TURNO_LABEL } from "@/data/agenda";
import { focusAgenda } from "@/lib/agendaEvents";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Specialties() {
  return (
    <section id="especialidades" className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Especialidades"
          title="17 áreas, un solo congreso"
          description={`${TOTAL_TALKS} ponencias distribuidas por especialidad. Toca una ficha para ver cuándo y dónde se presenta.`}
        />

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SPECIALTIES.map((s, i) => {
            const slot = findSpecialtySlot(s.id);
            const Icon = s.icon;
            return (
              <li key={s.id}>
                <Reveal delay={(i % 4) * 70} className="h-full">
                  <button
                    type="button"
                    onClick={() => slot && focusAgenda({ dayIndex: slot.dayIndex, specialtyId: s.id })}
                    className="glass group relative flex h-full w-full flex-col rounded-3xl p-5 text-left transition duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-2xl focus-visible:-translate-y-1"
                    aria-label={`${s.name}: ${s.talks} ponencias. Ver en el programa`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-clinic-500 text-white shadow-md shadow-brand-500/25 transition group-hover:rotate-6 group-hover:scale-110">
                        <Icon className="size-6" aria-hidden />
                      </span>
                      <ArrowUpRight
                        className="size-5 text-ink-mute opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600 group-hover:opacity-100"
                        aria-hidden
                      />
                    </div>

                    <h3 className="mt-4 text-lg font-bold leading-snug text-ink">{s.name}</h3>

                    <p className="mt-auto flex items-center gap-1.5 pt-3 text-sm font-semibold text-brand-700">
                      <Mic className="size-4" aria-hidden />
                      {s.talks} ponencias
                    </p>
                    {slot && (
                      <p className="mt-1 text-xs text-ink-mute">
                        {slot.weekday} {String(slot.day).padStart(2, "0")}/11 ·{" "}
                        {TURNO_LABEL[slot.turno].name} · {SALON_LABEL[slot.salon]}
                      </p>
                    )}
                  </button>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

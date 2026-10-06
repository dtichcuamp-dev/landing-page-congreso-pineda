"use client";

import {
  ChevronDown,
  Clock,
  Coffee,
  Landmark,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  AGENDA,
  SALON_LABEL,
  TURNO_LABEL,
  type Salon,
  type Session,
  type Turno,
} from "@/data/agenda";
import { SPECIALTY_BY_ID } from "@/data/specialties";
import {
  AGENDA_FOCUS_EVENT,
  type AgendaFocusDetail,
} from "@/lib/agendaEvents";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

type SalonFilter = "todos" | Salon;

const FILTERS: { id: SalonFilter; label: string }[] = [
  { id: "todos", label: "Ambos salones" },
  { id: "principal", label: "Salón Principal" },
  { id: "alterno", label: "Salón Alterno" },
];

export function Agenda() {
  const [dayIndex, setDayIndex] = useState(0);
  const [filter, setFilter] = useState<SalonFilter>("todos");
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Permite que las fichas de especialidad abran el día/sesión correspondiente.
  useEffect(() => {
    const handler = (e: Event) => {
      const { dayIndex, specialtyId } = (e as CustomEvent<AgendaFocusDetail>).detail;
      setDayIndex(dayIndex);
      setFilter("todos");
      const day = AGENDA[dayIndex];
      for (const salon of ["principal", "alterno"] as Salon[]) {
        for (const turno of ["manana", "tarde"] as Turno[]) {
          if (day.salones[salon][turno].specialtyId === specialtyId) {
            setOpenKey(`${day.id}-${salon}-${turno}`);
          }
        }
      }
    };
    window.addEventListener(AGENDA_FOCUS_EVENT, handler);
    return () => window.removeEventListener(AGENDA_FOCUS_EVENT, handler);
  }, []);

  const toggle = useCallback(
    (key: string) => setOpenKey((k) => (k === key ? null : key)),
    [],
  );

  const day = AGENDA[dayIndex];
  const salones: Salon[] = filter === "todos" ? ["principal", "alterno"] : [filter];

  return (
    <section id="programa" className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Programa científico"
          title="Agenda del 2 al 6 de noviembre"
          description="Dos salones en paralelo, mañana (8:30 a. m. – 12:30 p. m.) y tarde (2:00 – 6:00 p. m.). Despliega cada bloque para ver ponencias y ponentes."
        />

        {/* Selector de día */}
        <Reveal className="mt-10">
          <div
            role="tablist"
            aria-label="Días del congreso"
            className="glass mx-auto flex max-w-2xl gap-1.5 rounded-2xl p-1.5"
          >
            {AGENDA.map((d, i) => {
              const active = i === dayIndex;
              return (
                <button
                  key={d.id}
                  role="tab"
                  type="button"
                  id={`tab-${d.id}`}
                  aria-selected={active}
                  aria-controls="agenda-panel"
                  onClick={() => setDayIndex(i)}
                  className={`flex-1 rounded-xl px-1 py-2.5 text-center transition sm:px-3 ${
                    active
                      ? "bg-gradient-to-br from-brand-500 to-clinic-500 text-white shadow-md shadow-brand-500/30"
                      : "text-ink-soft hover:bg-white/70"
                  }`}
                >
                  <span className="block text-[0.65rem] font-semibold uppercase tracking-wider opacity-80 sm:text-xs">
                    {d.weekday.slice(0, 3)}
                  </span>
                  <span className="block text-lg font-extrabold leading-none sm:text-xl">
                    {String(d.day).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtro por salón */}
          <div className="mt-4 flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrar por salón">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  filter === f.id
                    ? "bg-ink text-white"
                    : "glass text-ink-soft hover:bg-white/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Panel del día */}
        <div
          id="agenda-panel"
          role="tabpanel"
          aria-labelledby={`tab-${day.id}`}
          className={`mt-8 grid gap-6 ${salones.length === 2 ? "lg:grid-cols-2" : ""}`}
        >
          {salones.map((salon) => (
            <div key={salon} className="glass rounded-3xl p-4 sm:p-6">
              <h3 className="flex items-center gap-2.5 px-1 text-lg font-bold text-ink">
                <Landmark className="size-5 text-brand-500" aria-hidden />
                {SALON_LABEL[salon]}
                <span className="ml-auto text-sm font-medium text-ink-mute">
                  {day.weekday} {String(day.day).padStart(2, "0")}/11
                </span>
              </h3>

              <div className="mt-4 space-y-3">
                {(["manana", "tarde"] as Turno[]).map((turno) => {
                  const key = `${day.id}-${salon}-${turno}`;
                  return (
                    <SessionCard
                      key={key}
                      turno={turno}
                      session={day.salones[salon][turno]}
                      open={openKey === key}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SessionCard({
  turno,
  session,
  open,
  onToggle,
}: {
  turno: Turno;
  session: Session;
  open: boolean;
  onToggle: () => void;
}) {
  const specialty = session.specialtyId ? SPECIALTY_BY_ID[session.specialtyId] : undefined;
  const Icon = specialty?.icon;
  const TurnoIcon = turno === "manana" ? Sun : Moon;
  const hasTalks = !!session.talks?.length;
  const isNone = session.kind === "none";
  const panelId = `panel-${turno}-${session.title.replace(/\W+/g, "-")}`;

  return (
    <article
      className={`overflow-hidden rounded-2xl ring-1 transition ${
        isNone ? "bg-white/30 ring-white/60" : "bg-white/65 ring-white/90"
      } ${open ? "shadow-lg shadow-brand-500/10 ring-brand-200" : ""}`}
    >
      <button
        type="button"
        onClick={hasTalks ? onToggle : undefined}
        disabled={!hasTalks}
        aria-expanded={hasTalks ? open : undefined}
        aria-controls={hasTalks ? panelId : undefined}
        className="flex w-full items-center gap-3 p-4 text-left disabled:cursor-default"
      >
        <span
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${
            isNone
              ? "bg-ink/5 text-ink-mute"
              : session.kind === "ceremony"
                ? "bg-amber-100 text-amber-700"
                : "bg-gradient-to-br from-brand-500 to-clinic-500 text-white"
          }`}
        >
          {Icon ? <Icon className="size-5" aria-hidden /> : <TurnoIcon className="size-5" aria-hidden />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-mute">
            <TurnoIcon className="size-3.5" aria-hidden />
            {TURNO_LABEL[turno].name} · {TURNO_LABEL[turno].hours}
          </span>
          <span className={`mt-0.5 block text-base font-bold leading-snug ${isNone ? "text-ink-mute" : "text-ink"}`}>
            {session.title}
          </span>
          {session.theme && (
            <span className="mt-0.5 block text-sm italic leading-snug text-ink-soft">
              «{session.theme}»
            </span>
          )}
        </span>

        {hasTalks && (
          <ChevronDown
            className={`size-5 shrink-0 text-ink-mute transition-transform ${open ? "rotate-180 text-brand-600" : ""}`}
            aria-hidden
          />
        )}
      </button>

      {hasTalks && open && (
        <div id={panelId} className="border-t border-white/80 bg-white/40 px-4 pb-4 pt-3">
          {session.moderator && (
            <p className="mb-2 flex items-center gap-2 text-sm text-ink-soft">
              <User className="size-4 text-brand-500" aria-hidden />
              <span>
                <span className="font-semibold">Moderador:</span> {session.moderator}
              </span>
            </p>
          )}
          {session.note && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
              {session.note}
            </p>
          )}
          <ol className="space-y-2.5">
            {session.talks!.map((talk, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex w-[5.4rem] shrink-0 items-start gap-1 text-xs font-semibold tabular-nums text-brand-700">
                  {talk.time ? (
                    <>
                      <Clock className="mt-px size-3 shrink-0 opacity-70" aria-hidden />
                      {talk.time}
                    </>
                  ) : (
                    <span aria-hidden className="ml-4">·</span>
                  )}
                </span>
                <span className="min-w-0 flex-1 text-sm leading-snug">
                  {talk.kind === "break" ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-ink-mute">
                      <Coffee className="size-3.5" aria-hidden />
                      {talk.title}
                    </span>
                  ) : (
                    <>
                      <span className={talk.kind === "ceremony" ? "font-semibold text-amber-800" : "font-semibold text-ink"}>
                        {talk.title}
                      </span>
                      {talk.speaker && <span className="block text-ink-soft">{talk.speaker}</span>}
                      {talk.tbc && !talk.speaker && (
                        <span className="block text-xs font-medium text-amber-700">Ponente por confirmar</span>
                      )}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}

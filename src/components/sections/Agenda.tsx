"use client";

import {
  Award,
  ChevronDown,
  Clock,
  Coffee,
  Landmark,
  Moon,
  Sparkles,
  Sun,
  User,
  Wifi,
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
import { SPECIALTY_BY_ID, TOTAL_TALKS } from "@/data/specialties";
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
          const sessionData = day.salones[salon][turno];
          const sessions = Array.isArray(sessionData) ? sessionData : [sessionData];
          sessions.forEach((s, sIdx) => {
            if (s.specialtyId === specialtyId) {
              setOpenKey(`${day.id}-${salon}-${turno}-${s.specialtyId || s.title}-${sIdx}`);
            }
          });
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
          description={`${TOTAL_TALKS} ponencias distribuidas en dos salones en paralelo. Despliega cada bloque para ver los detalles de ponencias y ponentes.`}
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
                  const sessionData = day.salones[salon][turno];
                  const sessions = Array.isArray(sessionData) ? sessionData : [sessionData];
                  return sessions.map((session, sIdx) => {
                    const key = `${day.id}-${salon}-${turno}-${session.specialtyId || session.title}-${sIdx}`;
                    return (
                      <SessionCard
                        key={key}
                        turno={turno}
                        session={session}
                        open={openKey === key}
                        onToggle={() => toggle(key)}
                      />
                    );
                  });
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
            {TURNO_LABEL[turno].name} · {session.hours || TURNO_LABEL[turno].hours}
          </span>
          <span className={`mt-0.5 block text-base font-bold leading-snug ${isNone ? "text-ink-mute" : "text-ink"}`}>
            {session.title}
          </span>
          {session.theme && (
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-50/90 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200/80">
              <Sparkles className="size-3 text-brand-600 shrink-0" aria-hidden />
              <span>«{session.theme}»</span>
            </span>
          )}
        </span>

        {hasTalks && (
          <ChevronDown
            className={`size-5 shrink-0 text-ink-mute transition-transform duration-200 ${open ? "rotate-180 text-brand-600" : ""}`}
            aria-hidden
          />
        )}
      </button>

      {hasTalks && open && (
        <div id={panelId} className="border-t border-white/80 bg-white/40 px-4 pb-4 pt-3.5">
          {session.moderator && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-brand-50/80 p-2.5 text-xs sm:text-sm text-brand-900 ring-1 ring-brand-200/70">
              <User className="size-4 text-brand-600 shrink-0" aria-hidden />
              <div>
                <span className="font-bold">Moderación / Coordinación:</span>{" "}
                <span className="font-semibold text-brand-800">{session.moderator}</span>
              </div>
            </div>
          )}
          {session.note && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
              {session.note}
            </p>
          )}

          <ol className="space-y-3">
            {session.talks!.map((talk, i) => {
              if (talk.kind === "break") {
                return (
                  <li key={i} className="pt-1 pb-1">
                    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 p-3 text-amber-950 ring-1 ring-amber-300/80 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                          <Coffee className="size-4 animate-bounce" aria-hidden />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold tracking-tight text-amber-950">
                              Coffee Break · Receso Unificado
                            </span>
                            <span className="rounded-full bg-amber-200/90 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-amber-900">
                              Pausa Institucional
                            </span>
                          </div>
                          <p className="text-[0.72rem] text-amber-900/80 font-medium">
                            Café, hidratación, visita a stands comerciales y networking.
                          </p>
                        </div>
                      </div>
                      {talk.time && (
                        <span className="rounded-lg bg-white/70 px-2.5 py-1 text-xs font-bold tabular-nums text-amber-900 ring-1 ring-amber-200/70">
                          {talk.time}
                        </span>
                      )}
                    </div>
                  </li>
                );
              }

              const isOnline = talk.title.toUpperCase().includes("(ONLINE)");
              const cleanTitle = talk.title.replace(/\s*\(ONLINE\)\s*/i, "").trim();

              return (
                <li key={i} className="flex items-start gap-3 rounded-xl p-2 transition hover:bg-white/60">
                  <span className="mt-0.5 flex min-w-[5.8rem] sm:min-w-[6.8rem] shrink-0 items-start gap-1.5 text-xs font-bold tabular-nums text-brand-700">
                    {talk.time ? (
                      <>
                        <Clock className="mt-0.5 size-3.5 shrink-0 text-brand-500" aria-hidden />
                        <span className="leading-tight">{talk.time}</span>
                      </>
                    ) : (
                      <span aria-hidden className="ml-4 font-normal text-ink-mute">·</span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {talk.kind === "ceremony" && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[0.68rem] font-bold text-amber-800 ring-1 ring-amber-200 uppercase tracking-wide">
                          <Award className="size-3" aria-hidden /> Protocolo
                        </span>
                      )}
                      {isOnline && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[0.68rem] font-bold text-blue-800 ring-1 ring-blue-200 uppercase tracking-wide">
                          <Wifi className="size-3" aria-hidden /> En línea
                        </span>
                      )}
                      <span className={`text-sm leading-snug ${talk.kind === "ceremony" ? "font-bold text-amber-950" : "font-semibold text-ink"}`}>
                        {cleanTitle}
                      </span>
                    </div>

                    {talk.speaker && (
                      <div className="flex items-start gap-1.5 text-xs font-medium text-ink-soft">
                        <User className="mt-0.5 size-3.5 text-brand-500 shrink-0" aria-hidden />
                        <span className="text-brand-900 font-semibold">{talk.speaker}</span>
                      </div>
                    )}
                    {talk.tbc && !talk.speaker && (
                      <span className="block text-xs font-medium text-amber-700">Ponente por confirmar</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </article>
  );
}

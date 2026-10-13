"use client";

import { useState } from "react";
import {
  Award,
  Medal,
  Trophy,
  GraduationCap,
  Stethoscope,
  Building2,
  Sparkles,
  Globe,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Crown,
  ChevronRight,
  HeartHandshake,
} from "lucide-react";
import { HONOREE } from "@/data/honoree";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

type TabId = "trayectoria" | "liderazgo" | "distinciones" | "sociedades";

export function Honoree() {
  const [activeTab, setActiveTab] = useState<TabId>("trayectoria");

  return (
    <section id="homenaje" className="relative px-4 py-20 sm:px-6 sm:py-28 overflow-hidden bg-gradient-to-b from-white via-amber-50/25 to-clinic-50/40">
      {/* Elementos decorativos de fondo con tono dorado de homenaje */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-20 size-96 rounded-full bg-amber-200/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-20 size-96 rounded-full bg-brand-300/20 blur-3xl"
      />

      <div className="mx-auto max-w-6xl relative">
        <SectionHeading
          eyebrow="En honor a..."
          title="Dr. Samir Saba Kahwati"
          description="Homenajeado oficial del XIV Congreso Pineda, en reconocimiento a más de cuatro décadas de excelencia quirúrgica, liderazgo hospitalario y devoción en la formación médica."
        />

        {/* Tarjeta Principal de Presentación de Honor */}
        <Reveal className="mt-12">
          <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/30 to-brand-50/20 p-7 shadow-xl shadow-amber-900/5 sm:p-10 backdrop-blur-md">
            {/* Cinta de honor superior derecha */}
            <div className="absolute -right-12 top-7 rotate-45 bg-gradient-to-r from-amber-500 to-yellow-500 py-1 px-14 text-[11px] font-black uppercase tracking-wider text-slate-900 shadow-md">
              Homenajeado
            </div>

            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              {/* Emblema / Retrato de Honor con Laureles */}
              <div className="lg:col-span-4 flex flex-col items-center text-center">
                <div className="relative">
                  {/* Halo dorado pulsante */}
                  <div
                    aria-hidden
                    className="absolute -inset-2 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 opacity-30 blur-lg"
                  />
                  
                  {/* Marco circular de honor */}
                  <div className="relative flex size-40 sm:size-48 flex-col items-center justify-center rounded-full border-4 border-amber-300/80 bg-gradient-to-b from-slate-900 via-brand-950 to-slate-900 text-white shadow-2xl">
                    <Crown className="size-8 text-amber-300 mb-1 animate-pulse" />
                    <span className="font-serif text-3xl sm:text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300">
                      SK
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-200/90 mt-1">
                      Dr. Samir Saba
                    </span>
                    <div className="mt-1.5 flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 border border-amber-400/30">
                      <Stethoscope className="size-3" />
                      <span>GyO · UCLA</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-ink">
                    Dr. Samir Saba Kahwati
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-brand-700">
                    Especialista en Ginecología y Obstetricia
                  </p>
                  <p className="text-xs text-ink-mute">
                    Jefe Emérito del Servicio GO4 · HCUAMP
                  </p>
                </div>

                {/* Datos de origen y primeros estudios */}
                <div className="mt-4 w-full rounded-2xl bg-white/80 p-3.5 border border-amber-100 text-left text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-ink-soft">
                    <MapPin className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>Nacido en <strong>{HONOREE.birthPlace}</strong> ({HONOREE.birthDate}). Llegó a Venezuela en {HONOREE.arrivalVenezuela}.</span>
                  </div>
                  <div className="flex items-start gap-2 text-ink-soft">
                    <GraduationCap className="size-3.5 text-brand-600 shrink-0 mt-0.5" />
                    <span>Primaria en Escuela Pública Ciudad de Maracay · Secundaria en Colegio San Vicente de Paúl (Barquisimeto).</span>
                  </div>
                </div>
              </div>

              {/* Semblanza y Métricas Destacadas */}
              <div className="lg:col-span-8 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-200 mb-4">
                    <Sparkles className="size-3.5 text-amber-600" />
                    <span>Reconocimiento a una vida de entrega médica</span>
                  </div>

                  <p className="text-base sm:text-lg leading-relaxed text-ink-soft font-medium">
                    Graduado en la <strong>Promoción 11 de Médicos Cirujanos de la UCLA (1982)</strong>, el Dr. Samir Saba Kahwati ha dedicado su vida al servicio de la mujer venezolana, forjando un legado imborrable en el Hospital Central Universitario &ldquo;Dr. Antonio María Pineda&rdquo; y formando a incontables promociones de médicos y especialistas ginecobstetras.
                  </p>

                  <blockquote className="mt-4 border-l-4 border-amber-400 pl-4 py-1 italic text-sm text-ink-soft bg-amber-50/40 rounded-r-xl">
                    &ldquo;{HONOREE.quote}&rdquo;
                  </blockquote>
                </div>

                {/* 4 Cifras Claves del Homenaje */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-white/90 p-3.5 border border-amber-100 text-center shadow-sm">
                    <span className="block text-2xl font-black text-amber-600">+40</span>
                    <span className="text-[11px] font-medium text-ink-soft">Años de Labor Médica</span>
                  </div>
                  <div className="rounded-2xl bg-white/90 p-3.5 border border-amber-100 text-center shadow-sm">
                    <span className="block text-2xl font-black text-brand-600">5</span>
                    <span className="text-[11px] font-medium text-ink-soft">Lapsos de Jefatura</span>
                  </div>
                  <div className="rounded-2xl bg-white/90 p-3.5 border border-amber-100 text-center shadow-sm">
                    <span className="block text-2xl font-black text-amber-600">2</span>
                    <span className="text-[11px] font-medium text-ink-soft">Premios I Congreso</span>
                  </div>
                  <div className="rounded-2xl bg-white/90 p-3.5 border border-amber-100 text-center shadow-sm">
                    <span className="block text-2xl font-black text-clinic-600">4</span>
                    <span className="text-[11px] font-medium text-ink-soft">Sociedades Médicas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Selector de Pestañas Interactivas para la Información Detallada */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {[
            { id: "trayectoria" as TabId, label: "Trayectoria y Formación", icon: GraduationCap },
            { id: "liderazgo" as TabId, label: "Lapsos de Jefe Emérito", icon: Building2 },
            { id: "distinciones" as TabId, label: "Distinciones y Premios", icon: Trophy },
            { id: "sociedades" as TabId, label: "Sociedades Científicas", icon: Globe },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition shadow-sm ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/20"
                    : "bg-white/80 text-ink-soft hover:bg-white hover:text-ink border border-slate-200"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-slate-950" : "text-amber-600"}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido de las Pestañas */}
        <div className="mt-6">
          {/* 1. Trayectoria y Formación */}
          {activeTab === "trayectoria" && (
            <Reveal>
              <div className="rounded-3xl bg-white/90 p-6 sm:p-8 border border-slate-200 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-ink">Formación Médica y Carrera Hospitalaria</h4>
                    <p className="text-xs text-ink-mute">Evolución académica desde su graduación hasta la especialidad y docencia</p>
                  </div>
                </div>

                <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-200 space-y-6">
                  {HONOREE.milestones.map((m, idx) => (
                    <div key={idx} className="relative group">
                      {/* Nodo de la línea de tiempo */}
                      <span className="absolute -left-[31px] sm:-left-[39px] top-1 size-4 rounded-full border-2 border-white bg-amber-500 shadow-sm group-hover:scale-125 transition" />

                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-mono text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          {m.year}
                        </span>
                        <h5 className="text-base font-bold text-ink">{m.title}</h5>
                        {m.badge && (
                          <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-ink-mute mt-0.5">{m.institution}</p>
                      <p className="text-sm text-ink-soft mt-1 leading-relaxed">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* 2. Lapsos de Jefe Emérito */}
          {activeTab === "liderazgo" && (
            <Reveal>
              <div className="rounded-3xl bg-white/90 p-6 sm:p-8 border border-slate-200 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-xl bg-brand-100 text-brand-700">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-ink">Lapsos de Jefatura y Liderazgo Institucional</h4>
                    <p className="text-xs text-ink-mute">Gestión ininterrumpida al frente de los servicios de Ginecología y Obstetricia</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {HONOREE.leadership.map((l, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-2xl p-5 border transition ${
                        l.isCurrent
                          ? "bg-gradient-to-br from-amber-50 to-white border-amber-300 shadow-md ring-1 ring-amber-300/60"
                          : "bg-slate-50/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      {l.isCurrent && (
                        <span className="absolute -top-2.5 right-4 bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                          Actualidad
                        </span>
                      )}
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md inline-block">
                        {l.period}
                      </span>
                      <h5 className="mt-2 text-base font-extrabold text-ink">{l.role}</h5>
                      <p className="text-xs text-ink-soft mt-1 font-medium">{l.service}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* 3. Distinciones y Premios */}
          {activeTab === "distinciones" && (
            <Reveal>
              <div className="rounded-3xl bg-white/90 p-6 sm:p-8 border border-slate-200 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <Trophy className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-ink">Distinciones y Reconocimientos</h4>
                    <p className="text-xs text-ink-mute">Premios científicos y reconocimientos a su labor como trabajador insigne</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {HONOREE.awards.map((a, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl p-5 border transition flex gap-4 ${
                        a.highlight
                          ? "bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 border-amber-300/80 shadow-md"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 shrink-0 h-fit">
                        {a.highlight ? <Medal className="size-6 text-amber-600" /> : <Award className="size-6 text-brand-600" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md font-mono">
                            {a.event}
                          </span>
                        </div>
                        <h5 className="text-base font-black text-ink mt-1.5">{a.title}</h5>
                        <p className="text-xs text-ink-soft mt-1 leading-relaxed">{a.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* 4. Sociedades Científicas y Profesionales */}
          {activeTab === "sociedades" && (
            <Reveal>
              <div className="rounded-3xl bg-white/90 p-6 sm:p-8 border border-slate-200 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-xl bg-clinic-100 text-clinic-700">
                    <Globe className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-ink">Sociedades Científicas y Profesionales</h4>
                    <p className="text-xs text-ink-mute">Membresías activas de trayectoria gremial y médica</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {HONOREE.societies.map((s, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl p-5 border border-slate-200 bg-slate-50/60 hover:bg-white transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-clinic-700 bg-clinic-50 border border-clinic-100 px-2 py-0.5 rounded-full">
                            {s.scope}
                          </span>
                          <span className="text-xs font-mono font-semibold text-ink-mute">
                            {s.since}
                          </span>
                        </div>
                        <h5 className="text-base font-bold text-ink mt-3">{s.name}</h5>
                      </div>

                      {s.acronyms && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap gap-1.5">
                          {s.acronyms.map((ac) => (
                            <span
                              key={ac}
                              className="text-[10px] font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md"
                            >
                              {ac}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

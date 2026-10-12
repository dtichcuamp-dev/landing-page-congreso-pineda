"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Maximize2,
  Mic,
  Pause,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { FEATURED_SPEAKERS, type FeaturedSpeaker } from "@/data/speakers";
import { SPECIALTY_BY_ID } from "@/data/specialties";
import { findSpecialtySlot } from "@/data/agenda";
import { focusAgenda } from "@/lib/agendaEvents";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Speakers() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<FeaturedSpeaker | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  const total = FEATURED_SPEAKERS.length;

  // Ajuste reactivo del número de tarjetas visibles por pantalla
  useEffect(() => {
    const updateItems = () => {
      if (window.innerWidth < 640) setItemsPerPage(1);
      else if (window.innerWidth < 1024) setItemsPerPage(2);
      else setItemsPerPage(3);
    };
    updateItems();
    window.addEventListener("resize", updateItems);
    return () => window.removeEventListener("resize", updateItems);
  }, []);

  const maxIndex = Math.max(0, total - itemsPerPage);

  const nextSpeaker = useCallback(() => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSpeaker = useCallback(() => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Avance automático cada 4 segundos
  useEffect(() => {
    if (isPaused || selectedSpeaker !== null) return;
    const interval = setInterval(nextSpeaker, 4000);
    return () => clearInterval(interval);
  }, [isPaused, selectedSpeaker, nextSpeaker]);

  // Teclado para el visor modal (Escape, Flecha Izq, Flecha Der)
  useEffect(() => {
    if (!selectedSpeaker) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedSpeaker(null);
      } else if (e.key === "ArrowRight") {
        const currentIdx = FEATURED_SPEAKERS.findIndex((s) => s.id === selectedSpeaker.id);
        const nextIdx = (currentIdx + 1) % total;
        setSelectedSpeaker(FEATURED_SPEAKERS[nextIdx]);
      } else if (e.key === "ArrowLeft") {
        const currentIdx = FEATURED_SPEAKERS.findIndex((s) => s.id === selectedSpeaker.id);
        const prevIdx = (currentIdx - 1 + total) % total;
        setSelectedSpeaker(FEATURED_SPEAKERS[prevIdx]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedSpeaker, total]);

  // Bloqueo de scroll de fondo mientras el visor esté abierto
  useEffect(() => {
    if (selectedSpeaker) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedSpeaker]);

  const handleOpenAgenda = (speaker: FeaturedSpeaker) => {
    const slot = findSpecialtySlot(speaker.specialtyId);
    if (slot) {
      setSelectedSpeaker(null);
      focusAgenda({ dayIndex: slot.dayIndex, specialtyId: speaker.specialtyId });
    }
  };

  return (
    <section
      id="ponentes"
      className="relative overflow-hidden bg-gradient-to-b from-clinic-50/60 via-white to-clinic-50/40 px-4 py-20 sm:px-6 sm:py-28"
    >
      {/* Resplandor decorativo de fondo */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-brand-300/20 via-clinic-300/20 to-transparent blur-3xl"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Cuerpo Académico y Científico"
          title="Algunos de nuestros(as) ponentes..."
          description="Especialistas y docentes de destacada trayectoria que compartirán las más recientes evidencias clínicas y quirúrgicas en el XIV Congreso Pineda."
        />

        {/* Controles de reproducción e interactividad */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-white/80 hover:text-brand-700"
              title={isPaused ? "Reanudar carrusel automático" : "Pausar carrusel automático"}
              aria-label={isPaused ? "Reanudar carrusel automático" : "Pausar carrusel automático"}
            >
              {isPaused ? (
                <>
                  <Play className="size-3.5 fill-current text-brand-600" />
                  <span>Reanudar</span>
                </>
              ) : (
                <>
                  <Pause className="size-3.5 fill-current text-amber-600" />
                  <span>Pausar</span>
                </>
              )}
            </button>
            <span className="hidden text-xs text-ink-mute sm:inline">
              Toca una tarjeta para abrir el visor en alta definición
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSpeaker}
              aria-label="Ponente anterior"
              className="glass inline-flex size-9 items-center justify-center rounded-xl text-ink transition hover:bg-white/80 hover:text-brand-600 active:scale-95"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={nextSpeaker}
              aria-label="Siguiente ponente"
              className="glass inline-flex size-9 items-center justify-center rounded-xl text-ink transition hover:bg-white/80 hover:text-brand-600 active:scale-95"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Carrusel automático con deslizamiento continuo */}
        <div
          className="relative mt-6 overflow-hidden pb-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(-${activeIndex * (100 / itemsPerPage)}%)`,
            }}
          >
            {FEATURED_SPEAKERS.map((speaker, index) => {
              const spec = SPECIALTY_BY_ID[speaker.specialtyId];
              const Icon = spec?.icon;

              return (
                <div
                  key={speaker.id}
                  className="shrink-0 px-2 sm:px-3"
                  style={{ width: `${100 / itemsPerPage}%` }}
                >
                  <article
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/75 shadow-md hover:border-brand-200 hover:bg-white hover:shadow-xl transition-all duration-300"
                  >
                    {/* Contenedor de fotografía adaptativa */}
                    <div
                      className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 cursor-pointer"
                      onClick={() => setSelectedSpeaker(speaker)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedSpeaker(speaker);
                        }
                      }}
                      aria-label={`Abrir visor de ${speaker.name}`}
                    >
                      {/* Fondo desenfocado que unifica cualquier relación de aspecto */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={speaker.image}
                        alt=""
                        aria-hidden
                        className={`absolute inset-0 h-full w-full object-cover blur-md opacity-35 scale-110 ${
                          speaker.flipHorizontal ? "-scale-x-110" : ""
                        }`}
                      />

                      {/* Imagen principal con ajuste perfecto */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={speaker.image}
                        alt={`Fotografía de ${speaker.name}`}
                        className={`relative z-10 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105 ${
                          speaker.flipHorizontal ? "-scale-x-100" : ""
                        }`}
                        loading="lazy"
                      />

                      {/* Botón flotante para ampliar imagen */}
                      <div className="absolute right-3.5 top-3.5 z-20">
                        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-slate-900/60 text-white backdrop-blur-md transition group-hover:bg-brand-600 group-hover:scale-110">
                          <Maximize2 className="size-4" />
                        </span>
                      </div>

                      {/* Badge de Especialidad */}
                      <div className="absolute left-3.5 top-3.5 z-20">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1 text-xs font-bold text-brand-800 shadow-sm backdrop-blur-md ring-1 ring-white">
                          {Icon && <Icon className="size-3.5 text-brand-600" aria-hidden />}
                          <span>{speaker.specialty}</span>
                        </span>
                      </div>

                      {/* Degradado inferior para legibilidad */}
                      <div className="absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

                      {/* Horario y salón superpuestos */}
                      <div className="absolute inset-x-3.5 bottom-3 z-20 flex items-center justify-between text-[0.72rem] font-semibold text-white/95">
                        <span className="inline-flex items-center gap-1 drop-shadow-sm">
                          <Clock className="size-3 text-brand-300" />
                          <span>{speaker.time}</span>
                        </span>
                        <span className="rounded-md bg-white/20 px-2 py-0.5 backdrop-blur-sm">
                          {speaker.salon}
                        </span>
                      </div>
                    </div>

                    {/* Información del Ponente */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex-1">
                        <h3 className="text-lg font-extrabold text-ink group-hover:text-brand-700 transition-colors line-clamp-1">
                          {speaker.name}
                        </h3>
                        <p className="mt-0.5 text-xs font-semibold text-ink-soft line-clamp-1">
                          {speaker.role}
                        </p>

                        {/* Ponencia destacada */}
                        <div className="mt-3 rounded-2xl bg-clinic-50/70 p-3 ring-1 ring-clinic-100/80">
                          <div className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-brand-700">
                            <Mic className="size-3" />
                            <span>Ponencia Científica</span>
                          </div>
                          <p className="mt-1 text-xs font-medium italic text-ink leading-snug line-clamp-2">
                            «{speaker.talkTitle}»
                          </p>
                        </div>
                      </div>

                      {/* Botón interactivo para ver detalles en visor */}
                      <button
                        type="button"
                        onClick={() => setSelectedSpeaker(speaker)}
                        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-50/80 py-2.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200/80 transition hover:bg-brand-600 hover:text-white"
                      >
                        <span>Ver perfil y visor</span>
                        <ArrowUpRight className="size-3.5" />
                      </button>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>

          {/* Indicadores / Puntos de navegación */}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Ver grupo de ponentes ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? "w-7 bg-brand-600 shadow-sm shadow-brand-500/40"
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VISOR PROFESIONAL Y LLAMATIVO (LIGHTBOX MODAL)
         ───────────────────────────────────────────────────────────── */}
      {selectedSpeaker && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Visor de ${selectedSpeaker.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md bg-slate-950/75 animate-in fade-in duration-200"
          onClick={() => setSelectedSpeaker(null)}
        >
          <div
            className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/20 sm:flex-row max-h-[92vh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => setSelectedSpeaker(null)}
              aria-label="Cerrar visor"
              className="absolute right-3.5 top-3.5 z-30 inline-flex size-9 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-md transition hover:bg-slate-900 hover:scale-105"
            >
              <X className="size-5" />
            </button>

            {/* Panel de imagen con adaptación profesional a cualquier aspecto */}
            <div className="relative flex min-h-[300px] sm:min-h-full sm:w-1/2 items-center justify-center overflow-hidden bg-slate-950">
              {/* Capa de fondo con desenfoque ambientado */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedSpeaker.image}
                alt=""
                aria-hidden
                className={`absolute inset-0 h-full w-full object-cover blur-2xl opacity-40 scale-125 ${
                  selectedSpeaker.flipHorizontal ? "-scale-x-125" : ""
                }`}
              />

              {/* Imagen protagonista en proporción original nítida */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedSpeaker.image}
                alt={selectedSpeaker.name}
                className={`relative z-10 max-h-[46vh] sm:max-h-[75vh] w-auto max-w-full object-contain p-3 drop-shadow-2xl transition-all duration-300 ${
                  selectedSpeaker.flipHorizontal ? "-scale-x-100" : ""
                }`}
              />

              {/* Controles de navegación en el visor */}
              <div className="absolute inset-x-2 bottom-3 z-20 flex items-center justify-between px-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = FEATURED_SPEAKERS.findIndex((s) => s.id === selectedSpeaker.id);
                    const prevIdx = (currentIdx - 1 + total) % total;
                    setSelectedSpeaker(FEATURED_SPEAKERS[prevIdx]);
                  }}
                  aria-label="Ponente anterior"
                  className="inline-flex size-9 items-center justify-center rounded-xl bg-slate-900/60 text-white backdrop-blur-md transition hover:bg-slate-900 hover:scale-110"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="rounded-lg bg-slate-900/60 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                  {FEATURED_SPEAKERS.findIndex((s) => s.id === selectedSpeaker.id) + 1} de {total}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = FEATURED_SPEAKERS.findIndex((s) => s.id === selectedSpeaker.id);
                    const nextIdx = (currentIdx + 1) % total;
                    setSelectedSpeaker(FEATURED_SPEAKERS[nextIdx]);
                  }}
                  aria-label="Siguiente ponente"
                  className="inline-flex size-9 items-center justify-center rounded-xl bg-slate-900/60 text-white backdrop-blur-md transition hover:bg-slate-900 hover:scale-110"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>

            {/* Panel de detalles del ponente */}
            <div className="flex flex-1 flex-col overflow-y-auto p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-brand-800 ring-1 ring-brand-200">
                  <Sparkles className="size-3 text-brand-600" />
                  <span>{selectedSpeaker.specialty}</span>
                </span>
              </div>

              <h3 className="mt-3 text-2xl font-black text-ink sm:text-3xl">
                {selectedSpeaker.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-brand-700">
                {selectedSpeaker.role}
              </p>

              {/* Caja de Ponencia */}
              <div className="mt-5 rounded-2xl bg-gradient-to-br from-brand-50/70 to-clinic-50/70 p-4 ring-1 ring-brand-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-800">
                  <Mic className="size-3.5 text-brand-600" />
                  <span>Título de la Ponencia</span>
                </div>
                <p className="mt-1.5 text-base font-bold italic text-ink leading-snug">
                  «{selectedSpeaker.talkTitle}»
                </p>
              </div>

              {/* Ficha de programación */}
              <div className="mt-4 grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-ink-soft ring-1 ring-slate-100">
                  <Calendar className="size-4 text-brand-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-ink">Jornada</span>
                    <span>{selectedSpeaker.dayLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-ink-soft ring-1 ring-slate-100">
                  <Clock className="size-4 text-brand-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-ink">Horario</span>
                    <span>{selectedSpeaker.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-ink-soft ring-1 ring-slate-100 sm:col-span-2">
                  <MapPin className="size-4 text-clinic-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-ink">Ubicación</span>
                    <span>{selectedSpeaker.salon} · Biotel Suites</span>
                  </div>
                </div>
              </div>

              {/* Reseña institucional */}
              {selectedSpeaker.bio && (
                <p className="mt-4 text-xs leading-relaxed text-ink-soft border-t border-slate-100 pt-3">
                  {selectedSpeaker.bio}
                </p>
              )}

              {/* Acción directa: ver en la agenda científica */}
              <div className="mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenAgenda(selectedSpeaker)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-clinic-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110 active:scale-[0.99]"
                >
                  <span>Ver bloque completo en el Programa</span>
                  <ArrowUpRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

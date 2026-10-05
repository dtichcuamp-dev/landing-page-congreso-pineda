import Image from "next/image";
import { ArrowRight, CalendarDays, ChevronDown, MapPin } from "lucide-react";
import { EVENT } from "@/data/event";
import { Countdown } from "./Countdown";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] items-center overflow-hidden px-4 pb-16 pt-28 sm:px-6"
    >
      {/* Orbes decorativos */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-24 size-72 animate-float rounded-full bg-brand-400/30 blur-3xl sm:size-96" />
        <div className="absolute -right-24 top-1/3 size-72 animate-float-slow rounded-full bg-clinic-400/30 blur-3xl sm:size-[26rem]" />
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <div className="glass-strong rounded-[2rem] px-6 py-5 sm:px-10 sm:py-7">
          <Image
            src="/images/logo-congreso-pineda.png"
            alt="Logotipo Congreso Pineda · Hospital Central Universitario «Dr. Antonio María Pineda»"
            width={1024}
            height={426}
            priority
            className="h-auto w-[17rem] sm:w-[26rem] lg:w-[30rem]"
          />
        </div>

        <div className="mt-8">
          <Countdown />
        </div>

        <h1 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
          <span className="bg-gradient-to-r from-brand-600 to-clinic-500 bg-clip-text text-transparent">
            XIV Congreso Pineda
          </span>
          <span className="block text-xl font-bold text-ink-soft sm:mt-2 sm:text-3xl">
            LIX Jornada de Egresados y LXXII Aniversario del HCUAMP
          </span>
        </h1>
        {/* Título completo para lectores de pantalla / SEO */}
        <p className="sr-only">{EVENT.title}</p>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <li className="glass inline-flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink sm:text-base">
            <CalendarDays className="size-5 text-brand-500" aria-hidden />
            {EVENT.dateLabel}
          </li>
          <li className="glass inline-flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink sm:text-base">
            <MapPin className="size-5 text-clinic-500" aria-hidden />
            {EVENT.venue}
          </li>
        </ul>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="#inscripciones"
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-clinic-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand-600/30 transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Inscripciones
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#programa"
            className="glass inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-brand-700 transition hover:bg-white/80"
          >
            Ver programa científico
          </a>
        </div>
      </div>

      <a
        href="#nosotros"
        aria-label="Desplazarse a la siguiente sección"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-ink-mute transition hover:text-brand-600 sm:block"
      >
        <ChevronDown className="size-7 animate-bounce" />
      </a>
    </section>
  );
}

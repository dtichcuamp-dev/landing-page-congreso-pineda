import type { Metadata } from "next";
import Image from "next/image";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Hospital,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Mantenimiento Programado · XIV Congreso Pineda 2026",
  description:
    "Estamos realizando mejoras técnicas en la plataforma oficial del XIV Congreso Pineda 2026. Volveremos a estar en línea muy pronto.",
};

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-brand-950 to-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden px-4 py-8 sm:py-12">
      {/* Luces y auras de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-96 sm:size-[600px] rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 size-80 rounded-full bg-clinic-500/15 blur-3xl"
      />

      {/* Cabecera / Logo */}
      <header className="relative z-10 mx-auto max-w-4xl w-full flex justify-center pt-2">
        <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 shadow-xl">
          <Image
            src="/images/logo-congreso-pineda.png"
            alt="XIV Congreso Pineda · HCUAMP"
            width={1024}
            height={426}
            className="h-10 sm:h-12 w-auto object-contain brightness-105"
            priority
          />
        </div>
      </header>

      {/* Contenedor Central */}
      <div className="relative z-10 mx-auto max-w-2xl w-full my-auto py-8 text-center space-y-6 sm:space-y-8">
        {/* Indicador de Estado */}
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-400/30 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-300 backdrop-blur">
          <span className="size-2 rounded-full bg-amber-400 animate-ping" />
          <span className="size-2 rounded-full bg-amber-400 -ml-3" />
          <span>Actualización y Mantenimiento Técnico</span>
        </div>

        {/* Título Principal */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Optimizando la Plataforma
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            Estamos aplicando mejoras y actualizaciones en nuestra plataforma para brindarte la mayor excelencia durante el{" "}
            <span className="text-brand-300 font-semibold">XIV Congreso Pineda 2026</span>.
          </p>
        </div>

        {/* Tarjeta de Detalles del Evento */}
        <div className="rounded-3xl bg-white/[0.06] border border-white/15 p-6 sm:p-8 backdrop-blur-lg shadow-2xl text-left space-y-5">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-3 rounded-2xl bg-brand-600/30 border border-brand-400/40 text-brand-300 shrink-0">
              <Hospital className="size-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                XIV Congreso Pineda, LIX Jornada de Egresados y LXXII Aniversario
              </h2>
              <p className="text-xs text-slate-400">
                Hospital Central Universitario &ldquo;Dr. Antonio María Pineda&rdquo;
              </p>
            </div>
          </div>

          {/* Información del Evento */}
          <div className="grid gap-3 sm:grid-cols-2 text-xs sm:text-sm">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/60 p-3.5 border border-white/10">
              <CalendarDays className="size-5 text-brand-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Fecha Oficial</span>
                <span className="font-bold text-white">02 al 06 de noviembre de 2026</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/60 p-3.5 border border-white/10">
              <MapPin className="size-5 text-clinic-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Sede del Evento</span>
                <span className="font-bold text-white">Hotel Biotel Suites, Barquisimeto</span>
              </div>
            </div>
          </div>

          {/* Mensaje de Compromiso */}
          <div className="rounded-2xl bg-slate-900/70 p-4 border border-white/10 text-xs sm:text-sm text-slate-300 italic text-center">
            &ldquo;La unión del conocimiento y el compromiso como clave de la salud&rdquo;
          </div>
        </div>

        {/* Botón de Recargar / Verificar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-clinic-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110 active:scale-95"
          >
            <RefreshCw className="size-4" />
            <span>Comprobar Estado del Sitio</span>
          </a>

          <a
            href="https://www.instagram.com/gobiernodelaraoficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-5 py-3 text-sm font-semibold text-slate-200 border border-white/15 transition"
          >
            <span>Canal Oficial en Instagram</span>
            <ExternalLink className="size-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Pie de Página */}
      <footer className="relative z-10 mx-auto max-w-4xl w-full text-center text-xs text-slate-500 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 XIV Congreso Pineda · HCUAMP. Todos los derechos reservados.</p>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <a href="/admin" className="hover:text-slate-200 transition underline underline-offset-2">
            Panel Administrativo
          </a>
          <a href="/scanner" className="hover:text-slate-200 transition underline underline-offset-2">
            Acceso Validadores
          </a>
        </div>
      </footer>
    </main>
  );
}

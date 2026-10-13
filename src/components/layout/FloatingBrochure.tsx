"use client";

import { useEffect, useState } from "react";
import { Check, FileDown, Sparkles } from "lucide-react";

/**
 * Botón flotante que acompaña el desplazamiento de la página
 * y permite descargar el Folleto (Brochure) oficial en formato PDF.
 */
export function FloatingBrochure() {
  const [visible, setVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Aparece suavemente al cargar o al desplazarse levemente
    const timer = setTimeout(() => setVisible(true), 400);

    const onScroll = () => {
      if (window.scrollY > 30) {
        setVisible(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleDownloadClick = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
    }, 2500);
  };

  return (
    <aside
      aria-label="Descarga de folleto del evento"
      className={`fixed bottom-5 left-4 z-40 transition-all duration-500 sm:bottom-8 sm:left-8 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-8 opacity-0"
      }`}
    >
      <a
        href="/folleto-congreso-pineda-2026.pdf"
        download="Folleto_Congreso_Pineda_2026.pdf"
        onClick={handleDownloadClick}
        title="Descargar Folleto Oficial del Congreso (PDF en Alta Calidad)"
        className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-900 via-brand-700 to-clinic-700 px-3.5 py-2.5 text-xs font-bold text-white shadow-xl shadow-brand-950/25 ring-2 ring-white/80 transition-all duration-300 hover:scale-105 hover:brightness-110 hover:shadow-brand-800/40 active:scale-95 sm:px-4 sm:py-3 sm:text-sm"
      >
        {/* Baliza luminosa llamativa */}
        <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-white shadow-inner">
          {downloading ? (
            <Check className="size-3.5 text-clinic-300 transition-transform" />
          ) : (
            <FileDown className="size-3.5 transition-transform group-hover:-translate-y-0.5 sm:size-4" />
          )}

          {!downloading && (
            <span className="absolute -top-0.5 -right-0.5 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clinic-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-clinic-300 ring-1 ring-brand-900" />
            </span>
          )}
        </span>

        {/* Texto del Botón */}
        <span className="flex items-center gap-1.5 leading-none">
          {downloading ? (
            <span className="text-clinic-200">¡Descargando!</span>
          ) : (
            <>
              <span className="hidden sm:inline font-extrabold tracking-tight">Folleto Oficial</span>
              <span className="sm:hidden font-extrabold">Folleto</span>
              <Sparkles className="size-3 text-amber-300 transition-opacity group-hover:opacity-100 opacity-80" />
            </>
          )}
        </span>

        {/* Badge PDF */}
        <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white ring-1 ring-white/30 sm:text-[10px]">
          PDF
        </span>
      </a>
    </aside>
  );
}

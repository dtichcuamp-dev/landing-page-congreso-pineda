"use client";

import { useEffect, useState } from "react";
import { EVENT } from "@/data/event";

/** Muestra "Faltan N días". Se calcula en el cliente para evitar desajustes de hidratación. */
export function Countdown() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      const diff = new Date(EVENT.startsAtISO).getTime() - Date.now();
      setDays(Math.max(0, Math.ceil(diff / 86_400_000)));
    });
  }, []);

  if (days === null || days <= 0) return null;

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-clinic-50/90 px-3.5 py-1.5 text-sm font-semibold text-clinic-700 ring-1 ring-clinic-200">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-clinic-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-clinic-500" />
      </span>
      {days === 1 ? "¡Falta 1 día!" : `Faltan ${days} días`}
    </span>
  );
}

import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import { EVENT } from "@/data/event";

export function Footer() {
  return (
    <footer className="px-4 pb-10 pt-6 sm:px-6">
      <div className="glass mx-auto flex max-w-6xl flex-col items-center gap-5 rounded-3xl p-7 text-center sm:flex-row sm:justify-between sm:text-left">
        <Image
          src="/images/logo-congreso-pineda.png"
          alt="Congreso Pineda"
          width={1024}
          height={426}
          className="h-12 w-auto"
        />
        <div className="space-y-1.5 text-sm text-ink-soft">
          <p className="flex items-center justify-center gap-2 sm:justify-start">
            <CalendarDays className="size-4 text-brand-500" aria-hidden /> {EVENT.dateLabel}
          </p>
          <p className="flex items-center justify-center gap-2 sm:justify-start">
            <MapPin className="size-4 text-clinic-500" aria-hidden /> {EVENT.venue}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:items-end sm:text-right">
          <p className="max-w-md text-[11px] leading-relaxed text-ink-mute">
            Diseñado y desarrollado por el Departamento de Tecnología, Información y Comunicación (DTIC) del Hospital Central Universitario Dr. Antonio María Pineda RIF G-20011811-3. Todos los Derechos Reservados 2026.
          </p>
          <div className="flex gap-4 text-xs font-medium text-brand-600">
            <a href="/terminos" className="hover:underline">Términos de Uso</a>
            <a href="/privacidad" className="hover:underline">Política de Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useState } from "react";
import {
  Building2,
  Car,
  Check,
  Compass,
  Copy,
  ExternalLink,
  Layers,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const VENUE_COORDS = {
  lat: 10.0682668,
  lng: -69.3560343,
  label: "10.0682668, -69.3560343",
};

const VENUE_MAPS_URL =
  "https://www.google.com/maps/place/Biotel+Suites/@10.0682668,-69.3560343,857m/data=!3m1!1e3!4m9!3m8!1s0x8e8766f278d26b73:0x5f236db05ade64e!5m2!4m1!1i2!8m2!3d10.0682668!4d-69.3560343!16s%2Fg%2F12mkw801b?entry=ttu";

const WAZE_URL = `https://waze.com/ul?ll=${VENUE_COORDS.lat},${VENUE_COORDS.lng}&navigate=yes`;

const WHATSAPP_SHARE_TEXT = `📍 *Ubicación del XIV Congreso Pineda 2026*
🏨 *Sede:* Biotel Suites, Barquisimeto
📫 *Dirección:* Final de la Av. Libertador con inicio de la Av. Florencio Jiménez, frente al monumento El Obelisco, Barquisimeto (300), estado Lara, Venezuela.
📌 *Coordenadas:* ${VENUE_COORDS.label}
🗺️ *Cómo llegar (Google Maps):* ${VENUE_MAPS_URL}
🚗 *Cómo llegar en Waze:* ${WAZE_URL}

¡Te esperamos del 2 al 6 de noviembre de 2026!`;

const WHATSAPP_SHARE_URL = `https://api.whatsapp.com/send?text=${encodeURIComponent(WHATSAPP_SHARE_TEXT)}`;

export function Venue() {
  const [copied, setCopied] = useState(false);
  const [mapLayer, setMapLayer] = useState<"satellite" | "hybrid" | "roadmap">("satellite");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(VENUE_COORDS.label);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Google Maps embed URL with layer type:
  // t=k: pure satellite, t=h: satellite + street labels (hybrid), t=m: normal roadmap
  const layerParam = mapLayer === "satellite" ? "k" : mapLayer === "hybrid" ? "h" : "m";
  const embedUrl = `https://maps.google.com/maps?q=${VENUE_COORDS.lat},${VENUE_COORDS.lng}&t=${layerParam}&z=17&ie=UTF8&iwloc=&output=embed`;

  return (
    <section id="sede" className="px-4 py-20 sm:px-6 sm:py-28 bg-clinic-50/50">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Sede oficial y ubicación"
          title="Biotel Suites · Barquisimeto"
          description="Espacios modernos y confortables con capacidad para dos salones simultáneos, área de stands y estacionamiento privado."
        />

        <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-12">
          {/* Tarjeta de información y botones */}
          <Reveal className="lg:col-span-5 flex flex-col justify-between">
            <article className="glass-strong flex h-full flex-col justify-between rounded-3xl p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-clinic-500 text-white shadow-md shadow-brand-500/25">
                    <MapPin className="size-5.5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-ink">Biotel Suites</h3>
                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                      Hotel & Centro de Convenciones
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-ink-soft sm:text-base">
                  Final de la Av. Libertador con inicio de la Av. Florencio Jiménez, frente al monumento El Obelisco, Barquisimeto (300), estado Lara, Venezuela.
                </p>

                {/* Coordenadas */}
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-brand-100">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-ink">
                    <Compass className="size-4 text-brand-600 shrink-0" aria-hidden />
                    <span className="font-semibold">{VENUE_COORDS.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5 text-clinic-600" />
                        <span className="text-clinic-600">Copiadas</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Servicios y bondades del lugar */}
                <ul className="mt-6 space-y-3 text-sm text-ink-soft">
                  <li className="flex items-center gap-3">
                    <Car className="size-4.5 text-clinic-600 shrink-0" aria-hidden />
                    <span>Estacionamiento amplio y vigilado dentro de las instalaciones.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Building2 className="size-4.5 text-brand-600 shrink-0" aria-hidden />
                    <span>Dos salones en paralelo (Principal y Alterno) con climatización integral.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ShieldCheck className="size-4.5 text-emerald-600 shrink-0" aria-hidden />
                    <span>Ubicación estratégica con acceso directo a avenidas principales.</span>
                  </li>
                </ul>
              </div>

              {/* Botones de acción */}
              <div className="mt-8 space-y-3 pt-6 border-t border-brand-100/60">
                {/* BOTÓN WHATSAPP DESTACADO */}
                <a
                  href={WHATSAPP_SHARE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 hover:-translate-y-0.5"
                >
                  {/* Ícono de WhatsApp SVG oficial */}
                  <svg
                    className="size-5 fill-current transition-transform group-hover:scale-110"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M12.031 2C6.502 2 2.012 6.486 2.012 12.014c0 1.956.568 3.784 1.553 5.337L2 22l4.81-1.528a9.98 9.98 0 0 0 5.221 1.464c5.529 0 10.019-4.486 10.019-10.014C22.05 6.486 17.56 2 12.031 2zm5.834 14.194c-.244.686-1.42 1.309-1.956 1.391-.497.075-1.147.106-3.708-.956-3.272-1.355-5.37-4.683-5.534-4.9-.164-.218-1.321-1.76-1.321-3.356 0-1.597.834-2.384 1.13-2.69.296-.307.648-.384.863-.384.217 0 .433.002.622.012.2.01.468-.076.732.557.273.655.933 2.274 1.015 2.439.082.164.137.357.028.574-.11.218-.165.353-.329.544-.165.192-.347.429-.495.576-.165.163-.337.34-.145.669.192.329.852 1.406 1.826 2.275 1.253 1.118 2.309 1.466 2.638 1.63.329.164.521.137.713-.082.192-.22.822-.958 1.042-1.288.219-.329.438-.274.731-.164.293.11 1.859.877 2.179 1.037.32.16.534.24.613.375.08.136.08.79-.164 1.476z" />
                  </svg>
                  <span>Compartir cómo llegar vía WhatsApp</span>
                </a>

                {/* Botones secundarios */}
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={VENUE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand-700 transition hover:bg-white"
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                    Google Maps
                  </a>
                  <a
                    href={WAZE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-brand-700 transition hover:bg-white"
                  >
                    <Navigation className="size-3.5" aria-hidden />
                    Ruta en Waze
                  </a>
                </div>
              </div>
            </article>
          </Reveal>

          {/* Visor de mapa satelital */}
          <Reveal className="lg:col-span-7 flex flex-col" delay={80}>
            <div className="glass-strong relative flex h-full min-h-[460px] flex-col overflow-hidden rounded-3xl p-3 sm:p-4">
              {/* Barra superior del mapa con selector de capas */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                    {mapLayer === "satellite" ? "Capa Satelital HD" : mapLayer === "hybrid" ? "Satélite con Rutas" : "Mapa Callejero"}
                  </span>
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-white/80 p-1 ring-1 ring-brand-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setMapLayer("satellite")}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      mapLayer === "satellite"
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Satélite
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapLayer("hybrid")}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      mapLayer === "hybrid"
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Híbrido
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapLayer("roadmap")}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      mapLayer === "roadmap"
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Callejero
                  </button>
                </div>
              </div>

              {/* Iframe del mapa satelital */}
              <div className="relative flex-1 w-full overflow-hidden rounded-2xl ring-1 ring-brand-100 shadow-inner min-h-[380px] bg-ink-dark/10">
                <iframe
                  title="Ubicación Satelital de Biotel Suites · XIV Congreso Pineda 2026"
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full"
                />

                {/* Badge flotante inferior */}
                <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 rounded-xl bg-ink/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md shadow-lg">
                  <Layers className="size-3.5 text-clinic-400" aria-hidden />
                  <span>Biotel Suites · Barquisimeto</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

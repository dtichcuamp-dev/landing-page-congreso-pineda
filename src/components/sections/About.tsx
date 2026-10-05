import { BookOpenText, Check, Compass, Telescope } from "lucide-react";
import { ABOUT } from "@/data/event";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function About() {
  return (
    <section id="nosotros" className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Acerca del evento"
          title="Ciencia, excelencia y tradición del HCUAMP"
        />

        {/* Reseña */}
        <Reveal className="mt-12">
          <article className="glass-strong relative overflow-hidden rounded-3xl p-7 sm:p-10">
            <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-300/30 blur-2xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-clinic-500 text-white shadow-lg shadow-brand-500/30">
                <BookOpenText className="size-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-xl font-bold text-ink">Reseña</h3>
                <p className="mt-2 text-base leading-relaxed text-ink-soft sm:text-lg">
                  {ABOUT.review}
                </p>
              </div>
            </div>
          </article>
        </Reveal>

        {/* Misión y Visión */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Reveal>
            <article className="glass h-full rounded-3xl p-7 sm:p-8">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Compass className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl font-bold text-ink">Misión</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{ABOUT.mission}</p>
            </article>
          </Reveal>
          <Reveal delay={100}>
            <article className="glass h-full rounded-3xl p-7 sm:p-8">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-clinic-100 text-clinic-600">
                <Telescope className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl font-bold text-ink">Visión</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{ABOUT.vision}</p>
            </article>
          </Reveal>
        </div>

        {/* Objetivos */}
        <Reveal className="mt-6">
          <article className="glass rounded-3xl p-7 sm:p-8">
            <h3 className="text-xl font-bold text-ink">Objetivos</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ABOUT.objectives.map((o) => (
                <li
                  key={o}
                  className="flex items-start gap-3 rounded-2xl bg-white/55 p-4 ring-1 ring-white/80"
                >
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-clinic-500 text-white">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-[0.95rem] font-medium leading-snug text-ink">{o}</span>
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

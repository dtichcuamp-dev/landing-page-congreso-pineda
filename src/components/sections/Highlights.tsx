import { HIGHLIGHTS } from "@/data/event";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Highlights() {
  return (
    <section id="atractivos" className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Atractivos"
          title="Todo lo que vivirás en el congreso"
          description="Cinco jornadas de actualización científica en un entorno cómodo y completamente equipado."
        />

        <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, value, label }, i) => (
            <li key={label}>
              <Reveal delay={i * 70} className="h-full">
                <div className="glass group flex h-full flex-col items-center rounded-3xl p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-8">
                  <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-clinic-500 text-white shadow-lg shadow-brand-500/25 transition group-hover:scale-110">
                    <Icon className="size-7" aria-hidden />
                  </span>
                  <p className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    {value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink-soft sm:text-base">{label}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

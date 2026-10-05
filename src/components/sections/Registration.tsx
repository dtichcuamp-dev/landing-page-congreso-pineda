import { Info, Tag } from "lucide-react";
import { PARTICIPANT_TYPES, usd } from "@/data/pricing";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

export function Registration() {
  return (
    <section id="inscripciones" className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Inscripciones"
          title="Reserva tu lugar en tres pasos"
          description="Completa tus datos, elige las jornadas y adjunta tu comprobante. Las tarifas son por jornada (mañana o tarde), en dólares al cambio BCV."
        />

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-5">
          {/* Tarifas */}
          <Reveal className="lg:col-span-2 lg:sticky lg:top-28">
            <aside className="glass rounded-3xl p-6 sm:p-7">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
                <Tag className="size-5 text-brand-500" aria-hidden />
                Tarifas por jornada
              </h3>
              <ul className="mt-4 divide-y divide-white/80">
                {PARTICIPANT_TYPES.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="font-medium text-ink">{p.label}</span>
                    {p.rate === 0 ? (
                      <span className="rounded-full bg-clinic-100 px-2.5 py-0.5 text-xs font-bold text-clinic-700">
                        Exonerado
                      </span>
                    ) : (
                      <span className="font-extrabold text-brand-700">{usd(p.rate)}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50/80 p-3 text-xs leading-relaxed text-brand-800">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                El pago se realiza en bolívares a la tasa oficial del BCV del día de la transferencia.
              </p>
            </aside>
          </Reveal>

          {/* Formulario */}
          <Reveal className="lg:col-span-3" delay={80}>
            <div className="glass-strong rounded-3xl p-6 sm:p-9">
              <RegistrationForm />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

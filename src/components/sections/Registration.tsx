import { Award, Gift, Hospital, Info, Sparkles, Tag, Users } from "lucide-react";
import { PARTICIPANT_TYPES_OTRA, usd } from "@/data/pricing";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

export function Registration() {
  return (
    <section id="inscripciones" className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Inscripciones"
          title="Reserva tu lugar en el Congreso"
          description="Inscripción 100% exonerada para personal del HCUAMP y tarifas oficiales por día para participantes de otras instituciones médicas y académicas."
        />

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-5">
          {/* Panel Lateral Informativo */}
          <Reveal className="lg:col-span-2 lg:sticky lg:top-28 space-y-4">
            {/* Exoneración HCUAMP */}
            <aside className="glass rounded-3xl p-6 sm:p-7 border border-clinic-200/50">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-clinic-100 text-clinic-700">
                  <Hospital className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink">Personal del HCUAMP</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-clinic-700">
                    <Sparkles className="size-3" />
                    100% Exonerado de pago
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-soft leading-relaxed">
                Todos los profesionales, residentes, enfermeros/as, conferencistas, técnicos y personal del Hospital Central Universitario Dr. Antonio María Pineda están totalmente exonerados previa consulta de nómina.
              </p>
            </aside>

            {/* Tarifas Otras Instituciones */}
            <aside className="glass rounded-3xl p-6 sm:p-7">
              <h3 className="flex items-center gap-2 text-base font-bold text-ink">
                <Tag className="size-4 text-brand-600" aria-hidden />
                Tarifas por día (Otras Instituciones)
              </h3>
              <p className="mt-1 text-xs text-ink-mute">
                El monto es por día e incluye los turnos de mañana y/o tarde:
              </p>

              <ul className="mt-3.5 divide-y divide-white/80">
                {PARTICIPANT_TYPES_OTRA.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-xs sm:text-sm">
                    <span className="font-medium text-ink">{p.label}</span>
                    <span className="font-extrabold text-brand-700">{usd(p.rate)} <span className="text-[11px] font-normal text-ink-mute">/ día</span></span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2 rounded-xl bg-brand-50/80 p-2.5 text-xs text-brand-900">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden />
                  <span>Pagos en bolívares a la tasa oficial del BCV al momento del registro.</span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-2.5 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-ink text-[11px]">
                    <Users className="size-3.5 text-slate-600" />
                    Capacidades por turno:
                  </div>
                  <p className="text-[11px] text-ink-mute">
                    • Salón Principal: máx. <b>240 puestos</b>.<br />
                    • Salón Alterno: máx. <b>60 puestos</b>.
                  </p>
                </div>

                <div className="rounded-xl bg-clinic-50/80 p-2.5 text-xs text-clinic-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-clinic-800 text-[11px]">
                    <Award className="size-3.5 text-clinic-600" />
                    Todo registro incluye:
                  </div>
                  <p className="text-[11px] text-clinic-700">
                    Acceso a ponencias, certificado digital con aval institucional y crédito académico, y kit del participante.
                  </p>
                </div>
              </div>
            </aside>
          </Reveal>

          {/* Formulario */}
          <Reveal className="lg:col-span-3" delay={80}>
            <div className="glass-strong rounded-3xl p-6 sm:p-9 shadow-lg shadow-black/5">
              <RegistrationForm />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

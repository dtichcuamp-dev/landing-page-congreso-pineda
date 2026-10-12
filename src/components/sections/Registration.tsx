import {
  Award,
  CalendarDays,
  Gift,
  HelpCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
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
          description="Completa tu registro para asistir al XIV Congreso Pineda 2026. Selecciona los días y salones de tu preferencia para asegurar tu acreditación oficial."
        />

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-5">
          {/* Panel Lateral Informativo General */}
          <Reveal className="lg:col-span-2 lg:sticky lg:top-28 space-y-4">
            {/* Detalles del Evento */}
            <aside className="glass rounded-3xl p-6 sm:p-7 border border-brand-100/60 space-y-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-ink">
                <ShieldCheck className="size-5 text-brand-600" aria-hidden />
                Información del Evento
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5 text-ink-soft">
                  <CalendarDays className="size-4 shrink-0 text-brand-600 mt-0.5" />
                  <div>
                    <b className="text-ink">Fecha:</b> 02 al 06 de noviembre de 2026
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-ink-soft">
                  <MapPin className="size-4 shrink-0 text-clinic-600 mt-0.5" />
                  <div>
                    <b className="text-ink">Sede:</b> Hotel Biotel Suites, Barquisimeto
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-ink-soft">
                  <Sparkles className="size-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <b className="text-ink">Programa:</b> 18 Especialidades Médicas y más de 100 ponencias
                  </div>
                </div>
              </div>

              {/* Beneficios de la Inscripción */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Todo registro incluye:
                </h4>
                <div className="space-y-2 text-xs text-ink-soft">
                  <div className="flex items-start gap-2">
                    <Award className="size-4 shrink-0 text-clinic-600 mt-0.5" />
                    <span>Acceso a las ponencias académicas en los salones y turnos elegidos</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Gift className="size-4 shrink-0 text-brand-600 mt-0.5" />
                    <span>Kit oficial del participante y credencial institucional</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>Certificado digital con aval institucional y crédito académico</span>
                  </div>
                </div>
              </div>

              {/* Capacidad de Salones */}
              <div className="rounded-2xl bg-slate-50/90 p-3.5 text-xs text-slate-700 ring-1 ring-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <Users className="size-4 text-slate-600" />
                  Aforo por Salón y Turno:
                </div>
                <p className="text-[11px] text-ink-mute leading-relaxed">
                  • <b>Salón Principal:</b> Máximo 240 puestos por turno.<br />
                  • <b>Salón Alterno:</b> Máximo 60 puestos por turno.<br />
                  <span className="text-brand-700 font-medium">Asignación garantizada por orden de inscripción.</span>
                </p>
              </div>

              {/* Ayuda */}
              <div className="flex items-start gap-2 rounded-xl bg-brand-50/70 p-3 text-xs text-brand-900 ring-1 ring-brand-100">
                <HelpCircle className="size-4 shrink-0 text-brand-600 mt-0.5" />
                <span>
                  El sistema te guiará paso a paso para completar tus datos, elegir tus turnos y finalizar tu registro.
                </span>
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

import { Activity, HeartPulse, Stethoscope, Dna, Syringe, Shield } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const SPONSORS = [
  { name: "MediTech", icon: Activity },
  { name: "FarmaGlobal", icon: HeartPulse },
  { name: "NeuroCare", icon: Stethoscope },
  { name: "BioSalud", icon: Dna },
  { name: "SurgicalPro", icon: Syringe },
  { name: "CardioLife", icon: Shield },
];

export function Sponsors() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 bg-white">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Nuestros Aliados"
          title="Agradecimiento Especial a Nuestros Patrocinantes"
          description="Hacen posible este gran encuentro médico, apostando por la educación continua y el desarrollo científico de nuestra región."
        />

        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6 items-center">
          {SPONSORS.map(({ name, icon: Icon }, idx) => (
            <Reveal key={name} delay={idx * 50}>
              <div className="group flex flex-col items-center justify-center p-6 text-ink-mute transition hover:text-brand-600 grayscale hover:grayscale-0 opacity-60 hover:opacity-100">
                <Icon className="size-12 mb-3" aria-hidden />
                <span className="font-bold text-sm tracking-wide uppercase">{name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface Sponsor {
  id: string;
  name: string;
  category: string;
  logo: string;
  url: string;
}

const SPONSORS: Sponsor[] = [
  {
    id: "logotipo_gobieno_lara",
    name: "Gobierno Bolivariano de Lara",
    category: "Gobernación del Estado Lara",
    logo: "/images/aliados/logotipo_gobieno_lara.png",
    url: "https://www.instagram.com/gobiernodelaraoficial/",
  },
  {
    id: "logotipo_ser_guaro",
    name: "#Ser Guaro Me Encanta",
    category: "Marca e Identidad Regional",
    logo: "/images/aliados/logotipo_ser_guaro.png",
    url: "https://www.instagram.com/gobiernodelaraoficial/",
  },
  {
    id: "logotipo_alcaldia_iribarren",
    name: "Alcaldía Bolivariana de Iribarren",
    category: "Municipio Iribarren",
    logo: "/images/aliados/logotipo_alcaldia_iribarren.png",
    url: "https://www.instagram.com/alcaldiairibarren/",
  },
  {
    id: "logotipo_iribarren_vida",
    name: "Iribarren Para la Vida",
    category: "Desarrollo y Gestión Social",
    logo: "/images/aliados/logotipo_iribarren_vida.png",
    url: "https://www.instagram.com/alcaldiairibarren/",
  },
  {
    id: "logotipo_biotel",
    name: "Biotel Suites",
    category: "Hotel Sede Oficial",
    logo: "/images/aliados/logotipo_biotel.png",
    url: "https://www.instagram.com/biotelsuitesvzla/",
  },
];

export function Sponsors() {
  return (
    <section id="aliados" className="px-4 py-20 sm:px-6 sm:py-28 bg-gradient-to-b from-white via-slate-50/60 to-white border-t border-slate-100">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Nuestros Aliados"
          title="Alianzas Estratégicas y Patrocinantes Oficiales"
          description="Agradecimiento especial a las instituciones gubernamentales y organizaciones que hacen posible este magno encuentro médico, apostando por la educación continua y el desarrollo científico de nuestra región."
        />

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-7 items-stretch">
          {SPONSORS.map((sponsor, idx) => (
            <Reveal key={sponsor.id} delay={idx * 60}>
              <a
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visitar Instagram de ${sponsor.name}`}
                className="group relative flex flex-col items-center justify-between h-full p-6 sm:p-7 bg-white hover:bg-white border border-slate-200/80 hover:border-brand-500/50 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                {/* Categoría / subtítulo */}
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 group-hover:text-brand-600 transition-colors text-center line-clamp-1 mb-3">
                  {sponsor.category}
                </span>

                {/* Contenedor del logotipo en alta resolución */}
                <div className="relative w-full h-24 sm:h-28 flex items-center justify-center p-2 my-auto">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={260}
                    height={116}
                    className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-xs"
                    priority={idx < 3}
                  />
                </div>

                {/* Pie de la tarjeta con nombre y enlace a Instagram */}
                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-slate-600 group-hover:text-brand-600 transition-colors">
                  <span className="text-xs font-semibold truncate mr-2" title={sponsor.name}>
                    {sponsor.name}
                  </span>
                  <ExternalLink
                    className="size-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

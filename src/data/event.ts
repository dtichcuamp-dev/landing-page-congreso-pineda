import {
  Building2,
  CircleParking,
  Mic,
  Presentation,
  Store,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export const EVENT = {
  shortName: "Congreso Pineda 2026",
  title:
    "XIV Congreso Pineda, LIX Jornada de Egresados y LXXII Aniversario del HCUAMP",
  dateLabel: "Del 2 al 6 de noviembre de 2026",
  /** Inicio del evento (hora de Venezuela, UTC-4) para la cuenta regresiva. */
  startsAtISO: "2026-11-02T08:30:00-04:00",
  venue: "Biotel Suites, Barquisimeto",
  institution: 'Hospital Central Universitario "Dr. Antonio María Pineda"',
} as const;

export const ABOUT = {
  review:
    'El Congreso Científico Multidisciplinario del Hospital Central Universitario "Dr. Antonio María Pineda" (HCUDAMP) es un encuentro académico y científico de alto impacto, organizado por médicos especialistas y residentes. Durante 5 jornadas, la comunidad médica se reunirá para compartir avances y reafirmar el compromiso histórico del HCUDAMP con la excelencia asistencial, la investigación y la formación médica en el occidente del país.',
  mission:
    'Impulsar la actualización médica continua y el intercambio científico multidisciplinario entre especialistas, residentes y profesionales de la salud, promoviendo el desarrollo de la investigación clínica y fortaleciendo la calidad de la atención médica desde la experiencia asistencial del Hospital Central Universitario "Dr. Antonio María Pineda".',
  vision:
    'Consolidarse como el congreso médico institucional de referencia en la región centro-occidental y a nivel nacional, reconocido por su rigor académico, el carácter multidisciplinario de sus aportes y su impacto directo en la excelencia de la práctica clínica y la docencia médica.',
  objectives: [
    "Fomentar la actualización científica.",
    "Presentar actualizaciones clínicas y quirúrgicas.",
    "Promover la investigación mediante trabajos y pósteres.",
    "Propiciar el intercambio para patologías complejas.",
    "Fortalecer el pensamiento crítico de los residentes.",
  ],
} as const;

export interface Highlight {
  icon: LucideIcon;
  value: string;
  label: string;
}

export const HIGHLIGHTS: Highlight[] = [
  { icon: Mic, value: "+100", label: "Ponencias" },
  { icon: Presentation, value: "Pósters", label: "Casos clínicos en modalidad póster" },
  { icon: Building2, value: "2", label: "Salones acondicionados" },
  { icon: Store, value: "Stands", label: "Área de stands" },
  { icon: CircleParking, value: "Parking", label: "Estacionamiento" },
  { icon: Trophy, value: "Premios", label: "Premiaciones" },
];

export const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#atractivos", label: "Atractivos" },
  { href: "#especialidades", label: "Especialidades" },
  { href: "#programa", label: "Programa" },
] as const;

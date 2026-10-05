import {
  Accessibility,
  Baby,
  Bone,
  Brain,
  Ear,
  Eye,
  HeartHandshake,
  HeartPulse,
  Pill,
  ScanFace,
  ScanLine,
  Scissors,
  Siren,
  Sparkles,
  Stethoscope,
  Syringe,
  Droplets,
  type LucideIcon,
} from "lucide-react";

export interface Specialty {
  id: string;
  name: string;
  talks: number;
  icon: LucideIcon;
}

/** Orden y cifras según la ficha oficial del congreso. */
export const SPECIALTIES: Specialty[] = [
  { id: "enfermeria", name: "Enfermería", talks: 5, icon: HeartHandshake },
  { id: "emergencia", name: "Emergencia", talks: 8, icon: Siren },
  { id: "urologia", name: "Urología", talks: 7, icon: Droplets },
  { id: "imagenes", name: "Diagnóstico por Imágenes", talks: 10, icon: ScanLine },
  { id: "rehabilitacion", name: "Medicina Física y Rehabilitación", talks: 4, icon: Accessibility },
  { id: "neurocirugia", name: "Neurocirugía", talks: 5, icon: Brain },
  { id: "ginecobstetricia", name: "Ginecobstetricia", talks: 7, icon: Baby },
  { id: "anestesiologia", name: "Anestesiología", talks: 6, icon: Syringe },
  { id: "cardiologia", name: "Cardiología", talks: 6, icon: HeartPulse },
  { id: "cirugia-plastica", name: "Cirugía Plástica", talks: 4, icon: Sparkles },
  { id: "cirugia-general", name: "Cirugía General", talks: 7, icon: Scissors },
  { id: "dermatologia", name: "Dermatología", talks: 8, icon: ScanFace },
  { id: "orl", name: "ORL", talks: 4, icon: Ear },
  { id: "oftalmologia", name: "Oftalmología", talks: 7, icon: Eye },
  { id: "medicina-interna", name: "Medicina Interna", talks: 8, icon: Stethoscope },
  { id: "traumatologia", name: "Traumatología", talks: 8, icon: Bone },
  { id: "gastroenterologia", name: "Gastroenterología", talks: 6, icon: Pill },
];

export const SPECIALTY_BY_ID: Record<string, Specialty> = Object.fromEntries(
  SPECIALTIES.map((s) => [s.id, s]),
);

export const TOTAL_TALKS = SPECIALTIES.reduce((sum, s) => sum + s.talks, 0);

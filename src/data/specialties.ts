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
  SmilePlus,
  Droplets,
  type LucideIcon,
} from "lucide-react";

export interface Specialty {
  id: string;
  name: string;
  talks: number;
  icon: LucideIcon;
}

/** Orden y cifras según el cronograma oficial del congreso (Total: 104 ponencias). */
export const SPECIALTIES: Specialty[] = [
  { id: "enfermeria", name: "Enfermería", talks: 4, icon: HeartHandshake },
  { id: "urologia", name: "Urología", talks: 6, icon: Droplets },
  { id: "emergencia", name: "Emergencia General", talks: 8, icon: Siren },
  { id: "imagenes", name: "Diagnóstico por Imágenes", talks: 6, icon: ScanLine },
  { id: "neurocirugia", name: "Neurocirugía", talks: 5, icon: Brain },
  { id: "rehabilitacion", name: "Medicina Física y Rehabilitación", talks: 4, icon: Accessibility },
  { id: "salud-mental", name: "Salud Mental", talks: 1, icon: SmilePlus },
  { id: "ginecobstetricia", name: "Ginecología y Obstetricia", talks: 7, icon: Baby },
  { id: "gastroenterologia", name: "Gastroenterología", talks: 4, icon: Pill },
  { id: "anestesiologia", name: "Anestesiología", talks: 6, icon: Syringe },
  { id: "cardiologia", name: "Cardiología", talks: 6, icon: HeartPulse },
  { id: "cirugia-plastica", name: "Cirugía Plástica", talks: 5, icon: Sparkles },
  { id: "dermatologia", name: "Dermatología", talks: 8, icon: ScanFace },
  { id: "cirugia-general", name: "Cirugía General", talks: 6, icon: Scissors },
  { id: "orl", name: "Otorrinolaringología (ORL)", talks: 5, icon: Ear },
  { id: "medicina-interna", name: "Medicina Interna", talks: 8, icon: Stethoscope },
  { id: "oftalmologia", name: "Oftalmología", talks: 7, icon: Eye },
  { id: "traumatologia", name: "Traumatología", talks: 8, icon: Bone },
];

export const SPECIALTY_BY_ID: Record<string, Specialty> = Object.fromEntries(
  SPECIALTIES.map((s) => [s.id, s]),
);

export const TOTAL_TALKS = SPECIALTIES.reduce((sum, s) => sum + s.talks, 0);

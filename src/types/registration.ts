import type { ParticipantTypeId } from "@/data/pricing";

export interface RegistrationValues {
  nombres: string;
  apellidos: string;
  nacionalidad: "V" | "E";
  cedula: string;
  telefono: string;
  correo: string;
  tipoParticipante: ParticipantTypeId | "";
  institucion: string;
  jornadas: string[];
  comprobante: File | null;
  /** Honeypot anti-spam: debe permanecer vacío. */
  website: string;
}

export type FieldErrors = Partial<Record<keyof RegistrationValues, string>>;

export const EMPTY_VALUES: RegistrationValues = {
  nombres: "",
  apellidos: "",
  nacionalidad: "V",
  cedula: "",
  telefono: "",
  correo: "",
  tipoParticipante: "",
  institucion: "",
  jornadas: [],
  comprobante: null,
  website: "",
};

export interface RegistrationResult {
  id: string;
  total: number;
  exonerated: boolean;
}

/** Payload JSON que recibe `doPost` en Google Apps Script. */
export interface RegistrationPayload {
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  correo: string;
  tipoParticipante: ParticipantTypeId;
  institucion: string;
  jornadas: string[];
  /** Monto calculado en cliente (solo informativo: el servidor lo recalcula). */
  montoCliente: number;
  website: string;
  comprobante: { nombre: string; mimeType: string; base64: string } | null;
}

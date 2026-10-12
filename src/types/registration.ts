export type InstitucionOrigen = "HCUAMP" | "OTRA";

export type ParticipantTypeHCUAMP =
  | "bachiller"
  | "enfermero"
  | "residente"
  | "acompanante"
  | "medico_general"
  | "tecnico_radiologo"
  | "optometrista"
  | "especialista"
  | "terapeutas"
  | "conferencista"
  | "residente_ultimo_anio";

export type ParticipantTypeOtra =
  | "medico_general_especialista"
  | "medico_residente"
  | "enfermero_otra"
  | "terapeutas_otra"
  | "otro_personal_afin"
  | "acompanante_otra";

export type ParticipantTypeId = ParticipantTypeHCUAMP | ParticipantTypeOtra;

export type SalonId = "principal" | "alterno";

export interface TurnosPorDia {
  manana?: SalonId;
  tarde?: SalonId;
}

/** Mapeo de fecha ISO (ej: '2026-11-02') a turnos seleccionados */
export type SeleccionTurnos = Record<string, TurnosPorDia>;

export interface RegistrationValues {
  // Institución y origen
  origenInstitucion: InstitucionOrigen;
  institucion: string;

  // Datos personales
  nombres: string;
  apellidos: string;
  nacionalidad: "V" | "E";
  cedula: string;
  sexo: "M" | "F" | "";
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  pais: string;
  estado: string;
  municipio: string;
  parroquia: string;

  // Formas de participación
  tipoParticipante: ParticipantTypeId | "";
  nombrePonencia?: string; // Requerido si es conferencista
  especialidad?: string; // Requerido si es residente de último año

  // Días, turnos y salones
  turnos: SeleccionTurnos;

  // Comprobante y términos
  comprobante: File | null;
  aceptaTerminos: boolean; // Términos en paso 2
  aceptaTerminosPago: boolean; // Términos en paso 3 (no reembolsable)

  /** Honeypot anti-spam: debe permanecer vacío. */
  website: string;
}

export type FieldErrors = Partial<Record<keyof RegistrationValues, string>>;

export const EMPTY_VALUES: RegistrationValues = {
  origenInstitucion: "HCUAMP",
  institucion: "Hospital Central Universitario Dr. Antonio María Pineda (HCUAMP)",
  nombres: "",
  apellidos: "",
  nacionalidad: "V",
  cedula: "",
  sexo: "",
  fechaNacimiento: "",
  telefono: "",
  correo: "",
  pais: "Venezuela",
  estado: "Lara",
  municipio: "Iribarren",
  parroquia: "Concepción",
  tipoParticipante: "",
  nombrePonencia: "",
  especialidad: "",
  turnos: {},
  comprobante: null,
  aceptaTerminos: false,
  aceptaTerminosPago: false,
  website: "",
};

export interface RegistrationResult {
  id: string;
  total: number;
  exonerated: boolean;
}

/** Payload JSON que recibe `doPost` en Google Apps Script. */
export interface RegistrationPayload {
  origenInstitucion: InstitucionOrigen;
  institucion: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  sexo: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  tipoParticipante: ParticipantTypeId;
  nombrePonencia?: string;
  especialidad?: string;
  pais: string;
  estado: string;
  municipio: string;
  parroquia: string;
  turnos: SeleccionTurnos;
  diasSeleccionados: string[];
  resumenTurnos: string;
  /** Monto calculado en cliente (informativo: el servidor recalcula). */
  montoCliente: number;
  website: string;
  comprobante: { nombre: string; mimeType: string; base64: string } | null;
}

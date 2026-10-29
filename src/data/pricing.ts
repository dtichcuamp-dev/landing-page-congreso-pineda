import type {
  InstitucionOrigen,
  ParticipantTypeId,
  ParticipantTypeHCUAMP,
  ParticipantTypeOtra,
  SeleccionTurnos,
} from "@/types/registration";

export interface ParticipantTypeInfo {
  id: ParticipantTypeId;
  label: string;
  /** Tarifa USD por día. 0 = exonerado. */
  rate: number;
  description?: string;
}

/** Tipos de participantes para personal del HCUAMP (100% Exonerados). */
export const PARTICIPANT_TYPES_HCUAMP: ParticipantTypeInfo[] = [
  { id: "bachiller", label: "Bachiller", rate: 0 },
  { id: "enfermero", label: "Enfermero/a", rate: 0 },
  { id: "residente", label: "Residente", rate: 0 },
  { id: "acompanante", label: "Acompañante", rate: 0 },
  { id: "medico_general", label: "Médico general", rate: 0 },
  { id: "tecnico_radiologo", label: "Técnico radiólogo", rate: 0 },
  { id: "optometrista", label: "Optometrista", rate: 0 },
  { id: "especialista", label: "Médico especialista", rate: 0 },
  { id: "terapeutas", label: "Fisioterapeuta / Terapeuta Ocupacional / Otros Terapeutas", rate: 0 },
  { id: "psicologo_psiquiatra", label: "Psicólogo/Psiquiatra", rate: 0 },
  { id: "conferencista", label: "Conferencista", rate: 0 },
  { id: "residente_ultimo_anio", label: "Residente de último año", rate: 0 },
];

/** Tipos de participantes para Otras Instituciones (Tarifas por día). */
export const PARTICIPANT_TYPES_OTRA: ParticipantTypeInfo[] = [
  { id: "estudiante_pregrado_otra", label: "Bachiller / Estudiante de pregrado", rate: 0 },
  { id: "medico_general_especialista", label: "Médico general y especialista", rate: 20 },
  { id: "medico_residente", label: "Médico residente", rate: 15 },
  { id: "enfermero_otra", label: "Enfermera/o", rate: 10 },
  { id: "terapeutas_otra", label: "Fisioterapeuta / Terapeuta Ocupacional / Otros Terapeutas", rate: 15 },
  { id: "psicologo_psiquiatra_otra", label: "Psicólogo/Psiquiatra", rate: 15 },
  { id: "otro_personal_afin", label: "Otro personal afín", rate: 15 },
  { id: "acompanante_otra", label: "Acompañante", rate: 15 },
];

/** Categorías de participantes cuyo registro ha sido cerrado oficialmente */
export const CLOSED_PARTICIPANT_TYPE_IDS = [
  "bachiller",
  "acompanante",
  "conferencista",
  "estudiante_pregrado_otra",
  "acompanante_otra",
] as const;

export const CLOSED_PARTICIPANT_TYPES = new Set<string>(CLOSED_PARTICIPANT_TYPE_IDS);

export const isParticipantTypeClosed = (id: string): boolean =>
  CLOSED_PARTICIPANT_TYPES.has(id);

/** Tipos de participantes para personal del HCUAMP habilitados para registro público */
export const ACTIVE_PARTICIPANT_TYPES_HCUAMP = PARTICIPANT_TYPES_HCUAMP.filter(
  (p) => !CLOSED_PARTICIPANT_TYPES.has(p.id)
);

/** Tipos de participantes para Otras Instituciones habilitados para registro público */
export const ACTIVE_PARTICIPANT_TYPES_OTRA = PARTICIPANT_TYPES_OTRA.filter(
  (p) => !CLOSED_PARTICIPANT_TYPES.has(p.id)
);

export const ALL_PARTICIPANT_TYPES: ParticipantTypeInfo[] = [
  ...PARTICIPANT_TYPES_HCUAMP,
  ...PARTICIPANT_TYPES_OTRA,
];

export const PARTICIPANT_BY_ID = Object.fromEntries(
  ALL_PARTICIPANT_TYPES.map((p) => [p.id, p]),
) as Record<ParticipantTypeId, ParticipantTypeInfo>;

/** Aliases para retrocompatibilidad */
export const PARTICIPANT_TYPES = ALL_PARTICIPANT_TYPES;

export const ESPECIALIDADES_CONGRESO = [
  "Anestesiología",
  "Cardiología",
  "Cirugía General",
  "Cirugía Plástica",
  "Dermatología",
  "Diagnóstico por Imágenes",
  "Emergencia",
  "Enfermería",
  "Gastroenterología",
  "Ginecología y Obstetricia",
  "Medicina Física y Rehabilitación",
  "Medicina Interna",
  "Neurocirugía",
  "Oftalmología",
  "Otorrinolaringología",
  "Salud Mental",
  "Traumatología",
  "Urología",
] as const;

export interface CongresoDay {
  id: string; // "2026-11-02"
  day: number;
  weekday: string;
  dateLabel: string;
  shortLabel: string;
}

export const DAYS_CONGRESO: CongresoDay[] = [
  { id: "2026-11-02", day: 2, weekday: "Lunes", dateLabel: "Lunes 02 de noviembre", shortLabel: "Lun 02/11" },
  { id: "2026-11-03", day: 3, weekday: "Martes", dateLabel: "Martes 03 de noviembre", shortLabel: "Mar 03/11" },
  { id: "2026-11-04", day: 4, weekday: "Miércoles", dateLabel: "Miércoles 04 de noviembre", shortLabel: "Mié 04/11" },
  { id: "2026-11-05", day: 5, weekday: "Jueves", dateLabel: "Jueves 05 de noviembre", shortLabel: "Jue 05/11" },
  { id: "2026-11-06", day: 6, weekday: "Viernes", dateLabel: "Viernes 06 de noviembre", shortLabel: "Vie 06/11" },
];

/** Aliases para compatibilidad con código existente */
export const JORNADAS = DAYS_CONGRESO.map((d) => ({
  id: d.id,
  day: d.day,
  label: `${d.weekday} ${String(d.day).padStart(2, "0")}/11 · Todo el día`,
}));

export const CAPACIDADES_SALON = {
  principal: 240,
  alterno: 60,
} as const;

export const TURNOS_HORARIOS = {
  manana: {
    key: "manana" as const,
    label: "Mañana (08:00 a 12:45)",
    shortLabel: "Mañana",
    horario: "08:00 a 12:45",
  },
  tarde: {
    key: "tarde" as const,
    label: "Tarde (13:00 a 18:00)",
    shortLabel: "Tarde",
    horario: "13:00 a 18:00",
  },
} as const;

export const SALONES_INFO = {
  principal: {
    key: "principal" as const,
    name: "Salón Principal (1)",
    shortName: "Salón (1)",
    capacity: 240,
    alertThresholds: [160, 180, 200, 220] as const,
  },
  alterno: {
    key: "alterno" as const,
    name: "Salón Alterno (2)",
    shortName: "Salón (2)",
    capacity: 60,
    alertThresholds: [35, 40, 45, 50] as const,
  },
} as const;

export type SalonKey = keyof typeof SALONES_INFO;
export type TurnoKey = keyof typeof TURNOS_HORARIOS;

export interface AforoAlert {
  level: "info" | "warning" | "danger" | "max";
  threshold: number;
  text: string;
}

export function computeAforoAlert(salonKey: SalonKey, occupancy: number): AforoAlert | null {
  const cap = SALONES_INFO[salonKey]?.capacity || (salonKey === "alterno" ? 60 : 240);
  const remaining = Math.max(0, cap - occupancy);
  if (salonKey === "principal") {
    if (occupancy >= 240) {
      return { level: "max", threshold: 240, text: "Aforo Máximo Completado (240 puestos). Salón lleno." };
    }
    if (occupancy >= 220) {
      return { level: "danger", threshold: 220, text: `Alerta Crítica: 220 puestos completados. Solo quedan ${remaining} puestos disponibles en Salón Principal (1).` };
    }
    if (occupancy >= 200) {
      return { level: "warning", threshold: 200, text: `Alerta de Aforo: 200 puestos completados en Salón Principal (1). Quedan ${remaining} puestos disponibles.` };
    }
    if (occupancy >= 180) {
      return { level: "warning", threshold: 180, text: `Alerta de Aforo: 180 puestos completados en Salón Principal (1). Quedan ${remaining} puestos disponibles.` };
    }
    if (occupancy >= 160) {
      return { level: "info", threshold: 160, text: `Alerta de Aforo: 160 puestos completados en Salón Principal (1). Quedan ${remaining} puestos disponibles.` };
    }
  } else {
    if (occupancy >= 60) {
      return { level: "max", threshold: 60, text: "Aforo Máximo Completado (60 puestos). Salón lleno." };
    }
    if (occupancy >= 50) {
      return { level: "danger", threshold: 50, text: `Alerta Crítica: 50 puestos completados. Solo quedan ${remaining} puestos disponibles en Salón Alterno (2).` };
    }
    if (occupancy >= 45) {
      return { level: "warning", threshold: 45, text: `Alerta de Aforo: 45 puestos completados en Salón Alterno (2). Quedan ${remaining} puestos disponibles.` };
    }
    if (occupancy >= 40) {
      return { level: "warning", threshold: 40, text: `Alerta de Aforo: 40 puestos completados en Salón Alterno (2). Quedan ${remaining} puestos disponibles.` };
    }
    if (occupancy >= 35) {
      return { level: "info", threshold: 35, text: `Alerta de Aforo: 35 puestos completados en Salón Alterno (2). Quedan ${remaining} puestos disponibles.` };
    }
  }
  return null;
}

/**
 * Calcula los días seleccionados y el total a pagar.
 * El pago es POR DÍA (cubriendo 1 o 2 turnos de ese día).
 * Si la institución es HCUAMP, el monto es 0$ (exonerado).
 */
export function calcTotal(
  tipoId: ParticipantTypeId | "",
  turnosOrJornadas: SeleccionTurnos | string[],
  origen: InstitucionOrigen = "HCUAMP",
) {
  // Obtener los días activos
  let diasActivos: string[] = [];
  let turnosCount = 0;

  if (Array.isArray(turnosOrJornadas)) {
    diasActivos = turnosOrJornadas;
    turnosCount = diasActivos.length;
  } else {
    for (const [diaId, t] of Object.entries(turnosOrJornadas)) {
      const hasManana = !!t.manana;
      const hasTarde = !!t.tarde;
      if (hasManana || hasTarde) {
        diasActivos.push(diaId);
      }
      if (hasManana) turnosCount++;
      if (hasTarde) turnosCount++;
    }
  }

  const diasCount = diasActivos.length;
  const isHcuamp = origen === "HCUAMP";
  const type = tipoId ? PARTICIPANT_BY_ID[tipoId] : undefined;
  const rate = isHcuamp ? 0 : (type?.rate ?? 0);
  const total = isHcuamp ? 0 : rate * diasCount;

  return {
    rate,
    diasCount,
    count: diasCount, // compatibilidad
    turnosCount,
    diasActivos,
    total,
    exonerated: isHcuamp || total === 0,
    hasPromo: false,
  };
}

export const usd = (n: number) =>
  new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

/** Datos bancarios oficiales para el pago del congreso */
export interface BankPaymentField {
  label: string;
  value: string;
  copyable?: boolean;
}

export const BANK_TRANSFER_DETAILS: BankPaymentField[] = [
  { label: "Modalidad", value: "Pago en bolívares a tasa oficial BCV del día" },
  { label: "Banco", value: "BANCAMIGA (0172)", copyable: true },
  { label: "Tipo de Cuenta", value: "Cuenta Corriente" },
  { label: "Número de Cuenta", value: "01720302973028756199", copyable: true },
  { label: "Titular", value: "LOS HÉROES DE LA SALUD C.A.", copyable: true },
  { label: "RIF", value: "J-503798424", copyable: true },
];

/** Aliases para retrocompatibilidad */
export const PAYMENT_INFO = BANK_TRANSFER_DETAILS;

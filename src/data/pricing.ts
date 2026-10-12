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
  { id: "conferencista", label: "Conferencista", rate: 0 },
  { id: "residente_ultimo_anio", label: "Residente de último año", rate: 0 },
];

/** Tipos de participantes para Otras Instituciones (Tarifas por día). */
export const PARTICIPANT_TYPES_OTRA: ParticipantTypeInfo[] = [
  { id: "medico_general_especialista", label: "Médico general y especialista", rate: 20 },
  { id: "medico_residente", label: "Médico residente", rate: 15 },
  { id: "enfermero_otra", label: "Enfermera/o", rate: 10 },
  { id: "terapeutas_otra", label: "Fisioterapeuta / Terapeuta Ocupacional / Otros Terapeutas", rate: 15 },
  { id: "otro_personal_afin", label: "Otro personal afín", rate: 15 },
  { id: "acompanante_otra", label: "Acompañante", rate: 15 },
];

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

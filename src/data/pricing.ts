/**
 * Tarifas (USD, al cambio BCV) POR JORNADA (mañana o tarde).
 *
 * ⚠️ Si cambias una tarifa aquí, actualiza también `RATES` en
 *    apps-script/Codigo.gs (el servidor recalcula el monto y no confía
 *    en el cliente).
 */

export type ParticipantTypeId =
  | "bachiller"
  | "enfermero"
  | "residente"
  | "acompanante"
  | "medico_general"
  | "tecnico_radiologo"
  | "optometrista"
  | "especialista"
  | "conferencista"
  | "residente_ultimo_anio";

export interface ParticipantType {
  id: ParticipantTypeId;
  label: string;
  /** Tarifa USD por jornada. 0 = exonerado. */
  rate: number;
}

export const PARTICIPANT_TYPES: ParticipantType[] = [
  { id: "bachiller", label: "Bachiller", rate: 10 },
  { id: "enfermero", label: "Enfermero/a", rate: 10 },
  { id: "residente", label: "Residente", rate: 15 },
  { id: "acompanante", label: "Acompañante", rate: 15 },
  { id: "medico_general", label: "Médico general", rate: 20 },
  { id: "tecnico_radiologo", label: "Técnico radiólogo", rate: 20 },
  { id: "optometrista", label: "Optometrista", rate: 20 },
  { id: "especialista", label: "Médico especialista", rate: 30 },
  { id: "conferencista", label: "Conferencista", rate: 0 },
  { id: "residente_ultimo_anio", label: "Residente de último año", rate: 0 },
];

export const PARTICIPANT_BY_ID = Object.fromEntries(
  PARTICIPANT_TYPES.map((p) => [p.id, p]),
) as Record<ParticipantTypeId, ParticipantType>;

export type Turno = "manana" | "tarde";

export interface Jornada {
  /** Formato AAAA-MM-DD-M|T  (ej. 2026-11-02-M) */
  id: string;
  day: number; // día de noviembre
  turno: Turno;
  label: string; // "Lun 02/11 · Mañana"
}

const DAYS = [
  { day: 2, weekday: "Lun" },
  { day: 3, weekday: "Mar" },
  { day: 4, weekday: "Mié" },
  { day: 5, weekday: "Jue" },
  { day: 6, weekday: "Vie" },
];

export const JORNADAS: Jornada[] = DAYS.flatMap(({ day, weekday }) =>
  (["manana", "tarde"] as Turno[]).map((turno) => {
    const dd = String(day).padStart(2, "0");
    return {
      id: `2026-11-${dd}-${turno === "manana" ? "M" : "T"}`,
      day,
      turno,
      label: `${weekday} ${dd}/11 · ${turno === "manana" ? "Mañana" : "Tarde"}`,
    };
  }),
);

export const DAYS_META = DAYS;

export function calcTotal(typeId: ParticipantTypeId | "", jornadaIds: string[]) {
  const type = typeId ? PARTICIPANT_BY_ID[typeId] : undefined;
  const count = jornadaIds.length;
  const rate = type?.rate ?? 0;
  return {
    rate,
    count,
    total: rate * count,
    exonerated: !!type && type.rate === 0,
  };
}

export const usd = (n: number) =>
  new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Datos para el pago. Rellenar con los datos reales de la comisión.
 * (El archivo "Congreso Pineda 2026.txt" tiene "Pagos a BCV:" en blanco.)
 */
export const PAYMENT_INFO: { label: string; value: string }[] = [
  { label: "Modalidad", value: "Pago en bolívares al cambio BCV del día" },
  { label: "Banco", value: "POR DEFINIR" },
  { label: "Pago móvil / Cuenta", value: "POR DEFINIR" },
  { label: "Titular / RIF", value: "POR DEFINIR" },
];

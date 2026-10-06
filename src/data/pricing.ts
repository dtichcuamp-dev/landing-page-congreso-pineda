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

export interface Jornada {
  /** Formato AAAA-MM-DD  (ej. 2026-11-02) */
  id: string;
  day: number; // día de noviembre
  label: string; // "Lun 02/11 · Todo el día"
}

const DAYS = [
  { day: 2, weekday: "Lun" },
  { day: 3, weekday: "Mar" },
  { day: 4, weekday: "Mié" },
  { day: 5, weekday: "Jue" },
  { day: 6, weekday: "Vie" },
];

export const JORNADAS: Jornada[] = DAYS.map(({ day, weekday }) => {
  const dd = String(day).padStart(2, "0");
  return {
    id: `2026-11-${dd}`,
    day,
    label: `${weekday} ${dd}/11 · Todo el día`,
  };
});

export const DAYS_META = DAYS;

export function calcTotal(typeId: ParticipantTypeId | "", jornadaIds: string[]) {
  const type = typeId ? PARTICIPANT_BY_ID[typeId] : undefined;
  const count = jornadaIds.length;
  const rate = type?.rate ?? 0;
  
  let total = rate * count;
  let hasPromo = false;

  // Paquete promocional para bachilleres: 5 días por 40$ (en lugar de 50$)
  if (typeId === "bachiller" && count === 5) {
    total = 40;
    hasPromo = true;
  }

  return {
    rate,
    count,
    total,
    hasPromo,
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
  { label: "Banco", value: "BANCAMIGA" },
  { label: "Cuenta", value: "01720302973028756199" },
  { label: "Titular", value: "LOS HÉROES DE LA SALUD C.A." },
  { label: "RIF", value: "J-503798424" },
];

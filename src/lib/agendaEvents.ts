/** Canal ligero de comunicación entre Fichas de Especialidad y Agenda. */
export const AGENDA_FOCUS_EVENT = "agenda:focus";

export interface AgendaFocusDetail {
  dayIndex: number;
  specialtyId: string;
}

export function focusAgenda(detail: AgendaFocusDetail) {
  window.dispatchEvent(new CustomEvent<AgendaFocusDetail>(AGENDA_FOCUS_EVENT, { detail }));
  document.getElementById("programa")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

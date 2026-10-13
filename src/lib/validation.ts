import { calcTotal } from "@/data/pricing";
import type { FieldErrors, RegistrationValues } from "@/types/registration";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // Se comprime en cliente
export const MAX_PDF_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_FILES = "image/png,image/jpeg,image/webp,application/pdf";

const NAME_RE = /^[\p{L}][\p{L}\s'.\-]{1,59}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Normaliza teléfonos venezolanos: +58 412-1234567 → 04121234567 */
export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("58") && d.length === 12) d = "0" + d.slice(2);
  return d;
}

export const cleanCedula = (raw: string) => raw.replace(/\D/g, "");

export function validateStep(step: number, v: RegistrationValues): FieldErrors {
  const e: FieldErrors = {};

  // ───── Paso 1: Datos Personales y de Origen ─────
  if (step === 0) {
    if (v.origenInstitucion === "OTRA" && v.institucion.trim().length < 2) {
      e.institucion = "Indica el nombre de tu institución de origen.";
    }

    const ced = cleanCedula(v.cedula);
    if (ced.length < 5 || ced.length > 9) {
      e.cedula = "Cédula inválida (5 a 9 dígitos).";
    }

    if (!NAME_RE.test(v.nombres.trim())) {
      e.nombres = "Ingresa tus nombres (solo letras).";
    }
    if (!NAME_RE.test(v.apellidos.trim())) {
      e.apellidos = "Ingresa tus apellidos (solo letras).";
    }

    if (!v.sexo) e.sexo = "Selecciona tu sexo.";
    if (!v.fechaNacimiento) e.fechaNacimiento = "Indica tu fecha de nacimiento.";

    if (!/^0(2\d{2}|4(12|14|16|24|26))\d{7}$/.test(normalizePhone(v.telefono))) {
      e.telefono = "Número inválido. Ej.: 0414-1234567";
    }

    if (!EMAIL_RE.test(v.correo.trim())) {
      e.correo = "Correo electrónico inválido.";
    }

    if (v.pais.trim().length < 2) e.pais = "Indica el país.";
    if (v.estado.trim().length < 2) e.estado = "Indica el estado.";
    if (v.municipio.trim().length < 2) e.municipio = "Indica el municipio.";
    if (v.parroquia.trim().length < 2) e.parroquia = "Indica la parroquia.";
  }

  // ───── Paso 2: Formas de Participación ─────
  if (step === 1) {
    if (!v.tipoParticipante) {
      e.tipoParticipante = "Selecciona tu tipo de participante.";
    }

    if (v.origenInstitucion === "HCUAMP") {
      if (v.tipoParticipante === "conferencista" && (!v.nombrePonencia || v.nombrePonencia.trim().length < 3)) {
        e.nombrePonencia = "Indica el título o nombre de tu ponencia.";
      }
      if (v.tipoParticipante === "residente_ultimo_anio" && !v.especialidad) {
        e.especialidad = "Selecciona la especialidad del Congreso a la que perteneces.";
      }
    }

    const { diasCount, exonerated } = calcTotal(v.tipoParticipante, v.turnos, v.origenInstitucion);
    if (diasCount === 0) {
      // Usamos un mensaje descriptivo en turnos
      (e as Record<string, string>).turnos = "Debes seleccionar al menos un día y turno (mañana y/o tarde) de asistencia.";
    }

    // Para participantes exonerados (HCUAMP o Bachiller/Estudiante de pregrado), el paso 2 es el final y requiere aceptación de términos
    if (exonerated && !v.aceptaTerminos) {
      e.aceptaTerminos = "Debes aceptar los términos y condiciones para enviar tu inscripción.";
    }
  }

  // ───── Paso 3: Pago (solo para Otra Institución cuando el total > 0) ─────
  if (step === 2) {
    const { total } = calcTotal(v.tipoParticipante, v.turnos, v.origenInstitucion);
    const f = v.comprobante;

    if (total > 0 && !f) {
      e.comprobante = "Adjunta el comprobante de pago bancario.";
    } else if (f) {
      const isPdf = f.type === "application/pdf";
      const isImg = /^image\/(png|jpe?g|webp)$/.test(f.type);
      if (!isPdf && !isImg) {
        e.comprobante = "Formato no válido. Usa imagen (JPG/PNG/WebP) o PDF.";
      } else if (isPdf && f.size > MAX_PDF_BYTES) {
        e.comprobante = "El PDF supera 4 MB. Envía una captura o un archivo más liviano.";
      } else if (isImg && f.size > MAX_IMAGE_BYTES) {
        e.comprobante = "La imagen supera 10 MB.";
      }
    }

    if (total > 0 && !v.aceptaTerminosPago) {
      e.aceptaTerminosPago = "Debes aceptar los términos y certificar que los datos son veraces y no reembolsables.";
    }
  }

  return e;
}

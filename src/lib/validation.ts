import { calcTotal } from "@/data/pricing";
import type { FieldErrors, RegistrationValues } from "@/types/registration";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // se comprime antes de enviar
export const MAX_PDF_BYTES = 3 * 1024 * 1024;
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

  if (step === 0) {
    if (!NAME_RE.test(v.nombres.trim())) e.nombres = "Ingresa tus nombres (solo letras).";
    if (!NAME_RE.test(v.apellidos.trim())) e.apellidos = "Ingresa tus apellidos (solo letras).";

    const ced = cleanCedula(v.cedula);
    if (ced.length < 5 || ced.length > 9) e.cedula = "Cédula inválida (5 a 9 dígitos).";

    if (!v.sexo) e.sexo = "Selecciona tu sexo.";
    if (!v.fechaNacimiento) e.fechaNacimiento = "Indica tu fecha de nacimiento.";

    if (!/^0(2\d{2}|4(12|14|16|24|26))\d{7}$/.test(normalizePhone(v.telefono)))
      e.telefono = "Número inválido. Ej.: 0414-1234567";

    if (!EMAIL_RE.test(v.correo.trim())) e.correo = "Correo electrónico inválido.";
  }

  if (step === 1) {
    if (!v.tipoParticipante) e.tipoParticipante = "Selecciona tu tipo de participante.";
    if (v.institucion.trim().length < 2) e.institucion = "Indica tu institución de origen.";
    if (v.pais.trim().length < 2) e.pais = "Indica tu país.";
    if (v.estado.trim().length < 2) e.estado = "Indica tu estado.";
    if (v.municipio.trim().length < 2) e.municipio = "Indica tu municipio.";
    if (v.parroquia.trim().length < 2) e.parroquia = "Indica tu parroquia.";
    if (v.jornadas.length === 0) e.jornadas = "Selecciona al menos un día.";
  }

  if (step === 2) {
    const { total } = calcTotal(v.tipoParticipante, v.jornadas);
    const f = v.comprobante;
    if (total > 0 && !f) {
      e.comprobante = "Adjunta el comprobante de pago.";
    } else if (f) {
      const isPdf = f.type === "application/pdf";
      const isImg = /^image\/(png|jpe?g|webp)$/.test(f.type);
      if (!isPdf && !isImg) e.comprobante = "Formato no válido. Usa imagen (JPG/PNG/WebP) o PDF.";
      else if (isPdf && f.size > MAX_PDF_BYTES) e.comprobante = "El PDF supera 3 MB. Envía una captura o un archivo más liviano.";
      else if (isImg && f.size > MAX_IMAGE_BYTES) e.comprobante = "La imagen supera 10 MB.";
    }
    if (!v.aceptaTerminos) e.aceptaTerminos = "Debes aceptar los términos y condiciones.";
  }

  return e;
}

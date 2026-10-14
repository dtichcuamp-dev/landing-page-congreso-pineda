import { calcTotal, DAYS_CONGRESO, PARTICIPANT_BY_ID } from "@/data/pricing";
import type {
  ParticipantTypeId,
  RegistrationPayload,
  RegistrationResult,
  RegistrationValues,
} from "@/types/registration";
import { cleanCedula, normalizePhone } from "./validation";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Reduce imágenes a ≤1600 px y JPEG 0.82 para un envío rápido y ligero a Apps Script. */
async function compressImage(file: File): Promise<Blob> {
  const MAX = 1600;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ApiError("No se pudo procesar la imagen.");
  ctx.fillStyle = "#fff"; // evita fondo negro en PNG transparentes
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new ApiError("No se pudo comprimir la imagen."))), "image/jpeg", 0.82),
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new ApiError("No se pudo leer el archivo."));
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.readAsDataURL(blob);
  });
}

async function buildFilePayload(file: File | null): Promise<RegistrationPayload["comprobante"]> {
  if (!file) return null;
  if (file.type === "application/pdf") {
    return { nombre: file.name, mimeType: file.type, base64: await blobToBase64(file) };
  }
  const blob = await compressImage(file);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "comprobante";
  return { nombre: `${baseName}.jpg`, mimeType: "image/jpeg", base64: await blobToBase64(blob) };
}

export interface HcuampLookupResult {
  found: boolean;
  data?: {
    nombres: string;
    apellidos: string;
    sexo: "M" | "F" | "";
    fechaNacimiento: string;
    telefono: string;
  };
  message?: string;
}

/**
 * Consulta en la hoja "Personal HCUAMP" mediante Apps Script por número de cédula.
 */
export async function lookupHcuamp(cedula: string): Promise<HcuampLookupResult> {
  const url = process.env.NEXT_PUBLIC_GAS_URL;
  if (!url) return { found: false };

  const digits = cleanCedula(cedula);
  if (!digits || digits.length < 5) return { found: false };

  try {
    const res = await fetch(`${url}?action=lookup_hcuamp&cedula=${encodeURIComponent(digits)}`, {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();
    if (data && data.ok && data.found && data.data) {
      return {
        found: true,
        data: {
          nombres: data.data.nombres || "",
          apellidos: data.data.apellidos || "",
          sexo: data.data.sexo === "M" || data.data.sexo === "F" ? data.data.sexo : "",
          fechaNacimiento: data.data.fechaNacimiento || "",
          telefono: data.data.telefono || "",
        },
      };
    }
    return { found: false, message: data?.note };
  } catch (err) {
    console.warn("Error consultando nómina HCUAMP:", err);
    return { found: false };
  }
}

export interface ExistingRegistrationInfo {
  registered: boolean;
  by?: "cedula" | "correo";
  id?: string;
  fecha?: string;
  nombres?: string;
  apellidos?: string;
  cedula?: string;
  correo?: string;
  message?: string;
}

/**
 * Consulta si un participante ya se encuentra registrado por Cédula o Correo.
 * Previene la duplicación de inscripciones y la pérdida de cupos para otros asistentes.
 */
export async function checkExistingRegistration(
  cedula: string,
  correo?: string
): Promise<ExistingRegistrationInfo> {
  const url = process.env.NEXT_PUBLIC_GAS_URL;
  if (!url) return { registered: false };

  const digits = cleanCedula(cedula);
  if (!digits && !correo) return { registered: false };

  try {
    const params = new URLSearchParams({
      action: "check_registration",
    });
    if (digits) params.append("cedula", digits);
    if (correo && correo.trim()) params.append("correo", correo.trim().toLowerCase());

    const res = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();
    if (data && data.ok && data.registered) {
      return {
        registered: true,
        by: data.by,
        id: data.data?.id,
        fecha: data.data?.fecha,
        nombres: data.data?.nombres,
        apellidos: data.data?.apellidos,
        cedula: data.data?.cedula,
        correo: data.data?.correo,
        message: data.message,
      };
    }
    return { registered: false };
  } catch (err) {
    console.warn("Error consultando registro previo:", err);
    return { registered: false };
  }
}

/**
 * Consulta la disponibilidad de aforo en tiempo real.
 */
export async function getCapacities(): Promise<Record<string, number>> {
  const url = process.env.NEXT_PUBLIC_GAS_URL;
  if (!url) return {};

  try {
    const res = await fetch(`${url}?action=get_capacities`, {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();
    if (data && data.ok && data.occupied) {
      return data.occupied;
    }
    return {};
  } catch (err) {
    console.warn("Error consultando cupos:", err);
    return {};
  }
}

export async function submitRegistration(v: RegistrationValues): Promise<RegistrationResult> {
  const url = process.env.NEXT_PUBLIC_GAS_URL;
  if (!url) {
    throw new ApiError(
      "El sistema de inscripción aún no está configurado (falta NEXT_PUBLIC_GAS_URL).",
    );
  }

  const { total, diasActivos } = calcTotal(v.tipoParticipante, v.turnos, v.origenInstitucion);

  // Construir resumen legible de turnos
  const partes: string[] = [];
  for (const diaId of diasActivos) {
    const diaMeta = DAYS_CONGRESO.find((d) => d.id === diaId);
    const labelDia = diaMeta ? diaMeta.shortLabel : diaId;
    const t = v.turnos[diaId];
    if (t) {
      const sub: string[] = [];
      if (t.manana) sub.push(`Mañana: ${t.manana === "principal" ? "Salón Principal (1)" : "Salón Alterno (2)"}`);
      if (t.tarde) sub.push(`Tarde: ${t.tarde === "principal" ? "Salón Principal (1)" : "Salón Alterno (2)"}`);
      if (sub.length > 0) partes.push(`${labelDia} (${sub.join(", ")})`);
    }
  }

  const isTerapeuta = v.tipoParticipante === "terapeutas" || v.tipoParticipante === "terapeutas_otra";
  const isPregradoOtra = v.tipoParticipante === "estudiante_pregrado_otra";
  const tipoLabel =
    PARTICIPANT_BY_ID[v.tipoParticipante as ParticipantTypeId]?.label ||
    (isTerapeuta
      ? "Fisioterapeuta / Terapeuta Ocupacional / Otros Terapeutas"
      : isPregradoOtra
        ? "Bachiller / Estudiante de pregrado"
        : v.tipoParticipante);

  const institucionUpper = (
    v.origenInstitucion === "HCUAMP"
      ? "HOSPITAL CENTRAL UNIVERSITARIO DR. ANTONIO MARÍA PINEDA (HCUAMP)"
      : v.institucion.trim()
  ).toUpperCase();

  const payload: RegistrationPayload = {
    origenInstitucion: v.origenInstitucion,
    institucion: institucionUpper,
    nombres: v.nombres.trim().toUpperCase(),
    apellidos: v.apellidos.trim().toUpperCase(),
    cedula: `${v.nacionalidad}-${cleanCedula(v.cedula)}`,
    sexo: v.sexo,
    fechaNacimiento: v.fechaNacimiento,
    telefono: normalizePhone(v.telefono),
    correo: v.correo.trim().toLowerCase(),
    // Para garantizar compatibilidad inmediata con la versión actualmente desplegada en Google Apps Script:
    // - Para terapeutas: 'otro_personal_afin' (15$ para otras instituciones, 0$ para HCUAMP)
    // - Para pregrado: 'bachiller' (0$ exonerado total)
    // En ambos casos adjuntamos 'tipoLabel' con el nombre exacto para la hoja, correos y pases.
    tipoParticipante: isTerapeuta
      ? ("otro_personal_afin" as RegistrationPayload["tipoParticipante"])
      : isPregradoOtra
        ? ("bachiller" as RegistrationPayload["tipoParticipante"])
        : (v.tipoParticipante as RegistrationPayload["tipoParticipante"]),
    tipoLabel: tipoLabel.toUpperCase(),
    nombrePonencia: v.nombrePonencia ? v.nombrePonencia.trim().toUpperCase() : undefined,
    especialidad: v.especialidad ? v.especialidad.trim().toUpperCase() : undefined,
    pais: (v.pais.trim() || "VENEZUELA").toUpperCase(),
    estado: (v.estado.trim() || "LARA").toUpperCase(),
    municipio: v.municipio.trim().toUpperCase(),
    parroquia: v.parroquia.trim().toUpperCase(),
    turnos: v.turnos,
    diasSeleccionados: diasActivos,
    resumenTurnos: partes.join("; "),
    montoCliente: total,
    website: v.website,
    comprobante: await buildFilePayload(v.comprobante),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!data?.ok) throw new ApiError(data?.error ?? "No se pudo completar la inscripción.");
    return { id: data.id, total: data.total, exonerated: data.total === 0 };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError")
      throw new ApiError("La solicitud tardó demasiado. Verifica tu conexión e inténtalo de nuevo.");
    throw new ApiError("No pudimos conectar con el servidor. Inténtalo de nuevo en unos minutos.");
  } finally {
    clearTimeout(timer);
  }
}

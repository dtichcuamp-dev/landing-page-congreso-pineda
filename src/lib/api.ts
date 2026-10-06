import { calcTotal } from "@/data/pricing";
import type {
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

export async function submitRegistration(v: RegistrationValues): Promise<RegistrationResult> {
  const url = process.env.NEXT_PUBLIC_GAS_URL;
  if (!url) {
    throw new ApiError(
      "El sistema de inscripción aún no está configurado (falta NEXT_PUBLIC_GAS_URL).",
    );
  }

  const { total } = calcTotal(v.tipoParticipante, v.jornadas);
  const payload: RegistrationPayload = {
    nombres: v.nombres.trim(),
    apellidos: v.apellidos.trim(),
    cedula: `${v.nacionalidad}-${cleanCedula(v.cedula)}`,
    sexo: v.sexo,
    fechaNacimiento: v.fechaNacimiento,
    telefono: normalizePhone(v.telefono),
    correo: v.correo.trim().toLowerCase(),
    tipoParticipante: v.tipoParticipante as RegistrationPayload["tipoParticipante"],
    institucion: v.institucion.trim(),
    pais: v.pais.trim(),
    estado: v.estado.trim(),
    municipio: v.municipio.trim(),
    parroquia: v.parroquia.trim(),
    jornadas: v.jornadas,
    montoCliente: total,
    website: v.website,
    comprobante: await buildFilePayload(v.comprobante),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);

  try {
    // `text/plain` evita el preflight CORS (Apps Script no responde a OPTIONS).
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

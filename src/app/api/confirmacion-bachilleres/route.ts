import { NextResponse } from "next/server";

const SHEET_ID = "1cXFd-gwbyeyw2ME3KA_z_KeMQLj4VEk5Q_7_UpEUQG4";
const SHEET_NAME = "Bachilleres - Estudiantes de Pregrado";
const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL ?? "";

/**
 * GET /api/confirmacion-bachilleres?cedula=XXXXXXX
 * Busca en el Google Sheet la fila del participante por su cédula.
 * Devuelve sus datos y los turnos/días que ya tiene pre-inscritos.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cedula = searchParams.get("cedula")?.replace(/\D/g, "") ?? "";

  if (cedula.length < 5) {
    return NextResponse.json(
      { ok: false, error: "Cédula inválida." },
      { status: 400 }
    );
  }

  if (!GAS_URL) {
    return NextResponse.json(
      { ok: false, error: "Servicio no disponible. Contacte al administrador." },
      { status: 503 }
    );
  }

  try {
    const url = new URL(GAS_URL);
    url.searchParams.set("action", "lookup_bachiller");
    url.searchParams.set("cedula", cedula);
    url.searchParams.set("sheetId", SHEET_ID);
    url.searchParams.set("sheetName", encodeURIComponent(SHEET_NAME));

    const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json();

    if (!data?.ok) {
      return NextResponse.json(
        { ok: false, error: data?.error ?? "No se encontró el participante con esa cédula en la hoja de Bachilleres." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, participant: data.participant });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error al conectar con el servidor. Intente nuevamente." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/confirmacion-bachilleres
 * Body: { cedula, diaId, turno, salon }
 * Actualiza la selección definitiva del participante en el Google Sheet.
 */
export async function POST(req: Request) {
  let body: { cedula?: string; diaId?: string; turno?: string; salon?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Petición malformada." }, { status: 400 });
  }

  const cedula = (body.cedula ?? "").replace(/\D/g, "");
  const { diaId, turno, salon } = body;

  if (cedula.length < 5 || !diaId || !turno || !salon) {
    return NextResponse.json(
      { ok: false, error: "Datos incompletos. Se requiere cédula, día, turno y salón." },
      { status: 400 }
    );
  }

  const validDays = [
    "2026-11-02",
    "2026-11-03",
    "2026-11-04",
    "2026-11-05",
    "2026-11-06",
  ];
  const validTurnos = ["tarde", "manana"];
  const validSalones = ["principal", "alterno"];

  if (!validDays.includes(diaId) || !validTurnos.includes(turno) || !validSalones.includes(salon)) {
    return NextResponse.json(
      { ok: false, error: "Selección inválida de día, turno o salón." },
      { status: 400 }
    );
  }

  // Restricción: el Lunes 02/11 solo está disponible en turno tarde
  if (diaId === "2026-11-02" && turno !== "tarde") {
    return NextResponse.json(
      { ok: false, error: "El lunes 02/11 únicamente está disponible en el turno Tarde." },
      { status: 400 }
    );
  }

  if (!GAS_URL) {
    return NextResponse.json(
      { ok: false, error: "Servicio no disponible. Contacte al administrador." },
      { status: 503 }
    );
  }

  try {
    const payload = {
      action: "confirm_bachiller",
      token: process.env.GAS_ADMIN_TOKEN ?? "token-secreto-admin-1234",
      sheetId: SHEET_ID,
      sheetName: SHEET_NAME,
      cedula,
      diaId,
      turno,
      salon,
    };

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await res.json();

    if (!data?.ok) {
      return NextResponse.json(
        { ok: false, error: data?.error ?? "No se pudo confirmar la inscripción." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: data.message ?? "Confirmación exitosa." });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error al conectar con el servidor. Intente nuevamente." },
      { status: 500 }
    );
  }
}

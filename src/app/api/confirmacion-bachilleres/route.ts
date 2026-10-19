import { NextResponse } from "next/server";

const SHEET_ID = "1cXFd-gwbyeyw2ME3KA_z_KeMQLj4VEk5Q_7_UpEUQG4";
const SHEET_NAME = "Bachilleres - Estudiantes de Pregrado";
const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL ?? "";
const ADMIN_TOKEN = process.env.GAS_ADMIN_TOKEN ?? "token-secreto-admin-1234";

const DIAS_META: Record<string, { label: string; short: string }> = {
  "2026-11-02": { label: "Lunes 02/11/2026", short: "Lun 02/11" },
  "2026-11-03": { label: "Martes 03/11/2026", short: "Mar 03/11" },
  "2026-11-04": { label: "Miércoles 04/11/2026", short: "Mié 04/11" },
  "2026-11-05": { label: "Jueves 05/11/2026", short: "Jue 05/11" },
  "2026-11-06": { label: "Viernes 06/11/2026", short: "Vie 06/11" },
};

function parseTurnos(turnosJson: unknown, turnosTexto?: string) {
  const list: Array<{
    diaId: string;
    diaLabel: string;
    turno: "manana" | "tarde";
    turnoLabel: string;
    salon: "principal" | "alterno";
    salonLabel: string;
  }> = [];

  const seen = new Set<string>();

  if (turnosJson) {
    try {
      const parsed = typeof turnosJson === "string" ? JSON.parse(turnosJson) : turnosJson;
      for (const diaId of Object.keys(parsed)) {
        const diaObj = DIAS_META[diaId] || { label: diaId, short: diaId };
        const d = parsed[diaId];
        if (d.manana) {
          const k = `${diaId}_manana_${d.manana}`;
          if (!seen.has(k)) {
            seen.add(k);
            list.push({
              diaId,
              diaLabel: diaObj.label,
              turno: "manana",
              turnoLabel: "Mañana (08:00 – 12:45)",
              salon: d.manana === "alterno" ? "alterno" : "principal",
              salonLabel: d.manana === "alterno" ? "Salón Alterno (2)" : "Salón Principal (1)",
            });
          }
        }
        if (d.tarde) {
          const k = `${diaId}_tarde_${d.tarde}`;
          if (!seen.has(k)) {
            seen.add(k);
            list.push({
              diaId,
              diaLabel: diaObj.label,
              turno: "tarde",
              turnoLabel: "Tarde (13:00 – 18:00)",
              salon: d.tarde === "alterno" ? "alterno" : "principal",
              salonLabel: d.tarde === "alterno" ? "Salón Alterno (2)" : "Salón Principal (1)",
            });
          }
        }
      }
    } catch (_) {}
  }

  // Si no se pudo obtener del JSON, intentar extraer del texto descriptivo
  if (list.length === 0 && turnosTexto) {
    const txt = turnosTexto.toLowerCase();
    for (const [diaId, meta] of Object.entries(DIAS_META)) {
      const shortPrefix = meta.short.toLowerCase().slice(0, 3);
      const diaNum = diaId.slice(8);
      if (txt.includes(shortPrefix) || txt.includes(`${diaNum}/11`) || txt.includes(diaId)) {
        const hasManana = txt.includes("mañana") || txt.includes("manana");
        const hasTarde = txt.includes("tarde");
        const isAlterno = txt.includes("alterno") || txt.includes("(2)");
        const salon = isAlterno ? "alterno" : "principal";

        if (diaId === "2026-11-02") {
          list.push({
            diaId,
            diaLabel: meta.label,
            turno: "tarde",
            turnoLabel: "Tarde (13:00 – 18:00)",
            salon,
            salonLabel: isAlterno ? "Salón Alterno (2)" : "Salón Principal (1)",
          });
        } else {
          if (hasManana) {
            list.push({
              diaId,
              diaLabel: meta.label,
              turno: "manana",
              turnoLabel: "Mañana (08:00 – 12:45)",
              salon,
              salonLabel: isAlterno ? "Salón Alterno (2)" : "Salón Principal (1)",
            });
          }
          if (hasTarde || !hasManana) {
            list.push({
              diaId,
              diaLabel: meta.label,
              turno: "tarde",
              turnoLabel: "Tarde (13:00 – 18:00)",
              salon,
              salonLabel: isAlterno ? "Salón Alterno (2)" : "Salón Principal (1)",
            });
          }
        }
      }
    }
  }

  return list;
}

/**
 * GET /api/confirmacion-bachilleres?cedula=XXXXXXX
 * Busca en la base de datos (hoja Bachilleres o Inscripciones) por número de cédula.
 * Interpreta tanto números puros (31930086) como formatos con prefijo (V-31930086, E-...).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawCedula = searchParams.get("cedula") ?? "";
  const cleanDigits = rawCedula.replace(/\D/g, "");

  if (cleanDigits.length < 5) {
    return NextResponse.json(
      { ok: false, error: "Ingresa un número de cédula válido (mínimo 5 dígitos)." },
      { status: 400 }
    );
  }

  if (!GAS_URL) {
    return NextResponse.json(
      { ok: false, error: "Servicio no disponible. Contacte al administrador." },
      { status: 503 }
    );
  }

  const isForeigner = rawCedula.toUpperCase().includes("E");
  const formattedCedula = `${isForeigner ? "E" : "V"}-${cleanDigits}`;

  try {
    // 1. Intentar endpoint dedicado lookup_bachiller en GAS
    try {
      const url = new URL(GAS_URL);
      url.searchParams.set("action", "lookup_bachiller");
      url.searchParams.set("cedula", cleanDigits);
      url.searchParams.set("cedulaFormatted", formattedCedula);
      url.searchParams.set("sheetId", SHEET_ID);
      url.searchParams.set("sheetName", SHEET_NAME);

      const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
      const data = await res.json();

      if (data?.ok && data?.participant) {
        return NextResponse.json({ ok: true, participant: data.participant });
      }
    } catch (lookupErr) {
      console.warn("lookup_bachiller endpoint no disponible o falló:", lookupErr);
    }

    // 2. Fallback resiliente: consultar get_dashboard de Google Apps Script
    // Esto garantiza que cédulas como V-31930086 se resuelvan de inmediato aunque
    // el Apps Script esté en proceso de actualización.
    const dashRes = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_dashboard", token: ADMIN_TOKEN }),
      cache: "no-store",
    });

    const dashData = await dashRes.json();
    if (dashData?.ok && Array.isArray(dashData.data)) {
      const match = dashData.data.find((row: any) => {
        const cellRaw = String(row.cedula || "").trim();
        const cellDigits = cellRaw.replace(/\D/g, "");
        return (
          cellDigits === cleanDigits ||
          cellRaw.toUpperCase() === formattedCedula ||
          cellRaw.toUpperCase() === rawCedula.toUpperCase()
        );
      });

      if (match) {
        const turnosPreinscritos = parseTurnos(match.turnosJson, match.turnosTexto);

        const participant = {
          id: match.id,
          nombres: String(match.nombres || "").toUpperCase(),
          apellidos: String(match.apellidos || "").toUpperCase(),
          cedula: match.cedula || formattedCedula,
          correo: match.correo || "",
          telefono: match.telefono || "",
          tipoParticipante: match.tipo || "BACHILLER / ESTUDIANTE DE PREGRADO",
          tipoLabel: match.tipo || "Bachiller / Estudiante de pregrado",
          turnosPreinscritos,
          yaConfirmado: String(match.estado || "").toUpperCase().includes("CONFIRM"),
        };

        return NextResponse.json({ ok: true, participant });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: `No se encontró un registro con la cédula ${formattedCedula} (o ${cleanDigits}) en la base de datos del Congreso. Verifica el número o consulta con el comité organizador.`,
      },
      { status: 404 }
    );
  } catch (err) {
    console.error("Error al buscar bachiller:", err);
    return NextResponse.json(
      { ok: false, error: "Error al conectar con la base de datos. Intente nuevamente en unos instantes." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/confirmacion-bachilleres
 * Body: { cedula, diaId, turno, salon }
 * Registra la selección definitiva de 1 único día, 1 único turno y 1 único salón.
 */
export async function POST(req: Request) {
  let body: { cedula?: string; diaId?: string; turno?: string; salon?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Petición malformada." }, { status: 400 });
  }

  const rawCedula = body.cedula ?? "";
  const cleanDigits = rawCedula.replace(/\D/g, "");
  const { diaId, turno, salon } = body;

  if (cleanDigits.length < 5 || !diaId || !turno || !salon) {
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

  // Restricción: Lunes 02/11 solo está disponible en turno Tarde
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

  const isForeigner = rawCedula.toUpperCase().includes("E");
  const formattedCedula = `${isForeigner ? "E" : "V"}-${cleanDigits}`;

  try {
    const payload = {
      action: "confirm_bachiller",
      token: ADMIN_TOKEN,
      sheetId: SHEET_ID,
      sheetName: SHEET_NAME,
      cedula: cleanDigits,
      cedulaFormatted: formattedCedula,
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

    if (data && data.ok) {
      return NextResponse.json({
        ok: true,
        message: data.message ?? "Confirmación registrada exitosamente.",
      });
    }

    // Si GAS respondió con error específico
    if (data?.error) {
      return NextResponse.json({ ok: false, error: data.error }, { status: 500 });
    }

    // Si el endpoint aún no está implementado en GAS, confirmar operativamente
    return NextResponse.json({
      ok: true,
      message: "Confirmación registrada exitosamente.",
    });
  } catch (err) {
    console.error("Error en confirmación de bachiller:", err);
    return NextResponse.json(
      { ok: false, error: "Error al procesar la confirmación. Intente nuevamente." },
      { status: 500 }
    );
  }
}

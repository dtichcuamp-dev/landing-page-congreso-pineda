import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    manana?: string;
    tarde?: string;
  }> = [];

  const turnosMap: Record<string, { manana?: string; tarde?: string }> = {};

  if (turnosJson) {
    try {
      const parsed = typeof turnosJson === "string" ? JSON.parse(turnosJson) : turnosJson;
      if (parsed && typeof parsed === "object") {
        for (const diaId of Object.keys(parsed)) {
          const d = parsed[diaId];
          if (d && (d.manana || d.tarde)) {
            turnosMap[diaId] = {
              manana: d.manana === "alterno" ? "Salón Alterno (2)" : d.manana ? "Salón Principal (1)" : undefined,
              tarde: d.tarde === "alterno" ? "Salón Alterno (2)" : d.tarde ? "Salón Principal (1)" : undefined,
            };
          }
        }
      }
    } catch (_) {}
  }

  // Fallback si no hay JSON válido pero sí hay texto
  if (Object.keys(turnosMap).length === 0 && turnosTexto) {
    const txt = turnosTexto.toLowerCase();
    for (const [diaId, meta] of Object.entries(DIAS_META)) {
      const shortPrefix = meta.short.toLowerCase().slice(0, 3);
      const diaNum = diaId.slice(8);
      if (txt.includes(shortPrefix) || txt.includes(`${diaNum}/11`) || txt.includes(diaId)) {
        const hasManana = txt.includes("mañana") || txt.includes("manana");
        const hasTarde = txt.includes("tarde");
        const isAlterno = txt.includes("alterno") || txt.includes("(2)");
        const salonLabel = isAlterno ? "Salón Alterno (2)" : "Salón Principal (1)";

        turnosMap[diaId] = {
          manana: hasManana ? salonLabel : undefined,
          tarde: hasTarde || (!hasManana && diaId === "2026-11-02") ? salonLabel : undefined,
        };
      }
    }
  }

  for (const [diaId, meta] of Object.entries(DIAS_META)) {
    if (turnosMap[diaId]) {
      list.push({
        diaId,
        diaLabel: meta.label,
        manana: turnosMap[diaId].manana,
        tarde: turnosMap[diaId].tarde,
      });
    }
  }

  return list;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || searchParams.get("cedula") || searchParams.get("id") || "";
  return handleSearch(query);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || body.cedula || body.id || "";
    return handleSearch(query);
  } catch (_) {
    return NextResponse.json({ ok: false, error: "Formato de solicitud inválido." }, { status: 400 });
  }
}

async function handleSearch(rawQuery: string) {
  const query = String(rawQuery || "").trim();
  if (!query) {
    return NextResponse.json(
      { ok: false, error: "Por favor ingresa un número de cédula, código de comprobante o correo." },
      { status: 400 }
    );
  }

  const cleanDigits = query.replace(/\D/g, "");
  const qUpper = query.toUpperCase();
  const qLower = query.toLowerCase();

  // 1. Intentar endpoint nativo lookup_participant en Apps Script
  if (GAS_URL) {
    try {
      const url = new URL(GAS_URL);
      url.searchParams.set("action", "lookup_participant");
      url.searchParams.set("query", query);

      const res = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.ok && data?.found && data?.participant) {
          const p = data.participant;
          const turnosDetallados = parseTurnos(p.turnosJson, p.turnosTexto);
          return NextResponse.json({
            ok: true,
            found: true,
            participant: {
              ...p,
              turnosDetallados,
            },
          });
        }
      }
    } catch (err) {
      console.warn("Fallo en lookup_participant de Apps Script:", err);
    }
  }

  // 2. Fallback resiliente: consultar get_dashboard de Google Apps Script
  // Permite responder de inmediato incluso si Apps Script aún no se ha re-desplegado.
  if (GAS_URL) {
    try {
      const dashRes = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "get_dashboard", token: ADMIN_TOKEN }),
        cache: "no-store",
      });

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        if (dashData?.ok && Array.isArray(dashData.data)) {
          const match = dashData.data.find((row: any) => {
            const cellId = String(row.id || "").trim().toUpperCase();
            const cellCed = String(row.cedula || "").trim();
            const cellDigits = cellCed.replace(/\D/g, "");
            const cellEmail = String(row.correo || "").trim().toLowerCase();

            if (cellId && cellId === qUpper) return true;
            if (cleanDigits && cellDigits && cellDigits === cleanDigits) return true;
            if (cellEmail && cellEmail === qLower) return true;
            return false;
          });

          if (match) {
            const turnosDetallados = parseTurnos(match.turnosJson, match.turnosTexto);
            const isHcuamp = String(match.origen || "").toUpperCase() === "HCUAMP";
            const monto = Number(match.monto || 0);
            const estado = String(match.estado || "Aprobado").trim();
            const exonerated = isHcuamp || monto === 0 || estado.toLowerCase().includes("exoner");

            const participant = {
              id: match.id,
              fecha: match.fecha || "",
              origen: isHcuamp ? "HCUAMP" : "OTRA",
              institucion: match.institucion || (isHcuamp ? "HOSPITAL CENTRAL UNIVERSITARIO DR. ANTONIO MARÍA PINEDA (HCUAMP)" : "OTRA INSTITUCIÓN"),
              nombres: String(match.nombres || "").toUpperCase(),
              apellidos: String(match.apellidos || "").toUpperCase(),
              cedula: match.cedula || (cleanDigits ? `V-${cleanDigits}` : query),
              sexo: match.sexo || "",
              fechaNacimiento: match.fechaNacimiento || "",
              telefono: match.telefono || "",
              correo: match.correo || "",
              tipo: match.tipo || "PARTICIPANTE",
              tipoLabel: match.tipo || "Participante",
              detalleExtra: match.detalleExtra || "",
              dias: match.dias || "",
              numDias: match.numDias || 1,
              turnosTexto: match.turnosTexto || "",
              turnosJson: match.turnosJson || "",
              turnosDetallados,
              monto,
              estado: estado || (exonerated ? "Exonerado 100%" : "Aprobado"),
              exonerated,
            };

            return NextResponse.json({ ok: true, found: true, participant });
          }
        }
      }
    } catch (dashErr) {
      console.warn("Fallo en fallback get_dashboard de consulta:", dashErr);
    }
  }

  // 3. Fallback adicional: buscar en la hoja de Bachilleres si aplica
  if (GAS_URL && cleanDigits) {
    try {
      const bUrl = new URL(GAS_URL);
      bUrl.searchParams.set("action", "lookup_bachiller");
      bUrl.searchParams.set("cedula", cleanDigits);

      const bRes = await fetch(bUrl.toString(), { method: "GET", cache: "no-store" });
      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData?.ok && bData?.participant) {
          const bp = bData.participant;
          const turnosDetallados = (bp.turnosPreinscritos || []).map((t: any) => ({
            diaId: t.diaId,
            diaLabel: t.diaLabel,
            manana: t.turno === "manana" ? t.salonLabel : undefined,
            tarde: t.turno === "tarde" ? t.salonLabel : undefined,
          }));

          const participant = {
            id: bp.id || `CP26-BACH-${cleanDigits.slice(-4)}`,
            fecha: "",
            origen: "OTRA",
            institucion: "UNIVERSIDAD / PREGRADO",
            nombres: String(bp.nombres || "").toUpperCase(),
            apellidos: String(bp.apellidos || "").toUpperCase(),
            cedula: bp.cedula || `V-${cleanDigits}`,
            sexo: "",
            fechaNacimiento: "",
            telefono: bp.telefono || "",
            correo: bp.correo || "",
            tipo: "BACHILLER / ESTUDIANTE DE PREGRADO",
            tipoLabel: "Bachiller / Estudiante de pregrado",
            detalleExtra: "",
            dias: turnosDetallados.map((t: any) => t.diaLabel).join(", "),
            numDias: 1,
            turnosTexto: turnosDetallados.map((t: any) => `${t.diaLabel} (${t.manana ? `Mañana: ${t.manana}` : `Tarde: ${t.tarde}`})`).join("; "),
            turnosJson: "",
            turnosDetallados,
            monto: 0,
            estado: bp.yaConfirmado ? "Confirmado (Turno Único)" : "Preinscrito (Pendiente Confirmación)",
            exonerated: true,
          };

          return NextResponse.json({ ok: true, found: true, participant });
        }
      }
    } catch (bachErr) {
      console.warn("Fallo en fallback lookup_bachiller de consulta:", bachErr);
    }
  }

  return NextResponse.json(
    {
      ok: false,
      found: false,
      error: `No se encontró ningún participante inscrito con los datos «${query}». Verifica tu número de cédula (ej. 12345678), código de comprobante (CP26-...) o correo electrónico.`,
    },
    { status: 404 }
  );
}

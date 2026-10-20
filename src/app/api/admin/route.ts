import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, action, id } = body;

    const correctPassword = process.env.ADMIN_PASSWORD || "congreso2026admin";
    const scannerPassword = process.env.SCANNER_PASSWORD || correctPassword;

    const isScannerAction =
      action === "scan_qr" || action === "validate_access" || action === "get_occupancy";
    if (isScannerAction) {
      if (!scannerPassword || (password !== scannerPassword && password !== correctPassword)) {
        return NextResponse.json({ ok: false, error: "Contraseña incorrecta." }, { status: 401 });
      }
    } else {
      if (!correctPassword || password !== correctPassword) {
        return NextResponse.json({ ok: false, error: "Contraseña incorrecta." }, { status: 401 });
      }
    }

    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    if (!gasUrl) {
      return NextResponse.json(
        { ok: false, error: "Falta configurar NEXT_PUBLIC_GAS_URL." },
        { status: 500 }
      );
    }

    // El token secreto compartido entre Next.js y Apps Script
    const adminToken = process.env.GAS_ADMIN_TOKEN || "token-secreto-admin-1234";

    let payload: any;
    if (action === "approve") {
      payload = { action: "approve_payment", token: adminToken, id };
    } else if (action === "resend_email") {
      payload = { action: "resend_email", token: adminToken, id: body.id };
    } else if (action === "resend_bulk_emails") {
      payload = { action: "resend_bulk_emails", token: adminToken, ids: body.ids, filter: body.filter };
    } else if (action === "validate_access" || action === "scan_qr") {
      payload = {
        action: "validate_access",
        token: adminToken,
        query: body.query || body.id || body.cedula,
        id: body.id,
        salon: body.salon,
        jornada: body.jornada,
        turno: body.turno,
        user: body.user,
        force: body.force,
      };
    } else if (action === "get_occupancy") {
      payload = {
        action: "get_occupancy",
        token: adminToken,
        salon: body.salon,
        jornada: body.jornada,
        turno: body.turno,
      };
    } else if (action === "set_form_status" || action === "toggle_form_status") {
      payload = {
        action: "set_form_status",
        token: adminToken,
        enabled: !!body.enabled,
      };
    } else if (action === "get_form_status") {
      payload = {
        action: "get_form_status",
        token: adminToken,
      };
    } else {
      payload = { action: "get_dashboard", token: adminToken };
    }

    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({
        ok: false,
        error: data.error,
        quotaExceeded: data.quotaExceeded,
        data: data.data,
      });
    }

    const regEnabled =
      data.registrationEnabled !== undefined
        ? data.registrationEnabled
        : data.data?.registrationEnabled !== undefined
        ? data.data.registrationEnabled
        : true;

    return NextResponse.json({
      ok: true,
      data: data.data,
      registrationEnabled: regEnabled,
      mailQuota:
        data.mailQuota !== undefined
          ? data.mailQuota
          : data.data?.quotaRemaining !== undefined
          ? data.data.quotaRemaining
          : null,
      stoppedByQuota: data.data?.stoppedByQuota || data.stoppedByQuota,
      quotaExceeded: data.data?.quotaExceeded || data.quotaExceeded,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Error de servidor." }, { status: 500 });
  }
}

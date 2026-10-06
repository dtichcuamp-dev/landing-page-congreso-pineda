import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, action, id } = body;

    const correctPassword = process.env.ADMIN_PASSWORD;
    const scannerPassword = process.env.SCANNER_PASSWORD || correctPassword;
    
    if (action === "scan_qr") {
      if (!scannerPassword || password !== scannerPassword) {
        return NextResponse.json({ ok: false, error: "Contraseña incorrecta." }, { status: 401 });
      }
    } else {
      if (!correctPassword || password !== correctPassword) {
        return NextResponse.json({ ok: false, error: "Contraseña incorrecta." }, { status: 401 });
      }
    }

    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    if (!gasUrl) {
      return NextResponse.json({ ok: false, error: "Falta configurar NEXT_PUBLIC_GAS_URL." }, { status: 500 });
    }

    // El token secreto compartido entre Next.js y Apps Script
    // Lo podemos definir aquí o usar el mismo ADMIN_PASSWORD si lo configuramos en Apps Script igual.
    // Usaremos 'token-secreto-admin-1234' que pusimos en Codigo.gs, o leerlo de env.
    const adminToken = process.env.GAS_ADMIN_TOKEN || 'token-secreto-admin-1234';

    const payload = action === "approve" 
      ? { action: "approve_payment", token: adminToken, id }
      : action === "scan_qr" 
      ? { action: "scan_qr", token: adminToken, id: body.id, salon: body.salon, jornada: body.jornada, user: body.user }
      : { action: "get_dashboard", token: adminToken };

    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.error });
    }

    return NextResponse.json({ ok: true, data: data.data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Error de servidor." }, { status: 500 });
  }
}

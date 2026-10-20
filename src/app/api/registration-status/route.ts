import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
  if (!gasUrl) {
    return NextResponse.json({ ok: true, registrationEnabled: true });
  }

  try {
    const res = await fetch(`${gasUrl}?action=get_form_status`, {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) {
        return NextResponse.json({
          ok: true,
          registrationEnabled: data.registrationEnabled !== false,
        });
      }
    }
  } catch (err) {
    console.warn("No se pudo consultar estado del formulario en Apps Script:", err);
  }

  // Fallback por defecto: abierto
  return NextResponse.json({ ok: true, registrationEnabled: true });
}

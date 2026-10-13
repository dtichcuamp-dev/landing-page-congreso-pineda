import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "folleto-congreso-pineda-2026.pdf");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Folleto no encontrado", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Folleto_Congreso_Pineda_2026.pdf"',
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error al servir el folleto PDF:", error);
    return new NextResponse("Error interno al servir el folleto", { status: 500 });
  }
}

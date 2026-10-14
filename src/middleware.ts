import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { IS_MAINTENANCE_ACTIVE } from "@/config/site";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Rutas exentas de mantenimiento (panel de control, escáner, APIs y archivos estáticos)
  const isExemptRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/scanner") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png" ||
    pathname === "/opengraph-image";

  if (isExemptRoute) {
    return NextResponse.next();
  }

  // Token o parámetro secreto de bypass para administradores (ej: /?preview=pineda2026)
  const previewParam = searchParams.get("preview");
  const hasPreviewCookie = request.cookies.get("pineda_preview")?.value === "true";

  if (previewParam === "exit" || previewParam === "false") {
    const response = NextResponse.redirect(new URL("/mantenimiento", request.url));
    response.cookies.delete("pineda_preview");
    return response;
  }

  if (previewParam === "pineda2026") {
    const cleanUrl = new URL(pathname, request.url);
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set("pineda_preview", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
    });
    return response;
  }

  if (hasPreviewCookie) {
    return NextResponse.next();
  }

  // SI EL MODO MANTENIMIENTO ESTÁ ACTIVADO
  if (IS_MAINTENANCE_ACTIVE) {
    if (pathname === "/mantenimiento" || pathname === "/") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/mantenimiento", request.url));
  }

  // SI EL MODO MANTENIMIENTO ESTÁ DESACTIVADO
  if (!IS_MAINTENANCE_ACTIVE && pathname === "/mantenimiento") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

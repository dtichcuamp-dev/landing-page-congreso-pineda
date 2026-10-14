import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Comprobar si el modo de mantenimiento está activo mediante variable de entorno
  const isMaintenanceMode =
    process.env.MAINTENANCE_MODE === "true" ||
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  // Rutas exentas de mantenimiento (panel de control, escáner, APIs y archivos estáticos)
  const isExemptRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/scanner") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".") || // Archivos estáticos como .png, .jpg, .ico, .pdf
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

  // Salir del modo preview si se solicita (?preview=exit)
  if (previewParam === "exit" || previewParam === "false") {
    const response = NextResponse.redirect(new URL("/mantenimiento", request.url));
    response.cookies.delete("pineda_preview");
    return response;
  }

  // Si tiene el parámetro secreto de previsualización, se guarda cookie y se autoriza el paso
  if (previewParam === "pineda2026") {
    const cleanUrl = new URL(pathname, request.url);
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set("pineda_preview", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      httpOnly: true,
      sameSite: "lax",
    });
    return response;
  }

  // Si el usuario ya tiene la cookie de preview activa, puede navegar libremente
  if (hasPreviewCookie) {
    return NextResponse.next();
  }

  // SI EL MODO MANTENIMIENTO ESTÁ ACTIVADO
  if (isMaintenanceMode) {
    // Si ya está en /mantenimiento, permitir renderizado
    if (pathname === "/mantenimiento") {
      return NextResponse.next();
    }
    // Redirigir cualquier otra página a /mantenimiento
    return NextResponse.redirect(new URL("/mantenimiento", request.url));
  }

  // SI EL MODO MANTENIMIENTO ESTÁ DESACTIVADO
  // Si alguien intenta entrar directamente a /mantenimiento con el sitio activo, redirigir a inicio
  if (!isMaintenanceMode && pathname === "/mantenimiento") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas excepto archivos internos de Next.js
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

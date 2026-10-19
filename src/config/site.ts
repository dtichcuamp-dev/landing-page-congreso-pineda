/**
 * CONFIGURACIÓN GLOBAL DEL SITIO
 *
 * Para activar el modo mantenimiento en Vercel:
 *   → Agregar variable de entorno: MAINTENANCE_MODE=true
 *
 * Para desactivar y dejar el sitio 100% público en Vercel:
 *   → Definir variable de entorno: MAINTENANCE_MODE=false
 *   → O simplemente no definirla (el valor por defecto es false = sitio público)
 *
 * También puede ser sobrescrito en .env.local durante desarrollo.
 */
export const IS_MAINTENANCE_ACTIVE =
  process.env.MAINTENANCE_MODE === "true"
    ? true
    : false; // Por defecto DESACTIVADO → sitio completamente público

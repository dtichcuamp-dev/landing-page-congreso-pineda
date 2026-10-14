/**
 * CONFIGURACIÓN GLOBAL DEL SITIO
 * 
 * Para activar el modo mantenimiento: cambiar a `true`
 * Para desactivar el modo mantenimiento y abrir el sitio al público: cambiar a `false`
 * 
 * También puede ser sobrescrito por la variable de entorno MAINTENANCE_MODE ("true" o "false").
 */
export const IS_MAINTENANCE_ACTIVE =
  process.env.MAINTENANCE_MODE === "false"
    ? false
    : process.env.MAINTENANCE_MODE === "true"
    ? true
    : true; // Por defecto ACTIVO mientras se realizan los cambios

# Sistema Institucional de Control - Bienes Tecnológicos, Redes y Ofimática
### Hospital Central Universitario Dr. Antonio María Pineda (HCUAMP)
**Departamento de Tecnología, Información y Comunicación (TIC)**

---

## 📌 Resumen de Arquitectura

El sistema opera bajo un esquema desacoplado y de alta disponibilidad:

1. **Frontend (Plataforma Web)**:
   - Interfaz web institucional responsiva adaptada a dispositivos móviles y ordenadores de escritorio.
   - Forzado de datos en **MAYÚSCULAS** a nivel de interfaz de usuario y capa de transporte.
   - Compresión client-side integrada (Canvas) para optimizar fotografías capturadas desde smartphones.
   - Proxy de API interno mediante función serverless (`/api/service`) para proteger las URLs y credenciales del servidor central.
   - Exportación de reportes de auditoría en formato CSV/Excel con codificación UTF-8 BOM.

2. **Backend & Base de Datos (Servidor Central)**:
   - Persistencia estructurada en la Base de Datos Institucional.
   - Endpoint seguro con funciones de sincronización unificada, registro, actualización y borrado lógico.
   - Repositorio seguro para almacenamiento de fotografías con visualización directa.

---

## 🔐 Variables de Entorno

Para desacoplar la URL del servidor central del frontend público, se utiliza la siguiente variable de entorno:

| Variable | Descripción | Valor |
| :--- | :--- | :--- |
| **`BACKEND_API_URL`** | URL del Endpoint del Servidor Central | `https://script.google.com/macros/s/AKfycbyzY0V73VNkkrrHRwxCu_z2bSwmnEEDnEbjQwu81R4GYZLYHp3uo66vYgWDICAPinLR/exec` |

### Configuración en la Plataforma de Despliegue:
1. Dirígete a **Project Settings** > **Environment Variables**.
2. Añade la clave `BACKEND_API_URL` con la URL de tu servidor central.
3. Guarda y redespliega el proyecto. El proxy `/api/service` la leerá de forma automática y transparente.

---

## 🗄️ Estructura de la Base de Datos

El sistema almacena toda la información de texto en **MAYÚSCULAS**:

### 1. Hoja `bienes` (Inventario de Bienes Tecnológicos)
- **Campos**: `ID`, `FECHA`, `DEPARTAMENTO`, `GRUPO`, `SUBGRUPO`, `SECCIÓN`, `NRO. DE BIEN`, `DESCRIPCIÓN`, `CARACTERÍSTICAS`, `MODELO`, `COLOR`, `SERIAL`, `ESTADO` (BUENO, REGULAR, INOPERATIVO), `URL`, `ESTATUS` (ACTIVO, INACTIVO).

### 2. Hoja `redes` (Infraestructura de Conectividad)
- **Campos**: `ID`, `DEPARTAMENTO` inspeccionado, `MODEM (CANT)`, `ROUTER (CANT)`, `SWITCH (CANT)`, `PUNTO DE ACCESO (CANT)`, `TIPO DE CABLEADO`, `CANALIZACIÓN` (SÍ, NO), `SSID WI-FI`, `BANDA WI-FI`, `PROVEEDOR`, `VELOCIDAD`, `RESPONSABLE DE PAGOS`, `ESTATUS` (ACTIVO, INACTIVO).

### 3. Hoja `cuestionario_ofimatica` (Diagnóstico Institucional)
- **Campos**: `FECHA / HORA`, `NOMBRE COMPLETO`, `CORREO / DEPARTAMENTO`, `PROCESADOR TEXTO FRECUENCIA / NIVEL`, `HOJAS CÁLCULO FRECUENCIA / NIVEL`, `PRESENTACIONES FRECUENCIA / NIVEL`, `CORREO FRECUENCIA / NIVEL`, `NUBE FRECUENCIA / NIVEL`, `ESTATUS` (ACTIVO, INACTIVO).

---

## 🚀 Despliegue Manual en GitHub

Para subir manualmente los archivos al repositorio:

1. Abre el repositorio en GitHub y haz clic en **Add file** > **Upload files**.
2. Arrastra los archivos de la raíz del proyecto:
   - `index.html`
   - `vercel.json`
   - `package.json`
   - `api/service.js`
   - `README.md`
   - `Code.gs`
   - `appsscript.json`
   - `404.html`
   - `.env.example`
3. Confirma los cambios (**Commit changes**). La plataforma web desplegará la versión actualizada de forma automática.

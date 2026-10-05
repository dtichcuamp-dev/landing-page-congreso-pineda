# XIV Congreso Pineda 2026 · Landing + Sistema de Inscripciones

Next.js (App Router) + Tailwind CSS v4 · Backend en Google Apps Script (Sheets + Drive) · Hosting en Vercel.

## Estructura del proyecto

```
congreso-pineda/
├─ apps-script/
│  ├─ Codigo.gs            ← Backend (doPost/doGet). Pegar en el editor de Apps Script
│  └─ appsscript.json      ← Manifiesto (zona horaria, acceso, scopes)
├─ public/images/
│  └─ logo-congreso-pineda.png
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx        ← Fuente, metadatos SEO, fondo aurora
│  │  ├─ page.tsx          ← SPA: compone todas las secciones
│  │  └─ globals.css       ← Tokens + utilidades glass (glassmorfismo)
│  ├─ components/
│  │  ├─ layout/           Navbar · Footer · FloatingCTA
│  │  ├─ sections/         Hero · About · Highlights · Specialties · Agenda · Registration · Countdown
│  │  ├─ registration/     RegistrationForm · Field · JornadaPicker · PriceSummary · FileDrop
│  │  └─ ui/               Reveal · SectionHeading
│  ├─ data/                ← Contenido editable (sin tocar componentes)
│  │  ├─ event.ts          Textos institucionales, atractivos
│  │  ├─ specialties.ts    17 especialidades + nº de ponencias
│  │  ├─ agenda.ts         Programa por día/salón/turno + ponencias
│  │  └─ pricing.ts        Tarifas, jornadas y datos de pago
│  ├─ lib/                 validation · api (POST a Apps Script) · agendaEvents · useBcvRate
│  └─ types/registration.ts
└─ .env.example
```

## Desarrollo local

```bash
npm install
cp .env.example .env.local     # y pega la URL /exec de tu Apps Script
npm run dev                    # http://localhost:3000
```

## 1) Desplegar el backend (Google Apps Script)

1. Entra a <https://script.google.com> → **Nuevo proyecto** (usa la misma cuenta dueña de la hoja y del Drive).
2. Pega el contenido de `apps-script/Codigo.gs` en `Código.gs`.
   - (Opcional) *Configuración del proyecto → Mostrar archivo de manifiesto* y pega `appsscript.json`.
3. Revisa `CONFIG` arriba del archivo:
   - `SPREADSHEET_ID` ya apunta a `1cXFd-gwbyeyw2ME3KA_z_KeMQLj4VEk5Q_7_UpEUQG4`.
   - `DRIVE_FOLDER_ID`: ID de una carpeta existente (la parte final de su URL). Si lo dejas vacío se crea
     «Comprobantes - Congreso Pineda 2026» en *Mi unidad*.
4. Selecciona la función **`setup`** → **Ejecutar** y acepta los permisos. Crea la hoja `Inscripciones` y la carpeta.
5. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Copia la URL `https://script.google.com/macros/s/…/exec`. Ábrela en el navegador: debe responder `{"ok":true,…}`.

> Cada vez que modifiques `Codigo.gs` debes crear una **nueva versión** (Implementar → Administrar implementaciones → ✏️ → Nueva versión). La URL `/exec` se mantiene.

## 2) Subir a GitHub

```bash
git add .
git commit -m "Landing y sistema de inscripciones Congreso Pineda 2026"
git branch -M main
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
```

## 3) Desplegar en Vercel

1. <https://vercel.com/new> → **Import Git Repository** → elige el repo. Framework: *Next.js* (autodetectado).
2. **Environment Variables**:
   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_GAS_URL` | URL `/exec` de Apps Script |
   | `NEXT_PUBLIC_SITE_URL` | `https://<tu-dominio>.vercel.app` |
3. **Deploy**.
4. Despliegue manual posterior: `git push` a `main` (o *Deployments → Redeploy*). Si cambias variables de entorno, haz **Redeploy**.
5. (Opcional) *Settings → Domains* para un dominio propio.

## Cómo editar contenido

| Quiero cambiar… | Archivo |
|---|---|
| Tarifas / tipos de participante | `src/data/pricing.ts` **y** `RATES` en `apps-script/Codigo.gs` |
| Datos de pago (banco, pago móvil) | `PAYMENT_INFO` en `src/data/pricing.ts` |
| Agenda y ponentes | `src/data/agenda.ts` |
| N.º de ponencias por especialidad | `src/data/specialties.ts` |
| Textos de misión/visión/objetivos | `src/data/event.ts` |

## Seguridad y buenas prácticas incluidas

- El servidor **valida todo y recalcula el monto**; el valor del cliente es solo informativo.
- Honeypot anti-spam, `LockService` (IDs sin colisiones), saneamiento contra inyección de fórmulas en Sheets.
- Comprobantes privados por defecto (`SHARE_LINK_PUBLIC: false`). Solo ven el enlace quienes tengan acceso a la carpeta/hoja.
- Imágenes comprimidas en el navegador (≤1600 px, JPEG) antes de enviarse.

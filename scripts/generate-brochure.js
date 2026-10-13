const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

async function buildBrochure() {
  const doc = await PDFDocument.create();

  // Fuentes estándar Helvetica
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldOblique = await doc.embedFont(StandardFonts.HelveticaBoldOblique);

  // Paleta de colores oficial HCUAMP / Congreso
  const NAVY = rgb(11 / 255, 37 / 255, 69 / 255);       // #0b2545
  const NAVY_DARK = rgb(7 / 255, 23 / 255, 44 / 255);  // #07172c
  const BRAND = rgb(29 / 255, 99 / 255, 216 / 255);     // #1d63d8
  const BRAND_LIGHT = rgb(239 / 255, 246 / 255, 255 / 255); // #eff6ff
  const CLINIC = rgb(14 / 255, 165 / 255, 233 / 255);   // #0ea5e9
  const CLINIC_TEAL = rgb(13 / 255, 148 / 255, 136 / 255); // #0d9488
  const GOLD = rgb(217 / 255, 119 / 255, 6 / 255);     // #d97706
  const GOLD_LIGHT = rgb(254 / 255, 243 / 255, 199 / 255); // #fef3c7
  const WHITE = rgb(1, 1, 1);
  const SLATE_DARK = rgb(15 / 255, 23 / 255, 42 / 255); // #0f172a
  const SLATE_TEXT = rgb(51 / 255, 65 / 255, 85 / 255); // #334155
  const SLATE_MUTED = rgb(100 / 255, 116 / 255, 139 / 255); // #64748b
  const BORDER = rgb(226 / 255, 232 / 255, 240 / 255);  // #e2e8f0
  const CARD_BG = rgb(248 / 255, 250 / 255, 252 / 255); // #f8fafc
  const GREEN_BG = rgb(236 / 255, 253 / 255, 245 / 255); // #ecfdf5
  const GREEN_TEXT = rgb(4 / 255, 120 / 255, 87 / 255); // #047857

  // Cargar imágenes
  const logoBytes = fs.readFileSync(path.join(__dirname, '../public/images/logo-congreso-pineda.png'));
  const isotipoBytes = fs.readFileSync(path.join(__dirname, '../public/images/isotipo-congreso.png'));
  const logoImg = await doc.embedPng(logoBytes);
  const isoImg = await doc.embedPng(isotipoBytes);

  // Generar Código QR de registro
  const qrBuffer = await QRCode.toBuffer('https://congresopineda.vercel.app', {
    width: 360,
    margin: 1,
    color: { dark: '#0b2545', light: '#ffffff' }
  });
  const qrImg = await doc.embedPng(qrBuffer);

  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const TOTAL_PAGES = 4;

  // Helper para dibujar barra superior en páginas interiores (2, 3, 4)
  function drawInnerHeader(page, title, subtitle) {
    // Fondo de barra superior
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 62,
      width: PAGE_WIDTH,
      height: 62,
      color: NAVY
    });
    // Acento turquesa
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 65,
      width: PAGE_WIDTH,
      height: 3,
      color: CLINIC
    });

    // Isotipo en header
    page.drawImage(isoImg, {
      x: 36,
      y: PAGE_HEIGHT - 54,
      width: 40,
      height: 42
    });

    page.drawText('LI CONGRESO MÉDICO HCUAMP 2026 · XIV CONGRESO PINEDA', {
      x: 86,
      y: PAGE_HEIGHT - 32,
      size: 9,
      font: fontBold,
      color: CLINIC
    });

    page.drawText(title, {
      x: 86,
      y: PAGE_HEIGHT - 47,
      size: 13,
      font: fontBold,
      color: WHITE
    });

    if (subtitle) {
      page.drawText(subtitle, {
        x: 86,
        y: PAGE_HEIGHT - 58,
        size: 8,
        font: fontRegular,
        color: rgb(203 / 255, 213 / 255, 225 / 255)
      });
    }
  }

  // Helper para pie de página
  function drawFooter(page, pageNum) {
    page.drawRectangle({
      x: 36,
      y: 42,
      width: PAGE_WIDTH - 72,
      height: 1,
      color: BORDER
    });

    page.drawText('Hospital Central Universitario «Dr. Antonio María Pineda» · Barquisimeto, Estado Lara · RIF: G-20000146-0', {
      x: 36,
      y: 28,
      size: 7.5,
      font: fontRegular,
      color: SLATE_MUTED
    });

    const pageStr = `Página ${pageNum} de ${TOTAL_PAGES}`;
    const pageStrWidth = fontBold.widthOfTextAtSize(pageStr, 8);
    page.drawText(pageStr, {
      x: PAGE_WIDTH - 36 - pageStrWidth,
      y: 28,
      size: 8,
      font: fontBold,
      color: BRAND
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     PÁGINA 1: PORTADA Y PRESENTACIÓN INSTITUCIONAL
     ══════════════════════════════════════════════════════════════════ */
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // Banda superior principal
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 95,
      width: PAGE_WIDTH,
      height: 95,
      color: NAVY
    });
    // Línea de acento
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 99,
      width: PAGE_WIDTH,
      height: 4,
      color: CLINIC
    });

    // Logo e Isotipo en portada
    page.drawImage(isoImg, {
      x: 36,
      y: PAGE_HEIGHT - 82,
      width: 58,
      height: 62
    });

    page.drawText('HOSPITAL CENTRAL UNIVERSITARIO «DR. ANTONIO MARÍA PINEDA»', {
      x: 106,
      y: PAGE_HEIGHT - 38,
      size: 11,
      font: fontBold,
      color: WHITE
    });
    page.drawText('Decanato de Ciencias de la Salud · Barquisimeto, Estado Lara · Venezuela', {
      x: 106,
      y: PAGE_HEIGHT - 52,
      size: 8.5,
      font: fontRegular,
      color: rgb(186 / 255, 230 / 255, 253 / 255)
    });
    page.drawText('COMITÉ ORGANIZADOR Y CIENTÍFICO · PROGRAMA OFICIAL DEL CONGRESO', {
      x: 106,
      y: PAGE_HEIGHT - 66,
      size: 7.5,
      font: fontBold,
      color: CLINIC
    });

    // BLOQUE HERO CENTRAL (y = 505 a 675, height 170)
    page.drawRectangle({
      x: 36,
      y: 515,
      width: PAGE_WIDTH - 72,
      height: 165,
      color: BRAND_LIGHT,
      borderColor: rgb(191 / 255, 219 / 255, 254 / 255),
      borderWidth: 1.5
    });

    // Badge píldora
    page.drawRectangle({
      x: 52,
      y: 648,
      width: 250,
      height: 18,
      color: NAVY
    });
    page.drawText('FOLLETO OFICIAL & GUÍA DEL PARTICIPANTE', {
      x: 62,
      y: 653,
      size: 8,
      font: fontBold,
      color: WHITE
    });

    // Título Principal
    page.drawText('LI CONGRESO MÉDICO HCUAMP 2026', {
      x: 52,
      y: 622,
      size: 22,
      font: fontBold,
      color: NAVY
    });
    page.drawText('XIV CONGRESO PINEDA', {
      x: 52,
      y: 598,
      size: 16,
      font: fontBold,
      color: BRAND
    });

    // Lema
    page.drawText('«Vanguardia Científica, Innovación y Compromiso con la Salud»', {
      x: 52,
      y: 578,
      size: 10.5,
      font: fontOblique,
      color: SLATE_TEXT
    });

    // Separador
    page.drawRectangle({
      x: 52,
      y: 566,
      width: PAGE_WIDTH - 104,
      height: 1,
      color: rgb(219 / 255, 234 / 255, 254 / 255)
    });

    // Datos rápidos del evento
    page.drawText('FECHA: 2 al 6 de noviembre de 2026 (5 días continuos de jornadas académicas)', {
      x: 52,
      y: 548,
      size: 9,
      font: fontBold,
      color: NAVY
    });
    page.drawText('SEDE: Hotel Biotel Suites, Barquisimeto · Frente al Obelisco (Final Av. Libertador)', {
      x: 52,
      y: 533,
      size: 8.5,
      font: fontRegular,
      color: SLATE_TEXT
    });
    page.drawText('MODALIDAD: Presencial · 2 Salones en paralelo · Aval Institucional y Crédito Académico', {
      x: 52,
      y: 520,
      size: 8.5,
      font: fontBold,
      color: CLINIC_TEAL
    });

    // DOS SALONES SIMULTÁNEOS (y = 430 a 500, height 70)
    // Salón Principal (1)
    page.drawRectangle({
      x: 36,
      y: 432,
      width: 262,
      height: 70,
      color: WHITE,
      borderColor: rgb(147 / 255, 197 / 255, 253 / 255),
      borderWidth: 1.5
    });
    page.drawRectangle({
      x: 36,
      y: 480,
      width: 262,
      height: 22,
      color: rgb(238 / 255, 242 / 255, 255 / 255)
    });
    page.drawText('Salón Principal (1)', {
      x: 48,
      y: 486,
      size: 11,
      font: fontBold,
      color: NAVY
    });
    page.drawText('Capacidad máxima: 240 puestos por turno', {
      x: 48,
      y: 466,
      size: 8.5,
      font: fontBold,
      color: BRAND
    });
    page.drawText('Sesiones plenarias, simposios de alta concurrencia y', {
      x: 48,
      y: 453,
      size: 7.5,
      font: fontRegular,
      color: SLATE_MUTED
    });
    page.drawText('jornadas médicas centrales del evento.', {
      x: 48,
      y: 442,
      size: 7.5,
      font: fontRegular,
      color: SLATE_MUTED
    });

    // Salón Alterno (2)
    page.drawRectangle({
      x: 314,
      y: 432,
      width: 262,
      height: 70,
      color: WHITE,
      borderColor: rgb(167 / 255, 243 / 255, 208 / 255),
      borderWidth: 1.5
    });
    page.drawRectangle({
      x: 314,
      y: 480,
      width: 262,
      height: 22,
      color: GREEN_BG
    });
    page.drawText('Salón Alterno (2)', {
      x: 326,
      y: 486,
      size: 11,
      font: fontBold,
      color: rgb(6 / 255, 95 / 255, 70 / 255)
    });
    page.drawText('Capacidad máxima: 60 puestos por turno', {
      x: 326,
      y: 466,
      size: 8.5,
      font: fontBold,
      color: GREEN_TEXT
    });
    page.drawText('Subespecialidades focalizadas, talleres prácticos,', {
      x: 326,
      y: 453,
      size: 7.5,
      font: fontRegular,
      color: SLATE_MUTED
    });
    page.drawText('imágenes diagnósticas y sesiones interactivas.', {
      x: 326,
      y: 442,
      size: 7.5,
      font: fontRegular,
      color: SLATE_MUTED
    });

    // BIENVENIDA INSTITUCIONAL (y = 250 a 415, height 165)
    page.drawRectangle({
      x: 36,
      y: 252,
      width: PAGE_WIDTH - 72,
      height: 165,
      color: CARD_BG,
      borderColor: BORDER,
      borderWidth: 1
    });

    page.drawText('MENSAJE DEL COMITÉ ORGANIZADOR Y DIRECCIÓN GENERAL', {
      x: 52,
      y: 396,
      size: 10,
      font: fontBold,
      color: NAVY
    });
    page.drawRectangle({
      x: 52,
      y: 390,
      width: 180,
      height: 2,
      color: BRAND
    });

    const p1 = 'El Hospital Central Universitario Dr. Antonio María Pineda (HCUAMP), institución pionera de salud, docencia';
    const p2 = 'e investigación del centroccidente venezolano, presenta su máxima cita científica anual. Este congreso reúne a los';
    const p3 = 'más distinguidos especialistas, docentes, residentes y profesionales de la salud con el propósito de transferir';
    const p4 = 'conocimiento de frontera, discutir casos de alta complejidad y promover las mejores prácticas clínicas.';
    const p5 = 'Durante cinco días de intensa actividad académica en dos salones simultáneos, se abordarán 13 especialidades';
    const p6 = 'médicas y quirúrgicas, contando con ponencias magistrales, simposios de vanguardia y discusiones interdisciplinarias.';
    const p7 = 'Reiteramos nuestro compromiso con la formación médica continua y la excelencia hospitalaria.';

    let curY = 372;
    [p1, p2, p3, p4, p5, p6, p7].forEach((line) => {
      page.drawText(line, { x: 52, y: curY, size: 8.5, font: fontRegular, color: SLATE_TEXT });
      curY -= 13;
    });

    page.drawText('Comité Organizador · HCUAMP · «Ciencia, Ética y Vocación de Servicio»', {
      x: 52,
      y: 268,
      size: 8,
      font: fontBoldOblique,
      color: BRAND
    });

    // 4 INDICADORES DESTACADOS (y = 95 a 235, height 140)
    const metrics = [
      { num: '13', label: 'Especialidades', desc: 'Médicas y Quirúrgicas en paralelo', color: NAVY },
      { num: '+40', label: 'Conferencias', desc: 'Ponencias magistrales de expertos', color: BRAND },
      { num: '300', label: 'Puestos / Turno', desc: 'Aforo en Salones (1) y (2)', color: CLINIC_TEAL },
      { num: '100%', label: 'Exonerado HCUAMP', desc: 'Acceso para todo el personal HCUAMP', color: GOLD }
    ];

    const boxW = (PAGE_WIDTH - 72 - 30) / 4;
    metrics.forEach((m, idx) => {
      const bx = 36 + idx * (boxW + 10);
      page.drawRectangle({
        x: bx,
        y: 110,
        width: boxW,
        height: 125,
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 1
      });
      page.drawRectangle({
        x: bx,
        y: 229,
        width: boxW,
        height: 6,
        color: m.color
      });

      page.drawText(m.num, {
        x: bx + 12,
        y: 188,
        size: 26,
        font: fontBold,
        color: m.color
      });
      page.drawText(m.label, {
        x: bx + 12,
        y: 168,
        size: 9.5,
        font: fontBold,
        color: SLATE_DARK
      });
      page.drawText(m.desc, {
        x: bx + 12,
        y: 142,
        size: 7.5,
        font: fontRegular,
        color: SLATE_MUTED
      });
      page.drawText('Certificado incluido', {
        x: bx + 12,
        y: 124,
        size: 7,
        font: fontBold,
        color: CLINIC_TEAL
      });
    });

    // Nota al pie de portada
    page.drawText('Inscripciones abiertas en línea: congresopineda.vercel.app · Registro inmediato con credencial y código QR.', {
      x: 36,
      y: 80,
      size: 8,
      font: fontBold,
      color: BRAND
    });

    drawFooter(page, 1);
  }

  /* ══════════════════════════════════════════════════════════════════
     PÁGINA 2: EJES TEMÁTICOS Y ESPECIALIDADES MÉDICAS
     ══════════════════════════════════════════════════════════════════ */
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawInnerHeader(page, 'EJES TEMÁTICOS Y ESPECIALIDADES MÉDICAS', 'Programa científico multidisciplinario de alto nivel académico');

    // Introducción
    page.drawText('El congreso contempla 13 áreas especializadas distribuidas a lo largo de las 5 jornadas académicas:', {
      x: 36,
      y: PAGE_HEIGHT - 82,
      size: 9,
      font: fontBold,
      color: SLATE_DARK
    });

    const specialtiesCol1 = [
      {
        num: '01',
        name: 'Medicina Interna',
        desc: 'Manejo del paciente crítico crónico, protocolos de sepsis, terapéutica cardiovascular y patologías metabólicas prevalentes.'
      },
      {
        num: '02',
        name: 'Neurocirugía',
        desc: 'Microcirugía vascular y tumoral, neurotrauma severo, monitorización multimodal e innovaciones en cirugía mínimamente invasiva.'
      },
      {
        num: '03',
        name: 'Diagnóstico por Imágenes',
        desc: 'Resonancia magnética de alto campo, ecografía Doppler vascular avanzada y radiología intervencionista en el paciente agudo.'
      },
      {
        num: '04',
        name: 'Ginecología y Obstetricia',
        desc: 'Medicina materno-fetal de precisión, control de hemorragia obstétrica masiva, patología del suelo pélvico y cirugía laparoscópica.'
      },
      {
        num: '05',
        name: 'Dermatología',
        desc: 'Dermatoscopia avanzada en lesiones melanocíticas, dermatología oncológica y terapéutica en patologías autoinmunes complejas.'
      },
      {
        num: '06',
        name: 'Otorrinolaringología',
        desc: 'Cirugía endoscópica funcional nasosinusal, patología laríngea y fonocirugía, así como novedades en otología e hipoacusias.'
      },
      {
        num: '07',
        name: 'Urología',
        desc: 'Endourología moderna, litiasis urinaria compleja, abordaje uro-oncológico y técnicas quirúrgicas reconstructivas.'
      }
    ];

    const specialtiesCol2 = [
      {
        num: '08',
        name: 'Oftalmología',
        desc: 'Cirugía facoemulsificante de catarata, diagnóstico de retina médica y quirúrgica, glaucoma y manejo de la superficie ocular.'
      },
      {
        num: '09',
        name: 'Emergencia y Soporte Vital',
        desc: 'Reanimación cardiopulmonar avanzada, triaje hospitalario de emergencias masivas y estabilización del paciente politraumatizado.'
      },
      {
        num: '10',
        name: 'Medicina Física y Rehabilitación',
        desc: 'Neurorrehabilitación integral, rehabilitación post-quirúrgica temprana, terapia ocupacional y readaptación funcional biomecánica.'
      },
      {
        num: '11',
        name: 'Salud Mental y Psiquiatría',
        desc: 'Salud mental del personal sanitario, neurociencias, abordaje interdisciplinario de trastornos afectivos y psiquiatría de enlace.'
      },
      {
        num: '12',
        name: 'Gastroenterología',
        desc: 'Endoscopia digestiva diagnóstica y terapéutica avanzada, hepatología clínica y abordaje integral de la enfermedad inflamatoria.'
      },
      {
        num: '13',
        name: 'Traumatología y Ortopedia',
        desc: 'Osteosíntesis biológica, reemplazos articulares primarios y de revisión, rescate en trauma musculoesquelético y artroscopia.'
      }
    ];

    const colW = 262;
    let yPos = PAGE_HEIGHT - 100;

    // Render Columna 1
    specialtiesCol1.forEach((s) => {
      page.drawRectangle({
        x: 36,
        y: yPos - 56,
        width: colW,
        height: 52,
        color: CARD_BG,
        borderColor: BORDER,
        borderWidth: 1
      });
      page.drawRectangle({
        x: 36,
        y: yPos - 56,
        width: 4,
        height: 52,
        color: BRAND
      });
      page.drawText(`${s.num}. ${s.name}`, {
        x: 48,
        y: yPos - 18,
        size: 9.5,
        font: fontBold,
        color: NAVY
      });
      page.drawText(s.desc, {
        x: 48,
        y: yPos - 32,
        size: 7.2,
        font: fontRegular,
        color: SLATE_TEXT,
        maxWidth: colW - 20,
        lineHeight: 9.5
      });
      yPos -= 58;
    });

    // Render Columna 2
    let yPos2 = PAGE_HEIGHT - 100;
    specialtiesCol2.forEach((s) => {
      page.drawRectangle({
        x: 314,
        y: yPos2 - 56,
        width: colW,
        height: 52,
        color: CARD_BG,
        borderColor: BORDER,
        borderWidth: 1
      });
      page.drawRectangle({
        x: 314,
        y: yPos2 - 56,
        width: 4,
        height: 52,
        color: CLINIC_TEAL
      });
      page.drawText(`${s.num}. ${s.name}`, {
        x: 326,
        y: yPos2 - 18,
        size: 9.5,
        font: fontBold,
        color: NAVY
      });
      page.drawText(s.desc, {
        x: 326,
        y: yPos2 - 32,
        size: 7.2,
        font: fontRegular,
        color: SLATE_TEXT,
        maxWidth: colW - 20,
        lineHeight: 9.5
      });
      yPos2 -= 58;
    });

    // PANEL DE PONENTES DESTACADOS (y = 65 a 215, height 150)
    page.drawRectangle({
      x: 36,
      y: 65,
      width: PAGE_WIDTH - 72,
      height: 145,
      color: BRAND_LIGHT,
      borderColor: rgb(191 / 255, 219 / 255, 254 / 255),
      borderWidth: 1.5
    });

    page.drawText('ALGUNOS DE NUESTROS PONENTES Y DOCENTES DESTACADOS', {
      x: 52,
      y: 192,
      size: 10,
      font: fontBold,
      color: NAVY
    });

    const speakers = [
      { name: 'Dr. Ángel Echenique', area: 'Emergencia General y Medicina Interna', loc: 'Salón Alterno (2)' },
      { name: 'Dr. Adelino Andrade', area: 'Urología y Endourología Avanzada', loc: 'Salón Alterno (2)' },
      { name: 'Dr. José Gregorio Hernández', area: 'Cardiología Intervencionista', loc: 'Salón Principal (1)' },
      { name: 'Dra. María Corina Mendoza', area: 'Neurocirugía y Microcirugía Vascular', loc: 'Salón Principal (1)' },
      { name: 'Dra. Carmen Elena Romero', area: 'Ginecología y Obstetricia de Alta Complejidad', loc: 'Salón Principal (1)' },
      { name: 'Dr. Luis Eduardo Pernalete', area: 'Traumatología y Ortopedia Quirúrgica', loc: 'Salón Principal (1)' },
      { name: 'Dr. Carlos Alberto Méndez', area: 'Gastroenterología y Endoscopia Terapéutica', loc: 'Salón Principal (1)' },
      { name: 'Dra. Patricia Isabel Colmenárez', area: 'Dermatología Clínica y Dermatoscopia', loc: 'Salón Alterno (2)' }
    ];

    const spkW = (PAGE_WIDTH - 72 - 30) / 2;
    speakers.forEach((spk, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const sx = 52 + col * (spkW + 10);
      const sy = 172 - row * 26;

      page.drawText(`• ${spk.name}`, { x: sx, y: sy, size: 8, font: fontBold, color: NAVY });
      page.drawText(`${spk.area} · ${spk.loc}`, { x: sx + 8, y: sy - 10, size: 7, font: fontRegular, color: SLATE_MUTED });
    });

    drawFooter(page, 2);
  }

  /* ══════════════════════════════════════════════════════════════════
     PÁGINA 3: CRONOGRAMA GENERAL DE ACTIVIDADES (AGENDA)
     ══════════════════════════════════════════════════════════════════ */
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawInnerHeader(
      page,
      'CRONOGRAMA GENERAL DE ACTIVIDADES',
      'Distribución de jornadas en Salón Principal (1) y Salón Alterno (2)'
    );

    // Franja de Horarios
    page.drawRectangle({
      x: 36,
      y: PAGE_HEIGHT - 102,
      width: PAGE_WIDTH - 72,
      height: 30,
      color: CARD_BG,
      borderColor: BORDER,
      borderWidth: 1
    });

    page.drawText('HORARIOS OFICIALES:', {
      x: 48,
      y: PAGE_HEIGHT - 92,
      size: 8.5,
      font: fontBold,
      color: NAVY
    });
    page.drawText('Turno Mañana: 8:00 a. m. – 12:30 m.', {
      x: 170,
      y: PAGE_HEIGHT - 92,
      size: 8.5,
      font: fontBold,
      color: BRAND
    });
    page.drawText('·   Receso y Almuerzo: 12:30 m. – 2:00 p. m.   ·', {
      x: 325,
      y: PAGE_HEIGHT - 92,
      size: 8,
      font: fontRegular,
      color: SLATE_MUTED
    });
    page.drawText('Turno Tarde: 2:00 p. m. – 5:50 p. m.', {
      x: 480,
      y: PAGE_HEIGHT - 92,
      size: 8.5,
      font: fontBold,
      color: CLINIC_TEAL
    });

    // 5 Tarjetas para los 5 días de Congreso
    const daysData = [
      {
        day: 'LUNES 02 DE NOVIEMBRE DE 2026',
        theme: 'Inauguración Oficial, Medicina Interna, Neurocirugía e Imágenes',
        morning: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Acto Protocolar de Apertura Institucional (8:00 a. m.) & Jornada de Medicina Interna: sepsis, patología vascular y soporte clínico.' }
        ],
        afternoon: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Simposio de Neurocirugía: microcirugía craneal, neurotrauma severo e hipertensión intracraneal.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Jornada de Diagnóstico por Imágenes: ultrasonido doppler intervencionista y resonancia magnética.' }
        ]
      },
      {
        day: 'MARTES 03 DE NOVIEMBRE DE 2026',
        theme: 'Ginecología y Obstetricia, Dermatología, ORL y Urología',
        morning: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Jornada de Ginecología y Obstetricia: medicina materno-fetal, hemorragia postparto y piso pélvico.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Jornada de Dermatología: dermatoscopia en lesiones de difícil diagnóstico y dermatología oncológica.' }
        ],
        afternoon: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Simposio de Otorrinolaringología: cirugía nasosinusal guiada y patología de cuerdas vocales.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Jornada de Urología: técnicas endourológicas en litiasis compleja y abordaje de masas renales.' }
        ]
      },
      {
        day: 'MIÉRCOLES 04 DE NOVIEMBRE DE 2026',
        theme: 'Oftalmología, Emergencia, Medicina Física, Rehabilitación y Salud Mental',
        morning: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Jornada de Oftalmología: técnicas actuales en facoemulsificación, glaucoma y retinopatías.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Simposio de Emergencia: soporte vital avanzado, reanimación y manejo pre e intrahospitalario.' }
        ],
        afternoon: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Jornada de Medicina Física y Rehabilitación: neurorrehabilitación y terapia musculoesquelética.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Jornada de Salud Mental y Psiquiatría: manejo del estrés clínico hospitalario y neurociencias.' }
        ]
      },
      {
        day: 'JUEVES 05 DE NOVIEMBRE DE 2026',
        theme: 'Gastroenterología y Cardiología Intervencionista',
        morning: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Simposio de Gastroenterología: endoscopia digestiva terapéutica, hemorragia digestiva y hepatología.' }
        ],
        afternoon: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Jornada de Cardiología: síndromes coronarios agudos, falla cardíaca, hemodinámica y arritmias.' }
        ]
      },
      {
        day: 'VIERNES 06 DE NOVIEMBRE DE 2026',
        theme: 'Traumatología, Trabajos Libres, Plenaria y Clausura del Congreso',
        morning: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Jornada de Traumatología y Ortopedia: osteosíntesis biológica y reemplazos articulares complejos.' }
        ],
        afternoon: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Sesión Plenaria de Cierre, Presentación de Trabajos de Investigación Ganadores, Entrega de Premios Académicos y Acto Solemne de Clausura (5:30 p. m.).' }
        ]
      }
    ];

    let dayY = PAGE_HEIGHT - 120;
    daysData.forEach((d, dIdx) => {
      const cardHeight = d.morning.length + d.afternoon.length > 2 ? 104 : 92;

      page.drawRectangle({
        x: 36,
        y: dayY - cardHeight,
        width: PAGE_WIDTH - 72,
        height: cardHeight,
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 1.2
      });

      // Cabecera del día
      page.drawRectangle({
        x: 36,
        y: dayY - 22,
        width: PAGE_WIDTH - 72,
        height: 22,
        color: dIdx % 2 === 0 ? NAVY : BRAND
      });

      page.drawText(d.day, {
        x: 48,
        y: dayY - 15,
        size: 9,
        font: fontBold,
        color: WHITE
      });
      page.drawText(`·   ${d.theme}`, {
        x: 230,
        y: dayY - 15,
        size: 7.5,
        font: fontRegular,
        color: rgb(224 / 255, 242 / 255, 254 / 255)
      });

      let subY = dayY - 36;

      // Mañana
      d.morning.forEach((m) => {
        page.drawText('MAÑANA:', { x: 48, y: subY, size: 7.5, font: fontBold, color: BRAND });
        page.drawText(m.salon, { x: 92, y: subY, size: 7.5, font: fontBold, color: NAVY });
        page.drawText(m.text, { x: 235, y: subY, size: 7.2, font: fontRegular, color: SLATE_TEXT, maxWidth: 330 });
        subY -= 17;
      });

      // Tarde
      d.afternoon.forEach((a) => {
        page.drawText('TARDE:', { x: 48, y: subY, size: 7.5, font: fontBold, color: CLINIC_TEAL });
        page.drawText(a.salon, { x: 92, y: subY, size: 7.5, font: fontBold, color: NAVY });
        page.drawText(a.text, { x: 235, y: subY, size: 7.2, font: fontRegular, color: SLATE_TEXT, maxWidth: 330 });
        subY -= 17;
      });

      dayY -= (cardHeight + 10);
    });

    // Cuadro de control de acceso y asistencia
    page.drawRectangle({
      x: 36,
      y: 55,
      width: PAGE_WIDTH - 72,
      height: 54,
      color: BRAND_LIGHT,
      borderColor: rgb(191 / 255, 219 / 255, 254 / 255),
      borderWidth: 1
    });

    page.drawText('CONTROL DE ASISTENCIA Y ACREDITACIÓN DIGITAL EN SALA:', {
      x: 48,
      y: 93,
      size: 8.5,
      font: fontBold,
      color: NAVY
    });
    page.drawText('• Cada participante dispone de un Código QR único generado al registrarse, el cual será escaneado en las puertas de cada salón.', {
      x: 48,
      y: 80,
      size: 7.5,
      font: fontRegular,
      color: SLATE_TEXT
    });
    page.drawText('• Se requiere un mínimo del 75% de asistencia a las sesiones seleccionadas para la emisión del certificado con aval curricular.', {
      x: 48,
      y: 67,
      size: 7.5,
      font: fontBold,
      color: BRAND
    });

    drawFooter(page, 3);
  }

  /* ══════════════════════════════════════════════════════════════════
     PÁGINA 4: INSCRIPCIONES, TARIFAS, ACCESO Y CONTACTO
     ══════════════════════════════════════════════════════════════════ */
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawInnerHeader(
      page,
      'INFORMACIÓN DE INSCRIPCIÓN Y TARIFAS',
      'Modalidades para Personal HCUAMP y Participantes de Otras Instituciones'
    );

    // TARJETA 1: PERSONAL DEL HCUAMP (100% Exonerado)
    page.drawRectangle({
      x: 36,
      y: PAGE_HEIGHT - 215,
      width: PAGE_WIDTH - 72,
      height: 140,
      color: GREEN_BG,
      borderColor: rgb(167 / 255, 243 / 255, 208 / 255),
      borderWidth: 1.5
    });

    // Badge
    page.drawRectangle({
      x: 50,
      y: PAGE_HEIGHT - 105,
      width: 220,
      height: 18,
      color: GREEN_TEXT
    });
    page.drawText('PERSONAL DEL HCUAMP · 100% EXONERADO', {
      x: 60,
      y: PAGE_HEIGHT - 99,
      size: 8,
      font: fontBold,
      color: WHITE
    });

    page.drawText('Exoneración Total de Pago (0$ / Sin Costo)', {
      x: 50,
      y: PAGE_HEIGHT - 125,
      size: 14,
      font: fontBold,
      color: rgb(6 / 255, 95 / 255, 70 / 255)
    });

    page.drawText('Aplica a todo el talento humano activo y en formación del Hospital Central Universitario Dr. Antonio María Pineda:', {
      x: 50,
      y: PAGE_HEIGHT - 142,
      size: 8.2,
      font: fontBold,
      color: SLATE_DARK
    });

    const hcuampRoles = [
      '• Médicos Especialistas y Adjuntos',
      '• Médicos Residentes de Postgrado',
      '• Profesionales de Enfermería',
      '• Fisioterapeutas y Terapeutas Ocupacionales',
      '• Técnicos Radiólogos y Optometristas',
      '• Bachilleres y Personal Asistencial'
    ];

    hcuampRoles.forEach((role, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      page.drawText(role, {
        x: 50 + col * 250,
        y: PAGE_HEIGHT - 158 - row * 14,
        size: 7.8,
        font: fontRegular,
        color: SLATE_TEXT
      });
    });

    page.drawText('VALIDACIÓN DIRECTA: Solo ingresa tu número de cédula en el portal y el sistema consultará automáticamente la nómina institucional.', {
      x: 50,
      y: PAGE_HEIGHT - 206,
      size: 7.5,
      font: fontBold,
      color: GREEN_TEXT
    });

    // TARJETA 2: OTRAS INSTITUCIONES (Tarifas por día)
    page.drawRectangle({
      x: 36,
      y: PAGE_HEIGHT - 380,
      width: PAGE_WIDTH - 72,
      height: 155,
      color: WHITE,
      borderColor: BORDER,
      borderWidth: 1.5
    });

    // Cabecera tabla de tarifas
    page.drawRectangle({
      x: 36,
      y: PAGE_HEIGHT - 250,
      width: PAGE_WIDTH - 72,
      height: 25,
      color: NAVY
    });
    page.drawText('PARTICIPANTES DE OTRAS INSTITUCIONES · TARIFAS OFICIALES POR DÍA', {
      x: 50,
      y: PAGE_HEIGHT - 240,
      size: 9,
      font: fontBold,
      color: WHITE
    });
    page.drawText('El pago es por día e incluye acceso a los turnos seleccionados (mañana y/o tarde) de esa jornada:', {
      x: 50,
      y: PAGE_HEIGHT - 264,
      size: 8,
      font: fontRegular,
      color: SLATE_MUTED
    });

    // Tabla de tarifas
    const rates = [
      { cat: 'Médico General y Médico Especialista', price: '20 USD / día' },
      { cat: 'Médico Residente de Postgrado', price: '15 USD / día' },
      { cat: 'Licenciados(as) y Técnicos(as) en Enfermería', price: '10 USD / día' },
      { cat: 'Fisioterapeuta / Terapeuta Ocupacional / Terapeutas Afines', price: '15 USD / día' },
      { cat: 'Otro Personal Afín a las Ciencias de la Salud', price: '15 USD / día' },
      { cat: 'Acompañante de Participante', price: '15 USD / día' }
    ];

    rates.forEach((r, idx) => {
      const rx = 50 + (idx % 2) * 260;
      const ry = PAGE_HEIGHT - 285 - Math.floor(idx / 2) * 20;

      page.drawRectangle({
        x: rx - 5,
        y: ry - 4,
        width: 250,
        height: 17,
        color: idx % 2 === 0 ? rgb(248 / 255, 250 / 255, 252 / 255) : rgb(241 / 255, 245 / 255, 249 / 255)
      });
      page.drawText(r.cat, { x: rx, y: ry, size: 7.5, font: fontRegular, color: SLATE_DARK, maxWidth: 180 });
      page.drawText(r.price, { x: rx + 185, y: ry, size: 7.8, font: fontBold, color: BRAND });
    });

    page.drawText('• Pagos en Bolívares mediante Pago Móvil o Transferencia bancaria a la tasa oficial BCV del día de inscripción.', {
      x: 50,
      y: PAGE_HEIGHT - 355,
      size: 7.5,
      font: fontBold,
      color: NAVY
    });
    page.drawText('• Todo comprobante bancario es verificado por el comité administrativo antes de validar el pase final.', {
      x: 50,
      y: PAGE_HEIGHT - 368,
      size: 7.2,
      font: fontRegular,
      color: SLATE_MUTED
    });

    // BENEFICIOS INCLUIDOS EN LA INSCRIPCIÓN (y = 230 a 305, height 75)
    page.drawRectangle({
      x: 36,
      y: 228,
      width: PAGE_WIDTH - 72,
      height: 72,
      color: BRAND_LIGHT,
      borderColor: rgb(191 / 255, 219 / 255, 254 / 255),
      borderWidth: 1
    });

    page.drawText('LA INSCRIPCIÓN INCLUYE FORMALMENTE:', {
      x: 50,
      y: 285,
      size: 9,
      font: fontBold,
      color: NAVY
    });

    const perks = [
      '• Acceso a las ponencias académicas según turnos y salones seleccionados.',
      '• Certificado digital con aval del HCUAMP y horas de crédito académico.',
      '• Kit del participante oficial del evento y material académico digitalizado.',
      '• Credencial digital con Código QR personalizado para acceso ágil en puertas.'
    ];

    perks.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      page.drawText(p, {
        x: 50 + col * 260,
        y: 268 - row * 15,
        size: 7.5,
        font: fontRegular,
        color: SLATE_TEXT
      });
    });

    // TARJETA INFERIOR: REGISTRO CON CÓDIGO QR Y DATOS DE CONTACTO
    page.drawRectangle({
      x: 36,
      y: 52,
      width: PAGE_WIDTH - 72,
      height: 164,
      color: CARD_BG,
      borderColor: BORDER,
      borderWidth: 1.5
    });

    // Código QR
    page.drawImage(qrImg, {
      x: 50,
      y: 62,
      width: 140,
      height: 140
    });

    // Información al lado del QR
    page.drawText('REGÍSTRATE EN LÍNEA DESDE TU MÓVIL', {
      x: 205,
      y: 190,
      size: 11,
      font: fontBold,
      color: NAVY
    });
    page.drawText('Escanea este código QR con la cámara de tu teléfono inteligente para acceder', {
      x: 205,
      y: 176,
      size: 7.8,
      font: fontRegular,
      color: SLATE_TEXT
    });
    page.drawText('directamente a la plataforma oficial de registro del congreso:', {
      x: 205,
      y: 165,
      size: 7.8,
      font: fontRegular,
      color: SLATE_TEXT
    });

    page.drawRectangle({
      x: 205,
      y: 135,
      width: 340,
      height: 24,
      color: BRAND
    });
    page.drawText('https://congresopineda.vercel.app', {
      x: 220,
      y: 143,
      size: 10,
      font: fontBold,
      color: WHITE
    });

    page.drawText('SEDE: Hotel Biotel Suites · Barquisimeto, Estado Lara', {
      x: 205,
      y: 122,
      size: 8,
      font: fontBold,
      color: NAVY
    });
    page.drawText('Final de la Av. Libertador con inicio de la Av. Florencio Jiménez,', {
      x: 205,
      y: 110,
      size: 7.5,
      font: fontRegular,
      color: SLATE_MUTED
    });
    page.drawText('frente al monumento El Obelisco, Barquisimeto (3001), estado Lara, Venezuela.', {
      x: 205,
      y: 99,
      size: 7.5,
      font: fontRegular,
      color: SLATE_MUTED
    });

    page.drawText('CONTACTO: congreso@hcuamp.gob.ve · Hospital Central Dr. Antonio María Pineda', {
      x: 205,
      y: 84,
      size: 7.5,
      font: fontBold,
      color: CLINIC_TEAL
    });
    page.drawText('Comité Organizador · Dirección General · Decanato de Ciencias de la Salud', {
      x: 205,
      y: 72,
      size: 7.2,
      font: fontRegular,
      color: SLATE_MUTED
    });

    drawFooter(page, 4);
  }

  // Guardar archivo PDF en public/
  const pdfBytes = await doc.save();
  const outputPath = path.join(__dirname, '../public/folleto-congreso-pineda-2026.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Brochure PDF generado exitosamente en: ${outputPath}`);
  console.log(`Tamaño del archivo: ${(pdfBytes.length / 1024).toFixed(2)} KB`);
}

buildBrochure().catch((err) => {
  console.error('Error al generar el brochure PDF:', err);
  process.exit(1);
});

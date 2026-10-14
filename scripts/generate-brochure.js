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
  const NAVY = rgb(11 / 255, 37 / 255, 69 / 255);          // #0b2545
  const NAVY_DARK = rgb(7 / 255, 23 / 255, 44 / 255);     // #07172c
  const BRAND = rgb(29 / 255, 99 / 255, 216 / 255);        // #1d63d8
  const BRAND_LIGHT = rgb(239 / 255, 246 / 255, 255 / 255);// #eff6ff
  const CLINIC = rgb(14 / 255, 165 / 255, 233 / 255);      // #0ea5e9
  const CLINIC_TEAL = rgb(13 / 255, 148 / 255, 136 / 255); // #0d9488
  const GOLD = rgb(217 / 255, 119 / 255, 6 / 255);        // #d97706
  const WHITE = rgb(1, 1, 1);
  const SLATE_DARK = rgb(15 / 255, 23 / 255, 42 / 255);    // #0f172a
  const SLATE_TEXT = rgb(51 / 255, 65 / 255, 85 / 255);    // #334155
  const SLATE_MUTED = rgb(100 / 255, 116 / 255, 139 / 255);// #64748b
  const BORDER = rgb(226 / 255, 232 / 255, 240 / 255);     // #e2e8f0
  const CARD_BG = rgb(248 / 255, 250 / 255, 252 / 255);    // #f8fafc
  const GREEN_BG = rgb(236 / 255, 253 / 255, 245 / 255);   // #ecfdf5
  const GREEN_TEXT = rgb(4 / 255, 120 / 255, 87 / 255);    // #047857

  // Helper de ajuste de texto para evitar desbordamiento
  function wrapText(text, font, size, maxWidth) {
    const words = String(text || '').trim().split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function drawWrappedText(page, text, { x, y, font, size, color, maxWidth, lineHeight }) {
    const lines = wrapText(text, font, size, maxWidth);
    let curY = y;
    const lh = lineHeight || size * 1.25;
    for (const line of lines) {
      page.drawText(line, { x, y: curY, size, font, color });
      curY -= lh;
    }
    return curY;
  }

  // Cargar imágenes
  const imgDir = path.join(__dirname, '../public/images');
  const logoImg = await doc.embedPng(fs.readFileSync(path.join(imgDir, 'logo-congreso-pineda.png')));
  const isoImg = await doc.embedPng(fs.readFileSync(path.join(imgDir, 'isotipo-congreso.png')));
  const audImg = await doc.embedJpg(fs.readFileSync(path.join(imgDir, 'auditorium.jpg')));
  const medConfImg = await doc.embedJpg(fs.readFileSync(path.join(imgDir, 'med-conference.jpg')));
  const keynoteImg = await doc.embedJpg(fs.readFileSync(path.join(imgDir, 'medical-keynote.jpg')));
  const teamImg = await doc.embedJpg(fs.readFileSync(path.join(imgDir, 'doctor-team.jpg')));

  // Ponentes destacados auténticos
  const spkEchenique = await doc.embedJpg(fs.readFileSync(path.join(imgDir, 'speakers/dr-angel-echenique.jpg')));
  const spkAndrade = await doc.embedJpg(fs.readFileSync(path.join(imgDir, 'speakers/dr-adelino-andrade.jpg')));
  const spkCifuentes = await doc.embedJpg(fs.readFileSync(path.join(imgDir, 'speakers/speaker-4.jpg')));
  const spkGonzalez = await doc.embedJpg(fs.readFileSync(path.join(imgDir, 'speakers/speaker-8.jpg')));
  const spkFernandez = await doc.embedJpg(fs.readFileSync(path.join(imgDir, 'speakers/speaker-5.jpg')));
  const spkCatari = await doc.embedJpg(fs.readFileSync(path.join(imgDir, 'speakers/speaker-9.jpg')));

  // Generar Código QR de registro oficial
  const qrBuffer = await QRCode.toBuffer('https://congresopineda.vercel.app', {
    width: 360,
    margin: 1,
    color: { dark: '#0b2545', light: '#ffffff' }
  });
  const qrImg = await doc.embedPng(qrBuffer);

  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const TOTAL_PAGES = 4;
  const RIF_HCUAMP = 'G-20011811-3';

  // Helper para cabecera en páginas interiores
  function drawInnerHeader(page, title, subtitle) {
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 66,
      width: PAGE_WIDTH,
      height: 66,
      color: NAVY
    });
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 69,
      width: PAGE_WIDTH,
      height: 3,
      color: CLINIC
    });

    page.drawImage(isoImg, {
      x: 36,
      y: PAGE_HEIGHT - 58,
      width: 44,
      height: 46
    });

    page.drawText('XIV CONGRESO PINEDA 2026', {
      x: 90,
      y: PAGE_HEIGHT - 28,
      size: 11,
      font: fontBold,
      color: CLINIC
    });
    page.drawText(title, {
      x: 90,
      y: PAGE_HEIGHT - 44,
      size: 12.5,
      font: fontBold,
      color: WHITE
    });
    if (subtitle) {
      page.drawText(subtitle, {
        x: 90,
        y: PAGE_HEIGHT - 58,
        size: 7.2,
        font: fontRegular,
        color: rgb(203 / 255, 213 / 255, 225 / 255)
      });
    }

    const hospStr = 'Hospital Central Dr. Antonio María Pineda';
    const hospW = fontRegular.widthOfTextAtSize(hospStr, 6.8);
    page.drawText(hospStr, {
      x: PAGE_WIDTH - 36 - hospW,
      y: PAGE_HEIGHT - 28,
      size: 6.8,
      font: fontRegular,
      color: rgb(186 / 255, 230 / 255, 253 / 255)
    });
  }

  // Helper para pie de página
  function drawFooter(page, pageNum) {
    page.drawRectangle({
      x: 36,
      y: 40,
      width: PAGE_WIDTH - 72,
      height: 1,
      color: BORDER
    });

    page.drawText(`XIV CONGRESO PINEDA 2026 · Guía Oficial · Hospital Central Universitario «Dr. Antonio María Pineda» (RIF: ${RIF_HCUAMP})`, {
      x: 36,
      y: 26,
      size: 7.2,
      font: fontRegular,
      color: SLATE_MUTED
    });

    const pageStr = `Página ${pageNum} de ${TOTAL_PAGES}`;
    const pageStrWidth = fontBold.widthOfTextAtSize(pageStr, 8);
    page.drawText(pageStr, {
      x: PAGE_WIDTH - 36 - pageStrWidth,
      y: 26,
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

    // Banda superior principal destacando el XIV CONGRESO PINEDA 2026
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 90,
      width: PAGE_WIDTH,
      height: 90,
      color: WHITE
    });
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 3,
      width: PAGE_WIDTH,
      height: 3,
      color: NAVY
    });
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 93,
      width: PAGE_WIDTH,
      height: 3,
      color: CLINIC
    });

    // Logotipo oficial completo del Congreso Pineda (CP + CONGRESO PINEDA)
    page.drawImage(logoImg, {
      x: 36,
      y: PAGE_HEIGHT - 82,
      width: 172,
      height: 72
    });

    // Textos de cabecera con máxima jerarquía para el Congreso
    page.drawText('XIV CONGRESO PINEDA 2026', {
      x: 220,
      y: PAGE_HEIGHT - 34,
      size: 15,
      font: fontBold,
      color: NAVY
    });
    page.drawText('LIX Jornada de Egresados · LXXII Aniversario', {
      x: 220,
      y: PAGE_HEIGHT - 48,
      size: 9,
      font: fontBold,
      color: BRAND
    });
    page.drawText('GUÍA OFICIAL DEL PARTICIPANTE · FOLLETO DEL EVENTO', {
      x: 220,
      y: PAGE_HEIGHT - 61,
      size: 7.8,
      font: fontBold,
      color: CLINIC_TEAL
    });
    page.drawText(`Hospital Central Universitario «Dr. Antonio María Pineda» · RIF: ${RIF_HCUAMP} · Barquisimeto`, {
      x: 220,
      y: PAGE_HEIGHT - 74,
      size: 7,
      font: fontRegular,
      color: SLATE_MUTED
    });

    // BLOQUE HERO CENTRAL (y = 555 a 685, height 130)
    page.drawRectangle({
      x: 36,
      y: 545,
      width: PAGE_WIDTH - 72,
      height: 140,
      color: BRAND_LIGHT,
      borderColor: rgb(191 / 255, 219 / 255, 254 / 255),
      borderWidth: 1.5
    });

    // Badge
    page.drawRectangle({
      x: 50,
      y: 658,
      width: 220,
      height: 17,
      color: NAVY
    });
    page.drawText('FOLLETO OFICIAL DEL EVENTO', {
      x: 60,
      y: 663,
      size: 8,
      font: fontBold,
      color: WHITE
    });

    // Título Principal Oficial
    page.drawText('XIV CONGRESO PINEDA 2026', {
      x: 50,
      y: 633,
      size: 22,
      font: fontBold,
      color: NAVY
    });
    page.drawText('LIX Jornada de Egresados · LXXII Aniversario del HCUAMP', {
      x: 50,
      y: 614,
      size: 11.5,
      font: fontBold,
      color: BRAND
    });

    // Lema
    page.drawText('«Vanguardia Científica, Innovación y Compromiso con la Salud»', {
      x: 50,
      y: 598,
      size: 9.5,
      font: fontOblique,
      color: SLATE_TEXT
    });

    // Metadatos esenciales
    page.drawText('• Fechas: 2 al 6 de noviembre de 2026 (5 días continuos de jornadas académicas)', {
      x: 50,
      y: 578,
      size: 8.5,
      font: fontBold,
      color: NAVY
    });
    page.drawText('• Sede: Hotel Biotel Suites · Frente al Obelisco (Final Av. Libertador con Av. Florencio Jiménez, Barquisimeto)', {
      x: 50,
      y: 564,
      size: 8,
      font: fontRegular,
      color: SLATE_TEXT
    });
    page.drawText('• Aval Institucional HCUAMP con acreditación de horas crédito académicas', {
      x: 50,
      y: 552,
      size: 8,
      font: fontBold,
      color: CLINIC_TEAL
    });

    // FOTO TEMÁTICA Y SALONES (y = 445 a 535, height 90)
    // Foto auditorium
    page.drawImage(audImg, {
      x: 36,
      y: 440,
      width: 140,
      height: 95
    });
    page.drawRectangle({
      x: 36,
      y: 440,
      width: 140,
      height: 95,
      borderColor: BORDER,
      borderWidth: 1
    });

    // Tarjeta Salón Principal (1)
    page.drawRectangle({
      x: 184,
      y: 440,
      width: 190,
      height: 95,
      color: WHITE,
      borderColor: rgb(147 / 255, 197 / 255, 253 / 255),
      borderWidth: 1.2
    });
    page.drawRectangle({
      x: 184,
      y: 515,
      width: 190,
      height: 20,
      color: rgb(238 / 255, 242 / 255, 255 / 255)
    });
    page.drawText('Salón Principal (1)', {
      x: 194,
      y: 521,
      size: 10,
      font: fontBold,
      color: NAVY
    });
    page.drawText('Sesiones Plenarias y Simposios', {
      x: 194,
      y: 502,
      size: 8,
      font: fontBold,
      color: BRAND
    });
    drawWrappedText(
      page,
      'Acondicionado para conferencias magistrales, actos protocolares y simposios de alta especialidad con transmisión simultánea.',
      { x: 194, y: 488, font: fontRegular, size: 7.2, color: SLATE_TEXT, maxWidth: 172, lineHeight: 9.5 }
    );

    // Tarjeta Salón Alterno (2)
    page.drawRectangle({
      x: 382,
      y: 440,
      width: 194,
      height: 95,
      color: WHITE,
      borderColor: rgb(167 / 255, 243 / 255, 208 / 255),
      borderWidth: 1.2
    });
    page.drawRectangle({
      x: 382,
      y: 515,
      width: 194,
      height: 20,
      color: GREEN_BG
    });
    page.drawText('Salón Alterno (2)', {
      x: 392,
      y: 521,
      size: 10,
      font: fontBold,
      color: rgb(6 / 255, 95 / 255, 70 / 255)
    });
    page.drawText('Especialidades y Discusión Focalizada', {
      x: 392,
      y: 502,
      size: 8,
      font: fontBold,
      color: GREEN_TEXT
    });
    drawWrappedText(
      page,
      'Espacio interactivo para subespecialidades, discusión de casos clínicos focalizados y diagnóstico por imágenes.',
      { x: 392, y: 488, font: fontRegular, size: 7.2, color: SLATE_TEXT, maxWidth: 176, lineHeight: 9.5 }
    );

    // LOS ATRACTIVOS DEL CONGRESO (y = 235 a 428, height 193)
    page.drawRectangle({
      x: 36,
      y: 235,
      width: PAGE_WIDTH - 72,
      height: 193,
      color: CARD_BG,
      borderColor: BORDER,
      borderWidth: 1.2
    });

    page.drawText('LOS ATRACTIVOS PRINCIPALES DEL CONGRESO', {
      x: 50,
      y: 408,
      size: 11,
      font: fontBold,
      color: NAVY
    });
    page.drawRectangle({
      x: 50,
      y: 402,
      width: 220,
      height: 2,
      color: BRAND
    });

    const atractivos = [
      {
        badge: '104',
        title: 'Ponencias Científicas',
        desc: 'Distribuidas en 18 áreas especializadas durante las 5 jornadas académicas completas.'
      },
      {
        badge: '100+',
        title: 'Ponentes Destacados',
        desc: 'Cuerpo docente de alta trayectoria nacional e internacional y líderes de opinión médica.'
      },
      {
        badge: '2',
        title: 'Salones Acondicionados',
        desc: 'Salón Principal (1) y Salón Alterno (2) climatizados con tecnología audiovisual y transmisión.'
      },
      {
        badge: 'POSTER',
        title: 'Casos Clínicos en Modalidad Póster',
        desc: 'Exposición interactiva de investigaciones, casos clínicos y trabajos científicos libres.'
      },
      {
        badge: 'EXPO',
        title: 'Área de Stands Comerciales',
        desc: 'Espacio de networking y exhibición de la industria médico-farmacéutica y tecnológica.'
      },
      {
        badge: 'PREMIO',
        title: 'Premiaciones y Reconocimientos',
        desc: 'Premio al mejor trabajo de investigación y homenaje a las trayectorias médicas ejemplares.'
      }
    ];

    const atW = (PAGE_WIDTH - 72 - 30) / 3; // 170
    atractivos.forEach((at, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const ax = 50 + col * (atW + 8);
      const ay = 328 - row * 72;

      page.drawRectangle({
        x: ax,
        y: ay,
        width: atW,
        height: 64,
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 1
      });

      page.drawRectangle({
        x: ax,
        y: ay + 44,
        width: atW,
        height: 20,
        color: i % 2 === 0 ? rgb(241 / 255, 245 / 255, 249 / 255) : rgb(238 / 255, 242 / 255, 255 / 255)
      });

      page.drawText(at.badge, {
        x: ax + 8,
        y: ay + 50,
        size: 8,
        font: fontBold,
        color: BRAND
      });
      page.drawText(at.title, {
        x: ax + 8,
        y: ay + 30,
        size: 8.5,
        font: fontBold,
        color: NAVY
      });
      drawWrappedText(page, at.desc, {
        x: ax + 8,
        y: ay + 18,
        font: fontRegular,
        size: 6.8,
        color: SLATE_TEXT,
        maxWidth: atW - 16,
        lineHeight: 8.5
      });
    });

    // BIENVENIDA INSTITUCIONAL (y = 58 a 224, height 166)
    page.drawRectangle({
      x: 36,
      y: 58,
      width: PAGE_WIDTH - 72,
      height: 166,
      color: WHITE,
      borderColor: BORDER,
      borderWidth: 1
    });

    page.drawText('BIENVENIDA AL XIV CONGRESO PINEDA 2026', {
      x: 50,
      y: 206,
      size: 10,
      font: fontBold,
      color: NAVY
    });

    const introText =
      'El Comité Organizador y Científico del XIV Congreso Pineda 2026 se complace en convocar a la comunidad médica, asistencial y científica al magno encuentro académico del año. ' +
      'En el marco de la LIX Jornada de Egresados y el LXXII Aniversario del Hospital Central Universitario «Dr. Antonio María Pineda», este evento constituye un espacio de convergencia científica para compartir avances diagnósticos y terapéuticos de vanguardia, debatir sobre casos clínicos de alta complejidad y fomentar la excelencia clínica asistencial. ' +
      'Invitamos a médicos especialistas, residentes, profesionales de enfermería, terapeutas y estudiantes de ciencias de la salud a protagonizar una semana de intensa formación académica y fraternidad profesional.';

    drawWrappedText(page, introText, {
      x: 50,
      y: 190,
      font: fontRegular,
      size: 8.2,
      color: SLATE_TEXT,
      maxWidth: PAGE_WIDTH - 100,
      lineHeight: 12
    });

    page.drawText('XIV Congreso Pineda 2026 · Hospital Central Universitario «Dr. Antonio María Pineda» (HCUAMP)', {
      x: 50,
      y: 72,
      size: 7.8,
      font: fontBoldOblique,
      color: BRAND
    });

    drawFooter(page, 1);
  }

  /* ══════════════════════════════════════════════════════════════════
     PÁGINA 2: LAS 18 ÁREAS ESPECIALIZADAS Y PONENTES
     ══════════════════════════════════════════════════════════════════ */
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawInnerHeader(
      page,
      '18 ÁREAS ESPECIALIZADAS · 104 PONENCIAS CIENTÍFICAS',
      'Programa científico multidisciplinario diseñado para el perfeccionamiento clínico y quirúrgico'
    );

    // Grid de 18 especialidades (3 columnas x 6 filas)
    const specialties = [
      { num: '01', name: 'Medicina Interna', talks: '8 ponencias', desc: 'Manejo del paciente crítico, patología cardiovascular, sepsis y metabolismo.' },
      { num: '02', name: 'Cirugía General', talks: '6 ponencias', desc: 'Cirugía laparoscópica avanzada, abdomen agudo y trauma quirúrgico.' },
      { num: '03', name: 'Ginecología y Obstetricia', talks: '7 ponencias', desc: 'Medicina materno-fetal, hemorragia obstétrica y suelo pélvico.' },
      { num: '04', name: 'Traumatología y Ortopedia', talks: '8 ponencias', desc: 'Osteosíntesis moderna, reemplazos articulares y fracturas complejas.' },
      { num: '05', name: 'Emergencia General', talks: '8 ponencias', desc: 'Soporte vital avanzado, reanimación y estabilización del politraumatizado.' },
      { num: '06', name: 'Cardiología', talks: '6 ponencias', desc: 'Cardiología intervencionista, insuficiencia cardíaca y arritmias.' },
      { num: '07', name: 'Neurocirugía', talks: '5 ponencias', desc: 'Microcirugía vascular, neurotrauma severo y tumores cerebrales.' },
      { num: '08', name: 'Diagnóstico por Imágenes', talks: '6 ponencias', desc: 'Resonancia de alto campo, ultrasonido Doppler y radiología intervencionista.' },
      { num: '09', name: 'Dermatología', talks: '8 ponencias', desc: 'Dermatoscopia avanzada, oncología cutánea y patologías autoinmunes.' },
      { num: '10', name: 'Urología', talks: '6 ponencias', desc: 'Endourología mínimamente invasiva, litiasis urinaria y uro-oncología.' },
      { num: '11', name: 'Anestesiología', talks: '6 ponencias', desc: 'Manejo avanzado de la vía aérea, anestesia regional y analgesia postoperatoria.' },
      { num: '12', name: 'Oftalmología', talks: '7 ponencias', desc: 'Cirugía facoemulsificante, patología vítreo-retiniana y glaucoma.' },
      { num: '13', name: 'Otorrinolaringología (ORL)', talks: '5 ponencias', desc: 'Cirugía endoscópica nasosinusal, fonocirugía y patología ótica.' },
      { num: '14', name: 'Gastroenterología', talks: '4 ponencias', desc: 'Endoscopia terapéutica, hepatología clínica y hemorragia digestiva.' },
      { num: '15', name: 'Cirugía Plástica', talks: '5 ponencias', desc: 'Cirugía reconstructiva compleja, manejo del paciente quemado y estética.' },
      { num: '16', name: 'Medicina Física y Rehab.', talks: '4 ponencias', desc: 'Neurorrehabilitación integral, biomecánica y terapia musculoesquelética.' },
      { num: '17', name: 'Enfermería', talks: '4 ponencias', desc: 'Cuidados críticos hospitalarios, seguridad del paciente y gestión clínica.' },
      { num: '18', name: 'Salud Mental y Psiquiatría', talks: '1 ponencia', desc: 'Neurociencias, estrés laboral hospitalario y psiquiatría de enlace.' }
    ];

    const colW = (PAGE_WIDTH - 72 - 16) / 3; // 174 pt
    const cardH = 47;
    const startY = PAGE_HEIGHT - 82;

    specialties.forEach((s, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const cx = 36 + col * (colW + 8);
      const cy = startY - row * (cardH + 6);

      page.drawRectangle({
        x: cx,
        y: cy - cardH,
        width: colW,
        height: cardH,
        color: CARD_BG,
        borderColor: BORDER,
        borderWidth: 1
      });

      // Acento lateral
      page.drawRectangle({
        x: cx,
        y: cy - cardH,
        width: 3.5,
        height: cardH,
        color: idx % 2 === 0 ? BRAND : CLINIC_TEAL
      });

      // Título y ponencias
      const titleStr = `${s.num}. ${s.name}`;
      const titleSize = titleStr.length > 25 ? 6.8 : titleStr.length > 20 ? 7.2 : 7.8;
      page.drawText(titleStr, {
        x: cx + 8,
        y: cy - 13,
        size: titleSize,
        font: fontBold,
        color: NAVY
      });

      const talksW = fontBold.widthOfTextAtSize(s.talks, 6.2);
      page.drawText(s.talks, {
        x: cx + colW - 6 - talksW,
        y: cy - 13,
        size: 6.2,
        font: fontBold,
        color: BRAND
      });

      // Descripción
      drawWrappedText(page, s.desc, {
        x: cx + 8,
        y: cy - 26,
        font: fontRegular,
        size: 6.5,
        color: SLATE_TEXT,
        maxWidth: colW - 14,
        lineHeight: 8.5
      });
    });

    // PANEL DE PONENTES DESTACADOS CON FOTOS REALES (y = 52 a 390, height 338)
    page.drawRectangle({
      x: 36,
      y: 52,
      width: PAGE_WIDTH - 72,
      height: 338,
      color: WHITE,
      borderColor: BORDER,
      borderWidth: 1.2
    });

    // Barra de título del panel
    page.drawRectangle({
      x: 36,
      y: 364,
      width: PAGE_WIDTH - 72,
      height: 26,
      color: BRAND_LIGHT
    });

    page.drawText('CUERPO DOCENTE Y PONENTES DESTACADOS', {
      x: 48,
      y: 373,
      size: 10,
      font: fontBold,
      color: NAVY
    });
    page.drawText('+100 especialistas, conferencistas magistrales y docentes de trayectoria', {
      x: 298,
      y: 373,
      size: 7.2,
      font: fontRegular,
      color: SLATE_MUTED
    });

    // 6 Tarjetas de ponentes reales (2 filas x 3 columnas)
    const speakerCards = [
      {
        img: spkEchenique,
        name: 'Dr. Ángel Echenique',
        role: 'Medicina Interna y Emergencia',
        hospital: 'HCUAMP · Docente Asistencial',
        talk: '«Preeclampsia: Una misma tensión arterial, 2 fenotipos»',
        salon: 'Salón Principal (1)',
        isPrincipal: true,
        day: 'Viernes 06/11',
        time: '11:30 a. m.'
      },
      {
        img: spkAndrade,
        name: 'Dr. Adelino Andrade',
        role: 'Urología · Cirujano Urólogo',
        hospital: 'HCUAMP · Uro-oncología',
        talk: '«Cáncer de próstata oligometastásico»',
        salon: 'Salón Alterno (2)',
        isPrincipal: false,
        day: 'Lunes 02/11',
        time: '3:00 p. m.'
      },
      {
        img: spkCifuentes,
        name: 'Dr. Hugo Cifuentes Díaz',
        role: 'Otorrinolaringología (ORL)',
        hospital: 'UCLA Medicina · Cirugía Nasosinusal',
        talk: '«Claves para abordaje seguro de senos paranasales»',
        salon: 'Salón Alterno (2)',
        isPrincipal: false,
        day: 'Jueves 05/11',
        time: '4:20 p. m.'
      },
      {
        img: spkGonzalez,
        name: 'Dra. Isbel González',
        role: 'Especialista en Medicina Interna',
        hospital: 'HCUAMP · Semiología Clínica',
        talk: '«Historia clínica como método diagnóstico eficaz»',
        salon: 'Salón Principal (1)',
        isPrincipal: true,
        day: 'Viernes 06/11',
        time: '8:50 a. m.'
      },
      {
        img: spkFernandez,
        name: 'Dr. Jesús Fernández Tang',
        role: 'Cirujano General · Urólogo',
        hospital: 'HCUAMP · Urología Reconstructiva',
        talk: '«Urología de transición: el puente entre dos mundos»',
        salon: 'Salón Alterno (2)',
        isPrincipal: false,
        day: 'Lunes 02/11',
        time: '2:50 p. m.'
      },
      {
        img: spkCatari,
        name: 'Dra. Ángela Catarí',
        role: 'Especialista en Oftalmología',
        hospital: 'HCUAMP · Microcirugía Ocular',
        talk: '«Fronteras y avances en oftalmología quirúrgica»',
        salon: 'Salón Alterno (2)',
        isPrincipal: false,
        day: 'Viernes 06/11',
        time: '8:30 a. m.'
      }
    ];

    const spkCardW = 168;
    const spkCardH = 110;
    speakerCards.forEach((spk, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const cx = 44 + col * (spkCardW + 10);
      const cy = row === 0 ? 248 : 132;

      // Fondo tarjeta
      page.drawRectangle({
        x: cx,
        y: cy,
        width: spkCardW,
        height: spkCardH,
        color: CARD_BG,
        borderColor: BORDER,
        borderWidth: 1
      });

      // Cabecera de la tarjeta con Salón y Día
      const topBarBg = spk.isPrincipal ? rgb(238 / 255, 242 / 255, 255 / 255) : rgb(240 / 255, 253 / 255, 250 / 255);
      const salonColor = spk.isPrincipal ? BRAND : CLINIC_TEAL;
      page.drawRectangle({
        x: cx,
        y: cy + spkCardH - 18,
        width: spkCardW,
        height: 18,
        color: topBarBg
      });
      page.drawText(spk.salon, {
        x: cx + 6,
        y: cy + spkCardH - 13,
        size: 6.8,
        font: fontBold,
        color: salonColor
      });
      page.drawText(spk.day, {
        x: cx + spkCardW - 48,
        y: cy + spkCardH - 13,
        size: 6.2,
        font: fontBold,
        color: SLATE_MUTED
      });

      // Foto del ponente
      page.drawImage(spk.img, {
        x: cx + 6,
        y: cy + 24,
        width: 52,
        height: 64
      });
      page.drawRectangle({
        x: cx + 6,
        y: cy + 24,
        width: 52,
        height: 64,
        borderColor: rgb(203 / 255, 213 / 255, 225 / 255),
        borderWidth: 1
      });

      // Badge de hora bajo la foto
      page.drawRectangle({
        x: cx + 6,
        y: cy + 8,
        width: 52,
        height: 13,
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 0.8
      });
      page.drawText(spk.time, {
        x: cx + 11,
        y: cy + 12,
        size: 5.8,
        font: fontBold,
        color: NAVY
      });

      // Textos a la derecha de la foto
      const textX = cx + 64;
      const textMaxW = spkCardW - 70; // 98 pt

      // Nombre
      page.drawText(spk.name, {
        x: textX,
        y: cy + 76,
        size: 7.5,
        font: fontBold,
        color: NAVY
      });

      // Especialidad / Rol
      drawWrappedText(page, `${spk.role} · ${spk.hospital}`, {
        x: textX,
        y: cy + 65,
        font: fontRegular,
        size: 5.6,
        color: SLATE_TEXT,
        maxWidth: textMaxW,
        lineHeight: 7.2
      });

      // Ponencia label y título
      page.drawText('Ponencia:', {
        x: textX,
        y: cy + 45,
        size: 5.4,
        font: fontBold,
        color: SLATE_MUTED
      });

      drawWrappedText(page, spk.talk, {
        x: textX,
        y: cy + 36,
        font: fontBoldOblique,
        size: 5.7,
        color: NAVY,
        maxWidth: textMaxW,
        lineHeight: 7.4
      });
    });

    // Fila inferior del panel con foto institucional y resumen
    page.drawRectangle({
      x: 44,
      y: 58,
      width: PAGE_WIDTH - 88,
      height: 68,
      color: CARD_BG,
      borderColor: BORDER,
      borderWidth: 1
    });

    page.drawImage(teamImg, {
      x: 48,
      y: 62,
      width: 98,
      height: 60
    });
    page.drawRectangle({
      x: 48,
      y: 62,
      width: 98,
      height: 60,
      borderColor: BORDER,
      borderWidth: 1
    });

    page.drawText('DOCENCIA MÉDICA Y ACTUALIZACIÓN CIENTÍFICA CONTINUA', {
      x: 154,
      y: 114,
      size: 8.2,
      font: fontBold,
      color: NAVY
    });

    const docText =
      'Las 104 ponencias científicas son dictadas por más de 100 destacados especialistas y docentes adscritos al ' +
      'HCUAMP e instituciones invitadas. El evento incluye presentación de casos clínicos en póster, stands comerciales ' +
      'de la industria biomédica y premiaciones académicas a los mejores trabajos científicos de investigación.';

    drawWrappedText(page, docText, {
      x: 154,
      y: 104,
      font: fontRegular,
      size: 6.3,
      color: SLATE_TEXT,
      maxWidth: 406,
      lineHeight: 8.5
    });

    const othersText =
      'Otros ponentes destacados: Dra. María Jesús Rojas A. (ORL) · Dr. Narciel Sáez (Urología) · ' +
      'Dr. Joseph Sáez (Urología) · Dra. Soli Molina (Urología) · Dr. Christian Araujo (R3) · Dr. Manuel Castro (R3).';

    drawWrappedText(page, othersText, {
      x: 154,
      y: 77,
      font: fontBold,
      size: 5.6,
      color: BRAND,
      maxWidth: 406,
      lineHeight: 7.2
    });

    page.drawText('• Control de acceso mediante Código QR en Salón Principal (1) y Salón Alterno (2).', {
      x: 154,
      y: 64,
      size: 6.2,
      font: fontBold,
      color: CLINIC_TEAL
    });

    drawFooter(page, 2);
  }

  /* ══════════════════════════════════════════════════════════════════
     PÁGINA 3: CRONOGRAMA DE ACTIVIDADES (5 DÍAS · 2 SALONES)
     ══════════════════════════════════════════════════════════════════ */
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawInnerHeader(
      page,
      'CRONOGRAMA GENERAL DE ACTIVIDADES',
      'Distribución oficial de jornadas académicas en Salón Principal (1) y Salón Alterno (2)'
    );

    // Franja de Horarios Oficiales
    page.drawRectangle({
      x: 36,
      y: PAGE_HEIGHT - 96,
      width: PAGE_WIDTH - 72,
      height: 24,
      color: CARD_BG,
      borderColor: BORDER,
      borderWidth: 1
    });

    page.drawText('HORARIOS OFICIALES:', {
      x: 48,
      y: PAGE_HEIGHT - 88,
      size: 7.8,
      font: fontBold,
      color: NAVY
    });
    page.drawText('Turno Mañana: 8:00 / 8:30 a. m. – 12:30 m.', {
      x: 155,
      y: PAGE_HEIGHT - 88,
      size: 7.6,
      font: fontBold,
      color: BRAND
    });
    page.drawText('· Receso / Almuerzo: 12:30 m. – 2:00 p. m. ·', {
      x: 315,
      y: PAGE_HEIGHT - 88,
      size: 7.2,
      font: fontRegular,
      color: SLATE_MUTED
    });
    page.drawText('Turno Tarde: 2:00 p. m. – 6:00 p. m.', {
      x: 455,
      y: PAGE_HEIGHT - 88,
      size: 7.6,
      font: fontBold,
      color: CLINIC_TEAL
    });

    // 5 Tarjetas para los 5 días de Congreso con información real de agenda.ts
    const daysData = [
      {
        day: 'LUNES 02 DE NOVIEMBRE DE 2026',
        theme: 'Acto Inaugural · Departamento de Enfermería · Jornada de Urología',
        morning: [
          {
            salon: 'Salón Principal (1):',
            text: 'Acto Inaugural del Congreso (8:30 a. m.): Himnos, apertura de autoridades, Reseña histórica del Dr. Antonio María Pineda (Dr. Felipe Pineda Barrios), Semblanza del Dr. Juan Alberto Olivares (Dr. Ramón Aguilar) y Clase Magistral.'
          },
          {
            salon: 'Salón Alterno (2):',
            text: 'Sin actividad en turno matutino (Sesión inaugural solemne unificada en Salón Principal).'
          }
        ],
        afternoon: [
          {
            salon: 'Salón Principal (1):',
            text: 'Departamento de Enfermería (2:00 – 5:45 p. m.): Neumoprotección en neonato ventilado, de la cama a la bipedestación y estabilidad hemodinámica, humanización en emergencia y códigos de triaje.'
          },
          {
            salon: 'Salón Alterno (2):',
            text: 'Jornada de Urología (2:00 – 5:50 p. m.): Dispositivo Elutax-3 (Dr. N. Sáez / Dr. J. Sáez), urología transicional (Dr. J. Fernández), cáncer de próstata (Dr. A. Andrade), disfunción eréctil, nuevas tecnologías y estética masculina.'
          }
        ]
      },
      {
        day: 'MARTES 03 DE NOVIEMBRE DE 2026',
        theme: 'Emergencia General · Diagnóstico por Imágenes · Neurocirugía · Fisiatría y Salud Mental',
        morning: [
          {
            salon: 'Salón Principal (1):',
            text: 'Simposio de Emergencia General (8:00 a. m. – 12:30 m.): Triaje ABCDE del politraumatizado, alteración de conciencia, Código ICTUS, arritmias graves, insuficiencia respiratoria aguda y saldo masivo de víctimas.'
          },
          {
            salon: 'Salón Alterno (2):',
            text: 'Diagnóstico por Imágenes (8:30 a. m. – 12:30 m.): TCE (conducta quirúrgica vs. expectante), pelvis traumática, ecografía pulmonar bedside, algoritmo en embarazo, Eco FAST vs. TC y accesos vasculares ecoguiados.'
          }
        ],
        afternoon: [
          {
            salon: 'Salón Principal (1):',
            text: 'Simposio de Neurocirugía (2:00 – 4:40 p. m.): Abordaje endoscópico de columna, abordaje retrosigmoideo, disrrafismo espinal, ablación cerebral en patología psiquiátrica y monitoreo en clipajes de aneurismas.'
          },
          {
            salon: 'Salón Alterno (2):',
            text: 'Medicina Física y Rehab. (2:00 – 4:00 p. m. · Envejecimiento activo, fisiatría musculoesquelética, dolor cervical) & Salud Mental (4:15 – 4:45 p. m. · Comunicación sexual y salud mental).'
          }
        ]
      },
      {
        day: 'MIÉRCOLES 04 DE NOVIEMBRE DE 2026',
        theme: 'Ginecología y Obstetricia · Gastroenterología · Anestesiología · Cardiología',
        morning: [
          {
            salon: 'Salón Principal (1):',
            text: 'Jornada de Ginecología y Obstetricia (8:30 a. m. – 12:30 m.): Histerosonografía diagnóstica, terapia hormonal en menopausia, enfermedad trofoblástica, tiroides en embarazo, Doppler fetal y fenotipos de preeclampsia.'
          },
          {
            salon: 'Salón Alterno (2):',
            text: 'Simposio de Gastroenterología (8:30 a. m. – 12:30 m.): Vías digestivas, síndrome de intestino irritable y microbiota, manejo de ascitis, sangrado digestivo alto y bajo, e hígado graso con análogos GLP-1.'
          }
        ],
        afternoon: [
          {
            salon: 'Salón Principal (1):',
            text: 'Jornada de Anestesiología (2:00 – 6:00 p. m.): Mutaciones mitocondriales, dilemas con análogos GLP-1 (Ozempic), monitoreo hemodinámico avanzado, dolor oncológico, eventos catastróficos e hipertermia maligna.'
          },
          {
            salon: 'Salón Alterno (2):',
            text: 'Jornada de Cardiología (2:00 – 5:30 p. m.): Decisiones críticas en SCA, dolor torácico en urgencias, 5ta definición de infarto, manejo de SCACEST/SCASEST, trombosis intraventricular y nutrición cardiorrenal.'
          }
        ]
      },
      {
        day: 'JUEVES 05 DE NOVIEMBRE DE 2026',
        theme: 'Cirugía Plástica · Dermatología · Cirugía General · Otorrinolaringología (ORL)',
        morning: [
          {
            salon: 'Salón Principal (1):',
            text: 'Cirugía Plástica y Reconstructiva (8:30 a. m. – 1:00 p. m.): Reconstrucción en cáncer de mama, evaluación mastológica previa, opciones de confort, colgajos, reconstrucción de complejo aréola-pezón y quemados.'
          },
          {
            salon: 'Salón Alterno (2):',
            text: 'Jornada de Dermatología (8:30 – 11:30 a. m.): Dermatitis atópica de la A a la Z, microbiota cutánea e infecciones, cuidado en adultos, queratosis pilaris, nutrición, psicología y ecografía cutánea.'
          }
        ],
        afternoon: [
          {
            salon: 'Salón Principal (1):',
            text: 'Jornada de Cirugía General (2:00 – 5:30 p. m.): El bisturí digital, RM rectal y margen CRM, ecografía de cuello, volumetría en pared abdominal, tumores torácicos, vía biliar y fístulas postoperatorias.'
          },
          {
            salon: 'Salón Alterno (2):',
            text: 'Simposio de Otorrinolaringología (2:00 – 5:10 p. m.): Diagnóstico de vértigo y protocolo HINTS, rinoplastia funcional (Dra. M. Rojas), angina de Ludwig, abordaje de senos paranasales (Dr. H. Cifuentes) y laringe.'
          }
        ]
      },
      {
        day: 'VIERNES 06 DE NOVIEMBRE DE 2026',
        theme: 'Medicina Interna · Oftalmología · Traumatología y Ortopedia · Clausura y Premiaciones',
        morning: [
          {
            salon: 'Salón Principal (1):',
            text: 'Jornada de Medicina Interna (8:30 a. m. – 12:40 p. m.): Apertura (Dra. R. Rosario), historia clínica (Dra. I. González), anticoagulación, neuroinfecciones (Dr. J. Rodríguez), paraneoplásicos, eje cardiorrenometabólico (Dra. A. Aguilar), composición corporal, preeclampsia (Dr. Á. Echenique) y vasculitis (Dra. M. Ramos).'
          },
          {
            salon: 'Salón Alterno (2):',
            text: 'Jornada de Oftalmología (8:30 a. m. – 12:30 m.): Revelaciones de retina, glaucoma avanzado, análogos GLP-1 y visión, estrabismo infantil, trauma ocular, emergencias oculares y facoemulsificación en cataratas.'
          }
        ],
        afternoon: [
          {
            salon: 'Salón Principal (1):',
            text: 'Traumatología y Ortopedia (2:00 – 5:50 p. m. · Nervio radial, cadera en politrauma, LCA, pilón tibial, osteotomía, dolor crónico, fisiatría) & Solemne Clausura del Congreso (6:00 – 7:00 p. m. · Premiación científica).'
          },
          {
            salon: 'Salón Alterno (2):',
            text: 'Sin actividad en turno vespertino (Concentración plenaria en Salón Principal para sesiones de cierre y acto protocolar).'
          }
        ]
      }
    ];

    let dayY = PAGE_HEIGHT - 104;
    daysData.forEach((d, dIdx) => {
      const cardHeight = 104;

      page.drawRectangle({
        x: 36,
        y: dayY - cardHeight,
        width: PAGE_WIDTH - 72,
        height: cardHeight,
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 1.1
      });

      // Cabecera del día
      page.drawRectangle({
        x: 36,
        y: dayY - 18,
        width: PAGE_WIDTH - 72,
        height: 18,
        color: dIdx % 2 === 0 ? NAVY : BRAND
      });

      page.drawText(d.day, {
        x: 44,
        y: dayY - 13,
        size: 7.8,
        font: fontBold,
        color: WHITE
      });
      page.drawText(`·   ${d.theme}`, {
        x: 216,
        y: dayY - 13,
        size: 6.5,
        font: fontRegular,
        color: rgb(224 / 255, 242 / 255, 254 / 255)
      });

      // BLOQUE MAÑANA
      page.drawText('MAÑANA', { x: 44, y: dayY - 29, size: 6.5, font: fontBold, color: BRAND });
      page.drawText('8:30-12:30', { x: 44, y: dayY - 37, size: 5.2, font: fontRegular, color: SLATE_MUTED });

      // Salón Principal mañana
      page.drawText(d.morning[0].salon, { x: 92, y: dayY - 29, size: 6.2, font: fontBold, color: BRAND });
      drawWrappedText(page, d.morning[0].text, {
        x: 172,
        y: dayY - 29,
        font: fontRegular,
        size: 5.8,
        color: SLATE_TEXT,
        maxWidth: 396,
        lineHeight: 7.2
      });

      // Salón Alterno mañana
      page.drawText(d.morning[1].salon, { x: 92, y: dayY - 45, size: 6.2, font: fontBold, color: CLINIC_TEAL });
      drawWrappedText(page, d.morning[1].text, {
        x: 172,
        y: dayY - 45,
        font: fontRegular,
        size: 5.8,
        color: SLATE_TEXT,
        maxWidth: 396,
        lineHeight: 7.2
      });

      // Línea divisoria
      page.drawRectangle({
        x: 44,
        y: dayY - 59,
        width: PAGE_WIDTH - 88,
        height: 0.8,
        color: rgb(241 / 255, 245 / 255, 249 / 255)
      });

      // BLOQUE TARDE
      page.drawText('TARDE', { x: 44, y: dayY - 72, size: 6.5, font: fontBold, color: CLINIC_TEAL });
      page.drawText('2:00-6:00', { x: 44, y: dayY - 80, size: 5.2, font: fontRegular, color: SLATE_MUTED });

      // Salón Principal tarde
      page.drawText(d.afternoon[0].salon, { x: 92, y: dayY - 72, size: 6.2, font: fontBold, color: BRAND });
      drawWrappedText(page, d.afternoon[0].text, {
        x: 172,
        y: dayY - 72,
        font: fontRegular,
        size: 5.8,
        color: SLATE_TEXT,
        maxWidth: 396,
        lineHeight: 7.2
      });

      // Salón Alterno tarde
      page.drawText(d.afternoon[1].salon, { x: 92, y: dayY - 88, size: 6.2, font: fontBold, color: CLINIC_TEAL });
      drawWrappedText(page, d.afternoon[1].text, {
        x: 172,
        y: dayY - 88,
        font: fontRegular,
        size: 5.8,
        color: SLATE_TEXT,
        maxWidth: 396,
        lineHeight: 7.2
      });

      dayY -= (cardHeight + 7);
    });

    // PANEL INFERIOR CON FOTO DE KEYNOTE Y ÁREAS COMPLEMENTARIAS (y = 54 a 134, height 80)
    page.drawRectangle({
      x: 36,
      y: 54,
      width: PAGE_WIDTH - 72,
      height: 80,
      color: CARD_BG,
      borderColor: BORDER,
      borderWidth: 1.1
    });

    // Foto keynote
    page.drawImage(keynoteImg, {
      x: 44,
      y: 58,
      width: 114,
      height: 72
    });
    page.drawRectangle({
      x: 44,
      y: 58,
      width: 114,
      height: 72,
      borderColor: BORDER,
      borderWidth: 1
    });

    page.drawText('EXPOSICIÓN DE PÓSTERS, STANDS COMERCIALES Y PREMIACIONES', {
      x: 168,
      y: 118,
      size: 8.5,
      font: fontBold,
      color: NAVY
    });

    const infoExtra =
      '• Modalidad Póster: Exposición interactiva continua de investigaciones científicas en los pasillos principales del hotel.\n' +
      '• Stands Comerciales: Espacio de networking, muestra de equipamiento médico y productos de empresas patrocinadoras.\n' +
      '• Premiaciones Académicas: Reconocimiento formal al mejor trabajo científico de investigación en la Clausura Oficial.\n' +
      '• Control de Acceso: Escaneo obligatorio de Código QR al ingreso a las sesiones en Salón Principal (1) y Salón Alterno (2).';

    drawWrappedText(page, infoExtra, {
      x: 168,
      y: 106,
      font: fontRegular,
      size: 6.8,
      color: SLATE_TEXT,
      maxWidth: 396,
      lineHeight: 10
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
      y: PAGE_HEIGHT - 124,
      size: 14,
      font: fontBold,
      color: rgb(6 / 255, 95 / 255, 70 / 255)
    });

    page.drawText('Aplica a todo el talento humano activo y en formación del Hospital Central Universitario Dr. Antonio María Pineda:', {
      x: 50,
      y: PAGE_HEIGHT - 141,
      size: 8,
      font: fontBold,
      color: SLATE_DARK
    });

    const hcuampRoles = [
      '• Médicos Especialistas y Adjuntos',
      '• Médicos Residentes de Postgrado',
      '• Profesionales y Técnicos de Enfermería',
      '• Fisioterapeutas y Terapeutas Ocupacionales',
      '• Técnicos Radiólogos y Optometristas',
      '• Bachilleres, Acompañantes y Personal Afín'
    ];

    hcuampRoles.forEach((role, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      page.drawText(role, {
        x: 50 + col * 250,
        y: PAGE_HEIGHT - 157 - row * 13,
        size: 7.8,
        font: fontRegular,
        color: SLATE_TEXT
      });
    });

    page.drawText('CONSULTA EN NÓMINA: Ingresa tu cédula en el portal y el sistema valida tus datos automáticamente.', {
      x: 50,
      y: PAGE_HEIGHT - 204,
      size: 7.5,
      font: fontBold,
      color: GREEN_TEXT
    });

    // TARJETA 2: OTRAS INSTITUCIONES (Tarifas por día)
    page.drawRectangle({
      x: 36,
      y: PAGE_HEIGHT - 395,
      width: PAGE_WIDTH - 72,
      height: 170,
      color: WHITE,
      borderColor: BORDER,
      borderWidth: 1.5
    });

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

    const rates = [
      { cat: 'Médico General y Médico Especialista', price: '20 USD / día' },
      { cat: 'Médico Residente de Postgrado', price: '15 USD / día' },
      { cat: 'Licenciados(as) y Técnicos(as) en Enfermería', price: '10 USD / día' },
      { cat: 'Fisioterapeuta / Terapeuta Ocupacional', price: '15 USD / día' },
      { cat: 'Otro Personal Afín a la Salud', price: '15 USD / día' },
      { cat: 'Acompañante de Participante', price: '15 USD / día' },
      { cat: 'Bachiller / Estudiante de pregrado', price: '0 USD (Exonerado 100%)', exonerated: true }
    ];

    rates.forEach((r, idx) => {
      const rx = 50 + (idx % 2) * 260;
      const ry = PAGE_HEIGHT - 284 - Math.floor(idx / 2) * 19;

      page.drawRectangle({
        x: rx - 5,
        y: ry - 4,
        width: 250,
        height: 16,
        color: r.exonerated
          ? rgb(236 / 255, 253 / 255, 245 / 255)
          : (idx % 2 === 0 ? rgb(248 / 255, 250 / 255, 252 / 255) : rgb(241 / 255, 245 / 255, 249 / 255))
      });
      const catSize = r.cat.length > 36 ? 6.5 : 7.1;
      page.drawText(r.cat, { x: rx, y: ry, size: catSize, font: r.exonerated ? fontBold : fontRegular, color: SLATE_DARK });
      page.drawText(r.price, {
        x: rx + (r.exonerated ? 142 : 182),
        y: ry,
        size: 7.2,
        font: fontBold,
        color: r.exonerated ? GREEN_TEXT : BRAND
      });
    });

    page.drawText('• Pagos en Bolívares mediante Pago Móvil o Transferencia bancaria a la tasa oficial BCV del momento del registro.', {
      x: 50,
      y: PAGE_HEIGHT - 367,
      size: 7.5,
      font: fontBold,
      color: NAVY
    });
    page.drawText('• El comprobante bancario es validado por el comité administrativo para la confirmación de la credencial oficial.', {
      x: 50,
      y: PAGE_HEIGHT - 380,
      size: 7.2,
      font: fontRegular,
      color: SLATE_MUTED
    });

    // BENEFICIOS INCLUIDOS EN LA INSCRIPCIÓN (y = 230 a 304, height 74)
    page.drawRectangle({
      x: 36,
      y: 230,
      width: PAGE_WIDTH - 72,
      height: 74,
      color: BRAND_LIGHT,
      borderColor: rgb(191 / 255, 219 / 255, 254 / 255),
      borderWidth: 1
    });

    page.drawText('LA INSCRIPCIÓN INCLUYE FORMALMENTE:', {
      x: 50,
      y: 288,
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
        y: 270 - row * 15,
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
      height: 168,
      color: CARD_BG,
      borderColor: BORDER,
      borderWidth: 1.5
    });

    // Código QR
    page.drawImage(qrImg, {
      x: 50,
      y: 64,
      width: 140,
      height: 140
    });

    // Información de registro
    page.drawText('REGÍSTRATE EN LÍNEA DESDE TU TELÉFONO MÓVIL', {
      x: 205,
      y: 194,
      size: 10.5,
      font: fontBold,
      color: NAVY
    });

    const qrInstrucc =
      'Escanea este código QR con la cámara de tu teléfono móvil para acceder inmediatamente a la plataforma oficial de inscripciones:';
    drawWrappedText(page, qrInstrucc, {
      x: 205,
      y: 180,
      font: fontRegular,
      size: 7.8,
      color: SLATE_TEXT,
      maxWidth: 335,
      lineHeight: 10.5
    });

    page.drawRectangle({
      x: 205,
      y: 144,
      width: 335,
      height: 22,
      color: BRAND
    });
    page.drawText('https://congresopineda.vercel.app', {
      x: 218,
      y: 151,
      size: 9.5,
      font: fontBold,
      color: WHITE
    });

    page.drawText('SEDE: Hotel Biotel Suites · Barquisimeto, Estado Lara', {
      x: 205,
      y: 130,
      size: 8,
      font: fontBold,
      color: NAVY
    });

    const dirText =
      'Final de la Av. Libertador con inicio de la Av. Florencio Jiménez, frente al monumento El Obelisco, Barquisimeto (3001), estado Lara, Venezuela.';
    drawWrappedText(page, dirText, {
      x: 205,
      y: 118,
      font: fontRegular,
      size: 7.2,
      color: SLATE_MUTED,
      maxWidth: 335,
      lineHeight: 9.5
    });

    page.drawText(`CONTACTO: congreso@hcuamp.gob.ve · XIV Congreso Pineda 2026 · HCUAMP (RIF: ${RIF_HCUAMP})`, {
      x: 205,
      y: 88,
      size: 7.2,
      font: fontBold,
      color: CLINIC_TEAL
    });
    page.drawText('Comité Organizador y Científico · Dirección General · Barquisimeto, Estado Lara', {
      x: 205,
      y: 76,
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

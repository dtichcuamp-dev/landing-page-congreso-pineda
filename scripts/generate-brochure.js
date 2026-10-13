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
      y: PAGE_HEIGHT - 64,
      width: PAGE_WIDTH,
      height: 64,
      color: NAVY
    });
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 67,
      width: PAGE_WIDTH,
      height: 3,
      color: CLINIC
    });

    page.drawImage(isoImg, {
      x: 36,
      y: PAGE_HEIGHT - 56,
      width: 42,
      height: 44
    });

    page.drawText('XIV CONGRESO PINEDA 2026', {
      x: 88,
      y: PAGE_HEIGHT - 30,
      size: 9.5,
      font: fontBold,
      color: CLINIC
    });
    page.drawText(title, {
      x: 88,
      y: PAGE_HEIGHT - 46,
      size: 13,
      font: fontBold,
      color: WHITE
    });
    if (subtitle) {
      page.drawText(subtitle, {
        x: 88,
        y: PAGE_HEIGHT - 58,
        size: 7.5,
        font: fontRegular,
        color: rgb(203 / 255, 213 / 255, 225 / 255)
      });
    }
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

    page.drawText(`Hospital Central Universitario «Dr. Antonio María Pineda» · RIF: ${RIF_HCUAMP} · Barquisimeto, Estado Lara`, {
      x: 36,
      y: 26,
      size: 7.5,
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

    // Banda superior principal
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 88,
      width: PAGE_WIDTH,
      height: 88,
      color: NAVY
    });
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 91,
      width: PAGE_WIDTH,
      height: 3,
      color: CLINIC
    });

    // Logo e Isotipo en portada
    page.drawImage(isoImg, {
      x: 36,
      y: PAGE_HEIGHT - 76,
      width: 54,
      height: 58
    });

    page.drawText('HOSPITAL CENTRAL UNIVERSITARIO «DR. ANTONIO MARÍA PINEDA»', {
      x: 100,
      y: PAGE_HEIGHT - 34,
      size: 10.5,
      font: fontBold,
      color: WHITE
    });
    page.drawText(`RIF: ${RIF_HCUAMP} · Barquisimeto, Estado Lara, Venezuela`, {
      x: 100,
      y: PAGE_HEIGHT - 48,
      size: 8.5,
      font: fontRegular,
      color: rgb(186 / 255, 230 / 255, 253 / 255)
    });
    page.drawText('COMITÉ ORGANIZADOR Y CIENTÍFICO · GUÍA OFICIAL DEL PARTICIPANTE', {
      x: 100,
      y: PAGE_HEIGHT - 62,
      size: 8,
      font: fontBold,
      color: CLINIC
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
    page.drawText('Capacidad: 240 puestos por turno', {
      x: 194,
      y: 502,
      size: 8,
      font: fontBold,
      color: BRAND
    });
    drawWrappedText(
      page,
      'Acondicionado para sesiones plenarias, simposios magistrales y actos protocolares con transmisión simultánea.',
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
    page.drawText('Capacidad: 60 puestos por turno', {
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
        desc: 'Salón Principal (1) [240 puestos] y Salón Alterno (2) [60 puestos] con tecnología audiovisual.'
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

    page.drawText('BIENVENIDA DEL COMITÉ ORGANIZADOR Y DIRECCIÓN GENERAL', {
      x: 50,
      y: 206,
      size: 9.5,
      font: fontBold,
      color: NAVY
    });

    const introText =
      'El Hospital Central Universitario Dr. Antonio María Pineda (HCUAMP), máxima institución asistencial y docente del centroccidente de Venezuela, se complace en convocar a la comunidad médica, asistencial y científica al XIV Congreso Pineda 2026. ' +
      'En el marco del LXXII Aniversario del HCUAMP y la LIX Jornada de Egresados, este magno evento constituye un espacio de convergencia científica para compartir avances diagnósticos y terapéuticos de vanguardia, debatir sobre casos clínicos de alta complejidad y fomentar la excelencia en la atención hospitalaria. ' +
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

    page.drawText('Hospital Central Universitario «Dr. Antonio María Pineda» · Barquisimeto, Estado Lara', {
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

    page.drawText('• Control de acceso mediante Código QR en Salón Principal (1) [240 puestos] y Salón Alterno (2) [60 puestos].', {
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
      'Distribución de jornadas en Salón Principal (1) [240 puestos] y Salón Alterno (2) [60 puestos]'
    );

    // Franja de Horarios Oficiales
    page.drawRectangle({
      x: 36,
      y: PAGE_HEIGHT - 98,
      width: PAGE_WIDTH - 72,
      height: 26,
      color: CARD_BG,
      borderColor: BORDER,
      borderWidth: 1
    });

    page.drawText('HORARIOS OFICIALES:', {
      x: 48,
      y: PAGE_HEIGHT - 89,
      size: 8,
      font: fontBold,
      color: NAVY
    });
    page.drawText('Turno Mañana: 8:00 a. m. – 12:30 m.', {
      x: 155,
      y: PAGE_HEIGHT - 89,
      size: 8,
      font: fontBold,
      color: BRAND
    });
    page.drawText('· Receso / Almuerzo: 12:30 m. – 2:00 p. m. ·', {
      x: 300,
      y: PAGE_HEIGHT - 89,
      size: 7.5,
      font: fontRegular,
      color: SLATE_MUTED
    });
    page.drawText('Turno Tarde: 2:00 p. m. – 5:50 p. m.', {
      x: 450,
      y: PAGE_HEIGHT - 89,
      size: 8,
      font: fontBold,
      color: CLINIC_TEAL
    });

    // 5 Tarjetas para los 5 días de Congreso
    const daysData = [
      {
        day: 'LUNES 02 DE NOVIEMBRE DE 2026',
        theme: 'Inauguración Oficial · Medicina Interna · Neurocirugía · Imágenes',
        morning: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Acto Protocolar de Apertura Institucional (8:00 a. m.) & Jornada de Medicina Interna (8 ponencias): sepsis, patología vascular y soporte clínico.' }
        ],
        afternoon: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Simposio de Neurocirugía (5 ponencias): microcirugía craneal, neurotrauma severo e hipertensión endocraneana.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Jornada de Diagnóstico por Imágenes (6 ponencias): ultrasonido Doppler intervencionista y resonancia magnética.' }
        ]
      },
      {
        day: 'MARTES 03 DE NOVIEMBRE DE 2026',
        theme: 'Ginecología y Obstetricia · Dermatología · Otorrinolaringología · Urología',
        morning: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Jornada de Ginecología y Obstetricia (7 ponencias): medicina materno-fetal, hemorragia postparto y piso pélvico.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Jornada de Dermatología (8 ponencias): dermatoscopia en lesiones de difícil diagnóstico y dermatología oncológica.' }
        ],
        afternoon: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Simposio de Otorrinolaringología (5 ponencias): cirugía nasosinusal guiada y patología de cuerdas vocales.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Jornada de Urología (6 ponencias): técnicas endourológicas en litiasis compleja y abordaje de masas renales.' }
        ]
      },
      {
        day: 'MIÉRCOLES 04 DE NOVIEMBRE DE 2026',
        theme: 'Oftalmología · Emergencia General · Medicina Física y Rehab. · Salud Mental',
        morning: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Jornada de Oftalmología (7 ponencias): facoemulsificación moderna, glaucoma y patología vítreo-retiniana.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Simposio de Emergencia General (8 ponencias): soporte vital avanzado, reanimación y estabilización en trauma.' }
        ],
        afternoon: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Jornada de Medicina Física y Rehabilitación (4 ponencias): neurorrehabilitación y terapia musculoesquelética.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Jornada de Salud Mental y Psiquiatría (1 ponencia): abordaje biopsicosocial y manejo del estrés clínico hospitalario.' }
        ]
      },
      {
        day: 'JUEVES 05 DE NOVIEMBRE DE 2026',
        theme: 'Gastroenterología · Anestesiología · Cardiología · Cirugía Plástica',
        morning: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Simposio de Gastroenterología (4 ponencias): endoscopia digestiva terapéutica y hepatología clínica.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Jornada de Anestesiología (6 ponencias): manejo avanzado de la vía aérea y anestesia regional.' }
        ],
        afternoon: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Jornada de Cardiología (6 ponencias): síndromes coronarios agudos, falla cardíaca y hemodinámica.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Simposio de Cirugía Plástica (5 ponencias): cirugía reconstructiva compleja y paciente quemado.' }
        ]
      },
      {
        day: 'VIERNES 06 DE NOVIEMBRE DE 2026',
        theme: 'Traumatología · Cirugía General · Enfermería · Plenaria y Clausura',
        morning: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Jornada de Traumatología y Ortopedia (8 ponencias): osteosíntesis biológica y reemplazos articulares complejos.' },
          { salon: 'Salón Alterno (2) [60 puestos]:', text: 'Jornada de Cirugía General (6 ponencias) y Enfermería (4 ponencias): cuidados críticos y protocolos quirúrgicos.' }
        ],
        afternoon: [
          { salon: 'Salón Principal (1) [240 puestos]:', text: 'Sesión Plenaria de Cierre, Presentación de Trabajos Libres Ganadores, Entrega de Premiaciones y Acto de Clausura (5:30 p. m.).' }
        ]
      }
    ];

    let dayY = PAGE_HEIGHT - 110;
    daysData.forEach((d, dIdx) => {
      const cardHeight = d.morning.length + d.afternoon.length > 2 ? 96 : 84;

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
        y: dayY - 20,
        width: PAGE_WIDTH - 72,
        height: 20,
        color: dIdx % 2 === 0 ? NAVY : BRAND
      });

      page.drawText(d.day, {
        x: 46,
        y: dayY - 14,
        size: 8.5,
        font: fontBold,
        color: WHITE
      });
      page.drawText(`·   ${d.theme}`, {
        x: 235,
        y: dayY - 14,
        size: 7,
        font: fontRegular,
        color: rgb(224 / 255, 242 / 255, 254 / 255)
      });

      let subY = dayY - 33;

      // Mañana
      d.morning.forEach((m) => {
        page.drawText('MAÑANA:', { x: 46, y: subY, size: 7.2, font: fontBold, color: BRAND });
        page.drawText(m.salon, { x: 92, y: subY, size: 7.2, font: fontBold, color: NAVY });
        drawWrappedText(page, m.text, {
          x: 235,
          y: subY,
          font: fontRegular,
          size: 6.8,
          color: SLATE_TEXT,
          maxWidth: 325,
          lineHeight: 8.5
        });
        subY -= 15;
      });

      // Tarde
      d.afternoon.forEach((a) => {
        page.drawText('TARDE:', { x: 46, y: subY, size: 7.2, font: fontBold, color: CLINIC_TEAL });
        page.drawText(a.salon, { x: 92, y: subY, size: 7.2, font: fontBold, color: NAVY });
        drawWrappedText(page, a.text, {
          x: 235,
          y: subY,
          font: fontRegular,
          size: 6.8,
          color: SLATE_TEXT,
          maxWidth: 325,
          lineHeight: 8.5
        });
        subY -= 15;
      });

      dayY -= (cardHeight + 7);
    });

    // PANEL INFERIOR CON FOTO DE KEYNOTE Y ÁREAS COMPLEMENTARIAS (y = 54 a 140, height 86)
    page.drawRectangle({
      x: 36,
      y: 54,
      width: PAGE_WIDTH - 72,
      height: 86,
      color: CARD_BG,
      borderColor: BORDER,
      borderWidth: 1.1
    });

    // Foto keynote
    page.drawImage(keynoteImg, {
      x: 44,
      y: 60,
      width: 120,
      height: 74
    });
    page.drawRectangle({
      x: 44,
      y: 60,
      width: 120,
      height: 74,
      borderColor: BORDER,
      borderWidth: 1
    });

    page.drawText('EXPOSICIÓN DE PÓSTERS, STANDS COMERCIALES Y PREMIACIONES', {
      x: 174,
      y: 122,
      size: 8.5,
      font: fontBold,
      color: NAVY
    });

    const infoExtra =
      '• Modalidad Póster: Exposición continua de investigaciones científicas en los pasillos principales del hotel.\n' +
      '• Stands Comerciales: Muestra de equipamiento médico y productos farmacéuticos de empresas patrocinadoras.\n' +
      '• Premiaciones: Reconocimiento formal al mejor trabajo científico de investigación y menciones honoríficas.\n' +
      '• Control de acceso: Escaneo obligatorio de Código QR al ingreso a las sesiones en ambos salones.';

    drawWrappedText(page, infoExtra, {
      x: 174,
      y: 108,
      font: fontRegular,
      size: 7,
      color: SLATE_TEXT,
      maxWidth: 350,
      lineHeight: 11
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
      y: PAGE_HEIGHT - 380,
      width: PAGE_WIDTH - 72,
      height: 155,
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
      const catSize = r.cat.length > 38 ? 6.5 : 7.1;
      page.drawText(r.cat, { x: rx, y: ry, size: catSize, font: fontRegular, color: SLATE_DARK });
      page.drawText(r.price, { x: rx + 182, y: ry, size: 7.5, font: fontBold, color: BRAND });
    });

    page.drawText('• Pagos en Bolívares mediante Pago Móvil o Transferencia bancaria a la tasa oficial BCV del momento del registro.', {
      x: 50,
      y: PAGE_HEIGHT - 355,
      size: 7.5,
      font: fontBold,
      color: NAVY
    });
    page.drawText('• El comprobante bancario es validado por el comité administrativo para la confirmación de la credencial oficial.', {
      x: 50,
      y: PAGE_HEIGHT - 368,
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

    page.drawText(`CONTACTO: congreso@hcuamp.gob.ve · Hospital Central Dr. Antonio María Pineda (RIF: ${RIF_HCUAMP})`, {
      x: 205,
      y: 88,
      size: 7.2,
      font: fontBold,
      color: CLINIC_TEAL
    });
    page.drawText('Comité Organizador · Dirección General · Barquisimeto, Estado Lara', {
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

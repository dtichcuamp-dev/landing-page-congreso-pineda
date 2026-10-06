/**
 * ════════════════════════════════════════════════════════════════════════
 *  XIV CONGRESO PINEDA 2026 · Backend de inscripciones (Google Apps Script)
 * ════════════════════════════════════════════════════════════════════════
 *  Despliegue: Implementar → Nueva implementación → Aplicación web
 *    · Ejecutar como:        Yo (tu cuenta)
 *    · Quién tiene acceso:   Cualquier usuario
 *  Copia la URL terminada en /exec en NEXT_PUBLIC_GAS_URL (Vercel / .env.local).
 *
 *  Flujo de doPost:
 *    1. Recibe el JSON del frontend (enviado como text/plain).
 *    2. Valida TODO en el servidor y recalcula el monto (no se confía en el cliente).
 *    3. Sube el comprobante a una carpeta de Google Drive y obtiene su URL.
 *    4. Registra la inscripción (con monto y enlace) en Google Sheets.
 *    5. (Opcional) Envía un correo de confirmación.
 *
 *  Sobre CORS:
 *    Apps Script NO permite fijar cabeceras ni responde a OPTIONS (doOptions no existe).
 *    La solución estándar, que usa el frontend, es:
 *      · enviar el POST con  Content-Type: text/plain;charset=utf-8  → es una
 *        "petición simple": el navegador NO hace preflight;
 *      · responder con ContentService (JSON). La respuesta final se sirve desde
 *        script.googleusercontent.com con  Access-Control-Allow-Origin: *.
 *    Si prefieres restringir el origen, hazlo con un proxy (p. ej. ruta API de Next.js).
 *
 *  ⚠️ PRIMERA VEZ: ejecuta la función  setup()  desde el editor para
 *     autorizar permisos (Sheets, Drive, Correo) y crear hoja + carpeta.
 * ════════════════════════════════════════════════════════════════════════
 */

// ───────────────────────────── CONFIGURACIÓN ─────────────────────────────
var CONFIG = {
  SPREADSHEET_ID: '1cXFd-gwbyeyw2ME3KA_z_KeMQLj4VEk5Q_7_UpEUQG4',
  SHEET_NAME: 'Inscripciones',

  // Carpeta de Drive para los comprobantes. Si DRIVE_FOLDER_ID está vacío,
  // se busca/crea una carpeta con DRIVE_FOLDER_NAME en "Mi unidad".
  DRIVE_FOLDER_ID: '',
  DRIVE_FOLDER_NAME: 'Comprobantes - Congreso Pineda 2026',

  // false = solo quienes tengan acceso a la carpeta ven el comprobante (recomendado).
  // true  = cualquiera con el enlace puede verlo.
  SHARE_LINK_PUBLIC: false,

  SEND_CONFIRMATION_EMAIL: true,
  EMAIL_SENDER_NAME: 'Congreso Pineda 2026 · HCUAMP',
  ADMIN_TOKEN: 'token-secreto-admin-1234',

  ID_PREFIX: 'CP26',
  MAX_FILE_BYTES: 8 * 1024 * 1024,
  ALLOWED_MIME: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
};

/**
 * Tarifas USD por jornada. ⚠️ Mantener sincronizado con src/data/pricing.ts
 * 0 = exonerado.
 */
var RATES = {
  bachiller: { label: 'Bachiller', rate: 10 },
  enfermero: { label: 'Enfermero/a', rate: 10 },
  residente: { label: 'Residente', rate: 15 },
  acompanante: { label: 'Acompañante', rate: 15 },
  medico_general: { label: 'Médico general', rate: 20 },
  tecnico_radiologo: { label: 'Técnico radiólogo', rate: 20 },
  optometrista: { label: 'Optometrista', rate: 20 },
  especialista: { label: 'Médico especialista', rate: 30 },
  conferencista: { label: 'Conferencista', rate: 0 },
  residente_ultimo_anio: { label: 'Residente de último año', rate: 0 }
};

var JORNADAS = {
  '2026-11-02': '02/11',
  '2026-11-03': '03/11',
  '2026-11-04': '04/11',
  '2026-11-05': '05/11',
  '2026-11-06': '06/11'
};

var HEADERS = [
  'ID', 'Fecha de registro', 'Nombres', 'Apellidos', 'Cédula', 'Sexo', 'Fecha de Nacimiento', 'Teléfono', 'Correo',
  'Tipo de participante', 'Institución', 'País', 'Estado', 'Municipio', 'Parroquia', 'Jornadas', 'N.º jornadas',
  'Tarifa por jornada (USD)', 'Monto a pagar (USD)', 'Comprobante (URL)',
  'Estado del pago', 'Observaciones'
];

// ─────────────────────────────── ENDPOINTS ───────────────────────────────

/** Health-check: abre la URL /exec en el navegador para comprobar el despliegue. */
function doGet() {
  return json_({ ok: true, service: 'Congreso Pineda 2026 · Inscripciones', time: new Date().toISOString() });
}

function doPost(e) {
  var uploaded = null;
  try {
    if (!e || !e.postData || !e.postData.contents) throw new UserError_('Solicitud vacía.');

    var body;
    try { body = JSON.parse(e.postData.contents); }
    catch (err) { throw new UserError_('El formato de la solicitud no es válido.'); }

    // Endpoints administrativos
    if (body.action === 'get_dashboard') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: getDashboardData_() });
    }
    if (body.action === 'approve_payment') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: approvePayment_(body.id) });
    }
    if (body.action === 'scan_qr') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: scanQr_(body) });
    }

    // Honeypot: los bots suelen rellenar este campo oculto. Se responde "ok" sin guardar.
    if (body.website) return json_({ ok: true, id: 'CP26-0000', total: 0 });

    var data = validate_(body);               // 2. validación + monto en servidor

    uploaded = saveReceipt_(body.comprobante, data);   // 3. Drive (puede ser null)

    var result = appendRow_(data, uploaded);  // 4. Sheets (con bloqueo)
    uploaded = null;                          // ya registrado: no limpiar archivo

    if (CONFIG.SEND_CONFIRMATION_EMAIL) sendEmail_(data, result.id);   // 5.

    return json_({ ok: true, id: result.id, total: data.total });
  } catch (err) {
    // Si falló después de subir el archivo, evita dejar huérfanos en Drive.
    if (uploaded) { try { uploaded.setTrashed(true); } catch (_) {} }

    if (err instanceof UserError_) return json_({ ok: false, error: err.message });
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: 'Error interno. Inténtalo de nuevo en unos minutos.' });
  }
}

// ───────────────────────────── VALIDACIÓN ─────────────────────────────

function UserError_(message) { this.message = message; }
UserError_.prototype = Object.create(Error.prototype);
UserError_.prototype.name = 'UserError';

function validate_(b) {
  var nameRe = /^[A-Za-zÀ-ÿ\u00f1\u00d1][A-Za-zÀ-ÿ\u00f1\u00d1\s'.\-]{1,59}$/;
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var nombres = str_(b.nombres, 60), apellidos = str_(b.apellidos, 60);
  if (!nameRe.test(nombres)) throw new UserError_('Nombres inválidos.');
  if (!nameRe.test(apellidos)) throw new UserError_('Apellidos inválidos.');

  var cedula = str_(b.cedula, 15).toUpperCase();
  if (!/^[VE]-\d{5,9}$/.test(cedula)) throw new UserError_('Cédula inválida.');

  var sexo = str_(b.sexo, 20);
  if (sexo !== 'M' && sexo !== 'F') throw new UserError_('Selecciona tu sexo.');

  var fechaNacimiento = str_(b.fechaNacimiento, 20);
  if (!fechaNacimiento) throw new UserError_('Indica tu fecha de nacimiento.');

  var telefono = str_(b.telefono, 20).replace(/\D/g, '');
  if (!/^0(2\d{2}|4(12|14|16|24|26))\d{7}$/.test(telefono)) throw new UserError_('Número telefónico inválido.');

  var correo = str_(b.correo, 120).toLowerCase();
  if (!emailRe.test(correo)) throw new UserError_('Correo electrónico inválido.');

  var tipo = RATES[b.tipoParticipante];
  if (!tipo) throw new UserError_('Tipo de participante inválido.');

  var institucion = str_(b.institucion, 120);
  if (institucion.length < 2) throw new UserError_('Indica la institución de origen.');

  var pais = str_(b.pais, 120);
  if (pais.length < 2) throw new UserError_('Indica el país.');
  
  var estado = str_(b.estado, 120);
  if (estado.length < 2) throw new UserError_('Indica el estado.');
  
  var municipio = str_(b.municipio, 120);
  if (municipio.length < 2) throw new UserError_('Indica el municipio.');
  
  var parroquia = str_(b.parroquia, 120);
  if (parroquia.length < 2) throw new UserError_('Indica la parroquia.');

  if (!Array.isArray(b.jornadas) || b.jornadas.length === 0) throw new UserError_('Selecciona al menos un día.');
  var seen = {}, jornadaIds = [];
  b.jornadas.forEach(function (id) {
    if (!JORNADAS[id]) throw new UserError_('Jornada inválida.');
    if (!seen[id]) { seen[id] = true; jornadaIds.push(id); }
  });
  jornadaIds.sort();

  var total = tipo.rate * jornadaIds.length;
  if (b.tipoParticipante === "bachiller" && jornadaIds.length === 5) {
    total = 40;
  }
  if (total > 0 && !b.comprobante) throw new UserError_('Debes adjuntar el comprobante de pago.');

  return {
    nombres: nombres, apellidos: apellidos, cedula: cedula, sexo: sexo, fechaNacimiento: fechaNacimiento, telefono: telefono, correo: correo,
    tipoId: b.tipoParticipante, tipoLabel: tipo.label, rate: tipo.rate,
    institucion: institucion, pais: pais, estado: estado, municipio: municipio, parroquia: parroquia, jornadaIds: jornadaIds,
    jornadasLabel: jornadaIds.map(function (id) { return JORNADAS[id]; }).join(', '),
    total: total
  };
}

function str_(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().substring(0, max);
}

/** Evita inyección de fórmulas en Sheets (=, +, -, @ al inicio). */
function safe_(v) {
  v = String(v);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

// ─────────────────────────────── DRIVE ───────────────────────────────

/** Sube el comprobante a Drive. Devuelve el File o null si no se adjuntó. */
function saveReceipt_(file, data) {
  if (!file || !file.base64) return null;

  var mime = String(file.mimeType || '');
  if (CONFIG.ALLOWED_MIME.indexOf(mime) === -1) throw new UserError_('Tipo de archivo no permitido.');

  var bytes;
  try { bytes = Utilities.base64Decode(file.base64); }
  catch (err) { throw new UserError_('El archivo adjunto está dañado.'); }
  if (bytes.length > CONFIG.MAX_FILE_BYTES) throw new UserError_('El archivo supera el tamaño máximo permitido.');

  var ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[mime];
  var stamp = Utilities.formatDate(new Date(), 'America/Caracas', 'yyyyMMdd-HHmmss');
  var name = 'Comprobante_' + data.cedula + '_' + stamp + '.' + ext;

  var driveFile = getFolder_().createFile(Utilities.newBlob(bytes, mime, name));
  driveFile.setDescription(data.nombres + ' ' + data.apellidos + ' · ' + data.cedula);
  if (CONFIG.SHARE_LINK_PUBLIC) driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return driveFile;
}

function getFolder_() {
  if (CONFIG.DRIVE_FOLDER_ID) return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  var it = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
}

// ─────────────────────────────── SHEETS ───────────────────────────────

function getSheet_() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
      .setFontWeight('bold').setBackground('#1d63d8').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('E:F').setNumberFormat('@');   // cédula y teléfono como texto (conserva ceros)
    sh.setColumnWidth(14, 260);
  }
  return sh;
}

function appendRow_(d, receiptFile) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);   // serializa escrituras concurrentes para que los IDs no se repitan
  try {
    var sh = getSheet_();
    var row = sh.getLastRow() + 1;
    var seq = row - 1;
    var id = CONFIG.ID_PREFIX + '-' + ('0000' + seq).slice(-4);

    // ¿Ya existe esa cédula?
    var note = '';
    if (row > 2) {
      var ceds = sh.getRange(2, 5, row - 2, 1).getValues();
      for (var i = 0; i < ceds.length; i++) {
        if (String(ceds[i][0]) === d.cedula) { note = 'Cédula ya registrada (fila ' + (i + 2) + ')'; break; }
      }
    }

    sh.getRange(row, 5, 1, 3).setNumberFormat('@'); // cedula, sexo, fecha como texto para no perder formato
    sh.getRange(row, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');

    sh.getRange(row, 1, 1, HEADERS.length).setValues([[
      id,
      new Date(),
      safe_(d.nombres),
      safe_(d.apellidos),
      d.cedula,
      d.sexo,
      d.fechaNacimiento,
      d.telefono,
      safe_(d.correo),
      d.tipoLabel,
      safe_(d.institucion),
      safe_(d.pais),
      safe_(d.estado),
      safe_(d.municipio),
      safe_(d.parroquia),
      d.jornadasLabel,
      d.jornadaIds.length,
      d.rate,
      d.total,
      receiptFile ? receiptFile.getUrl() : '',
      d.total === 0 ? 'Exonerado' : 'Pendiente de verificación',
      note
    ]]);
    SpreadsheetApp.flush();
    return { id: id, row: row };
  } catch (err) {
    throw err;
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────── DASHBOARD ───────────────────────────────

function getDashboardData_() {
  var sh = getSheet_();
  var rows = sh.getDataRange().getValues();
  if (rows.length < 2) return [];
  
  var data = [];
  // HEADERS:
  // 0: ID, 1: Fecha, 2: Nombres, 3: Apellidos, 4: Cédula, 5: Sexo, 6: Fecha Nac, 7: Teléfono, 8: Correo
  // 9: Tipo, 10: Institución, 11: País, 12: Estado, 13: Municipio, 14: Parroquia
  // 15: Jornadas, 16: N jornadas, 17: Tarifa, 18: Monto, 19: Comprobante, 20: Estado, 21: Notas
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    data.push({
      id: r[0],
      fecha: r[1],
      nombres: r[2],
      apellidos: r[3],
      cedula: r[4],
      sexo: r[5],
      fechaNacimiento: r[6],
      telefono: r[7],
      correo: r[8],
      tipo: r[9],
      monto: r[18],
      comprobante: r[19],
      estado: r[20]
    });
  }
  // Devolvemos en orden inverso (más recientes primero)
  return data.reverse();
}

function approvePayment_(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = getSheet_();
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
    var rowIndex = -1;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === id) { rowIndex = i + 2; break; }
    }
    if (rowIndex === -1) throw new UserError_('Registro no encontrado.');
    
    // Columna 21 es "Estado del pago"
    sh.getRange(rowIndex, 21).setValue('Aprobado');
    
    // Enviar correo de aprobación con QR
    var rowData = sh.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
    sendApprovalEmail_(rowData);

    return { success: true, id: id };
  } catch (err) {
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function sendApprovalEmail_(r) {
  try {
    var id = r[0];
    var nombres = r[2];
    var correo = r[8];
    var tipoLabel = r[9];
    var jornadasLabel = r[15];
    var qrUrl = 'https://quickchart.io/qr?size=300&text=' + encodeURIComponent(id);

    var html =
      '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0b2545">' +
      '<h2 style="color:#059669">¡Inscripción Aprobada!</h2>' +
      '<p>Hola <b>' + esc_(nombres) + '</b>, tu pago ha sido verificado y tu inscripción al <b>XIV Congreso Pineda 2026</b> está confirmada.</p>' +
      '<div style="background:#f4f8fb;padding:20px;border-radius:12px;text-align:center;margin:24px 0">' +
      '<p style="margin-top:0;font-size:14px;color:#7a8aa3">Muestra este código QR cada día del evento para validar tu asistencia</p>' +
      '<img src="' + qrUrl + '" alt="QR de acceso" width="200" height="200" style="background:#fff;padding:10px;border-radius:8px;border:1px solid #e3ecf7"/>' +
      '</div>' +
      '<table style="border-collapse:collapse;width:100%;font-size:14px">' +
      row_('Código', id) + row_('Participante', esc_(tipoLabel)) +
      row_('Jornadas', esc_(jornadasLabel)) + '</table>' +
      '<p style="color:#7a8aa3;font-size:12px;margin-top:24px">Hospital Central Universitario «Dr. Antonio María Pineda»</p></div>';

    MailApp.sendEmail({
      to: correo,
      subject: 'Entrada Aprobada · Congreso Pineda 2026 · ' + id,
      htmlBody: html,
      name: CONFIG.EMAIL_SENDER_NAME
    });
  } catch (err) {
    console.warn('No se pudo enviar el correo de aprobación: ' + err);
  }
}

// ─────────────────────────────── SCANNER ───────────────────────────────

function scanQr_(body) {
  var id = body.id;
  var salon = body.salon;
  var jornada = body.jornada;
  var validador = body.user || 'Desconocido';
  
  if (!id) throw new UserError_('Código inválido.');
  if (!salon) throw new UserError_('Salón no seleccionado.');
  if (!jornada) throw new UserError_('Jornada no seleccionada.');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var shInsc = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    // Buscar en Inscripciones
    var data = shInsc.getDataRange().getValues();
    var found = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        found = data[i];
        break;
      }
    }
    
    if (!found) throw new UserError_('Registro no encontrado.');
    
    // Validar pago (Estado está en la columna 20 (index base 0))
    var estado = String(found[20]).trim();
    if (estado !== 'Aprobado' && estado !== 'Exonerado') {
      throw new UserError_('Pago no aprobado (' + estado + ').');
    }
    
    // Validar que esté inscrito ese día. jornadas (label) está en col 15. N jornadas en col 16
    var labelDia = JORNADAS[jornada] || jornada;
    var jornadasString = String(found[15]);
    if (jornadasString.indexOf(labelDia) === -1) {
      throw new UserError_('El participante no está inscrito para este día.');
    }
    
    // Registrar asistencia
    var shAsist = ss.getSheetByName('Asistencias');
    if (!shAsist) {
      shAsist = ss.insertSheet('Asistencias');
      shAsist.getRange(1, 1, 1, 8).setValues([['ID', 'Nombres', 'Apellidos', 'Tipo', 'Salón', 'Jornada', 'Validador', 'Hora de escaneo']])
        .setFontWeight('bold').setBackground('#059669').setFontColor('#ffffff');
      shAsist.setFrozenRows(1);
    }
    
    // Registrar (Se permite escaneo múltiple para mantener la continuidad)
    var timestamp = new Date();
    shAsist.appendRow([
      found[0], found[2], found[3], found[9], salon, labelDia, validador, timestamp
    ]);
    
    // Formatear la fecha para que se vea legible en Sheets
    var lastRow = shAsist.getLastRow();
    shAsist.getRange(lastRow, 8).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    
    return { 
      success: true, 
      nombres: found[2] + ' ' + found[3],
      tipo: found[9]
    };
  } catch (err) {
    throw err;
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────── CORREO ───────────────────────────────

function sendEmail_(d, id) {
  try {
    var monto = d.total === 0 ? 'Exonerado' : 'USD ' + d.total + ' (al cambio BCV)';
    var html =
      '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0b2545">' +
      '<h2 style="color:#1d63d8">Comprobante de Inscripción</h2>' +
      '<p>Hola <b>' + esc_(d.nombres) + '</b>, recibimos tu inscripción al <b>XIV Congreso Pineda 2026</b> ' +
      '(2 al 6 de noviembre · Biotel Suites, Barquisimeto).</p>' +
      '<table style="border-collapse:collapse;width:100%;font-size:14px">' +
      row_('Código', id) + row_('Participante', esc_(d.tipoLabel)) +
      row_('Jornadas', esc_(d.jornadasLabel)) + row_('Monto', monto) + '</table>' +
      '<p style="margin-top:16px">' +
      (d.total === 0 ? 'Tu participación está exonerada.' : 'Verificaremos tu comprobante y te confirmaremos el pago.') +
      '</p><p style="color:#7a8aa3;font-size:12px">Hospital Central Universitario «Dr. Antonio María Pineda»</p></div>';

    MailApp.sendEmail({
      to: d.correo,
      subject: 'Comprobante de Inscripción · Congreso Pineda 2026 · ' + id,
      htmlBody: html,
      name: CONFIG.EMAIL_SENDER_NAME
    });
  } catch (err) {
    console.warn('No se pudo enviar el correo: ' + err);   // no debe romper la inscripción
  }
}

function row_(k, v) {
  return '<tr><td style="padding:6px 8px;border-bottom:1px solid #e3ecf7;color:#7a8aa3">' + k +
         '</td><td style="padding:6px 8px;border-bottom:1px solid #e3ecf7"><b>' + v + '</b></td></tr>';
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─────────────────────────────── UTILIDADES ───────────────────────────────

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ejecuta UNA vez desde el editor (▶ Ejecutar → setup) para autorizar permisos
 * y crear la hoja y la carpeta de comprobantes. Revisa el registro de ejecución.
 */
function setup() {
  var sh = getSheet_();
  var folder = getFolder_();
  if (CONFIG.SEND_CONFIRMATION_EMAIL) MailApp.getRemainingDailyQuota(); // fuerza el permiso de correo
  Logger.log('Hoja lista: ' + sh.getParent().getUrl());
  Logger.log('Carpeta de comprobantes: ' + folder.getUrl() + '  (ID: ' + folder.getId() + ')');
}

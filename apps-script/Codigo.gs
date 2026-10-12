/**
 * ════════════════════════════════════════════════════════════════════════
 *  XIV CONGRESO PINEDA 2026 · Backend de inscripciones (Google Apps Script)
 * ════════════════════════════════════════════════════════════════════════
 *  Despliegue: Implementar → Nueva implementación → Aplicación web
 *    · Ejecutar como:        Yo (tu cuenta)
 *    · Quién tiene acceso:   Cualquier usuario
 *  Copia la URL terminada en /exec en NEXT_PUBLIC_GAS_URL (Vercel / .env.local).
 *
 *  Características:
 *    1. Búsqueda automática en la hoja "Personal HCUAMP" por cédula.
 *    2. Exoneración total (100%, 0$) para personal HCUAMP.
 *    3. Tarifas por día para participantes de otras instituciones.
 *    4. Control de aforo en tiempo real:
 *       - Salón Principal: 240 puestos por turno de cada día.
 *       - Salón Alterno: 60 puestos por turno de cada día.
 *    5. Subida segura de comprobantes a Google Drive.
 *    6. Registro blindado con LockService en Google Sheets.
 *    7. Envío automático de confirmaciones por correo.
 * ════════════════════════════════════════════════════════════════════════
 */

// ───────────────────────────── CONFIGURACIÓN ─────────────────────────────
var CONFIG = {
  SPREADSHEET_ID: '1cXFd-gwbyeyw2ME3KA_z_KeMQLj4VEk5Q_7_UpEUQG4',
  SHEET_NAME: 'Inscripciones',
  SHEET_HCUAMP: 'Personal HCUAMP',

  // Carpeta de Drive para los comprobantes
  DRIVE_FOLDER_ID: '',
  DRIVE_FOLDER_NAME: 'Comprobantes - Congreso Pineda 2026',
  SHARE_LINK_PUBLIC: false,

  SEND_CONFIRMATION_EMAIL: true,
  EMAIL_SENDER_NAME: 'Congreso Pineda 2026 · HCUAMP',
  ADMIN_TOKEN: 'token-secreto-admin-1234',

  ID_PREFIX: 'CP26',
  MAX_FILE_BYTES: 8 * 1024 * 1024,
  ALLOWED_MIME: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
};

/** Capacidades máximas por salón y turno */
var CAPACITIES = {
  principal: 240,
  alterno: 60
};

/** Días oficiales del congreso */
var DIAS_CONGRESO = {
  '2026-11-02': 'Lun 02/11',
  '2026-11-03': 'Mar 03/11',
  '2026-11-04': 'Mié 04/11',
  '2026-11-05': 'Jue 05/11',
  '2026-11-06': 'Vie 06/11'
};

/** Tarifas oficiales en USD por día */
var RATES = {
  // HCUAMP (Exonerados)
  bachiller: { label: 'Bachiller (HCUAMP)', rate: 0, hcuamp: true },
  enfermero: { label: 'Enfermero/a (HCUAMP)', rate: 0, hcuamp: true },
  residente: { label: 'Residente (HCUAMP)', rate: 0, hcuamp: true },
  acompanante: { label: 'Acompañante (HCUAMP)', rate: 0, hcuamp: true },
  medico_general: { label: 'Médico general (HCUAMP)', rate: 0, hcuamp: true },
  tecnico_radiologo: { label: 'Técnico radiólogo (HCUAMP)', rate: 0, hcuamp: true },
  optometrista: { label: 'Optometrista (HCUAMP)', rate: 0, hcuamp: true },
  especialista: { label: 'Médico especialista (HCUAMP)', rate: 0, hcuamp: true },
  conferencista: { label: 'Conferencista (HCUAMP)', rate: 0, hcuamp: true },
  residente_ultimo_anio: { label: 'Residente de último año (HCUAMP)', rate: 0, hcuamp: true },

  // Otra Institución (Tarifas USD por día)
  medico_general_especialista: { label: 'Médico general y especialista', rate: 20, hcuamp: false },
  medico_residente: { label: 'Médico residente', rate: 15, hcuamp: false },
  enfermero_otra: { label: 'Enfermera/o', rate: 10, hcuamp: false },
  otro_personal_afin: { label: 'Otro personal afín', rate: 15, hcuamp: false },
  acompanante_otra: { label: 'Acompañante', rate: 15, hcuamp: false }
};

var HEADERS = [
  'ID',
  'Fecha de registro',
  'Origen',
  'Institución',
  'Nombres',
  'Apellidos',
  'Cédula',
  'Sexo',
  'Fecha de Nacimiento',
  'Teléfono',
  'Correo',
  'Tipo de participante',
  'Detalle Ponencia / Especialidad',
  'País',
  'Estado',
  'Municipio',
  'Parroquia',
  'Días asistidos',
  'N.º días',
  'Turnos y Salones',
  'Turnos (JSON)',
  'Tarifa por día (USD)',
  'Monto a pagar (USD)',
  'Comprobante (URL)',
  'Estado del pago',
  'Observaciones'
];

// ─────────────────────────────── ENDPOINTS ───────────────────────────────

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = p.action || '';

    if (action === 'lookup_hcuamp') {
      return json_(lookupHcuamp_(p.cedula));
    }
    if (action === 'get_capacities') {
      return json_(getCapacities_());
    }

    return json_({
      ok: true,
      service: 'Congreso Pineda 2026 · Inscripciones',
      time: new Date().toISOString()
    });
  } catch (err) {
    return json_({ ok: false, error: err.message || String(err) });
  }
}

function doPost(e) {
  var uploaded = null;
  try {
    if (!e || !e.postData || !e.postData.contents) throw new UserError_('Solicitud vacía.');

    var body;
    try { body = JSON.parse(e.postData.contents); }
    catch (err) { throw new UserError_('El formato de la solicitud no es válido.'); }

    // Endpoints especiales
    if (body.action === 'lookup_hcuamp') {
      return json_(lookupHcuamp_(body.cedula));
    }
    if (body.action === 'get_capacities') {
      return json_(getCapacities_());
    }
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

    // Honeypot anti-spam
    if (body.website) return json_({ ok: true, id: 'CP26-0000', total: 0 });

    // 1. Validación de datos, tarifas y aforo en el servidor
    var data = validate_(body);

    // 2. Subir comprobante a Google Drive si aplica
    uploaded = saveReceipt_(body.comprobante, data);

    // 3. Registrar fila en Google Sheets (con lock service concurrente)
    var result = appendRow_(data, uploaded);
    uploaded = null; // No limpiar archivo en Drive porque ya se vinculó con éxito

    // 4. Enviar correo de confirmación
    if (CONFIG.SEND_CONFIRMATION_EMAIL) {
      sendEmail_(data, result.id);
    }

    return json_({ ok: true, id: result.id, total: data.total, exonerated: data.total === 0 });
  } catch (err) {
    if (uploaded) { try { uploaded.setTrashed(true); } catch (_) {} }

    if (err instanceof UserError_) return json_({ ok: false, error: err.message });
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: err.message || 'Error interno. Inténtalo de nuevo en unos minutos.' });
  }
}

// ───────────────────────────── BÚSQUEDA HCUAMP ─────────────────────────────

/**
 * Busca por cédula en la hoja "Personal HCUAMP" del Spreadsheet.
 * Retorna { ok: true, found: true, data: { ... } } si existe.
 */
function lookupHcuamp_(rawCedula) {
  if (!rawCedula) return { ok: false, error: 'Cédula no proporcionada.' };
  var cleanCed = String(rawCedula).replace(/\D/g, '');
  if (!cleanCed) return { ok: false, error: 'Cédula inválida.' };

  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sh = ss.getSheetByName(CONFIG.SHEET_HCUAMP);
  if (!sh) {
    return { ok: true, found: false, message: 'Hoja Personal HCUAMP no disponible.' };
  }

  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { ok: true, found: false };

  var headers = data[0].map(function (h) { return String(h || '').trim().toUpperCase(); });

  var colCedula = -1;
  var colNombreCompleto = -1;
  var colNombres = -1;
  var colApellidos = -1;
  var colSexo = -1;
  var colFechaNac = -1;
  var colTelefono = -1;

  for (var c = 0; c < headers.length; c++) {
    var h = headers[c];
    if (h.indexOf('CÉDULA') !== -1 || h.indexOf('CEDULA') !== -1 || h === 'C.I.' || h === 'CI' || h.indexOf('IDENTIDAD') !== -1) {
      if (colCedula === -1) colCedula = c;
    } else if (h.indexOf('APELLIDOS Y NOMBRES') !== -1 || h.indexOf('NOMBRES Y APELLIDOS') !== -1 || h === 'NOMBRE COMPLETO') {
      colNombreCompleto = c;
    } else if (h.indexOf('NOMBRE') !== -1) {
      if (colNombres === -1) colNombres = c;
    } else if (h.indexOf('APELLIDO') !== -1) {
      if (colApellidos === -1) colApellidos = c;
    } else if (h.indexOf('SEXO') !== -1 || h.indexOf('GÉNERO') !== -1 || h.indexOf('GENERO') !== -1) {
      colSexo = c;
    } else if (h.indexOf('NACIMIENTO') !== -1 || h.indexOf('FECHA NAC') !== -1 || h.indexOf('F. NAC') !== -1) {
      colFechaNac = c;
    } else if (h.indexOf('TELÉFONO') !== -1 || h.indexOf('TELEFONO') !== -1 || h.indexOf('TLF') !== -1 || h.indexOf('CELULAR') !== -1 || h.indexOf('MOVIL') !== -1) {
      colTelefono = c;
    }
  }

  if (colCedula === -1) colCedula = 0;

  for (var r = 1; r < data.length; r++) {
    var cellCed = String(data[r][colCedula] || '').replace(/\D/g, '');
    if (cellCed && cellCed === cleanCed) {
      var row = data[r];
      var nombres = '';
      var apellidos = '';

      if (colNombreCompleto !== -1 && row[colNombreCompleto]) {
        var full = String(row[colNombreCompleto]).trim();
        if (full.indexOf(',') !== -1) {
          var parts = full.split(',');
          apellidos = parts[0].trim();
          nombres = parts[1].trim();
        } else {
          var words = full.split(/\s+/);
          if (words.length >= 4) {
            apellidos = words.slice(0, 2).join(' ');
            nombres = words.slice(2).join(' ');
          } else if (words.length === 3) {
            apellidos = words.slice(0, 2).join(' ');
            nombres = words[2];
          } else if (words.length === 2) {
            apellidos = words[0];
            nombres = words[1];
          } else {
            nombres = full;
          }
        }
      } else {
        if (colNombres !== -1 && row[colNombres]) nombres = String(row[colNombres]).trim();
        if (colApellidos !== -1 && row[colApellidos]) apellidos = String(row[colApellidos]).trim();
      }

      var sexo = '';
      if (colSexo !== -1 && row[colSexo]) {
        var s = String(row[colSexo]).trim().toUpperCase();
        if (s.indexOf('M') === 0) sexo = 'M';
        else if (s.indexOf('F') === 0) sexo = 'F';
      }

      var fechaNac = '';
      if (colFechaNac !== -1 && row[colFechaNac]) {
        var fn = row[colFechaNac];
        if (fn instanceof Date) {
          fechaNac = Utilities.formatDate(fn, 'America/Caracas', 'yyyy-MM-dd');
        } else {
          fechaNac = String(fn).trim();
        }
      }

      var telefono = '';
      if (colTelefono !== -1 && row[colTelefono]) {
        telefono = String(row[colTelefono]).replace(/\D/g, '');
        if (telefono.length === 10 && telefono.indexOf('4') === 0) telefono = '0' + telefono;
        if (telefono.length === 11 && telefono.indexOf('58') === 0) telefono = '0' + telefono.substring(2);
      }

      return {
        ok: true,
        found: true,
        data: {
          nombres: nombres,
          apellidos: apellidos,
          sexo: sexo,
          fechaNacimiento: fechaNac,
          telefono: telefono
        }
      };
    }
  }

  return { ok: true, found: false };
}

// ───────────────────────────── CONTROL DE AFORO ─────────────────────────────

/**
 * Consulta la cantidad de puestos ocupados por día, turno y salón.
 */
function getCapacities_() {
  var occupied = getOccupiedSeats_();
  return {
    ok: true,
    capacities: CAPACITIES,
    occupied: occupied
  };
}

function getOccupiedSeats_() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  var occupied = {};

  if (!sh || sh.getLastRow() < 2) return occupied;

  var data = sh.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h || '').trim().toUpperCase(); });

  var colJson = -1;
  for (var c = 0; c < headers.length; c++) {
    if (headers[c].indexOf('TURNOS (JSON)') !== -1 || headers[c].indexOf('JSON') !== -1) {
      colJson = c;
      break;
    }
  }

  for (var r = 1; r < data.length; r++) {
    var rawJson = colJson !== -1 ? data[r][colJson] : null;
    if (rawJson) {
      try {
        var turnos = JSON.parse(rawJson);
        for (var dia in turnos) {
          if (turnos[dia].manana) {
            var keyM = dia + '_manana_' + turnos[dia].manana;
            occupied[keyM] = (occupied[keyM] || 0) + 1;
          }
          if (turnos[dia].tarde) {
            var keyT = dia + '_tarde_' + turnos[dia].tarde;
            occupied[keyT] = (occupied[keyT] || 0) + 1;
          }
        }
      } catch (_) {}
    }
  }

  return occupied;
}

// ───────────────────────────── VALIDACIÓN ─────────────────────────────

function UserError_(message) { this.message = message; }
UserError_.prototype = Object.create(Error.prototype);
UserError_.prototype.name = 'UserError';

function validate_(b) {
  var nameRe = /^[A-Za-zÀ-ÿ\u00f1\u00d1][A-Za-zÀ-ÿ\u00f1\u00d1\s'.\-]{1,59}$/;
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // 1. Institución de origen
  var origenInstitucion = b.origenInstitucion === 'HCUAMP' ? 'HCUAMP' : 'OTRA';
  var institucion = origenInstitucion === 'HCUAMP'
    ? 'Hospital Central Universitario Dr. Antonio María Pineda (HCUAMP)'
    : str_(b.institucion, 120);

  if (origenInstitucion === 'OTRA' && institucion.length < 2) {
    throw new UserError_('Por favor ingresa el nombre de la institución de origen.');
  }

  // 2. Datos personales
  var nombres = str_(b.nombres, 60), apellidos = str_(b.apellidos, 60);
  if (!nameRe.test(nombres)) throw new UserError_('Nombres inválidos (solo letras).');
  if (!nameRe.test(apellidos)) throw new UserError_('Apellidos inválidos (solo letras).');

  var cedula = str_(b.cedula, 15).toUpperCase();
  if (!/^[VE]-\d{5,9}$/.test(cedula)) throw new UserError_('Cédula de identidad inválida (5 a 9 dígitos).');

  var sexo = str_(b.sexo, 20);
  if (sexo !== 'M' && sexo !== 'F') throw new UserError_('Selecciona tu sexo.');

  var fechaNacimiento = str_(b.fechaNacimiento, 20);
  if (!fechaNacimiento) throw new UserError_('Indica tu fecha de nacimiento.');

  var telefono = str_(b.telefono, 20).replace(/\D/g, '');
  if (!/^0(2\d{2}|4(12|14|16|24|26))\d{7}$/.test(telefono)) throw new UserError_('Número telefónico inválido.');

  var correo = str_(b.correo, 120).toLowerCase();
  if (!emailRe.test(correo)) throw new UserError_('Correo electrónico inválido.');

  var pais = str_(b.pais, 120) || 'Venezuela';
  var estado = str_(b.estado, 120) || 'Lara';
  var municipio = str_(b.municipio, 120) || 'Iribarren';
  var parroquia = str_(b.parroquia, 120) || 'Concepción';

  // 3. Tipo de participante y tarifa
  var tipoId = b.tipoParticipante;
  var tipo = RATES[tipoId];
  if (!tipo) throw new UserError_('Tipo de participante inválido.');

  var detalleExtra = '';
  if (origenInstitucion === 'HCUAMP') {
    if (tipoId === 'conferencista') {
      detalleExtra = str_(b.nombrePonencia, 200);
      if (!detalleExtra) throw new UserError_('Los conferencistas deben indicar el nombre de su ponencia.');
    } else if (tipoId === 'residente_ultimo_anio') {
      detalleExtra = str_(b.especialidad, 100);
      if (!detalleExtra) throw new UserError_('Los residentes de último año deben seleccionar su especialidad.');
    }
  }

  // 4. Turnos, salones y aforo
  var turnos = b.turnos || {};
  var diasActivos = [];
  var resumenTurnosArr = [];
  var occupied = getOccupiedSeats_();

  for (var diaId in DIAS_CONGRESO) {
    var tDia = turnos[diaId];
    if (tDia) {
      var partesDia = [];
      var diaLabel = DIAS_CONGRESO[diaId];

      if (tDia.manana) {
        if (tDia.manana !== 'principal' && tDia.manana !== 'alterno') {
          throw new UserError_('Salón inválido para el turno de la mañana.');
        }
        var keyM = diaId + '_manana_' + tDia.manana;
        var maxM = CAPACITIES[tDia.manana];
        if ((occupied[keyM] || 0) + 1 > maxM) {
          var salonNom = tDia.manana === 'principal' ? 'Salón Principal' : 'Salón Alterno';
          throw new UserError_('El ' + salonNom + ' para el turno de la Mañana del ' + diaLabel + ' ha alcanzado el aforo máximo permitido (' + maxM + ' puestos).');
        }
        partesDia.push('Mañana: ' + (tDia.manana === 'principal' ? 'Salón Principal' : 'Salón Alterno'));
      }

      if (tDia.tarde) {
        if (tDia.tarde !== 'principal' && tDia.tarde !== 'alterno') {
          throw new UserError_('Salón inválido para el turno de la tarde.');
        }
        var keyT = diaId + '_tarde_' + tDia.tarde;
        var maxT = CAPACITIES[tDia.tarde];
        if ((occupied[keyT] || 0) + 1 > maxT) {
          var salonNomT = tDia.tarde === 'principal' ? 'Salón Principal' : 'Salón Alterno';
          throw new UserError_('El ' + salonNomT + ' para el turno de la Tarde del ' + diaLabel + ' ha alcanzado el aforo máximo permitido (' + maxT + ' puestos).');
        }
        partesDia.push('Tarde: ' + (tDia.tarde === 'principal' ? 'Salón Principal' : 'Salón Alterno'));
      }

      if (partesDia.length > 0) {
        diasActivos.push(diaId);
        resumenTurnosArr.push(diaLabel + ' (' + partesDia.join(', ') + ')');
      }
    }
  }

  if (diasActivos.length === 0) {
    throw new UserError_('Debes seleccionar al menos un día y turno de participación.');
  }

  // 5. Cálculo del monto (tarifa por día)
  var total = 0;
  if (origenInstitucion === 'HCUAMP') {
    total = 0; // Exoneración total
  } else {
    total = tipo.rate * diasActivos.length;
    if (total > 0 && !b.comprobante) {
      throw new UserError_('Debes adjuntar el comprobante de pago.');
    }
  }

  return {
    origenInstitucion: origenInstitucion,
    institucion: institucion,
    nombres: nombres,
    apellidos: apellidos,
    cedula: cedula,
    sexo: sexo,
    fechaNacimiento: fechaNacimiento,
    telefono: telefono,
    correo: correo,
    tipoId: tipoId,
    tipoLabel: tipo.label,
    detalleExtra: detalleExtra,
    pais: pais,
    estado: estado,
    municipio: municipio,
    parroquia: parroquia,
    turnos: turnos,
    diasActivos: diasActivos,
    diasLabel: diasActivos.map(function (d) { return DIAS_CONGRESO[d]; }).join(', '),
    resumenTurnos: resumenTurnosArr.join('; '),
    rate: origenInstitucion === 'HCUAMP' ? 0 : tipo.rate,
    total: total
  };
}

function str_(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().substring(0, max);
}

function safe_(v) {
  v = String(v == null ? '' : v);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

// ─────────────────────────────── DRIVE ───────────────────────────────

function saveReceipt_(file, data) {
  if (!file || !file.base64) return null;

  var mime = String(file.mimeType || '');
  if (CONFIG.ALLOWED_MIME.indexOf(mime) === -1) throw new UserError_('Tipo de archivo no permitido.');

  var bytes;
  try { bytes = Utilities.base64Decode(file.base64); }
  catch (err) { throw new UserError_('El archivo adjunto está dañado.'); }
  if (bytes.length > CONFIG.MAX_FILE_BYTES) throw new UserError_('El archivo supera el tamaño máximo permitido (8 MB).');

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
    sh.getRange('G:J').setNumberFormat('@'); // cédula, sexo, fecha, tlf
  } else {
    // Si la hoja ya existía con cabeceras antiguas, sincronizar si faltan columnas
    var curHeaders = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    if (curHeaders.length < HEADERS.length) {
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
        .setFontWeight('bold').setBackground('#1d63d8').setFontColor('#ffffff');
    }
  }
  return sh;
}

function appendRow_(d, receiptFile) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = getSheet_();
    var row = sh.getLastRow() + 1;
    var seq = row - 1;
    var id = CONFIG.ID_PREFIX + '-' + ('0000' + seq).slice(-4);

    var note = '';
    if (row > 2) {
      var ceds = sh.getRange(2, 7, row - 2, 1).getValues();
      for (var i = 0; i < ceds.length; i++) {
        if (String(ceds[i][0]) === d.cedula) {
          note = 'Cédula registrada previamente en fila ' + (i + 2);
          break;
        }
      }
    }

    sh.getRange(row, 7, 1, 4).setNumberFormat('@'); // cédula, sexo, fecha, teléfono como texto
    sh.getRange(row, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');

    sh.getRange(row, 1, 1, HEADERS.length).setValues([[
      id,
      new Date(),
      d.origenInstitucion,
      safe_(d.institucion),
      safe_(d.nombres),
      safe_(d.apellidos),
      d.cedula,
      d.sexo,
      d.fechaNacimiento,
      d.telefono,
      safe_(d.correo),
      d.tipoLabel,
      safe_(d.detalleExtra),
      safe_(d.pais),
      safe_(d.estado),
      safe_(d.municipio),
      safe_(d.parroquia),
      d.diasLabel,
      d.diasActivos.length,
      safe_(d.resumenTurnos),
      JSON.stringify(d.turnos),
      d.rate,
      d.total,
      receiptFile ? receiptFile.getUrl() : '',
      d.total === 0 ? 'Exonerado' : 'Pendiente de verificación',
      note
    ]]);

    SpreadsheetApp.flush();
    return { id: id, row: row };
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────── CORREO ───────────────────────────────

function sendEmail_(d, id) {
  try {
    var monto = d.total === 0 ? 'Exonerado (100%)' : 'USD ' + d.total + ' (al cambio oficial BCV)';
    var html =
      '<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;color:#0b2545">' +
      '<h2 style="color:#1d63d8;margin-bottom:8px">Comprobante de Inscripción</h2>' +
      '<p style="font-size:15px">Hola <b>' + esc_(d.nombres) + '</b>, hemos recibido tu inscripción al <b>XIV Congreso Pineda 2026</b> ' +
      '(2 al 6 de noviembre · Biotel Suites, Barquisimeto).</p>' +
      '<table style="border-collapse:collapse;width:100%;font-size:14px;margin:20px 0">' +
      row_('Código de Registro', id) +
      row_('Institución', esc_(d.institucion)) +
      row_('Participante', esc_(d.tipoLabel)) +
      (d.detalleExtra ? row_('Detalle', esc_(d.detalleExtra)) : '') +
      row_('Días seleccionados', esc_(d.diasLabel)) +
      row_('Turnos y Salones', esc_(d.resumenTurnos)) +
      row_('Monto', monto) +
      '</table>' +
      '<div style="background:#f4f8fb;padding:16px;border-radius:10px;font-size:13px;color:#475569;margin-top:16px">' +
      (d.total === 0
        ? '<b>Inscripción exonerada:</b> Tu registro ha sido procesado automáticamente. Incluye acceso a las ponencias académicas, certificado digital y kit del participante.'
        : '<b>Pago en verificación:</b> Nuestro equipo validará el comprobante bancario emitido y recibirás la confirmación final por este medio.') +
      '</div>' +
      '<p style="color:#7a8aa3;font-size:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px">' +
      'Hospital Central Universitario «Dr. Antonio María Pineda» · Barquisimeto, Estado Lara.' +
      '</p></div>';

    MailApp.sendEmail({
      to: d.correo,
      subject: 'Inscripción Recibida · XIV Congreso Pineda 2026 · ' + id,
      htmlBody: html,
      name: CONFIG.EMAIL_SENDER_NAME
    });
  } catch (err) {
    console.warn('No se pudo enviar el correo: ' + err);
  }
}

function row_(k, v) {
  return '<tr><td style="padding:7px 10px;border-bottom:1px solid #e3ecf7;color:#7a8aa3;width:40%">' + k +
         '</td><td style="padding:7px 10px;border-bottom:1px solid #e3ecf7"><b>' + v + '</b></td></tr>';
}

function esc_(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────── DASHBOARD & SCANNER ───────────────────────────────

function getDashboardData_() {
  var sh = getSheet_();
  var rows = sh.getDataRange().getValues();
  if (rows.length < 2) return [];
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    data.push({
      id: r[0],
      fecha: r[1],
      origen: r[2],
      institucion: r[3],
      nombres: r[4],
      apellidos: r[5],
      cedula: r[6],
      sexo: r[7],
      fechaNacimiento: r[8],
      telefono: r[9],
      correo: r[10],
      tipo: r[11],
      monto: r[22],
      comprobante: r[23],
      estado: r[24]
    });
  }
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
    sh.getRange(rowIndex, 25).setValue('Aprobado');
    return { success: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

function scanQr_(body) {
  var id = body.id;
  var salon = body.salon;
  var jornada = body.jornada;
  var validador = body.user || 'Desconocido';
  if (!id) throw new UserError_('Código inválido.');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var shInsc = ss.getSheetByName(CONFIG.SHEET_NAME);
    var data = shInsc.getDataRange().getValues();
    var found = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) { found = data[i]; break; }
    }
    if (!found) throw new UserError_('Registro no encontrado.');
    return { success: true, nombres: found[4] + ' ' + found[5], tipo: found[11] };
  } finally {
    lock.releaseLock();
  }
}

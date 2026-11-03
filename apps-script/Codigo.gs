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
  terapeutas: { label: 'Fisioterapeuta / Terapeuta Ocupacional / Otros Terapeutas (HCUAMP)', rate: 0, hcuamp: true },
  psicologo_psiquiatra: { label: 'Psicólogo/Psiquiatra (HCUAMP)', rate: 0, hcuamp: true },
  conferencista: { label: 'Conferencista (HCUAMP)', rate: 0, hcuamp: true },
  residente_ultimo_anio: { label: 'Residente de último año (HCUAMP)', rate: 0, hcuamp: true },

  // Otra Institución (Tarifas USD por día)
  estudiante_pregrado_otra: { label: 'Bachiller / Estudiante de pregrado', rate: 0, hcuamp: false },
  medico_general_especialista: { label: 'Médico general y especialista', rate: 20, hcuamp: false },
  medico_residente: { label: 'Médico residente', rate: 15, hcuamp: false },
  enfermero_otra: { label: 'Enfermera/o', rate: 10, hcuamp: false },
  terapeutas_otra: { label: 'Fisioterapeuta / Terapeuta Ocupacional / Otros Terapeutas', rate: 15, hcuamp: false },
  psicologo_psiquiatra_otra: { label: 'Psicólogo/Psiquiatra', rate: 15, hcuamp: false },
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
    if (action === 'get_form_status') {
      return json_({ ok: true, registrationEnabled: isRegistrationFormEnabled_() });
    }
    if (action === 'get_capacities') {
      return json_(getCapacities_());
    }
    if (action === 'lookup_participant') {
      return json_(lookupParticipant_(p.query || p.cedula || p.id || p.correo));
    }
    if (action === 'check_registration') {
      return json_(checkExistingRegistration_(p.cedula, p.correo));
    }
    if (action === 'lookup_bachiller') {
      return json_(lookupBachiller_(p.cedula, p.sheetName));
    }
    if (action === 'confirm_bachiller') {
      return json_(confirmBachiller_(p));
    }
    if (action === 'get_mail_quota') {
      var q = null;
      try { q = MailApp.getRemainingDailyQuota(); } catch (_) {}
      return json_({ ok: true, quota: q });
    }
    if (action === 'get_occupancy') {
      if (p.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: getOccupancy_(p.jornada, p.turno, p.salon) });
    }
    if (action === 'get_asistencias') {
      if (p.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: getAsistenciasList_(p.jornada, p.turno, p.salon) });
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
    if (body.action === 'lookup_bachiller') {
      return json_(lookupBachiller_(body.cedula, body.sheetName));
    }
    if (body.action === 'confirm_bachiller') {
      return json_(confirmBachiller_(body));
    }
    if (body.action === 'get_capacities') {
      return json_(getCapacities_());
    }
    if (body.action === 'lookup_participant') {
      return json_(lookupParticipant_(body.query || body.cedula || body.id || body.correo));
    }
    if (body.action === 'check_registration') {
      return json_(checkExistingRegistration_(body.cedula, body.correo));
    }
    if (body.action === 'get_form_status') {
      return json_({ ok: true, registrationEnabled: isRegistrationFormEnabled_() });
    }
    if (body.action === 'set_form_status' || body.action === 'toggle_form_status') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_(setRegistrationFormEnabled_(!!body.enabled));
    }
    if (body.action === 'get_dashboard') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      var qDashboard = null;
      try { qDashboard = MailApp.getRemainingDailyQuota(); } catch (_) {}
      return json_({ ok: true, data: getDashboardData_(), mailQuota: qDashboard, registrationEnabled: isRegistrationFormEnabled_() });
    }
    if (body.action === 'approve_payment') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: approvePayment_(body.id) });
    }
    if (body.action === 'resend_email') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: resendEmailById_(body.id) });
    }
    if (body.action === 'resend_bulk_emails') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: resendBulkEmails_(body) });
    }
    if (body.action === 'get_occupancy') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: getOccupancy_(body.jornada, body.turno, body.salon) });
    }
    if (body.action === 'validate_access' || body.action === 'scan_qr') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: validateAccess_(body) });
    }
    if (body.action === 'get_asistencias') {
      if (body.token !== CONFIG.ADMIN_TOKEN) throw new UserError_('Token inválido.');
      return json_({ ok: true, data: getAsistenciasList_(body.jornada, body.turno, body.salon) });
    }

    // Honeypot anti-spam
    if (body.website) return json_({ ok: true, id: 'CP26-0000', total: 0 });

    // 0. Comprobar si el formulario de registro está habilitado
    if (!isRegistrationFormEnabled_()) {
      throw new UserError_('El formulario de registro se encuentra temporalmente en pausa por labores técnicas para optimizar su experiencia y disfrute.');
    }

    // 1. Validación de datos, tarifas y aforo en el servidor
    var data = validate_(body);

    // 2. Subir comprobante a Google Drive si aplica
    uploaded = saveReceipt_(body.comprobante, data);

    // 3. Registrar o Actualizar fila en Google Sheets (con lock service concurrente)
    var result;
    if (body.isUpdate || data.isUpdate) {
      result = updateRegistration_(data, uploaded, body.existingId || data.existingId);
    } else {
      result = appendRow_(data, uploaded);
    }
    uploaded = null; // No limpiar archivo en Drive porque ya se vinculó con éxito

    // 4. Enviar correo de confirmación
    if (CONFIG.SEND_CONFIRMATION_EMAIL) {
      sendEmail_(data, result.id, !!result.isUpdate);
    }

    return json_({
      ok: true,
      id: result.id,
      total: data.total,
      exonerated: data.total === 0,
      isUpdate: !!result.isUpdate
    });
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
          nombres: nombres.toUpperCase(),
          apellidos: apellidos.toUpperCase(),
          sexo: sexo,
          fechaNacimiento: fechaNac,
          telefono: telefono
        }
      };
    }
  }

  return { ok: true, found: false };
}

// ───────────────────────────── PARTICIPANTE ÚNICO (ANTI-DUPLICADOS) ─────────────────────────────

function buildParticipantRecord_(r) {
  return {
    id: String(r[0] || ''),
    fecha: r[1] instanceof Date ? Utilities.formatDate(r[1], 'America/Caracas', 'dd/MM/yyyy HH:mm') : String(r[1] || ''),
    origen: String(r[2] || ''),
    institucion: String(r[3] || ''),
    nombres: String(r[4] || ''),
    apellidos: String(r[5] || ''),
    cedula: String(r[6] || ''),
    sexo: String(r[7] || ''),
    fechaNacimiento: r[8] instanceof Date ? Utilities.formatDate(r[8], 'America/Caracas', 'yyyy-MM-dd') : String(r[8] || ''),
    telefono: String(r[9] || ''),
    correo: String(r[10] || ''),
    tipoLabel: String(r[11] || ''),
    detalleExtra: String(r[12] || ''),
    pais: String(r[13] || ''),
    estado: String(r[14] || ''),
    municipio: String(r[15] || ''),
    parroquia: String(r[16] || ''),
    diasLabel: String(r[17] || ''),
    numDias: r[18] || 1,
    turnosTexto: String(r[19] || ''),
    turnosJson: String(r[20] || ''),
    total: r[22] || 0,
    estadoPago: String(r[24] || '')
  };
}

/**
 * Verifica si un participante ya se encuentra registrado por Cédula o Correo.
 * Previene la duplicación de registros y la pérdida de cupos para otros participantes.
 */
function checkExistingRegistration_(rawCedula, rawEmail) {
  var cleanCed = String(rawCedula || '').replace(/\D/g, '');
  var cleanEmail = String(rawEmail || '').trim().toLowerCase();
  if (!cleanCed && !cleanEmail) return { ok: false, error: 'Cédula o correo requerido.' };

  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (sh && sh.getLastRow() >= 2) {
    var numCols = Math.min(sh.getLastColumn(), 26);
    var data = sh.getRange(2, 1, sh.getLastRow() - 1, numCols).getValues();
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rowCed = String(row[6] || '').replace(/\D/g, '');
      var rowEmail = String(row[10] || '').trim().toLowerCase();

      if (cleanCed && rowCed && cleanCed === rowCed) {
        return {
          ok: true,
          registered: true,
          by: 'cedula',
          data: buildParticipantRecord_(row),
          message: 'La cédula ' + row[6] + ' ya se encuentra formalmente registrada con el comprobante N.º ' + row[0] + '.'
        };
      }

      if (cleanEmail && rowEmail && cleanEmail === rowEmail) {
        return {
          ok: true,
          registered: true,
          by: 'correo',
          data: buildParticipantRecord_(row),
          message: 'El correo ' + row[10] + ' ya se encuentra formalmente registrado con el comprobante N.º ' + row[0] + '.'
        };
      }
    }
  }

  // Verificar también en hoja 'Bachilleres - Estudiantes de Pregrado'
  var shBach = ss.getSheetByName('Bachilleres - Estudiantes de Pregrado');
  if (shBach && shBach.getLastRow() >= 2) {
    var bachData = shBach.getDataRange().getValues();
    var bachHeaders = bachData[0].map(function (h) { return String(h || '').trim().toUpperCase(); });
    var bColCed = -1, bColNom = -1, bColAp = -1, bColMail = -1, bColTlf = -1, bColJson = -1, bColTxt = -1, bColDias = -1, bColId = -1;
    for (var bc = 0; bc < bachHeaders.length; bc++) {
      var bh = bachHeaders[bc];
      if (bh === 'ID') bColId = bc;
      else if (bh.indexOf('CÉDULA') !== -1 || bh.indexOf('CEDULA') !== -1 || bh === 'CI') bColCed = bc;
      else if (bh.indexOf('NOMBRES') !== -1 && bh.indexOf('APELLIDOS') === -1) bColNom = bc;
      else if (bh.indexOf('APELLIDOS') !== -1 && bh.indexOf('NOMBRES') === -1) bColAp = bc;
      else if (bh.indexOf('CORREO') !== -1 || bh.indexOf('EMAIL') !== -1) bColMail = bc;
      else if (bh.indexOf('TELÉFONO') !== -1 || bh.indexOf('TELEFONO') !== -1) bColTlf = bc;
      else if (bh.indexOf('TURNOS (JSON)') !== -1 || bh.indexOf('JSON') !== -1) bColJson = bc;
      else if (bh.indexOf('TURNOS Y SALONES') !== -1) bColTxt = bc;
      else if (bh.indexOf('DÍAS') !== -1 || bh.indexOf('DIAS') !== -1) bColDias = bc;
    }
    if (bColCed !== -1) {
      for (var bi = 1; bi < bachData.length; bi++) {
        var bRow = bachData[bi];
        var bCed = String(bRow[bColCed] || '').replace(/\D/g, '');
        var bMail = bColMail !== -1 ? String(bRow[bColMail] || '').trim().toLowerCase() : '';
        if ((cleanCed && bCed && cleanCed === bCed) || (cleanEmail && bMail && cleanEmail === bMail)) {
          var bId = bColId !== -1 ? String(bRow[bColId] || '').trim() : '';
          return {
            ok: true,
            registered: true,
            by: cleanCed === bCed ? 'cedula' : 'correo',
            data: {
              id: bId || 'CP26-BACH-' + bi,
              fecha: '',
              origen: 'OTRA',
              institucion: 'UNIVERSIDAD / INSTITUCIÓN EDUCATIVA',
              nombres: bColNom !== -1 ? String(bRow[bColNom] || '').trim() : '',
              apellidos: bColAp !== -1 ? String(bRow[bColAp] || '').trim() : '',
              cedula: String(bRow[bColCed] || ''),
              sexo: '',
              fechaNacimiento: '',
              telefono: bColTlf !== -1 ? String(bRow[bColTlf] || '').trim() : '',
              correo: bMail,
              tipoLabel: 'BACHILLER / ESTUDIANTE DE PREGRADO',
              detalleExtra: '',
              pais: 'VENEZUELA',
              estado: 'LARA',
              municipio: '',
              parroquia: '',
              diasLabel: bColDias !== -1 ? String(bRow[bColDias] || '') : '',
              numDias: 1,
              turnosTexto: bColTxt !== -1 ? String(bRow[bColTxt] || '') : '',
              turnosJson: bColJson !== -1 ? String(bRow[bColJson] || '') : '',
              total: 0,
              estadoPago: 'Exonerado 100%'
            },
            message: 'El participante ya se encuentra registrado bajo la categoría Bachiller / Pregrado.'
          };
        }
      }
    }
  }

  return { ok: true, registered: false };
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

  // 1. Institución de origen (ALMACENAR EN MAYÚSCULAS)
  var origenInstitucion = b.origenInstitucion === 'HCUAMP' ? 'HCUAMP' : 'OTRA';
  var institucion = origenInstitucion === 'HCUAMP'
    ? 'HOSPITAL CENTRAL UNIVERSITARIO DR. ANTONIO MARÍA PINEDA (HCUAMP)'
    : str_(b.institucion, 120).toUpperCase();

  if (origenInstitucion === 'OTRA' && institucion.length < 2) {
    throw new UserError_('Por favor ingresa el nombre de la institución de origen.');
  }

  // 2. Datos personales (Nombres y Apellidos en MAYÚSCULAS)
  var rawNombres = str_(b.nombres, 60), rawApellidos = str_(b.apellidos, 60);
  if (!nameRe.test(rawNombres)) throw new UserError_('Nombres inválidos (solo letras).');
  if (!nameRe.test(rawApellidos)) throw new UserError_('Apellidos inválidos (solo letras).');
  var nombres = rawNombres.toUpperCase();
  var apellidos = rawApellidos.toUpperCase();

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

  // Verificación de participante (prevenir duplicados no autorizados pero permitir actualización de turnos)
  var dup = checkExistingRegistration_(cedula, correo);
  var isUpdateMode = !!(b.isUpdate || b.existingId);
  if (dup.registered) {
    if (!isUpdateMode) {
      throw new UserError_(
        'El participante con Cédula ' + cedula + ' ya se encuentra formalmente registrado en el XIV Congreso Pineda (Comprobante ' +
        dup.data.id + '). Cada persona solo puede registrarse una sola vez para no quitarle cupo a otro participante.'
      );
    }
  }

  // País, Estado, Municipio, Parroquia (ALMACENAR EN MAYÚSCULAS)
  var pais = (str_(b.pais, 120) || 'VENEZUELA').toUpperCase();
  var estado = (str_(b.estado, 120) || 'LARA').toUpperCase();
  var municipio = str_(b.municipio, 120).toUpperCase();
  var parroquia = str_(b.parroquia, 120).toUpperCase();
  if (!municipio) throw new UserError_('Por favor ingresa el Municipio.');
  if (!parroquia) throw new UserError_('Por favor ingresa la Parroquia.');

  // 3. Tipo de participante y tarifa (ALMACENAR EN MAYÚSCULAS)
  var tipoId = b.tipoParticipante;
  var closedTypes = ['acompanante', 'conferencista', 'acompanante_otra'];
  if (closedTypes.indexOf(tipoId) !== -1 || closedTypes.indexOf(b.tipoParticipante) !== -1) {
    throw new UserError_('El registro para la categoría seleccionada (Acompañante o Conferencista) ya no se encuentra disponible.');
  }
  if (tipoId === 'terapeutas' || tipoId === 'terapeutas_otra' || tipoId === 'fisioterapeuta' || tipoId === 'terapeuta') {
    tipoId = origenInstitucion === 'HCUAMP' ? 'terapeutas' : 'terapeutas_otra';
  } else if (tipoId === 'estudiante_pregrado_otra' || tipoId === 'bachiller_otra' || tipoId === 'bachiller_pregrado_otra') {
    tipoId = origenInstitucion === 'HCUAMP' ? 'bachiller' : 'estudiante_pregrado_otra';
  } else if (tipoId === 'psicologo_psiquiatra' || tipoId === 'psicologo_psiquiatra_otra' || tipoId === 'psicologo' || tipoId === 'psiquiatra') {
    tipoId = origenInstitucion === 'HCUAMP' ? 'psicologo_psiquiatra' : 'psicologo_psiquiatra_otra';
  }
  var tipo = RATES[tipoId];
  if (!tipo) {
    if (tipoId === 'otro_personal_afin' || String(b.tipoLabel || '').toLowerCase().indexOf('terapeuta') !== -1) {
      tipo = {
        label: b.tipoLabel || 'Fisioterapeuta / Terapeuta Ocupacional / Otros Terapeutas',
        rate: origenInstitucion === 'HCUAMP' ? 0 : 15,
        hcuamp: origenInstitucion === 'HCUAMP'
      };
    } else if (String(b.tipoLabel || '').toLowerCase().indexOf('psic') !== -1 || String(b.tipoLabel || '').toLowerCase().indexOf('psiquiat') !== -1) {
      tipo = {
        label: b.tipoLabel || 'Psicólogo/Psiquiatra',
        rate: origenInstitucion === 'HCUAMP' ? 0 : 15,
        hcuamp: origenInstitucion === 'HCUAMP'
      };
    } else if (String(b.tipoLabel || '').toLowerCase().indexOf('estudiante') !== -1 || String(b.tipoLabel || '').toLowerCase().indexOf('bachiller') !== -1) {
      tipo = {
        label: b.tipoLabel || 'Bachiller / Estudiante de pregrado',
        rate: 0,
        hcuamp: origenInstitucion === 'HCUAMP'
      };
    } else {
      throw new UserError_('Tipo de participante inválido.');
    }
  }

  var tipoLabel = str_(b.tipoLabel || tipo.label, 120).toUpperCase();

  // Detalle Ponencia / Especialidad (ALMACENAR EN MAYÚSCULAS)
  var detalleExtra = '';
  if (origenInstitucion === 'HCUAMP') {
    if (tipoId === 'conferencista') {
      detalleExtra = str_(b.nombrePonencia || b.detalleExtra, 200).toUpperCase();
      if (!detalleExtra) throw new UserError_('Los conferencistas deben indicar el nombre de su ponencia.');
    } else if (tipoId === 'residente_ultimo_anio') {
      detalleExtra = str_(b.especialidad || b.detalleExtra, 100).toUpperCase();
      if (!detalleExtra) throw new UserError_('Los residentes de último año deben seleccionar su especialidad.');
    }
  } else {
    if (b.detalleExtra || b.nombrePonencia || b.especialidad) {
      detalleExtra = str_(b.detalleExtra || b.nombrePonencia || b.especialidad, 200).toUpperCase();
    }
  }

  // 4. Turnos, salones y aforo
  var turnos = b.turnos || {};
  var diasActivos = [];
  var resumenTurnosArr = [];
  var occupied = getOccupiedSeats_();

  // Si es actualización, obtenemos los turnos previos del participante para no descontarlos de su propio aforo
  var prevTurnos = {};
  if (isUpdateMode && dup && dup.registered && dup.data && dup.data.turnosJson) {
    try {
      prevTurnos = JSON.parse(dup.data.turnosJson) || {};
    } catch (_) {}
  }

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
        var alreadyHadMorningSeat = prevTurnos[diaId] && prevTurnos[diaId].manana === tDia.manana;
        // Restricción de aforo en registro desactivada: el acceso físico se gestiona por orden de llegada en sede.
        partesDia.push('Mañana: ' + (tDia.manana === 'principal' ? 'Salón Principal (1)' : 'Salón Alterno (2)'));
      }

      if (tDia.tarde) {
        if (tDia.tarde !== 'principal' && tDia.tarde !== 'alterno') {
          throw new UserError_('Salón inválido para el turno de la tarde.');
        }
        var keyT = diaId + '_tarde_' + tDia.tarde;
        var maxT = CAPACITIES[tDia.tarde];
        var alreadyHadAfternoonSeat = prevTurnos[diaId] && prevTurnos[diaId].tarde === tDia.tarde;
        // Restricción de aforo en registro desactivada: el acceso físico se gestiona por orden de llegada en sede.
        partesDia.push('Tarde: ' + (tDia.tarde === 'principal' ? 'Salón Principal (1)' : 'Salón Alterno (2)'));
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
    isUpdate: isUpdateMode,
    existingId: b.existingId || (dup && dup.data && dup.data.id) || '',
    origenInstitucion: origenInstitucion,
    institucion: institucion.toUpperCase(),
    nombres: nombres.toUpperCase(),
    apellidos: apellidos.toUpperCase(),
    cedula: cedula,
    sexo: sexo,
    fechaNacimiento: fechaNacimiento,
    telefono: telefono,
    correo: correo,
    tipoId: tipoId,
    tipoLabel: tipoLabel.toUpperCase(),
    detalleExtra: detalleExtra.toUpperCase(),
    pais: pais.toUpperCase(),
    estado: estado.toUpperCase(),
    municipio: municipio.toUpperCase(),
    parroquia: parroquia.toUpperCase(),
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
      var allRows = sh.getRange(2, 1, row - 2, 11).getValues();
      var cleanTargetCed = String(d.cedula || '').replace(/\D/g, '');
      var cleanTargetEmail = String(d.correo || '').trim().toLowerCase();

      for (var i = 0; i < allRows.length; i++) {
        var existingId = String(allRows[i][0] || '');
        var existingCed = String(allRows[i][6] || '').replace(/\D/g, '');
        var existingEmail = String(allRows[i][10] || '').trim().toLowerCase();

        if (cleanTargetCed && existingCed && cleanTargetCed === existingCed) {
          throw new UserError_(
            'Esta persona ya se encuentra registrada en el XIV Congreso Pineda (Cédula: ' + d.cedula +
            ', Comprobante ID: ' + existingId + '). Cada participante solo puede registrarse una vez para no quitarle cupo a otra persona.'
          );
        }

        if (cleanTargetEmail && existingEmail && cleanTargetEmail === existingEmail) {
          throw new UserError_(
            'El correo ' + d.correo + ' ya se encuentra registrado con el Comprobante ID: ' +
            existingId + '. No se permite duplicar registros para garantizar el cupo a otros participantes.'
          );
        }
      }
    }

    sh.getRange(row, 7, 1, 4).setNumberFormat('@'); // cédula, sexo, fecha, teléfono como texto
    sh.getRange(row, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');

    sh.getRange(row, 1, 1, HEADERS.length).setValues([[
      id,
      new Date(),
      d.origenInstitucion,
      safe_(String(d.institucion || '').toUpperCase()),
      safe_(String(d.nombres || '').toUpperCase()),
      safe_(String(d.apellidos || '').toUpperCase()),
      d.cedula,
      d.sexo,
      d.fechaNacimiento,
      d.telefono,
      safe_(d.correo),
      String(d.tipoLabel || '').toUpperCase(),
      safe_(String(d.detalleExtra || '').toUpperCase()),
      safe_(String(d.pais || '').toUpperCase()),
      safe_(String(d.estado || '').toUpperCase()),
      safe_(String(d.municipio || '').toUpperCase()),
      safe_(String(d.parroquia || '').toUpperCase()),
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

function updateRegistration_(d, receiptFile, existingId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = getSheet_();
    var lastRow = sh.getLastRow();
    if (lastRow < 2) throw new UserError_('No se encontró el registro para actualizar.');

    var numCols = Math.min(sh.getLastColumn(), 26);
    var allRows = sh.getRange(2, 1, lastRow - 1, numCols).getValues();
    var cleanTargetCed = String(d.cedula || '').replace(/\D/g, '');
    var targetRowIndex = -1;
    var foundId = existingId || '';

    for (var i = 0; i < allRows.length; i++) {
      var rId = String(allRows[i][0] || '').trim();
      var rCed = String(allRows[i][6] || '').replace(/\D/g, '');
      if ((existingId && rId === String(existingId).trim()) || (cleanTargetCed && rCed === cleanTargetCed)) {
        targetRowIndex = i + 2;
        foundId = rId || existingId;
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new UserError_('No se encontró el registro previo con la cédula ' + d.cedula + '.');
    }

    var currentObs = String(allRows[targetRowIndex - 2][25] || '');
    var updateNote = 'Actualización de turnos (' + Utilities.formatDate(new Date(), 'America/Caracas', 'dd/MM/yyyy HH:mm') + ')';
    var newObs = currentObs ? currentObs + ' | ' + updateNote : updateNote;

    sh.getRange(targetRowIndex, 18).setValue(d.diasLabel);
    sh.getRange(targetRowIndex, 19).setValue(d.diasActivos.length);
    sh.getRange(targetRowIndex, 20).setValue(safe_(d.resumenTurnos));
    sh.getRange(targetRowIndex, 21).setValue(JSON.stringify(d.turnos));
    sh.getRange(targetRowIndex, 22).setValue(d.rate);
    sh.getRange(targetRowIndex, 23).setValue(d.total);
    if (receiptFile) {
      sh.getRange(targetRowIndex, 24).setValue(receiptFile.getUrl());
      if (d.total > 0) {
        sh.getRange(targetRowIndex, 25).setValue('Pendiente de verificación');
      }
    }
    sh.getRange(targetRowIndex, 26).setValue(newObs);

    // Sincronizar en hoja 'Bachilleres - Estudiantes de Pregrado' si existe
    try {
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      var shBach = ss.getSheetByName('Bachilleres - Estudiantes de Pregrado');
      if (shBach && shBach.getLastRow() >= 2) {
        var bData = shBach.getDataRange().getValues();
        var bHeaders = bData[0].map(function (h) { return String(h || '').trim().toUpperCase(); });
        var bColCed = -1, bColTxt = -1, bColJson = -1, bColDias = -1;
        for (var bc = 0; bc < bHeaders.length; bc++) {
          var bh = bHeaders[bc];
          if (bh.indexOf('CÉDULA') !== -1 || bh.indexOf('CEDULA') !== -1 || bh === 'CI') bColCed = bc;
          else if (bh.indexOf('TURNOS Y SALONES') !== -1) bColTxt = bc;
          else if (bh.indexOf('TURNOS (JSON)') !== -1 || bh.indexOf('JSON') !== -1) bColJson = bc;
          else if (bh.indexOf('DÍAS') !== -1 || bh.indexOf('DIAS') !== -1) bColDias = bc;
        }
        if (bColCed !== -1) {
          for (var bi = 1; bi < bData.length; bi++) {
            var bCed = String(bData[bi][bColCed] || '').replace(/\D/g, '');
            if (bCed === cleanTargetCed) {
              if (bColTxt !== -1) shBach.getRange(bi + 1, bColTxt + 1).setValue(safe_(d.resumenTurnos));
              if (bColJson !== -1) shBach.getRange(bi + 1, bColJson + 1).setValue(JSON.stringify(d.turnos));
              if (bColDias !== -1) shBach.getRange(bi + 1, bColDias + 1).setValue(d.diasLabel);
              break;
            }
          }
        }
      }
    } catch (bErr) {
      console.warn('Error sincronizando hoja Bachilleres:', bErr);
    }

    SpreadsheetApp.flush();
    return { id: foundId, row: targetRowIndex, isUpdate: true };
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────── CORREO ───────────────────────────────

function sendEmail_(d, id, isUpdate) {
  try {
    var monto = d.total === 0 ? 'Exonerado 100% (0$)' : 'USD ' + d.total + ' (al cambio oficial BCV)';
    var qrUrl = 'https://quickchart.io/qr?size=320&text=' + encodeURIComponent(id);

    // Intentamos incrustar el código QR como imagen inline (cid:qrCode)
    var inlineImages = {};
    var qrImgSrc = qrUrl;
    try {
      var qrResp = UrlFetchApp.fetch(qrUrl, { muteHttpExceptions: true });
      if (qrResp && qrResp.getResponseCode() === 200) {
        var qrBlob = qrResp.getBlob().setName('qr_' + id + '.png');
        inlineImages['qrCode'] = qrBlob;
        qrImgSrc = 'cid:qrCode';
      }
    } catch (imgErr) {
      console.warn('Fallback a URL directa de QR:', imgErr);
      qrImgSrc = qrUrl;
    }

    var subject = isUpdate
      ? 'Actualización de Turnos · Pase Oficial ' + id + ' · XIV Congreso Pineda 2026'
      : 'Pase Oficial de Acceso y Comprobante ' + id + ' · XIV Congreso Pineda 2026';

    var html =
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#0b2545;line-height:1.5;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">' +
      '<div style="text-align:center;padding:24px 20px 20px 20px;background:#0b2545;color:#ffffff">' +
      '<span style="font-size:11px;font-weight:bold;letter-spacing:2px;color:#93c5fd;text-transform:uppercase">XIV CONGRESO PINEDA 2026</span>' +
      '<h2 style="color:#ffffff;margin:8px 0 4px 0;font-size:22px;font-weight:900">' + (isUpdate ? 'Actualización de Turnos y Pase de Acceso' : 'Pase Oficial de Acceso y Comprobante') + '</h2>' +
      '<p style="font-size:12px;color:#dbeafe;margin:0">Hospital Central Universitario «Dr. Antonio María Pineda»</p>' +
      '</div>' +

      '<div style="padding:24px 20px">' +
      '<p style="font-size:15px;margin-top:0">Hola <b>' + esc_(d.nombres) + ' ' + esc_(d.apellidos || '') + '</b>,</p>' +
      '<p style="font-size:14px;color:#334155;margin-bottom:20px">' +
      (isUpdate
        ? 'Confirmamos la <b>actualización exitosa de tus turnos y jornadas de asistencia</b> para el <b>XIV Congreso Pineda 2026</b>, a celebrarse del <b>2 al 6 de noviembre de 2026</b> en el Hotel Biotel Suites, Barquisimeto.'
        : 'Confirmamos la recepción y el registro exitoso de tu inscripción para el <b>XIV Congreso Pineda 2026</b>, a celebrarse del <b>2 al 6 de noviembre de 2026</b> en el Hotel Biotel Suites, Barquisimeto.') +
      '</p>' +

      // Bloque Destacado del Código QR
      '<div style="background:#f8fafc;padding:20px;border-radius:14px;text-align:center;margin:20px 0;border:1.5px solid #cbd5e1">' +
      '<span style="font-size:11px;font-weight:bold;color:#1d63d8;text-transform:uppercase;letter-spacing:1px">Credencial Digital Oficial</span>' +
      '<p style="font-size:15px;color:#0b2545;font-weight:bold;margin:4px 0 8px 0">Tu Código QR de Acceso</p>' +
      '<p style="font-size:12px;color:#64748b;margin:0 0 14px 0">Presenta este código en tu teléfono o impreso para el control de entrada a <b>Salón Principal (1)</b> y <b>Salón Alterno (2)</b></p>' +
      '<div style="display:inline-block;padding:12px;background:#ffffff;border-radius:12px;border:1px solid #cbd5e1;box-shadow:0 4px 12px rgba(0,0,0,0.06)">' +
      '<img src="' + qrImgSrc + '" alt="Código QR de Acceso ' + id + '" width="220" height="220" style="display:block;margin:auto"/>' +
      '</div>' +
      '<p style="font-family:Courier New,monospace;font-size:24px;font-weight:900;color:#1d63d8;margin:12px 0 4px 0;letter-spacing:3px">' + id + '</p>' +
      '<p style="font-size:11px;color:#64748b;margin:0"><a href="' + qrUrl + '" style="color:#1d63d8;font-weight:bold;text-decoration:underline" target="_blank">Haz clic aquí para descargar una copia del Código QR (PNG)</a></p>' +
      '</div>' +

      // Tabla de Datos
      '<table style="border-collapse:collapse;width:100%;font-size:13px;margin:20px 0;background:#ffffff;border-radius:10px;border:1px solid #e2e8f0">' +
      row_('Código de Registro', id) +
      row_('Participante', esc_(d.nombres) + ' ' + esc_(d.apellidos || '')) +
      (d.cedula ? row_('Cédula de Identidad', esc_(d.cedula)) : '') +
      row_('Institución', esc_(d.institucion || 'HCUAMP')) +
      row_('Categoría', esc_(d.tipoLabel || 'Participante')) +
      (d.detalleExtra ? row_('Detalle Académico', esc_(d.detalleExtra)) : '') +
      row_('Días Asignados', esc_(d.diasLabel || 'Según programación')) +
      row_('Turnos y Salones', esc_(d.resumenTurnos || 'Asignados en plataforma')) +
      row_('Monto', monto) +
      '</table>' +

      // Mensaje según tipo
      '<div style="background:#f0fdf4;padding:14px;border-radius:10px;font-size:12.5px;color:#166534;margin-top:16px;border-left:4px solid #16a34a">' +
      (d.total === 0
        ? '<b>Inscripción 100% Exonerada:</b> Tu participación ha sido validada. Conserva este correo con tu código QR como tu credencial oficial para el acceso a las salas de conferencias.'
        : '<b>Comprobante de Inscripción:</b> Tu comprobante y registro están procesados. Presenta este correo y tu código QR al momento de ingresar a las salas y retirar tu kit.') +
      '</div>' +

      // Aviso importante sobre acceso y orden de llegada
      '<div style="background:#fffbeb;padding:12px 14px;border-radius:10px;font-size:12px;color:#92400e;margin-top:12px;border-left:4px solid #f59e0b">' +
      '<b>Importante sobre el ingreso a sala:</b> El acceso a las conferencias se efectúa por <b>estricto orden de llegada</b> hasta completar la capacidad física de cada salón. Les recomendamos <b>llegar temprano a cada ponencia para garantizar su puesto</b>.' +
      '</div>' +

      // Sede
      '<div style="background:#f8fafc;padding:12px;border-radius:10px;font-size:12px;color:#475569;margin-top:12px;text-align:center;border:1px solid #e2e8f0">' +
      '<b>Sede:</b> Hotel Biotel Suites · Barquisimeto, Estado Lara<br>' +
      'Final de la Av. Libertador con inicio de la Av. Florencio Jiménez, frente al monumento El Obelisco.' +
      '</div>' +

      // Pie
      '<p style="color:#94a3b8;font-size:11px;margin-top:20px;border-top:1px solid #e2e8f0;padding-top:12px;text-align:center">' +
      'Comité Organizador · XIV Congreso Pineda 2026<br>' +
      'Hospital Central Universitario «Dr. Antonio María Pineda»' +
      '</p></div></div>';

    var mailOptions = {
      to: d.correo,
      subject: subject,
      htmlBody: html,
      name: CONFIG.EMAIL_SENDER_NAME
    };

    if (Object.keys(inlineImages).length > 0) {
      mailOptions.inlineImages = inlineImages;
    }

    MailApp.sendEmail(mailOptions);
    return { success: true };
  } catch (err) {
    console.warn('No se pudo enviar el correo a ' + d.correo + ': ' + err);
    return { success: false, error: err.message || String(err) };
  }
}

function resendEmailById_(id) {
  if (!id) throw new UserError_('ID de registro no especificado.');
  var sh = getSheet_();
  var data = sh.getDataRange().getValues();
  var row = null;
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      row = data[i];
      rowIndex = i + 1;
      break;
    }
  }
  if (!row) throw new UserError_('No se encontró el registro con ID ' + id);

  var d = {
    origenInstitucion: row[2],
    institucion: String(row[3] || '').toUpperCase(),
    nombres: String(row[4] || '').toUpperCase(),
    apellidos: String(row[5] || '').toUpperCase(),
    cedula: row[6],
    correo: String(row[10] || '').trim(),
    tipoLabel: String(row[11] || '').toUpperCase(),
    detalleExtra: String(row[12] || '').toUpperCase(),
    diasLabel: row[17],
    resumenTurnos: row[19],
    total: Number(row[22]) || 0
  };

  if (!d.correo || d.correo.indexOf('@') === -1) {
    throw new UserError_('El registro ' + id + ' no posee un correo electrónico válido (' + d.correo + ').');
  }

  var res = sendEmail_(d, id);
  if (!res.success) {
    throw new UserError_('Error al enviar correo a ' + d.correo + ': ' + (res.error || 'Error desconocido'));
  }

  // Registrar fecha de reenvío en Observaciones
  var currentObs = String(row[25] || '');
  var stamp = Utilities.formatDate(new Date(), 'America/Caracas', 'dd/MM/yyyy HH:mm:ss');
  var newObs = currentObs ? currentObs + ' | Reenviado ' + stamp : 'Reenviado ' + stamp;
  sh.getRange(rowIndex, 26).setValue(newObs);

  return { success: true, id: id, correo: d.correo };
}

function resendBulkEmails_(body) {
  var ids = body.ids; // Array de IDs específicos o nulo para todos
  var filter = body.filter || 'all'; // 'all', 'approved_only', 'pending_only'

  var initialQuota = -1;
  try {
    initialQuota = MailApp.getRemainingDailyQuota();
  } catch (qErr) {
    console.warn('No se pudo consultar cuota de correo:', qErr);
  }

  // Si la cuota ya está en 0 antes de iniciar, detener de inmediato
  if (initialQuota === 0) {
    return {
      success: false,
      quotaExceeded: true,
      sentCount: 0,
      totalCount: 0,
      quotaRemaining: 0,
      error: 'Se ha agotado el límite diario de correos de Google (0 envíos disponibles hoy). Google restablece automáticamente esta cuota en 24 horas.'
    };
  }

  var sh = getSheet_();
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { success: true, sentCount: 0, totalCount: 0, failed: [], quotaRemaining: initialQuota };

  var idsMap = null;
  if (ids && Array.isArray(ids) && ids.length > 0) {
    idsMap = {};
    for (var k = 0; k < ids.length; k++) {
      idsMap[String(ids[k]).trim()] = true;
    }
  }

  var sentCount = 0;
  var failed = [];
  var stoppedByQuota = false;
  var stamp = Utilities.formatDate(new Date(), 'America/Caracas', 'dd/MM/yyyy HH:mm:ss');

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var currentId = String(row[0]).trim();
    var estado = String(row[24] || '').trim();
    var correo = String(row[10] || '').trim();

    // Filtros
    if (idsMap && !idsMap[currentId]) continue;
    if (filter === 'approved_only' && estado !== 'Aprobado' && estado !== 'Exonerado') continue;
    if (filter === 'pending_only' && estado !== 'Pendiente de verificación') continue;

    if (!correo || correo.indexOf('@') === -1) {
      failed.push({ id: currentId, error: 'Correo inválido o ausente', isInvalidEmail: true });
      continue;
    }

    var d = {
      origenInstitucion: row[2],
      institucion: String(row[3] || '').toUpperCase(),
      nombres: String(row[4] || '').toUpperCase(),
      apellidos: String(row[5] || '').toUpperCase(),
      cedula: row[6],
      correo: correo,
      tipoLabel: String(row[11] || '').toUpperCase(),
      detalleExtra: String(row[12] || '').toUpperCase(),
      diasLabel: row[17],
      resumenTurnos: row[19],
      total: Number(row[22]) || 0
    };

    try {
      var res = sendEmail_(d, currentId);
      if (res.success) {
        sentCount++;
      } else {
        var errStr = String(res.error || '');
        var isQuota = errStr.indexOf('demasiadas veces') !== -1 || errStr.toLowerCase().indexOf('quota') !== -1;
        failed.push({ id: currentId, correo: correo, error: errStr, isQuota: isQuota });

        // Si se agotó la cuota de Google, detener el ciclo de inmediato
        if (isQuota) {
          stoppedByQuota = true;
          break;
        }
      }
    } catch (err) {
      var exStr = String(err && err.message ? err.message : err);
      var isQuotaEx = exStr.indexOf('demasiadas veces') !== -1 || exStr.toLowerCase().indexOf('quota') !== -1;
      failed.push({ id: currentId, correo: correo, error: exStr, isQuota: isQuotaEx });
      if (isQuotaEx) {
        stoppedByQuota = true;
        break;
      }
    }
  }

  var finalQuota = initialQuota;
  try {
    finalQuota = MailApp.getRemainingDailyQuota();
  } catch (_) {}

  return {
    success: true,
    sentCount: sentCount,
    totalCount: data.length - 1,
    failed: failed,
    stoppedByQuota: stoppedByQuota,
    quotaRemaining: finalQuota
  };
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
      dias: r[17],
      numDias: r[18],
      turnosTexto: r[19],
      turnosJson: r[20],
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

    // Al aprobar el pago, reenviamos de inmediato el correo oficial con su código QR
    try {
      resendEmailById_(id);
    } catch (mailErr) {
      console.warn('Error al enviar correo de aprobación:', mailErr);
    }

    return { success: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

var ASISTENCIAS_HEADERS = [
  'ID',
  'Cédula',
  'Nombres y Apellidos',
  'Tipo Participante',
  'Salón Key',
  'Salón Nombre',
  'Jornada',
  'Turno Key',
  'Turno Horario',
  'Validador',
  'Fecha y Hora',
  'Institución'
];

function getAsistenciasSheet_(ss) {
  var sh = ss.getSheetByName('Asistencias');
  if (!sh) {
    sh = ss.insertSheet('Asistencias');
    sh.getRange(1, 1, 1, ASISTENCIAS_HEADERS.length).setValues([ASISTENCIAS_HEADERS])
      .setFontWeight('bold').setBackground('#0b2545').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('B:B').setNumberFormat('@'); // Cédula como texto
    sh.getRange('G:G').setNumberFormat('@'); // Jornada como texto
  } else {
    try {
      var currentCols = sh.getLastColumn();
      if (currentCols > 0 && currentCols < ASISTENCIAS_HEADERS.length) {
        sh.getRange(1, 1, 1, ASISTENCIAS_HEADERS.length).setValues([ASISTENCIAS_HEADERS])
          .setFontWeight('bold').setBackground('#0b2545').setFontColor('#ffffff');
      }
    } catch (_) {}
  }
  return sh;
}

function getAsistenciasColumnMap_(shAsist) {
  var map = {
    id: 0,
    cedula: 1,
    nombre: 2,
    tipo: 3,
    salonKey: 4,
    salonNombre: 5,
    jornada: 6,
    turnoKey: 7,
    turnoHorario: 8,
    validador: 9,
    fechaHora: 10,
    institucion: 11
  };
  if (!shAsist || shAsist.getLastRow() < 1) return map;

  var lastCol = Math.max(shAsist.getLastColumn(), 1);
  var headerRow = shAsist.getRange(1, 1, 1, lastCol).getValues()[0];

  for (var c = 0; c < headerRow.length; c++) {
    var h = String(headerRow[c] || '').toLowerCase().trim();
    if (h === 'id' || h === 'código' || h === 'codigo') map.id = c;
    else if (h.indexOf('cédula') !== -1 || h.indexOf('cedula') !== -1 || h === 'ci') map.cedula = c;
    else if (h.indexOf('nombre') !== -1 || h.indexOf('participante') !== -1) map.nombre = c;
    else if (h.indexOf('tipo') !== -1 || h.indexOf('categoría') !== -1 || h.indexOf('categoria') !== -1) map.tipo = c;
    else if (h.indexOf('salón key') !== -1 || h.indexOf('salon key') !== -1 || h === 'salon_key') map.salonKey = c;
    else if (h.indexOf('salón') !== -1 || h.indexOf('salon') !== -1) map.salonNombre = c;
    else if (h.indexOf('jornada') !== -1 || (h.indexOf('fecha') !== -1 && h.indexOf('hora') === -1)) map.jornada = c;
    else if (h.indexOf('turno key') !== -1 || h.indexOf('turno_key') !== -1) map.turnoKey = c;
    else if (h.indexOf('horario') !== -1) map.turnoHorario = c;
    else if (h.indexOf('turno') !== -1 && h.indexOf('key') === -1) map.turnoKey = c;
    else if (h.indexOf('validador') !== -1 || h.indexOf('scanner') !== -1 || h.indexOf('usuario') !== -1) map.validador = c;
    else if (h.indexOf('hora') !== -1 || h.indexOf('fecha y hora') !== -1 || h.indexOf('timestamp') !== -1) map.fechaHora = c;
    else if (h.indexOf('institución') !== -1 || h.indexOf('institucion') !== -1 || h.indexOf('origen') !== -1) map.institucion = c;
  }
  return map;
}

function normalizeJornada_(val) {
  if (!val && val !== 0) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'America/Caracas', 'yyyy-MM-dd');
  }
  var str = String(val).trim();
  if (!str) return '';

  var dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    var d = ('0' + dmy[1]).slice(-2);
    var m = ('0' + dmy[2]).slice(-2);
    var y = dmy[3];
    return y + '-' + m + '-' + d;
  }

  var ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    var y2 = ymd[1];
    var m2 = ('0' + ymd[2]).slice(-2);
    var d2 = ('0' + ymd[3]).slice(-2);
    return y2 + '-' + m2 + '-' + d2;
  }

  var dObj = new Date(str);
  if (!isNaN(dObj.getTime()) && str.length > 12) {
    try {
      return Utilities.formatDate(dObj, 'America/Caracas', 'yyyy-MM-dd');
    } catch (_) {}
  }

  return str;
}

function parseSalonKey_(salon) {
  var str = String(salon || '').toLowerCase().trim();
  if (str.indexOf('alterno') !== -1 || str.indexOf('2') !== -1) {
    return { key: 'alterno', name: 'Salón Alterno (2)', capacity: 60 };
  }
  return { key: 'principal', name: 'Salón Principal (1)', capacity: 240 };
}

function parseTurnoKey_(turno) {
  var str = String(turno || '').toLowerCase().trim();
  if (str.indexOf('tarde') !== -1 || str.indexOf('13') !== -1 || str.indexOf('18') !== -1) {
    return { key: 'tarde', name: 'Tarde', horario: '13:00 a 18:00', fullLabel: 'Tarde (13:00 a 18:00)' };
  }
  return { key: 'manana', name: 'Mañana', horario: '08:00 a 12:45', fullLabel: 'Mañana (08:00 a 12:45)' };
}

function parseParticipantQuery_(raw) {
  var str = String(raw || '').trim();
  if (!str) return { isId: false, value: '', digits: '' };

  if (str.indexOf('http://') === 0 || str.indexOf('https://') === 0) {
    var idParam = str.match(/[?&](?:id|code)=([^&#]+)/i);
    if (idParam) return { isId: true, value: decodeURIComponent(idParam[1]).trim().toUpperCase(), digits: '' };
    var cedParam = str.match(/[?&](?:cedula|ci)=([^&#]+)/i);
    if (cedParam) return { isId: false, value: '', digits: decodeURIComponent(cedParam[1]).replace(/\D/g, '') };
  }

  var cpMatch = str.match(/CP\d{2}-[\w\d]+/i);
  if (cpMatch) {
    return { isId: true, value: cpMatch[0].toUpperCase(), digits: '' };
  }

  if (str.charAt(0) === '{' && str.charAt(str.length - 1) === '}') {
    try {
      var j = JSON.parse(str);
      if (j.id) return { isId: true, value: String(j.id).trim().toUpperCase(), digits: '' };
      if (j.cedula) return { isId: false, value: '', digits: String(j.cedula).replace(/\D/g, '') };
    } catch (_) {}
  }

  var cleanDigits = str.replace(/^[veVE][\-\.\s]?/, '').replace(/\D/g, '');
  var allDigits = str.replace(/\D/g, '');
  if (cleanDigits.length >= 5 && /^[veVE]?[\-\.\s]?\d[\d\.\s]*$/.test(str)) {
    return { isId: false, value: str.toUpperCase(), digits: cleanDigits };
  }
  if (allDigits.length >= 5 && !/[a-zA-Z]{2,}/.test(str)) {
    return { isId: false, value: str.toUpperCase(), digits: allDigits };
  }

  return { isId: true, value: str.toUpperCase(), digits: allDigits };
}

function computeAlert_(salonKey, occupancy, remaining) {
  if (salonKey === 'principal') {
    if (occupancy >= 240) {
      return { level: 'max', threshold: 240, text: 'Aforo Máximo Completado (240 puestos). Salón lleno.' };
    }
    if (occupancy >= 220) {
      return { level: 'danger', threshold: 220, text: 'Alerta Crítica: 220 puestos completados. Solo quedan ' + remaining + ' puestos disponibles en Salón Principal (1).' };
    }
    if (occupancy >= 200) {
      return { level: 'warning', threshold: 200, text: 'Alerta de Aforo: 200 puestos completados en Salón Principal (1). Quedan ' + remaining + ' puestos disponibles.' };
    }
    if (occupancy >= 180) {
      return { level: 'warning', threshold: 180, text: 'Alerta de Aforo: 180 puestos completados en Salón Principal (1). Quedan ' + remaining + ' puestos disponibles.' };
    }
    if (occupancy >= 160) {
      return { level: 'info', threshold: 160, text: 'Alerta de Aforo: 160 puestos completados en Salón Principal (1). Quedan ' + remaining + ' puestos disponibles.' };
    }
  } else {
    if (occupancy >= 60) {
      return { level: 'max', threshold: 60, text: 'Aforo Máximo Completado (60 puestos). Salón lleno.' };
    }
    if (occupancy >= 50) {
      return { level: 'danger', threshold: 50, text: 'Alerta Crítica: 50 puestos completados. Solo quedan ' + remaining + ' puestos disponibles en Salón Alterno (2).' };
    }
    if (occupancy >= 45) {
      return { level: 'warning', threshold: 45, text: 'Alerta de Aforo: 45 puestos completados en Salón Alterno (2). Quedan ' + remaining + ' puestos disponibles.' };
    }
    if (occupancy >= 40) {
      return { level: 'warning', threshold: 40, text: 'Alerta de Aforo: 40 puestos completados en Salón Alterno (2). Quedan ' + remaining + ' puestos disponibles.' };
    }
    if (occupancy >= 35) {
      return { level: 'info', threshold: 35, text: 'Alerta de Aforo: 35 puestos completados en Salón Alterno (2). Quedan ' + remaining + ' puestos disponibles.' };
    }
  }
  return null;
}

function getOccupancy_(jornada, turno, salon) {
  var salonMeta = parseSalonKey_(salon);
  var turnoMeta = parseTurnoKey_(turno);
  var targetJornada = normalizeJornada_(jornada || '2026-11-02');

  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var shAsist = getAsistenciasSheet_(ss);
  if (!shAsist || shAsist.getLastRow() < 2) {
    return {
      salonKey: salonMeta.key,
      salonName: salonMeta.name,
      capacity: salonMeta.capacity,
      turnoKey: turnoMeta.key,
      turnoLabel: turnoMeta.fullLabel,
      jornada: targetJornada,
      occupancy: 0,
      remaining: salonMeta.capacity,
      alert: null
    };
  }

  var colMap = getAsistenciasColumnMap_(shAsist);
  var data = shAsist.getDataRange().getValues();

  var count = 0;
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var rId = String(r[colMap.id] || '').trim();
    var rCed = String(r[colMap.cedula] || '').trim();
    if (!rId && !rCed) continue;

    var rSalonKey = parseSalonKey_(r[colMap.salonKey] || r[colMap.salonNombre]).key;
    var rJornada = normalizeJornada_(r[colMap.jornada]);
    var rTurnoKey = parseTurnoKey_(r[colMap.turnoKey]).key;

    if (rJornada === targetJornada && rTurnoKey === turnoMeta.key && rSalonKey === salonMeta.key) {
      count++;
    }
  }

  var remaining = Math.max(0, salonMeta.capacity - count);
  var alert = computeAlert_(salonMeta.key, count, remaining);

  return {
    salonKey: salonMeta.key,
    salonName: salonMeta.name,
    capacity: salonMeta.capacity,
    turnoKey: turnoMeta.key,
    turnoLabel: turnoMeta.fullLabel,
    jornada: targetJornada,
    occupancy: count,
    remaining: remaining,
    alert: alert
  };
}

function arSalonVal_(r) {
  return r[4] ? r[4] : (r[4] === 0 ? 'principal' : (String(r[5] || '').indexOf('2') !== -1 ? 'alterno' : 'principal'));
}

function validateAccess_(body) {
  var rawQuery = String(body.query || body.id || body.cedula || '').trim();
  if (!rawQuery) throw new UserError_('Por favor ingresa un número de cédula o escanea el código QR.');

  var parsedQuery = parseParticipantQuery_(rawQuery);
  var salonMeta = parseSalonKey_(body.salon);
  var turnoMeta = parseTurnoKey_(body.turno);
  var targetJornada = normalizeJornada_(body.jornada || '2026-11-02');
  var validador = String(body.user || 'Validador').trim();
  var force = !!body.force;

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var shInsc = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!shInsc || shInsc.getLastRow() < 2) {
      throw new UserError_('La base de datos de inscripciones no está disponible.');
    }

    var numCols = Math.min(shInsc.getLastColumn(), 26);
    var inscData = shInsc.getRange(2, 1, shInsc.getLastRow() - 1, numCols).getValues();

    var found = null;
    var cleanFoundCed = '';

    for (var i = 0; i < inscData.length; i++) {
      var r = inscData[i];
      var rId = String(r[0] || '').trim().toUpperCase();
      var rCedRaw = String(r[6] || '').trim();
      var rCedDigits = rCedRaw.replace(/\D/g, '');

      var isMatch = false;
      if (parsedQuery.isId && parsedQuery.value) {
        if (rId === parsedQuery.value) isMatch = true;
      } else if (parsedQuery.digits && parsedQuery.digits.length >= 5) {
        if (rCedDigits === parsedQuery.digits) isMatch = true;
      } else {
        if (rId === rawQuery.toUpperCase() || (rCedDigits && rCedDigits === rawQuery.replace(/\D/g, ''))) {
          isMatch = true;
        }
      }

      if (isMatch) {
        found = r;
        cleanFoundCed = rCedRaw;
        break;
      }
    }

    if (!found) {
      throw new UserError_('No se encontró ningún participante con la cédula o código "' + rawQuery + '".');
    }

    var participantId = String(found[0]).trim();
    var nombres = String(found[4] || '').trim();
    var apellidos = String(found[5] || '').trim();
    var tipoLabel = String(found[11] || '').trim();
    var institucion = String(found[3] || '').trim();
    var estadoPago = String(found[24] || '').trim();
    var turnosJsonStr = String(found[20] || '{}');

    var turnosJson = {};
    try { turnosJson = JSON.parse(turnosJsonStr); } catch (e) {}

    // 1. Verificar si ya fue escaneado/ingresado en este mismo turno y salón
    var shAsist = getAsistenciasSheet_(ss);
    var colMap = getAsistenciasColumnMap_(shAsist);
    var asistData = shAsist.getDataRange().getValues();
    var alreadyCheckedIn = null;
    var currentOccupancy = 0;
    var cleanFoundCedDigits = cleanFoundCed.replace(/\D/g, '');

    for (var a = 1; a < asistData.length; a++) {
      var ar = asistData[a];
      var aId = String(ar[colMap.id] || '').trim().toUpperCase();
      var aCedDigits = String(ar[colMap.cedula] || '').replace(/\D/g, '');
      var aSalonKey = parseSalonKey_(ar[colMap.salonKey] || ar[colMap.salonNombre]).key;
      var aJornada = normalizeJornada_(ar[colMap.jornada]);
      var aTurnoKey = parseTurnoKey_(ar[colMap.turnoKey]).key;

      // Contar aforo
      if (aJornada === targetJornada && aTurnoKey === turnoMeta.key && aSalonKey === salonMeta.key) {
        currentOccupancy++;
      }

      // Comprobar si ya ingresó
      var isSamePerson = (aId === participantId.toUpperCase()) || (cleanFoundCedDigits && cleanFoundCedDigits === aCedDigits);
      if (isSamePerson && aJornada === targetJornada && aTurnoKey === turnoMeta.key && aSalonKey === salonMeta.key) {
        var horaVal = ar[colMap.fechaHora];
        alreadyCheckedIn = {
          hora: horaVal instanceof Date
            ? Utilities.formatDate(horaVal, 'America/Caracas', 'HH:mm:ss')
            : String(horaVal || ''),
          validador: String(ar[colMap.validador] || 'Validador')
        };
      }
    }

    // Si ya ingresó y no se está forzando
    if (alreadyCheckedIn && !force) {
      var remainingNow = Math.max(0, salonMeta.capacity - currentOccupancy);
      return {
        success: false,
        warning: true,
        alreadyScanned: true,
        message: '¡Atención! Este participante ya registró su ingreso a las ' + alreadyCheckedIn.hora + ' con ' + alreadyCheckedIn.validador + '.',
        id: participantId,
        cedula: cleanFoundCed,
        nombres: nombres + ' ' + apellidos,
        tipo: tipoLabel,
        institucion: institucion,
        salon: salonMeta.name,
        jornada: targetJornada,
        turno: turnoMeta.fullLabel,
        occupancy: currentOccupancy,
        capacity: salonMeta.capacity,
        remaining: remainingNow,
        alert: computeAlert_(salonMeta.key, currentOccupancy, remainingNow)
      };
    }

    // 2. Verificar programación del participante para este día y turno
    var turnosDia = turnosJson[targetJornada] || null;
    var assignedSalonForTurno = turnosDia ? turnosDia[turnoMeta.key] : null;

    if (!force) {
      if (!turnosDia) {
        return {
          success: false,
          warning: true,
          mismatch: true,
          message: 'El participante no tiene programada asistencia para la fecha ' + targetJornada + '.',
          id: participantId,
          cedula: cleanFoundCed,
          nombres: nombres + ' ' + apellidos,
          tipo: tipoLabel,
          institucion: institucion,
          programacion: String(found[19] || 'Sin turnos registrados'),
          salon: salonMeta.name,
          jornada: targetJornada,
          turno: turnoMeta.fullLabel
        };
      }

      if (assignedSalonForTurno !== salonMeta.key) {
        var nombreAsignado = assignedSalonForTurno === 'principal'
          ? 'Salón Principal (1)'
          : assignedSalonForTurno === 'alterno'
            ? 'Salón Alterno (2)'
            : 'Ningún salón programado en este turno';

        return {
          success: false,
          warning: true,
          mismatch: true,
          message: 'El participante tiene asignado "' + nombreAsignado + '" en este turno (' + turnoMeta.name + '), no el ' + salonMeta.name + '.',
          id: participantId,
          cedula: cleanFoundCed,
          nombres: nombres + ' ' + apellidos,
          tipo: tipoLabel,
          institucion: institucion,
          assignedSalon: nombreAsignado,
          currentSalon: salonMeta.name,
          programacion: String(found[19] || ''),
          salon: salonMeta.name,
          jornada: targetJornada,
          turno: turnoMeta.fullLabel
        };
      }

      // Comprobar estado de pago si no es exonerado
      if (estadoPago === 'Pendiente de verificación') {
        return {
          success: false,
          warning: true,
          paymentPending: true,
          message: 'El pago del participante está "Pendiente de verificación". Por favor verifica su comprobante bancario antes de autorizar.',
          id: participantId,
          cedula: cleanFoundCed,
          nombres: nombres + ' ' + apellidos,
          tipo: tipoLabel,
          institucion: institucion,
          salon: salonMeta.name,
          jornada: targetJornada,
          turno: turnoMeta.fullLabel
        };
      }
    }

    // 3. Comprobar aforo máximo antes de admitir
    if (currentOccupancy >= salonMeta.capacity && !force) {
      throw new UserError_('El ' + salonMeta.name + ' ha alcanzado su aforo máximo (' + salonMeta.capacity + ' personas). No se pueden admitir más ingresos.');
    }

    // 4. Registrar asistencia en la hoja 'Asistencias'
    var now = new Date();
    shAsist.appendRow([
      participantId,
      cleanFoundCed,
      nombres + ' ' + apellidos,
      tipoLabel,
      salonMeta.key,
      salonMeta.name,
      targetJornada,
      turnoMeta.key,
      turnoMeta.horario,
      validador,
      now,
      institucion
    ]);
    var lastRow = shAsist.getLastRow();
    shAsist.getRange(lastRow, 11).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    shAsist.getRange(lastRow, 2).setNumberFormat('@');
    shAsist.getRange(lastRow, 7).setNumberFormat('@');

    var newOccupancy = currentOccupancy + 1;
    var newRemaining = Math.max(0, salonMeta.capacity - newOccupancy);
    var alertObj = computeAlert_(salonMeta.key, newOccupancy, newRemaining);

    return {
      success: true,
      id: participantId,
      cedula: cleanFoundCed,
      nombres: nombres + ' ' + apellidos,
      tipo: tipoLabel,
      institucion: institucion,
      salon: salonMeta.name,
      jornada: targetJornada,
      turno: turnoMeta.fullLabel,
      occupancy: newOccupancy,
      capacity: salonMeta.capacity,
      remaining: newRemaining,
      alert: alertObj,
      horaValidacion: Utilities.formatDate(now, 'America/Caracas', 'HH:mm:ss')
    };
  } finally {
    lock.releaseLock();
  }
}

// Alias para retrocompatibilidad
function scanQr_(body) {
  return validateAccess_(body);
}

/**
 * Retorna el listado de personas asistentes validadas por scanner,
 * con soporte para filtrar por jornada, turno y salón.
 */
function getAsistenciasList_(jornada, turno, salon) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var shAsist = getAsistenciasSheet_(ss);
  if (!shAsist || shAsist.getLastRow() < 2) {
    return [];
  }
  var colMap = getAsistenciasColumnMap_(shAsist);
  var data = shAsist.getDataRange().getValues();
  var results = [];

  var filterJornada = (jornada && jornada !== 'all' && jornada !== 'todas') ? normalizeJornada_(jornada) : null;
  var filterTurno = (turno && turno !== 'all' && turno !== 'todos') ? parseTurnoKey_(turno).key : null;
  var filterSalon = (salon && salon !== 'all' && salon !== 'todos') ? parseSalonKey_(salon).key : null;

  // Mapa auxiliar de ID -> Institución desde Inscripciones si la fila de Asistencias no la tuviese
  var institucionMap = {};
  try {
    var shInsc = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (shInsc && shInsc.getLastRow() >= 2) {
      var inscRows = shInsc.getRange(2, 1, shInsc.getLastRow() - 1, 4).getValues();
      for (var k = 0; k < inscRows.length; k++) {
        var kId = String(inscRows[k][0] || '').trim().toUpperCase();
        var kInst = String(inscRows[k][3] || '').trim();
        if (kId && kInst) institucionMap[kId] = kInst;
      }
    }
  } catch (_) {}

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var rId = String(r[colMap.id] || '').trim();
    if (!rId) continue;
    var rCedula = String(r[colMap.cedula] || '').trim();
    var rNombre = String(r[colMap.nombre] || '').trim();
    var rTipo = String(r[colMap.tipo] || '').trim();
    var rSalonKey = parseSalonKey_(r[colMap.salonKey] || r[colMap.salonNombre]).key;
    var rSalonNombre = rSalonKey === 'alterno' ? 'Salón Alterno (2)' : 'Salón Principal (1)';
    var rJornada = normalizeJornada_(r[colMap.jornada]);
    var rTurnoMeta = parseTurnoKey_(r[colMap.turnoKey]);
    var rTurnoKey = rTurnoMeta.key;
    var rTurnoHorario = String(r[colMap.turnoHorario] || rTurnoMeta.horario).trim();
    var rValidador = String(r[colMap.validador] || '').trim();
    
    var rawFechaHora = r[colMap.fechaHora];
    var rFechaHora = rawFechaHora instanceof Date
      ? Utilities.formatDate(rawFechaHora, 'America/Caracas', 'yyyy-MM-dd HH:mm:ss')
      : String(rawFechaHora || '');

    var rInstitucion = (colMap.institucion !== undefined && r[colMap.institucion])
      ? String(r[colMap.institucion]).trim()
      : (institucionMap[rId.toUpperCase()] || '');

    if (filterJornada && rJornada !== filterJornada) continue;
    if (filterTurno && rTurnoKey !== filterTurno) continue;
    if (filterSalon && rSalonKey !== filterSalon) continue;

    results.push({
      id: rId,
      cedula: rCedula,
      nombre: rNombre,
      tipo: rTipo,
      institucion: rInstitucion,
      salonKey: rSalonKey,
      salonNombre: rSalonNombre,
      jornada: rJornada,
      turnoKey: rTurnoKey,
      turnoHorario: rTurnoHorario,
      validador: rValidador,
      fechaHora: rFechaHora
    });
  }

  return results;
}

// ───────────────────────────── CONFIRMACIÓN BACHILLERES ─────────────────────────────

/**
 * Busca por cédula en la hoja "Bachilleres - Estudiantes de Pregrado" (o "Inscripciones").
 * Interpreta tanto formato numérico puro (31930086) como formatos con prefijo (V-31930086, E-...), con puntos o espacios.
 */
function lookupBachiller_(rawCedula, preferredSheetName) {
  if (!rawCedula) return { ok: false, error: 'Cédula no proporcionada.' };
  var cleanDigits = String(rawCedula).replace(/\D/g, '');
  if (!cleanDigits) return { ok: false, error: 'Cédula inválida.' };

  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // 1. Buscar la hoja de Bachilleres
  var targetName = preferredSheetName || 'Bachilleres - Estudiantes de Pregrado';
  var sh = ss.getSheetByName(targetName);
  if (!sh) {
    try { sh = ss.getSheetByName(decodeURIComponent(targetName)); } catch (_) {}
  }
  if (!sh) {
    var all = ss.getSheets();
    for (var i = 0; i < all.length; i++) {
      var n = all[i].getName().trim().toLowerCase();
      if (n.indexOf('bachiller') !== -1) { sh = all[i]; break; }
    }
  }

  // Si no existe hoja separada, buscar en la hoja general de Inscripciones
  var isGeneralSheet = false;
  if (!sh) {
    sh = ss.getSheetByName(CONFIG.SHEET_NAME);
    isGeneralSheet = true;
  }
  if (!sh) return { ok: false, error: 'Hoja de datos no disponible.' };

  var data = sh.getDataRange().getValues();
  if (data.length < 2) return { ok: true, found: false };

  var headers = data[0].map(function (h) { return String(h || '').trim().toUpperCase(); });

  var colCedula = -1, colNombres = -1, colApellidos = -1, colNombreCompleto = -1;
  var colCorreo = -1, colTelefono = -1, colTipo = -1;
  var colTurnosJson = -1, colTurnosTexto = -1, colDias = -1;
  var colConfirmado = -1, colDiaDef = -1, colTurnoDef = -1, colSalonDef = -1;

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
    } else if (h.indexOf('CORREO') !== -1 || h.indexOf('EMAIL') !== -1) {
      if (colCorreo === -1) colCorreo = c;
    } else if (h.indexOf('TELÉFONO') !== -1 || h.indexOf('TELEFONO') !== -1 || h.indexOf('TLF') !== -1 || h.indexOf('CELULAR') !== -1) {
      if (colTelefono === -1) colTelefono = c;
    } else if (h.indexOf('TIPO') !== -1) {
      if (colTipo === -1) colTipo = c;
    } else if (h.indexOf('TURNOS (JSON)') !== -1 || h.indexOf('JSON') !== -1) {
      if (colTurnosJson === -1) colTurnosJson = c;
    } else if (h.indexOf('TURNOS Y SALONES') !== -1 || h.indexOf('TURNOS') !== -1) {
      if (colTurnosTexto === -1) colTurnosTexto = c;
    } else if (h.indexOf('DÍAS') !== -1 || h.indexOf('DIAS') !== -1) {
      if (colDias === -1) colDias = c;
    } else if (h.indexOf('CONFIRMA') !== -1 || h.indexOf('ESTADO') !== -1) {
      if (colConfirmado === -1) colConfirmado = c;
    } else if (h.indexOf('DÍA DEFINITIVO') !== -1 || h.indexOf('DIA DEFINITIVO') !== -1) {
      if (colDiaDef === -1) colDiaDef = c;
    } else if (h.indexOf('TURNO DEFINITIVO') !== -1) {
      if (colTurnoDef === -1) colTurnoDef = c;
    } else if (h.indexOf('SALÓN DEFINITIVO') !== -1 || h.indexOf('SALON DEFINITIVO') !== -1) {
      if (colSalonDef === -1) colSalonDef = c;
    }
  }

  if (colCedula === -1) colCedula = isGeneralSheet ? 6 : 0;

  var DIAS_META = {
    '2026-11-02': { label: 'Lunes 02/11/2026', short: 'Lun 02/11' },
    '2026-11-03': { label: 'Martes 03/11/2026', short: 'Mar 03/11' },
    '2026-11-04': { label: 'Miércoles 04/11/2026', short: 'Mié 04/11' },
    '2026-11-05': { label: 'Jueves 05/11/2026', short: 'Jue 05/11' },
    '2026-11-06': { label: 'Viernes 06/11/2026', short: 'Vie 06/11' }
  };

  for (var r = 1; r < data.length; r++) {
    var cellVal = String(data[r][colCedula] || '').trim();
    var cellDigits = cellVal.replace(/\D/g, '');

    var isMatch = (cellDigits && cellDigits === cleanDigits) ||
                  (cellVal.toUpperCase() === String(rawCedula).trim().toUpperCase()) ||
                  (cellVal.toUpperCase() === ('V-' + cleanDigits)) ||
                  (cellVal.toUpperCase() === ('E-' + cleanDigits));

    if (isMatch) {
      var row = data[r];
      var nombres = '';
      var apellidos = '';

      if (colNombreCompleto !== -1 && row[colNombreCompleto]) {
        var full = String(row[colNombreCompleto]).trim();
        var words = full.split(/\s+/);
        if (words.length >= 2) {
          nombres = words.slice(0, words.length - 1).join(' ');
          apellidos = words[words.length - 1];
        } else {
          nombres = full;
        }
      } else {
        if (colNombres !== -1 && row[colNombres]) nombres = String(row[colNombres]).trim();
        if (colApellidos !== -1 && row[colApellidos]) apellidos = String(row[colApellidos]).trim();
      }

      var correo = colCorreo !== -1 && row[colCorreo] ? String(row[colCorreo]).trim() : '';
      var telefono = colTelefono !== -1 && row[colTelefono] ? String(row[colTelefono]).trim() : '';
      var tipo = colTipo !== -1 && row[colTipo] ? String(row[colTipo]).trim() : 'BACHILLER / ESTUDIANTE DE PREGRADO';

      // Parsear turnos pre-inscritos
      var turnosList = [];
      var seenMap = {};
      var rawJson = colTurnosJson !== -1 ? row[colTurnosJson] : null;

      if (rawJson) {
        try {
          var parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
          for (var diaId in parsed) {
            var diaObj = DIAS_META[diaId] || { label: diaId, short: diaId };
            var dInfo = parsed[diaId];
            if (dInfo.manana) {
              var km = diaId + '_m_' + dInfo.manana;
              if (!seenMap[km]) {
                seenMap[km] = true;
                turnosList.push({
                  diaId: diaId,
                  diaLabel: diaObj.label,
                  turno: 'manana',
                  turnoLabel: 'Mañana (08:00 – 12:45)',
                  salon: dInfo.manana === 'alterno' ? 'alterno' : 'principal',
                  salonLabel: dInfo.manana === 'alterno' ? 'Salón Alterno (2)' : 'Salón Principal (1)'
                });
              }
            }
            if (dInfo.tarde) {
              var kt = diaId + '_t_' + dInfo.tarde;
              if (!seenMap[kt]) {
                seenMap[kt] = true;
                turnosList.push({
                  diaId: diaId,
                  diaLabel: diaObj.label,
                  turno: 'tarde',
                  turnoLabel: 'Tarde (13:00 – 18:00)',
                  salon: dInfo.tarde === 'alterno' ? 'alterno' : 'principal',
                  salonLabel: dInfo.tarde === 'alterno' ? 'Salón Alterno (2)' : 'Salón Principal (1)'
                });
              }
            }
          }
        } catch (_) {}
      }

      // Si no hay en JSON, revisar texto descriptivo
      if (turnosList.length === 0 && colTurnosTexto !== -1 && row[colTurnosTexto]) {
        var txt = String(row[colTurnosTexto]).toLowerCase();
        for (var dKey in DIAS_META) {
          var dMeta = DIAS_META[dKey];
          var subD = dMeta.short.toLowerCase().substring(0, 3);
          var numD = dKey.substring(8);
          if (txt.indexOf(subD) !== -1 || txt.indexOf(numD + '/11') !== -1 || txt.indexOf(dKey) !== -1) {
            var hasMan = txt.indexOf('mañana') !== -1 || txt.indexOf('manana') !== -1;
            var hasTar = txt.indexOf('tarde') !== -1;
            var isAlt = txt.indexOf('alterno') !== -1 || txt.indexOf('(2)') !== -1;
            var sal = isAlt ? 'alterno' : 'principal';
            var salLab = isAlt ? 'Salón Alterno (2)' : 'Salón Principal (1)';

            if (dKey === '2026-11-02') {
              turnosList.push({ diaId: dKey, diaLabel: dMeta.label, turno: 'tarde', turnoLabel: 'Tarde (13:00 – 18:00)', salon: sal, salonLabel: salLab });
            } else {
              if (hasMan) turnosList.push({ diaId: dKey, diaLabel: dMeta.label, turno: 'manana', turnoLabel: 'Mañana (08:00 – 12:45)', salon: sal, salonLabel: salLab });
              if (hasTar || !hasMan) turnosList.push({ diaId: dKey, diaLabel: dMeta.label, turno: 'tarde', turnoLabel: 'Tarde (13:00 – 18:00)', salon: sal, salonLabel: salLab });
            }
          }
        }
      }

      var yaConf = false;
      var confObj = null;
      if (colConfirmado !== -1 && row[colConfirmado]) {
        var cVal = String(row[colConfirmado]).toUpperCase();
        if (cVal.indexOf('CONFIRM') !== -1) {
          yaConf = true;
          if (colDiaDef !== -1 && row[colDiaDef]) {
            var dDef = String(row[colDiaDef]);
            var tDef = colTurnoDef !== -1 ? String(row[colTurnoDef] || '') : '';
            var sDef = colSalonDef !== -1 ? String(row[colSalonDef] || '') : '';
            confObj = {
              diaId: dDef,
              diaLabel: (DIAS_META[dDef] ? DIAS_META[dDef].label : dDef),
              turno: tDef.toLowerCase().indexOf('mañana') !== -1 ? 'manana' : 'tarde',
              turnoLabel: tDef || 'Tarde',
              salon: sDef.toLowerCase().indexOf('alterno') !== -1 ? 'alterno' : 'principal',
              salonLabel: sDef || 'Salón Principal (1)'
            };
          }
        }
      }

      return {
        ok: true,
        found: true,
        participant: {
          nombres: nombres.toUpperCase(),
          apellidos: apellidos.toUpperCase(),
          cedula: cellVal || ('V-' + cleanDigits),
          correo: correo,
          telefono: telefono,
          tipoParticipante: tipo,
          tipoLabel: tipo,
          turnosPreinscritos: turnosList,
          yaConfirmado: yaConf,
          confirmacion: confObj
        }
      };
    }
  }

  return { ok: true, found: false };
}

/**
 * Registra la confirmación definitiva de 1 único día, 1 único turno y 1 único salón.
 * Modifica EXCLUSIVAMENTE:
 *   1. Días asistidos
 *   2. N.º días (valor 1)
 *   3. Turnos y Salones
 *   4. Turnos (JSON)
 * Garantiza la integridad de todos los demás datos existentes (nombres, cédula, institución, sexo, etc.)
 */
function confirmBachiller_(body) {
  var rawCed = body.cedula || '';
  var cleanDigits = String(rawCed).replace(/\D/g, '');
  if (!cleanDigits) throw new UserError_('Cédula no proporcionada.');

  var diaId = body.diaId;
  var turno = body.turno;
  var salon = body.salon;

  if (!diaId || !turno || !salon) {
    throw new UserError_('Selección incompleta de día, turno o salón.');
  }

  if (diaId === '2026-11-02' && turno !== 'tarde') {
    throw new UserError_('El lunes 02/11 únicamente está disponible en el turno Tarde.');
  }

  var DIAS_META = {
    '2026-11-02': { label: 'Lunes 02/11/2026', short: 'Lun 02/11' },
    '2026-11-03': { label: 'Martes 03/11/2026', short: 'Mar 03/11' },
    '2026-11-04': { label: 'Miércoles 04/11/2026', short: 'Mié 04/11' },
    '2026-11-05': { label: 'Jueves 05/11/2026', short: 'Jue 05/11' },
    '2026-11-06': { label: 'Viernes 06/11/2026', short: 'Vie 06/11' }
  };

  var diaLabel = DIAS_META[diaId] ? DIAS_META[diaId].label : diaId;
  var diaShort = DIAS_META[diaId] ? DIAS_META[diaId].short : diaId;
  var turnoLabel = turno === 'manana' ? 'Mañana: ' + (salon === 'principal' ? 'Salón Principal (1)' : 'Salón Alterno (2)') : 'Tarde: ' + (salon === 'principal' ? 'Salón Principal (1)' : 'Salón Alterno (2)');
  var resumenTexto = diaShort + ' (' + turnoLabel + ')';

  var newJson = {};
  newJson[diaId] = {};
  newJson[diaId][turno] = salon;
  var jsonStr = JSON.stringify(newJson);

  var nowStr = Utilities.formatDate(new Date(), 'America/Caracas', 'yyyy-MM-dd HH:mm:ss');

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    // Función auxiliar para detectar con precisión las 4 columnas requeridas
    function detectCols(headers) {
      var colCed = -1, colDias = -1, colNum = -1, colTexto = -1, colJson = -1, colObs = -1;
      for (var c = 0; c < headers.length; c++) {
        var raw = String(headers[c] || '').trim();
        var hNorm = raw.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Cédula
        if (colCed === -1 && (hNorm.indexOf('CEDULA') !== -1 || hNorm === 'CI' || hNorm === 'C.I.' || hNorm.indexOf('IDENTIDAD') !== -1 || hNorm.indexOf('DOCUMENTO') !== -1)) {
          colCed = c;
        }
        // Turnos (JSON) - debe contener JSON
        if (colJson === -1 && hNorm.indexOf('JSON') !== -1) {
          colJson = c;
        }
        // Turnos y Salones - contiene TURNO o SALON y NO contiene JSON
        else if (colTexto === -1 && (hNorm.indexOf('TURNO') !== -1 || hNorm.indexOf('SALON') !== -1) && hNorm.indexOf('JSON') === -1) {
          colTexto = c;
        }
        // N.º días - contiene DIAS y especificador de cantidad/número
        if (colNum === -1 && hNorm.indexOf('DIAS') !== -1 && (hNorm.indexOf('N') !== -1 || hNorm.indexOf('NUM') !== -1 || hNorm.indexOf('CANT') !== -1 || hNorm.indexOf('CANTIDAD') !== -1)) {
          colNum = c;
        }
        // Días asistidos - contiene DIAS y no es de cantidad
        else if (colDias === -1 && hNorm.indexOf('DIAS') !== -1 && hNorm.indexOf('N') === -1 && hNorm.indexOf('NUM') === -1 && hNorm.indexOf('CANT') === -1) {
          colDias = c;
        }
        // Observaciones
        if (colObs === -1 && (hNorm.indexOf('OBSERV') !== -1 || hNorm.indexOf('NOTA') !== -1)) {
          colObs = c;
        }
      }
      return { colCed: colCed, colDias: colDias, colNum: colNum, colTexto: colTexto, colJson: colJson, colObs: colObs };
    }

    // 1. Actualizar hoja de Bachilleres (Bachilleres - Estudiantes de Pregrado)
    var shBach = ss.getSheetByName(body.sheetName || 'Bachilleres - Estudiantes de Pregrado');
    if (!shBach) {
      var all = ss.getSheets();
      for (var s = 0; s < all.length; s++) {
        var sLower = all[s].getName().trim().toLowerCase();
        if (sLower.indexOf('bachiller') !== -1 || sLower.indexOf('pregrado') !== -1) {
          shBach = all[s];
          break;
        }
      }
    }

    var updatedBach = 0;
    if (shBach && shBach.getLastRow() >= 2) {
      var bData = shBach.getDataRange().getValues();
      var bHeaders = bData[0];
      var bCols = detectCols(bHeaders);

      if (bCols.colCed === -1) bCols.colCed = 0;

      // Asegurar que las 4 columnas existan en la hoja de Bachilleres
      var numCols = bHeaders.length;
      if (bCols.colDias === -1) {
        bCols.colDias = numCols;
        shBach.getRange(1, bCols.colDias + 1).setValue('Días asistidos');
        numCols++;
      }
      if (bCols.colNum === -1) {
        bCols.colNum = numCols;
        shBach.getRange(1, bCols.colNum + 1).setValue('N.º días');
        numCols++;
      }
      if (bCols.colTexto === -1) {
        bCols.colTexto = numCols;
        shBach.getRange(1, bCols.colTexto + 1).setValue('Turnos y Salones');
        numCols++;
      }
      if (bCols.colJson === -1) {
        bCols.colJson = numCols;
        shBach.getRange(1, bCols.colJson + 1).setValue('Turnos (JSON)');
        numCols++;
      }

      for (var br = 1; br < bData.length; br++) {
        var cellValB = String(bData[br][bCols.colCed] || '').trim().toUpperCase();
        var bDigits = cellValB.replace(/\D/g, '');
        if (bDigits && (bDigits === cleanDigits || cellValB === ('V-' + cleanDigits) || cellValB === ('E-' + cleanDigits))) {
          var bRowNum = br + 1;
          // Actualización directa de las 4 columnas en la hoja Bachilleres
          shBach.getRange(bRowNum, bCols.colDias + 1).setValue(diaShort);
          shBach.getRange(bRowNum, bCols.colNum + 1).setValue(1);
          shBach.getRange(bRowNum, bCols.colTexto + 1).setValue(resumenTexto);
          shBach.getRange(bRowNum, bCols.colJson + 1).setValue(jsonStr);
          updatedBach++;

          if (bCols.colObs !== -1) {
            var prevObsB = String(bData[br][bCols.colObs] || '');
            shBach.getRange(bRowNum, bCols.colObs + 1).setValue((prevObsB ? prevObsB + ' | ' : '') + 'CONFIRMADO: ' + resumenTexto + ' (' + nowStr + ')');
          }
        }
      }
    }

    // 2. Actualizar hoja general de Inscripciones
    var shInsc = ss.getSheetByName(CONFIG.SHEET_NAME);
    var updatedInsc = 0;
    if (shInsc && shInsc.getLastRow() >= 2) {
      var iData = shInsc.getDataRange().getValues();
      var iHeaders = iData[0];
      var iCols = detectCols(iHeaders);

      if (iCols.colCed === -1) iCols.colCed = 6;
      if (iCols.colDias === -1) iCols.colDias = 17;
      if (iCols.colNum === -1) iCols.colNum = 18;
      if (iCols.colTexto === -1) iCols.colTexto = 19;
      if (iCols.colJson === -1) iCols.colJson = 20;
      if (iCols.colObs === -1) iCols.colObs = 25;

      for (var rowI = 1; rowI < iData.length; rowI++) {
        var cellValI = String(iData[rowI][iCols.colCed] || '').trim().toUpperCase();
        var rowCedDigits = cellValI.replace(/\D/g, '');
        if (rowCedDigits && (rowCedDigits === cleanDigits || cellValI === ('V-' + cleanDigits) || cellValI === ('E-' + cleanDigits))) {
          var targetRow = rowI + 1;
          // Actualización atómica de las 4 columnas sin alterar otros datos
          shInsc.getRange(targetRow, iCols.colDias + 1).setValue(diaShort);
          shInsc.getRange(targetRow, iCols.colNum + 1).setValue(1);
          shInsc.getRange(targetRow, iCols.colTexto + 1).setValue(resumenTexto);
          shInsc.getRange(targetRow, iCols.colJson + 1).setValue(jsonStr);
          updatedInsc++;

          if (iCols.colObs !== -1) {
            var prevObs = String(iData[rowI][iCols.colObs] || '');
            var newObs = (prevObs ? prevObs + ' | ' : '') + 'CONFIRMADO DEFINITIVO BACHILLER: ' + resumenTexto + ' (' + nowStr + ')';
            shInsc.getRange(targetRow, iCols.colObs + 1).setValue(newObs);
          }
        }
      }
    }

    return {
      ok: true,
      success: true,
      updatedBachilleres: updatedBach,
      updatedInscripciones: updatedInsc,
      message: 'Tu selección definitiva ha sido guardada exitosamente en la base de datos.',
      confirmacion: {
        diaLabel: diaLabel,
        turnoLabel: turno === 'manana' ? 'Mañana (08:00 – 12:45)' : 'Tarde (13:00 – 18:00)',
        salonLabel: salon === 'principal' ? 'Salón Principal (1)' : 'Salón Alterno (2)',
        fecha: nowStr
      }
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Ejecuta UNA vez desde el editor de Apps Script (▶ Ejecutar → setup)
 * para autorizar permisos y preparar automáticamente la hoja "Inscripciones"
 * y la carpeta de Drive para los comprobantes.
 */
function setup() {
  var sh = getSheet_();
  var folder = getFolder_();
  if (CONFIG.SEND_CONFIRMATION_EMAIL) MailApp.getRemainingDailyQuota();
  Logger.log('Hoja de inscripciones lista: ' + sh.getParent().getUrl());
  Logger.log('Carpeta de comprobantes en Drive: ' + folder.getUrl() + ' (ID: ' + folder.getId() + ')');
}


/**
 * Consulta y modifica el estado del formulario de registro principal.
 */
function isRegistrationFormEnabled_() {
  var prop = PropertiesService.getScriptProperties().getProperty('REGISTRATION_FORM_ENABLED');
  return prop !== 'false';
}

function setRegistrationFormEnabled_(enabled) {
  PropertiesService.getScriptProperties().setProperty('REGISTRATION_FORM_ENABLED', enabled ? 'true' : 'false');
  return { ok: true, registrationEnabled: enabled };
}


// ───────────────────────────── CONSULTA DE PARTICIPANTE ─────────────────────────────

/**
 * Consulta a un participante por Cédula, ID de comprobante o Correo.
 * Revisa la hoja general "Inscripciones" y también "Bachilleres - Estudiantes de Pregrado".
 */
function lookupParticipant_(rawQuery) {
  if (!rawQuery) return { ok: false, error: 'Término de búsqueda no proporcionado.' };
  var q = String(rawQuery).trim();
  var cleanDigits = q.replace(/\D/g, '');
  var qUpper = q.toUpperCase();
  var qLower = q.toLowerCase();

  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // 1. Buscar en la hoja "Inscripciones"
  var shInsc = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (shInsc && shInsc.getLastRow() >= 2) {
    var data = shInsc.getDataRange().getValues();
    var headers = data[0].map(function (h) { return String(h || '').trim().toUpperCase(); });

    var colId = 0, colFecha = 1, colOrigen = 2, colInstitucion = 3, colNombres = 4, colApellidos = 5;
    var colCedula = 6, colSexo = 7, colFechaNac = 8, colTelefono = 9, colCorreo = 10, colTipo = 11;
    var colDetalleExtra = 12, colDias = 17, colNumDias = 18, colTurnosTexto = 19, colTurnosJson = 20;
    var colMonto = 22, colComprobante = 23, colEstadoPago = 24;

    for (var c = 0; c < headers.length; c++) {
      var h = headers[c];
      if (h === 'ID' || h === 'CÓDIGO' || h === 'CODIGO') colId = c;
      else if (h.indexOf('CÉDULA') !== -1 || h.indexOf('CEDULA') !== -1 || h === 'C.I.' || h === 'CI') colCedula = c;
      else if (h.indexOf('CORREO') !== -1 || h.indexOf('EMAIL') !== -1) colCorreo = c;
      else if (h.indexOf('NOMBRES') !== -1 && h.indexOf('APELLIDOS') === -1) colNombres = c;
      else if (h.indexOf('APELLIDOS') !== -1 && h.indexOf('NOMBRES') === -1) colApellidos = c;
      else if (h.indexOf('TIPO') !== -1) colTipo = c;
      else if (h.indexOf('ESTADO DEL PAGO') !== -1 || h.indexOf('ESTADO') !== -1) colEstadoPago = c;
      else if (h.indexOf('TURNOS (JSON)') !== -1 || h.indexOf('JSON') !== -1) colTurnosJson = c;
      else if (h.indexOf('TURNOS Y SALONES') !== -1) colTurnosTexto = c;
    }

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var cellId = String(row[colId] || '').trim().toUpperCase();
      var cellCed = String(row[colCedula] || '').trim();
      var cellDigits = cellCed.replace(/\D/g, '');
      var cellEmail = String(row[colCorreo] || '').trim().toLowerCase();

      var match = false;
      if (cellId && cellId === qUpper) match = true;
      else if (cleanDigits && cellDigits && cleanDigits === cellDigits) match = true;
      else if (qLower && cellEmail && qLower === cellEmail) match = true;

      if (match) {
        var estado = String(row[colEstadoPago] || 'Aprobado').trim();
        var isHcuamp = String(row[colOrigen] || '').toUpperCase() === 'HCUAMP';
        var isExonerated = isHcuamp || Number(row[colMonto] || 0) === 0 || estado.toLowerCase().indexOf('exoner') !== -1;

        return {
          ok: true,
          found: true,
          source: 'Inscripciones',
          participant: {
            id: cellId || 'CP26-' + (i < 10 ? '000' : i < 100 ? '00' : i < 1000 ? '0' : '') + i,
            fecha: row[colFecha] ? Utilities.formatDate(new Date(row[colFecha]), 'America/Caracas', 'dd/MM/yyyy HH:mm') : '',
            origen: isHcuamp ? 'HCUAMP' : 'OTRA',
            institucion: String(row[colInstitucion] || (isHcuamp ? 'HOSPITAL CENTRAL UNIVERSITARIO DR. ANTONIO MARÍA PINEDA (HCUAMP)' : 'OTRA INSTITUCIÓN')).toUpperCase(),
            nombres: String(row[colNombres] || '').toUpperCase(),
            apellidos: String(row[colApellidos] || '').toUpperCase(),
            cedula: cellCed,
            sexo: String(row[colSexo] || ''),
            fechaNacimiento: row[colFechaNac] instanceof Date ? Utilities.formatDate(row[colFechaNac], 'America/Caracas', 'yyyy-MM-dd') : String(row[colFechaNac] || ''),
            telefono: String(row[colTelefono] || ''),
            correo: cellEmail,
            tipo: String(row[colTipo] || '').toUpperCase(),
            tipoLabel: String(row[colTipo] || '').toUpperCase(),
            detalleExtra: String(row[colDetalleExtra] || ''),
            dias: String(row[colDias] || ''),
            numDias: row[colNumDias] || 1,
            turnosTexto: String(row[colTurnosTexto] || ''),
            turnosJson: String(row[colTurnosJson] || ''),
            monto: row[colMonto] || 0,
            comprobante: String(row[colComprobante] || ''),
            estado: estado || (isExonerated ? 'Exonerado 100%' : 'Aprobado'),
            exonerated: isExonerated
          }
        };
      }
    }
  }

  // 2. Buscar en la hoja "Bachilleres - Estudiantes de Pregrado"
  var shBach = ss.getSheetByName('Bachilleres - Estudiantes de Pregrado');
  if (shBach && shBach.getLastRow() >= 2) {
    var bachData = shBach.getDataRange().getValues();
    var bachHeaders = bachData[0].map(function (h) { return String(h || '').trim().toUpperCase(); });
    var bColCed = -1, bColNom = -1, bColAp = -1, bColFull = -1, bColMail = -1, bColTlf = -1, bColJson = -1, bColTxt = -1, bColDias = -1, bColId = -1;

    for (var bc = 0; bc < bachHeaders.length; bc++) {
      var bh = bachHeaders[bc];
      if (bh === 'ID') bColId = bc;
      else if (bh.indexOf('CÉDULA') !== -1 || bh.indexOf('CEDULA') !== -1 || bh === 'C.I.' || bh === 'CI') bColCed = bc;
      else if (bh.indexOf('APELLIDOS Y NOMBRES') !== -1 || bh.indexOf('NOMBRES Y APELLIDOS') !== -1) bColFull = bc;
      else if (bh.indexOf('NOMBRES') !== -1) bColNom = bc;
      else if (bh.indexOf('APELLIDOS') !== -1) bColAp = bc;
      else if (bh.indexOf('CORREO') !== -1 || bh.indexOf('EMAIL') !== -1) bColMail = bc;
      else if (bh.indexOf('TELÉFONO') !== -1 || bh.indexOf('TELEFONO') !== -1) bColTlf = bc;
      else if (bh.indexOf('TURNOS (JSON)') !== -1 || bh.indexOf('JSON') !== -1) bColJson = bc;
      else if (bh.indexOf('TURNOS Y SALONES') !== -1) bColTxt = bc;
      else if (bh.indexOf('DÍAS') !== -1 || bh.indexOf('DIAS') !== -1) bColDias = bc;
    }

    if (bColCed !== -1) {
      for (var bi = 1; bi < bachData.length; bi++) {
        var bRow = bachData[bi];
        var bCed = String(bRow[bColCed] || '').trim();
        var bDigits = bCed.replace(/\D/g, '');
        var bId = bColId !== -1 ? String(bRow[bColId] || '').trim().toUpperCase() : '';
        var bEmail = bColMail !== -1 ? String(bRow[bColMail] || '').trim().toLowerCase() : '';

        var bMatch = false;
        if (bId && bId === qUpper) bMatch = true;
        else if (cleanDigits && bDigits && cleanDigits === bDigits) bMatch = true;
        else if (qLower && bEmail && qLower === bEmail) bMatch = true;

        if (bMatch) {
          var bNombres = bColNom !== -1 ? String(bRow[bColNom] || '').trim() : '';
          var bApellidos = bColAp !== -1 ? String(bRow[bColAp] || '').trim() : '';
          if (!bNombres && bColFull !== -1) {
            bNombres = String(bRow[bColFull] || '').trim();
          }

          return {
            ok: true,
            found: true,
            source: 'Bachilleres',
            participant: {
              id: bId || 'CP26-BACH-' + (bi < 10 ? '00' : bi < 100 ? '0' : '') + bi,
              fecha: '',
              origen: 'OTRA',
              institucion: 'UNIVERSIDAD / PREGRADO',
              nombres: bNombres.toUpperCase(),
              apellidos: bApellidos.toUpperCase(),
              cedula: bCed.indexOf('-') === -1 ? 'V-' + bDigits : bCed,
              sexo: '',
              fechaNacimiento: '',
              telefono: bColTlf !== -1 ? String(bRow[bColTlf] || '') : '',
              correo: bEmail,
              tipo: 'BACHILLER / ESTUDIANTE DE PREGRADO',
              tipoLabel: 'Bachiller / Estudiante de pregrado',
              detalleExtra: '',
              dias: bColDias !== -1 ? String(bRow[bColDias] || '') : '',
              numDias: 1,
              turnosTexto: bColTxt !== -1 ? String(bRow[bColTxt] || '') : '',
              turnosJson: bColJson !== -1 ? String(bRow[bColJson] || '') : '',
              monto: 0,
              comprobante: '',
              estado: 'Exonerado 100%',
              exonerated: true
            }
          };
        }
      }
    }
  }

  return { ok: true, found: false, message: 'No se encontró registro para: ' + rawQuery };
}

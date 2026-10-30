/**
 * =========================================================================================
 * SISTEMA INSTITUCIONAL DE CONTROL - BIENES TECNOLÓGICOS, REDES Y OFIMÁTICA
 * Hospital Central Universitario Dr. Antonio María Pineda (HCUAMP)
 *
 * Base de Datos Institucional: 1qEEyduhUlRvFNhdg-fJPxJAcQVOYHwNVWORoet5BqEE
 * Endpoint de Servidor Central: AKfycbyzY0V73VNkkrrHRwxCu_z2bSwmnEEDnEbjQwu81R4GYZLYHp3uo66vYgWDICAPinLR
 * =========================================================================================
 */

var SPREADSHEET_ID = "1qEEyduhUlRvFNhdg-fJPxJAcQVOYHwNVWORoet5BqEE";
var FOLDER_NAME = "Inventario_Fotografias_Bienes";

// Helper universal para convertir texto a MAYÚSCULAS
function toUpper(str) {
  if (str === null || str === undefined) return "";
  return String(str).trim().toUpperCase();
}

// Cifrado y Hash SHA-256 para contraseñas de usuarios
function hashPassword(password) {
  if (!password) return "";
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password), Utilities.Charset.UTF_8);
  var txtHash = "";
  for (var i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    var byteString = hashVal.toString(16);
    if (byteString.length === 1) byteString = "0" + byteString;
    txtHash += byteString;
  }
  return txtHash.toUpperCase();
}

// ================= CONEXIÓN CON SPREADSHEET =================
function getSpreadsheet() {
  try {
    if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
      return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    }
  } catch (e) {
    Logger.log("Aviso: No se pudo abrir por ID, intentando getActiveSpreadsheet: " + e.message);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ================= INICIALIZACIÓN Y GENERACIÓN DE BASE DE DATOS =================
function inicializarBaseDeDatos() {
  try {
    var ss = getSpreadsheet();
    if (!ss) {
      return { status: "error", message: "No se pudo acceder a la hoja de cálculo con ID: " + SPREADSHEET_ID };
    }

    var headerBgColor = "#1e3a8a"; // Azul institucional
    var headerFontColor = "#ffffff";

    // 1. Hoja "bienes"
    var sheetBienes = ss.getSheetByName("bienes") || ss.insertSheet("bienes");
    var headersBienes = ["ID", "FECHA", "DEPARTAMENTO", "GRUPO", "SUBGRUPO", "SECCIÓN", "NRO. DE BIEN", "DESCRIPCIÓN", "CARACTERÍSTICAS", "MODELO", "COLOR", "SERIAL", "ESTADO", "URL", "ESTATUS"];
    if (sheetBienes.getLastRow() === 0) {
      sheetBienes.appendRow(headersBienes);
    } else {
      sheetBienes.getRange(1, 1, 1, headersBienes.length).setValues([headersBienes]);
    }
    sheetBienes.getRange(1, 1, 1, headersBienes.length)
      .setFontWeight("bold")
      .setBackground(headerBgColor)
      .setFontColor(headerFontColor)
      .setHorizontalAlignment("center");
    sheetBienes.setFrozenRows(1);

    // 2. Hoja "redes"
    var sheetRedes = ss.getSheetByName("redes") || ss.insertSheet("redes");
    var headersRedes = ["ID", "DEPARTAMENTO", "MODEM (CANT)", "ROUTER (CANT)", "SWITCH (CANT)", "PUNTO DE ACCESO (CANT)", "TIPO DE CABLEADO", "CANALIZACIÓN", "SSID WI-FI", "BANDA WI-FI", "PROVEEDOR", "VELOCIDAD", "RESPONSABLE DE PAGOS", "ESTATUS"];
    if (sheetRedes.getLastRow() === 0) {
      sheetRedes.appendRow(headersRedes);
    } else {
      sheetRedes.getRange(1, 1, 1, headersRedes.length).setValues([headersRedes]);
    }
    sheetRedes.getRange(1, 1, 1, headersRedes.length)
      .setFontWeight("bold")
      .setBackground(headerBgColor)
      .setFontColor(headerFontColor)
      .setHorizontalAlignment("center");
    sheetRedes.setFrozenRows(1);

    // 3. Hoja "cuestionario_ofimatica"
    var sheetOfi = ss.getSheetByName("cuestionario_ofimatica") || ss.insertSheet("cuestionario_ofimatica");
    var headersOfi = ["FECHA / HORA", "NOMBRE COMPLETO", "CORREO / DEPARTAMENTO", "PROCESADOR TEXTO FRECUENCIA", "PROCESADOR TEXTO NIVEL", "HOJAS CÁLCULO FRECUENCIA", "HOJAS CÁLCULO NIVEL", "PRESENTACIONES FRECUENCIA", "PRESENTACIONES NIVEL", "CORREO FRECUENCIA", "CORREO NIVEL", "NUBE FRECUENCIA", "NUBE NIVEL", "ESTATUS"];
    if (sheetOfi.getLastRow() === 0) {
      sheetOfi.appendRow(headersOfi);
    } else {
      sheetOfi.getRange(1, 1, 1, headersOfi.length).setValues([headersOfi]);
    }
    sheetOfi.getRange(1, 1, 1, headersOfi.length)
      .setFontWeight("bold")
      .setBackground(headerBgColor)
      .setFontColor(headerFontColor)
      .setHorizontalAlignment("center");
    sheetOfi.setFrozenRows(1);

    // 4. Hoja "usuarios" (Autenticación y Seguridad)
    var sheetUsuarios = ss.getSheetByName("usuarios") || ss.insertSheet("usuarios");
    var headersUsuarios = ["ID", "FECHA_CREACION", "NOMBRE_COMPLETO", "CORREO", "USUARIO", "PASSWORD_HASH", "ROL", "DEPARTAMENTO", "ESTADO", "ULTIMO_ACCESO"];
    if (sheetUsuarios.getLastRow() === 0) {
      sheetUsuarios.appendRow(headersUsuarios);
      // Sembrar usuarios predeterminados institucionales
      sheetUsuarios.appendRow([
        "USR-001",
        new Date(),
        "ADMINISTRADOR GENERAL DTIC",
        "DTIC@HCUAMP.GOB.VE",
        "ADMIN_TIC",
        hashPassword("Hcuamp2026*TIC"),
        "ADMINISTRADOR",
        "DEPARTAMENTO DE TECNOLOGÍA, INFORMACIÓN Y COMUNICACIÓN (TIC)",
        "ACTIVO",
        ""
      ]);
      sheetUsuarios.appendRow([
        "USR-002",
        new Date(),
        "PASANTE DE SISTEMAS UNEFA",
        "PASANTES.SISTEMAS@HCUAMP.GOB.VE",
        "OPERADOR_TIC",
        hashPassword("Unefa2026*TIC"),
        "OPERADOR",
        "DEPARTAMENTO DE TECNOLOGÍA, INFORMACIÓN Y COMUNICACIÓN (TIC)",
        "ACTIVO",
        ""
      ]);
    } else {
      sheetUsuarios.getRange(1, 1, 1, headersUsuarios.length).setValues([headersUsuarios]);
    }
    sheetUsuarios.getRange(1, 1, 1, headersUsuarios.length)
      .setFontWeight("bold")
      .setBackground(headerBgColor)
      .setFontColor(headerFontColor)
      .setHorizontalAlignment("center");
    sheetUsuarios.setFrozenRows(1);

    // 5. Hoja "logs_auditoria" (Bitácora de Trazabilidad y Seguridad)
    var sheetLogs = ss.getSheetByName("logs_auditoria") || ss.insertSheet("logs_auditoria");
    var headersLogs = ["ID_LOG", "FECHA_HORA", "USUARIO", "ROL", "ACCION", "MODULO", "DETALLE", "DIRECCION_IP", "NAVEGADOR_DISPOSITIVO", "ESTATUS"];
    if (sheetLogs.getLastRow() === 0) {
      sheetLogs.appendRow(headersLogs);
      sheetLogs.appendRow([
        "LOG-INIT-001",
        new Date(),
        "SISTEMA",
        "SUPERADMIN",
        "INICIALIZACION_BD",
        "SISTEMA",
        "ESTRUCTURA DE TABLAS DE USUARIOS Y BITÁCORA DE AUDITORÍA CREADAS CORRECTAMENTE",
        "127.0.0.1",
        "SERVIDOR INSTITUCIONAL HCUAMP",
        "EXITOSO"
      ]);
    } else {
      sheetLogs.getRange(1, 1, 1, headersLogs.length).setValues([headersLogs]);
    }
    sheetLogs.getRange(1, 1, 1, headersLogs.length)
      .setFontWeight("bold")
      .setBackground(headerBgColor)
      .setFontColor(headerFontColor)
      .setHorizontalAlignment("center");
    sheetLogs.setFrozenRows(1);

    // Si existe "Hoja 1" o "Sheet1" vacía, eliminarla para mantener limpio el libro
    var defaultSheet = ss.getSheetByName("Hoja 1") || ss.getSheetByName("Sheet1");
    if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
      try { ss.deleteSheet(defaultSheet); } catch (e) {}
    }

    return {
      status: "success",
      message: "Estructura de Base de Datos y Módulos de Seguridad verificados e inicializados correctamente.",
      spreadsheetId: SPREADSHEET_ID,
      sheets: ["bienes", "redes", "cuestionario_ofimatica", "usuarios", "logs_auditoria"]
    };
  } catch (error) {
    return { status: "error", message: "Error al inicializar BD: " + error.toString() };
  }
}

// ================= SISTEMA DE BITÁCORA Y AUDITORÍA =================
function registrarLog(usuario, rol, accion, modulo, detalle, ip, agente, estatus) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar al almacenamiento central." };
    var sheet = ss.getSheetByName("logs_auditoria");
    if (!sheet) {
      inicializarBaseDeDatos();
      sheet = ss.getSheetByName("logs_auditoria");
    }

    var logId = "LOG-" + Utilities.formatDate(new Date(), "America/Caracas", "yyyyMMdd-HHmmss-") + Math.floor(Math.random() * 1000);
    var row = [
      logId,
      new Date(),
      toUpper(usuario || "ANÓNIMO"),
      toUpper(rol || "INVITADO"),
      toUpper(accion || "ACCION"),
      toUpper(modulo || "SISTEMA"),
      toUpper(detalle || ""),
      toUpper(ip || "-"),
      toUpper(agente || "-"),
      toUpper(estatus || "EXITOSO")
    ];

    sheet.appendRow(row);
    return { status: "success", logId: logId };
  } catch (e) {
    Logger.log("Error registrando log: " + e.message);
    return { status: "error", message: e.message };
  }
}

function obtenerLogsAuditoria(limite) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return [];
    var sheet = ss.getSheetByName("logs_auditoria");
    if (!sheet || sheet.getLastRow() <= 1) return [];

    var lastRow = sheet.getLastRow();
    var maxLogs = Number(limite) || 300;
    var startRow = Math.max(2, lastRow - maxLogs + 1);
    var numRows = lastRow - startRow + 1;

    var values = sheet.getRange(startRow, 1, numRows, 10).getValues();
    var resultados = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (row[0]) {
        var fechaStr = "";
        try {
          if (row[1] instanceof Date) {
            fechaStr = Utilities.formatDate(row[1], "America/Caracas", "yyyy-MM-dd HH:mm:ss");
          } else {
            fechaStr = String(row[1] || "");
          }
        } catch (e) {
          fechaStr = String(row[1] || "");
        }

        resultados.push({
          idLog: String(row[0]),
          fechaHora: fechaStr,
          usuario: toUpper(row[2]),
          rol: toUpper(row[3]),
          accion: toUpper(row[4]),
          modulo: toUpper(row[5]),
          detalle: toUpper(row[6]),
          ip: String(row[7] || "-"),
          agente: String(row[8] || "-"),
          estatus: toUpper(row[9] || "EXITOSO")
        });
      }
    }
    return resultados.reverse();
  } catch (e) {
    Logger.log("Error en obtenerLogsAuditoria: " + e.message);
    return [];
  }
}

// ================= GESTIÓN DE USUARIOS Y AUTENTICACIÓN =================
function loginUsuario(data) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar al servidor central." };
    var sheet = ss.getSheetByName("usuarios");
    if (!sheet || sheet.getLastRow() <= 1) {
      inicializarBaseDeDatos();
      sheet = ss.getSheetByName("usuarios");
    }

    var usuarioIngresado = toUpper(data.usuario);
    var rawPassword = data.password ? String(data.password) : "";
    var passwordHashIngresado = toUpper(data.passwordHash || (rawPassword ? hashPassword(rawPassword) : ""));
    var ip = data.ip || "-";
    var agente = data.agente || "-";

    if (!usuarioIngresado || !passwordHashIngresado) {
      registrarLog(usuarioIngresado, "INVITADO", "LOGIN_FALLIDO", "AUTENTICACIÓN", "Intento con credenciales incompletas", ip, agente, "ERROR");
      return { status: "error", message: "Debe ingresar usuario y contraseña." };
    }

    var lastRow = sheet.getLastRow();
    var values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var usrSheet = toUpper(row[4]);
      var passSheet = toUpper(row[5]);
      var estadoSheet = toUpper(row[8]);

      if (usrSheet === usuarioIngresado) {
        if (estadoSheet !== "ACTIVO") {
          registrarLog(usuarioIngresado, toUpper(row[6]), "LOGIN_BLOQUEADO", "AUTENTICACIÓN", "Cuenta inactiva o suspendida", ip, agente, "ERROR");
          return { status: "error", message: "La cuenta de usuario se encuentra INACTIVA. Contacte a la Jefatura DTIC." };
        }

        // Validación de contraseña por hash SHA-256 o equivalencias
        var match = (passSheet === passwordHashIngresado) ||
                    (rawPassword && passSheet === toUpper(hashPassword(rawPassword)));

        if (match) {
          var sheetRow = i + 2;
          var ahora = new Date();
          sheet.getRange(sheetRow, 10).setValue(ahora);

          var userData = {
            id: String(row[0]),
            nombreCompleto: toUpper(row[2]),
            correo: toUpper(row[3]),
            usuario: toUpper(row[4]),
            rol: toUpper(row[6]),
            departamento: toUpper(row[7]),
            ultimoAcceso: Utilities.formatDate(ahora, "America/Caracas", "yyyy-MM-dd HH:mm:ss")
          };

          var token = "TK-" + Utilities.formatDate(ahora, "America/Caracas", "yyyyMMdd-") + Utilities.getUuid();
          registrarLog(usuarioIngresado, userData.rol, "LOGIN_EXITOSO", "AUTENTICACIÓN", "Inicio de sesión correcto", ip, agente, "EXITOSO");

          return {
            status: "success",
            message: "Autenticación institucional exitosa.",
            token: token,
            user: userData
          };
        } else {
          registrarLog(usuarioIngresado, toUpper(row[6]), "LOGIN_FALLIDO", "AUTENTICACIÓN", "Contraseña errónea", ip, agente, "ERROR");
          return { status: "error", message: "Contraseña incorrecta. Verifique sus credenciales institucionales." };
        }
      }
    }

    registrarLog(usuarioIngresado, "DESCONOCIDO", "LOGIN_FALLIDO", "AUTENTICACIÓN", "Usuario no existe en la base de datos", ip, agente, "ERROR");
    return { status: "error", message: "El usuario institucional no existe en el sistema." };
  } catch (e) {
    return { status: "error", message: "Error durante el inicio de sesión: " + e.toString() };
  }
}

function obtenerUsuarios() {
  try {
    var ss = getSpreadsheet();
    if (!ss) return [];
    var sheet = ss.getSheetByName("usuarios");
    if (!sheet || sheet.getLastRow() <= 1) return [];

    var lastRow = sheet.getLastRow();
    var values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    var usuarios = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (row[0]) {
        var ultAccesoStr = "";
        try {
          if (row[9] instanceof Date) {
            ultAccesoStr = Utilities.formatDate(row[9], "America/Caracas", "yyyy-MM-dd HH:mm");
          } else {
            ultAccesoStr = String(row[9] || "");
          }
        } catch (e) {
          ultAccesoStr = String(row[9] || "");
        }

        usuarios.push({
          sheetRow: i + 2,
          id: String(row[0]),
          fechaCreacion: row[1] instanceof Date ? Utilities.formatDate(row[1], "America/Caracas", "yyyy-MM-dd") : String(row[1] || ""),
          nombreCompleto: toUpper(row[2]),
          correo: toUpper(row[3]),
          usuario: toUpper(row[4]),
          rol: toUpper(row[6]),
          departamento: toUpper(row[7]),
          estado: toUpper(row[8] || "ACTIVO"),
          ultimoAcceso: ultAccesoStr
        });
      }
    }
    return usuarios;
  } catch (e) {
    Logger.log("Error en obtenerUsuarios: " + e.message);
    return [];
  }
}

function crearUsuario(data, solicitante) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar a la base de datos." };
    var sheet = ss.getSheetByName("usuarios");
    if (!sheet) {
      inicializarBaseDeDatos();
      sheet = ss.getSheetByName("usuarios");
    }

    var usuarioNuevo = toUpper(data.usuario);
    if (!usuarioNuevo) return { status: "error", message: "Debe ingresar el nombre de usuario." };

    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var values = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
      for (var i = 0; i < values.length; i++) {
        if (toUpper(values[i][0]) === usuarioNuevo) {
          return { status: "error", message: "El usuario ya se encuentra registrado." };
        }
      }
    }

    var passHash = data.passwordHash || (data.password ? hashPassword(data.password) : hashPassword("Hcuamp2026*"));
    var newId = "USR-" + Utilities.formatDate(new Date(), "America/Caracas", "yyyyMMdd-") + Math.floor(Math.random() * 1000);

    var row = [
      newId,
      new Date(),
      toUpper(data.nombreCompleto),
      toUpper(data.correo),
      usuarioNuevo,
      toUpper(passHash),
      toUpper(data.rol || "OPERADOR"),
      toUpper(data.departamento || "DEPARTAMENTO DE TECNOLOGÍA, INFORMACIÓN Y COMUNICACIÓN (TIC)"),
      "ACTIVO",
      ""
    ];

    sheet.appendRow(row);
    registrarLog(solicitante ? solicitante.usuario : "ADMIN", solicitante ? solicitante.rol : "ADMINISTRADOR", "CREACION_USUARIO", "USUARIOS", "Creación de usuario: " + usuarioNuevo, "-", "-", "EXITOSO");
    return { status: "success", message: "Usuario creado exitosamente.", id: newId };
  } catch (e) {
    return { status: "error", message: "Error al crear usuario: " + e.toString() };
  }
}

function actualizarUsuario(sheetRow, data, solicitante) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar a la base de datos." };
    var sheet = ss.getSheetByName("usuarios");
    if (!sheet || sheetRow < 2) return { status: "error", message: "Registro de usuario inválido." };

    var idActual = sheet.getRange(sheetRow, 1).getValue();
    var fechaActual = sheet.getRange(sheetRow, 2).getValue();
    var passActual = sheet.getRange(sheetRow, 6).getValue();
    var ultimoAccesoActual = sheet.getRange(sheetRow, 10).getValue();

    var passFinal = passActual;
    if (data.password && String(data.password).trim() !== "") {
      passFinal = hashPassword(data.password);
    } else if (data.passwordHash && String(data.passwordHash).trim() !== "") {
      passFinal = toUpper(data.passwordHash);
    }

    var rowData = [
      idActual,
      fechaActual,
      toUpper(data.nombreCompleto),
      toUpper(data.correo),
      toUpper(data.usuario),
      passFinal,
      toUpper(data.rol),
      toUpper(data.departamento),
      toUpper(data.estado || "ACTIVO"),
      ultimoAccesoActual
    ];

    sheet.getRange(sheetRow, 1, 1, rowData.length).setValues([rowData]);
    registrarLog(solicitante ? solicitante.usuario : "ADMIN", solicitante ? solicitante.rol : "ADMINISTRADOR", "ACTUALIZACION_USUARIO", "USUARIOS", "Modificó usuario: " + toUpper(data.usuario), "-", "-", "EXITOSO");
    return { status: "success", message: "Usuario actualizado correctamente." };
  } catch (e) {
    return { status: "error", message: "Error actualizando usuario: " + e.toString() };
  }
}

function desactivarUsuario(sheetRow, solicitante) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar a la base de datos." };
    var sheet = ss.getSheetByName("usuarios");
    if (!sheet || sheetRow < 2) return { status: "error", message: "Registro de usuario inválido." };

    var usr = sheet.getRange(sheetRow, 5).getValue();
    sheet.getRange(sheetRow, 9).setValue("INACTIVO");
    registrarLog(solicitante ? solicitante.usuario : "ADMIN", solicitante ? solicitante.rol : "ADMINISTRADOR", "DESACTIVACION_USUARIO", "USUARIOS", "Desactivó al usuario: " + usr, "-", "-", "EXITOSO");
    return { status: "success", message: "Usuario marcado como inactivo correctamente." };
  } catch (e) {
    return { status: "error", message: "Error desactivando usuario: " + e.toString() };
  }
}

// ================= API ENDPOINT: doGet (Consultas y Render) =================
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";

  // Si no se pide ninguna acción de API, sirve el index o devuelve info de estado
  if (!action) {
    try {
      var template;
      try {
        template = HtmlService.createTemplateFromFile('index');
      } catch (e1) {
        template = HtmlService.createTemplateFromFile('Index');
      }
      return template.evaluate()
        .setTitle('Sistema Institucional - Inventario, Redes y Ofimática')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (err) {
      return createJsonResponse({
        status: "success",
        message: "Servidor Central HCUAMP Activo y Operativo",
        spreadsheetId: SPREADSHEET_ID,
        endpoints: ["obtenerTodosLosBienes", "obtenerTodasLasRedes", "obtenerTodosLosDiagnosticos", "obtenerTodo", "obtenerUsuarios", "obtenerLogsAuditoria", "init_db", "ping"]
      });
    }
  }

  var response;
  try {
    switch (action) {
      case "ping":
        response = { status: "success", message: "Backend activo", spreadsheetId: SPREADSHEET_ID, timestamp: new Date() };
        break;
      case "init_db":
        response = inicializarBaseDeDatos();
        break;
      case "obtenerTodosLosBienes":
        response = { status: "success", data: obtenerTodosLosBienes() };
        break;
      case "obtenerTodasLasRedes":
        response = { status: "success", data: obtenerTodasLasRedes() };
        break;
      case "obtenerTodosLosDiagnosticos":
        response = { status: "success", data: obtenerTodosLosDiagnosticos() };
        break;
      case "obtenerUsuarios":
        response = { status: "success", data: obtenerUsuarios() };
        break;
      case "obtenerLogsAuditoria":
        response = { status: "success", data: obtenerLogsAuditoria(e.parameter ? e.parameter.limite : 300) };
        break;
      case "obtenerTodo":
        response = {
          status: "success",
          bienes: obtenerTodosLosBienes(),
          redes: obtenerTodasLasRedes(),
          ofimatica: obtenerTodosLosDiagnosticos(),
          usuarios: obtenerUsuarios()
        };
        break;
      default:
        response = { status: "error", message: "Acción GET no reconocida: " + action };
    }
  } catch (err) {
    response = { status: "error", message: "Error en doGet: " + err.toString() };
  }

  return createJsonResponse(response);
}

// ================= API ENDPOINT: doPost (Creación, Actualización, Eliminación, Fotos, Auth, Logs) =================
function doPost(e) {
  var response;
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || (e && e.parameter && e.parameter.action);

    switch (action) {
      // Autenticación y Seguridad
      case "loginUsuario":
      case "login":
        response = loginUsuario(payload.data || payload);
        break;
      case "obtenerUsuarios":
        response = { status: "success", data: obtenerUsuarios() };
        break;
      case "crearUsuario":
        response = crearUsuario(payload.data || payload, payload.solicitante);
        break;
      case "actualizarUsuario":
        response = actualizarUsuario(payload.sheetRow, payload.data || payload, payload.solicitante);
        break;
      case "desactivarUsuario":
        response = desactivarUsuario(payload.sheetRow, payload.solicitante);
        break;

      // Auditoría y Bitácora
      case "registrarLog":
        var lData = payload.data || payload;
        response = registrarLog(lData.usuario, lData.rol, lData.accion, lData.modulo, lData.detalle, lData.ip, lData.agente, lData.estatus);
        break;
      case "obtenerLogsAuditoria":
        response = { status: "success", data: obtenerLogsAuditoria(payload.limite || 300) };
        break;

      // Bienes Tecnológicos
      case "guardarBien":
        response = guardarBien(payload.data || payload, payload.solicitante);
        break;
      case "actualizarBien":
        response = actualizarBien(payload.sheetRow, payload.data || payload, payload.solicitante);
        break;

      // Infraestructura de Red
      case "guardarInfraestructuraRed":
        response = guardarInfraestructuraRed(payload.data || payload, payload.solicitante);
        break;
      case "actualizarRed":
        response = actualizarRed(payload.sheetRow, payload.data || payload, payload.solicitante);
        break;

      // Diagnóstico de Ofimática
      case "guardarCuestionarioOfimatica":
        response = guardarCuestionarioOfimatica(payload.data || payload, payload.solicitante);
        break;
      case "actualizarOfimatica":
        response = actualizarOfimatica(payload.sheetRow, payload.data || payload, payload.solicitante);
        break;

      // Eliminación Lógica
      case "eliminarFilaSheets":
      case "desactivarRegistro":
      case "eliminarRegistro":
        response = eliminarFilaSheets(payload.sheetName || payload.nombreHoja, payload.sheetRow, payload.solicitante);
        break;

      // Fotografía
      case "subirFotoADrive":
      case "almacenarFoto":
      case "subirFoto":
        response = subirFotoADrive(payload.base64Data, payload.fileName, payload.mimeType);
        break;

      // Inicialización
      case "init_db":
        response = inicializarBaseDeDatos();
        break;

      default:
        response = { status: "error", message: "Acción POST no reconocida: " + action };
    }
  } catch (err) {
    response = { status: "error", message: "Error procesando POST: " + err.toString() };
  }

  return createJsonResponse(response);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================= 1. MÓDULO BIENES =================
function obtenerTodosLosBienes() {
  try {
    var ss = getSpreadsheet();
    if (!ss) return [];
    var sheet = ss.getSheetByName("bienes");
    if (!sheet || sheet.getLastRow() <= 1) return [];

    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
    var resultados = [];

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var estatus = toUpper(row[14]);
      if (estatus === "") estatus = "ACTIVO";

      if (estatus !== "INACTIVO") {
        var departamento = toUpper(row[2]);
        var nroBien = toUpper(row[6]);

        if (departamento !== "" || nroBien !== "") {
          resultados.push({
            sheetRow: i + 2,
            id: String(row[0] || ""),
            fecha: row[1] instanceof Date ? Utilities.formatDate(row[1], "America/Caracas", "yyyy-MM-dd HH:mm") : String(row[1] || ""),
            departamento: departamento,
            grupo: toUpper(row[3]),
            subgrupo: toUpper(row[4]),
            seccion: toUpper(row[5]),
            nroBienCompleto: nroBien,
            descripcion: toUpper(row[7]),
            caracteristicas: toUpper(row[8]),
            modelo: toUpper(row[9]),
            color: toUpper(row[10]),
            serial: toUpper(row[11]),
            estado: toUpper(row[12] || "BUENO"),
            fotoUrl: String(row[13] || ""),
            estatus: estatus
          });
        }
      }
    }
    return resultados.reverse();
  } catch (e) {
    Logger.log("Error en obtenerTodosLosBienes: " + e.message);
    return [];
  }
}

function guardarBien(data, solicitante) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar al almacenamiento central." };
    var sheet = ss.getSheetByName("bienes");
    if (!sheet) {
      inicializarBaseDeDatos();
      sheet = ss.getSheetByName("bienes");
    }

    var idGenerado = "BN-" + Utilities.formatDate(new Date(), "America/Caracas", "yyyyMMdd-HHmmss");
    var rowData = [
      idGenerado,
      new Date(),
      toUpper(data.departamento),
      toUpper(data.grupo),
      toUpper(data.subgrupo),
      toUpper(data.seccion),
      toUpper(data.nroBienCompleto),
      toUpper(data.descripcion),
      toUpper(data.caracteristicas),
      toUpper(data.modelo),
      toUpper(data.color),
      toUpper(data.serial),
      toUpper(data.estado || "BUENO"),
      data.fotoUrl || "",
      "ACTIVO"
    ];

    sheet.appendRow(rowData);
    registrarLog(solicitante ? solicitante.usuario : "SISTEMA", solicitante ? solicitante.rol : "OPERADOR", "REGISTRO_BIEN", "BIENES", "Registró bien: " + toUpper(data.nroBienCompleto) + " (" + toUpper(data.departamento) + ")", "-", "-", "EXITOSO");
    return { status: "success", message: "Bien tecnológico registrado con éxito.", id: idGenerado };
  } catch (error) {
    return { status: "error", message: "Error al guardar bien: " + error.toString() };
  }
}

function actualizarBien(sheetRow, data, solicitante) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar al almacenamiento central." };
    var sheet = ss.getSheetByName("bienes");
    if (!sheet) return { status: "error", message: "No se encontró la hoja bienes." };

    var idActual = sheet.getRange(sheetRow, 1).getValue() || ("BN-" + Date.now());
    var fechaActual = sheet.getRange(sheetRow, 2).getValue() || new Date();
    var estatusActual = toUpper(sheet.getRange(sheetRow, 15).getValue()) || "ACTIVO";

    var rowData = [
      idActual,
      fechaActual,
      toUpper(data.departamento),
      toUpper(data.grupo),
      toUpper(data.subgrupo),
      toUpper(data.seccion),
      toUpper(data.nroBienCompleto),
      toUpper(data.descripcion),
      toUpper(data.caracteristicas),
      toUpper(data.modelo),
      toUpper(data.color),
      toUpper(data.serial),
      toUpper(data.estado || "BUENO"),
      data.fotoUrl || "",
      estatusActual
    ];

    sheet.getRange(sheetRow, 1, 1, rowData.length).setValues([rowData]);
    registrarLog(solicitante ? solicitante.usuario : "SISTEMA", solicitante ? solicitante.rol : "OPERADOR", "ACTUALIZACION_BIEN", "BIENES", "Modificó bien fila #" + sheetRow + ": " + toUpper(data.nroBienCompleto), "-", "-", "EXITOSO");
    return { status: "success", message: "Bien actualizado correctamente." };
  } catch (error) {
    return { status: "error", message: "Error al actualizar bien: " + error.toString() };
  }
}

// ================= 2. MÓDULO REDES =================
function obtenerTodasLasRedes() {
  try {
    var ss = getSpreadsheet();
    if (!ss) return [];
    var sheet = ss.getSheetByName("redes");
    if (!sheet || sheet.getLastRow() <= 1) return [];

    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
    var resultados = [];

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var estatus = toUpper(row[13]);
      if (estatus === "") estatus = "ACTIVO";

      if (estatus !== "INACTIVO") {
        var ssid = toUpper(row[8]);
        if (ssid !== "") {
          resultados.push({
            sheetRow: i + 2,
            id: String(row[0] || ""),
            departamento: toUpper(row[1]),
            modem: Number(row[2]) || 0,
            router: Number(row[3]) || 0,
            switch: Number(row[4]) || 0,
            ap: Number(row[5]) || 0,
            cableado: toUpper(row[6]),
            canalizacion: toUpper(row[7]),
            ssid: ssid,
            banda: toUpper(row[9]),
            proveedor: toUpper(row[10]),
            velocidad: toUpper(row[11]),
            responsable: toUpper(row[12]),
            estatus: estatus
          });
        }
      }
    }
    return resultados.reverse();
  } catch (e) {
    Logger.log("Error en obtenerTodasLasRedes: " + e.message);
    return [];
  }
}

function guardarInfraestructuraRed(data, solicitante) {
  try {
    var departamento = toUpper(data && data.departamento);
    if (!departamento) {
      return { status: "error", message: "Seleccione el departamento inspeccionado antes de guardar la red." };
    }

    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar al almacenamiento central." };
    var sheet = ss.getSheetByName("redes");
    if (!sheet) {
      inicializarBaseDeDatos();
      sheet = ss.getSheetByName("redes");
    }

    var idGenerado = "RED-" + Utilities.formatDate(new Date(), "America/Caracas", "yyyyMMdd-HHmmss");
    var rowData = [
      idGenerado,
      departamento,
      Number(data.modem) || 0,
      Number(data.router) || 0,
      Number(data.switch) || 0,
      Number(data.ap) || 0,
      toUpper(data.cableado),
      toUpper(data.canalizacion),
      toUpper(data.ssid),
      toUpper(data.banda),
      toUpper(data.proveedor),
      toUpper(data.velocidad),
      toUpper(data.responsable),
      "ACTIVO"
    ];

    sheet.appendRow(rowData);
    registrarLog(solicitante ? solicitante.usuario : "SISTEMA", solicitante ? solicitante.rol : "OPERADOR", "REGISTRO_RED", "REDES", "Registró red SSID: " + toUpper(data.ssid) + " (" + toUpper(data.proveedor) + ")", "-", "-", "EXITOSO");
    return { status: "success", message: "Infraestructura de red registrada con éxito.", id: idGenerado };
  } catch (e) {
    return { status: "error", message: "Error al guardar red: " + e.toString() };
  }
}

function actualizarRed(sheetRow, data, solicitante) {
  try {
    var departamento = toUpper(data && data.departamento);
    if (!departamento) {
      return { status: "error", message: "Seleccione el departamento inspeccionado antes de actualizar la red." };
    }

    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar al almacenamiento central." };
    var sheet = ss.getSheetByName("redes");
    if (!sheet) return { status: "error", message: "No se encontró la hoja redes." };

    var idActual = sheet.getRange(sheetRow, 1).getValue() || ("RED-" + Date.now());
    var estatusActual = toUpper(sheet.getRange(sheetRow, 14).getValue()) || "ACTIVO";

    var rowData = [
      idActual,
      departamento,
      Number(data.modem) || 0,
      Number(data.router) || 0,
      Number(data.switch) || 0,
      Number(data.ap) || 0,
      toUpper(data.cableado),
      toUpper(data.canalizacion),
      toUpper(data.ssid),
      toUpper(data.banda),
      toUpper(data.proveedor),
      toUpper(data.velocidad),
      toUpper(data.responsable),
      estatusActual
    ];

    sheet.getRange(sheetRow, 1, 1, rowData.length).setValues([rowData]);
    registrarLog(solicitante ? solicitante.usuario : "SISTEMA", solicitante ? solicitante.rol : "OPERADOR", "ACTUALIZACION_RED", "REDES", "Modificó red SSID: " + toUpper(data.ssid), "-", "-", "EXITOSO");
    return { status: "success", message: "Infraestructura de red actualizada con éxito." };
  } catch (e) {
    return { status: "error", message: "Error al actualizar red: " + e.toString() };
  }
}

// ================= 3. MÓDULO OFIMÁTICA =================
function obtenerTodosLosDiagnosticos() {
  try {
    var ss = getSpreadsheet();
    if (!ss) return [];
    var sheet = ss.getSheetByName("cuestionario_ofimatica");
    if (!sheet || sheet.getLastRow() <= 1) return [];

    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
    var resultados = [];

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var estatus = toUpper(row[13]);
      if (estatus === "") estatus = "ACTIVO";

      if (estatus !== "INACTIVO") {
        var nombre = toUpper(row[1]);
        if (nombre !== "") {
          resultados.push({
            sheetRow: i + 2,
            fechaHora: row[0] instanceof Date ? Utilities.formatDate(row[0], "America/Caracas", "yyyy-MM-dd HH:mm") : String(row[0] || ""),
            nombre: nombre,
            correo: toUpper(row[2]),
            tools: {
              word: { frecuencia: toUpper(row[3]), nivel: toUpper(row[4]) },
              excel: { frecuencia: toUpper(row[5]), nivel: toUpper(row[6]) },
              slides: { frecuencia: toUpper(row[7]), nivel: toUpper(row[8]) },
              correo: { frecuencia: toUpper(row[9]), nivel: toUpper(row[10]) },
              nube: { frecuencia: toUpper(row[11]), nivel: toUpper(row[12]) }
            },
            estatus: estatus
          });
        }
      }
    }
    return resultados.reverse();
  } catch (e) {
    Logger.log("Error en obtenerTodosLosDiagnosticos: " + e.message);
    return [];
  }
}

function guardarCuestionarioOfimatica(data, solicitante) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar al almacenamiento central." };
    var sheet = ss.getSheetByName("cuestionario_ofimatica");
    if (!sheet) {
      inicializarBaseDeDatos();
      sheet = ss.getSheetByName("cuestionario_ofimatica");
    }

    var tools = data.tools || {};
    var rowData = [
      new Date(),
      toUpper(data.nombre),
      toUpper(data.correo),
      toUpper(tools.word && tools.word.frecuencia),
      toUpper(tools.word && tools.word.nivel),
      toUpper(tools.excel && tools.excel.frecuencia),
      toUpper(tools.excel && tools.excel.nivel),
      toUpper(tools.slides && tools.slides.frecuencia),
      toUpper(tools.slides && tools.slides.nivel),
      toUpper(tools.correo && tools.correo.frecuencia),
      toUpper(tools.correo && tools.correo.nivel),
      toUpper(tools.nube && tools.nube.frecuencia),
      toUpper(tools.nube && tools.nube.nivel),
      "ACTIVO"
    ];

    sheet.appendRow(rowData);
    registrarLog(solicitante ? solicitante.usuario : "SISTEMA", solicitante ? solicitante.rol : "OPERADOR", "REGISTRO_OFIMATICA", "OFIMATICA", "Diagnóstico para funcionario: " + toUpper(data.nombre), "-", "-", "EXITOSO");
    return { status: "success", message: "Diagnóstico de ofimática registrado con éxito." };
  } catch (e) {
    return { status: "error", message: "Error al guardar diagnóstico: " + e.toString() };
  }
}

function actualizarOfimatica(sheetRow, data, solicitante) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar al almacenamiento central." };
    var sheet = ss.getSheetByName("cuestionario_ofimatica");
    if (!sheet) return { status: "error", message: "No se encontró la hoja de ofimática." };

    var fechaActual = sheet.getRange(sheetRow, 1).getValue() || new Date();
    var estatusActual = toUpper(sheet.getRange(sheetRow, 14).getValue()) || "ACTIVO";
    var tools = data.tools || {};

    var rowData = [
      fechaActual,
      toUpper(data.nombre),
      toUpper(data.correo),
      toUpper(tools.word && tools.word.frecuencia),
      toUpper(tools.word && tools.word.nivel),
      toUpper(tools.excel && tools.excel.frecuencia),
      toUpper(tools.excel && tools.excel.nivel),
      toUpper(tools.slides && tools.slides.frecuencia),
      toUpper(tools.slides && tools.slides.nivel),
      toUpper(tools.correo && tools.correo.frecuencia),
      toUpper(tools.correo && tools.correo.nivel),
      toUpper(tools.nube && tools.nube.frecuencia),
      toUpper(tools.nube && tools.nube.nivel),
      estatusActual
    ];

    sheet.getRange(sheetRow, 1, 1, rowData.length).setValues([rowData]);
    registrarLog(solicitante ? solicitante.usuario : "SISTEMA", solicitante ? solicitante.rol : "OPERADOR", "ACTUALIZACION_OFIMATICA", "OFIMATICA", "Modificó diagnóstico fila #" + sheetRow + ": " + toUpper(data.nombre), "-", "-", "EXITOSO");
    return { status: "success", message: "Diagnóstico de ofimática actualizado con éxito." };
  } catch (e) {
    return { status: "error", message: "Error al actualizar diagnóstico: " + e.toString() };
  }
}

// ================= BORRADO LÓGICO (Soft Delete) =================
function eliminarFilaSheets(nombreHoja, sheetRow, solicitante) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: "error", message: "No se pudo conectar al almacenamiento central." };
    var sheet = ss.getSheetByName(nombreHoja);

    if (sheet && sheetRow && sheetRow > 1) {
      var colEstatus = 15; // Columna O para "bienes"
      if (nombreHoja === "redes") {
        colEstatus = 14; // Columna N para "redes"
      } else if (nombreHoja === "cuestionario_ofimatica") {
        colEstatus = 14; // Columna N para "cuestionario_ofimatica"
      } else if (nombreHoja === "usuarios") {
        colEstatus = 9; // Columna I para "usuarios"
      }

      sheet.getRange(sheetRow, colEstatus).setValue("INACTIVO");
      registrarLog(solicitante ? solicitante.usuario : "SISTEMA", solicitante ? solicitante.rol : "ADMINISTRADOR", "ELIMINACION_LOGICA", toUpper(nombreHoja), "Marcó inactivo registro fila #" + sheetRow + " en " + nombreHoja, "-", "-", "EXITOSO");
      return { status: "success", message: "Registro desincorporado / marcado como inactivo correctamente." };
    }
    return { status: "error", message: "No se pudo localizar la fila o la hoja indicada (" + nombreHoja + ", fila " + sheetRow + ")." };
  } catch (error) {
    return { status: "error", message: "Error al actualizar estatus: " + error.toString() };
  }
}

// ================= SUBIDA AUTOMÁTICA DE FOTOS =================
function subirFotoADrive(base64Data, fileName, mimeType) {
  try {
    if (!base64Data) {
      return { status: "error", message: "No se proporcionaron datos de imagen." };
    }

    var folders = DriveApp.getFoldersByName(FOLDER_NAME);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(FOLDER_NAME);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    var rawData = base64Data;
    if (rawData.indexOf(",") > -1) {
      rawData = rawData.split(",")[1];
    }

    var decodedData = Utilities.base64Decode(rawData);
    var blobName = fileName || ("BIEN_" + Date.now() + ".jpg");
    var blobMime = mimeType || "image/jpeg";
    var blob = Utilities.newBlob(decodedData, blobMime, blobName);

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    return {
      status: "success",
      url: directUrl,
      fileId: fileId,
      viewUrl: file.getUrl()
    };
  } catch (error) {
    return { status: "error", message: "Error al almacenar fotografía: " + error.toString() };
  }
}
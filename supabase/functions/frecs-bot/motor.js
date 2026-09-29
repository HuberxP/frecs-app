// GENERADO por herramientas/construir.py: no editar a mano.
// La lógica de Apps Script (gas/*.gs) corriendo en la función del bot.
// crearMotor(props): las constantes de Apps Script (token, grupo…) se leen al crearlo.
export function crearMotor(__PROPS_INICIALES) { return (() => {
// ---------------------------------------------------------------------
// Apps Script en el servidor de Supabase (función frecs-bot).
// Igual que en la página: las "hojas" se arman en memoria con los datos de Supabase.
// Lo que en Apps Script sale a internet (Telegram, Supabase) aquí se anota en una cola
// (__cola) y la función lo envía en orden al terminar, esperando cada respuesta.
// ---------------------------------------------------------------------
const __TZ_DEF = "America/Bogota";
const console = { log: (...a) => globalThis.console.log(...a), warn: (...a) => globalThis.console.warn(...a), error: (...a) => globalThis.console.warn(...a), info: (...a) => globalThis.console.info(...a) };
function __colIdx(l) { let n = 0; for (const ch of l) n = n * 26 + (ch.charCodeAt(0) - 64); return n; }
class __Rango {
  constructor(sh, r, c, nr, nc) { this.sh = sh; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [], f = this.sh.data[this.r - 1 + i];
      for (let j = 0; j < this.nc; j++) { const v = f ? f[this.c - 1 + j] : undefined; row.push(v === undefined || v === null ? "" : v); }
      out.push(row);
    }
    return out;
  }
  getValue() { return this.getValues()[0][0]; }
  setValues(v) {
    for (let i = 0; i < v.length; i++) {
      const idx = this.r - 1 + i;
      while (this.sh.data.length <= idx) this.sh.data.push([]);
      for (let j = 0; j < v[i].length; j++) this.sh.data[idx][this.c - 1 + j] = v[i][j];
    }
    return this;
  }
  setValue(x) { return this.setValues([[x]]); }
  clearContent() { for (let i = 0; i < this.nr; i++) { const f = this.sh.data[this.r - 1 + i]; if (f) for (let j = 0; j < this.nc; j++) f[this.c - 1 + j] = ""; } this.sh.trim(); return this; }
  setNumberFormat() { return this; } setFontWeight() { return this; } setBackground() { return this; }
}
class __Hoja {
  constructor(nombre, data) { this.nombre = nombre; this.data = data || []; }
  trim() { while (this.data.length && this.data[this.data.length - 1].every(x => x === "" || x === undefined || x === null)) this.data.pop(); }
  getName() { return this.nombre; }
  getLastRow() { this.trim(); return this.data.length; }
  getLastColumn() { return this.data.reduce((a, r) => { let n = r.length; while (n > 0 && (r[n - 1] === "" || r[n - 1] === undefined || r[n - 1] === null)) n--; return Math.max(a, n); }, 0); }
  getMaxRows() { return Math.max(1000, this.data.length); }
  getRange(a, b, c, d) {
    if (typeof a === "string") {
      const m = a.match(/^([A-Z]+)(\d*):([A-Z]+)(\d*)$/);
      if (m) { const c1 = __colIdx(m[1]), c2 = __colIdx(m[3]); return new __Rango(this, 1, c1, Math.max(this.data.length, 1), c2 - c1 + 1); }
      const m2 = a.match(/^([A-Z]+)(\d+)$/);
      if (m2) return new __Rango(this, +m2[2], __colIdx(m2[1]), 1, 1);
      throw new Error("Rango no soportado: " + a);
    }
    return new __Rango(this, a, b, c || 1, d || 1);
  }
  getDataRange() { return new __Rango(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
  appendRow(f) { this.trim(); this.data.push(f.slice()); }
  deleteRow(n) { this.data.splice(n - 1, 1); }
  setFrozenRows() {} insertRowsAfter() {}
}
class __Libro {
  constructor(id) { this.id = id; this.hojas = {}; }
  getId() { return this.id; }
  getSheetByName(n) { return this.hojas[n] || null; }
  insertSheet(n) { const h = new __Hoja(n, []); this.hojas[n] = h; return h; }
  poner(n, data) { const h = new __Hoja(n, data); this.hojas[n] = h; return h; }
  getSpreadsheetTimeZone() { return __TZ_DEF; }
}
const __libros = {};
const __props = Object.assign({}, __PROPS_INICIALES || {});   // (las constantes de 00_Config las leen al crear el motor)
const __cache = {};          // lo que llegó de bot_cache
const __cacheCambios = { poner: {}, quitar: [] };
let __cola = [];              // salidas pendientes (Telegram, Supabase, tareas)
const SpreadsheetApp = {
  openById: id => { if (!__libros[id]) __libros[id] = new __Libro(id); return __libros[id]; },
  create: () => { throw new Error("No disponible en el bot."); },
  flush() {}
};
const PropertiesService = { getScriptProperties: () => ({
  getProperty: k => (k in __props ? __props[k] : null),
  setProperty: (k, v) => { __props[k] = String(v); },
  deleteProperty: k => { delete __props[k]; },
  getProperties: () => Object.assign({}, __props)
}) };
const CacheService = { getScriptCache: () => ({
  get: k => (k in __cache ? __cache[k] : null),
  put: (k, v, s) => { __cache[k] = String(v); __cacheCambios.poner[k] = [String(v), Math.min(Number(s) || 600, 21600)]; },
  remove: k => { delete __cache[k]; delete __cacheCambios.poner[k]; __cacheCambios.quitar.push(k); },
  putAll: (o, s) => Object.keys(o).forEach(k => { __cache[k] = String(o[k]); }),   // (cachés internas: solo en esta ejecución)
  getAll: ks => { const r = {}; ks.forEach(k => { if (k in __cache) r[k] = __cache[k]; }); return r; },
  removeAll: ks => ks.forEach(k => { delete __cache[k]; })
}) };
const LockService = { getScriptLock: () => ({ tryLock: () => true, waitLock() {}, releaseLock() {} }) };
const __enc = new TextEncoder();
function __blob(bytes, tipo, nombre) {
  return { __bytes: bytes, __tipo: tipo || "application/octet-stream", __nombre: nombre || "archivo",
    getBytes: () => Array.from(bytes), getName() { return this.__nombre; }, setName(n) { this.__nombre = n; return this; }, getContentType() { return this.__tipo; } };
}
const Utilities = {
  formatDate: (d, tz, f) => {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz || __TZ_DEF, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      .formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
    if (p.hour === "24") p.hour = "00";
    const lit = [];
    let s = String(f).replace(/'([^']*)'/g, (m, t) => { lit.push(t); return "\u0001" + (lit.length - 1) + "\u0002"; });
    s = s.replace("yyyy", p.year).replace("MM", p.month).replace("dd", p.day).replace("HH", p.hour).replace(/\bH\b/, String(+p.hour)).replace("mm", p.minute).replace("ss", p.second);
    return s.replace(/\u0001(\d+)\u0002/g, (m, k) => lit[+k]);
  },
  getUuid: () => crypto.randomUUID(),
  sleep() {},
  DigestAlgorithm: { SHA_256: "SHA_256", MD5: "MD5" }, Charset: { UTF_8: "UTF-8" },
  computeDigest: () => { throw new Error("No disponible en el bot."); },
  base64Encode: b => btoa(String.fromCharCode.apply(null, (b || []).map(x => x & 255))),
  base64Decode: s => Array.from(atob(String(s)), c => c.charCodeAt(0)),
  newBlob: (datos, tipo, nombre) => __blob(Array.isArray(datos) ? Uint8Array.from(datos.map(x => x & 255)) : __enc.encode(String(datos === undefined ? "" : datos)), tipo, nombre)
};
const Session = { getActiveUser: () => ({ getEmail: () => "" }) };
// Salidas a internet: se anotan y responden "bien" enseguida (la función las envía después, en orden)
const UrlFetchApp = { fetch: (url, o) => {
  __cola.push({ tipo: "http", url: url, o: o || {} });
  return { getResponseCode: () => 200, getContentText: () => '{"ok":true,"result":{}}' };
} };
const __noBot = () => { throw new Error("No disponible en el bot."); };
const HtmlService = { createHtmlOutput: __noBot, createTemplateFromFile: __noBot, createHtmlOutputFromFile: __noBot, XFrameOptionsMode: {} };
// El instructivo se toma del depósito "frecs" de Supabase (instructivo.pdf)
const DriveApp = { getFileById: id => ({ getBlob: () => ({ __instructivo: true, getName: () => "Instructivo.pdf" }) }) };
const ScriptApp = { getProjectTriggers: () => [], newTrigger: __noBot, deleteTrigger: __noBot };
const ContentService = { createTextOutput: t => ({ __texto: t, setMimeType() { return this; }, getContent() { return this.__texto; } }), MimeType: { JSON: "json" } };

// ===== 00_Config.gs =====
// =========================================================
// 00 · CONFIGURACIÓN GENERAL
// ---------------------------------------------------------
// Credenciales e IDs en Propiedades del script
// (Configuración del proyecto > Propiedades del script).
// Si una propiedad no existe se usa el valor por defecto de prop_().
//
// IMPORTANTE: este archivo debe quedar PRIMERO en la lista de archivos
// del proyecto (las constantes de abajo las usan los demás).
// =========================================================
function prop_(clave, porDefecto) {
  const v = PropertiesService.getScriptProperties().getProperty(clave);
  return (v !== null && v !== "") ? v : (porDefecto || "");
}

const TELEGRAM_TOKEN = prop_("TELEGRAM_TOKEN", "");
const TELEGRAM_API = "https://api.telegram.org/bot" + TELEGRAM_TOKEN;
const SHEET_ID = prop_("SHEET_ID", "LIBRO_1");
const GRUPO_CALIDAD_ID = prop_("GRUPO_CALIDAD_ID", "");
const INSTRUCTIVO_DRIVE_ID = prop_("INSTRUCTIVO_DRIVE_ID", "");
const DASHBOARD_URL = prop_("DASHBOARD_URL", "");
const TZ = "America/Bogota";

// Archivos de turno (Google Sheets aparte del principal)
const ARCHIVOS = {
  VAL: prop_("VAL_SHEET_ID", "LIBRO_2"),        // Validaciones_WMS
  ENTREGA: prop_("ENTREGA_SHEET_ID", "LIBRO_3"), // Entrega_Turno_WMS (dueño del turno)
  CONC: prop_("CONC_SHEET_ID", "LIBRO_4"),       // Conciliaciones_WMS
  ARCH: prop_("ARCHIVO_SHEET_ID", "")  // Frecs_Archivo: historial viejo (se crea solo la primera vez que se archiva)
};

const WMS_CONFIG = {
  loginUrl: "https://wms.invalid/api/auth/login/",
  inventariosUrl: "https://wms.invalid/api/calidad/modulos-inventarios/",
  cdId: "00000000-0000-0000-0000-000000000000",
  username: prop_("WMS_USER", ""),
  password: prop_("WMS_PASS", "")
};

// Reglas por defecto (se usan solo si la hoja no trae el dato)
const POCOS_DEFECTO = 10;        // estibas mínimas cuando la columna Minimo de Sku está vacía
const HORARIO_TURNOS = { 1: "10:00 p.m. – 6:00 a.m.", 2: "6:00 a.m. – 2:00 p.m.", 3: "2:00 p.m. – 10:00 p.m." };

// =========================================================
// ACCESO A LOS LIBROS (se abren una sola vez por ejecución)
// =========================================================
let _SS = null;
function ss_() { if (!_SS) _SS = SpreadsheetApp.openById(SHEET_ID); return _SS; }
function hoja_(nombre) { return ss_().getSheetByName(nombre); }

let _LIBROS = {};
function libro_(clave) {
  if (clave === "MAIN") return ss_();
  if (!_LIBROS[clave]) {
    const id = ARCHIVOS[clave];
    if (!id) throw new Error(`Falta el ID del archivo ${clave} en Propiedades del script.`);
    try { _LIBROS[clave] = SpreadsheetApp.openById(id); }
    catch (e) { throw new Error(`No se pudo abrir el archivo ${clave}. Revisa que esté compartido como editor con la cuenta que ejecuta el script.`); }
  }
  return _LIBROS[clave];
}

// =========================================================
// TABLAS GENÉRICAS
// def = { libro: "MAIN" | "VAL" | "ENTREGA" | "CONC", nombre, cab: [...], texto: [columnas 1..n en formato texto] }
// - Si la pestaña no existe, se crea con encabezados.
// - Si existe con menos columnas, se agregan los encabezados que faltan al final
//   (así las versiones nuevas agregan columnas sin romper los datos viejos).
// =========================================================
let _THOJAS = {};
function tHoja_(def) {
  const k = def.libro + "|" + def.nombre;
  if (_THOJAS[k]) return _THOJAS[k];
  const ss = libro_(def.libro);
  let sh = ss.getSheetByName(def.nombre);
  if (!sh) {
    sh = ss.insertSheet(def.nombre);
    (def.texto || []).forEach(col => sh.getRange(1, col, sh.getMaxRows(), 1).setNumberFormat("@"));
    sh.getRange(1, 1, 1, def.cab.length).setValues([def.cab]).setFontWeight("bold");
    sh.setFrozenRows(1);
    if (def.inicial && def.inicial.length) sh.getRange(2, 1, def.inicial.length, def.cab.length).setValues(def.inicial);
  } else {
    const ancho = Math.max(sh.getLastColumn(), 1);
    const actual = sh.getRange(1, 1, 1, ancho).getValues()[0].map(x => String(x).trim());
    if (actual.filter(x => x).length < def.cab.length) {
      const faltan = def.cab.slice(actual.filter(x => x).length);
      const desde = actual.filter(x => x).length + 1;
      sh.getRange(1, desde, 1, faltan.length).setValues([faltan]).setFontWeight("bold");
      (def.texto || []).filter(c => c >= desde).forEach(col => sh.getRange(1, col, sh.getMaxRows(), 1).setNumberFormat("@"));
    }
  }
  _THOJAS[k] = sh;
  return sh;
}

function tLeer_(def) {
  const sh = tHoja_(def);
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, def.cab.length).getValues();
}

function tAgregar_(def, filas) {
  if (!filas || !filas.length) return;
  const sh = tHoja_(def);
  const ancho = def.cab.length;
  const norm = filas.map(f => { const r = f.slice(0, ancho); while (r.length < ancho) r.push(""); return r; });
  sh.getRange(sh.getLastRow() + 1, 1, norm.length, ancho).setValues(norm);
}

// Reescribe la tabla dejando solo las filas que cumplen el filtro
function tReescribir_(def, filtro) {
  const sh = tHoja_(def);
  const filas = tLeer_(def);
  const quedan = filas.filter(filtro);
  if (quedan.length === filas.length) return 0;
  if (filas.length) sh.getRange(2, 1, filas.length, def.cab.length).clearContent();
  if (quedan.length) sh.getRange(2, 1, quedan.length, def.cab.length).setValues(quedan);
  return filas.length - quedan.length;
}

// Escribe valores en una fila (filaHoja = número real de fila, 2 = primera fila de datos)
function tEscribir_(def, filaHoja, colInicio, valores) {
  tHoja_(def).getRange(filaHoja, colInicio, 1, valores.length).setValues([valores]);
}

// Busca la primera fila que cumple la condición. Devuelve { fila (número en la hoja), datos } o null
function tBuscar_(def, cond) {
  const filas = tLeer_(def);
  for (let k = 0; k < filas.length; k++) if (cond(filas[k])) return { fila: k + 2, datos: filas[k], todas: filas };
  return null;
}

// =========================================================
// UTILIDADES COMUNES
// =========================================================
function ahora_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd HH:mm:ss"); }
function hoyISO_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd"); }
function txt_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, "yyyy-MM-dd HH:mm:ss");
  return String(v === null || v === undefined ? "" : v).trim();
}
function entero_(v) {
  const n = Number(String(v === null || v === undefined ? "" : v).replace(/[.\s]/g, "").replace(",", "."));
  return (String(v).trim() !== "" && isFinite(n) && Math.floor(n) === n) ? n : NaN;
}
function numero_(v) {
  if (v === null || v === undefined || String(v).trim() === "") return 0;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return isFinite(n) ? n : 0;
}
function conLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error("Otra persona está guardando en este momento. Intenta de nuevo.");
  try { return fn(); } finally { lock.releaseLock(); }
}
function nuevoId_(prefijo) {
  return prefijo + new Date().getTime().toString(36).toUpperCase() + Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0");
}
// "2026-09-27 14:05:00" -> "27/09 14:05"
function fechaCorta_(s) {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? `${m[3]}/${m[2]} ${m[4]}:${m[5]}` : String(s || "");
}
function soloHora_(s) {
  const m = String(s || "").match(/[ T](\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}
// Acepta "2026-09-27T14:05" (datetime-local) o "2026-09-27 14:05:00"; devuelve "yyyy-MM-dd HH:mm:ss" o ""
function normalizarFechaHora_(v) {
  const s = String(v || "").trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return "";
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6] || "00"}`;
}

;
// ===== 01_Telegram_Router.gs =====
// =========================================================
// 01 · BOT DE TELEGRAM: ENTRADA (doPost) Y COMANDOS
// =========================================================

// Chats autorizados. Si CHATS_PERMITIDOS está vacía, el bot responde a todos.
function chatPermitido_(chatId) {
  if (chatId === null || chatId === undefined) return true;
  const lista = prop_("CHATS_PERMITIDOS", "");
  if (!lista) return true;
  const ids = lista.split(",").map(x => x.trim()).filter(x => x);
  if (GRUPO_CALIDAD_ID) ids.push(String(GRUPO_CALIDAD_ID));
  return ids.includes(String(chatId));
}

function num(val, def) { if (def === undefined) def = 1; let n = parseInt(val, 10); return isNaN(n) ? def : n; }

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    // Pedido del dashboard nuevo (GitHub Pages): { accion: "sincronizar", token }.
    // No lleva la clave del webhook; se autoriza con la sesión de Supabase (26_Supabase).
    if (data && data.accion && data.update_id === undefined) return sbWebPost_(data);

    const secreto = prop_("WEBHOOK_SECRET", "");
    if (secreto && (!e.parameter || e.parameter.k !== secreto)) return;

    // Telegram reintenta el mismo update si la respuesta tarda: se procesa una sola vez
    if (data.update_id !== undefined) {
      const cacheUpd = CacheService.getScriptCache();
      const kUpd = "upd_" + data.update_id;
      if (cacheUpd.get(kUpd)) return;
      cacheUpd.put(kUpd, "1", 21600);
    }

    const chatOrigen = data.callback_query ? data.callback_query.message.chat.id : (data.message ? data.message.chat.id : null);
    if (!chatPermitido_(chatOrigen)) return;

    if (data.callback_query) {
      const cb = data.callback_query.data;
      const chatId = data.callback_query.message.chat.id;
      const messageId = data.callback_query.message.message_id;
      UrlFetchApp.fetch(TELEGRAM_API + "/answerCallbackQuery", { method: "post", contentType: "application/json", payload: JSON.stringify({ callback_query_id: data.callback_query.id }), muteHttpExceptions: true });

      const p = cb.split("|");
      const accion = p[0];

      // PDFs
      const pdfs = { PDFPOCOS: "POCOS", PDFCONSO: "CONSUMO", PDFCONSO2: "CONSUMO_SOLO", PDFRESUMEN: "RESUMEN", PDFRETORNABLE: "RETORNABLE", INFORME: "INFORME", VALPDF: "VALIDACION", ENTPDF: "ENTREGA", CONCPDF: "CONCILIACION", BARRPDF: "BARRILES", CARPAPDF: "CARPA" };
      if (pdfs[accion]) { enviarPDFBot_(chatId, pdfs[accion], p[1] || ""); return; }
      if (accion === "INSTRUCTIVO") { enviarInstructivoPDF(chatId); return; }

      if (accion === "LIMBO_ADD") {
        CacheService.getScriptCache().put("limbo_step_" + chatId, "NOMBRE", 600);
        enviarMensaje(chatId, "✏️ *Registro en Limbo*\n\n¿Cuál es el nombre del producto?");
        return;
      }
      if (accion === "LIMBOLIST") { let r = obtenerLimbo(); editarMensaje(chatId, messageId, r.text, r.markup); return; }

      let res = null;
      if (accion === "POCOS") res = obtenerStockCriticoCruzado(num(p[1]));
      else if (accion === "RESUMEN") res = obtenerResumen(num(p[1]));
      else if (accion === "FECH") res = obtenerFiltrosComunes(num(p[2]), "FECHAS", num(p[1], 60));
      else if (accion === "FECHAS") res = obtenerFiltrosComunes(num(p[1]), "FECHAS", num(p[2], 60));
      else if (accion === "VENCIDOS") res = obtenerFiltrosComunes(num(p[1]), "VENCIDOS");
      else if (accion === "BLOQ") res = obtenerFiltrosComunes(num(p[1]), "BLOQ");
      else if (accion === "PRIOR") res = obtenerFiltrosComunes(num(p[1]), "PRIOR");
      else if (accion === "TPC") res = obtenerFiltrosComunes(num(p[1]), "TPC");
      else if (accion === "REEMP") res = obtenerFiltrosComunes(num(p[1]), "REEMPAQUE");
      else if (accion === "CAND") res = obtenerCandados(num(p[1]));
      else if (accion === "MOD") res = obtenerPorModulo(p[1], num(p[2]));
      else if (accion === "FECEX") res = obtenerPorFechaExacta(p[1], num(p[2]));
      else if (accion === "WMS") res = buscarWMSOrdenadoPaginado(cbVal(p[1]), num(p[2]), p[3], num(p[4], 0));
      else if (accion === "GRUPO") res = buscarGrupoSKUs(cbVal(p[1]), num(p[2]), p[3] || "ALL", num(p[4], 0));
      else if (accion === "CARPA") res = obtenerCarpa(num(p[1]));
      else if (accion === "BARR") res = obtenerBarriles(num(p[1]));
      else if (accion === "INFIL") res = obtenerInfiltrados(num(p[1]));
      else if (accion === "MEZC") res = obtenerMezclados(num(p[1]));
      else if (accion === "CONSO") res = obtenerConsumo(num(p[1]));
      else if (accion === "CONSOL") res = obtenerConsolidar(num(p[1]));
      else if (accion === "CONSO_ASK") res = preguntarEliminarConsumo(p[1]);
      else if (accion === "CONSO_DEL") res = ejecutarEliminarConsumo(p[1]);
      else if (accion === "LIMBO_DEL") res = ejecutarEliminarLimbo(p[1]);
      else if (accion === "HUECOS") res = obtenerHuecos(num(p[1]));
      else if (accion === "VACIOS") res = obtenerVacios(num(p[1]));
      else if (accion === "AVAN") res = obtenerReportesAvanzados(p[1], num(p[2]));
      else if (accion === "ORG") res = obtenerOrganizar(num(p[1]));
      else if (accion === "ZONA") res = obtenerPorZona(p[1], num(p[2]));
      else if (accion === "RET") res = obtenerRetornables(num(p[1]));
      else if (accion === "SRCH") res = buscarFichaTecnicaPaginada(cbVal(p[1]), num(p[2]));
      else if (accion === "VAL") res = obtenerValidacionBot();
      else if (accion === "TURNO") res = obtenerTurnoBot();
      else if (accion === "CONC") res = obtenerConciliacionBot();
      else if (accion === "PRE") res = obtenerPreconciliacionBot();

      if (res) editarMensaje(chatId, messageId, res.text, res.markup);
      return;
    }

    if (!data.message) return;
    const chatId = data.message.chat.id;
    if (data.message.voice) { enviarMensaje(chatId, "⚠️ *Aviso:* El análisis por voz está desactivado. Por favor escribe tu consulta."); return; }
    if (data.message.text) { manejarIntencionLocal(data.message.text, chatId); return; }
  } catch (error) {
    console.error(error);
    let chatErr = null;
    try {
      let r = JSON.parse(e.postData.contents);
      if (r.message) chatErr = r.message.chat.id;
      else if (r.callback_query) chatErr = r.callback_query.message.chat.id;
    } catch (ex) {}
    if (chatErr) enviarMensaje(chatErr, "🐛 Error interno: " + error.message);
  }
}

// Genera cualquier PDF por tipo y lo envía al chat
function enviarPDFBot_(chatId, tipo, id) {
  enviarMensaje(chatId, "⏳ _Generando PDF..._");
  try {
    const r = construirPDFPorTipo_(tipo, id);
    enviarDocumento(chatId, r.blob, r.caption);
  } catch (err) { enviarMensaje(chatId, "❌ " + err.message); }
}

function manejarIntencionLocal(textoOriginal, chatId) {
  textoOriginal = String(textoOriginal).trim().replace(/^(\/[A-Za-z0-9_]+)@[A-Za-z0-9_]+/, "$1");
  const cmdLower = normalizarTexto(textoOriginal.toLowerCase().trim());
  const textoPuro = textoOriginal.trim();
  const cache = CacheService.getScriptCache();
  const responder = r => enviarMensaje(chatId, r.text, r.markup);

  // Registro en Limbo paso a paso
  let estadoLimbo = cache.get("limbo_step_" + chatId);
  if (estadoLimbo) {
    let dataLimbo = JSON.parse(cache.get("limbo_data_" + chatId) || "{}");
    if (cmdLower === "/cancelar") {
      cache.remove("limbo_step_" + chatId); cache.remove("limbo_data_" + chatId);
      enviarMensaje(chatId, "❌ Registro en Limbo cancelado."); return;
    }
    if (estadoLimbo === "NOMBRE") {
      dataLimbo.n = textoOriginal;
      cache.put("limbo_data_" + chatId, JSON.stringify(dataLimbo), 600); cache.put("limbo_step_" + chatId, "FECHA", 600);
      enviarMensaje(chatId, "📅 ¿Cuál es la fecha de vencimiento? (DD/MM/AAAA)\n\n_(Escribe /cancelar para salir)_"); return;
    }
    if (estadoLimbo === "FECHA") {
      let fN = normalizarFechaWMS(textoOriginal);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fN)) { enviarMensaje(chatId, "⚠️ Fecha inválida. Escríbela como DD/MM/AAAA\n\n_(Escribe /cancelar para salir)_"); return; }
      dataLimbo.f = fN;
      cache.put("limbo_data_" + chatId, JSON.stringify(dataLimbo), 600); cache.put("limbo_step_" + chatId, "PRES", 600);
      enviarMensaje(chatId, "📦 ¿Qué presentación tiene?\n\n_(Ej: Lata, Retornable, Pet, TW)_"); return;
    }
    if (estadoLimbo === "PRES") {
      dataLimbo.p = textoOriginal;
      cache.put("limbo_data_" + chatId, JSON.stringify(dataLimbo), 600); cache.put("limbo_step_" + chatId, "CUB", 600);
      enviarMensaje(chatId, "📐 ¿Cuál es el cubicaje o tamaño?\n\n_(Ej: 330cc, 1.5L, 30L)_"); return;
    }
    if (estadoLimbo === "CUB") {
      let r = agregarLimboCore_(dataLimbo.n, dataLimbo.f, dataLimbo.p, textoOriginal);
      if (!r.ok) { enviarMensaje(chatId, "⚠️ Error: " + r.error); return; }
      cache.remove("limbo_step_" + chatId); cache.remove("limbo_data_" + chatId);
      enviarMensaje(chatId, `✅ *Producto añadido al Limbo.*\n\nID asignado: \`${r.id}\``); return;
    }
  }

  // Calculadora de envasado: "07/09/2026 6"
  const matchEnvasado = textoPuro.match(/^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+(\d+)$/);
  if (matchEnvasado) { enviarMensaje(chatId, calcularEnvasado(matchEnvasado[1], parseInt(matchEnvasado[2], 10))); return; }
  if (cmdLower.startsWith("/envasado")) {
    let match = cmdLower.replace("/envasado", "").trim().match(/^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+(\d+)$/);
    if (match) enviarMensaje(chatId, calcularEnvasado(match[1], parseInt(match[2], 10)));
    else enviarMensaje(chatId, "⚠️ Formato: `/envasado DD/MM/YYYY MESES`\n\n(Ejemplo: `07/09/2026 6`)");
    return;
  }

  // Fecha exacta: "/fecha 11/03/2027" o solo "11/03/2027"
  const matchFecha = textoPuro.replace(/^\/fecha\s*/i, "").match(/^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})$/);
  if (matchFecha && (cmdLower.startsWith("/fecha ") || !cmdLower.startsWith("/"))) { responder(obtenerPorFechaExacta(matchFecha[1], 1)); return; }

  const saludos = ["/start", "/menu", "hola", "buenos dias", "buenas tardes", "buenas noches"];
  if (saludos.includes(cmdLower)) {
    let menu = "🤖 *𝐹𝓇𝑒𝒸𝓈! ツ*\n\n" +
      "📦 *OPERACIÓN*\n/buscar [texto]\n/sku [código]\n/grupo [cód1] [cód2]\n/pk\n/ka\n/carpa\n/barriles\n/retornable\n\n" +
      "🔄 *TURNOS*\n/turno\n/validacion\n/entrega\n/conciliacion\n/pre\n/consumo\n\n" +
      "📊 *AUDITORÍA Y CALIDAD*\n/informe\n/infiltrados\n/mezclados\n/limbo\n/malubicados\n/vencidos\n/fechas [días]\n/prioridades\n/tapacodigos\n/reempaque\n\n" +
      "⚙️ *GESTIÓN*\n/estado\n/resumen\n/candados\n/rotador\n/inteligencia\n\n" +
      textoReglasCanales_() + "\n\n" +
      "Pdta: Si no le saben léanse el manual, no sean flojos, aunque faltan algunas cositas por explicar. Me da flojera documentar, sorry";
    let teclado = [[{ text: "📄 Descargar Instructivo PDF", callback_data: "INSTRUCTIVO" }]];
    if (DASHBOARD_URL) teclado.push([{ text: "🌐 Abrir Dashboard", url: DASHBOARD_URL }]);
    enviarMensaje(chatId, menu, { inline_keyboard: teclado });
    return;
  }

  if (cmdLower === "/sincronizar" || cmdLower === "/refresh") { sincronizarWMS(chatId); return; }
  if (cmdLower === "/sincronizar forzar") { sincronizarWMS(chatId, true); return; }
  if (cmdLower === "/estado" || cmdLower === "/cache") { enviarMensaje(chatId, obtenerEstadoSync()); return; }
  if (cmdLower === "/informe") { enviarPDFBot_(chatId, "INFORME"); return; }

  // Turnos (la gestión completa se hace en el dashboard)
  if (cmdLower === "/turno" || cmdLower === "/turnos") { responder(obtenerTurnoBot()); return; }
  if (cmdLower === "/validacion" || cmdLower === "/validaciones") { responder(obtenerValidacionBot()); return; }
  if (cmdLower === "/entrega") { responder(obtenerEntregaBot()); return; }
  if (cmdLower === "/conciliacion") { responder(obtenerConciliacionBot()); return; }
  if (cmdLower === "/pre" || cmdLower === "/preconciliacion") { responder(obtenerPreconciliacionBot()); return; }

  // Zonas
  if (cmdLower === "/pk" || cmdLower === "/picking") { responder(obtenerPorZona("PK", 1)); return; }
  if (cmdLower === "/ka") { responder(obtenerPorZona("KA", 1)); return; }
  if (cmdLower === "/carpa") { responder(obtenerCarpa(1)); return; }
  if (cmdLower === "/barriles" || cmdLower === "/barril") { responder(obtenerBarriles(1)); return; }
  if (cmdLower === "/retornable" || cmdLower === "/retornables") { responder(obtenerRetornables(1)); return; }
  if (cmdLower === "/pdfretornable") { enviarPDFBot_(chatId, "RETORNABLE"); return; }

  // Limbo y consumo
  if (cmdLower === "/limbo") { responder(obtenerLimbo()); return; }
  if (cmdLower === "/limbo add") {
    cache.put("limbo_step_" + chatId, "NOMBRE", 600);
    enviarMensaje(chatId, "✏️ *Registro en Limbo*\n\n¿Cuál es el nombre del producto?");
    return;
  }
  if (cmdLower === "/consumo") { responder(obtenerConsumo(1)); return; }
  if (cmdLower.startsWith("/consumo add ")) { responder(agregarConsumo(textoPuro.substring(13).trim())); return; }
  if (cmdLower.startsWith("/consumo del ")) { responder(preguntarEliminarConsumo(textoPuro.substring(13).trim())); return; }

  if (cmdLower === "/candados") { responder(obtenerCandados(1)); return; }
  if (cmdLower === "/rotador") {
    enviarMensaje(chatId, "⚙️ *CALIDAD Y ROTACIÓN*\n\n/resumen\n/pocos\n/fechas\n/vencidos\n/bloqueados\n/prioridades\n/carpa\n/barriles\n/fecha DD/MM/AAAA\n\n" +
      "Poniendo una fecha y la cantidad de meses, calculará la fecha de envasado, example: 01/01/2026 6, calculara 6 meses hacia atrás. Simple lógica, no sean brutos malparidos");
    return;
  }
  if (cmdLower === "/inteligencia") {
    enviarMensaje(chatId, "🧠 *INTELIGENCIA Y SLOTTING*\n\n/organizar\n/infiltrados\n/mezclados\n/vacios\n/huecos\n/consolidar\n/acomodar [SKU] [FECHA]\n/malubicados\n/merma");
    return;
  }

  if (cmdLower === "/pdfpocos") { enviarPDFBot_(chatId, "POCOS"); return; }
  if (cmdLower === "/pocos" || cmdLower === "/criticos") { responder(obtenerStockCriticoCruzado(1)); return; }
  if (cmdLower === "/fechas" || cmdLower.startsWith("/fechas ")) {
    let dias = parseInt(cmdLower.replace("/fechas", "").trim(), 10); if (isNaN(dias)) dias = 60;
    responder(obtenerFiltrosComunes(1, "FECHAS", dias)); return;
  }
  if (cmdLower === "/vencidos" || cmdLower === "/vencido") { responder(obtenerFiltrosComunes(1, "VENCIDOS")); return; }
  if (cmdLower === "/bloqueados" || cmdLower === "/bloqueado") { responder(obtenerFiltrosComunes(1, "BLOQ")); return; }
  if (cmdLower === "/prioridades" || cmdLower === "/prioridad") { responder(obtenerFiltrosComunes(1, "PRIOR")); return; }
  if (cmdLower === "/tpc" || cmdLower === "/tapacodigo" || cmdLower === "/tapacodigos") { responder(obtenerFiltrosComunes(1, "TPC")); return; }
  if (cmdLower === "/reempaque" || cmdLower === "/reempaques") { responder(obtenerFiltrosComunes(1, "REEMPAQUE")); return; }

  if (cmdLower === "/resumen") { responder(obtenerResumen(1)); return; }
  if (cmdLower === "/vacios") { responder(obtenerVacios(1)); return; }
  if (cmdLower === "/huecos") { responder(obtenerHuecos(1)); return; }
  if (cmdLower === "/infiltrados") { responder(obtenerInfiltrados(1)); return; }
  if (cmdLower === "/mezclados" || cmdLower === "/mezclas") { responder(obtenerMezclados(1)); return; }
  if (cmdLower === "/consolidar") { responder(obtenerConsolidar(1)); return; }
  if (cmdLower === "/organizar") { responder(obtenerOrganizar(1)); return; }
  if (cmdLower === "/malubicados" || cmdLower === "/malubicado") { responder(obtenerReportesAvanzados("MALUBICADOS", 1)); return; }
  if (cmdLower === "/merma") { responder(obtenerReportesAvanzados("MERMA", 1)); return; }

  if (cmdLower.startsWith("/grupo ")) { responder(buscarGrupoSKUs(textoPuro.substring(7).trim(), 1, "ALL", 0)); return; }
  if (cmdLower.startsWith("/modulo ") || cmdLower.startsWith("/mod ")) { responder(obtenerPorModulo(cmdLower.replace(/^\/(modulo|mod)\s+/, "").trim(), 1)); return; }

  // /sku: número = stock WMS | texto = información de producto
  if (cmdLower.startsWith("/sku ")) {
    let query = textoPuro.substring(5).trim();
    responder(/^\d+$/.test(query) ? buscarWMSOrdenadoPaginado(query, 1, "ALL", 0) : buscarFichaTecnicaPaginada(query, 1));
    return;
  }
  if (cmdLower.startsWith("/buscar ")) { responder(buscarFichaTecnicaPaginada(textoPuro.substring(8).trim(), 1)); return; }
  if (cmdLower.startsWith("/acomodar ")) { responder(obtenerAcomodar(textoPuro.substring(10).trim())); return; }

  // Número directo = stock WMS
  if (/^\d+$/.test(cmdLower)) { responder(buscarWMSOrdenadoPaginado(cmdLower, 1, "ALL", 0)); return; }

  // Acceso rápido a módulos (/b, /b12, /m4, /h2, /ka3)
  if (cmdLower.startsWith("/") && cmdLower.split(" ")[0].length <= 7) {
    let m = cmdLower.split(" ")[0].substring(1).trim();
    if (m.length >= 1) {
      let r = obtenerPorModulo(m, 1);
      if (r && !r.vacio) { responder(r); return; }
    }
  }

  // Texto suelto = información de producto
  if (!cmdLower.startsWith("/")) { responder(buscarFichaTecnicaPaginada(textoPuro, 1)); return; }
}

;
// ===== 02_Telegram_Api.gs =====
// =========================================================
// 02 · API DE TELEGRAM Y BOTONES
// =========================================================
const TG_MAX = 4000;

function recortarTg_(t) {
  t = String(t);
  if (t.length <= TG_MAX) return t;
  return t.substring(0, TG_MAX - 80) + "\n\n… (mensaje recortado: usa Sig ➡️ o el dashboard para ver todo)";
}

function tgPost_(metodo, payload) {
  return UrlFetchApp.fetch(TELEGRAM_API + "/" + metodo, { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true });
}

// Intento 1: Markdown. Intento 2: texto plano con botones. Intento 3: texto plano sin botones.
function enviarMensaje(c, t, mk) {
  let p = { chat_id: c, text: recortarTg_(t), parse_mode: "Markdown" };
  if (mk) p.reply_markup = mk;
  let r = tgPost_("sendMessage", p);
  if (r.getResponseCode() === 200) return;
  delete p.parse_mode;
  r = tgPost_("sendMessage", p);
  if (r.getResponseCode() === 200) return;
  console.error("sendMessage: " + r.getContentText());
  if (p.reply_markup) { delete p.reply_markup; tgPost_("sendMessage", p); }
}

function editarMensaje(c, m, t, mk) {
  let p = { chat_id: c, message_id: m, text: recortarTg_(t), parse_mode: "Markdown" };
  if (mk) p.reply_markup = mk;
  let r = tgPost_("editMessageText", p);
  if (r.getResponseCode() === 200 || r.getContentText().indexOf("message is not modified") !== -1) return;
  delete p.parse_mode;
  r = tgPost_("editMessageText", p);
  if (r.getResponseCode() !== 200) console.error("editMessageText: " + r.getContentText());
}

function enviarDocumento(c, b, cap) {
  let r = UrlFetchApp.fetch(TELEGRAM_API + "/sendDocument", {
    method: "post",
    payload: { chat_id: String(c), document: b, caption: cap, parse_mode: "Markdown" },
    muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) {
    r = UrlFetchApp.fetch(TELEGRAM_API + "/sendDocument", { method: "post", payload: { chat_id: String(c), document: b, caption: String(cap || "").replace(/[*_`]/g, "") }, muteHttpExceptions: true });
  }
  return r.getResponseCode() === 200;
}

function escapeMd(t) { return (!t) ? "" : String(t).replace(/[_*[\]`]/g, '\\$&'); }

// SKU siempre antes del nombre: "`3659` · Poker Rn 750cc"
function skuProdMd_(sku, prod) { return `\`${sku}\` · ${escapeMd(prod)}`; }

// =========================================================
// BOTONES (callback_data máx. 64 bytes)
// =========================================================
// Si un texto no cabe en el botón, se guarda en caché y viaja una clave corta
function cbKey(texto) {
  let t = String(texto);
  if (Utilities.newBlob(t).getBytes().length <= 30 && t.indexOf("|") === -1) return t;
  let k = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, t)).replace(/=+$/, "").substring(0, 10);
  CacheService.getScriptCache().put("cbk_" + k, t, 21600);
  return "~" + k;
}

function cbVal(v) {
  let s = String(v === undefined || v === null ? "" : v);
  if (s.charAt(0) !== "~") return s;
  return CacheService.getScriptCache().get("cbk_" + s.substring(1)) || "";
}

function generarBotoneraPaginacion(a, p, t, l) {
  let b = [];
  if (p > 1) b.push({ text: "⬅️ Ant", callback_data: `${a}|${p - 1}` });
  if (t > p * l) b.push({ text: "Sig ➡️", callback_data: `${a}|${p + 1}` });
  return b.length > 0 ? { inline_keyboard: [b] } : null;
}

function tecladoWMS(sku, pag, f, tot, lim, showKA, cmd) {
  lim = lim || 10; showKA = showKA || 0; cmd = cmd || "WMS";
  sku = cbKey(sku);
  let n = [];
  if (pag > 1) n.push({ text: "⬅️ Ant", callback_data: `${cmd}|${sku}|${pag - 1}|${f}|${showKA}` });
  if (tot > pag * lim) n.push({ text: "Sig ➡️", callback_data: `${cmd}|${sku}|${pag + 1}|${f}|${showKA}` });
  let tk = [];
  if (n.length > 0) tk.push(n);
  tk.push([
    { text: f === "ALL" ? "🟢 Todos" : "Todos", callback_data: `${cmd}|${sku}|1|ALL|${showKA}` },
    { text: f === "DISP" ? "🟢 Disp" : "Disp", callback_data: `${cmd}|${sku}|1|DISP|${showKA}` }
  ]);
  tk.push([
    { text: f === "T1" ? "🟢 T1" : "T1", callback_data: `${cmd}|${sku}|1|T1|${showKA}` },
    { text: f === "T2" ? "🟢 T2" : "T2", callback_data: `${cmd}|${sku}|1|T2|${showKA}` },
    { text: f === "KA" ? "🟢 KA" : "KA", callback_data: `${cmd}|${sku}|1|KA|${showKA}` }
  ]);
  tk.push([{ text: showKA === 0 ? "👁️ Mostrar KA/PREV" : "🙈 Ocultar KA/PREV", callback_data: `${cmd}|${sku}|1|${f}|${showKA === 0 ? 1 : 0}` }]);
  return { inline_keyboard: tk };
}

;
// ===== 03_WMS_Sync.gs =====
// =========================================================
// 03 · SINCRONIZACIÓN CON EL WMS (solo GET)
// ---------------------------------------------------------
// - Página holgada (500 módulos). Si el WMS reporta más (records_filtered)
//   se pagina. Si al final no coinciden los conteos, NO se toca la base.
// - Módulos con el mismo nombre (F13, F20…): se toma el que tiene producto.
// - El campo "estado" del módulo se ignora: importa si tiene producto.
// - Nombres: "F aux1" -> H1 · "CARPA M4" -> M4 · el resto igual.
// - "Pasillo B aux1/aux2" (sección OPCIONAL) no existen: se omiten si están vacíos.
// =========================================================
const WMS_HEADERS = ["SKU", "Producto", "Modulo", "Estibas", "Cajas", "Unidades", "Vence", "Dias", "Estado", "Candado", "Carga", "Familia", "CPE", "Obs", "Picking", "Actualizacion"];
const WMS_MOD_HEADERS = ["Modulo", "Nombre_WMS", "Seccion", "Bodega", "Zona", "Picking", "Con_producto", "SKUs", "Lotes"];
const WMS_PAGINA = 500;
const WMS_MAX_PAGINAS = 20;
const WMS_MIN_PROPORCION = 0.7;

function urlModulosWMS_(start, length) {
  const filtros = [{ campo: "bodega__tipo", operador: "=", valor: "WMS", type: "text" }];
  return `${WMS_CONFIG.inventariosUrl}?activo=true&origen=WMS&cd_id=${WMS_CONFIG.cdId}` +
    `&filters=${encodeURIComponent(JSON.stringify(filtros))}` +
    `&search=${encodeURIComponent(JSON.stringify({ search: "" }))}` +
    `&paging=${encodeURIComponent(JSON.stringify({ start: start, length: length }))}`;
}

function getFakeHeaders() {
  const tk = CacheService.getScriptCache().get("wms_jwt_token");
  return {
    "Authorization": tk ? "Bearer " + tk : "",
    "X-CD-Id": WMS_CONFIG.cdId,
    "User-Agent": "Mozilla/5.0",
    "Accept-Language": "es-CO",
    "Origin": "https://wms.invalid",
    "Referer": "https://wms.invalid/"
  };
}

function obtenerTokenWMS() {
  let h = getFakeHeaders();
  delete h["Authorization"];
  const r = UrlFetchApp.fetch(WMS_CONFIG.loginUrl, {
    method: "post", contentType: "application/json", headers: h,
    payload: JSON.stringify({ username: WMS_CONFIG.username, password: WMS_CONFIG.password }),
    muteHttpExceptions: true
  });
  let d = null;
  try { d = JSON.parse(r.getContentText()); } catch (e) { d = null; }
  if (d && d.token) {
    CacheService.getScriptCache().put("wms_jwt_token", d.token, 7200);
    return d.token;
  }
  return null;
}

function getWMS_(url) {
  let h = getFakeHeaders();
  if (!h.Authorization) {
    obtenerTokenWMS();
    h = getFakeHeaders();
    if (!h.Authorization) return { ok: false, error: "Error de credenciales del WMS." };
  }
  let r = UrlFetchApp.fetch(url, { method: "get", headers: h, muteHttpExceptions: true });
  if (r.getResponseCode() === 401) {
    CacheService.getScriptCache().remove("wms_jwt_token");
    obtenerTokenWMS();
    h = getFakeHeaders();
    r = UrlFetchApp.fetch(url, { method: "get", headers: h, muteHttpExceptions: true });
  }
  if (r.getResponseCode() !== 200) return { ok: false, error: `El WMS respondió con código ${r.getResponseCode()}.` };
  let data = null;
  try { data = JSON.parse(r.getContentText()); } catch (ex) { data = null; }
  if (!data || !Array.isArray(data.results)) return { ok: false, error: "Respuesta del WMS no válida." };
  return { ok: true, data: data };
}

function traerModulosWMS_() {
  let todos = [];
  let total = null;
  let start = 0;
  for (let p = 0; p < WMS_MAX_PAGINAS; p++) {
    const r = getWMS_(urlModulosWMS_(start, WMS_PAGINA));
    if (!r.ok) return r;
    const res = r.data.results;
    const tf = parseInt(r.data.records_filtered, 10);
    if (!isNaN(tf)) total = tf;
    todos = todos.concat(res);
    start += res.length;
    if (res.length === 0) break;
    if (total !== null ? todos.length >= total : res.length < WMS_PAGINA) break;
  }
  if (total !== null && todos.length !== total) {
    return { ok: false, error: `El WMS reporta ${total} módulos pero llegaron ${todos.length}. No se actualizó la base.` };
  }
  return { ok: true, modulos: todos, total: total !== null ? total : todos.length };
}

function tieneProductoInv_(i) {
  return (Number(i.total_estibas) || 0) > 0 || (Number(i.total_cajas) || 0) > 0 || (Number(i.total_unidades) || 0) > 0;
}

function unificarModulos_(modulos) {
  let porNombre = {};
  let orden = [];
  modulos.forEach(m => {
    const nombre = limpiarModulo(m.nombre || "");
    const invs = Array.isArray(m.inventarios) ? m.inventarios : [];
    if (!porNombre[nombre]) { porNombre[nombre] = []; orden.push(nombre); }
    porNombre[nombre].push({ m: m, invs: invs, conProd: invs.some(tieneProductoInv_) });
  });
  let salida = [];
  let repetidos = [];
  orden.forEach(n => {
    const lista = porNombre[n];
    if (zonaModulo_(n) === "OPCIONAL" && !lista.some(x => x.conProd)) return;
    if (lista.length > 1) repetidos.push(n);
    let elegidos = lista.filter(x => x.conProd);
    if (!elegidos.length) elegidos = [lista.find(x => x.invs.length > 0) || lista[0]];
    salida.push({
      nombre: n,
      wms: elegidos[0].m,
      invs: [].concat.apply([], elegidos.map(x => x.invs)),
      picking: elegidos.some(x => x.m.es_picking === true)
    });
  });
  return { modulos: salida, repetidos: repetidos };
}

function escribirTabla_(sheet, headers, filas) {
  const valores = [headers].concat(filas);
  sheet.getRange(1, 1, valores.length, headers.length).setValues(valores);
  const ultima = sheet.getLastRow();
  if (ultima > valores.length) {
    sheet.getRange(valores.length + 1, 1, ultima - valores.length, Math.max(sheet.getLastColumn(), headers.length)).clearContent();
  }
}

// forzar = true salta la verificación del 70 % (solo cuando la bajada es real)
// La sincronización NO toma el bloqueo general mientras consulta el WMS y escribe
// WMS_Base: antes lo tenía durante toda la bajada (10–30 s o más) y cualquier
// guardado del dashboard (validar, entrega, conciliación) quedaba esperando o fallaba.
// Ahora solo usa el bloqueo un instante para marcar "sincronización en curso"
// (evita dos a la vez) y los turnos siguen guardando mientras tanto: escriben en
// otros archivos, no en WMS_Base.
function marcarSyncEnCurso_() {
  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return false;
  try {
    if (cache.get("sync_en_curso")) return false;
    cache.put("sync_en_curso", String(new Date().getTime()), 300); // se libera sola a los 5 min si algo falla
    return true;
  } finally { lock.releaseLock(); }
}

function sincronizarWMSCore(forzar) {
  if (!marcarSyncEnCurso_()) return { ok: false, error: "Ya hay una sincronización en curso. Intenta en un minuto." };
  try {
    const t = traerModulosWMS_();
    if (!t.ok) return t;
    const u = unificarModulos_(t.modulos);

    let flatData = [];
    let filasMod = [];
    let maxMovimiento = 0;

    u.modulos.forEach(mod => {
      let skus = new Set();
      let lotes = 0;
      mod.invs.forEach(i => {
        let fAct = i.fecha_ultima_actualizacion || "";
        if (fAct) {
          let tm = new Date(fAct).getTime();
          if (!isNaN(tm) && tm > maxMovimiento) maxMovimiento = tm;
        }
        let dias = i.dias_por_vencer;
        if (dias === null || dias === undefined || dias === "" || isNaN(Number(dias))) {
          dias = i.fecha_vencimiento ? diasHastaFecha_(i.fecha_vencimiento) : 9999;
        } else {
          dias = Number(dias);
        }
        flatData.push([
          String(i.producto_sku).trim(),
          i.producto_descripcion,
          mod.nombre,
          Number(i.total_estibas) || 0,
          Number(i.total_cajas) || 0,
          Number(i.total_unidades) || 0,
          i.fecha_vencimiento || "",
          dias,
          (i.estado_inventario_nombre || "").toUpperCase(),
          i.candado_codigo || "",
          i.fecha_carga || "",
          (i.familia_nombre || "").toUpperCase(),
          Number(i.producto_cajas_por_estiba) || 1,
          i.observaciones || "",
          mod.picking || i.es_picking === true,
          fAct
        ]);
        if (tieneProductoInv_(i)) { skus.add(String(i.producto_sku).trim()); lotes++; }
      });
      const w = mod.wms;
      filasMod.push([mod.nombre, String(w.nombre || ""), String(w.section_nombre || ""), String(w.bodega_nombre || ""), zonaModulo_(mod.nombre), mod.picking, lotes > 0, skus.size, lotes]);
    });

    const conProducto = flatData.filter(r => r[3] > 0 || r[4] > 0 || r[5] > 0).length;
    if (conProducto === 0) return { ok: false, error: "El WMS no devolvió inventario. La base anterior se conserva." };

    const props = PropertiesService.getScriptProperties();
    const previo = parseInt(props.getProperty("wms_last_rows") || "0", 10) || 0;
    if (!forzar && previo >= 50 && conProducto < previo * WMS_MIN_PROPORCION) {
      return { ok: false, error: `El WMS devolvió ${conProducto} ubicaciones con producto y la última vez fueron ${previo}. Por seguridad no se reemplazó la base. Si la bajada es real, usa /sincronizar forzar.` };
    }

    const sheet = hoja_("WMS_Base");
    if (!sheet) return { ok: false, error: "No existe la pestaña 'WMS_Base'." };
    sheet.getRange("G:G").setNumberFormat("@");
    sheet.getRange("K:K").setNumberFormat("@");
    sheet.getRange("P:P").setNumberFormat("@");
    escribirTabla_(sheet, WMS_HEADERS, flatData);

    let shMod = hoja_("WMS_Modulos");
    if (!shMod) { shMod = ss_().insertSheet("WMS_Modulos"); shMod.setFrozenRows(1); }
    shMod.getRange("A:D").setNumberFormat("@");
    escribirTabla_(shMod, WMS_MOD_HEADERS, filasMod);
    SpreadsheetApp.flush();

    props.setProperty("wms_last_sync_ts", new Date().getTime().toString());
    props.setProperty("wms_last_rows", String(conProducto));
    props.setProperty("wms_last_modules", String(u.modulos.length));
    if (maxMovimiento > 0) props.setProperty("wms_last_movement_ts", maxMovimiento.toString());
    _INV_CACHE = null;
    _MOD_CACHE = null;
    cacheBorrar_("inv");
    cacheBorrar_("wmsdisp");
    if (u.repetidos.length) console.log("Módulos repetidos unificados: " + u.repetidos.join(", "));
    // Migración: la misma sincronización se escribe también en Supabase (si está configurado).
    // Si Supabase falla, las hojas ya quedaron bien: solo se deja el aviso.
    let supabase = null;
    if (sbActivo_()) {
      try { supabase = sbSubirWms_(flatData, filasMod, { ultimo: maxMovimiento, filas: conProducto, modulos: u.modulos.length }); }
      catch (e) { console.error("Supabase: " + e.message); supabase = { error: e.message }; }
    }
    return { ok: true, filas: flatData.length, fisicas: conProducto, modulos: u.modulos.length, repetidos: u.repetidos.length, total: t.total, supabase: supabase };
  } finally {
    try { CacheService.getScriptCache().remove("sync_en_curso"); } catch (e) {}
  }
}

function sincronizarWMS(chatId, forzar) {
  const r = sincronizarWMSCore(forzar === true);
  if (!r.ok) { enviarMensaje(chatId, "❌ " + r.error); return r; }
  if (String(chatId) !== String(GRUPO_CALIDAD_ID)) {
    enviarMensaje(chatId, `✅ *Base actualizada.*\n\n${fM(r.fisicas)} ubicaciones con producto en ${fM(r.modulos)} módulos.`);
  }
  return r;
}

// =========================================================
// CACHÉ EN SERVIDOR (CacheService, en trozos)
// =========================================================
function cacheGuardar_(clave, texto, segundos) {
  const c = CacheService.getScriptCache();
  const TAM = 45000; // CacheService admite 100 KB por clave; con tildes un carácter puede ocupar 2 bytes
  const partes = Math.ceil(texto.length / TAM) || 1;
  if (partes > 40) return;
  let obj = {};
  for (let k = 0; k < partes; k++) obj[`${clave}_${k}`] = texto.substring(k * TAM, (k + 1) * TAM);
  obj[`${clave}_n`] = String(partes);
  try { c.putAll(obj, segundos || 300); } catch (e) { console.error("cache: " + e); }
}

function cacheLeer_(clave) {
  const c = CacheService.getScriptCache();
  const n = parseInt(c.get(`${clave}_n`) || "0", 10);
  if (!n) return null;
  const claves = [];
  for (let k = 0; k < n; k++) claves.push(`${clave}_${k}`);
  const m = c.getAll(claves);
  let s = "";
  for (let k = 0; k < n; k++) { if (m[claves[k]] === undefined || m[claves[k]] === null) return null; s += m[claves[k]]; }
  return s;
}

function cacheBorrar_(clave) { try { CacheService.getScriptCache().remove(`${clave}_n`); } catch (e) {} }

;
// ===== 04_Inventario_Utils.gs =====
// =========================================================
// 04 · INVENTARIO, MAESTRO SKU, CANALES Y CAPACIDAD
// =========================================================

// ---------------------------------------------------------
// 1. LECTURA DE LA BASE LOCAL (WMS_Base y WMS_Modulos)
// ---------------------------------------------------------
let _INV_CACHE = null;
function obtenerInventarioLocal() {
  if (_INV_CACHE) return _INV_CACHE.map(x => Object.assign({}, x));
  const sheet = hoja_("WMS_Base");
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  let inv = [];
  for (let j = 1; j < data.length; j++) {
    const r = data[j];
    if (String(r[0]).trim() === "" && String(r[2]).trim() === "") continue;
    const obsNorm = normalizarTexto((String(r[13]) || "").toLowerCase());
    const e = parseInt(r[3], 10) || 0;
    const c = parseInt(r[4], 10) || 0;
    const u = parseInt(String(r[5]).replace(/[.,\s]/g, ""), 10) || 0;
    let d = parseInt(r[7], 10);
    if (isNaN(d)) d = 9999;
    inv.push({
      s: String(r[0]).trim(), p: String(r[1]), m: limpiarModulo(r[2]),
      e: e, c: c, u: u,
      v: normalizarVence_(r[6]), d: d, est: String(r[8]).trim().toUpperCase(), cand: String(r[9]), carga: textoFechaHora_(r[10]),
      fam: String(r[11]).toUpperCase(), cpe: parseInt(r[12], 10) || 1, obs: String(r[13]),
      pick: r[14] === true || String(r[14]).toUpperCase() === "TRUE", act: textoFechaHora_(r[15]),
      prio: obsNorm.includes("prioridad"),
      tpc: obsNorm.includes("tpc") || obsNorm.includes("tapacodigo") || obsNorm.includes("tapa codigo"),
      reempaque: obsNorm.includes("reempaque") || obsNorm.includes("rempaque"),
      tieneFisico: e > 0 || c > 0 || u > 0
    });
  }
  _INV_CACHE = inv;
  return inv.map(x => Object.assign({}, x));
}

let _MOD_CACHE = null;
function obtenerModulosLocal() {
  if (_MOD_CACHE) return _MOD_CACHE.map(x => Object.assign({}, x));
  const sh = hoja_("WMS_Modulos");
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  let lis = [];
  for (let j = 1; j < data.length; j++) {
    const r = data[j];
    const m = limpiarModulo(r[0]);
    if (!m || m === "N/A") continue;
    lis.push({
      m: m, nombreWms: String(r[1]), seccion: String(r[2]), bodega: String(r[3]), zona: String(r[4]) || zonaModulo_(m),
      pick: r[5] === true || String(r[5]).toUpperCase() === "TRUE",
      conProducto: r[6] === true || String(r[6]).toUpperCase() === "TRUE",
      skus: parseInt(r[7], 10) || 0, lotes: parseInt(r[8], 10) || 0
    });
  }
  _MOD_CACHE = lis;
  return lis.map(x => Object.assign({}, x));
}

// ---------------------------------------------------------
// 2. NOMBRES Y ZONAS DE MÓDULO
// ---------------------------------------------------------
// "F aux1" -> H1 · "CARPA M4" -> M4 · el resto igual en mayúsculas (KA3, PREV12, ANTIGUO 1, BARRILES…)
function limpiarModulo(m) {
  if (m === null || m === undefined || String(m).trim() === "") return "N/A";
  const s = String(m).trim().replace(/\s+/g, " ").toUpperCase();
  let x = s.match(/^F\s*AUX\s*(\d+)$/);
  if (x) return "H" + parseInt(x[1], 10);
  x = s.match(/^CARPA\s*M\s*(\d+)$/);
  if (x) return "M" + parseInt(x[1], 10);
  return s;
}

function zonaModulo_(m) {
  m = String(m || "").toUpperCase();
  if (/^KA\d+$/.test(m)) return "KA";
  if (/^PREV\d+$/.test(m) || /^PICKING PREV/.test(m)) return "PREV";
  if (/^M([1-9]|1[0-5])$/.test(m)) return "CARPA";
  if (/^H\d+$/.test(m)) return "H";
  if (m === "BARRILES") return "BARRILES";
  if (/^ANTIGUO/.test(m)) return "ANTIGUO";
  if (/^PASILLO/.test(m)) return "OPCIONAL";
  if (/^[A-J]\d+$/.test(m)) return "BODEGA";
  return "OTRO";
}

function esModuloCarpa(m) { return zonaModulo_(limpiarModulo(m)) === "CARPA"; }
function esZonaKA_(m) { return zonaModulo_(m) === "KA"; }
function esZonaPK_(i) { return zonaModulo_(i.m) === "PREV" || i.pick; }
// KA y Picking/Preventa (zonas de surtido)
function esZonaOperativa(i) { return esZonaKA_(i.m) || esZonaPK_(i); }
// Bodega de almacenamiento (todo lo que no es KA, PREV, picking ni carpa)
function esZonaBodega_(i) { return !esZonaOperativa(i) && zonaModulo_(i.m) !== "CARPA"; }

// ---------------------------------------------------------
// 3. FECHAS Y FORMATOS
// ---------------------------------------------------------
function normalizarVence_(val) {
  if (val instanceof Date) return Utilities.formatDate(val, tzHoja_(), "yyyy-MM-dd");
  let s = String(val === null || val === undefined ? "" : val).trim();
  if (!s) return "";
  let t = s.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  let n = normalizarFechaWMS(t);
  if (/^\d{4}-\d{2}-\d{2}$/.test(n)) return n;
  let d = new Date(s);
  return isNaN(d.getTime()) ? s : Utilities.formatDate(d, tzHoja_(), "yyyy-MM-dd");
}

function textoFechaHora_(val) {
  if (val instanceof Date) return val.toISOString();
  return String(val === null || val === undefined ? "" : val);
}

let _TZ_HOJA = null;
function tzHoja_() {
  if (!_TZ_HOJA) { try { _TZ_HOJA = ss_().getSpreadsheetTimeZone() || TZ; } catch (e) { _TZ_HOJA = TZ; } }
  return _TZ_HOJA;
}

function tV(v) {
  let s = String(v || "");
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)).getTime();
  let t = new Date(s).getTime();
  return isNaN(t) ? 8.64e15 : t;
}

// Estibas reales: total_cajas ya incluye las cajas de las estibas
function estibasEq(i) { return i.cpe > 1 ? i.c / i.cpe : i.e; }

function diasHastaFecha_(v) {
  let t = tV(normalizarVence_(v));
  if (t >= 8.64e15) return 9999;
  let hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return Math.round((t - hoy.getTime()) / 86400000);
}

function formatearFecha(f) {
  if (!f) return "N/A";
  try {
    if (f instanceof Date) return Utilities.formatDate(f, tzHoja_(), "dd/MM/yyyy");
    let s = String(f).trim();
    let tSplit = s.split("T")[0];
    if (tSplit.includes("-")) {
      const p = tSplit.split("-");
      if (p.length === 3 && p[0].length === 4) return `${p[2]}/${p[1]}/${p[0]}`;
    }
    let dObj = new Date(s);
    if (!isNaN(dObj.getTime())) return `${String(dObj.getDate()).padStart(2, "0")}/${String(dObj.getMonth() + 1).padStart(2, "0")}/${dObj.getFullYear()}`;
    return s;
  } catch (e) { return String(f); }
}

function fVD(v, d) {
  if (!v || v === "N/A" || v === "") return "Sin fecha";
  let ds = (d >= 0 && d !== 9999) ? `${d} días` : "Vencido";
  return `${formatearFecha(v)} (${ds})`;
}

function fM(num) {
  if (num === null || num === undefined || num === "") return "0";
  const n = Math.round(Number(num) * 10) / 10;
  if (!isFinite(n)) return "0";
  const partes = String(Math.abs(n)).split(".");
  const ent = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (n < 0 ? "-" : "") + ent + (partes[1] ? "," + partes[1] : "");
}

function normalizarTexto(t) {
  if (!t) return "";
  let r = String(t).replace(/ñ/g, "##ene##").replace(/Ñ/g, "##ENE##");
  r = r.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return r.replace(/##ene##/g, "ñ").replace(/##ENE##/g, "Ñ");
}

function normalizarFechaWMS(t) {
  let p = String(t).trim().split(/[\/\-]/);
  if (p.length === 3) {
    if (p[0].length === 4) return `${p[0]}-${p[1].padStart(2, "0")}-${p[2].padStart(2, "0")}`;
    if (p[2].length === 4) return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
    if (p[2].length === 2) return `20${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
  }
  return String(t).trim();
}

function obtenerTipoEmpaque(nombreProducto) {
  if (!nombreProducto) return "Cajas";
  let n = " " + normalizarTexto(String(nombreProducto).toLowerCase()) + " ";
  if (/(?:[\s_]|^)x\s*4(?:[\s_]|$)/.test(n)) return "Fourpacks";
  if (/(?:[\s_]|^)x\s*6(?:[\s_]|$)/.test(n)) return "Sixpacks";
  if (/(?:[\s_]|^)x\s*12(?:[\s_]|$)/.test(n)) return "Decenas";
  if (/(?:[\s_]|^)x\s*1(?:[\s_]|$)/.test(n)) return "Unidades";
  return "Cajas";
}

// Cantidades con nombre completo (vertical, para el bot)
function formatoCantidades(e, c, u, nombreProducto) {
  return `Estibas: ${fM(e)}\n${obtenerTipoEmpaque(nombreProducto)}: ${fM(c)}\nUnidades: ${fM(u)}`;
}
// Cantidades con nombre completo en una línea: "Estibas: 3 | Cajas: 120 | Unidades: 0"
function cantLinea_(e, c, u, nombreProducto) {
  return `Estibas: ${fM(e)} | ${obtenerTipoEmpaque(nombreProducto)}: ${fM(c)} | Unidades: ${fM(u)}`;
}

function formatoActualizacion(fechaVal) {
  if (!fechaVal || fechaVal === "N/A") return "N/A";
  let d = new Date(fechaVal);
  if (isNaN(d.getTime())) return "N/A";
  let diffMins = Math.max(0, Math.floor((new Date().getTime() - d.getTime()) / 60000));
  let hrs = Math.floor(diffMins / 60), mins = diffMins % 60, dias = Math.floor(hrs / 24);
  let emoji = "🟢";
  if (hrs >= 8 && hrs < 16) emoji = "🟡";
  else if (hrs >= 16 && hrs < 24) emoji = "🟠";
  else if (hrs >= 24) emoji = "🔴";
  let str = dias > 0 ? `${dias}d ${hrs % 24}h` : (hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`);
  return `${emoji} hace ${str}`;
}

function obtenerEstadoSync() {
  const pr = PropertiesService.getScriptProperties();
  let ts = pr.getProperty("wms_last_sync_ts");
  let tsWms = pr.getProperty("wms_last_movement_ts");
  let txtSync = "🔴 _Sin sincronizar_";
  if (ts) {
    let diffMins = Math.max(0, Math.floor((new Date().getTime() - parseInt(ts, 10)) / 60000));
    let hrs = Math.floor(diffMins / 60), mins = diffMins % 60;
    txtSync = `Bot Act: hace ${hrs > 0 ? hrs + "h " + mins + "m" : mins + "m"}`;
  }
  return `⏱️ _${txtSync}_\n🏭 *Últ. movimiento WMS:* ${tsWms ? formatoActualizacion(parseInt(tsWms, 10)) : "N/A"}`;
}

function obtenerEtiquetasVisuales(i) {
  let tags = "";
  if (i.prio) tags += "\n🚨 *[PRIORIDAD]*";
  if (i.tpc) tags += "\n🏷️ *(Tapacódigo)*";
  if (i.reempaque) tags += "\n📦 *(Reempaque)*";
  return tags;
}

// Escala de vida útil: <0 gris | 0-29 rojo | 30-45 amarillo | 46-90 verde claro | >90 verde oscuro
function vidaUtilInfo(dias) {
  let d = parseInt(dias, 10);
  if (isNaN(d) || d === 9999) return { clave: "sin", color: "#ffffff", texto: "Sin fecha" };
  if (d < 0) return { clave: "venc", color: "#d9d9d9", texto: "Vencido" };
  if (d < 30) return { clave: "rojo", color: "#ffcccc", texto: "Menos de 30 días" };
  if (d <= 45) return { clave: "amar", color: "#fff2cc", texto: "30 a 45 días" };
  if (d <= 90) return { clave: "vcla", color: "#e2efda", texto: "46 a 90 días" };
  return { clave: "vosc", color: "#a9d08e", texto: "Más de 90 días" };
}

function esFamiliaRetornable(fam) {
  let f = String(fam || "").toUpperCase().trim();
  return f.includes("RETORNABLE") && !f.includes("NO RETORNABLE");
}
function esProductoRetornable(fam, prod) {
  let p = String(prod || "").toUpperCase();
  return esFamiliaRetornable(fam) || (p.includes("RETORNABLE") && !p.includes("NO RETORNABLE")) || /(?:^|\s)RET(?:$|\s)/.test(p);
}

// ---------------------------------------------------------
// 4. MAESTRO DE PRODUCTOS (pestaña Sku, leída por encabezados)
// ---------------------------------------------------------
// Las columnas se buscan por nombre, así que se pueden reorganizar.
const SKU_CAMPOS = {
  id: ["id"], sku: ["sku", "codigo"], prod: ["producto", "descripcion", "nombre"],
  cub: ["cubicaje"], piso: ["piso"], plancha: ["plancha"],
  cantEst: ["cantxestibas", "cantxestiba", "cantidadxestiba", "cantidadxestibas", "cantidadporestiba", "estibado", "cajasxestiba", "cajasporestiba"],
  pres: ["presentacion"], usuario: ["usuario"], ctx: ["contexto"],
  minimo: ["minimo", "minimoestibas"], t1: ["t1"], t2: ["t2"], ka: ["ka"],
  estCara: ["estibasporcara", "estibasxcara", "porcara"]
};
const SKU_ENCABEZADOS = { id: "Id", sku: "SKU", prod: "Producto", cub: "Cubicaje", piso: "Piso", plancha: "Plancha", cantEst: "Cant x Estibas", pres: "Presentacion", usuario: "Usuario", ctx: "Contexto", minimo: "Minimo", t1: "T1", t2: "T2", ka: "KA", estCara: "Estibas_por_cara" };

function claveEncabezado_(t) { return normalizarTexto(String(t || "")).toLowerCase().replace(/[^a-z0-9ñ]/g, ""); }

let _SKU = null;
function leerSku_() {
  if (_SKU) return _SKU;
  const sh = hoja_("Sku");
  if (!sh) { _SKU = { sh: null, cols: {}, lista: [], mapa: {} }; return _SKU; }
  let data = sh.getDataRange().getValues();
  let cab = (data[0] || []).map(claveEncabezado_);
  let cols = {};
  Object.keys(SKU_CAMPOS).forEach(k => {
    const idx = cab.findIndex(c => SKU_CAMPOS[k].includes(c));
    if (idx !== -1) cols[k] = idx;
  });
  // Columnas nuevas que faltan: se agregan al final con su encabezado
  const faltan = ["minimo", "t1", "t2", "ka", "estCara"].filter(k => cols[k] === undefined);
  if (faltan.length && cols.sku !== undefined) {
    let col = sh.getLastColumn();
    faltan.forEach(k => { sh.getRange(1, col + 1).setValue(SKU_ENCABEZADOS[k]).setFontWeight("bold"); cols[k] = col; col++; });
  }
  if (cols.sku === undefined) cols.sku = 1;
  if (cols.prod === undefined) cols.prod = 2;
  const num = v => { const s = String(v === null || v === undefined ? "" : v).trim(); if (!s) return null; const n = Number(s.replace(",", ".")); return isFinite(n) ? n : null; };
  const val = (r, k) => cols[k] === undefined ? "" : r[cols[k]];
  let lista = [], mapa = {};
  for (let j = 1; j < data.length; j++) {
    const r = data[j];
    const sku = String(val(r, "sku")).trim();
    if (!sku) continue;
    const o = {
      fila: j + 1, idHoja: String(val(r, "id")), sku: sku, prod: String(val(r, "prod")), cub: String(val(r, "cub")), piso: String(val(r, "piso")),
      plancha: String(val(r, "plancha")), cantEst: String(val(r, "cantEst")), pres: String(val(r, "pres")),
      usuario: String(val(r, "usuario")), ctx: String(val(r, "ctx")),
      minimo: num(val(r, "minimo")), t1: num(val(r, "t1")), t2: num(val(r, "t2")), ka: num(val(r, "ka")), estCara: num(val(r, "estCara"))
    };
    if (!mapa[sku]) { mapa[sku] = o; lista.push(o); }
  }
  _SKU = { sh: sh, cols: cols, lista: lista, mapa: mapa };
  migrarKa12026_();
  return _SKU;
}
function skuInfo_(sku) { return leerSku_().mapa[String(sku).trim()] || null; }
function catalogoSku_() { return leerSku_().lista; }
function invalidarSku_() { _SKU = null; cacheBorrar_("inv"); }

// Estibas mínimas para que un SKU no sea "poco" (columna Minimo; vacío = POCOS_DEFECTO)
function minimoSku_(sku) {
  const s = skuInfo_(sku);
  return (s && s.minimo !== null && s.minimo >= 0) ? s.minimo : POCOS_DEFECTO;
}

// El SKU 12026 tenía KA 10 en el código viejo: se pasa una vez a la columna KA
function migrarKa12026_() {
  const pr = PropertiesService.getScriptProperties();
  if (pr.getProperty("mig_ka_12026")) return;
  pr.setProperty("mig_ka_12026", "1");
  try {
    const o = _SKU.mapa["12026"];
    if (o && o.ka === null && _SKU.cols.ka !== undefined) { _SKU.sh.getRange(o.fila, _SKU.cols.ka + 1).setValue(10); o.ka = 10; }
  } catch (e) { console.error(e); }
}

// ---------------------------------------------------------
// 5. CANALES (T1, T2, KA)
// Prioridad: columna del SKU (T1/T2/KA en Sku) → regla Familia/Contiene de la
// pestaña Canales (la primera que coincida, en el orden de la hoja) → regla
// General de Canales → respaldo del código (90/30/120, KA 45 retornable/PET/malta).
// ---------------------------------------------------------
const CANALES_DEF = {
  libro: "MAIN", nombre: "Canales", cab: ["Canal", "Tipo", "Valor", "Dias_minimos", "Nota"], texto: [1, 2, 3, 5],
  inicial: [
    ["T1", "General", "", 90, "Regla para todos los productos"],
    ["T2", "General", "", 30, "Regla para todos los productos"],
    ["KA", "General", "", 120, "Regla para todos los productos"],
    ["KA", "Familia", "RETORNABLE", 45, "Retornables salen a KA con 45 días"],
    ["KA", "Familia", "PET", 45, "PET sale a KA con 45 días"],
    ["KA", "Contiene", "MALTA", 45, "Productos con \"MALTA\" en el nombre"]
  ]
};

let _CANALES = null;
function leerCanales_() {
  if (_CANALES) return _CANALES;
  _CANALES = tLeer_(CANALES_DEF).map((r, k) => ({
    fila: k + 2, canal: txt_(r[0]).toUpperCase(), tipo: normalizarTexto(txt_(r[1])).toUpperCase(),
    valor: normalizarTexto(txt_(r[2])).toUpperCase(), dias: numero_(r[3]), diasTxt: txt_(r[3]), nota: txt_(r[4])
  })).filter(x => x.canal && x.diasTxt !== "");
  return _CANALES;
}

function diasMinimos_(canal, fam, sku, prod) {
  canal = String(canal).toUpperCase();
  const s = skuInfo_(sku);
  const k = canal === "T1" ? "t1" : canal === "T2" ? "t2" : "ka";
  if (s && s[k] !== null && s[k] >= 0) return s[k];
  const f = normalizarTexto(String(fam || "")).toUpperCase();
  const p = normalizarTexto(String(prod || "")).toUpperCase();
  let reglas = [];
  try { reglas = leerCanales_().filter(r => r.canal === canal); } catch (e) { reglas = []; }
  for (const r of reglas) {
    if (!r.valor) continue;
    if (r.tipo === "FAMILIA" && f.includes(r.valor) && !f.includes("NO " + r.valor)) return r.dias;
    if (r.tipo === "CONTIENE" && (p.includes(r.valor) || f.includes(r.valor))) return r.dias;
  }
  const gen = reglas.find(r => r.tipo === "GENERAL");
  if (gen) return gen.dias;
  if (canal === "T1") return 90;
  if (canal === "T2") return 30;
  if (f.includes("PET") || esFamiliaRetornable(f) || p.includes("MALTA") || f.includes("MALTA")) return 45;
  return 120;
}

function kaMinimo(fam, sku, prod) { return diasMinimos_("KA", fam, sku, prod); }

function evaluarCanales(dias, fam, sku, prod) {
  const min = { T1: diasMinimos_("T1", fam, sku, prod), T2: diasMinimos_("T2", fam, sku, prod), KA: diasMinimos_("KA", fam, sku, prod) };
  if (dias === null || dias === undefined || isNaN(dias) || dias < 0 || dias === 9999) return { T1: false, T2: false, KA: false, min: min };
  return { T1: dias >= min.T1, T2: dias >= min.T2, KA: dias >= min.KA, min: min };
}

// Texto de las reglas generales (menú del bot)
function textoReglasCanales_() {
  try {
    const r = leerCanales_();
    const lin = ["T1", "T2", "KA"].map(c => {
      const g = r.find(x => x.canal === c && x.tipo === "GENERAL");
      const ex = r.filter(x => x.canal === c && x.tipo !== "GENERAL");
      return `${c}: mínimo ${g ? g.dias : "?"} días${ex.length ? ` (excepciones: ${ex.map(x => `${x.valor.toLowerCase()} ${x.dias}`).join(", ")})` : ""}`;
    });
    return lin.join("\n") + "\nAlgunos SKU tienen su propio mínimo en la hoja Sku.";
  } catch (e) { return ""; }
}

// ---------------------------------------------------------
// 6. CAPACIDAD DE MÓDULOS
// Capacidad = caras (Capacidad_Bodega) × estibas por cara del SKU que está en el
// módulo (columna Estibas_por_cara de Sku). Si el SKU no lo tiene: PET 4,
// luego la columna Capacidad de Capacidad_Bodega, luego 8.
// No se usa la capacidad del WMS (está desactualizada).
// ---------------------------------------------------------
function obtenerCapacidadesBodega() {
  let c = {};
  try {
    const s = hoja_("Capacidad_Bodega");
    if (s) s.getDataRange().getValues().slice(1).forEach(r => {
      let m = limpiarModulo(r[0]);
      let car = parseInt(r[1], 10);
      let cap = parseInt(r[2], 10);
      if (m && m !== "N/A" && car) c[m] = { caras: car, capCara: cap || 8 };
    });
  } catch (e) {}
  return c;
}

function estibasPorCara_(sku, fam) {
  const s = skuInfo_(sku);
  if (s && s.estCara > 0) return s.estCara;
  if (String(fam || "").toUpperCase().includes("PET")) return 4;
  return 0;
}

// Estibas usadas por módulo (estibas completas + 1 si hay cajas sueltas)
function ocupacionModulos(inventarios) {
  let mWMS = {};
  inventarios.forEach(i => {
    if (!i.tieneFisico) return;
    let cs = (i.c % i.cpe) > 0 ? 1 : 0;
    const usa = i.e + cs;
    if (!mWMS[i.m]) mWMS[i.m] = { estibas: 0, esPet: false, prods: new Set(), skus: {} };
    const o = mWMS[i.m];
    o.estibas += usa;
    if (i.fam.includes("PET")) o.esPet = true;
    o.prods.add(i.p);
    if (!o.skus[i.s]) o.skus[i.s] = { estibas: 0, fam: i.fam, p: i.p };
    o.skus[i.s].estibas += usa;
  });
  return mWMS;
}

// Capacidad y ocupación de un módulo. occ = entrada de ocupacionModulos (o undefined si vacío)
function capacidadModulo_(m, occ, cap, skuDestino, famDestino) {
  const c = cap[m];
  if (!c) return null;
  let sku = skuDestino, fam = famDestino;
  if (!sku && occ) {
    let mejor = null;
    Object.keys(occ.skus).forEach(s => { if (!mejor || occ.skus[s].estibas > occ.skus[mejor].estibas) mejor = s; });
    if (mejor) { sku = mejor; fam = occ.skus[mejor].fam; }
  }
  const porCara = (sku ? estibasPorCara_(sku, fam) : 0) || c.capCara || 8;
  const capTot = c.caras * porCara;
  const usadas = occ ? occ.estibas : 0;
  return { caras: c.caras, porCara: porCara, capTot: capTot, usadas: usadas, libres: capTot - usadas, lleno: usadas >= capTot, pct: capTot > 0 ? usadas / capTot : 1 };
}

// Ocupación de todos los módulos que están en Capacidad_Bodega
function tablaOcupacion_(inv) {
  const cap = obtenerCapacidadesBodega();
  const occ = ocupacionModulos(inv || obtenerInventarioLocal());
  let r = {};
  Object.keys(cap).forEach(m => { r[m] = capacidadModulo_(m, occ[m], cap); if (occ[m]) r[m].prods = Array.from(occ[m].prods); else r[m].prods = []; });
  return r;
}

;
// ===== 10_Consultas.gs =====
// =========================================================
// 10 · CONSULTAS DEL BOT (stock, zonas, módulos, fechas, filtros)
// Regla de formato: el SKU siempre va antes del nombre del producto.
// =========================================================
const SEP_ = "\n--------------------------------\n\n";

function lineaCanales_(i) {
  const c = evaluarCanales(i.d, i.fam, i.s, i.p);
  return `*Canales:* T1 ${c.T1 ? "❇️" : "🔸"} - T2 ${c.T2 ? "❇️" : "🔸"} - KA ${c.KA ? "❇️" : "🔸"}`;
}
function lineaEstado_(i, conObs) {
  if (i.est === "DISPONIBLE") return "*Estado:* ✅ *DISP*";
  return `*Estado:* ❌ *BLOQ:* ${escapeMd(i.est)}${conObs && i.obs ? `\n📝 *Obs:* _${escapeMd(i.obs)}_` : ""}`;
}
// Bloque estándar de una ubicación (producto opcional)
function bloqueUbicacion_(i, n, conProducto) {
  let t = `*${n}. Módulo: ${escapeMd(i.m)}*${obtenerEtiquetasVisuales(i)}\n`;
  if (conProducto) t += `📦 ${skuProdMd_(i.s, i.p)}\n`;
  t += `${formatoCantidades(i.e, i.c, i.u, i.p)}\n${lineaEstado_(i, true)}\n*Vence:* ${fVD(i.v, i.d)}\n*Act:* ${formatoActualizacion(i.act)}\n${lineaCanales_(i)}\n`;
  return t;
}
const ordPrioVence_ = (a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0) || tV(a.v) - tV(b.v);
const ordMod_ = (a, b) => String(a.m).localeCompare(String(b.m), undefined, { numeric: true, sensitivity: "base" });

// ---------------------------------------------------------
// 1. STOCK POR SKU
// ---------------------------------------------------------
function buscarWMSOrdenadoPaginado(terminoBusqueda, pagina, filtro, showKA) {
  pagina = pagina || 1; filtro = filtro || "ALL"; showKA = showKA || 0;
  terminoBusqueda = String(terminoBusqueda).trim();
  const ficha = skuInfo_(terminoBusqueda);
  if (!ficha) return { text: "❌ Este SKU no existe en la hoja Sku.", markup: null };
  const inventarios = obtenerInventarioLocal();
  if (inventarios.length === 0) return { text: "⚠️ Base local vacía.", markup: null };

  let lis = [], nProd = ficha.prod, tot = { e: 0, c: 0, u: 0 }, enKA = false, tieneFisicoTotal = false;
  inventarios.forEach(i => {
    if (i.s !== terminoBusqueda) return;
    nProd = i.p || nProd;
    if (i.tieneFisico) tieneFisicoTotal = true;
    const op = esZonaOperativa(i);
    if (i.tieneFisico && op) enKA = true;
    if (showKA === 0 && op) return;
    const c = evaluarCanales(i.d, i.fam, i.s, i.p);
    if (i.est === "DISPONIBLE") { tot.e += i.e; tot.c += i.c; tot.u += i.u; }
    if (filtro === "DISP" && i.est !== "DISPONIBLE") return;
    if ((filtro === "T1" && !c.T1) || (filtro === "T2" && !c.T2) || (filtro === "KA" && !c.KA)) return;
    if (i.tieneFisico) lis.push(i);
  });
  const cabecera = `${skuProdMd_(terminoBusqueda, nProd)}`;
  if (!tieneFisicoTotal) return { text: `⚠️ No hay existencias físicas.\n${cabecera}\n\n${obtenerEstadoSync()}`, markup: null };
  if (lis.length === 0) {
    if (enKA && showKA === 0) return { text: `⚠️ Agotado en bodega general. Hay stock en *KA/PREV*.\n${cabecera}\n\n${obtenerEstadoSync()}`, markup: tecladoWMS(terminoBusqueda, 1, filtro, 0, 10, 1, "WMS") };
    return { text: `❌ SKU filtrado u oculto.\n\n${obtenerEstadoSync()}`, markup: tecladoWMS(terminoBusqueda, 1, filtro, 0, 10, showKA, "WMS") };
  }
  lis.sort(ordPrioVence_);
  const lim = 10, ini = (pagina - 1) * lim;
  let msj = `${filtro === "ALL" ? "📡 *WMS*" : `🎯 *Filtrado (${filtro})*`} (Pág ${pagina})\n${obtenerEstadoSync()}\n\n📦 ${cabecera}\n\n✅ *TOTAL DISPONIBLE:*\n${formatoCantidades(tot.e, tot.c, tot.u, nProd)}\n${SEP_}`;
  lis.slice(ini, ini + lim).forEach((i, idx) => { msj += bloqueUbicacion_(i, ini + idx + 1, false) + SEP_; });
  return { text: msj, markup: tecladoWMS(terminoBusqueda, pagina, filtro, lis.length, lim, showKA, "WMS") };
}

// ---------------------------------------------------------
// 2. ZONAS FÍSICAS (/pk y /ka)
// ---------------------------------------------------------
function obtenerPorZona(zona, pagina) {
  pagina = pagina || 1;
  const inventarios = obtenerInventarioLocal();
  if (inventarios.length === 0) return { text: `⚠️ Base local vacía.\n\n${obtenerEstadoSync()}`, markup: null };
  let lis = inventarios.filter(i => i.tieneFisico && (zona === "PK" ? esZonaPK_(i) : esZonaKA_(i.m)));
  if (lis.length === 0) return { text: `✅ Zona *${zona}* sin existencias registradas.\n\n${obtenerEstadoSync()}`, markup: null };
  lis.sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0) || ordMod_(a, b) || (a.d - b.d));
  const lim = 8, ini = (pagina - 1) * lim;
  let tit = zona === "PK" ? "🛒 INVENTARIO EN PICKING / PREVENTA" : "🏬 INVENTARIO EN KA (GRANDES SUPERFICIES)";
  let msj = `*${tit}* (Pág ${pagina})\n${obtenerEstadoSync()}\n${SEP_}`;
  lis.slice(ini, ini + lim).forEach((i, idx) => { msj += bloqueUbicacion_(i, ini + idx + 1, true) + SEP_; });
  return { text: msj, markup: generarBotoneraPaginacion(`ZONA|${zona}`, pagina, lis.length, lim) };
}

// ---------------------------------------------------------
// 3. RETORNABLES (bodega general, sin KA ni PREV)
// ---------------------------------------------------------
function obtenerRetornables(pagina) {
  pagina = pagina || 1;
  const inventarios = obtenerInventarioLocal();
  if (inventarios.length === 0) return { text: `⚠️ Base local vacía.\n\n${obtenerEstadoSync()}`, markup: null };
  let gr = {};
  inventarios.forEach(i => {
    if (!i.tieneFisico || esZonaOperativa(i)) return;
    if (esProductoRetornable(i.fam, i.p)) { if (!gr[i.s]) gr[i.s] = { p: i.p, s: i.s, u: [] }; gr[i.s].u.push(i); }
  });
  let lG = Object.keys(gr).map(k => gr[k]).sort((a, b) => a.s.localeCompare(b.s, undefined, { numeric: true }));
  if (lG.length === 0) return { text: `✅ No hay productos retornables en almacenamiento general.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 3, ini = (pagina - 1) * lim;
  let msj = `🍾 *PRODUCTO RETORNABLE (BODEGA GENERAL - TOP 2 FEFO)* (Pág ${pagina})\n${obtenerEstadoSync()}\n_Sin KA ni PREV_\n${SEP_}`;
  lG.slice(ini, ini + lim).forEach(g => {
    msj += `📦 ${skuProdMd_(g.s, g.p)}\n\n`;
    g.u.sort(ordPrioVence_).slice(0, 2).forEach((u, idx) => {
      msj += `${["1️⃣", "2️⃣"][idx]} *Módulo: ${escapeMd(u.m)}*${obtenerEtiquetasVisuales(u)}\n${formatoCantidades(u.e, u.c, u.u, g.p)}\n*Vence:* ${fVD(u.v, u.d)}\n*Act:* ${formatoActualizacion(u.act)}\n${lineaEstado_(u, false)}\n${lineaCanales_(u)}\n\n`;
    });
    msj += SEP_;
  });
  let mk = generarBotoneraPaginacion("RET", pagina, lG.length, lim) || { inline_keyboard: [] };
  mk.inline_keyboard.push([{ text: "📄 Descargar PDF Retornables", callback_data: "PDFRETORNABLE" }]);
  return { text: msj, markup: mk };
}

// ---------------------------------------------------------
// 4. BÚSQUEDA GRUPAL
// ---------------------------------------------------------
function buscarGrupoSKUs(texto, pagina, filtro, showKA) {
  pagina = pagina || 1; filtro = filtro || "ALL"; showKA = showKA || 0;
  let skus = String(texto).match(/\d+/g);
  if (!skus || skus.length === 0) return { text: "⚠️ No detecté códigos numéricos.", markup: null };
  skus = skus.filter((v, k, a) => a.indexOf(v) === k);
  const inventarios = obtenerInventarioLocal();
  let gr = {};
  skus.forEach(s => {
    const f = skuInfo_(s);
    gr[s] = f ? { p: f.prod, s: s, u: [], fisicoWMS: false, enKAPREV: false } : { s: s, error: "NO_EXISTE" };
  });
  inventarios.forEach(i => {
    const g = gr[i.s];
    if (!g || g.error) return;
    g.p = i.p || g.p;
    if (i.tieneFisico) g.fisicoWMS = true;
    const op = esZonaOperativa(i);
    if (op && i.tieneFisico) g.enKAPREV = true;
    if (showKA === 0 && op) return;
    const c = evaluarCanales(i.d, i.fam, i.s, i.p);
    if (filtro === "DISP" && i.est !== "DISPONIBLE") return;
    if ((filtro === "T1" && !c.T1) || (filtro === "T2" && !c.T2) || (filtro === "KA" && !c.KA)) return;
    if (i.tieneFisico) g.u.push(i);
  });
  let lG = skus.map(k => gr[k]);
  const lim = 3, ini = (pagina - 1) * lim;
  let msg = `📦 *BÚSQUEDA GRUPAL* (Pág ${pagina})\n${obtenerEstadoSync()}\n_Top 2 módulos_\n${SEP_}`;
  lG.slice(ini, ini + lim).forEach(g => {
    if (g.error) { msg += `❌ *SKU \`${g.s}\`*: no existe en la hoja Sku.${SEP_}`; return; }
    msg += `📦 ${skuProdMd_(g.s, g.p)}\n\n`;
    if (!g.fisicoWMS) { msg += `⚠️ Sin existencias físicas registradas en bodega.${SEP_}`; return; }
    if (g.u.length === 0) { msg += (g.enKAPREV && showKA === 0 ? `⚠️ Agotado en pasillos generales (disponible en *KA/PREV*).` : `❌ Filtrado u oculto por canal.`) + SEP_; return; }
    g.u.sort(ordPrioVence_).slice(0, 2).forEach((u, k) => {
      msg += `${["1️⃣", "2️⃣"][k]} *Módulo: ${escapeMd(u.m)}*${obtenerEtiquetasVisuales(u)}\n${formatoCantidades(u.e, u.c, u.u, g.p)}\n*Vence:* ${fVD(u.v, u.d)}\n*Act:* ${formatoActualizacion(u.act)}\n${lineaEstado_(u, false)}\n${lineaCanales_(u)}\n\n`;
    });
    msg += SEP_;
  });
  return { text: msg, markup: tecladoWMS(skus.join(","), pagina, filtro, lG.length, lim, showKA, "GRUPO") };
}

// ---------------------------------------------------------
// 5. POR MÓDULO O PASILLO (/b = B1, B2… | /b12 | /m4 | /h2)
// ---------------------------------------------------------
function obtenerPorModulo(moduloBuscar, pagina) {
  pagina = pagina || 1;
  const inventarios = obtenerInventarioLocal();
  if (inventarios.length === 0) return { text: "⚠️ Base vacía.", markup: null, vacio: true };
  const mL = limpiarModulo(moduloBuscar);
  const esPasillo = mL.length <= 2 && !/\d/.test(mL);
  const reP = new RegExp("^" + mL.replace(/[^A-Z]/g, "") + "\\d+$");
  let pM = inventarios.filter(i => i.tieneFisico && (esPasillo ? reP.test(i.m) : i.m === mL));
  if (pM.length === 0) return { text: `❌ Módulo *${escapeMd(mL)}* vacío o no existe.\n\n${obtenerEstadoSync()}`, markup: null, vacio: true };
  pM.sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0) || ordMod_(a, b) || (a.d - b.d));
  const lim = esPasillo ? 8 : 6, ini = (pagina - 1) * lim;
  let head = "";
  if (!esPasillo) {
    const cap = obtenerCapacidadesBodega();
    const occ = ocupacionModulos(inventarios);
    const o = capacidadModulo_(mL, occ[mL], cap);
    if (o) head = `📦 *Ocupación:* ${fM(o.usadas)} / ${fM(o.capTot)} estibas (${o.caras} caras × ${o.porCara})\n${o.libres <= 0 ? "🔴 *MÓDULO LLENO*" : `🟢 *Faltan:* ${fM(o.libres)} estibas`}\n\n`;
  }
  let msg = `📍 *INVENTARIO EN: ${escapeMd(mL)}* (Pág ${pagina})\n${obtenerEstadoSync()}\n\n${head}--------------------------------\n\n`;
  pM.slice(ini, ini + lim).forEach((i, idx) => { msg += bloqueUbicacion_(i, ini + idx + 1, true) + SEP_; });
  return { text: msg, markup: generarBotoneraPaginacion(`MOD|${moduloBuscar}`, pagina, pM.length, lim) };
}

// ---------------------------------------------------------
// 6. FECHA EXACTA
// ---------------------------------------------------------
function obtenerPorFechaExacta(fechaIngresada, pagina) {
  pagina = pagina || 1;
  const fechaWMS = normalizarFechaWMS(fechaIngresada);
  let lis = obtenerInventarioLocal().filter(i => i.v.startsWith(fechaWMS) && i.tieneFisico);
  if (lis.length === 0) return { text: `❌ No se encontró inventario físico para *${formatearFecha(fechaWMS)}*\n\n${obtenerEstadoSync()}`, markup: null };
  lis.sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0) || a.s.localeCompare(b.s, undefined, { numeric: true }));
  const lim = 10, ini = (pagina - 1) * lim;
  let msj = `📅 *VENCIMIENTOS PARA: ${formatearFecha(fechaWMS)}* (Pág ${pagina})\n${obtenerEstadoSync()}\n${SEP_}`;
  lis.slice(ini, ini + lim).forEach((i, idx) => {
    msj += `*${ini + idx + 1}.* ${skuProdMd_(i.s, i.p)}${i.prio ? " 🚨*[PRIOR]*" : ""}\n*Módulo:* ${escapeMd(i.m)}\n${formatoCantidades(i.e, i.c, i.u, i.p)}\n${lineaEstado_(i, false)}\n*Act:* ${formatoActualizacion(i.act)}\n${lineaCanales_(i)}\n${SEP_}`;
  });
  return { text: msj, markup: generarBotoneraPaginacion(`FECEX|${fechaWMS}`, pagina, lis.length, lim) };
}

// ---------------------------------------------------------
// 7. FILTROS DE CALIDAD
// ---------------------------------------------------------
function obtenerFiltrosComunes(pagina, tipo, paramExt) {
  let lis = obtenerInventarioLocal().filter(i => {
    if (!i.tieneFisico) return false;
    if (tipo === "FECHAS") return i.d <= paramExt && i.d >= 0;
    if (tipo === "VENCIDOS") return i.d < 0;
    if (tipo === "BLOQ") return i.est !== "DISPONIBLE";
    if (tipo === "PRIOR") return i.prio;
    if (tipo === "TPC") return i.tpc;
    if (tipo === "REEMPAQUE") return i.reempaque;
    return false;
  });
  if (lis.length === 0) return { text: `✅ Cero resultados para ${tipo}.\n\n${obtenerEstadoSync()}`, markup: null };
  lis.sort((a, b) => tipo === "BLOQ" ? ordMod_(a, b) : ((b.prio ? 1 : 0) - (a.prio ? 1 : 0) || a.d - b.d));
  const lim = 10, ini = (pagina - 1) * lim;
  const tit = { FECHAS: `⏳ FECHAS CORTAS (<= ${paramExt} días)`, VENCIDOS: "🛑 PRODUCTOS VENCIDOS", BLOQ: "❌ BLOQUEADOS", PRIOR: "🚨 CON PRIORIDAD", TPC: "🏷️ TAPACÓDIGOS EN BODEGA", REEMPAQUE: "📦 REEMPAQUES EN BODEGA" };
  let msj = `*${tit[tipo]}* (Pág ${pagina})\n${obtenerEstadoSync()}\n${SEP_}`;
  lis.slice(ini, ini + lim).forEach((i, idx) => {
    msj += `*${ini + idx + 1}.* ${skuProdMd_(i.s, i.p)}${obtenerEtiquetasVisuales(i)}\n*Módulo:* ${escapeMd(i.m)}\n${formatoCantidades(i.e, i.c, i.u, i.p)}\n${lineaEstado_(i, true)}\n*Vence:* ${fVD(i.v, i.d)}\n*Act:* ${formatoActualizacion(i.act)}\n${lineaCanales_(i)}\n${SEP_}`;
  });
  const cbs = { FECHAS: `FECH|${paramExt}`, TPC: "TPC", REEMPAQUE: "REEMP", VENCIDOS: "VENCIDOS", BLOQ: "BLOQ", PRIOR: "PRIOR" };
  return { text: msj, markup: generarBotoneraPaginacion(cbs[tipo], pagina, lis.length, lim) };
}

// ---------------------------------------------------------
// 8. CANDADOS
// ---------------------------------------------------------
function obtenerCandados(pagina) {
  pagina = pagina || 1;
  let lis = obtenerInventarioLocal().filter(i => i.est !== "DISPONIBLE" && i.tieneFisico).sort(ordMod_);
  if (lis.length === 0) return { text: `✅ No hay productos bloqueados.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 10, ini = (pagina - 1) * lim;
  let msj = `🔒 *LISTADO DE CANDADOS / BLOQUEOS* (Pág ${pagina})\n${obtenerEstadoSync()}\n${SEP_}`;
  lis.slice(ini, ini + lim).forEach((i, idx) => {
    msj += `*${ini + idx + 1}.* ${skuProdMd_(i.s, i.p)}\n*Módulo:* ${escapeMd(i.m)}\n${formatoCantidades(i.e, i.c, i.u, i.p)}\n*Estado:* ❌ ${escapeMd(i.est)}\n*Candado / Obs:* 🔑 ${escapeMd(i.cand || i.obs || "Sin candado registrado")}\n*Vence:* ${fVD(i.v, i.d)}\n*Act:* ${formatoActualizacion(i.act)}\n${SEP_}`;
  });
  return { text: msj, markup: generarBotoneraPaginacion("CAND", pagina, lis.length, lim) };
}

;
// ===== 11_Slotting.gs =====
// =========================================================
// 11 · SLOTTING Y AUDITORÍA DE BODEGA
// huecos · vacíos · organizar · acomodar · consolidar · infiltrados ·
// mal ubicados / merma · módulos con 2+ SKUs · fecha de envasado
// =========================================================

// ---------------------------------------------------------
// 1. HUECOS (capacidad = caras × estibas por cara del SKU)
// ---------------------------------------------------------
function calcularHuecos() {
  const cap = obtenerCapacidadesBodega();
  if (Object.keys(cap).length === 0) return null;
  const occ = ocupacionModulos(obtenerInventarioLocal());
  let h = [];
  Object.keys(cap).forEach(m => {
    const o = capacidadModulo_(m, occ[m], cap);
    if (o.libres >= 1) h.push({ modulo: m, caras: o.caras, porCara: o.porCara, estAct: o.usadas, cTot: o.capTot, libres: o.libres, prod: occ[m] ? Array.from(occ[m].prods).join(", ") : "Vacío" });
  });
  h.sort((a, b) => b.libres - a.libres);
  return h;
}

function obtenerHuecos(pagina) {
  pagina = pagina || 1;
  const h = calcularHuecos();
  if (h === null) return { text: `⚠️ Pestaña 'Capacidad_Bodega' vacía.\n\n${obtenerEstadoSync()}`, markup: null };
  if (h.length === 0) return { text: `❌ Bodega al 100%. No hay huecos.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 10, ini = (pagina - 1) * lim;
  let msg = `🕳️ *ESPACIOS EN BODEGA* (Pág ${pagina})\n${obtenerEstadoSync()}\n${SEP_}`;
  h.slice(ini, ini + lim).forEach((i, idx) => {
    msg += `*${ini + idx + 1}. Módulo: ${escapeMd(i.modulo)}*\nUsado: ${fM(i.estAct)} / ${fM(i.cTot)} estibas (${i.caras} caras × ${i.porCara})\n🔹 *CABEN: ${fM(i.libres)} estibas*\nOcupa: ${escapeMd(i.prod)}\n${SEP_}`;
  });
  return { text: msg, markup: generarBotoneraPaginacion("HUECOS", pagina, h.length, lim) };
}

// ---------------------------------------------------------
// 2. MÓDULOS VACÍOS (desde WMS_Modulos, que ya trae los vacíos)
// ---------------------------------------------------------
// Módulos vacíos: los que existen en físico (pestaña Capacidad_Bodega) y no tienen inventario.
// Si Capacidad_Bodega está vacía, se usa la lista de módulos del WMS (incluye algunos que no existen en físico).
// sec = pasillo (letras iniciales del módulo: A, B, …, KA, PREV, M) para agruparlos.
function seccionModulo_(m) { const x = /^[A-Za-z]+/.exec(String(m || "").trim()); return x ? x[0].toUpperCase() : "OTROS"; }
function calcularVacios() {
  const fisicos = Object.keys(obtenerCapacidadesBodega());
  if (fisicos.length) {
    const conFisico = new Set(obtenerInventarioLocal().filter(i => i.tieneFisico).map(i => i.m));
    return fisicos.filter(m => !conFisico.has(m)).map(m => ({ m: m, zona: zonaModulo_(m), sec: seccionModulo_(m) }))
      .sort((a, b) => a.m.localeCompare(b.m, undefined, { numeric: true, sensitivity: "base" }));
  }
  const mods = obtenerModulosLocal();
  let v;
  if (mods.length) {
    const conFisico = new Set(obtenerInventarioLocal().filter(i => i.tieneFisico).map(i => i.m));
    v = mods.filter(x => x.zona !== "OPCIONAL" && !conFisico.has(x.m)).map(x => ({ m: x.m, zona: x.zona, sec: seccionModulo_(x.m) }));
  } else {
    const cap = obtenerCapacidadesBodega();
    if (Object.keys(cap).length === 0) return null;
    const o = new Set(obtenerInventarioLocal().filter(i => i.tieneFisico).map(i => i.m));
    v = Object.keys(cap).filter(m => !o.has(m)).map(m => ({ m: m, zona: zonaModulo_(m), sec: seccionModulo_(m) }));
  }
  v.sort((a, b) => a.m.localeCompare(b.m, undefined, { numeric: true, sensitivity: "base" }));
  return v;
}

function obtenerVacios(pagina) {
  pagina = pagina || 1;
  const v = calcularVacios();
  if (v === null) return { text: `⚠️ Sin mapa de módulos. Sincroniza primero.\n\n${obtenerEstadoSync()}`, markup: null };
  if (v.length === 0) return { text: `❌ No hay módulos 100% vacíos.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 40, ini = (pagina - 1) * lim;
  return { text: `🕳️ *MÓDULOS 100% VACÍOS* (${v.length}) (Pág ${pagina})\n${obtenerEstadoSync()}\n\n📍 ` + v.slice(ini, ini + lim).map(x => x.m).join(", "), markup: generarBotoneraPaginacion("VACIOS", pagina, v.length, lim) };
}

// ---------------------------------------------------------
// 3. ORGANIZAR (juntar el mismo SKU repartido en varios módulos)
// ---------------------------------------------------------
function calcularOrganizar() {
  const inventarios = obtenerInventarioLocal();
  if (inventarios.length === 0) return null;
  const cap = obtenerCapacidadesBodega();
  const occ = ocupacionModulos(inventarios);
  let prodLocs = {};
  inventarios.forEach(i => {
    if (!i.tieneFisico) return;
    if (["CARPA", "PREV", "KA", "H"].includes(zonaModulo_(i.m)) || i.pick || i.est !== "DISPONIBLE") return;
    const usa = i.e + ((i.c % i.cpe) > 0 ? 1 : 0);
    if (usa <= 0) return;
    if (!prodLocs[i.s]) prodLocs[i.s] = { prod: i.p, fam: i.fam, locs: [] };
    prodLocs[i.s].locs.push({ mod: i.m, est: usa, e: i.e, c: i.c, u: i.u, v: i.v, d: i.d, t: tV(i.v), act: i.act });
  });
  let sugerencias = [];
  Object.keys(prodLocs).forEach(sku => {
    const data = prodLocs[sku];
    let porMod = {};
    data.locs.forEach(l => {
      if (!porMod[l.mod]) porMod[l.mod] = { est: 0, e: 0, c: 0, u: 0, v: l.v, d: l.d, tMin: l.t, act: l.act };
      const pm = porMod[l.mod];
      pm.est += l.est; pm.e += l.e; pm.c += l.c; pm.u += l.u;
      if (l.t < pm.tMin) { pm.tMin = l.t; pm.v = l.v; pm.d = l.d; }
    });
    const modKeys = Object.keys(porMod);
    if (modKeys.length < 2) return;
    let receptores = [], emisores = [];
    modKeys.forEach(k => {
      const obj = porMod[k];
      const o = capacidadModulo_(k, occ[k], cap, sku, data.fam);
      if (o && o.libres > 0) receptores.push({ mod: k, libres: o.libres, tMin: obj.tMin, v: obj.v, d: obj.d });
      emisores.push(Object.assign({ mod: k }, obj));
    });
    receptores.sort((a, b) => b.libres - a.libres);
    emisores.sort((a, b) => a.est - b.est);
    let handled = new Set();
    emisores.forEach(emi => {
      if (handled.has(emi.mod)) return;
      const rec = receptores.find(r => r.mod !== emi.mod && r.libres >= emi.est && !handled.has(r.mod));
      if (!rec) return;
      const f = fefoMovimiento_(emi, rec);
      sugerencias.push({ p: data.prod, sku: sku, e: emi.e, c: emi.c, u: emi.u, est: emi.est, v: emi.v, d: emi.d, act: emi.act, from: emi.mod, to: rec.mod, fefo: f.titulo, fefoDet: f.detalle, fefoOk: f.ok, score: emi.est });
      rec.libres -= emi.est;
      handled.add(emi.mod);
    });
  });
  sugerencias.sort((a, b) => a.score - b.score);
  return sugerencias;
}

// FEFO al juntar: lo que se mueve suele quedar adelante en el módulo que lo recibe.
// Si lo que se mueve vence DESPUÉS que lo que ya está allá, el producto más viejo queda detrás.
function fefoMovimiento_(emi, rec) {
  const fd = v => formatearFecha(v) || "sin fecha";
  const f = (v, d) => d === 9999 ? fd(v) : `${fd(v)} (${d} días)`;
  const dif = emi.tMin - rec.tMin, cinco = 86400000 * 5;
  if (Math.abs(dif) <= cinco) return { ok: true, titulo: "✅ FEFO correcto", detalle: `Mismas fechas o casi: lo que mueves vence ${fd(emi.v)} y en ${rec.mod} vence ${fd(rec.v)}.` };
  if (dif > 0) return { ok: false, titulo: "⚠️ FEFO se incumple",
    detalle: `Lo que mueves de ${emi.mod} vence ${f(emi.v, emi.d)}, pero en ${rec.mod} hay producto que vence antes: ${f(rec.v, rec.d)}. Si lo pones adelante, lo de ${fd(rec.v)} queda tapado detrás y sale después. Ponlo detrás o saca primero lo de ${rec.mod}.` };
  return { ok: false, titulo: "⚠️ Cuidado con el FEFO",
    detalle: `Lo que mueves de ${emi.mod} vence antes, ${f(emi.v, emi.d)}, que lo que hay en ${rec.mod}, ${f(rec.v, rec.d)}. Ponlo adelante para que salga primero; si queda detrás, tapa su fecha y se incumple el FEFO.` };
}

function obtenerOrganizar(pagina) {
  pagina = pagina || 1;
  const s = calcularOrganizar();
  if (s === null) return { text: `⚠️ Base de datos vacía.\n\n${obtenerEstadoSync()}`, markup: null };
  if (s.length === 0) return { text: `✅ Bodega organizada. No hay nada por consolidar.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 6, ini = (pagina - 1) * lim;
  let msj = `🧩 *SLOTTING: ORGANIZAR BODEGA* (Pág ${pagina})\n${obtenerEstadoSync()}\n_Sugerencias para vaciar módulos_\n${SEP_}`;
  s.slice(ini, ini + lim).forEach((x, idx) => {
    msj += `*${ini + idx + 1}.* ${skuProdMd_(x.sku, x.p)}\nCondición: ${x.fefo}\n${x.fefoOk ? "" : "_" + escapeMd(x.fefoDet) + "_\n"}👉 *Mover de ${x.from} a ${x.to}:*\n${formatoCantidades(x.e, x.c, x.u, x.p)}\nVence: ${fVD(x.v, x.d)}\nAct: ${formatoActualizacion(x.act)}\n_Beneficio: ${x.from} queda libre._\n${SEP_}`;
  });
  return { text: msj, markup: generarBotoneraPaginacion("ORG", pagina, s.length, lim) };
}

// ---------------------------------------------------------
// 4. ACOMODAR UN INGRESO SIN ROMPER FEFO
// ---------------------------------------------------------
function calcularAcomodar(parametros) {
  let p = String(parametros || "").trim().split(/\s+/);
  if (p.length < 2) return { error: "⚠️ Formato: `/acomodar [SKU] [FECHA]`" };
  const sku = p[0].trim();
  const fIng = normalizarFechaWMS(p[1].trim());
  const tIng = tV(fIng);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fIng) || tIng >= 8.64e15) return { error: "⚠️ Fecha inválida. Usa DD/MM/AAAA." };
  const inventarios = obtenerInventarioLocal();
  const cap = obtenerCapacidadesBodega();
  if (Object.keys(cap).length === 0) return { error: "⚠️ Pestaña 'Capacidad_Bodega' vacía." };
  const occ = ocupacionModulos(inventarios);
  let porModulo = {};
  let prodName = (skuInfo_(sku) || {}).prod || "Desconocido";
  let fam = "";
  inventarios.forEach(i => {
    if (i.s !== sku) return;
    prodName = i.p; fam = i.fam;
    if (i.tieneFisico && i.est === "DISPONIBLE" && esZonaBodega_(i)) {
      const prev = porModulo[i.m];
      if (!prev || tV(i.v) < tV(prev.vence)) porModulo[i.m] = { modulo: i.m, vence: i.v, dias: i.d, act: i.act };
    }
  });
  let opciones = [];
  Object.keys(porModulo).forEach(k => {
    const m = porModulo[k];
    const o = capacidadModulo_(k, occ[k], cap, sku, fam);
    if (o && o.libres > 0) opciones.push({ modulo: k, libres: o.libres, capTot: o.capTot, vence: m.vence, dias: m.dias, act: m.act, fefoOk: tV(m.vence) >= tIng });
  });
  opciones.sort((a, b) => (b.fefoOk ? 1 : 0) - (a.fefoOk ? 1 : 0) || b.libres - a.libres);
  let vacios = Object.keys(cap).filter(m => !occ[m] && zonaModulo_(m) === "BODEGA").map(m => ({ m: m, cap: capacidadModulo_(m, null, cap, sku, fam).capTot }));
  vacios.sort((a, b) => b.cap - a.cap || a.m.localeCompare(b.m, undefined, { numeric: true }));
  return { sku: sku, prodName: prodName, fIng: fIng, opciones: opciones, vacios: vacios.slice(0, 12) };
}

function obtenerAcomodar(parametros) {
  const r = calcularAcomodar(parametros);
  if (r.error) return { text: r.error, markup: null };
  let msj = `🎯 *SLOTTING: Acomodar* ${skuProdMd_(r.sku, r.prodName)}\n${obtenerEstadoSync()}\nIngreso vence: ${formatearFecha(r.fIng)}\n${SEP_}`;
  if (r.opciones.length > 0) {
    msj += `*UBICACIONES CON EL MISMO PRODUCTO:*\n_🔹 FEFO correcto · 🔸 Tapa mercancía más vieja_\n\n` +
      r.opciones.map(o => `${o.fefoOk ? "🔹" : "🔸"} *Módulo: ${o.modulo}*\nCaben: ${fM(o.libres)} estibas (de ${fM(o.capTot)})\nVence: ${fVD(o.vence, o.dias)}\nAct: ${formatoActualizacion(o.act)}`).join(SEP_) + "\n";
  } else {
    msj += `*❌ SIN ESPACIO EN LAS UBICACIONES ACTUALES.*\n\n*💡 Módulos vacíos sugeridos:*\n` + (r.vacios.length ? r.vacios.map(v => `📍 ${v.m} (caben ${v.cap})`).join("\n") : "No hay módulos vacíos.");
  }
  return { text: msj, markup: null };
}

// ---------------------------------------------------------
// 5. CONSOLIDAR SUELTAS (3 o más módulos)
// ---------------------------------------------------------
function calcularConsolidar() {
  let gr = {};
  obtenerInventarioLocal().forEach(i => {
    // Suelta = estiba incompleta (cajas que no llenan una estiba). Antes se usaba
    // "unidades > 0", que es cierto para todo, y salían SKUs sin sueltas.
    if (i.cpe > 1 && (i.c % i.cpe) > 0 && i.est === "DISPONIBLE" && i.tieneFisico) {
      if (!gr[i.s]) gr[i.s] = { s: i.s, p: i.p, locs: [] };
      gr[i.s].locs.push(i);
    }
  });
  return Object.keys(gr).map(k => gr[k]).filter(g => g.locs.length >= 3).sort((a, b) => b.locs.length - a.locs.length);
}

function obtenerConsolidar(pagina) {
  pagina = pagina || 1;
  const lis = calcularConsolidar();
  if (lis.length === 0) return { text: `✅ Cero regueros en bodega.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 4, ini = (pagina - 1) * lim;
  let msj = `🧹 *PICOTEO Y SUELTAS* (Pág ${pagina})\n${obtenerEstadoSync()}\n_Regadas en 3 o más módulos_\n${SEP_}`;
  lis.slice(ini, ini + lim).forEach((g, idx) => {
    msj += `*${ini + idx + 1}.* ${skuProdMd_(g.s, g.p)}\nDispersión: ${g.locs.length} módulos\n\n` +
      g.locs.map(i => `📍 *Módulo: ${i.m}*\n${formatoCantidades(i.e, i.c, i.u, i.p)}\nVence: ${fVD(i.v, i.d)}\nAct: ${formatoActualizacion(i.act)}`).join("\n\n") + `\n${SEP_}`;
  });
  return { text: msj, markup: generarBotoneraPaginacion("CONSOL", pagina, lis.length, lim) };
}

// ---------------------------------------------------------
// 6. INFILTRADOS (en WMS y no en Sku) Y FANTASMAS (en Sku y 0 en WMS)
// ---------------------------------------------------------
function calcularInfiltrados() {
  const sk = leerSku_();
  if (!sk.sh) return null;
  let infWMS = [], fisicos = new Set();
  obtenerInventarioLocal().forEach(i => {
    if (!i.tieneFisico) return;
    fisicos.add(i.s);
    if (!sk.mapa[i.s]) infWMS.push(i);
  });
  const fantasmas = sk.lista.filter(x => !fisicos.has(x.sku)).map(x => ({ s: x.sku, p: x.prod }));
  infWMS.sort((a, b) => a.m.localeCompare(b.m, undefined, { numeric: true, sensitivity: "base" }));
  return { infWMS: infWMS, fantasmas: fantasmas };
}

function obtenerInfiltrados(pagina) {
  pagina = pagina || 1;
  const r = calcularInfiltrados();
  if (!r) return { text: `⚠️ Falta la pestaña Sku.\n\n${obtenerEstadoSync()}`, markup: null };
  if (r.infWMS.length === 0 && r.fantasmas.length === 0) return { text: `✅ WMS y hoja Sku coinciden. 0 diferencias.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 6, ini = (pagina - 1) * lim;
  let msj = `👻 *AUDITORÍA INFILTRADOS* (Pág ${pagina})\n${obtenerEstadoSync()}\n${SEP_}`;
  if (r.infWMS.length) {
    msj += `❌ *FALTAN EN LA HOJA SKU (físicos en el WMS):*\n\n`;
    r.infWMS.slice(ini, ini + lim).forEach(i => {
      msj += `${skuProdMd_(i.s, i.p)}\nMódulo: ${escapeMd(i.m)}${esModuloCarpa(i.m) ? " ⛺ *[CARPA]*" : ""}\n${formatoCantidades(i.e, i.c, i.u, i.p)}\nEstado: ${i.est !== "DISPONIBLE" ? `❌ *BLOQ: ${escapeMd(i.est)}*` : "✅ DISP"}\nVence: ${fVD(i.v, i.d)}\n${SEP_}`;
    });
  }
  if (r.fantasmas.length) {
    msj += `🌫️ *FANTASMAS (en la hoja Sku, 0 en el WMS):*\n\n`;
    r.fantasmas.slice(ini, ini + lim).forEach(f => { msj += `${skuProdMd_(f.s, f.p)}\n`; });
  }
  return { text: msj, markup: generarBotoneraPaginacion("INFIL", pagina, Math.max(r.infWMS.length, r.fantasmas.length), lim) };
}

// ---------------------------------------------------------
// 7. MAL UBICADOS Y MERMA
// ---------------------------------------------------------
function calcularAvanzados(tipo) {
  let lis = [];
  obtenerInventarioLocal().forEach(i => {
    if (!i.tieneFisico) return;
    const c = evaluarCanales(i.d, i.fam, i.s, i.p);
    const dTxt = i.d === 9999 ? "sin fecha" : `${i.d}d`;
    if (tipo === "MALUBICADOS") {
      if (esZonaKA_(i.m) && !c.KA) lis.push(Object.assign({}, i, { sT: `En KA pero requiere ${c.min.KA}d. Tiene: ${dTxt}.`, sug: i.d >= c.min.T2 ? "Mover a Picking." : "Mover a Carpa." }));
      else if (esZonaPK_(i) && !c.T2) lis.push(Object.assign({}, i, { sT: `En Picking/Preventa pero no apto (< ${c.min.T2}d). Tiene: ${dTxt}.`, sug: "Mover a Carpa." }));
    } else if (tipo === "MERMA" && i.est !== "DISPONIBLE" && i.d < 30) {
      lis.push(Object.assign({}, i, { sT: `Bloqueado y vence en ${i.d}d` }));
    }
  });
  lis.sort((a, b) => a.d - b.d);
  return lis;
}

function obtenerReportesAvanzados(tipo, pagina) {
  pagina = pagina || 1;
  const lis = calcularAvanzados(tipo);
  if (lis.length === 0) return { text: `✅ Zonas limpias. Cero infracciones en *${tipo}*.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 6, ini = (pagina - 1) * lim;
  let msj = `⚠️ *${tipo}* (Pág ${pagina})\n${obtenerEstadoSync()}\n${SEP_}`;
  lis.slice(ini, ini + lim).forEach((i, idx) => {
    msj += `*${ini + idx + 1}.* ${skuProdMd_(i.s, i.p)}\nMódulo: ${escapeMd(i.m)}\n${formatoCantidades(i.e, i.c, i.u, i.p)}\n📌 *Motivo:* ${i.sT}\n${i.sug ? `💡 *Sugerencia:* ${i.sug}\n` : ""}Vence: ${fVD(i.v, i.d)}\nAct: ${formatoActualizacion(i.act)}\n${SEP_}`;
  });
  return { text: msj, markup: generarBotoneraPaginacion(`AVAN|${tipo}`, pagina, lis.length, lim) };
}

// ---------------------------------------------------------
// 8. MÓDULOS CON 2 O MÁS SKUs (solo pasillos A a J; sin H, PREV, KA, carpa…)
// ---------------------------------------------------------
function calcularMezclados() {
  let mods = {};
  obtenerInventarioLocal().forEach(i => {
    if (!i.tieneFisico || zonaModulo_(i.m) !== "BODEGA") return;
    if (!mods[i.m]) mods[i.m] = {};
    if (!mods[i.m][i.s]) mods[i.m][i.s] = { s: i.s, p: i.p, e: 0, c: 0, u: 0, v: i.v, d: i.d, est: i.est, act: i.act };
    const x = mods[i.m][i.s];
    x.e += i.e; x.c += i.c; x.u += i.u;
    if (tV(i.v) < tV(x.v)) { x.v = i.v; x.d = i.d; }
    if (i.est !== "DISPONIBLE") x.est = i.est;
  });
  let lis = [];
  Object.keys(mods).forEach(m => {
    const skus = Object.keys(mods[m]).map(k => mods[m][k]);
    if (skus.length > 1) lis.push({ m: m, skus: skus.sort((a, b) => a.s.localeCompare(b.s, undefined, { numeric: true })) });
  });
  lis.sort((a, b) => a.m.localeCompare(b.m, undefined, { numeric: true, sensitivity: "base" }));
  return lis;
}

function obtenerMezclados(pagina) {
  pagina = pagina || 1;
  const lis = calcularMezclados();
  if (lis.length === 0) return { text: `✅ Ningún módulo de los pasillos A a J tiene dos productos distintos.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 5, ini = (pagina - 1) * lim;
  let msj = `🔀 *MÓDULOS CON 2 O MÁS SKUs* (Pág ${pagina})\n${obtenerEstadoSync()}\n_Pasillos A a J (sin H, PREV ni KA). Revisar ubicación en el WMS._\n${SEP_}`;
  lis.slice(ini, ini + lim).forEach((g, idx) => {
    msj += `*${ini + idx + 1}. Módulo: ${escapeMd(g.m)}* · ${g.skus.length} SKUs\n`;
    g.skus.forEach(x => { msj += `• ${skuProdMd_(x.s, x.p)}\n   ${cantLinea_(x.e, x.c, x.u, x.p)}\n   Vence: ${fVD(x.v, x.d)}${x.est !== "DISPONIBLE" ? ` · ❌ ${escapeMd(x.est)}` : ""}\n`; });
    msj += SEP_;
  });
  return { text: msj, markup: generarBotoneraPaginacion("MEZC", pagina, lis.length, lim) };
}

// ---------------------------------------------------------
// 9. CALCULADORA DE ENVASADO
// ---------------------------------------------------------
function calcularFechaEnvasado(fechaStr, meses) {
  let p = String(fechaStr).split(/[\/\-]/);
  if (p.length !== 3) return { ok: false, error: "⚠️ Formato de fecha inválido." };
  let d, m, y;
  if (p[0].length === 4) { y = parseInt(p[0], 10); m = parseInt(p[1], 10) - 1; d = parseInt(p[2], 10); }
  else { d = parseInt(p[0], 10); m = parseInt(p[1], 10) - 1; y = parseInt(p[2], 10); }
  if (y < 100) y += 2000;
  if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 0 || m > 11) return { ok: false, error: "⚠️ Formato de fecha inválido." };
  let fecha = new Date(y, m, d);
  fecha.setMonth(fecha.getMonth() - meses);
  return { ok: true, fecha: `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}/${fecha.getFullYear()}` };
}

function calcularEnvasado(fechaStr, meses) {
  const r = calcularFechaEnvasado(fechaStr, meses);
  if (!r.ok) return r.error;
  return `📅 *Cálculo de Envasado*\n\nFecha ingresada: ${fechaStr}\nMeses a restar: ${meses}\n\n➡️ *Fecha de Envasado:* *${r.fecha}*`;
}

;
// ===== 12_Carpa_Barriles.gs =====
// =========================================================
// 12 · CARPA (M1 a M15, con vacíos) Y BARRILES (FEFO)
// =========================================================
const CARPA_MODULOS = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "M13", "M14", "M15"];

// Mapa de la carpa: siempre los 15 módulos, estén o no con producto
function calcularCarpa() {
  const inv = obtenerInventarioLocal().filter(i => i.tieneFisico && esModuloCarpa(i.m));
  const cap = obtenerCapacidadesBodega();
  const occ = ocupacionModulos(inv);
  return CARPA_MODULOS.map(m => {
    const items = inv.filter(i => i.m === m).sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0) || tV(a.v) - tV(b.v));
    const o = capacidadModulo_(m, occ[m], cap);
    const dMin = items.length ? Math.min.apply(null, items.map(i => i.d)) : 9999;
    return { m: m, items: items, vacio: items.length === 0, ocup: o, dMin: dMin, bloq: items.some(i => i.est !== "DISPONIBLE") };
  });
}

function obtenerCarpa(pagina) {
  pagina = pagina || 1;
  const mapa = calcularCarpa();
  const conProd = mapa.filter(x => !x.vacio);
  const vacios = mapa.filter(x => x.vacio).map(x => x.m);
  let msj = `⛺ *CARPA (M1 a M15)*\n${obtenerEstadoSync()}\n\n🟩 Con producto: ${conProd.length} · ⬜ Vacíos: ${vacios.length}${vacios.length ? `\n⬜ ${vacios.join(", ")}` : ""}\n${SEP_}`;
  if (!conProd.length) return { text: msj + "La carpa está vacía.", markup: null };
  const lim = 4, ini = (pagina - 1) * lim;
  conProd.slice(ini, ini + lim).forEach(x => {
    msj += `*Módulo ${x.m}*${x.ocup ? ` · ${fM(x.ocup.usadas)}/${fM(x.ocup.capTot)} estibas` : ""}\n`;
    x.items.forEach(i => {
      msj += `• ${skuProdMd_(i.s, i.p)}${obtenerEtiquetasVisuales(i).replace(/\n/g, " ")}\n   ${cantLinea_(i.e, i.c, i.u, i.p)}\n   Vence: ${fVD(i.v, i.d)} · ${i.est === "DISPONIBLE" ? "✅ DISP" : "❌ " + escapeMd(i.est)}\n`;
    });
    msj += SEP_;
  });
  let mk = generarBotoneraPaginacion("CARPA", pagina, conProd.length, lim) || { inline_keyboard: [] };
  mk.inline_keyboard.push([{ text: "📄 PDF Carpa", callback_data: "CARPAPDF" }]);
  return { text: msj, markup: mk };
}

// Barriles: todo lo que hay en el módulo BARRILES, en orden FEFO
function calcularBarriles() {
  const lotes = obtenerInventarioLocal().filter(i => i.tieneFisico && i.m === "BARRILES")
    .sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0) || tV(a.v) - tV(b.v) || a.s.localeCompare(b.s, undefined, { numeric: true }));
  let porSku = {};
  lotes.forEach(i => {
    if (!porSku[i.s]) porSku[i.s] = { s: i.s, p: i.p, e: 0, c: 0, u: 0, disp: 0, lotes: 0, vMin: i.v, dMin: i.d };
    const g = porSku[i.s];
    g.e += i.e; g.c += i.c; g.u += i.u; g.lotes++;
    if (i.est === "DISPONIBLE") g.disp += i.u || i.c;
  });
  const resumen = Object.keys(porSku).map(k => porSku[k]).sort((a, b) => tV(a.vMin) - tV(b.vMin));
  return { lotes: lotes, resumen: resumen };
}

function obtenerBarriles(pagina) {
  pagina = pagina || 1;
  const b = calcularBarriles();
  if (!b.lotes.length) return { text: `🛢️ *BARRILES*\n\nNo hay producto en el módulo BARRILES.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 10, ini = (pagina - 1) * lim;
  let msj = `🛢️ *BARRILES (FEFO)* (Pág ${pagina})\n${obtenerEstadoSync()}\n_Primero lo que vence antes_\n${SEP_}`;
  b.lotes.slice(ini, ini + lim).forEach((i, idx) => {
    msj += `*${ini + idx + 1}.* ${skuProdMd_(i.s, i.p)}${obtenerEtiquetasVisuales(i)}\n${formatoCantidades(i.e, i.c, i.u, i.p)}\n${lineaEstado_(i, true)}\n*Vence:* ${fVD(i.v, i.d)}\n*Act:* ${formatoActualizacion(i.act)}\n${SEP_}`;
  });
  let mk = generarBotoneraPaginacion("BARR", pagina, b.lotes.length, lim) || { inline_keyboard: [] };
  mk.inline_keyboard.push([{ text: "📄 PDF Barriles", callback_data: "BARRPDF" }]);
  return { text: msj, markup: mk };
}

function construirPDFCarpa() {
  const mapa = calcularCarpa();
  let filas = "";
  mapa.forEach(x => {
    if (x.vacio) { filas += `<tr><td><b>${x.m}</b></td><td colspan="6" class="vacio">Vacío</td></tr>`; return; }
    x.items.forEach((i, k) => {
      filas += `${trVida_(i.d)}${k === 0 ? `<td rowspan="${x.items.length}"><b>${x.m}</b>${x.ocup ? `<br><span class="sm">${fM(x.ocup.usadas)}/${fM(x.ocup.capTot)} est</span>` : ""}</td>` : ""}<td>${escHtml_(i.s)}</td><td class="izq">${escHtml_(i.p)}${i.prio ? " <b>[PRIORIDAD]</b>" : ""}</td><td>${cantHtml_(i)}</td><td>${fVD(i.v, i.d)}</td><td>${i.est === "DISPONIBLE" ? "Disponible" : `<b class="rojo">${escHtml_(i.est)}</b>`}</td><td class="izq sm">${escHtml_(i.obs || "")}</td></tr>`;
    });
  });
  const html = pdfDoc_("MAPA DE CARPA (M1 A M15)", `<table class="t"><thead><tr><th>Módulo</th><th>SKU</th><th class="izq">Producto</th><th>Cantidades</th><th>Vence</th><th>Estado</th><th class="izq">Obs.</th></tr></thead><tbody>${filas}</tbody></table>`, { leyenda: true });
  return { blob: htmlAPdf_(html, `Carpa_${Utilities.formatDate(new Date(), TZ, "yyyyMMdd_HHmm")}.pdf`), caption: "⛺ *Mapa de carpa (M1 a M15)*" };
}

// Tapacódigos: un bloque por producto con sus módulos (primero lo que tiene prioridad y lo que vence antes)
function construirPDFTpc() {
  const inv = obtenerInventarioLocal().filter(i => i.tieneFisico && i.tpc);
  if (!inv.length) return { error: "No hay tapacódigos en bodega." };
  const gr = {};
  inv.forEach(i => { (gr[i.s] = gr[i.s] || { s: i.s, p: i.p, lotes: [] }).lotes.push(i); });
  const orden = (a, b) => ((b.prio ? 1 : 0) - (a.prio ? 1 : 0)) || (a.d - b.d);
  const grupos = Object.values(gr).map(g => { g.lotes.sort(orden); g.prio = g.lotes.some(x => x.prio); g.cajas = g.lotes.reduce((a, x) => a + x.c, 0); return g; })
    .sort((a, b) => ((b.prio ? 1 : 0) - (a.prio ? 1 : 0)) || a.lotes[0].d - b.lotes[0].d);
  const cuerpo = `<p class="sm">${grupos.length} productos · ${inv.length} ubicaciones con tapacódigo. Orden: prioridad y luego lo que vence antes.</p>` + grupos.map(g => `<div class="bloque">
    <div class="bloque-t">${escHtml_(g.s)} · ${escHtml_(g.p)}${g.prio ? " <span class=\"rojo\">[PRIORIDAD]</span>" : ""} <span class="sm">· ${fM(g.cajas)} cajas en ${g.lotes.length} ${g.lotes.length === 1 ? "módulo" : "módulos"}</span></div>
    <table class="t"><thead><tr><th>#</th><th>Módulo</th><th>Cantidades</th><th>Vence</th><th>Estado</th><th class="izq">Observación</th></tr></thead><tbody>
    ${g.lotes.map((i, k) => `${trVida_(i.d)}<td>${k + 1}</td><td><b>${escHtml_(i.m)}</b></td><td>${cantHtml_(i)}</td><td>${fVD(i.v, i.d)}</td><td>${i.est === "DISPONIBLE" ? "Disponible" : `<b class="rojo">${escHtml_(i.est)}</b>`}</td><td class="izq">${escHtml_(i.obs)}</td></tr>`).join("")}</tbody></table></div>`).join("");
  const html = pdfDoc_("TAPACÓDIGOS EN BODEGA", cuerpo, { leyenda: true, css: `.bloque{page-break-inside:avoid;margin-bottom:12px}.bloque-t{font-weight:bold;color:#003399;font-size:12px;padding:4px 0}` });
  return { blob: htmlAPdf_(html, `Tapacodigos_${Utilities.formatDate(new Date(), TZ, "yyyyMMdd_HHmm")}.pdf`), caption: "🏷️ *Tapacódigos en bodega*" };
}

function construirPDFBarriles() {
  const b = calcularBarriles();
  if (!b.lotes.length) return { error: "No hay producto en el módulo BARRILES." };
  const filas = b.lotes.map((i, k) => `${trVida_(i.d)}<td>${k + 1}</td><td>${escHtml_(i.s)}</td><td class="izq">${escHtml_(i.p)}${i.prio ? " <b>[PRIORIDAD]</b>" : ""}</td><td>${cantHtml_(i)}</td><td>${fVD(i.v, i.d)}</td><td>${i.est === "DISPONIBLE" ? "Disponible" : `<b class="rojo">${escHtml_(i.est)}</b>`}</td></tr>`).join("");
  const html = pdfDoc_("BARRILES · ORDEN FEFO", `<table class="t"><thead><tr><th>#</th><th>SKU</th><th class="izq">Producto</th><th>Cantidades</th><th>Vence</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table>`, { leyenda: true });
  return { blob: htmlAPdf_(html, `Barriles_${Utilities.formatDate(new Date(), TZ, "yyyyMMdd_HHmm")}.pdf`), caption: "🛢️ *Barriles (FEFO)*" };
}

;
// ===== 13_Consumo.gs =====
// =========================================================
// 13 · CONSUMO INTERNO / PONY GASTO
// ---------------------------------------------------------
// Criterio del módulo a consumir (solo lotes DISPONIBLES de la bodega general).
// KA y PREV NO se usan: se surten desde los módulos de bodega y lo que hay allá ya
// está listo para despachar (se muestran aparte, solo como información):
//   1) marcado como prioridad
//   2) fecha más corta y módulo incompleto
//   3) fecha
//   4) con la misma fecha, el módulo más incompleto
// El usuario puede elegir otro módulo disponible desde el dashboard. La elección
// se guarda en la pestaña Consumo (quién y cuándo) y vuelve al cálculo
// automático cuando ese módulo ya no tiene producto disponible.
// =========================================================
const CONSUMO_DEF = { libro: "MAIN", nombre: "Consumo", cab: ["Sku", "Producto", "Modulo_elegido", "Elegido_por", "Elegido_en"], texto: [1, 2, 3, 4, 5] };

function listaConsumo_() {
  const sh = hoja_("Consumo");
  if (!sh) return null;
  return tLeer_(CONSUMO_DEF).map((r, k) => ({ fila: k + 2, sku: txt_(r[0]), nom: txt_(r[1]), elegido: limpiarModulo(r[2]) === "N/A" ? "" : limpiarModulo(r[2]), por: txt_(r[3]), en: txt_(r[4]) })).filter(x => x.sku);
}

// Comparador de los criterios de consumo
function cmpConsumo_(a, b) {
  if (a.prio !== b.prio) return a.prio ? -1 : 1;
  const tA = tV(a.v), tB = tV(b.v);
  if (tA !== tB) return tA - tB;
  const incA = a.pct !== null && a.pct < 1, incB = b.pct !== null && b.pct < 1;
  if (incA !== incB) return incA ? -1 : 1;
  const pA = a.pct === null ? 9 : a.pct, pB = b.pct === null ? 9 : b.pct;
  if (pA !== pB) return pA - pB;
  return String(a.m).localeCompare(String(b.m), undefined, { numeric: true });
}

function calcularConsumo() {
  const lista = listaConsumo_();
  if (lista === null) return null;
  const skus = new Set(lista.map(x => x.sku));
  const inv = obtenerInventarioLocal();
  const cap = obtenerCapacidadesBodega();
  const occ = ocupacionModulos(inv);
  let ag = {};
  inv.forEach(i => {
    if (!skus.has(i.s) || !i.tieneFisico) return;
    const o = capacidadModulo_(i.m, occ[i.m], cap);
    const l = Object.assign({}, i, { esOp: esZonaOperativa(i), disp: i.est === "DISPONIBLE", pct: o ? Math.round(o.pct * 1000) / 1000 : null, lleno: o ? o.lleno : null, capTot: o ? o.capTot : null, usadas: o ? o.usadas : null });
    (ag[i.s] = ag[i.s] || []).push(l);
  });
  return lista.map(x => {
    const locs = ag[x.sku] || [];
    const general = locs.filter(l => l.disp && !l.esOp).sort(cmpConsumo_);
    const operativa = locs.filter(l => l.esOp).sort(cmpConsumo_);   // KA / PREV: solo información
    const auto = general.length ? general[0].m : null;
    const manualValido = x.elegido && general.some(l => l.m === x.elegido);
    const elegido = manualValido ? x.elegido : auto;
    // Orden: el elegido primero, luego los disponibles (criterios), los bloqueados y al final KA / PREV
    const bloq = locs.filter(l => !l.disp && !l.esOp).sort(cmpConsumo_);
    let orden = general.concat(bloq, operativa);
    orden.forEach(l => { l.sel = l.m === elegido && l.disp && !l.esOp; });
    orden.sort((a, b) => (b.sel ? 1 : 0) - (a.sel ? 1 : 0));
    let estado = "ok";
    if (!locs.length) estado = "sin_fisico";
    else if (!general.length) estado = bloq.length ? "solo_bloqueado" : "solo_operativa";
    return {
      sku: x.sku, nom: x.nom || (skuInfo_(x.sku) || {}).prod || "Desconocido", locs: orden, elegido: elegido, auto: auto,
      modo: manualValido ? "manual" : "auto", elegidoPor: manualValido ? x.por : "", elegidoEn: manualValido ? x.en : "",
      manualVencido: !!(x.elegido && !manualValido), estado: estado
    };
  });
}

// Totales del módulo elegido (suma de lotes disponibles del SKU en ese módulo)
function totalesElegido_(x) {
  const ls = x.locs.filter(l => l.sel);
  if (!ls.length) return null;
  return { m: x.elegido, e: ls.reduce((a, l) => a + l.e, 0), c: ls.reduce((a, l) => a + l.c, 0), u: ls.reduce((a, l) => a + l.u, 0), v: ls[0].v, d: ls[0].d, p: ls[0].p, prio: ls.some(l => l.prio) };
}

// ---------------------------------------------------------
// BOT
// ---------------------------------------------------------
function obtenerConsumo(pagina) {
  pagina = pagina || 1;
  const datos = calcularConsumo();
  if (datos === null) return { text: `⚠️ Crea la pestaña 'Consumo' en el Excel.\n\n${obtenerEstadoSync()}`, markup: null };
  if (datos.length === 0) return { text: `🛒 *LISTA VACÍA*\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 3, ini = (pagina - 1) * lim;
  let msj = `🛒 *PANEL DE CONSUMO / PONY GASTO* (Pág ${pagina})\n${obtenerEstadoSync()}\n_🎯 = consumir aquí · 🔴 = bloqueado_\n${SEP_}`;
  datos.slice(ini, ini + lim).forEach(x => {
    msj += `📦 ${skuProdMd_(x.sku, x.nom)}\n`;
    if (x.estado === "sin_fisico") { msj += `❌ Sin existencias físicas en bodega.\n${SEP_}`; return; }
    if (x.estado === "solo_bloqueado") msj += `❌ Todos los módulos están bloqueados.\n`;
    if (x.estado === "solo_operativa") msj += `⚠️ Solo hay en KA / PREV (ya surtido para despacho): no se consume de ahí.\n`;
    if (x.modo === "manual") msj += `✋ Elegido a mano por ${escapeMd(x.elegidoPor)} (${fechaCorta_(x.elegidoEn)})\n`;
    msj += "\n";
    const lb = x.locs.filter(l => !l.esOp);
    lb.slice(0, 5).forEach(l => {
      const ic = l.sel ? "🎯 *CONSUMIR AQUÍ*\n" : "";
      const marca = !l.disp ? "🔴" : (l.esOp ? "🔹" : "▫️");
      msj += `${ic}${marca} *${escapeMd(l.m)}*${l.prio ? " 🚨" : ""}${l.lleno === false ? " (incompleto)" : ""}\n   ${cantLinea_(l.e, l.c, l.u, l.p)}\n   Vence: ${fVD(l.v, l.d)}${l.disp ? "" : ` · ❌ ${escapeMd(l.est)}`}\n`;
    });
    if (lb.length > 5) msj += `   _+${lb.length - 5} ubicaciones más en el dashboard_\n`;
    msj += `\n🗑️ _Eliminar:_ /consumo del ${x.sku}\n${SEP_}`;
  });
  let mk = generarBotoneraPaginacion("CONSO", pagina, datos.length, lim) || { inline_keyboard: [] };
  mk.inline_keyboard.push([{ text: "📄 PDF completo", callback_data: "PDFCONSO" }, { text: "🎯 Solo módulos a consumir", callback_data: "PDFCONSO2" }]);
  return { text: msj, markup: mk };
}

function agregarConsumoCore_(sku) {
  sku = String(sku || "").trim();
  if (!/^\d+$/.test(sku)) return { ok: false, error: "SKU inválido." };
  if (!hoja_("Consumo")) return { ok: false, error: "Crea la pestaña 'Consumo' en el Excel." };
  const lista = listaConsumo_() || [];
  if (lista.some(x => x.sku === sku)) return { ok: false, error: `El SKU ${sku} ya está en la lista.` };
  const f = skuInfo_(sku);
  const n = f ? f.prod : "SKU " + sku;
  tAgregar_(CONSUMO_DEF, [[sku, n, "", "", ""]]);
  sbEspejo_("consumo");
  return { ok: true, nombre: String(n) };
}

function agregarConsumo(sku) {
  const r = agregarConsumoCore_(sku);
  const volver = { inline_keyboard: [[{ text: "Volver al panel", callback_data: "CONSO|1" }]] };
  return { text: r.ok ? `✅ ${skuProdMd_(sku, r.nombre)} añadido a la lista.` : `⚠️ ${r.error}`, markup: volver };
}

function preguntarEliminarConsumo(sku) {
  sku = String(sku || "").trim();
  if (!/^\d+$/.test(sku)) return { text: "⚠️ Formato: `/consumo del SKU`", markup: null };
  return { text: `⚠️ ¿Eliminar el SKU *${sku}* de la lista de consumo?`, markup: { inline_keyboard: [[{ text: "✅ Sí, eliminar", callback_data: `CONSO_DEL|${sku}` }, { text: "❌ Cancelar", callback_data: "CONSO|1" }]] } };
}

function eliminarConsumoCore_(sku) {
  if (!hoja_("Consumo")) return false;
  const quitados = tReescribir_(CONSUMO_DEF, r => txt_(r[0]) !== String(sku).trim());
  if (quitados > 0) sbEspejo_("consumo");
  return quitados > 0;
}

function ejecutarEliminarConsumo(sku) {
  const volver = { inline_keyboard: [[{ text: "Volver al panel", callback_data: "CONSO|1" }]] };
  return { text: eliminarConsumoCore_(sku) ? `✅ SKU ${sku} eliminado.` : `❌ SKU ${sku} no estaba en la lista.`, markup: volver };
}

// Elegir a mano el módulo de consumo ("" = volver al automático)
function elegirModuloConsumoCore_(sku, modulo, usuario) {
  sku = String(sku || "").trim();
  modulo = modulo ? limpiarModulo(modulo) : "";
  return conLock_(() => {
    const it = (listaConsumo_() || []).find(x => x.sku === sku);
    if (!it) throw new Error(`El SKU ${sku} no está en la lista de consumo.`);
    if (modulo) {
      const lotes = obtenerInventarioLocal().filter(i => i.s === sku && i.m === modulo && i.tieneFisico && i.est === "DISPONIBLE");
      if (lotes.length && lotes.every(i => esZonaOperativa(i))) throw new Error(`${modulo} es KA / PREV: de ahí no se consume (ya está surtido para despacho).`);
      if (!lotes.length) throw new Error(`En ${modulo} no hay producto disponible del SKU ${sku}. Solo se puede elegir un módulo disponible.`);
    }
    tEscribir_(CONSUMO_DEF, it.fila, 3, modulo ? [modulo, usuario, ahora_()] : ["", "", ""]);
    sbEspejo_("consumo");
    return true;
  });
}

// ---------------------------------------------------------
// PDFs
// ---------------------------------------------------------
// Completo: todos los módulos de cada SKU, en orden de criterios, con el elegido resaltado
function construirPDFConsumo() {
  const datos = calcularConsumo();
  if (datos === null) return { error: "Falta la pestaña 'Consumo'." };
  let cuerpo = "";
  datos.forEach(x => {
    cuerpo += `<div class="bloque"><div class="bloque-t">${escHtml_(x.sku)} · ${escHtml_(x.nom)}${x.modo === "manual" ? ` <span class="sm">(elegido a mano por ${escHtml_(x.elegidoPor)})</span>` : ""}</div>`;
    const lb = x.locs.filter(l => !l.esOp);
    if (!lb.length) { cuerpo += `<div class="vacio caja">${x.locs.length ? "Solo hay en KA / PREV (ya surtido para despacho)." : "Sin existencias físicas en bodega."}</div></div>`; return; }
    cuerpo += `<table class="t"><thead><tr><th>Módulo</th><th>Estado</th><th>Vence</th><th>Estibas</th><th>Cajas</th><th>Unidades</th><th>Módulo lleno</th><th>Acción</th></tr></thead><tbody>`;
    lb.forEach(l => {
      const cls = l.sel ? "sel" : (!l.disp ? "bloq" : "");
      const accion = l.sel ? "<b>CONSUMIR AQUÍ</b>" : (!l.disp ? "Bloqueado" : (l.esOp ? "Operativo (KA/PREV)" : "Reserva"));
      cuerpo += `<tr class="${cls}"><td><b>${escHtml_(l.m)}</b>${l.prio ? " [PRIORIDAD]" : ""}</td><td>${l.disp ? "Disponible" : escHtml_(l.est)}</td><td>${fVD(l.v, l.d)}</td><td>${fM(l.e)}</td><td>${fM(l.c)}</td><td>${fM(l.u)}</td><td>${l.lleno === null ? "—" : (l.lleno ? "Lleno" : `Incompleto (${fM(l.usadas)}/${fM(l.capTot)})`)}</td><td>${accion}</td></tr>`;
    });
    cuerpo += `</tbody></table></div>`;
  });
  const html = pdfDoc_("CONSUMO / PONY GASTO · COMPLETO", `<p class="sm">Criterio: 1) prioridad · 2) fecha más corta y módulo incompleto · 3) fecha · 4) con la misma fecha, el módulo más incompleto. Sin KA ni PREV (se surten desde bodega). <span class="chip sel">Consumir aquí</span> <span class="chip bloq">Bloqueado</span></p>${cuerpo}`, { css: `.bloque{page-break-inside:avoid;margin-bottom:12px}.bloque-t{font-weight:bold;color:#003399;font-size:11.5px;padding:5px 0}.caja{border:1px solid #999;padding:6px}tr.sel td{background:#dbe8ff !important;font-weight:bold}tr.bloq td{background:#ffcccc !important;color:#8e1f19}.chip{padding:1px 6px;border:1px solid #999}.chip.sel{background:#dbe8ff}.chip.bloq{background:#ffcccc}` });
  return { blob: htmlAPdf_(html, `Consumo_Completo_${Utilities.formatDate(new Date(), TZ, "yyyyMMdd_HHmm")}.pdf`), caption: "📄 *Consumo (Pony gasto) · completo*" };
}

// Solo módulos a consumir: una fila por SKU, para compartir con quien saca el producto
function construirPDFConsumoSolo() {
  const datos = calcularConsumo();
  if (datos === null) return { error: "Falta la pestaña 'Consumo'." };
  let filas = datos.map(x => {
    const t = totalesElegido_(x);
    if (!t) return `<tr class="bloq"><td>${escHtml_(x.sku)}</td><td class="izq">${escHtml_(x.nom)}</td><td colspan="4">${x.estado === "sin_fisico" ? "Sin existencias" : (x.estado === "solo_operativa" ? "Solo en KA / PREV (ya surtido)" : "Sin módulo disponible (bloqueado)")}</td><td></td></tr>`;
    return `<tr><td>${escHtml_(x.sku)}</td><td class="izq"><b>${escHtml_(x.nom)}</b></td><td class="mod">${escHtml_(t.m)}</td><td>${cantHtml_(t)}</td><td>${fVD(t.v, t.d)}</td><td>${t.prio ? "PRIORIDAD" : ""}</td><td>${x.modo === "manual" ? "A mano" : "Automático"}</td></tr>`;
  }).join("");
  const html = pdfDoc_("CONSUMO · SOLO MÓDULOS A CONSUMIR", `<table class="t grande"><thead><tr><th>SKU</th><th class="izq">Producto</th><th>Módulo</th><th>Cantidades</th><th>Vence</th><th>Marca</th><th>Selección</th></tr></thead><tbody>${filas}</tbody></table>`, { css: `.grande td{font-size:12px;padding:8px}.mod{font-size:16px;font-weight:bold;color:#003399}tr.bloq td{background:#ffcccc !important}` });
  return { blob: htmlAPdf_(html, `Consumo_Modulos_${Utilities.formatDate(new Date(), TZ, "yyyyMMdd_HHmm")}.pdf`), caption: "🎯 *Consumo · solo módulos a consumir*" };
}

;
// ===== 14_Limbo.gs =====
// =========================================================
// 14 · MERCANCÍA EN LIMBO (producto físico sin SKU)
// =========================================================
function listarLimbo_() {
  const sh = hoja_("Limbo");
  if (!sh) return [];
  return sh.getDataRange().getValues().slice(1)
    .filter(d => String(d[0]).trim() !== "")
    .map(d => ({ id: String(d[0]).trim(), p: String(d[1]), vRaw: d[2], v: formatearFecha(d[2]), dias: diasHastaFecha_(d[2]), pres: String(d[3] || ""), cub: String(d[4] || ""), fecha: (d[5] instanceof Date) ? Utilities.formatDate(d[5], tzHoja_(), "dd/MM/yyyy HH:mm") : String(d[5] || "") }));
}

function agregarLimboCore_(nombre, fechaISO, presentacion, cubicaje) {
  const sh = hoja_("Limbo");
  if (!sh) return { ok: false, error: "Falta la pestaña 'Limbo' en el Excel." };
  if (!String(nombre || "").trim()) return { ok: false, error: "Falta el nombre del producto." };
  const usados = new Set(listarLimbo_().map(x => x.id));
  let idUnico;
  do { idUnico = "L-" + Math.floor(1000 + Math.random() * 9000); } while (usados.has(idUnico));
  sh.appendRow([idUnico, String(nombre).trim(), formatearFecha(fechaISO), presentacion || "", cubicaje || "", Utilities.formatDate(new Date(), TZ, "dd/MM/yyyy HH:mm")]);
  sbEspejo_("limbo");
  return { ok: true, id: idUnico };
}

function eliminarLimboCore_(id) {
  const sh = hoja_("Limbo");
  if (!sh) return false;
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) { sh.deleteRow(i + 1); sbEspejo_("limbo"); return true; }
  }
  return false;
}

function obtenerLimbo() {
  if (!hoja_("Limbo")) return { text: "⚠️ La pestaña 'Limbo' no existe.", markup: null };
  const data = listarLimbo_();
  if (data.length === 0) return { text: "✅ *LIMBO VACÍO*\n\nNo hay productos pendientes de SKU.", markup: { inline_keyboard: [[{ text: "➕ Añadir nuevo", callback_data: "LIMBO_ADD" }]] } };
  let msj = `👻 *MERCANCÍA EN LIMBO (sin SKU)*\n${SEP_}`;
  let btn = [];
  data.forEach(d => {
    msj += `📦 *${escapeMd(d.p)}*\nID: \`${d.id}\`\nVence: ${d.v}\nPresentación: ${escapeMd(d.pres || "N/A")}\nCubicaje: ${escapeMd(d.cub || "N/A")}\n_Reportado: ${d.fecha}_\n${SEP_}`;
    btn.push([{ text: `🗑️ Eliminar ${d.p.substring(0, 12)}`, callback_data: `LIMBO_DEL|${d.id}` }]);
  });
  btn.push([{ text: "➕ Añadir nuevo", callback_data: "LIMBO_ADD" }]);
  return { text: msj, markup: { inline_keyboard: btn } };
}

function ejecutarEliminarLimbo(id) {
  if (eliminarLimboCore_(id)) return obtenerLimbo();
  return { text: `❌ ID ${id} no encontrado.`, markup: null };
}

;
// ===== 15_Resumen_Pocos.gs =====
// =========================================================
// 15 · POCOS, RESUMEN GERENCIAL Y PDFs DE BODEGA
// =========================================================

// ---------------------------------------------------------
// 1. POCOS: SKUs con menos estibas disponibles que su mínimo
// (columna Minimo de Sku; vacío = POCOS_DEFECTO). Estibas = cajas ÷ cajas por estiba.
// ---------------------------------------------------------
function calcularPocos() {
  const sk = leerSku_();
  if (!sk.sh) return null;
  let cat = {};
  sk.lista.forEach(f => { cat[f.sku] = { s: f.sku, p: f.prod, minimo: minimoSku_(f.sku), totE: 0, totC: 0, totU: 0, eq: 0, cpe: parseInt(f.cantEst, 10) || 0, locs: [], prio: false, zonas: { bodega: 0, ka: 0, pk: 0 } }; });
  obtenerInventarioLocal().forEach(i => {
    const it = cat[i.s];
    if (!it || i.est !== "DISPONIBLE" || !i.tieneFisico) return;
    if (i.prio) it.prio = true;
    it.totE += i.e; it.totC += i.c; it.totU += i.u;
    const eq = estibasEq(i);
    it.eq += eq;
    if (i.cpe > 1) it.cpe = i.cpe;
    if (esZonaKA_(i.m)) it.zonas.ka += i.c; else if (esZonaPK_(i)) it.zonas.pk += i.c; else it.zonas.bodega += eq;
    it.locs.push(i);
  });
  let lis = Object.keys(cat).map(k => cat[k]).filter(it => it.eq < it.minimo && (it.totE > 0 || it.totC > 0 || it.totU > 0));
  lis.sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0) || (a.eq / (a.minimo || 1)) - (b.eq / (b.minimo || 1)));
  return lis;
}

function obtenerStockCriticoCruzado(pagina) {
  pagina = pagina || 1;
  const lis = calcularPocos();
  if (lis === null) return { text: `⚠️ Falta la pestaña Sku.\n\n${obtenerEstadoSync()}`, markup: null };
  if (lis.length === 0) return { text: `✅ Ningún SKU está por debajo de su mínimo.\n\n${obtenerEstadoSync()}`, markup: null };
  const lim = 4, ini = (pagina - 1) * lim;
  let msg = `🚨 *POCOS (por debajo del mínimo de estibas)* - Pág ${pagina}\n${obtenerEstadoSync()}\n${SEP_}`;
  lis.slice(ini, ini + lim).forEach((i, idx) => {
    const ubic = i.locs.map(l => `📍 *Módulo: ${l.m}*\n${formatoCantidades(l.e, l.c, l.u, l.p)}\nVence: ${fVD(l.v, l.d)}`).join("\n\n");
    msg += `*${ini + idx + 1}.* ${skuProdMd_(i.s, i.p)}${i.prio ? " 🚨*[PRIOR]*" : ""}\nMínimo: ${fM(i.minimo)} estibas · Hay ≈ ${fM(i.eq)}\n\n*TOTAL DISPONIBLE:*\n${formatoCantidades(i.totE, i.totC, i.totU, i.p)}\n\n*Ubicaciones:*\n${ubic || "Sin ubicación"}\n${SEP_}`;
  });
  let mk = generarBotoneraPaginacion("POCOS", pagina, lis.length, lim) || { inline_keyboard: [] };
  mk.inline_keyboard.push([{ text: "📄 Generar PDF Pocos", callback_data: "PDFPOCOS" }]);
  return { text: msg, markup: mk };
}

// Formato de auditoría física (incluye SKUs en 0, como antes)
function construirPDFPocos() {
  const sk = leerSku_();
  if (!sk.sh) return { error: "Falta la pestaña 'Sku'." };
  const inventarios = obtenerInventarioLocal();
  let cpeWms = {};
  inventarios.forEach(i => { if (i.cpe > 1 && !cpeWms[i.s]) cpeWms[i.s] = i.cpe; });
  let cat = {};
  sk.lista.forEach(f => { cat[f.sku] = { s: f.sku, p: f.prod, fe: cpeWms[f.sku] || parseInt(f.cantEst, 10) || 1, tc: 0, min: minimoSku_(f.sku) }; });
  inventarios.forEach(i => { if (i.est === "DISPONIBLE" && cat[i.s]) cat[i.s].tc += i.c; });
  let lis = [];
  Object.keys(cat).forEach(k => {
    const it = cat[k];
    const ec = Math.floor(it.tc / it.fe);
    if (ec < it.min) lis.push({ s: it.s, p: it.p, cs: `${fM(ec)} Estibas, ${fM(it.tc % it.fe)} Cajas`, min: it.min });
  });
  lis.sort((a, b) => a.p.localeCompare(b.p));
  const fH = lis.map(i => `<tr><td>${escHtml_(i.s)}</td><td class="izq">${escHtml_(i.p)}</td><td>${i.cs}</td><td>${fM(i.min)}</td><td></td><td></td><td></td><td></td></tr>`).join("");
  const html = pdfDoc_("REPORTE POCOS · AUDITORÍA FÍSICA", `<table class="t alto"><thead><tr><th>SKU</th><th class="izq">Producto</th><th>Cant. sistema</th><th>Mín.</th><th>Bodega</th><th>Picking</th><th>KA</th><th>TPC</th></tr></thead><tbody>${fH}</tbody></table>`, { css: ".alto td{height:20px}" });
  return { blob: htmlAPdf_(html, "Formato_Pocos.pdf"), caption: "📄 *Formato de pocos*" };
}

// ---------------------------------------------------------
// 2. RESUMEN GERENCIAL
// ---------------------------------------------------------
function calcularResumen() {
  const sk = leerSku_();
  if (!sk.sh) return null;
  let cat = {};
  sk.lista.forEach(f => { cat[f.sku] = { eq: 0, fis: false }; });
  let r = { cVencidos: 0, cRiesgo: 0, cBloq: 0, cPrio: 0, cTpc: 0, cReem: 0, c3: 0, cPocos: 0, cMezcla: 0, mLimbo: 0, mConsumo: 0, listBloq: [] };
  obtenerInventarioLocal().forEach(i => {
    if (!i.tieneFisico) return;
    if (i.est === "DISPONIBLE") {
      if (cat[i.s]) { cat[i.s].eq += estibasEq(i); cat[i.s].fis = true; }
      if (i.d < 0) r.cVencidos++;
      else if (i.d < 45) r.cRiesgo++;
    } else { r.cBloq++; r.listBloq.push(i); }
    if (i.prio) r.cPrio++;
    if (i.tpc) r.cTpc++;
    if (i.reempaque) r.cReem++;
  });
  Object.keys(cat).forEach(s => { if (cat[s].fis && cat[s].eq < 3) r.c3++; });
  r.cPocos = (calcularPocos() || []).length;
  r.cMezcla = calcularMezclados().length;
  r.mLimbo = listarLimbo_().length;
  r.mConsumo = (listaConsumo_() || []).length;
  r.listBloq.sort((a, b) => a.m.localeCompare(b.m, undefined, { numeric: true, sensitivity: "base" }));
  return r;
}

function obtenerResumen(pagina) {
  pagina = pagina || 1;
  const r = calcularResumen();
  if (!r) return { text: `⚠️ Falta la pestaña Sku.\n\n${obtenerEstadoSync()}`, markup: null };
  let msj = `📊 *RESUMEN GERENCIAL BODEGA* (Pág ${pagina})\n${obtenerEstadoSync()}\n\n` +
    `📦 *ESTADO GENERAL*\n- Pocos (bajo su mínimo): ${r.cPocos} SKUs\n- Críticos (<3 estibas): ${r.c3} SKUs\n- Mercancía en limbo: ${r.mLimbo} registros\n- Consumo interno: ${r.mConsumo} SKUs\n- Módulos con 2+ SKUs: ${r.cMezcla}\n\n` +
    `🛑 *ALERTAS DE CALIDAD*\n- Vencidos: ${r.cVencidos} ubicaciones\n- Riesgo (<45d): ${r.cRiesgo} ubicaciones\n- Bloqueados: ${r.cBloq} ubicaciones\n\n` +
    `🏷️ *ETIQUETAS ACTIVAS*\n- 🚨 Prioridad FEFO: ${r.cPrio}\n- 🏷️ Tapacódigo (TPC): ${r.cTpc}\n- 📦 Reempaque: ${r.cReem}\n${SEP_}`;
  if (!r.listBloq.length) return { text: msj + "✅ No hay productos bloqueados en bodega.", markup: { inline_keyboard: [[{ text: "📄 Descargar PDF Resumen", callback_data: "PDFRESUMEN" }]] } };
  msj += `🚫 *DETALLE DE BLOQUEOS EN WMS:*\n\n`;
  const lim = 4, ini = (pagina - 1) * lim;
  r.listBloq.slice(ini, ini + lim).forEach((b, idx) => {
    msj += `*${ini + idx + 1}.* ${skuProdMd_(b.s, b.p)}\nMódulo: ${escapeMd(b.m)}\n${formatoCantidades(b.e, b.c, b.u, b.p)}\nEstado: ❌ ${escapeMd(b.est)}${b.cand ? `\nCandado: 🔒 \`${escapeMd(b.cand)}\`` : ""}${b.obs ? `\nObs: _${escapeMd(b.obs)}_` : ""}\n${SEP_}`;
  });
  let mk = generarBotoneraPaginacion("RESUMEN", pagina, r.listBloq.length, lim) || { inline_keyboard: [] };
  mk.inline_keyboard.push([{ text: "📄 Descargar PDF Resumen (5 págs)", callback_data: "PDFRESUMEN" }]);
  return { text: msj, markup: mk };
}

function construirPDFResumen() {
  const inventarios = obtenerInventarioLocal();
  let lVenc = [], lRies = [], lPrio = [], lTpc = [], lReem = [], lBloq = [], lMalUbi = [];
  inventarios.forEach(i => {
    if (!i.tieneFisico) return;
    if (i.est === "DISPONIBLE") { if (i.d < 0) lVenc.push(i); else if (i.d < 45) lRies.push(i); }
    else lBloq.push(i);
    if (i.prio) lPrio.push(i);
    if (i.tpc) lTpc.push(i);
    if (i.reempaque) lReem.push(i);
    const c = evaluarCanales(i.d, i.fam, i.s, i.p);
    if (esZonaKA_(i.m) && !c.KA) lMalUbi.push(Object.assign({}, i, { sT: `KA requiere ${c.min.KA} días`, sug: i.d >= c.min.T2 ? "Mover a Picking" : "Mover a Carpa" }));
    else if (esZonaPK_(i) && !c.T2) lMalUbi.push(Object.assign({}, i, { sT: `< ${c.min.T2} días (no apto)`, sug: "Mover a Carpa" }));
  });
  const lLimbo = listarLimbo_();
  const ordMod = (a, b) => a.m.localeCompare(b.m, undefined, { numeric: true, sensitivity: "base" });
  const cab = t => cabeceraPDF_(t, fechaCorte_()) + leyendaVidaPDF_();
  const cols = `<th>Módulo</th><th>SKU</th><th>Producto</th><th>Cantidades</th><th>Vencimiento</th>`;
  const base = i => `${trVida_(i.d)}<td>${escHtml_(i.m)}</td><td>${escHtml_(i.s)}</td><td>${escHtml_(i.p)}</td><td>${cantHtml_(i)}</td><td>${fVD(i.v, i.d)}</td>`;
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS_PDF_BASE}
    .hoja { page-break-after: always; } .sug-pick { color: #0247a3; font-weight: bold; } .sug-carpa { color: #8a4b00; font-weight: bold; }</style></head><body>`;

  html += `<div class="hoja">${cab("INFORME DE RIESGO DE VENCIMIENTO (<45 DÍAS)")}`;
  if (!lRies.length) html += `<p class="vacio">✅ Cero productos en riesgo menor a 45 días.</p>`;
  else html += `<table class="t"><thead><tr>${cols}<th>Canales</th><th>Últ. mov.</th></tr></thead><tbody>${lRies.sort((a, b) => a.d - b.d).map(i => { const c = evaluarCanales(i.d, i.fam, i.s, i.p); return `${base(i)}<td>T1:${c.T1 ? "OK" : "NO"} · T2:${c.T2 ? "OK" : "NO"} · KA:${c.KA ? "OK" : "NO"}</td><td>${formatoActualizacion(i.act)}</td></tr>`; }).join("")}</tbody></table>`;
  html += `</div>`;

  html += `<div class="hoja">${cab("INFRACCIONES DE ZONA (MAL UBICADOS)")}`;
  if (!lMalUbi.length) html += `<p class="vacio">✅ Zonas T2, Picking y KA sin infracciones.</p>`;
  else html += `<table class="t"><thead><tr>${cols}<th>Infracción</th><th>Sugerencia</th></tr></thead><tbody>${lMalUbi.sort(ordMod).map(i => `${base(i)}<td>${i.sT}</td><td class="${i.sug.includes("Picking") ? "sug-pick" : "sug-carpa"}">${i.sug}</td></tr>`).join("")}</tbody></table>`;
  html += `</div>`;

  html += `<div class="hoja">${cab("MERCANCÍA BLOQUEADA EN WMS")}`;
  if (!lBloq.length) html += `<p class="vacio">✅ No hay mercancía bloqueada en bodega.</p>`;
  else html += `<table class="t"><thead><tr>${cols}<th>Estado</th><th>Candado / Observación</th></tr></thead><tbody>${lBloq.sort(ordMod).map(i => `${base(i)}<td class="rojo"><b>${escHtml_(i.est)}</b></td><td>${escHtml_(i.cand || "")} ${escHtml_(i.obs || "")}</td></tr>`).join("")}</tbody></table>`;
  html += `</div>`;

  const tablaEtiqueta = (titulo, lista, vacio) => {
    let h = `<h3>${titulo} (${lista.length})</h3>`;
    if (!lista.length) return h + `<p class="vacio">${vacio}</p>`;
    return h + `<table class="t"><thead><tr>${cols}<th>Observación</th></tr></thead><tbody>${lista.sort((a, b) => a.d - b.d).map(i => `${base(i)}<td>${escHtml_(i.obs || "")}</td></tr>`).join("")}</tbody></table>`;
  };
  html += `<div class="hoja">${cab("ETIQUETAS (PRIORIDAD, TPC, REEMPAQUE)")}${tablaEtiqueta("🚨 PRIORIDAD DE CONSUMO", lPrio, "Sin prioridades activas.")}${tablaEtiqueta("🏷️ TAPACÓDIGOS / TPC", lTpc, "Sin tapacódigos activos.")}${tablaEtiqueta("📦 REEMPAQUES", lReem, "Sin reempaques activos.")}</div>`;

  html += `<div>${cab("MERCANCÍA EN LIMBO Y PRODUCTOS VENCIDOS")}<h3>👻 LIMBO (PENDIENTE DE SKU) (${lLimbo.length})</h3>`;
  if (!lLimbo.length) html += `<p class="vacio">✅ No hay mercancía sin SKU en limbo.</p>`;
  else html += `<table class="t"><thead><tr><th>ID</th><th>Producto</th><th>Vence</th><th>Presentación</th><th>Cubicaje</th><th>Reportado</th></tr></thead><tbody>${lLimbo.map(i => `${trVida_(i.dias)}<td>${i.id}</td><td>${escHtml_(i.p)}</td><td>${i.v}${i.dias !== 9999 ? ` (${i.dias < 0 ? "Vencido" : i.dias + " días"})` : ""}</td><td>${escHtml_(i.pres)}</td><td>${escHtml_(i.cub)}</td><td>${escHtml_(i.fecha)}</td></tr>`).join("")}</tbody></table>`;
  html += `<h3>🛑 PRODUCTOS VENCIDOS (${lVenc.length})</h3>`;
  if (!lVenc.length) html += `<p class="vacio">✅ Bodega sin productos vencidos.</p>`;
  else html += `<table class="t"><thead><tr>${cols}<th>Estado</th></tr></thead><tbody>${lVenc.sort((a, b) => a.d - b.d).map(i => `${base(i)}<td class="rojo">${escHtml_(i.est)}</td></tr>`).join("")}</tbody></table>`;
  html += `</div></body></html>`;
  return { blob: htmlAPdf_(html, "Resumen_Gerencial_Frecs.pdf"), caption: "📄 *Informe gerencial WMS (5 páginas)*" };
}

// ---------------------------------------------------------
// 3. PDF RETORNABLES (bodega general, letra grande)
// ---------------------------------------------------------
function construirPDFRetornable() {
  let gr = {};
  obtenerInventarioLocal().forEach(i => {
    if (!i.tieneFisico || i.est !== "DISPONIBLE" || esZonaOperativa(i)) return;
    if (esProductoRetornable(i.fam, i.p)) { if (!gr[i.s]) gr[i.s] = { p: i.p, s: i.s, u: [] }; gr[i.s].u.push(i); }
  });
  const lG = Object.keys(gr).map(k => gr[k]).sort((a, b) => a.s.localeCompare(b.s, undefined, { numeric: true }));
  if (!lG.length) return { error: "No hay retornables disponibles en bodega general." };
  let cuerpo = "";
  lG.forEach(g => {
    g.u.sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0) || tV(a.v) - tV(b.v));
    const top = g.u.slice(0, g.u.some(x => x.prio) ? 3 : 2);
    cuerpo += `<div class="card"><div class="card-head">🍾 ${escHtml_(g.s)} · ${escHtml_(g.p)}</div><table class="t"><thead><tr><th>#</th><th>Módulo</th><th>Cantidad</th><th>Vencimiento</th><th>Marca</th><th>Últ. mov.</th></tr></thead><tbody>` +
      top.map((u, k) => `<tr class="${k === 0 ? "top" : ""}"><td><b>${k + 1}</b></td><td><b>${escHtml_(u.m)}</b></td><td><b>${u.e > 0 ? fM(u.e) + " Estibas" : fM(u.c) + " Cajas"}</b></td><td>${fVD(u.v, u.d)}</td><td>${u.prio ? '<b class="rojo">PRIORIDAD</b>' : "Disponible"}</td><td>${formatoActualizacion(u.act)}</td></tr>`).join("") + `</tbody></table></div>`;
  });
  const html = pdfDoc_("PRODUCTO RETORNABLE (TOP FEFO)", cuerpo, { css: `body{font-size:13px}.card{page-break-inside:avoid;border:2px solid #0056b3;margin-bottom:14px}.card-head{background:#eef5fc;color:#0056b3;padding:8px 12px;font-size:15px;font-weight:bold;border-bottom:2px solid #0056b3}table.t td,table.t th{font-size:12.5px;padding:8px}.top td{background:#f3f8fe}` });
  return { blob: htmlAPdf_(html, "Retornables_Frecs.pdf"), caption: "🍾 *Informe de retornables*" };
}

;
// ===== 16_Productos_Sku.gs =====
// =========================================================
// 16 · INFORMACIÓN DE PRODUCTO, ADMINISTRACIÓN DE SKU Y CANALES
// =========================================================

// ---------------------------------------------------------
// 1. INFORMACIÓN DE PRODUCTO (desde la hoja Sku, no del WMS)
// Campos: SKU, producto, cubicaje, piso, plancha, cant x estibas, presentación
// ---------------------------------------------------------
function buscarProductosSku_(termino) {
  const t = normalizarTexto(String(termino || "").trim().toLowerCase());
  const tokens = t.split(/\s+/).filter(x => x);
  if (!tokens.length) return [];
  const exactos = [], parecidos = [];
  catalogoSku_().forEach(c => {
    const n = coincideBusqueda_(normalizarTexto(`${c.ctx} ${c.prod} ${c.sku}`.toLowerCase()), tokens);
    if (n === 2) exactos.push(c); else if (n === 1) parecidos.push(c);
  });
  return exactos.concat(parecidos);
}

// Tolera un error de digitación por palabra (una letra cambiada, sobrante, faltante o dos
// al revés): "cajica mile 330" encuentra "Bbc Cajica Miel Nr Tw 330Cc X4".
function casiIgual_(a, b) {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0; while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}
// 2 = todas las palabras tal cual · 1 = alguna con un error · 0 = no coincide
function coincideBusqueda_(texto, tokens) {
  let nivel = 2, pal = null;
  for (const k of tokens) {
    if (texto.includes(k)) continue;
    if (k.length < 4 || /^\d+$/.test(k)) return 0; // los números (SKU, 330) deben ir exactos
    pal = pal || texto.split(/[^a-z0-9]+/).filter(x => x);
    if (!pal.some(w => casiIgual_(k, w) || (w.length > k.length && casiIgual_(k, w.slice(0, k.length))))) return 0;
    nivel = 1;
  }
  return nivel;
}

function buscarFichaTecnicaPaginada(termino, pagina) {
  pagina = pagina || 1;
  if (!leerSku_().sh) return { text: "⚠️ Falta la pestaña 'Sku' en el Excel.", markup: null };
  const exacto = skuInfo_(String(termino).trim());
  const matches = exacto ? [exacto] : buscarProductosSku_(termino);
  if (!matches.length) return { text: `❌ No se encontró ningún producto que coincida con "*${escapeMd(termino)}*"`, markup: null };
  const lim = 4, ini = (pagina - 1) * lim;
  let msj = `🔍 *INFORMACIÓN DE PRODUCTO (${matches.length})*\n_Búsqueda:_ "*${escapeMd(termino)}*" (Pág ${pagina})\n${SEP_}`;
  matches.slice(ini, ini + lim).forEach((c, idx) => {
    msj += `*${ini + idx + 1}.* ${skuProdMd_(c.sku, c.prod)}\n` +
      `Cubicaje: ${escapeMd(c.cub || "N/A")}\nPiso: ${escapeMd(c.piso || "N/A")}\nPlancha: ${escapeMd(c.plancha || "N/A")}\n` +
      `Cant x estiba: ${escapeMd(c.cantEst || "N/A")} ${obtenerTipoEmpaque(c.prod).toLowerCase()}\nPresentación: ${escapeMd(c.pres || "N/A")}\n${SEP_}`;
  });
  return { text: msj, markup: generarBotoneraPaginacion(`SRCH|${cbKey(termino)}`, pagina, matches.length, lim) };
}

// ---------------------------------------------------------
// 2. ADMINISTRAR LA HOJA SKU (solo administrador)
// ---------------------------------------------------------
const SKU_EDITABLES = ["sku", "prod", "cub", "piso", "plancha", "cantEst", "pres", "ctx", "minimo", "t1", "t2", "ka", "estCara"];
const SKU_NUMERICOS = ["minimo", "t1", "t2", "ka", "estCara"];

function validarSku_(obj) {
  let o = {};
  SKU_EDITABLES.forEach(k => { o[k] = obj[k] === undefined || obj[k] === null ? "" : String(obj[k]).trim(); });
  if (!/^\d+$/.test(o.sku)) throw new Error("El SKU debe ser numérico.");
  if (!o.prod) throw new Error("Escribe el nombre del producto.");
  SKU_NUMERICOS.forEach(k => {
    if (o[k] === "") return;
    const n = Number(o[k].replace(",", "."));
    if (!isFinite(n) || n < 0) throw new Error(`El valor de ${SKU_ENCABEZADOS[k]} debe ser un número mayor o igual a 0.`);
    o[k] = n;
  });
  if (!o.ctx) o.ctx = normalizarTexto(o.prod.toLowerCase());
  return o;
}

// skuOriginal vacío = producto nuevo
function skuGuardarCore_(skuOriginal, obj, usuario) {
  const o = validarSku_(obj);
  return conLock_(() => {
    _SKU = null;
    const sk = leerSku_();
    if (!sk.sh) throw new Error("Falta la pestaña 'Sku'.");
    const orig = String(skuOriginal || "").trim();
    if (orig) {
      const actual = sk.mapa[orig];
      if (!actual) throw new Error(`El SKU ${orig} ya no existe en la hoja.`);
      if (o.sku !== orig && sk.mapa[o.sku]) throw new Error(`Ya existe otro producto con el SKU ${o.sku}.`);
      const fila = sk.sh.getRange(actual.fila, 1, 1, sk.sh.getLastColumn()).getValues()[0];
      SKU_EDITABLES.forEach(k => { if (sk.cols[k] !== undefined) fila[sk.cols[k]] = o[k]; });
      if (sk.cols.usuario !== undefined) fila[sk.cols.usuario] = usuario;
      sk.sh.getRange(actual.fila, 1, 1, fila.length).setValues([fila]);
    } else {
      if (sk.mapa[o.sku]) throw new Error(`El SKU ${o.sku} ya existe (${sk.mapa[o.sku].prod}).`);
      let fila = new Array(sk.sh.getLastColumn()).fill("");
      SKU_EDITABLES.forEach(k => { if (sk.cols[k] !== undefined) fila[sk.cols[k]] = o[k]; });
      if (sk.cols.usuario !== undefined) fila[sk.cols.usuario] = usuario;
      sk.sh.appendRow(fila);
    }
    invalidarSku_();
    sbEspejo_("sku");
    return o.sku;
  });
}

function skuEliminarCore_(sku) {
  return conLock_(() => {
    _SKU = null;
    const sk = leerSku_();
    const actual = sk.mapa[String(sku).trim()];
    if (!actual) throw new Error(`El SKU ${sku} no existe.`);
    sk.sh.deleteRow(actual.fila);
    invalidarSku_();
    sbEspejo_("sku");
    return true;
  });
}

// ---------------------------------------------------------
// 3. CANALES POR DEFECTO (pestaña Canales, editable por el administrador)
// ---------------------------------------------------------
function canalesListar_() {
  _CANALES = null;
  return tLeer_(CANALES_DEF).map(r => ({ canal: txt_(r[0]).toUpperCase(), tipo: txt_(r[1]) || "General", valor: txt_(r[2]), dias: txt_(r[3]), nota: txt_(r[4]) })).filter(x => x.canal);
}

function canalesGuardarCore_(filas) {
  const tipos = { GENERAL: "General", FAMILIA: "Familia", CONTIENE: "Contiene" };
  let limpias = [];
  (filas || []).forEach((f, k) => {
    const canal = String(f.canal || "").trim().toUpperCase();
    const tipo = tipos[normalizarTexto(String(f.tipo || "General")).toUpperCase()];
    const valor = String(f.valor || "").trim().toUpperCase();
    const dias = entero_(f.dias);
    if (!canal && !valor && String(f.dias || "").trim() === "") return;
    if (!["T1", "T2", "KA"].includes(canal)) throw new Error(`Fila ${k + 1}: el canal debe ser T1, T2 o KA.`);
    if (!tipo) throw new Error(`Fila ${k + 1}: el tipo debe ser General, Familia o Contiene.`);
    if (tipo !== "General" && !valor) throw new Error(`Fila ${k + 1}: escribe el valor (familia o palabra) de la excepción.`);
    if (isNaN(dias) || dias < 0) throw new Error(`Fila ${k + 1}: los días deben ser un número entero.`);
    limpias.push([canal, tipo, tipo === "General" ? "" : valor, dias, String(f.nota || "").trim()]);
  });
  ["T1", "T2", "KA"].forEach(c => {
    const n = limpias.filter(r => r[0] === c && r[1] === "General").length;
    if (n !== 1) throw new Error(`Debe haber exactamente una regla General para ${c}.`);
  });
  return conLock_(() => {
    const sh = tHoja_(CANALES_DEF);
    const n = sh.getLastRow();
    if (n > 1) sh.getRange(2, 1, n - 1, CANALES_DEF.cab.length).clearContent();
    sh.getRange(2, 1, limpias.length, CANALES_DEF.cab.length).setValues(limpias);
    _CANALES = null;
    cacheBorrar_("inv");
    sbEspejo_("canales");
    return true;
  });
}

;
// ===== 20_Turnos.gs =====
// =========================================================
// 20 · TURNOS (compartido por Validación y Entrega de turno)
// ---------------------------------------------------------
// Turnos rotativos: 1 = 10 p.m.–6 a.m. · 2 = 6 a.m.–2 p.m. · 3 = 2 p.m.–10 p.m.
// - Quien abre el turno escoge el número (1, 2 o 3) y queda como "Abierto por".
// - Solo puede haber UN turno abierto: no se abre otro sin cerrar el actual.
// - Al abrir, se indica de quién recibe: "Recibe de turno N de @usuario".
// - Validación y Entrega de turno pertenecen al turno y se cierran juntas.
// - Un turno cerrado se puede EDITAR desde el historial (queda "Editado por").
// - Un turno se puede ELIMINAR (queda oculto como ELIMINADO; el administrador lo
//   puede restaurar). Lo elimina quien lo abrió o un administrador.
// La tabla vive en el archivo Entrega_Turno_WMS (pestaña Turnos).
// =========================================================
const TURNOS_DEF = {
  libro: "ENTREGA", nombre: "Turnos",
  cab: ["ID", "Turno", "Fecha", "Estado", "Inicio", "Abierto_por", "Cierre", "Cerrado_por", "Recibe_de_ID", "Recibe_de", "Nota", "Editado_por", "Eliminado_por"],
  texto: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
};

function filaTurno_(r, fila) {
  const n = parseInt(r[1], 10);
  return {
    fila: fila, id: txt_(r[0]), numero: isNaN(n) ? "" : n, fecha: txt_(r[2]).substring(0, 10), estado: txt_(r[3]).toUpperCase(),
    inicio: txt_(r[4]), abiertoPor: txt_(r[5]), cierre: txt_(r[6]), cerradoPor: txt_(r[7]),
    recibeDeId: txt_(r[8]), recibeDe: txt_(r[9]), nota: txt_(r[10]), editadoPor: txt_(r[11]), eliminadoPor: txt_(r[12])
  };
}

let _TURNOS = null;
function listarTurnos_() {
  if (!_TURNOS) _TURNOS = tLeer_(TURNOS_DEF).map((r, k) => filaTurno_(r, k + 2)).filter(t => t.id);
  return _TURNOS;
}
// Después de escribir en Turnos: se borra lo leído y el caché compartido
function turnosCambiaron_() { _TURNOS = null; try { CacheService.getScriptCache().remove("turno_abierto"); } catch (e) {} }

// Turno abierto. Se guarda 5 minutos en caché (se borra cada vez que cambia la tabla).
// fresco = true obliga a leer la hoja (se usa dentro de los bloqueos antes de escribir).
function turnoAbierto_(fresco) {
  const cache = CacheService.getScriptCache();
  if (!fresco) {
    const c = cache.get("turno_abierto");
    if (c) { try { return c === "-" ? null : JSON.parse(c); } catch (e) {} }
  } else _TURNOS = null;
  const ts = listarTurnos_();
  let t = null;
  for (let k = ts.length - 1; k >= 0; k--) if (ts[k].estado === "ABIERTO") { t = ts[k]; break; }
  cache.put("turno_abierto", t ? JSON.stringify(t) : "-", 300);
  return t;
}

function turnoPorId_(id) { return listarTurnos_().find(t => t.id === String(id)) || null; }

function ultimoTurnoCerrado_() {
  const ts = listarTurnos_().filter(t => t.estado === "CERRADO");
  ts.sort((a, b) => (a.cierre < b.cierre ? -1 : a.cierre > b.cierre ? 1 : 0));
  return ts.length ? ts[ts.length - 1] : null;
}

// Turno sugerido según la hora: 22–6 → 1 · 6–14 → 2 · 14–22 → 3
function turnoSugerido_() {
  const h = parseInt(Utilities.formatDate(new Date(), TZ, "H"), 10);
  if (h >= 22 || h < 6) return 1;
  if (h < 14) return 2;
  return 3;
}

// Fecha operativa del turno (el turno 1 que se abre de noche pertenece al día siguiente)
function fechaTurno_(numero) {
  const h = parseInt(Utilities.formatDate(new Date(), TZ, "H"), 10);
  let d = new Date();
  if (Number(numero) === 1 && h >= 18) d = new Date(d.getTime() + 86400000);
  return Utilities.formatDate(d, TZ, "yyyy-MM-dd");
}

function turnoTexto_(t) {
  if (!t) return "";
  return `Turno ${t.numero || "?"} · ${formatearFecha(t.fecha || t.inicio)}`;
}

function nombreCorto_(u) { return String(u || "").replace(/\s*\(.*\)\s*$/, "").trim(); }

// Antes de cualquier operación de turnos: migrar la validación vieja (una sola vez)
function prepararTurnos_() {
  if (PropertiesService.getScriptProperties().getProperty("mig_val_v2")) return;
  migrarValidacionV1_();
}

function turnoAbiertoObligatorio_() {
  const t = turnoAbierto_(true);
  if (!t) throw new Error("No hay turno abierto. Abre el turno (1, 2 o 3) primero.");
  return t;
}

// Turno sobre el que se va a escribir: el abierto (sin id) o uno del historial (con id)
function turnoParaEditar_(turnoId) {
  if (!turnoId) return turnoAbiertoObligatorio_();
  _TURNOS = null;
  const t = turnoPorId_(turnoId);
  if (!t) throw new Error("Turno no encontrado: " + turnoId);
  if (t.estado === "ELIMINADO") throw new Error("Ese turno está eliminado. Un administrador lo puede restaurar desde el historial.");
  return t;
}

// Deja constancia de quién editó un turno ya cerrado
function marcarTurnoEditado_(t, usuario) {
  if (!t || t.estado === "ABIERTO") return;
  tEscribir_(TURNOS_DEF, t.fila, 12, [`${usuario} · ${ahora_()}`]);
  turnosCambiaron_();
}

function abrirTurnoCore_(numero, heredar, usuario) {
  numero = parseInt(numero, 10);
  if (![1, 2, 3].includes(numero)) throw new Error("Escoge el turno: 1, 2 o 3.");
  prepararTurnos_();
  return conLock_(() => {
    const abierto = turnoAbierto_(true);
    if (abierto) throw new Error(`Ya está abierto el turno ${abierto.numero} de ${nombreCorto_(abierto.abiertoPor)}. Ciérralo antes de abrir otro.`);
    const prev = ultimoTurnoCerrado_();
    const recibe = prev ? `Recibe de turno ${prev.numero || "?"} de @${nombreCorto_(prev.cerradoPor) || "sin nombre"}` : "";
    const base = "T" + Utilities.formatDate(new Date(), TZ, "yyyyMMdd-HHmmss") + "-" + numero;
    const usados = new Set(listarTurnos_().map(t => t.id));
    let id = base, n = 1;
    while (usados.has(id)) id = base + "-" + (++n);
    tAgregar_(TURNOS_DEF, [[id, numero, fechaTurno_(numero), "ABIERTO", ahora_(), usuario, "", "", prev ? prev.id : "", recibe, "", "", ""]]);
    turnosCambiaron_();
    let heredados = 0;
    if (heredar !== false && prev) heredados = valHeredar_(id, prev, usuario);
    return { id: id, numero: numero, recibeDe: recibe, heredados: heredados };
  });
}

function cerrarTurnoCore_(nota, usuario) {
  prepararTurnos_();
  return conLock_(() => {
    const t = turnoAbiertoObligatorio_();
    valArchivarTurno_(t.id);
    tEscribir_(TURNOS_DEF, t.fila, 4, ["CERRADO", t.inicio, t.abiertoPor, ahora_(), usuario, t.recibeDeId, t.recibeDe, String(nota || t.nota || "")]);
    turnosCambiaron_();
    return { id: t.id, numero: t.numero };
  });
}

// Cambiar la nota de cierre de un turno (abierto o del historial)
function turnoNotaCore_(turnoId, nota, usuario) {
  return conLock_(() => {
    const t = turnoParaEditar_(turnoId);
    tEscribir_(TURNOS_DEF, t.fila, 11, [String(nota || "").trim()]);
    turnosCambiaron_();
    marcarTurnoEditado_(turnoPorId_(t.id), usuario);
    return true;
  });
}

// Eliminar: lo puede hacer quien abrió el turno o un administrador. No se borra: queda
// como ELIMINADO (oculto del historial y de la herencia de saldo) y se puede restaurar.
function puedeEliminar_(abiertoPor, u) {
  return u.rol === "administrador" || nombreCorto_(abiertoPor).toLowerCase() === String(u.nombre).toLowerCase();
}

function turnoEliminarCore_(turnoId, u) {
  return conLock_(() => {
    _TURNOS = null;
    const t = turnoPorId_(turnoId);
    if (!t) throw new Error("Turno no encontrado.");
    if (t.estado === "ELIMINADO") return true;
    if (!puedeEliminar_(t.abiertoPor, u)) throw new Error("Solo quien abrió el turno o un administrador lo puede eliminar.");
    if (t.estado === "ABIERTO") valArchivarTurno_(t.id);
    tEscribir_(TURNOS_DEF, t.fila, 4, ["ELIMINADO"]);
    if (!t.cierre) tEscribir_(TURNOS_DEF, t.fila, 7, [ahora_()]);
    tEscribir_(TURNOS_DEF, t.fila, 13, [`${u.nombre} · ${ahora_()}`]);
    turnosCambiaron_();
    return true;
  });
}

function turnoRestaurarCore_(turnoId, u) {
  if (u.rol !== "administrador") throw new Error("Solo un administrador puede restaurar.");
  return conLock_(() => {
    _TURNOS = null;
    const t = turnoPorId_(turnoId);
    if (!t || t.estado !== "ELIMINADO") throw new Error("Ese turno no está eliminado.");
    tEscribir_(TURNOS_DEF, t.fila, 4, ["CERRADO"]);
    tEscribir_(TURNOS_DEF, t.fila, 13, [""]);
    turnosCambiaron_();
    return true;
  });
}

// Estado del turno para el dashboard
function turnoEstadoCore_() {
  prepararTurnos_();
  const t = turnoAbierto_();
  const prev = t ? null : ultimoTurnoCerrado_();
  return {
    turno: t ? Object.assign({ texto: turnoTexto_(t), horario: HORARIO_TURNOS[t.numero] || "" }, t) : null,
    sugerido: turnoSugerido_(),
    ultimo: prev ? { id: prev.id, numero: prev.numero, cerradoPor: nombreCorto_(prev.cerradoPor), cierre: prev.cierre, texto: turnoTexto_(prev) } : null,
    horarios: HORARIO_TURNOS
  };
}

// ---------------------------------------------------------
// BOT: /turno
// ---------------------------------------------------------
function obtenerTurnoBot() {
  let e;
  try { e = turnoEstadoCore_(); } catch (err) { return { text: "⚠️ Error leyendo el turno: " + err.message, markup: null }; }
  let msj = "🔄 *TURNO*\n\n";
  if (!e.turno) {
    msj += `No hay turno abierto.${e.ultimo ? `\nÚltimo: ${e.ultimo.texto}, cerrado por ${escapeMd(e.ultimo.cerradoPor)} (${fechaCorta_(e.ultimo.cierre)}).` : ""}\n\nÁbrelo desde el dashboard.`;
  } else {
    const t = e.turno;
    msj += `*${t.texto}* (${t.horario})\nAbierto por: ${escapeMd(t.abiertoPor)} · desde ${fechaCorta_(t.inicio)}\n${t.recibeDe ? escapeMd(t.recibeDe) + "\n" : ""}`;
  }
  let teclado = [[{ text: "📝 Validación", callback_data: "VAL" }, { text: "📋 PDF entrega", callback_data: "ENTPDF" }], [{ text: "⚖️ Conciliación", callback_data: "CONC" }, { text: "📌 Pre-conciliación", callback_data: "PRE" }]];
  if (DASHBOARD_URL) teclado.push([{ text: "🌐 Abrir el dashboard", url: DASHBOARD_URL }]);
  return { text: msj, markup: { inline_keyboard: teclado } };
}

;
// ===== 21_Validacion.gs =====
// =========================================================
// 21 · VALIDACIÓN DE FACTURACIÓN (archivo Validaciones_WMS)
// ---------------------------------------------------------
// Facturación pide validar si un producto escaso se puede facturar.
// En el turno abierto: productos con su cantidad inicial (cajas) y la hora en que
// se contaron; cada validación guarda la hora en que se validó y la hora del conteo
// que tenía el producto en ese momento. Disponible = inicial − validado.
// La sincronización NO cambia el disponible (el WMS es solo referencia).
// Estados de un registro: ACTIVO · ANULADO · CONFLICTO (llegó sin conexión y
// ya no alcanzaba el saldo: no descuenta hasta que alguien lo corrija o lo anule).
// =========================================================
const VAL_T = {
  productos: { libro: "VAL", nombre: "Val_Productos", cab: ["Turno_ID", "SKU", "Producto", "Inicial", "Actualizado", "Usuario", "Contado_en"], texto: [1, 2, 3, 5, 6, 7] },
  registros: { libro: "VAL", nombre: "Val_Registros", cab: ["ID", "Turno_ID", "Fecha", "SKU", "Producto", "Destino", "Cantidad", "Usuario", "Nota", "Estado", "Modificado_por", "Contado_en"], texto: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12] },
  destinos: { libro: "VAL", nombre: "Val_Destinos", cab: ["Destino"], texto: [1], inicial: [["Tradicional"], ["Bodegas"], ["KA"]] },
  histProd: { libro: "VAL", nombre: "Val_Hist_Productos", cab: ["Turno_ID", "SKU", "Producto", "Inicial", "Validado", "Disponible", "Detalle_destinos", "Contado_en"], texto: [1, 2, 3, 7, 8] },
  histReg: { libro: "VAL", nombre: "Val_Hist_Registros", cab: ["ID", "Turno_ID", "Fecha", "SKU", "Producto", "Destino", "Cantidad", "Usuario", "Nota", "Estado", "Modificado_por", "Contado_en"], texto: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12] }
};

function valDestinos_() { revertirDestinosTurno_(); return tLeer_(VAL_T.destinos).map(r => txt_(r[0])).filter(x => x); }

// T1 SÍ es un destino (el canal T1). Una versión anterior (28/09) lo renombraba a "Turno 1" y
// agregaba "Turno 2" y "Turno 3". Si esa versión alcanzó a correr, esto lo deshace una sola vez:
// "Turno 1/2/3" → "T1/T2/T3" en validaciones y se quitan los destinos "Turno 2" y "Turno 3".
function revertirDestinosTurno_() {
  const pr = PropertiesService.getScriptProperties();
  if (!pr.getProperty("mig_dest_turno") || pr.getProperty("mig_dest_turno_rev")) return;
  pr.setProperty("mig_dest_turno_rev", "1");
  try {
    const volver = d => { const m = /^Turno ([123])$/.exec(String(d || "").trim()); return m ? "T" + m[1] : txt_(d); };
    [VAL_T.registros, VAL_T.histReg].forEach(def => {
      tLeer_(def).forEach((r, k) => { const n = volver(r[5]); if (n !== txt_(r[5])) tEscribir_(def, k + 2, 6, [n]); });
    });
    tLeer_(VAL_T.histProd).forEach((r, k) => {
      const d = txt_(r[6]), n = d.replace(/(^|\|\s*)Turno ([123]):/g, "$1T$2:");
      if (n !== d) tEscribir_(VAL_T.histProd, k + 2, 7, [n]);
    });
    const vistos = new Set(), lista = [];
    tLeer_(VAL_T.destinos).forEach(r => {
      const d = txt_(r[0]);
      if (d === "Turno 2" || d === "Turno 3" || !d) return;
      const n = volver(d);
      if (!vistos.has(n.toLowerCase())) { vistos.add(n.toLowerCase()); lista.push([n]); }
    });
    tReescribir_(VAL_T.destinos, () => false);
    tAgregar_(VAL_T.destinos, lista);
  } catch (e) { console.error("revertirDestinosTurno_: " + e.message); }
}

// Productos del turno con lo validado por destino y el saldo
function valCalcular_(turnoId, filasProd, filasReg) {
  let mapa = {}, productos = [];
  filasProd.forEach(r => {
    if (txt_(r[0]) !== turnoId) return;
    const sku = txt_(r[1]);
    if (!sku || mapa[sku]) return;
    const p = { sku: sku, producto: txt_(r[2]), inicial: Number(r[3]) || 0, actualizado: txt_(r[4]), usuario: txt_(r[5]), contadoEn: txt_(r[6]), validado: 0, porDestino: {}, nReg: 0, conflictos: 0 };
    mapa[sku] = p; productos.push(p);
  });
  let registros = [];
  filasReg.forEach(r => {
    if (txt_(r[1]) !== turnoId) return;
    const reg = { id: txt_(r[0]), fecha: txt_(r[2]), sku: txt_(r[3]), producto: txt_(r[4]), destino: txt_(r[5]), cantidad: Number(r[6]) || 0, usuario: txt_(r[7]), nota: txt_(r[8]), estado: txt_(r[9]) || "ACTIVO", modificadoPor: txt_(r[10]), contadoEn: txt_(r[11]) };
    registros.push(reg);
    const p = mapa[reg.sku];
    if (!p) return;
    if (reg.estado === "CONFLICTO") { p.conflictos++; return; }
    if (reg.estado === "ANULADO") return;
    p.validado += reg.cantidad;
    p.porDestino[reg.destino] = (p.porDestino[reg.destino] || 0) + reg.cantidad;
    p.nReg++;
  });
  productos.forEach(p => { p.disponible = p.inicial - p.validado; });
  registros.sort((a, b) => a.fecha < b.fecha ? 1 : (a.fecha > b.fecha ? -1 : 0));
  return { productos: productos, registros: registros };
}

// ---------------------------------------------------------
// CONTEXTO: turno abierto (sin id) o un turno del historial (con id)
// En el historial los productos están en Val_Hist_Productos; al editar se
// recalculan validado, disponible y detalle, y el turno queda "Editado por".
// ---------------------------------------------------------
function valCtx_(turnoId) {
  const t = turnoParaEditar_(turnoId);
  const cerrado = t.estado !== "ABIERTO";
  return { t: t, cerrado: cerrado, prod: cerrado ? VAL_T.histProd : VAL_T.productos, reg: cerrado ? VAL_T.histReg : VAL_T.registros };
}
// Productos en formato común: [Turno_ID, SKU, Producto, Inicial, Actualizado, Usuario, Contado_en]
function valProdFilas_(cx) {
  const filas = tLeer_(cx.prod);
  return cx.cerrado ? filas.map(r => [r[0], r[1], r[2], r[3], "", "", r[7]]) : filas;
}
function valCalcCtx_(cx, filasReg) { return valCalcular_(cx.t.id, valProdFilas_(cx), filasReg || tLeer_(cx.reg)); }

function valHistRecalcular_(turnoId) {
  const filas = tLeer_(VAL_T.histProd);
  const calc = valCalcular_(turnoId, filas.map(r => [r[0], r[1], r[2], r[3], "", "", r[7]]), tLeer_(VAL_T.histReg));
  let mapa = {};
  calc.productos.forEach(p => { mapa[p.sku] = p; });
  filas.forEach((r, k) => {
    if (txt_(r[0]) !== turnoId) return;
    const p = mapa[txt_(r[1])];
    if (p) tEscribir_(VAL_T.histProd, k + 2, 5, [p.validado, p.disponible, valDetalleDestinos_(p)]);
  });
}
function valTrasEditar_(cx, usuario) { if (cx.cerrado) { valHistRecalcular_(cx.t.id); marcarTurnoEditado_(cx.t, usuario); } }

// Cajas disponibles en el WMS por SKU (caché 5 minutos; se borra al sincronizar)
function wmsDisponiblePorSku_() {
  const c = cacheLeer_("wmsdisp");
  if (c) { try { return JSON.parse(c); } catch (e) {} }
  let wms = {};
  obtenerInventarioLocal().forEach(i => { if (i.est === "DISPONIBLE" && i.tieneFisico) wms[i.s] = (wms[i.s] || 0) + (i.c || i.u); });
  cacheGuardar_("wmsdisp", JSON.stringify(wms), 300);
  return wms;
}

function valEstadoCore_(turnoId) {
  prepararTurnos_();
  const destinos = valDestinos_();
  if (turnoId) {
    const cx = valCtx_(turnoId);
    const calc = valCalcCtx_(cx);
    return { historial: true, cerrado: cx.cerrado, turno: Object.assign({ texto: turnoTexto_(cx.t), horario: HORARIO_TURNOS[cx.t.numero] || "" }, cx.t), productos: calc.productos, registros: calc.registros, destinos: destinos };
  }
  const te = turnoEstadoCore_();
  if (!te.turno) return { turnoInfo: te, turno: null, productos: [], registros: [], destinos: destinos };
  const calc = valCalcular_(te.turno.id, tLeer_(VAL_T.productos), tLeer_(VAL_T.registros));
  const wms = calc.productos.length ? wmsDisponiblePorSku_() : {};
  calc.productos.forEach(p => { p.wmsCajas = wms[p.sku] || 0; p.alertaWms = p.wmsCajas < p.disponible; });
  return { turnoInfo: te, turno: te.turno, productos: calc.productos, registros: calc.registros, destinos: destinos };
}

// Productos pocos sugeridos (columna Minimo de Sku)
function valSugerenciasCore_(turnoId) {
  const lis = calcularPocos() || [];
  let enTurno = new Set();
  try {
    const cx = turnoId ? valCtx_(turnoId) : (turnoAbierto_() ? valCtx_("") : null);
    if (cx) enTurno = new Set(valProdFilas_(cx).filter(r => txt_(r[0]) === cx.t.id).map(r => txt_(r[1])));
  } catch (e) {}
  return lis.map(it => ({ sku: it.s, producto: it.p, estibas: Math.round(it.eq * 10) / 10, minimo: it.minimo, cajas: it.totC || it.totU, cpe: it.cpe, prio: it.prio, enTurno: enTurno.has(it.s) }));
}

// ---------------------------------------------------------
// ESCRITURA (turnoId vacío = turno abierto; con id = turno del historial)
// ---------------------------------------------------------
function valAgregarProductosCore_(items, usuario, turnoId) {
  prepararTurnos_();
  return conLock_(() => {
    const cx = valCtx_(turnoId);
    const existentes = new Set(valProdFilas_(cx).filter(r => txt_(r[0]) === cx.t.id).map(r => txt_(r[1])));
    let filas = [], omitidos = [];
    (items || []).forEach(it => {
      const sku = String(it.sku || "").trim();
      const inicial = entero_(it.inicial);
      if (!/^\d+$/.test(sku)) { omitidos.push(`${sku || "?"}: SKU inválido`); return; }
      if (isNaN(inicial) || inicial < 0) { omitidos.push(`${sku}: cantidad inicial inválida`); return; }
      if (existentes.has(sku)) { omitidos.push(`${sku}: ya está en el turno`); return; }
      existentes.add(sku);
      const prod = String(it.producto || (skuInfo_(sku) || {}).prod || ("SKU " + sku)).trim();
      const contado = normalizarFechaHora_(it.contadoEn) || ahora_();
      filas.push(cx.cerrado ? [cx.t.id, sku, prod, inicial, 0, inicial, "", contado] : [cx.t.id, sku, prod, inicial, ahora_(), usuario, contado]);
    });
    tAgregar_(cx.prod, filas);
    if (filas.length) valTrasEditar_(cx, usuario);
    return { agregados: filas.length, omitidos: omitidos };
  });
}

function valActualizarInicialCore_(sku, inicial, contadoEn, usuario, turnoId) {
  const n = entero_(inicial);
  if (isNaN(n) || n < 0) throw new Error("La cantidad inicial debe ser un número entero mayor o igual a 0.");
  return conLock_(() => {
    const cx = valCtx_(turnoId);
    const f = tBuscar_(cx.prod, r => txt_(r[0]) === cx.t.id && txt_(r[1]) === String(sku));
    if (!f) throw new Error("El producto no está en el turno.");
    const contado = normalizarFechaHora_(contadoEn) || ahora_();
    if (cx.cerrado) { tEscribir_(cx.prod, f.fila, 4, [n]); tEscribir_(cx.prod, f.fila, 8, [contado]); }
    else tEscribir_(cx.prod, f.fila, 4, [n, ahora_(), usuario, contado]);
    valTrasEditar_(cx, usuario);
    return true;
  });
}

function valQuitarProductoCore_(sku, turnoId, usuario) {
  return conLock_(() => {
    const cx = valCtx_(turnoId);
    const p = valCalcCtx_(cx).productos.find(x => x.sku === String(sku));
    if (!p) throw new Error("El producto no está en el turno.");
    if (p.validado > 0 || p.conflictos > 0) throw new Error(`No se puede quitar: tiene validaciones registradas. Anúlalas primero.`);
    tReescribir_(cx.prod, r => !(txt_(r[0]) === cx.t.id && txt_(r[1]) === String(sku)));
    if (cx.cerrado) marcarTurnoEditado_(cx.t, usuario || "");
    return true;
  });
}

function valAsegurarDestino_(nombre) {
  if (!valDestinos_().some(d => d.toLowerCase() === nombre.toLowerCase())) tAgregar_(VAL_T.destinos, [[nombre]]);
}

// obj = { sku, destino, cantidad, nota, offline?, hora?, turnoId? (del turno donde se hizo sin conexión) }
// turnoHist = id de un turno del historial al que se le agrega una validación olvidada
function valRegistrarCore_(obj, usuario, turnoHist) {
  const sku = String(obj.sku || "").trim();
  const destino = String(obj.destino || "").trim();
  const cantidad = entero_(obj.cantidad);
  const nota = String(obj.nota || "").trim();
  if (!destino) throw new Error("Escoge el destino (canal) de la validación.");
  if (isNaN(cantidad) || cantidad <= 0) throw new Error("La cantidad debe ser un número entero mayor que 0.");
  return conLock_(() => {
    const cx = valCtx_(turnoHist || "");
    if (!turnoHist && obj.turnoId && obj.turnoId !== cx.t.id) throw new Error(`Esta validación se hizo sin conexión en un turno que ya se cerró (${obj.turnoId}). No se registró.`);
    const p = valCalcCtx_(cx).productos.find(x => x.sku === sku);
    if (!p) throw new Error("El producto no está en el turno.");
    let estado = "ACTIVO", notaFinal = nota;
    if (cantidad > p.disponible) {
      if (!obj.offline || turnoHist) throw new Error(`No alcanza: de ${p.producto} solo quedan ${fM(Math.max(p.disponible, 0))} cajas disponibles.`);
      estado = "CONFLICTO";
      notaFinal = (nota ? nota + " · " : "") + `Sin conexión: al subir solo quedaban ${fM(Math.max(p.disponible, 0))}`;
    }
    valAsegurarDestino_(destino);
    const id = nuevoId_("V");
    const fecha = ((obj.offline || turnoHist) && normalizarFechaHora_(obj.hora)) || ahora_();
    const mod = turnoHist ? `Agregado después del cierre por ${usuario} ${ahora_()}` : (obj.offline ? `Subido ${ahora_()}` : "");
    tAgregar_(cx.reg, [[id, cx.t.id, fecha, sku, p.producto, destino, cantidad, usuario, notaFinal, estado, mod, p.contadoEn]]);
    valTrasEditar_(cx, usuario);
    return { id: id, disponible: estado === "ACTIVO" ? p.disponible - cantidad : p.disponible, conflicto: estado === "CONFLICTO" };
  });
}

// Editar un registro (también resuelve un CONFLICTO si la nueva cantidad alcanza)
function valEditarRegistroCore_(id, obj, usuario, turnoId) {
  const destino = String(obj.destino || "").trim();
  const cantidad = entero_(obj.cantidad);
  const nota = String(obj.nota === undefined ? "" : obj.nota).trim();
  if (!destino) throw new Error("Escoge el destino.");
  if (isNaN(cantidad) || cantidad <= 0) throw new Error("La cantidad debe ser un número entero mayor que 0.");
  return conLock_(() => {
    const cx = valCtx_(turnoId);
    const filas = tLeer_(cx.reg);
    const k = filas.findIndex(r => txt_(r[0]) === String(id));
    if (k === -1) throw new Error("Registro no encontrado.");
    if (txt_(filas[k][1]) !== cx.t.id) throw new Error("El registro no pertenece a este turno.");
    const estadoAnt = txt_(filas[k][9]) || "ACTIVO";
    if (estadoAnt === "ANULADO") throw new Error("El registro está anulado.");
    const p = valCalcCtx_(cx, filas).productos.find(x => x.sku === txt_(filas[k][3]));
    const anterior = estadoAnt === "ACTIVO" ? (Number(filas[k][6]) || 0) : 0;
    if (p && cantidad > p.disponible + anterior) throw new Error(`No alcanza: el máximo para este registro es ${fM(Math.max(p.disponible + anterior, 0))} cajas.`);
    valAsegurarDestino_(destino);
    tEscribir_(cx.reg, k + 2, 6, [destino, cantidad]);
    tEscribir_(cx.reg, k + 2, 9, [nota, "ACTIVO", `${estadoAnt === "CONFLICTO" ? "Conflicto resuelto" : "Editado"} por ${usuario} ${ahora_()} (antes ${Number(filas[k][6]) || 0})`]);
    valTrasEditar_(cx, usuario);
    return true;
  });
}

function valAnularCore_(id, usuario, turnoId) {
  return conLock_(() => {
    const cx = valCtx_(turnoId);
    const f = tBuscar_(cx.reg, r => txt_(r[0]) === String(id) && txt_(r[1]) === cx.t.id);
    if (!f) throw new Error("Registro no encontrado.");
    tEscribir_(cx.reg, f.fila, 10, ["ANULADO", `Anulado por ${usuario} ${ahora_()}`]);
    valTrasEditar_(cx, usuario);
    return true;
  });
}

function valDestinoCore_(accion, nombre) {
  nombre = String(nombre || "").trim();
  if (!nombre) throw new Error("Escribe el nombre del destino.");
  return conLock_(() => {
    if (accion === "agregar") { valAsegurarDestino_(nombre); return true; }
    if (accion === "quitar") { tReescribir_(VAL_T.destinos, r => txt_(r[0]).toLowerCase() !== nombre.toLowerCase()); return true; }
    throw new Error("Acción no válida.");
  });
}

function valDetalleDestinos_(p) { return Object.keys(p.porDestino).map(d => `${d}: ${p.porDestino[d]}`).join(" | "); }

// Al cerrar el turno: pasa productos y registros al histórico (se llama dentro del lock del turno)
function valArchivarTurno_(turnoId) {
  const filasProd = tLeer_(VAL_T.productos), filasReg = tLeer_(VAL_T.registros);
  const calc = valCalcular_(turnoId, filasProd, filasReg);
  tAgregar_(VAL_T.histProd, calc.productos.map(p => [turnoId, p.sku, p.producto, p.inicial, p.validado, p.disponible, valDetalleDestinos_(p), p.contadoEn]));
  tAgregar_(VAL_T.histReg, filasReg.filter(r => txt_(r[1]) === turnoId));
  tReescribir_(VAL_T.productos, r => txt_(r[0]) !== turnoId);
  tReescribir_(VAL_T.registros, r => txt_(r[1]) !== turnoId);
}

// Al abrir un turno: hereda el saldo del turno anterior (editable después)
function valHeredar_(nuevoId, prev, usuario) {
  const filas = tLeer_(VAL_T.histProd).filter(r => txt_(r[0]) === prev.id);
  const vistos = new Set();
  const nuevas = [];
  filas.forEach(r => {
    const sku = txt_(r[1]);
    if (!sku || vistos.has(sku)) return;
    vistos.add(sku);
    nuevas.push([nuevoId, sku, txt_(r[2]), Math.max(Number(r[5]) || 0, 0), ahora_(), `Heredado de turno ${prev.numero || "?"} de ${nombreCorto_(prev.cerradoPor)}`, ""]);
  });
  tAgregar_(VAL_T.productos, nuevas);
  return nuevas.length;
}

// ---------------------------------------------------------
// DATOS DE UN TURNO (abierto o cerrado) Y PDF
// ---------------------------------------------------------
function valDatosTurno_(turnoId) {
  prepararTurnos_();
  const abierto = turnoAbierto_(true);
  let t = turnoId ? turnoPorId_(turnoId) : abierto;
  if (!t) throw new Error(turnoId ? "Turno no encontrado: " + turnoId : "No hay turno abierto.");
  if (abierto && t.id === abierto.id) {
    const calc = valCalcular_(t.id, tLeer_(VAL_T.productos), tLeer_(VAL_T.registros));
    return { turno: t, productos: calc.productos, registros: calc.registros };
  }
  const prodHist = tLeer_(VAL_T.histProd).filter(r => txt_(r[0]) === t.id).map(r => [r[0], r[1], r[2], r[3], "", "", r[7]]);
  const calc = valCalcular_(t.id, prodHist, tLeer_(VAL_T.histReg));
  return { turno: t, productos: calc.productos, registros: calc.registros };
}

function infoTurnoHtml_(t) {
  return `<table class="info">
    <tr><td class="k">Turno</td><td><b>${escHtml_(turnoTexto_(t))}</b> (${HORARIO_TURNOS[t.numero] || ""})</td><td class="k">Estado</td><td>${t.estado === "ABIERTO" ? "En curso" : "Cerrado"}</td></tr>
    <tr><td class="k">Abierto por</td><td>${escHtml_(t.abiertoPor)} · ${fechaCorta_(t.inicio)}</td><td class="k">Cerrado por</td><td>${t.cerradoPor ? escHtml_(t.cerradoPor) + " · " + fechaCorta_(t.cierre) : "—"}</td></tr>
    ${t.recibeDe ? `<tr><td class="k">Recibe de</td><td colspan="3">${escHtml_(t.recibeDe)}</td></tr>` : ""}
    ${t.nota ? `<tr><td class="k">Nota</td><td colspan="3">${escHtml_(t.nota)}</td></tr>` : ""}
  </table>`;
}

function construirPDFValidacion(turnoId) {
  const dt = valDatosTurno_(turnoId);
  const t = dt.turno;
  const orden = valDestinos_();
  let usados = new Set();
  dt.productos.forEach(p => Object.keys(p.porDestino).forEach(d => usados.add(d)));
  const cols = orden.filter(d => usados.has(d)).concat(Array.from(usados).filter(d => !orden.includes(d)));
  const totalIni = dt.productos.reduce((a, p) => a + p.inicial, 0);
  const totalVal = dt.productos.reduce((a, p) => a + p.validado, 0);
  let filas = dt.productos.map(p => {
    const bg = p.disponible <= 0 ? "#ffcccc" : (p.inicial > 0 && p.disponible / p.inicial < 0.2 ? "#fff2cc" : "#e2efda");
    return `<tr><td>${escHtml_(p.sku)}</td><td class="izq"><b>${escHtml_(p.producto)}</b></td><td class="sm">${p.contadoEn ? fechaCorta_(p.contadoEn) : "Heredado"}</td><td>${fM(p.inicial)}</td>` +
      cols.map(d => `<td>${p.porDestino[d] ? fM(p.porDestino[d]) : "—"}</td>`).join("") +
      `<td><b>${fM(p.validado)}</b></td><td style="background-color:${bg} !important"><b>${fM(p.disponible)}</b></td></tr>`;
  }).join("");
  if (!filas) filas = `<tr><td colspan="${6 + cols.length}" class="vacio">No hubo productos en validación en este turno.</td></tr>`;
  const regs = dt.registros.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  let log = regs.map(r => `<tr class="${r.estado === "ANULADO" ? "anulado" : (r.estado === "CONFLICTO" ? "conflicto" : "")}"><td>${fechaCorta_(r.fecha)}</td><td>${r.contadoEn ? fechaCorta_(r.contadoEn) : "—"}</td><td>${escHtml_(r.sku)}</td><td class="izq">${escHtml_(r.producto)}</td><td>${escHtml_(r.destino)}</td><td><b>${fM(r.cantidad)}</b></td><td>${escHtml_(r.usuario)}</td><td class="izq">${escHtml_(r.nota)}${r.estado !== "ACTIVO" ? ` (${r.estado})` : ""}</td></tr>`).join("");
  if (!log) log = `<tr><td colspan="8" class="vacio">Sin validaciones registradas.</td></tr>`;
  const cuerpo = infoTurnoHtml_(t) +
    `<h3>Saldo por producto (cajas)</h3><table class="t"><thead><tr><th>SKU</th><th class="izq">Producto</th><th>Contado</th><th>Inicial</th>${cols.map(d => `<th>${escHtml_(d)}</th>`).join("")}<th>Validado</th><th>Disponible</th></tr></thead><tbody>${filas}
    ${dt.productos.length ? `<tr class="tot"><td></td><td class="izq">TOTAL</td><td></td><td>${fM(totalIni)}</td>${cols.map(d => `<td>${fM(dt.productos.reduce((a, p) => a + (p.porDestino[d] || 0), 0))}</td>`).join("")}<td>${fM(totalVal)}</td><td>${fM(totalIni - totalVal)}</td></tr>` : ""}</tbody></table>
    <h3>Detalle de validaciones</h3><table class="t"><thead><tr><th>Validado</th><th>Contado</th><th>SKU</th><th class="izq">Producto</th><th>Destino</th><th>Cajas</th><th>Usuario</th><th class="izq">Nota</th></tr></thead><tbody>${log}</tbody></table>
    <table class="firmas"><tr><td><div class="linea">Entrega</div></td><td><div class="linea">Recibe</div></td></tr></table>`;
  const html = pdfDoc_("VALIDACIÓN DE FACTURACIÓN", cuerpo, { vertical: true, css: ".anulado td{color:#888;text-decoration:line-through}.conflicto td{background:#ffcccc !important}" });
  return { blob: htmlAPdf_(html, `Validacion_${t.id}.pdf`), caption: `📝 *Validación de facturación* · ${turnoTexto_(t)}` };
}

// ---------------------------------------------------------
// BOT: /validacion (solo lectura)
// ---------------------------------------------------------
function obtenerValidacionBot() {
  let e;
  try { e = valEstadoCore_(); } catch (err) { return { text: "⚠️ Error leyendo validaciones: " + err.message, markup: null }; }
  let teclado = [[{ text: "🔄 Actualizar", callback_data: "VAL" }]];
  if (DASHBOARD_URL) teclado.push([{ text: "🌐 Gestionar en el dashboard", url: DASHBOARD_URL }]);
  if (!e.turno) return { text: "📝 *VALIDACIÓN DE FACTURACIÓN*\n\nNo hay turno abierto. Ábrelo desde el dashboard.", markup: { inline_keyboard: teclado } };
  teclado[0].push({ text: "📄 PDF", callback_data: "VALPDF" });
  let msj = `📝 *VALIDACIÓN DE FACTURACIÓN*\n${e.turno.texto} · desde ${fechaCorta_(e.turno.inicio)}\nAbierto por: ${escapeMd(e.turno.abiertoPor)}\n${SEP_}`;
  if (!e.productos.length) msj += "No hay productos en validación en este turno.";
  e.productos.forEach((p, idx) => {
    const ic = p.disponible <= 0 ? "🔴" : (p.inicial > 0 && p.disponible / p.inicial < 0.2 ? "🟡" : "🟢");
    msj += `*${idx + 1}.* ${skuProdMd_(p.sku, p.producto)}\nInicial: ${fM(p.inicial)} (contado ${p.contadoEn ? fechaCorta_(p.contadoEn) : "heredado"}) | Validado: ${fM(p.validado)}\n${ic} *Disponible: ${fM(p.disponible)}*${p.conflictos ? ` · ⚠️ ${p.conflictos} en conflicto` : ""}\n`;
    Object.keys(p.porDestino).forEach(d => { msj += `   • ${escapeMd(d)}: ${fM(p.porDestino[d])}\n`; });
    msj += "\n";
  });
  const ult = e.registros.filter(r => r.estado === "ACTIVO").slice(0, 5);
  if (ult.length) {
    msj += `--------------------------------\n*Últimas validaciones:*\n`;
    ult.forEach(r => { msj += `${soloHora_(r.fecha)} \`${r.sku}\` → ${escapeMd(r.destino)} *${fM(r.cantidad)}* (${escapeMd(r.usuario)})\n`; });
  }
  return { text: msj, markup: { inline_keyboard: teclado } };
}

// ---------------------------------------------------------
// MIGRACIÓN (una sola vez): pestañas Val_* del libro principal → archivos nuevos
// Las pestañas viejas quedan renombradas como zOLD_… (no se borra nada).
// ---------------------------------------------------------
function migrarValidacionV1_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const pr = PropertiesService.getScriptProperties();
    if (pr.getProperty("mig_val_v2")) return;
    const main = ss_();
    const vieja = n => main.getSheetByName(n);
    const leerV = (n, ancho) => { const sh = vieja(n); if (!sh || sh.getLastRow() < 2) return []; return sh.getRange(2, 1, sh.getLastRow() - 1, ancho).getValues(); };
    if (vieja("Val_Turnos")) {
      const destinosViejos = leerV("Val_Destinos", 1).map(r => txt_(r[0])).filter(x => x);
      const actuales = valDestinos_();
      tAgregar_(VAL_T.destinos, destinosViejos.filter(d => !actuales.some(a => a.toLowerCase() === d.toLowerCase())).map(d => [d]));
      tAgregar_(VAL_T.histProd, leerV("Val_Hist_Productos", 7).map(r => r.concat([""])));
      tAgregar_(VAL_T.histReg, leerV("Val_Hist_Registros", 11).map(r => r.concat([""])));
      const turnos = leerV("Val_Turnos", 7);
      const prodV = leerV("Val_Productos", 6).map(r => r.concat([""]));
      const regV = leerV("Val_Registros", 11).map(r => r.concat([""]));
      let filasTurno = [];
      turnos.forEach(r => {
        const id = txt_(r[0]);
        if (!id) return;
        const abierto = txt_(r[1]).toUpperCase() === "ABIERTO";
        if (abierto) {
          const calc = valCalcular_(id, prodV, regV);
          tAgregar_(VAL_T.histProd, calc.productos.map(p => [id, p.sku, p.producto, p.inicial, p.validado, p.disponible, valDetalleDestinos_(p), ""]));
          tAgregar_(VAL_T.histReg, regV.filter(x => txt_(x[1]) === id));
        }
        filasTurno.push([id, "", txt_(r[2]).substring(0, 10), "CERRADO", txt_(r[2]), txt_(r[3]), abierto ? ahora_() : txt_(r[4]), abierto ? "Migración" : txt_(r[5]), "", txt_(r[6]), ""]);
      });
      tAgregar_(TURNOS_DEF, filasTurno);
      turnosCambiaron_();
      ["Val_Turnos", "Val_Productos", "Val_Registros", "Val_Destinos", "Val_Hist_Productos", "Val_Hist_Registros"].forEach(n => {
        const sh = vieja(n);
        if (sh) { try { sh.setName("zOLD_" + n); } catch (e) { console.error(e); } }
      });
    } else {
      tHoja_(VAL_T.destinos);
    }
    pr.setProperty("mig_val_v2", ahora_());
  } finally { lock.releaseLock(); }
}

;
// ===== 22_Entrega_Turno.gs =====
// =========================================================
// 22 · ENTREGA DE TURNO (archivo Entrega_Turno_WMS)
// ---------------------------------------------------------
// Pertenece al turno abierto (el mismo de la validación) y se cierra con él.
// Secciones: BODEGA (normalmente estibas, cada cantidad con su módulo) · TPC ·
// KA (cajas) · PK (picking/preventa, cajas). Un producto puede estar en varias
// secciones, pero solo una fila por producto en cada sección; sus cantidades van
// una al lado de la otra.
// Precarga: los pocos (columna Minimo) en Bodega, KA y PK, y los TPC del WMS.
// Si ya hay conciliación del mismo turno y día, los conteos se toman de ella
// (normalmente: entrega del turno 3 ← conciliación del turno 3).
// Notas: una sola nota por turno, con un punto (fila) por novedad.
// =========================================================
const ENT_T = {
  items: { libro: "ENTREGA", nombre: "Ent_Items", cab: ["Turno_ID", "Seccion", "SKU", "Producto", "Cantidades", "Actualizado", "Usuario", "Origen"], texto: [1, 2, 3, 4, 5, 6, 7, 8] },
  notas: { libro: "ENTREGA", nombre: "Ent_Notas", cab: ["Turno_ID", "ID", "Hora", "Usuario", "Texto"], texto: [1, 2, 3, 4, 5] }
};
const ENT_SECCIONES = ["BODEGA", "TPC", "KA", "PK"];
const ENT_NOMBRES = { BODEGA: "Bodega", TPC: "TPC (tapacódigos)", KA: "KA", PK: "PK (picking / preventa)" };
const ENT_UNIDADES = ["Estibas", "Cajas", "Unidades"];

function entParseCant_(s) {
  let arr = [];
  try { arr = JSON.parse(String(s || "[]")); } catch (e) { arr = []; }
  if (!Array.isArray(arr)) arr = [];
  return arr.map(x => ({ n: numero_(x.n), un: ENT_UNIDADES.includes(x.un) ? x.un : "Cajas", m: x.m ? limpiarModulo(x.m) : "" }));
}

function entLimpiarCant_(arr) {
  return (arr || []).map(x => {
    const n = numero_(x.n);
    if (n < 0) throw new Error("Las cantidades no pueden ser negativas.");
    const m = String(x.m || "").trim();
    return { n: n, un: ENT_UNIDADES.includes(x.un) ? x.un : "Cajas", m: m ? limpiarModulo(m) : "" };
  }).filter(x => x.n > 0 || x.m);
}

// Para el PDF: si hay varias cantidades, primero el total (por unidad) y luego cada una con su módulo
function cantidadesPdf_(arr) {
  if (!arr || arr.length < 2) return escHtml_(cantTexto_(arr));
  const tot = {};
  arr.forEach(x => { tot[x.un] = (tot[x.un] || 0) + (Number(x.n) || 0); });
  const total = ENT_UNIDADES.filter(u => tot[u]).map(u => `${fM(tot[u])} ${u}`).join(" + ");
  return `<b>Total: ${escHtml_(total)}</b>` + arr.map(x => `<div class="cm">${x.m ? `<b>${escHtml_(x.m)}</b>: ` : ""}${fM(x.n)} ${escHtml_(x.un)}</div>`).join("");
}

function cantTexto_(arr) {
  if (!arr || !arr.length) return "—";
  return arr.map(x => `${fM(x.n)} ${x.un}${x.m ? " · " + x.m : ""}`).join(" | ");
}

// Total en cajas de una lista de cantidades (estibas × cajas por estiba)
function entACajas_(arr, cpe) {
  return (arr || []).reduce((a, x) => a + (x.un === "Estibas" ? x.n * (cpe || 1) : (x.un === "Unidades" ? 0 : x.n)), 0);
}

function cpeDeSku_(sku) {
  const i = obtenerInventarioLocal().find(x => x.s === sku && x.cpe > 1);
  if (i) return i.cpe;
  const s = skuInfo_(sku);
  return s ? (parseInt(s.cantEst, 10) || 1) : 1;
}

function entLeerTurno_(turnoId) {
  let sec = { BODEGA: [], TPC: [], KA: [], PK: [] };
  tLeer_(ENT_T.items).forEach((r, k) => {
    if (txt_(r[0]) !== turnoId) return;
    const s = txt_(r[1]).toUpperCase();
    if (!sec[s]) return;
    sec[s].push({ fila: k + 2, sku: txt_(r[2]), producto: txt_(r[3]), cant: entParseCant_(r[4]), actualizado: txt_(r[5]), usuario: txt_(r[6]), origen: txt_(r[7]) });
  });
  ENT_SECCIONES.forEach(s => sec[s].sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true })));
  const notas = tLeer_(ENT_T.notas).map((r, k) => ({ fila: k + 2, turnoId: txt_(r[0]), id: txt_(r[1]), hora: txt_(r[2]), usuario: txt_(r[3]), texto: txt_(r[4]) }))
    .filter(n => n.turnoId === turnoId).sort((a, b) => a.hora < b.hora ? -1 : 1);
  return { secciones: sec, notas: notas };
}

function entEstadoCore_(turnoId) {
  prepararTurnos_();
  if (turnoId) {
    const t = turnoParaEditar_(turnoId);
    const d = entLeerTurno_(t.id);
    return { historial: true, cerrado: t.estado !== "ABIERTO", turno: Object.assign({ texto: turnoTexto_(t), horario: HORARIO_TURNOS[t.numero] || "" }, t), secciones: d.secciones, notas: d.notas };
  }
  const te = turnoEstadoCore_();
  if (!te.turno) return { turnoInfo: te, turno: null, secciones: { BODEGA: [], TPC: [], KA: [], PK: [] }, notas: [] };
  const d = entLeerTurno_(te.turno.id);
  return { turnoInfo: te, turno: te.turno, secciones: d.secciones, notas: d.notas };
}

// ---------------------------------------------------------
// PRECARGA
// ---------------------------------------------------------
function entPrecargarCore_(secciones, usuario) {
  secciones = (secciones && secciones.length ? secciones : ENT_SECCIONES).filter(s => ENT_SECCIONES.includes(s));
  return conLock_(() => {
    const turno = turnoAbiertoObligatorio_();
    const actuales = entLeerTurno_(turno.id).secciones;
    const ya = new Set();
    ENT_SECCIONES.forEach(s => actuales[s].forEach(x => ya.add(s + "|" + x.sku)));
    const pocos = calcularPocos() || [];
    const inv = obtenerInventarioLocal().filter(i => i.tieneFisico && i.est === "DISPONIBLE");
    const conc = concConteosTurno_(turno.numero, turno.fecha);
    const origenConc = "Conciliación T" + turno.numero;
    let nuevas = [], agregados = { BODEGA: 0, TPC: 0, KA: 0, PK: 0 };
    const agregar = (s, sku, prod, cant, origen) => {
      if (ya.has(s + "|" + sku)) return;
      ya.add(s + "|" + sku);
      nuevas.push([turno.id, s, sku, prod, JSON.stringify(cant), ahora_(), usuario, origen]);
      agregados[s]++;
    };
    // Bodega / KA / PK: los pocos (y lo que trae la conciliación del mismo turno)
    let skus = pocos.map(p => ({ s: p.s, p: p.p }));
    if (conc) Object.keys(conc).forEach(s => { if (!skus.some(x => x.s === s)) skus.push({ s: s, p: conc[s].producto }); });
    skus.forEach(x => {
      const lotes = inv.filter(i => i.s === x.s);
      if (secciones.includes("BODEGA")) {
        if (conc && conc[x.s] && conc[x.s].bodega !== "") agregar("BODEGA", x.s, x.p, [{ n: conc[x.s].bodega, un: "Cajas", m: "" }], origenConc);
        else {
          let porMod = {};
          lotes.filter(esZonaBodega_).forEach(i => { porMod[i.m] = porMod[i.m] || { c: 0, cpe: i.cpe }; porMod[i.m].c += i.c; });
          let cant = [];
          Object.keys(porMod).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(m => {
            const o = porMod[m];
            const est = o.cpe > 1 ? Math.floor(o.c / o.cpe) : 0;
            const sueltas = o.cpe > 1 ? o.c % o.cpe : o.c;
            if (est > 0) cant.push({ n: est, un: "Estibas", m: m });
            if (sueltas > 0) cant.push({ n: sueltas, un: "Cajas", m: m });
          });
          agregar("BODEGA", x.s, x.p, cant, "WMS");
        }
      }
      ["KA", "PK"].forEach(s => {
        if (!secciones.includes(s)) return;
        const campo = s === "KA" ? "ka" : "pk";
        if (conc && conc[x.s] && conc[x.s][campo] !== "") { agregar(s, x.s, x.p, [{ n: conc[x.s][campo], un: "Cajas", m: "" }], origenConc); return; }
        const cajas = lotes.filter(i => s === "KA" ? esZonaKA_(i.m) : esZonaPK_(i)).reduce((a, i) => a + i.c, 0);
        agregar(s, x.s, x.p, cajas > 0 ? [{ n: cajas, un: "Cajas", m: "" }] : [], "WMS");
      });
    });
    // TPC: lo marcado como tapacódigo en el WMS, con su cantidad
    if (secciones.includes("TPC")) {
      let tpc = {};
      inv.filter(i => i.tpc).forEach(i => { tpc[i.s] = tpc[i.s] || { p: i.p, cant: [] }; tpc[i.s].cant.push({ n: i.c, un: "Cajas", m: i.m }); });
      Object.keys(tpc).forEach(s => agregar("TPC", s, tpc[s].p, tpc[s].cant, "WMS"));
    }
    tAgregar_(ENT_T.items, nuevas);
    return agregados;
  });
}

// ---------------------------------------------------------
// ESCRITURA
// ---------------------------------------------------------
function entGuardarItemCore_(seccion, sku, producto, cantidades, usuario, turnoId) {
  seccion = String(seccion || "").toUpperCase();
  sku = String(sku || "").trim();
  if (!ENT_SECCIONES.includes(seccion)) throw new Error("Sección no válida.");
  if (!/^\d+$/.test(sku)) throw new Error("SKU inválido.");
  const cant = entLimpiarCant_(cantidades);
  return conLock_(() => {
    const turno = turnoParaEditar_(turnoId);
    const f = tBuscar_(ENT_T.items, r => txt_(r[0]) === turno.id && txt_(r[1]).toUpperCase() === seccion && txt_(r[2]) === sku);
    const prod = String(producto || (skuInfo_(sku) || {}).prod || ("SKU " + sku)).trim();
    const origen = turno.estado === "ABIERTO" ? "Usuario" : "Editado después del cierre";
    if (f) tEscribir_(ENT_T.items, f.fila, 4, [prod, JSON.stringify(cant), ahora_(), usuario, origen]);
    else tAgregar_(ENT_T.items, [[turno.id, seccion, sku, prod, JSON.stringify(cant), ahora_(), usuario, origen]]);
    marcarTurnoEditado_(turno, usuario);
    return true;
  });
}

function entQuitarItemCore_(seccion, sku, turnoId, usuario) {
  seccion = String(seccion || "").toUpperCase();
  return conLock_(() => {
    const turno = turnoParaEditar_(turnoId);
    marcarTurnoEditado_(turno, usuario || "");
    const n = tReescribir_(ENT_T.items, r => !(txt_(r[0]) === turno.id && txt_(r[1]).toUpperCase() === seccion && txt_(r[2]) === String(sku)));
    if (!n) throw new Error("El producto no estaba en la sección.");
    return true;
  });
}

// Quitar toda una sección (por si alguien precargó por error)
function entQuitarSeccionCore_(seccion, turnoId, usuario) {
  seccion = String(seccion || "").toUpperCase();
  if (!ENT_SECCIONES.includes(seccion)) throw new Error("Sección no válida.");
  return conLock_(() => {
    const turno = turnoParaEditar_(turnoId);
    const n = tReescribir_(ENT_T.items, r => !(txt_(r[0]) === turno.id && txt_(r[1]).toUpperCase() === seccion));
    if (n) marcarTurnoEditado_(turno, usuario || "");
    return n;
  });
}

function entNotaAgregarCore_(texto, usuario, turnoId) {
  texto = String(texto || "").trim();
  if (!texto) throw new Error("Escribe la novedad.");
  return conLock_(() => {
    const turno = turnoParaEditar_(turnoId);
    marcarTurnoEditado_(turno, usuario);
    const id = nuevoId_("N");
    tAgregar_(ENT_T.notas, [[turno.id, id, ahora_(), usuario, texto]]);
    return id;
  });
}

function entNotaEditarCore_(id, texto, usuario, turnoId) {
  texto = String(texto || "").trim();
  if (!texto) throw new Error("Escribe la novedad.");
  return conLock_(() => {
    const turno = turnoParaEditar_(turnoId);
    marcarTurnoEditado_(turno, usuario);
    const f = tBuscar_(ENT_T.notas, r => txt_(r[1]) === String(id) && txt_(r[0]) === turno.id);
    if (!f) throw new Error("Punto de la nota no encontrado en el turno.");
    tEscribir_(ENT_T.notas, f.fila, 4, [usuario, texto]);
    return true;
  });
}

function entNotaQuitarCore_(id, turnoId, usuario) {
  return conLock_(() => {
    const turno = turnoParaEditar_(turnoId);
    marcarTurnoEditado_(turno, usuario || "");
    if (!tReescribir_(ENT_T.notas, r => !(txt_(r[1]) === String(id) && txt_(r[0]) === turno.id))) throw new Error("Punto no encontrado.");
    return true;
  });
}

// ---------------------------------------------------------
// PDF: dos columnas (izquierda Bodega y TPC · derecha PK y KA) y notas en otra página
// ---------------------------------------------------------
function construirPDFEntrega(turnoId) {
  prepararTurnos_();
  const t = turnoId ? turnoPorId_(turnoId) : turnoAbierto_(true);
  if (!t) throw new Error(turnoId ? "Turno no encontrado." : "No hay turno abierto.");
  const d = entLeerTurno_(t.id);
  const tablaSec = s => {
    const it = d.secciones[s];
    const filas = it.length ? it.map(x => `<tr><td>${escHtml_(x.sku)}</td><td class="izq">${escHtml_(x.producto)}</td><td class="izq">${cantidadesPdf_(x.cant)}</td></tr>`).join("")
      : `<tr><td colspan="3" class="vacio">Sin productos</td></tr>`;
    return `<div class="sec"><div class="sec-t">${ENT_NOMBRES[s]} (${it.length})</div><table class="t"><thead><tr><th style="width:16%">SKU</th><th class="izq">Producto</th><th class="izq" style="width:38%">Cantidades</th></tr></thead><tbody>${filas}</tbody></table></div>`;
  };
  const notas = d.notas.length ? `<ol class="notas">${d.notas.map(n => `<li><span class="sm">${soloHora_(n.hora)} · ${escHtml_(n.usuario)}</span><br>${escHtml_(n.texto)}</li>`).join("")}</ol>` : `<p class="vacio">Sin novedades registradas.</p>`;
  const cuerpo = infoTurnoHtml_(t) +
    `<table class="cols"><tr><td>${tablaSec("BODEGA")}${tablaSec("TPC")}</td><td>${tablaSec("PK")}${tablaSec("KA")}</td></tr></table>
    <table class="firmas"><tr><td><div class="linea">Entrega</div></td><td><div class="linea">Recibe</div></td></tr></table>
    <div style="page-break-before:always"></div>${cabeceraPDF_("ENTREGA DE TURNO · NOTAS", fechaCorte_(), "#003399")}
    <p><b>${escHtml_(turnoTexto_(t))}</b> · ${escHtml_(t.abiertoPor)}</p>${notas}`;
  const html = pdfDoc_("ENTREGA DE TURNO", cuerpo, { css: `table.cols{width:100%;border-collapse:collapse}table.cols>tbody>tr>td{width:50%;vertical-align:top;padding:0 5px;border:none}.sec{margin-bottom:10px;page-break-inside:avoid}.sec-t{font-weight:bold;color:#003399;font-size:11.5px;margin:4px 0}table.t td,table.t th{font-size:9px;padding:3px 4px}.notas li{margin-bottom:8px;font-size:11px}.cm{border-top:1px dotted #aaa;margin-top:2px;padding-top:2px}` });
  return { blob: htmlAPdf_(html, `Entrega_${t.id}.pdf`), caption: `📋 *Entrega de turno* · ${turnoTexto_(t)}` };
}

// ---------------------------------------------------------
// BOT: /entrega
// ---------------------------------------------------------
function obtenerEntregaBot() {
  let e;
  try { e = entEstadoCore_(); } catch (err) { return { text: "⚠️ " + err.message, markup: null }; }
  let teclado = [];
  if (DASHBOARD_URL) teclado.push([{ text: "🌐 Gestionar en el dashboard", url: DASHBOARD_URL }]);
  if (!e.turno) return { text: "📋 *ENTREGA DE TURNO*\n\nNo hay turno abierto.", markup: teclado.length ? { inline_keyboard: teclado } : null };
  let msj = `📋 *ENTREGA DE TURNO*\n${e.turno.texto} · ${escapeMd(e.turno.abiertoPor)}\n${SEP_}`;
  ENT_SECCIONES.forEach(s => {
    msj += `*${ENT_NOMBRES[s]}* (${e.secciones[s].length})\n`;
    e.secciones[s].slice(0, 8).forEach(x => { msj += `• \`${x.sku}\` ${escapeMd(x.producto)}: ${escapeMd(cantTexto_(x.cant))}\n`; });
    if (e.secciones[s].length > 8) msj += `   _+${e.secciones[s].length - 8} más_\n`;
    msj += "\n";
  });
  if (e.notas.length) msj += `*Notas*\n` + e.notas.map(n => `• ${escapeMd(n.texto)}`).join("\n");
  teclado.unshift([{ text: "📄 PDF de la entrega", callback_data: "ENTPDF" }]);
  return { text: msj, markup: { inline_keyboard: teclado } };
}

;
// ===== 23_Conciliacion.gs =====
// =========================================================
// 23 · CONCILIACIÓN CON FACTURACIÓN Y PRE-CONCILIACIÓN (archivo Conciliaciones_WMS)
// ---------------------------------------------------------
// Conciliación: al crearla se escoge el turno (1, 2 o 3; normalmente el 3).
// Se abre y se cierra aparte del turno de validación/entrega.
// Todo en CAJAS (el usuario convierte, porque el WMS a veces trae otro número
// de cajas por estiba). Columnas: Bodega · KA · PK (conteos) · Total (suma) ·
// Facturación (lo digita el usuario) · Bloqueo (se mandó a bloquear el excedente) ·
// Check: ✓ si Total ≥ Facturación, ✗ si Total < Facturación (facturación de más).
// Precarga: pocos + lo que se pase de pre-conciliación; los conteos salen de la
// entrega más reciente del turno anterior (T3 ← T2, T2 ← T1, T1 ← T3).
// Pre-conciliación: los turnos 1 y 2 anotan productos; el turno 3 escoge cuáles
// pasar. Botón "Limpiar" para dejarla en blanco después de conciliar.
// =========================================================
const CONC_T = {
  conc: { libro: "CONC", nombre: "Conciliaciones", cab: ["ID", "Turno_ID", "Turno", "Fecha", "Estado", "Inicio", "Abierto_por", "Cierre", "Cerrado_por", "Nota", "Editado_por", "Eliminado_por"], texto: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  items: { libro: "CONC", nombre: "Conc_Items", cab: ["Conc_ID", "SKU", "Producto", "Bodega", "KA", "PK", "Facturacion", "Bloqueo", "Actualizado", "Usuario", "Origen"], texto: [1, 2, 3, 9, 10, 11] },
  pre: { libro: "CONC", nombre: "Preconciliacion", cab: ["ID", "Fecha", "Turno", "SKU", "Producto", "Motivo", "Usuario", "Estado", "Conc_ID"], texto: [1, 2, 4, 5, 6, 7, 8, 9] }
};

function filaConc_(r, fila) {
  return { fila: fila, id: txt_(r[0]), turnoId: txt_(r[1]), numero: parseInt(r[2], 10) || 3, fecha: txt_(r[3]).substring(0, 10), estado: txt_(r[4]).toUpperCase(), inicio: txt_(r[5]), abiertoPor: txt_(r[6]), cierre: txt_(r[7]), cerradoPor: txt_(r[8]), nota: txt_(r[9]), editadoPor: txt_(r[10]), eliminadoPor: txt_(r[11]) };
}
function listarConc_() { return tLeer_(CONC_T.conc).map((r, k) => filaConc_(r, k + 2)).filter(c => c.id); }
function concAbierta_() { const l = listarConc_(); for (let k = l.length - 1; k >= 0; k--) if (l[k].estado === "ABIERTA") return l[k]; return null; }

// Conciliación sobre la que se escribe: la abierta (sin id) o una del historial (con id)
function concParaEditar_(concId) {
  if (!concId) { const c = concAbierta_(); if (!c) throw new Error("No hay conciliación abierta."); return c; }
  const c = listarConc_().find(x => x.id === String(concId));
  if (!c) throw new Error("Conciliación no encontrada.");
  if (c.estado === "ELIMINADA") throw new Error("Esa conciliación está eliminada. Un administrador la puede restaurar.");
  return c;
}
function marcarConcEditada_(c, usuario) { if (c && c.estado === "CERRADA") tEscribir_(CONC_T.conc, c.fila, 11, [`${usuario} · ${ahora_()}`]); }

const numVacio_ = v => (v === "" || v === null || v === undefined || String(v).trim() === "") ? "" : numero_(v);

function concItems_(concId) {
  return tLeer_(CONC_T.items).map((r, k) => ({ fila: k + 2, concId: txt_(r[0]), sku: txt_(r[1]), producto: txt_(r[2]), bodega: numVacio_(r[3]), ka: numVacio_(r[4]), pk: numVacio_(r[5]), fact: numVacio_(r[6]), bloqueo: r[7] === true || String(r[7]).toUpperCase() === "TRUE" || String(r[7]).toUpperCase() === "SI", actualizado: txt_(r[8]), usuario: txt_(r[9]), origen: txt_(r[10]) }))
    .filter(x => x.concId === concId)
    .map(x => {
      x.total = (x.bodega || 0) + (x.ka || 0) + (x.pk || 0);
      x.check = x.fact === "" ? null : x.total >= x.fact;
      x.nivel = nivelConc_(x.total, x.fact);
      x.diferencia = x.fact === "" ? null : x.total - x.fact;
      return x;
    })
    .sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true }));
}

// Color de cada producto: mal (facturación tiene de más) · ok (el conteo cubre) ·
// sobra (tenemos más del 50 % por encima de lo facturado: diferencia grande que revisar)
function nivelConc_(total, fact) {
  if (fact === "" || fact === null || fact === undefined) return "";
  if (total < fact) return "mal";
  if (fact > 0 && total > fact * 1.5) return "sobra";
  return "ok";
}

function turnoAnterior_(n) { return { 1: 3, 2: 1, 3: 2 }[Number(n)] || 2; }

// Conteos (en cajas) de la entrega más reciente del turno indicado
function conteosEntregaDe_(numero) {
  const t2 = listarTurnos_().filter(t => Number(t.numero) === Number(numero) && t.estado !== "ELIMINADO").sort((a, b) => a.inicio < b.inicio ? 1 : -1)[0];
  if (!t2) return { turno: null, mapa: {} };
  const sec = entLeerTurno_(t2.id).secciones;
  let mapa = {};
  [["BODEGA", "bodega"], ["KA", "ka"], ["PK", "pk"]].forEach(([s, campo]) => {
    sec[s].forEach(x => {
      mapa[x.sku] = mapa[x.sku] || { producto: x.producto, bodega: "", ka: "", pk: "" };
      mapa[x.sku][campo] = Math.round(entACajas_(x.cant, cpeDeSku_(x.sku)));
    });
  });
  return { turno: t2, mapa: mapa };
}

// Para la entrega de un turno: conteos de la conciliación de ese mismo turno y día (abierta o la última cerrada)
function concConteosTurno_(numero, fecha) {
  const l = listarConc_().filter(c => c.estado !== "ELIMINADA" && Number(c.numero) === Number(numero) && (c.fecha === fecha || c.estado === "ABIERTA")).sort((a, b) => a.inicio < b.inicio ? 1 : -1);
  if (!l.length) return null;
  let mapa = {};
  concItems_(l[0].id).forEach(x => { mapa[x.sku] = { producto: x.producto, bodega: x.bodega, ka: x.ka, pk: x.pk }; });
  return Object.keys(mapa).length ? mapa : null;
}

function concEstadoCore_(concId) {
  prepararTurnos_();
  const c = concId ? concParaEditar_(concId) : concAbierta_();
  const pre = preListar_();
  const t = turnoAbierto_();
  const ult = listarConc_().filter(x => x.estado === "CERRADA").sort((a, b) => a.cierre < b.cierre ? 1 : -1)[0] || null;
  const sugerido = t ? Number(t.numero) : 3;
  if (!c) return { conc: null, items: [], pre: pre, turno: t ? { numero: t.numero, texto: turnoTexto_(t) } : null, ultima: ult, sugerido: sugerido, horarios: HORARIO_TURNOS };
  const items = concItems_(c.id);
  const tot = items.reduce((a, x) => ({ bodega: a.bodega + (x.bodega || 0), ka: a.ka + (x.ka || 0), pk: a.pk + (x.pk || 0), total: a.total + x.total, fact: a.fact + (x.fact || 0) }), { bodega: 0, ka: 0, pk: 0, total: 0, fact: 0 });
  return { historial: !!concId, conc: Object.assign({ texto: `Conciliación turno ${c.numero} · ${formatearFecha(c.fecha)}` }, c), items: items, totales: tot, pre: pre, turno: t ? { numero: t.numero, texto: turnoTexto_(t) } : null, ultima: ult, sugerido: sugerido, faltantes: items.filter(x => x.check === false).length };
}

// opts = { numero: 1|2|3, pocos: true|false, entrega: true|false, pre: [ids de pre-conciliación] }
function concAbrirCore_(opts, usuario) {
  opts = opts || {};
  const numero = parseInt(opts.numero === undefined ? 3 : opts.numero, 10);
  if (![1, 2, 3].includes(numero)) throw new Error("Escoge el turno de la conciliación: 1, 2 o 3.");
  prepararTurnos_();
  return conLock_(() => {
    const ab = concAbierta_();
    if (ab) throw new Error(`Ya hay una conciliación abierta (${formatearFecha(ab.fecha)}, de ${nombreCorto_(ab.abiertoPor)}). Ciérrala antes de abrir otra.`);
    const t = turnoAbierto_();
    const base = "C" + Utilities.formatDate(new Date(), TZ, "yyyyMMdd-HHmmss");
    const usados = new Set(listarConc_().map(x => x.id));
    let id = base, n = 1;
    while (usados.has(id)) id = base + "-" + (++n);
    const mismo = t && Number(t.numero) === numero;
    const fecha = mismo ? t.fecha : fechaTurno_(numero);
    tAgregar_(CONC_T.conc, [[id, mismo ? t.id : "", numero, fecha, "ABIERTA", ahora_(), usuario, "", "", ""]]);
    // Productos: pocos + pre-conciliación elegida + lo contado en la entrega del turno anterior
    const ant = turnoAnterior_(numero);
    const ent = conteosEntregaDe_(ant);
    let skus = {};
    if (opts.pocos !== false) (calcularPocos() || []).forEach(p => { skus[p.s] = skus[p.s] || { producto: p.p, origen: "Pocos" }; });
    const idsPre = new Set((opts.pre || []).map(String));
    const pre = preListar_().filter(p => idsPre.has(p.id));
    pre.forEach(p => { skus[p.sku] = { producto: p.producto, origen: "Pre-conciliación" }; });
    if (opts.entrega !== false) Object.keys(ent.mapa).forEach(s => { skus[s] = skus[s] || { producto: ent.mapa[s].producto, origen: "Entrega T" + ant }; });
    const filas = Object.keys(skus).map(s => {
      const c = opts.entrega !== false ? (ent.mapa[s] || {}) : {};
      return [id, s, skus[s].producto, c.bodega === undefined ? "" : c.bodega, c.ka === undefined ? "" : c.ka, c.pk === undefined ? "" : c.pk, "", false, ahora_(), usuario, skus[s].origen + (c.bodega !== undefined ? " · conteo T" + ant : "")];
    });
    tAgregar_(CONC_T.items, filas);
    // Marcar la pre-conciliación usada
    if (pre.length) {
      const todas = tLeer_(CONC_T.pre);
      todas.forEach((r, k) => { if (idsPre.has(txt_(r[0]))) tEscribir_(CONC_T.pre, k + 2, 8, ["PASADO", id]); });
    }
    return { id: id, numero: numero, productos: filas.length, conteoDe: ent.turno && opts.entrega !== false ? turnoTexto_(ent.turno) : "" };
  });
}

function concAgregarProductosCore_(items, usuario, concId) {
  return conLock_(() => {
    const c = concParaEditar_(concId);
    const ya = new Set(concItems_(c.id).map(x => x.sku));
    const ant = turnoAnterior_(c.numero);
    const ent = conteosEntregaDe_(ant);
    let filas = [], omitidos = [];
    (items || []).forEach(it => {
      const sku = String(it.sku || "").trim();
      if (!/^\d+$/.test(sku)) { omitidos.push(`${sku}: SKU inválido`); return; }
      if (ya.has(sku)) { omitidos.push(`${sku}: ya está`); return; }
      ya.add(sku);
      const e = ent.mapa[sku] || {};
      filas.push([c.id, sku, String(it.producto || (skuInfo_(sku) || {}).prod || "SKU " + sku), e.bodega === undefined ? "" : e.bodega, e.ka === undefined ? "" : e.ka, e.pk === undefined ? "" : e.pk, "", false, ahora_(), usuario, "Usuario" + (ent.mapa[sku] ? " · conteo T" + ant : "")]);
    });
    tAgregar_(CONC_T.items, filas);
    // Los que vienen de pre-conciliación quedan marcados como pasados
    const idsPre = new Set((items || []).filter(it => it.preId).map(it => String(it.preId)));
    if (idsPre.size) tLeer_(CONC_T.pre).forEach((r, k) => { if (idsPre.has(txt_(r[0]))) tEscribir_(CONC_T.pre, k + 2, 8, ["PASADO", c.id]); });
    if (filas.length) marcarConcEditada_(c, usuario);
    return { agregados: filas.length, omitidos: omitidos };
  });
}

// campos = { bodega, ka, pk, fact, bloqueo } (solo los que cambian)
function concGuardarItemCore_(sku, campos, usuario, concId) {
  campos = campos || {};
  const val = v => { if (v === "" || v === null) return ""; const n = entero_(v); if (isNaN(n) || n < 0) throw new Error("Las cantidades deben ser números enteros (cajas)."); return n; };
  return conLock_(() => {
    const c = concParaEditar_(concId);
    const f = tBuscar_(CONC_T.items, r => txt_(r[0]) === c.id && txt_(r[1]) === String(sku));
    if (!f) throw new Error("El producto no está en la conciliación.");
    let r = f.datos.slice();
    if (campos.bodega !== undefined) r[3] = val(campos.bodega);
    if (campos.ka !== undefined) r[4] = val(campos.ka);
    if (campos.pk !== undefined) r[5] = val(campos.pk);
    if (campos.fact !== undefined) r[6] = val(campos.fact);
    if (campos.bloqueo !== undefined) r[7] = campos.bloqueo === true || campos.bloqueo === "true";
    r[8] = ahora_(); r[9] = usuario;
    tEscribir_(CONC_T.items, f.fila, 1, r);
    marcarConcEditada_(c, usuario);
    return true;
  });
}

function concQuitarItemCore_(sku, concId, usuario) {
  return conLock_(() => {
    const c = concParaEditar_(concId);
    marcarConcEditada_(c, usuario || "");
    if (!tReescribir_(CONC_T.items, r => !(txt_(r[0]) === c.id && txt_(r[1]) === String(sku)))) throw new Error("El producto no estaba en la conciliación.");
    return true;
  });
}

function concCerrarCore_(nota, usuario) {
  return conLock_(() => {
    const c = concAbierta_();
    if (!c) throw new Error("No hay conciliación abierta.");
    tEscribir_(CONC_T.conc, c.fila, 5, ["CERRADA", c.inicio, c.abiertoPor, ahora_(), usuario, String(nota || "")]);
    return c.id;
  });
}

function concNotaCore_(concId, nota, usuario) {
  return conLock_(() => {
    const c = concParaEditar_(concId);
    tEscribir_(CONC_T.conc, c.fila, 10, [String(nota || "").trim()]);
    marcarConcEditada_(c, usuario);
    return true;
  });
}

// Eliminar (queda como ELIMINADA y se puede restaurar). Quien la abrió o un administrador.
function concEliminarCore_(concId, u) {
  return conLock_(() => {
    const c = listarConc_().find(x => x.id === String(concId));
    if (!c) throw new Error("Conciliación no encontrada.");
    if (c.estado === "ELIMINADA") return true;
    if (!puedeEliminar_(c.abiertoPor, u)) throw new Error("Solo quien abrió la conciliación o un administrador la puede eliminar.");
    tEscribir_(CONC_T.conc, c.fila, 5, ["ELIMINADA"]);
    if (!c.cierre) tEscribir_(CONC_T.conc, c.fila, 8, [ahora_()]);
    tEscribir_(CONC_T.conc, c.fila, 12, [`${u.nombre} · ${ahora_()}`]);
    return true;
  });
}

function concRestaurarCore_(concId, u) {
  if (u.rol !== "administrador") throw new Error("Solo un administrador puede restaurar.");
  return conLock_(() => {
    const c = listarConc_().find(x => x.id === String(concId));
    if (!c || c.estado !== "ELIMINADA") throw new Error("Esa conciliación no está eliminada.");
    if (concAbierta_() && !c.cerradoPor) throw new Error("Hay otra conciliación abierta; ciérrala antes de restaurar esta.");
    tEscribir_(CONC_T.conc, c.fila, 5, [c.cerradoPor ? "CERRADA" : "ABIERTA"]);
    tEscribir_(CONC_T.conc, c.fila, 12, [""]);
    return true;
  });
}

function construirPDFConciliacion(concId) {
  prepararTurnos_();
  const c = concId ? listarConc_().find(x => x.id === concId) : (concAbierta_() || listarConc_().filter(x => x.estado === "CERRADA").sort((a, b) => a.cierre < b.cierre ? 1 : -1)[0]);
  if (!c) throw new Error("No hay conciliaciones.");
  const items = concItems_(c.id);
  const v = x => x === "" ? "—" : fM(x);
  const filas = items.map(x => `<tr class="${x.nivel}"><td>${escHtml_(x.sku)}</td><td class="izq">${escHtml_(x.producto)}</td><td>${v(x.bodega)}</td><td>${v(x.ka)}</td><td>${v(x.pk)}</td><td><b>${fM(x.total)}</b></td><td>${v(x.fact)}</td><td>${x.bloqueo ? "☑" : "☐"}</td><td class="chk">${x.nivel === "mal" ? "✗" : x.nivel === "sobra" ? "✓ +" + Math.round((x.total / x.fact - 1) * 100) + "%" : x.nivel === "ok" ? "✓" : ""}</td></tr>`).join("") || `<tr><td colspan="9" class="vacio">Sin productos.</td></tr>`;
  const cuerpo = `<table class="info"><tr><td class="k">Conciliación</td><td><b>Turno ${c.numero} · ${formatearFecha(c.fecha)}</b></td><td class="k">Estado</td><td>${c.estado === "ABIERTA" ? "En curso" : "Cerrada"}</td></tr>
    <tr><td class="k">Abierta por</td><td>${escHtml_(c.abiertoPor)} · ${fechaCorta_(c.inicio)}</td><td class="k">Cerrada por</td><td>${c.cerradoPor ? escHtml_(c.cerradoPor) + " · " + fechaCorta_(c.cierre) : "—"}</td></tr>${c.nota ? `<tr><td class="k">Nota</td><td colspan="3">${escHtml_(c.nota)}</td></tr>` : ""}</table>
    <p class="sm">Todo en cajas. <span style="background:#ffcccc;padding:1px 5px">✗ facturación tiene de más</span> (revisar bloqueo del excedente) · <span style="background:#e2efda;padding:1px 5px">✓ el conteo cubre la facturación</span> · <span style="background:#dbe8ff;padding:1px 5px">✓ +50 % o más: diferencia grande, revisar</span></p>
    <table class="t"><thead><tr><th>SKU</th><th class="izq">Producto</th><th>Bodega</th><th>KA</th><th>PK</th><th>Total</th><th>Facturación</th><th>Bloqueo</th><th>Check</th></tr></thead><tbody>${filas}</tbody></table>
    <table class="firmas"><tr><td><div class="linea">Bodega</div></td><td><div class="linea">Facturación</div></td></tr></table>`;
  const html = pdfDoc_("CONCILIACIÓN CON FACTURACIÓN", cuerpo, { vertical: true, css: "tr.mal td{background:#ffcccc !important}tr.ok td{background:#e2efda !important}tr.sobra td{background:#dbe8ff !important}.chk{font-size:12px;font-weight:bold}" });
  return { blob: htmlAPdf_(html, `Conciliacion_${c.id}.pdf`), caption: `⚖️ *Conciliación* · turno ${c.numero} · ${formatearFecha(c.fecha)}` };
}

// ---------------------------------------------------------
// PRE-CONCILIACIÓN
// ---------------------------------------------------------
function preListar_() {
  return tLeer_(CONC_T.pre).map((r, k) => ({ fila: k + 2, id: txt_(r[0]), fecha: txt_(r[1]), turno: txt_(r[2]), sku: txt_(r[3]), producto: txt_(r[4]), motivo: txt_(r[5]), usuario: txt_(r[6]), estado: txt_(r[7]) || "PENDIENTE", concId: txt_(r[8]) })).filter(x => x.id);
}

function preAgregarCore_(sku, producto, motivo, usuario) {
  sku = String(sku || "").trim();
  if (!/^\d+$/.test(sku)) throw new Error("SKU inválido.");
  return conLock_(() => {
    if (preListar_().some(p => p.sku === sku && p.estado === "PENDIENTE")) throw new Error(`El SKU ${sku} ya está anotado en la pre-conciliación.`);
    const t = turnoAbierto_();
    const id = nuevoId_("P");
    tAgregar_(CONC_T.pre, [[id, ahora_(), t ? t.numero : "", sku, String(producto || (skuInfo_(sku) || {}).prod || "SKU " + sku), String(motivo || "").trim(), usuario, "PENDIENTE", ""]]);
    return id;
  });
}

function preQuitarCore_(id) {
  return conLock_(() => {
    if (!tReescribir_(CONC_T.pre, r => txt_(r[0]) !== String(id))) throw new Error("Registro no encontrado.");
    return true;
  });
}

function preLimpiarCore_() {
  return conLock_(() => tReescribir_(CONC_T.pre, () => false));
}

// ---------------------------------------------------------
// BOT
// ---------------------------------------------------------
function obtenerConciliacionBot() {
  let e;
  try { e = concEstadoCore_(); } catch (err) { return { text: "⚠️ " + err.message, markup: null }; }
  let teclado = [[{ text: "🔄 Actualizar", callback_data: "CONC" }]];
  if (DASHBOARD_URL) teclado.push([{ text: "🌐 Gestionar en el dashboard", url: DASHBOARD_URL }]);
  if (!e.conc) return { text: `⚖️ *CONCILIACIÓN*\n\nNo hay conciliación abierta.${e.ultima ? `\nÚltima: ${formatearFecha(e.ultima.fecha)}, cerrada por ${escapeMd(e.ultima.cerradoPor)}.` : ""}`, markup: { inline_keyboard: teclado } };
  teclado[0].push({ text: "📄 PDF", callback_data: "CONCPDF" });
  let msj = `⚖️ *CONCILIACIÓN TURNO ${e.conc.numero}* · ${formatearFecha(e.conc.fecha)}\nAbierta por ${escapeMd(e.conc.abiertoPor)}\n${e.faltantes ? `❌ *${e.faltantes} con facturación de más*` : "✅ Sin faltantes"}\n${SEP_}`;
  e.items.forEach(x => {
    msj += `${x.nivel === "mal" ? "❌" : x.nivel === "sobra" ? "🔵" : x.nivel === "ok" ? "✅" : "▫️"} ${skuProdMd_(x.sku, x.producto)}\n   Bodega ${x.bodega === "" ? "—" : fM(x.bodega)} | KA ${x.ka === "" ? "—" : fM(x.ka)} | PK ${x.pk === "" ? "—" : fM(x.pk)} = *${fM(x.total)}*${x.fact !== "" ? ` · Fact ${fM(x.fact)}` : ""}${x.bloqueo ? " · 🔒 bloqueado" : ""}\n`;
  });
  return { text: msj, markup: { inline_keyboard: teclado } };
}

function obtenerPreconciliacionBot() {
  const pre = preListar_().filter(p => p.estado === "PENDIENTE");
  let msj = `📌 *PRE-CONCILIACIÓN* (${pre.length})\n_Productos que los turnos 1 y 2 creen que hay que conciliar_\n${SEP_}`;
  if (!pre.length) msj += "No hay productos anotados.";
  pre.forEach(p => { msj += `• ${skuProdMd_(p.sku, p.producto)}\n   ${p.turno ? "Turno " + p.turno + " · " : ""}${escapeMd(p.usuario)} · ${fechaCorta_(p.fecha)}${p.motivo ? `\n   _${escapeMd(p.motivo)}_` : ""}\n`; });
  let teclado = [[{ text: "🔄 Actualizar", callback_data: "PRE" }]];
  if (DASHBOARD_URL) teclado.push([{ text: "🌐 Anotar en el dashboard", url: DASHBOARD_URL }]);
  return { text: msj, markup: { inline_keyboard: teclado } };
}

;
// ===== 24_Historial.gs =====
// =========================================================
// 24 · HISTORIALES: validaciones, entregas de turno y conciliaciones
// Cada uno por separado, con filtros por fecha, turno y persona. Desde el
// dashboard se pueden abrir para ver, editar (queda "Editado por"), sacar el
// PDF o eliminar (quien lo abrió o un administrador; el administrador puede
// ver los eliminados y restaurarlos).
// =========================================================

// Resumen ya calculado (lo pone la versión nueva, que no baja todas las filas viejas):
// { turnos: { id: { prod, val, cajas, BODEGA, TPC, KA, PK, notas } }, conc: { id: { prod, mal } } }
let _HIST_RESUMEN = null;

// f = { tipo: "VALIDACION"|"ENTREGA"|"CONCILIACION", desde, hasta, turno, persona, eliminados }
function histListar_(f, u) {
  f = f || {};
  prepararTurnos_();
  const tipo = String(f.tipo || "VALIDACION").toUpperCase();
  const persona = normalizarTexto(String(f.persona || "").toLowerCase()).trim();
  const verElim = !!f.eliminados && u && u.rol === "administrador";
  let lis = [];

  if (tipo === "VALIDACION" || tipo === "ENTREGA") {
    let det = {};
    const suma = (id, k, n) => { det[id] = det[id] || {}; det[id][k] = (det[id][k] || 0) + (n === undefined ? 1 : n); };
    if (_HIST_RESUMEN) det = _HIST_RESUMEN.turnos || {};
    else if (tipo === "VALIDACION") {
      tLeer_(VAL_T.histProd).forEach(r => suma(txt_(r[0]), "prod"));
      tLeer_(VAL_T.productos).forEach(r => suma(txt_(r[0]), "prod"));
      tLeer_(VAL_T.histReg).concat(tLeer_(VAL_T.registros)).forEach(r => { if ((txt_(r[9]) || "ACTIVO") === "ACTIVO") { suma(txt_(r[1]), "val"); suma(txt_(r[1]), "cajas", Number(r[6]) || 0); } });
    } else {
      tLeer_(ENT_T.items).forEach(r => suma(txt_(r[0]), txt_(r[1]).toUpperCase()));
      tLeer_(ENT_T.notas).forEach(r => suma(txt_(r[0]), "notas"));
    }
    listarTurnos_().forEach(t => {
      if (t.estado === "ELIMINADO" && !verElim) return;
      const d = det[t.id] || {};
      lis.push({
        tipo: tipo, id: t.id, numero: t.numero, fecha: t.fecha || t.inicio.substring(0, 10), estado: t.estado, inicio: t.inicio, cierre: t.cierre,
        abiertoPor: t.abiertoPor, cerradoPor: t.cerradoPor, recibeDe: t.recibeDe, nota: t.nota, editadoPor: t.editadoPor, eliminadoPor: t.eliminadoPor,
        resumen: tipo === "VALIDACION"
          ? [["Productos", d.prod || 0], ["Validaciones", d.val || 0], ["Cajas validadas", d.cajas || 0]]
          : [["Bodega", d.BODEGA || 0], ["TPC", d.TPC || 0], ["KA", d.KA || 0], ["PK", d.PK || 0], ["Notas", d.notas || 0]],
        puedeEliminar: !!u && puedeEliminar_(t.abiertoPor, u)
      });
    });
  } else {
    let det = {};
    if (_HIST_RESUMEN) det = _HIST_RESUMEN.conc || {};
    else tLeer_(CONC_T.items).forEach(r => {
      const id = txt_(r[0]);
      det[id] = det[id] || { prod: 0, mal: 0 };
      det[id].prod++;
      const tot = numero_(r[3]) + numero_(r[4]) + numero_(r[5]);
      if (String(r[6]).trim() !== "" && tot < numero_(r[6])) det[id].mal++;
    });
    listarConc_().forEach(c => {
      if (c.estado === "ELIMINADA" && !verElim) return;
      const d = det[c.id] || { prod: 0, mal: 0 };
      lis.push({
        tipo: "CONCILIACION", id: c.id, numero: c.numero, fecha: c.fecha, estado: c.estado, inicio: c.inicio, cierre: c.cierre,
        abiertoPor: c.abiertoPor, cerradoPor: c.cerradoPor, recibeDe: "", nota: c.nota, editadoPor: c.editadoPor, eliminadoPor: c.eliminadoPor,
        resumen: [["Productos", d.prod], ["Con facturación de más", d.mal]],
        puedeEliminar: !!u && puedeEliminar_(c.abiertoPor, u)
      });
    });
  }

  lis = lis.filter(x => {
    if (f.desde && x.fecha < f.desde) return false;
    if (f.hasta && x.fecha > f.hasta) return false;
    if (f.turno && String(x.numero) !== String(f.turno)) return false;
    if (persona && !normalizarTexto(`${x.abiertoPor} ${x.cerradoPor} ${x.editadoPor}`.toLowerCase()).includes(persona)) return false;
    return true;
  });
  lis.sort((a, b) => a.inicio < b.inicio ? 1 : (a.inicio > b.inicio ? -1 : 0));
  return lis.slice(0, 300);
}

;
// ===== 25_Mantenimiento.gs =====
// =========================================================
// 25 · MANTENIMIENTO: archivar el historial viejo
// ---------------------------------------------------------
// Mueve a un archivo aparte (Frecs_Archivo) los turnos, entregas, validaciones y
// conciliaciones cerrados o eliminados de hace más de N días (por defecto 30), y la
// pre-conciliación ya pasada. Así las pestañas que lee la página quedan pequeñas y
// todo carga más rápido. No se borra nada: las filas quedan en Frecs_Archivo con las
// mismas columnas.
// - Nunca se mueve lo abierto ni el último turno cerrado (de él recibe el siguiente).
// - Primero se copia al archivo y después se quita del original: si algo falla a
//   mitad, a lo sumo queda repetido en el archivo, nunca se pierde.
// - Solo el administrador (botón en los historiales del dashboard).
// =========================================================
const MANT_DIAS = 30;

function libroArchivo_() {
  if (!ARCHIVOS.ARCH) {
    const ss = SpreadsheetApp.create("Frecs_Archivo");
    ARCHIVOS.ARCH = ss.getId();
    PropertiesService.getScriptProperties().setProperty("ARCHIVO_SHEET_ID", ARCHIVOS.ARCH);
    _LIBROS.ARCH = ss;
  }
  return libro_("ARCH");
}
// Misma tabla, pero en el archivo de archivo
const defArchivo_ = def => Object.assign({}, def, { libro: "ARCH", inicial: null });

function fechaCorte_(dias) {
  return Utilities.formatDate(new Date(new Date().getTime() - (Number(dias) || MANT_DIAS) * 86400000), TZ, "yyyy-MM-dd");
}

// Qué se movería (sin mover nada)
function mantCalcular_(dias) {
  prepararTurnos_();
  const corte = fechaCorte_(dias);
  const ultimo = ultimoTurnoCerrado_();
  const viejo = f => !!f && String(f).substring(0, 10) < corte;
  const turnos = listarTurnos_().filter(t => (t.estado === "CERRADO" || t.estado === "ELIMINADO") && viejo(t.cierre || t.inicio) && !(ultimo && ultimo.id === t.id));
  const concs = listarConc_().filter(c => (c.estado === "CERRADA" || c.estado === "ELIMINADA") && viejo(c.cierre || c.inicio));
  const tIds = new Set(turnos.map(t => t.id)), cIds = new Set(concs.map(c => c.id));
  // Tablas con la columna del ID del dueño (turno o conciliación)
  const planes = [
    { def: TURNOS_DEF, sale: r => tIds.has(txt_(r[0])) },
    { def: VAL_T.histProd, sale: r => tIds.has(txt_(r[0])) },
    { def: VAL_T.histReg, sale: r => tIds.has(txt_(r[1])) },
    { def: ENT_T.items, sale: r => tIds.has(txt_(r[0])) },
    { def: ENT_T.notas, sale: r => tIds.has(txt_(r[0])) },
    { def: CONC_T.conc, sale: r => cIds.has(txt_(r[0])) },
    { def: CONC_T.items, sale: r => cIds.has(txt_(r[0])) },
    { def: CONC_T.pre, sale: r => txt_(r[7]).toUpperCase() !== "PENDIENTE" && viejo(txt_(r[1])) }
  ];
  let filas = 0;
  planes.forEach(p => { p.filas = tLeer_(p.def).filter(p.sale); filas += p.filas.length; });
  return { corte: corte, turnos: turnos.length, conciliaciones: concs.length, filas: filas, planes: planes };
}

function mantPreviaCore_(dias) {
  const c = mantCalcular_(dias);
  return { corte: c.corte, turnos: c.turnos, conciliaciones: c.conciliaciones, filas: c.filas, archivo: ARCHIVOS.ARCH ? "https://docs.google.com/spreadsheets/d/" + ARCHIVOS.ARCH : "" };
}

function mantArchivarCore_(dias, usuario) {
  return conLock_(() => {
    const c = mantCalcular_(dias);
    if (!c.filas) return { corte: c.corte, turnos: 0, conciliaciones: 0, filas: 0, archivo: ARCHIVOS.ARCH ? "https://docs.google.com/spreadsheets/d/" + ARCHIVOS.ARCH : "" };
    libroArchivo_();
    // 1) Copiar al archivo
    c.planes.forEach(p => { if (p.filas.length) tAgregar_(defArchivo_(p.def), p.filas); });
    SpreadsheetApp.flush();
    // 2) Quitar del original
    c.planes.forEach(p => { if (p.filas.length) tReescribir_(p.def, r => !p.sale(r)); });
    turnosCambiaron_();
    console.log(`Archivado por ${usuario}: ${c.turnos} turnos, ${c.conciliaciones} conciliaciones, ${c.filas} filas (antes del ${c.corte})`);
    return { corte: c.corte, turnos: c.turnos, conciliaciones: c.conciliaciones, filas: c.filas, archivo: "https://docs.google.com/spreadsheets/d/" + ARCHIVOS.ARCH };
  });
}

;
// ===== 26_Supabase.gs =====
// =========================================================
// 26 · SUPABASE (migración, fase 2)
// ---------------------------------------------------------
// Mientras dura la migración, Frecs sigue trabajando en las hojas y además:
//  1) Cada sincronización con el WMS se escribe también en Supabase (sb_reemplazar_wms).
//     Si Supabase falla, la sincronización de las hojas sigue igual (solo queda el aviso).
//  2) sbImportarTodo() copia las hojas a Supabase (usuarios con su PIN, Sku, canales,
//     turnos, validaciones, entregas, conciliaciones…). Se corre a mano desde el editor y
//     se puede repetir: cada vez deja Supabase igual a las hojas.
//
// Propiedades del script (Configuración del proyecto → Propiedades del script):
//   SUPABASE_URL     https://xxxx.supabase.co
//   SUPABASE_SECRET  la clave SECRETA (sb_secret_… o la vieja service_role). Nunca va al navegador.
// Sin esas dos propiedades, nada de este archivo se ejecuta.
// =========================================================

function sbCfg_() {
  const p = PropertiesService.getScriptProperties();
  // Solo se usa el dominio: si se pegó la "RESTful endpoint" (…supabase.co/rest/v1/) o algo más, se recorta
  const u = String(p.getProperty("SUPABASE_URL") || "").trim();
  const m = /^(https?:\/\/[^\/?#\s]+)/i.exec(u);
  return { url: m ? m[1] : "", key: String(p.getProperty("SUPABASE_SECRET") || "").trim() };
}
function sbActivo_() { const c = sbCfg_(); return !!(c.url && c.key); }

// Llama una función de la base (rpc). Lanza error con el mensaje de Postgres si falla.
function sbRpc_(fn, args) {
  const c = sbCfg_();
  if (!c.url || !c.key) throw new Error("Faltan las propiedades SUPABASE_URL y SUPABASE_SECRET.");
  const r = UrlFetchApp.fetch(c.url + "/rest/v1/rpc/" + fn, {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { apikey: c.key, Authorization: "Bearer " + c.key },
    payload: JSON.stringify(args || {})
  });
  const code = r.getResponseCode(), txt = r.getContentText();
  if (code >= 300) {
    let m = txt;
    try { const j = JSON.parse(txt); m = j.message || j.hint || j.error || txt; } catch (e) {}
    throw new Error(`Supabase ${fn} (${code}): ${String(m).substring(0, 300)}`);
  }
  return txt ? JSON.parse(txt) : null;
}

// ---------- conversiones hoja → base ----------
const SB_TZ = "-05:00"; // Bogotá, sin horario de verano
function sbTs_(v) {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : Utilities.formatDate(v, TZ, "yyyy-MM-dd'T'HH:mm:ss") + SB_TZ;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/.test(s)) return s;
  let m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?(\.\d+)?$/.exec(s);
  if (m) return `${m[1]}T${m[2]}${m[3] || ":00"}${SB_TZ}`;
  m = /^(\d{4}-\d{2}-\d{2})$/.exec(s);
  if (m) return `${m[1]}T00:00:00${SB_TZ}`;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(s);
  if (m) return `${m[3]}-${("0" + m[2]).slice(-2)}-${("0" + m[1]).slice(-2)}T${("0" + (m[4] || "0")).slice(-2)}:${m[5] || "00"}:00${SB_TZ}`;
  return null;
}
function sbFecha_(v) {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : Utilities.formatDate(v, TZ, "yyyy-MM-dd");
  const s = String(v).trim();
  let m = /^(\d{4}-\d{2}-\d{2})/.exec(s); if (m) return m[1];
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s); if (m) return `${m[3]}-${("0" + m[2]).slice(-2)}-${("0" + m[1]).slice(-2)}`;
  return null;
}
function sbNum_(v) {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return isFinite(n) ? n : null;
}
function sbBool_(v) { return v === true || /^(true|si|sí|1|x)$/i.test(String(v === null || v === undefined ? "" : v).trim()); }
function sbTxt_(v) { const s = txt_(v); return s === "" ? null : s; }
function sbTurno_(v) { const n = parseInt(v, 10); return [1, 2, 3].includes(n) ? n : null; }

// ---------- 1) sincronización ----------
// filas y mods con la misma forma que escribe sincronizarWMSCore en WMS_Base / WMS_Modulos
function sbSubirWms_(filas, mods, meta) {
  const f = filas.map(r => ({
    sku: String(r[0]).trim(), producto: sbTxt_(r[1]), modulo: String(r[2]).trim(), estibas: sbNum_(r[3]) || 0, cajas: sbNum_(r[4]) || 0,
    unidades: sbNum_(r[5]) || 0, vence: sbFecha_(r[6]), dias: sbNum_(r[7]) === null ? null : Math.round(sbNum_(r[7])), estado: sbTxt_(r[8]),
    candado: sbTxt_(r[9]), carga: sbTs_(r[10]), familia: sbTxt_(r[11]), cajas_por_estiba: sbNum_(r[12]), obs: sbTxt_(r[13]),
    picking: sbBool_(r[14]), actualizacion: sbTs_(r[15])
  }));
  const m = mods.map(r => ({ modulo: String(r[0]).trim(), nombre_wms: sbTxt_(r[1]), seccion: sbTxt_(r[2]), bodega: sbTxt_(r[3]), zona: sbTxt_(r[4]),
    picking: sbBool_(r[5]), con_producto: sbBool_(r[6]), skus: sbNum_(r[7]) || 0, lotes: sbNum_(r[8]) || 0 }));
  meta = meta || {};
  return sbRpc_("sb_reemplazar_wms", {
    p_filas: f, p_modulos: m,
    p_estado: { ultima_sync: sbTs_(new Date()), ultimo_movimiento: meta.ultimo ? sbTs_(new Date(meta.ultimo)) : null, filas: meta.filas || f.length, modulos: meta.modulos || m.length, por: meta.por || "Apps Script" }
  });
}

// Sube a Supabase lo que ya está en WMS_Base y WMS_Modulos (sin consultar el WMS)
function sbSubirWmsDesdeHojas_() {
  const b = hoja_("WMS_Base"), mo = hoja_("WMS_Modulos");
  const filas = b && b.getLastRow() > 1 ? b.getRange(2, 1, b.getLastRow() - 1, WMS_HEADERS.length).getValues().filter(r => String(r[0]).trim()) : [];
  const mods = mo && mo.getLastRow() > 1 ? mo.getRange(2, 1, mo.getLastRow() - 1, WMS_MOD_HEADERS.length).getValues().filter(r => String(r[0]).trim()) : [];
  const p = PropertiesService.getScriptProperties();
  return sbSubirWms_(filas, mods, { ultimo: parseInt(p.getProperty("wms_last_movement_ts") || "0", 10) || 0, filas: filas.filter(r => numero_(r[3]) > 0 || numero_(r[4]) > 0 || numero_(r[5]) > 0).length, por: "Importación" });
}

// ---------- filas de los maestros (hoja → base) ----------
function sbFilasSku_() {
  return sbSinRepetir_(catalogoSku_().map(c => ({
    sku: c.sku, id_hoja: sbTxt_(c.idHoja),
    producto: c.prod || c.sku, cubicaje: sbTxt_(c.cub), piso: sbTxt_(c.piso), plancha: sbTxt_(c.plancha), cant_x_estiba: sbTxt_(c.cantEst),
    presentacion: sbTxt_(c.pres), usuario: sbTxt_(c.usuario), contexto: sbTxt_(c.ctx), minimo: c.minimo, t1: c.t1, t2: c.t2, ka: c.ka, estibas_por_cara: c.estCara
  })), x => x.sku);
}
function sbFilasCanales_(omitir) {
  const TIPOS = { general: "General", familia: "Familia", contiene: "Contiene" };
  const canales = [];
  tLeer_(CANALES_DEF).forEach((r, k) => {
    const canal = txt_(r[0]).toUpperCase(), tipo = TIPOS[txt_(r[1]).toLowerCase()], dias = sbNum_(r[3]);
    if (!["T1", "T2", "KA"].includes(canal) || !tipo || dias === null) { if (omitir) omitir("canales", "canal, tipo o días no válidos"); return; }
    canales.push({ orden: k + 1, canal: canal, tipo: tipo, valor: txt_(r[2]), dias_minimos: Math.round(dias), nota: sbTxt_(r[4]) });
  });
  return canales;
}
function sbFilasConsumo_() {
  return sbSinRepetir_(tLeer_(CONSUMO_DEF).filter(r => txt_(r[0])).map((r, k) => ({
    sku: txt_(r[0]), producto: sbTxt_(r[1]), modulo_elegido: sbTxt_(r[2]), elegido_por: sbTxt_(r[3]), elegido_en: sbTs_(r[4]), orden: k + 1 })), x => x.sku);
}
function sbFilasLimbo_() {
  const limbo = [];
  const shL = hoja_("Limbo");
  if (shL) shL.getDataRange().getValues().slice(1).forEach(r => {
    if (!String(r[0]).trim()) return;
    limbo.push({ id: String(r[0]).trim(), producto: String(r[1] || "").trim() || "(sin nombre)", vencimiento: r[2] instanceof Date ? Utilities.formatDate(r[2], TZ, "dd/MM/yyyy") : sbTxt_(r[2]),
      presentacion: sbTxt_(r[3]), cubicaje: sbTxt_(r[4]), fecha_reporte: r[5] instanceof Date ? Utilities.formatDate(r[5], TZ, "dd/MM/yyyy HH:mm") : sbTxt_(r[5]) });
  });
  return sbSinRepetir_(limbo, x => x.id);
}
const SB_FILAS = { sku: () => sbFilasSku_(), canales: () => sbFilasCanales_(null), consumo: () => sbFilasConsumo_(), limbo: () => sbFilasLimbo_() };

// ---------- espejo en los dos sentidos (fase 4a) ----------
// Hoja → Supabase: después de un cambio hecho en el dashboard actual o en el bot.
// Nunca rompe la acción original: si falla, queda en el registro.
function sbEspejo_(tabla) {
  if (!sbActivo_() || !SB_FILAS[tabla]) return;
  try { sbRpc_("guardar_filas", { p_token: "bot:Apps Script", p_cambios: [{ tabla: tabla, reemplazar: true, poner: SB_FILAS[tabla]() }] }); }
  catch (e) { console.error(`Espejo ${tabla} → Supabase: ${e.message}`); }
}

// Supabase → hojas: después de un cambio hecho en el dashboard nuevo.
function sbBajarMaestros_(tablas) {
  const quiere = t => !tablas || !tablas.length || tablas.includes(t);
  const m = sbRpc_("sb_maestros", {});
  const hecho = [];
  return conLock_(() => {
    if (quiere("limbo")) {
      const sh = hoja_("Limbo");
      if (sh) {
        const n = sh.getLastRow();
        if (n > 1) sh.getRange(2, 1, n - 1, 6).clearContent();
        const filas = m.limbo.map(x => [x.id, x.producto || "", x.vencimiento || "", x.presentacion || "", x.cubicaje || "", x.fecha_reporte || ""]);
        if (filas.length) sh.getRange(2, 1, filas.length, 6).setValues(filas);
        hecho.push("limbo");
      }
    }
    if (quiere("consumo") && hoja_("Consumo")) {
      tReescribir_(CONSUMO_DEF, () => false);
      tAgregar_(CONSUMO_DEF, m.consumo.map(x => [x.sku, x.producto || "", x.modulo_elegido || "", x.elegido_por || "", x.elegido_en || ""]));
      hecho.push("consumo");
    }
    if (quiere("canales")) {
      const sh = tHoja_(CANALES_DEF), n = sh.getLastRow();
      if (n > 1) sh.getRange(2, 1, n - 1, CANALES_DEF.cab.length).clearContent();
      const filas = m.canales.map(x => [x.canal, x.tipo, x.valor || "", x.dias_minimos, x.nota || ""]);
      if (filas.length) sh.getRange(2, 1, filas.length, CANALES_DEF.cab.length).setValues(filas);
      _CANALES = null;
      hecho.push("canales");
    }
    if (quiere("sku")) {
      _SKU = null;
      const sk = leerSku_();
      if (sk.sh) {
        const ancho = sk.sh.getLastColumn();
        const campos = { id: "id_hoja", sku: "sku", prod: "producto", cub: "cubicaje", piso: "piso", plancha: "plancha", cantEst: "cant_x_estiba",
          pres: "presentacion", usuario: "usuario", ctx: "contexto", minimo: "minimo", t1: "t1", t2: "t2", ka: "ka", estCara: "estibas_por_cara" };
        const enBase = new Set();
        m.sku.forEach(x => {
          enBase.add(String(x.sku));
          const actual = sk.mapa[String(x.sku)];
          const fila = actual ? sk.sh.getRange(actual.fila, 1, 1, ancho).getValues()[0] : new Array(ancho).fill("");
          const antes = JSON.stringify(fila);
          Object.keys(campos).forEach(k => {
            if (sk.cols[k] === undefined) return;
            if (k === "id" && actual) return; // el Id de la hoja se respeta
            const v = x[campos[k]];
            fila[sk.cols[k]] = v === null || v === undefined ? "" : v;
          });
          if (!actual) sk.sh.appendRow(fila);
          else if (JSON.stringify(fila) !== antes) sk.sh.getRange(actual.fila, 1, 1, ancho).setValues([fila]);
        });
        // Los que ya no están en la base se quitan de la hoja (de abajo hacia arriba)
        sk.lista.filter(c => !enBase.has(String(c.sku))).map(c => c.fila).sort((a, b) => b - a).forEach(f => sk.sh.deleteRow(f));
        invalidarSku_();
        hecho.push("sku");
      }
    }
    cacheBorrar_("inv");
    return hecho;
  });
}

// ---------- 2) importación completa ----------
// Lee una tabla de turnos de su archivo y, si existe, también del archivo de historial viejo
function sbLeerConArchivo_(def) {
  let filas = tLeer_(def);
  if (ARCHIVOS.ARCH) { try { filas = filas.concat(tLeer_(defArchivo_(def))); } catch (e) { console.log("Frecs_Archivo: " + e.message); } }
  return filas;
}
// Quita repetidos por clave (queda el último, como en la hoja)
function sbSinRepetir_(filas, clave) {
  const m = new Map();
  filas.forEach(f => m.set(clave(f), f));
  return Array.from(m.values());
}
// Envía en bloques de 500; el primero vacía la tabla (y sus hijos)
function sbEnviarTabla_(tabla, filas) {
  let n = 0;
  if (!filas.length) { sbRpc_("sb_importar_tabla", { p_tabla: tabla, p_filas: [], p_vaciar: true }); return 0; }
  for (let k = 0; k < filas.length; k += 500) n += sbRpc_("sb_importar_tabla", { p_tabla: tabla, p_filas: filas.slice(k, k + 500), p_vaciar: k === 0 });
  return n;
}

function sbImportarTodo() {
  if (!sbActivo_()) throw new Error("Faltan las propiedades SUPABASE_URL y SUPABASE_SECRET.");
  prepararTurnos_();
  const res = {}, omit = {};
  const omitir = (tabla, motivo) => { omit[tabla] = omit[tabla] || {}; omit[tabla][motivo] = (omit[tabla][motivo] || 0) + 1; };
  const ahoraTs = sbTs_(new Date());

  // --- Usuarios (con la huella de su PIN actual y la sal) ---
  const us = tLeer_(USR_DEF).filter(r => txt_(r[0])).map(r => ({
    nombre: txt_(r[0]), pin_legado: sbTxt_(r[1]), rol: txt_(r[2]).toLowerCase(),
    activo: !(r[3] === false || /^(false|no)$/i.test(String(r[3]).trim())), creado: sbTs_(r[4]), creado_por: sbTxt_(r[5]), ultimo_acceso: sbTs_(r[6])
  }));
  res.usuarios = sbRpc_("sb_importar_usuarios", { p_sal: salPin_(), p_usuarios: us });

  // --- Maestros ---
  res.sku = sbEnviarTabla_("sku", sbFilasSku_());
  res.canales = sbEnviarTabla_("canales", sbFilasCanales_(omitir));

  const cap = [];
  const shCap = hoja_("Capacidad_Bodega");
  if (shCap) shCap.getDataRange().getValues().slice(1).forEach(r => {
    const m = limpiarModulo(r[0]), caras = parseInt(r[1], 10);
    if (!m || m === "N/A" || !caras) return omitir("capacidad_bodega", "sin módulo o sin caras");
    cap.push({ modulo: m, caras: caras, capacidad: parseInt(r[2], 10) || null });
  });
  res.capacidad_bodega = sbEnviarTabla_("capacidad_bodega", sbSinRepetir_(cap, x => x.modulo));

  res.consumo = sbEnviarTabla_("consumo", sbFilasConsumo_());
  res.limbo = sbEnviarTabla_("limbo", sbFilasLimbo_());

  res.destinos = sbEnviarTabla_("destinos", sbSinRepetir_(valDestinos_().map((d, k) => ({ nombre: d, orden: k + 1 })), x => x.nombre.toLowerCase()));

  // --- Turnos (al vaciarlos se vacían también validación y entrega) ---
  const tur = [], inicioTurno = {};
  sbSinRepetir_(sbLeerConArchivo_(TURNOS_DEF).map((r, k) => filaTurno_(r, k + 2)).filter(t => t.id), t => t.id).forEach(t => {
    const ini = sbTs_(t.inicio) || sbTs_(t.fecha) || sbTs_(t.cierre);
    if (!ini) return omitir("turnos", "sin fecha de inicio");
    const est = ["ABIERTO", "CERRADO", "ELIMINADO"].includes(t.estado) ? t.estado : "CERRADO";
    inicioTurno[t.id] = ini;
    tur.push({ id: t.id, numero: sbTurno_(t.numero), fecha: sbFecha_(t.fecha) || sbFecha_(t.inicio), estado: est, inicio: ini, abierto_por: sbTxt_(t.abiertoPor),
      cierre: sbTs_(t.cierre), cerrado_por: sbTxt_(t.cerradoPor), recibe_de_id: sbTxt_(t.recibeDeId), recibe_de: sbTxt_(t.recibeDe), nota: sbTxt_(t.nota),
      editado_por: sbTxt_(t.editadoPor), eliminado_por: sbTxt_(t.eliminadoPor) });
  });
  if (tur.filter(t => t.estado === "ABIERTO").length > 1) throw new Error("La hoja Turnos tiene más de un turno ABIERTO. Deja solo uno antes de importar.");
  res.turnos = sbEnviarTabla_("turnos", tur);
  const hayTurno = id => { if (inicioTurno[id]) return true; return false; };

  const vp = [];
  tLeer_(VAL_T.productos).forEach(r => vp.push({ turno_id: txt_(r[0]), sku: txt_(r[1]), producto: sbTxt_(r[2]), inicial: numero_(r[3]), actualizado: sbTs_(r[4]), usuario: sbTxt_(r[5]), contado_en: sbTs_(r[6]) }));
  sbLeerConArchivo_(VAL_T.histProd).forEach(r => vp.push({ turno_id: txt_(r[0]), sku: txt_(r[1]), producto: sbTxt_(r[2]), inicial: numero_(r[3]), actualizado: null, usuario: null, contado_en: sbTs_(r[7]) }));
  const vp2 = [];
  vp.forEach(x => {
    if (!x.sku) return omitir("val_productos", "sin SKU");
    if (!hayTurno(x.turno_id)) return omitir("val_productos", "turno inexistente");
    x.actualizado = x.actualizado || x.contado_en || inicioTurno[x.turno_id];
    vp2.push(x);
  });
  res.val_productos = sbEnviarTabla_("val_productos", sbSinRepetir_(vp2, x => x.turno_id + "|" + x.sku));

  const vr = [];
  tLeer_(VAL_T.registros).concat(sbLeerConArchivo_(VAL_T.histReg)).forEach(r => {
    const id = txt_(r[0]), turno = txt_(r[1]), cant = sbNum_(r[6]);
    if (!id) return omitir("val_registros", "sin ID");
    if (!hayTurno(turno)) return omitir("val_registros", "turno inexistente");
    if (!(cant > 0)) return omitir("val_registros", "cantidad 0 o vacía");
    const est = txt_(r[9]).toUpperCase() || "ACTIVO";
    vr.push({ id: id, turno_id: turno, fecha: sbTs_(r[2]) || inicioTurno[turno], sku: txt_(r[3]), producto: sbTxt_(r[4]), destino: sbTxt_(r[5]), cantidad: cant,
      usuario: sbTxt_(r[7]), nota: sbTxt_(r[8]), estado: ["ACTIVO", "ANULADO", "CONFLICTO"].includes(est) ? est : "ACTIVO", modificado_por: sbTxt_(r[10]), contado_en: sbTs_(r[11]) });
  });
  res.val_registros = sbEnviarTabla_("val_registros", sbSinRepetir_(vr, x => x.id));

  const ei = [];
  sbLeerConArchivo_(ENT_T.items).forEach(r => {
    const turno = txt_(r[0]), sec = txt_(r[1]).toUpperCase(), sk = txt_(r[2]);
    if (!hayTurno(turno)) return omitir("ent_items", "turno inexistente");
    if (!["BODEGA", "TPC", "KA", "PK"].includes(sec) || !sk) return omitir("ent_items", "sección o SKU no válido");
    let cant = [];
    try { cant = JSON.parse(String(r[4] || "[]")); } catch (e) { cant = []; }
    ei.push({ turno_id: turno, seccion: sec, sku: sk, producto: sbTxt_(r[3]), cantidades: Array.isArray(cant) ? cant : [], actualizado: sbTs_(r[5]) || inicioTurno[turno], usuario: sbTxt_(r[6]), origen: sbTxt_(r[7]) });
  });
  res.ent_items = sbEnviarTabla_("ent_items", sbSinRepetir_(ei, x => x.turno_id + "|" + x.seccion + "|" + x.sku));

  const en = [];
  sbLeerConArchivo_(ENT_T.notas).forEach((r, k) => {
    const turno = txt_(r[0]), texto = txt_(r[4]);
    if (!hayTurno(turno)) return omitir("ent_notas", "turno inexistente");
    if (!texto) return omitir("ent_notas", "nota vacía");
    en.push({ id: txt_(r[1]) || ("NIMP" + k), turno_id: turno, hora: sbTs_(r[2]) || inicioTurno[turno], usuario: sbTxt_(r[3]), texto: texto });
  });
  res.ent_notas = sbEnviarTabla_("ent_notas", sbSinRepetir_(en, x => x.id));

  // --- Conciliaciones ---
  const cc = [], inicioConc = {};
  sbSinRepetir_(sbLeerConArchivo_(CONC_T.conc).map((r, k) => filaConc_(r, k + 2)).filter(c => c.id), c => c.id).forEach(c => {
    const ini = sbTs_(c.inicio) || sbTs_(c.fecha) || sbTs_(c.cierre);
    if (!ini) return omitir("conciliaciones", "sin fecha de inicio");
    inicioConc[c.id] = ini;
    cc.push({ id: c.id, turno_id: sbTxt_(c.turnoId), numero: sbTurno_(c.numero), fecha: sbFecha_(c.fecha) || sbFecha_(c.inicio),
      estado: ["ABIERTA", "CERRADA", "ELIMINADA"].includes(c.estado) ? c.estado : "CERRADA", inicio: ini, abierto_por: sbTxt_(c.abiertoPor),
      cierre: sbTs_(c.cierre), cerrado_por: sbTxt_(c.cerradoPor), nota: sbTxt_(c.nota), editado_por: sbTxt_(c.editadoPor), eliminado_por: sbTxt_(c.eliminadoPor) });
  });
  if (cc.filter(c => c.estado === "ABIERTA").length > 1) throw new Error("La hoja Conciliaciones tiene más de una ABIERTA. Deja solo una antes de importar.");
  res.conciliaciones = sbEnviarTabla_("conciliaciones", cc);

  const ci = [];
  sbLeerConArchivo_(CONC_T.items).forEach(r => {
    const id = txt_(r[0]), sk = txt_(r[1]);
    if (!inicioConc[id]) return omitir("conc_items", "conciliación inexistente");
    if (!sk) return omitir("conc_items", "sin SKU");
    ci.push({ conc_id: id, sku: sk, producto: sbTxt_(r[2]), bodega: sbNum_(r[3]), ka: sbNum_(r[4]), pk: sbNum_(r[5]), facturacion: sbNum_(r[6]),
      bloqueo: sbBool_(r[7]), actualizado: sbTs_(r[8]) || inicioConc[id], usuario: sbTxt_(r[9]), origen: sbTxt_(r[10]) });
  });
  res.conc_items = sbEnviarTabla_("conc_items", sbSinRepetir_(ci, x => x.conc_id + "|" + x.sku));

  const pre = [];
  sbLeerConArchivo_(CONC_T.pre).forEach(r => {
    const id = txt_(r[0]), sk = txt_(r[3]);
    if (!id || !sk) return omitir("preconciliacion", "sin ID o SKU");
    pre.push({ id: id, fecha: sbTs_(r[1]) || ahoraTs, turno: sbTurno_(r[2]), sku: sk, producto: sbTxt_(r[4]), motivo: sbTxt_(r[5]), usuario: sbTxt_(r[6]),
      estado: txt_(r[7]).toUpperCase() || "PENDIENTE", conc_id: sbTxt_(r[8]) });
  });
  res.preconciliacion = sbEnviarTabla_("preconciliacion", sbSinRepetir_(pre, x => x.id));

  // --- Inventario actual (lo que ya está en WMS_Base; no se consulta el WMS) ---
  try { res.wms = sbSubirWmsDesdeHojas_(); } catch (e) { res.wms = { error: e.message }; }

  const conteos = sbRpc_("sb_conteos", {});
  const resumen = { importado: res, omitidas: omit, conteosSupabase: conteos };
  console.log("Importación a Supabase:\n" + JSON.stringify(resumen, null, 2));
  return resumen;
}

// ---------- 3) pedidos del dashboard nuevo ----------
// El dashboard en GitHub Pages pide sincronizar con el WMS. Se valida la sesión en Supabase
// (la misma que usa para entrar) y se hace la sincronización normal: hojas + Supabase.
function sbWebPost_(data) {
  let r;
  try {
    if (!sbActivo_()) throw new Error("Falta configurar Supabase en Apps Script (SUPABASE_URL y SUPABASE_SECRET).");
    if (!["sincronizar", "maestros", "pdf_telegram", "turnos", "sincronizar_bot", "maestros_bot"].includes(data.accion)) throw new Error("Acción no válida.");
    // Pedidos del bot en Supabase (función frecs-bot): se autorizan con el secreto compartido
    if (data.accion === "sincronizar_bot" || data.accion === "maestros_bot") {
      const sec = prop_("BOT_SECRET", "");
      if (!sec || String(data.secreto || "") !== sec) throw new Error("No autorizado.");
      if (data.accion === "maestros_bot") return ContentService.createTextOutput(JSON.stringify({ ok: true, hojas: sbBajarMaestros_(Array.isArray(data.tablas) ? data.tablas.map(String) : []) })).setMimeType(ContentService.MimeType.JSON);
      const s2 = sincronizarWMSCore(data.forzar === true);
      if (!s2.ok) throw new Error(s2.error);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, filas: s2.fisicas, modulos: s2.modulos, supabase: s2.supabase })).setMimeType(ContentService.MimeType.JSON);
    }
    let u;
    try { u = sbRpc_("mi_sesion", { p_token: String(data.token || "") }); }
    catch (e) { const m = String(e.message); if (/SESION:/.test(m)) throw new Error(m.substring(m.indexOf("SESION:"))); throw e; }
    if (data.accion === "turnos") {
      // Después del cambio definitivo: copia a las hojas los turnos y conciliaciones que cambiaron en la app
      const r2 = turnosEnSupabase_() ? sbBajarTurnos_((data.turnos || []).map(String), (data.concs || []).map(String)) : { omitido: "modo prueba" };
      return ContentService.createTextOutput(JSON.stringify({ ok: true, hojas: r2 })).setMimeType(ContentService.MimeType.JSON);
    }
    if (data.accion === "pdf_telegram") return ContentService.createTextOutput(JSON.stringify(sbPdfTelegram_(data, u))).setMimeType(ContentService.MimeType.JSON);
    if (data.accion === "maestros") {
      const hecho = sbBajarMaestros_(Array.isArray(data.tablas) ? data.tablas.map(String) : []);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, hojas: hecho })).setMimeType(ContentService.MimeType.JSON);
    }
    const s = sincronizarWMSCore(data.forzar === true);
    if (!s.ok) throw new Error(s.error);
    console.log(`Sincronización desde el dashboard nuevo por ${u.nombre}: ${s.fisicas} ubicaciones`);
    r = { ok: true, filas: s.fisicas, modulos: s.modulos, supabase: s.supabase };
  } catch (e) {
    const m = String(e && e.message || e);
    r = /^SESION:/.test(m) ? { ok: false, sesion: true, error: m.replace(/^SESION:\s*/, "") } : { ok: false, error: m };
  }
  return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
}

// La versión nueva arma el PDF en el navegador y Apps Script solo lo envía al grupo
// (el token del bot vive aquí). Solo validador o administrador; solo archivos PDF.
function sbPdfTelegram_(data, u) {
  if (!ROLES[u.rol] || ROLES[u.rol] < ROLES.validador) throw new Error("No tienes permiso para enviar al grupo.");
  if (!GRUPO_CALIDAD_ID) throw new Error("No está configurado el grupo de Telegram (GRUPO_CALIDAD_ID).");
  const b64 = String(data.b64 || "");
  if (!b64 || b64.length > 20 * 1024 * 1024) throw new Error("El PDF está vacío o es demasiado grande.");
  const bytes = Utilities.base64Decode(b64);
  if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== "%PDF") throw new Error("El archivo no es un PDF.");
  const nombre = String(data.nombre || "Frecs.pdf").replace(/[^\w.\-]+/g, "_").substring(0, 80);
  const blob = Utilities.newBlob(bytes, "application/pdf", /\.pdf$/i.test(nombre) ? nombre : nombre + ".pdf");
  const cap = String(data.caption || "📄 PDF").substring(0, 800) + `\n_Enviado desde el dashboard por ${escapeMd(u.nombre)}_`;
  if (!enviarDocumento(GRUPO_CALIDAD_ID, blob, cap)) throw new Error("Telegram no aceptó el archivo.");
  return { ok: true };
}

// ---------------------------------------------------------
// FASE 4d · CAMBIO DEFINITIVO (se activa a mano con sbCambioDefinitivo)
// Desde ese momento los turnos, la validación, la entrega y la conciliación se hacen
// en la versión nueva (Supabase). El dashboard actual los muestra pero no los cambia,
// y las hojas quedan como copia (la llena sbBajarTurnos_) para el bot y sus PDF.
// ---------------------------------------------------------
const WEB_NUEVA_URL = prop_("WEB_NUEVA_URL", "https://huberxp.github.io/frecs-app/");
function turnosEnSupabase_() { return PropertiesService.getScriptProperties().getProperty("TURNOS_EN_SUPABASE") === "si"; }
function bloqueoTurnos_() {
  if (turnosEnSupabase_()) throw new Error(`Los turnos, validaciones, entregas y conciliaciones ahora se hacen en la versión nueva: ${WEB_NUEVA_URL}`);
}

// Copia a las hojas las filas de esos turnos y conciliaciones (y completas la pre-conciliación y los destinos)
function sbBajarTurnos_(turnos, concs) {
  const d = sbRpc_("sb_turnos_hojas", { p_turnos: turnos || [], p_concs: concs || [] });
  return conLock_(() => {
    const idsT = new Set(d.turnos_pedidos || []), idsC = new Set(d.concs_pedidas || []);
    const reemplazar = (def, col, ids, filas) => {
      if (!ids.size && !(filas || []).length) return;
      tReescribir_(def, r => !ids.has(txt_(r[col])));
      tAgregar_(def, filas || []);
    };
    // Turnos y conciliaciones: se actualiza su fila (queda en el mismo lugar) o se agrega
    const ponerFilas = (def, filas) => {
      const act = tLeer_(def);
      (filas || []).forEach(f => {
        const k = act.findIndex(r => txt_(r[0]) === txt_(f[0]));
        if (k >= 0) { tEscribir_(def, k + 2, 1, f); act[k] = f; } else { tAgregar_(def, [f]); act.push(f); }
      });
    };
    ponerFilas(TURNOS_DEF, d.turnos);
    reemplazar(VAL_T.productos, 0, idsT, d.val_productos);
    reemplazar(VAL_T.registros, 1, idsT, d.val_registros);
    reemplazar(VAL_T.histProd, 0, idsT, d.val_hist_productos);
    reemplazar(VAL_T.histReg, 1, idsT, d.val_hist_registros);
    reemplazar(ENT_T.items, 0, idsT, d.ent_items);
    reemplazar(ENT_T.notas, 0, idsT, d.ent_notas);
    ponerFilas(CONC_T.conc, d.conciliaciones);
    reemplazar(CONC_T.items, 0, idsC, d.conc_items);
    tReescribir_(CONC_T.pre, () => false); tAgregar_(CONC_T.pre, d.preconciliacion || []);
    if ((d.destinos || []).length) { tReescribir_(VAL_T.destinos, () => false); tAgregar_(VAL_T.destinos, d.destinos); }
    turnosCambiaron_();
    return { turnos: idsT.size, conciliaciones: idsC.size };
  });
}

// Correr a mano desde el editor, cuando nadie esté en medio de un turno:
// 1) copia final de las hojas a Supabase (reemplaza lo que se hizo en modo prueba),
// 2) cierra la importación y activa los turnos en Supabase,
// 3) el dashboard actual deja de cambiar turnos (solo los muestra).
function sbCambioDefinitivo() {
  if (!sbActivo_()) throw new Error("Faltan las propiedades SUPABASE_URL y SUPABASE_SECRET.");
  if (turnosEnSupabase_()) { console.log("El cambio definitivo ya estaba hecho."); return; }
  const r = sbImportarTodo();
  sbRpc_("sb_cambio_definitivo", {});
  PropertiesService.getScriptProperties().setProperty("TURNOS_EN_SUPABASE", "si");
  const n = (r.conteosSupabase || {});
  console.log(`✅ Cambio definitivo hecho. Turnos: ${n.turnos}, conciliaciones: ${n.conciliaciones}.\nDesde ahora los turnos se hacen en ${WEB_NUEVA_URL}. Las hojas quedan como copia para el bot.`);
  return { turnos: n.turnos, conciliaciones: n.conciliaciones, importado: r.importado };
}

// ---------------------------------------------------------
// FASE 5 · EL BOT EN SUPABASE (función frecs-bot)
// Antes: en Supabase → Edge Functions → Secrets, guardar TELEGRAM_TOKEN (el mismo del bot).
// sbPasarBotASupabase(): le pasa a Supabase la configuración (grupo, chats, dashboard, esta
// dirección de Apps Script y dos secretos nuevos), cambia el webhook de Telegram a la función
// y pasa las alertas de las 6 a.m. y 2 p.m. a Supabase. Apps Script queda solo para el WMS
// (y para copiar a las hojas de respaldo).
// sbVolverBotAAppsScript(): deshace todo (el bot vuelve a responder desde aquí).
// ---------------------------------------------------------
function sbUrlFuncionBot_() { return sbCfg_().url + "/functions/v1/frecs-bot"; }
function sbUrlAppsScript_() { return prop_("APPS_SCRIPT_URL", "") || ScriptApp.getService().getUrl(); }

function sbPasarBotASupabase() {
  if (!sbActivo_()) throw new Error("Faltan las propiedades SUPABASE_URL y SUPABASE_SECRET.");
  if (!TELEGRAM_TOKEN) throw new Error("Falta la propiedad TELEGRAM_TOKEN.");
  const pr = PropertiesService.getScriptProperties();
  const secreto = pr.getProperty("BOT_SECRET") || (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
  const secretoWebhook = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
  pr.setProperty("BOT_SECRET", secreto);
  const urlAS = sbUrlAppsScript_();
  if (!/\/exec$/.test(urlAS)) throw new Error("La dirección de Apps Script debe terminar en /exec (publica la implementación o pon la propiedad APPS_SCRIPT_URL): " + urlAS);
  sbRpc_("sb_bot_config_guardar", { p_config: { bot_grupo: String(GRUPO_CALIDAD_ID || ""), bot_chats: prop_("CHATS_PERMITIDOS", ""), bot_dashboard: DASHBOARD_URL || "",
    bot_apps_script_url: urlAS, bot_funcion_url: sbUrlFuncionBot_(), bot_secreto: secreto, bot_webhook_secreto: secretoWebhook } });
  // La función debe estar publicada y con el token antes de cambiar el webhook
  const prueba = UrlFetchApp.fetch(sbUrlFuncionBot_(), { method: "get", muteHttpExceptions: true });
  if (prueba.getResponseCode() !== 200) throw new Error(`La función frecs-bot no responde (${prueba.getResponseCode()}). No se cambió nada en Telegram.`);
  const idBot = String(TELEGRAM_TOKEN).split(":")[0];
  if (prueba.getContentText().indexOf("bot " + idBot) < 0) throw new Error("La función frecs-bot no tiene el token de este bot. Guárdalo en Supabase → Edge Functions → Secrets con el nombre TELEGRAM_TOKEN y vuelve a correr esto. No se cambió nada en Telegram.");
  const r = UrlFetchApp.fetch(TELEGRAM_API + "/setWebhook", { method: "post", contentType: "application/json", muteHttpExceptions: true,
    payload: JSON.stringify({ url: sbUrlFuncionBot_(), secret_token: secretoWebhook, allowed_updates: ["message", "callback_query"] }) });
  if (r.getResponseCode() !== 200) throw new Error("Telegram no aceptó el cambio: " + r.getContentText());
  try { sbRpc_("sb_bot_alertas", { p_activar: true }); quitarTriggersAutomaticos(); } catch (e) { console.warn("Alertas: " + e.message); }
  console.log("✅ El bot ahora responde desde Supabase. Para volver: sbVolverBotAAppsScript().");
}

function sbVolverBotAAppsScript() {
  const sec = prop_("WEBHOOK_SECRET", "");
  const url = sbUrlAppsScript_() + (sec ? "?k=" + encodeURIComponent(sec) : "");
  const r = UrlFetchApp.fetch(TELEGRAM_API + "/setWebhook", { method: "post", contentType: "application/json", muteHttpExceptions: true, payload: JSON.stringify({ url: url }) });
  if (r.getResponseCode() !== 200) throw new Error("Telegram no aceptó el cambio: " + r.getContentText());
  try { sbRpc_("sb_bot_alertas", { p_activar: false }); } catch (e) { console.warn("Alertas: " + e.message); }
  console.log("✅ El bot volvió a Apps Script. Si quieres las alertas de las 6 a.m. y 2 p.m. desde aquí, corre crearTriggersAutomaticos().");
}

// Emergencia: las hojas vuelven a mandar (tienen la copia al día) y se reabre la importación
function sbVolverAHojas() {
  sbRpc_("sb_volver_a_hojas", {});
  PropertiesService.getScriptProperties().deleteProperty("TURNOS_EN_SUPABASE");
  console.log("Las hojas vuelven a mandar en los turnos. La versión nueva queda otra vez en modo prueba.");
}

// Prueba rápida de conexión (correr desde el editor)
function sbProbarConexion() {
  const r = sbRpc_("sb_conteos", {});
  console.log("Conexión con Supabase OK. Filas por tabla: " + JSON.stringify(r));
  return r;
}

;
// ===== 30_Web_Api.gs =====
// =========================================================
// 30 · DASHBOARD WEB: doGet y funciones que llama la página
// ---------------------------------------------------------
// Todas devuelven texto JSON { ok, data | error }. Cada función recibe primero
// el token de sesión (nombre + PIN) y el servidor revisa el rol:
//   lector → consultar · validador → escribir en turnos y operación · administrador → todo
// Las funciones internas terminan en "_" y la página no las puede llamar.
// =========================================================
function doGet(e) {
  return HtmlService.createTemplateFromFile("Dashboard")
    .evaluate()
    .setTitle("Frecs! · Dashboard")
    .addMetaTag("viewport", "width=device-width, initial-scale=1, viewport-fit=cover")
    // ALLOWALL permite abrir el dashboard dentro de la app instalable (carpeta pwa/)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Para unir Dashboard.html con Dashboard_css.html y Dashboard_js.html
function include(nombre) { return HtmlService.createHtmlOutputFromFile(nombre).getContent(); }

function webResp_(fn) {
  try {
    return JSON.stringify({ ok: true, data: fn() });
  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    if (msg.indexOf("SESION:") === 0) return JSON.stringify({ ok: false, sesion: true, error: msg.replace("SESION:", "").trim() });
    console.error(err);
    return JSON.stringify({ ok: false, error: msg });
  }
}
// Ejecuta fn(usuario) si la sesión es válida y tiene el rol mínimo
function webAuth_(tk, rol, fn) { return webResp_(() => fn(usrSesion_(tk, rol))); }
// Escrituras de turnos: después del cambio definitivo se hacen solo en la versión nueva
function webTurnoAuth_(tk, rol, fn) { return webResp_(() => { const u = usrSesion_(tk, rol); bloqueoTurnos_(); return fn(u); }); }
const L_ = "lector", V_ = "validador", A_ = "administrador";

function estadoSyncWeb_() {
  const pr = PropertiesService.getScriptProperties();
  const ts = pr.getProperty("wms_last_sync_ts");
  const tsWms = pr.getProperty("wms_last_movement_ts");
  let bot = "Sin sincronizar", botMin = null;
  if (ts) {
    botMin = Math.max(0, Math.floor((new Date().getTime() - parseInt(ts, 10)) / 60000));
    const h = Math.floor(botMin / 60), m = botMin % 60;
    bot = "hace " + (h > 0 ? `${h}h ${m}m` : `${m}m`);
  }
  return { bot: bot, botMin: botMin, ts: ts ? parseInt(ts, 10) : null, wms: tsWms ? formatoActualizacion(parseInt(tsWms, 10)) : "N/A" };
}

// ---------------------------------------------------------
// SESIÓN
// ---------------------------------------------------------
function webPublico() { return webResp_(() => usrPublico_()); }
function webSetup(nombre, pin) { return webResp_(() => usrSetupCore_(nombre, pin)); }
function webLogin(nombre, pin) { return webResp_(() => usrLoginCore_(nombre, pin)); }
function webLogout(tk) { return webResp_(() => usrLogout_(tk)); }
function webCambiarPin(tk, actual, nuevo) { return webAuth_(tk, L_, u => usrCambiarPinCore_(u.nombre, actual, nuevo)); }

// Todo lo que la página necesita al abrir, en un solo viaje
function webInit(tk) {
  return webAuth_(tk, L_, u => {
    let correo = "";
    try { correo = Session.getActiveUser().getEmail() || ""; } catch (e) {}
    return {
      usuario: { nombre: u.nombre, rol: u.rol, correo: correo },
      sync: estadoSyncWeb_(), grupoTelegram: !!GRUPO_CALIDAD_ID, instructivo: !!INSTRUCTIVO_DRIVE_ID, turnosNueva: turnosEnSupabase_() ? WEB_NUEVA_URL : "",
      turno: turnoEstadoCore_(), inv: inventarioPayload_(), cat: catalogoWeb_()
    };
  });
}

// ---------------------------------------------------------
// LECTURA
// ---------------------------------------------------------
// Inventario con canales, zonas, vida útil y ocupación ya calculados (caché 5 min)
function inventarioPayload_() {
  const c = cacheLeer_("inv");
  if (c) { try { const d = JSON.parse(c); d.sync = estadoSyncWeb_(); return d; } catch (e) {} }
  const inv = obtenerInventarioLocal();
  const filas = inv.map(i => {
    const c2 = evaluarCanales(i.d, i.fam, i.s, i.p);
    const z = zonaModulo_(i.m);
    return {
      s: i.s, p: i.p, m: i.m, z: z, e: i.e, c: i.c, u: i.u,
      v: i.v, vf: i.v ? formatearFecha(i.v) : "Sin fecha", d: i.d,
      est: i.est, disp: i.est === "DISPONIBLE", cand: i.cand, fam: i.fam, cpe: i.cpe, obs: i.obs,
      pick: i.pick, act: i.act, actTxt: formatoActualizacion(i.act),
      prio: i.prio, tpc: i.tpc, reemp: i.reempaque, fis: i.tieneFisico,
      T1: c2.T1, T2: c2.T2, KA: c2.KA, min: c2.min,
      esKA: z === "KA", esPK: z === "PREV" || i.pick, esOp: esZonaOperativa(i), carpa: z === "CARPA",
      ret: esProductoRetornable(i.fam, i.p), vida: vidaUtilInfo(i.d).clave, emp: obtenerTipoEmpaque(i.p)
    };
  });
  const d = { filas: filas, ocupacion: tablaOcupacion_(inv), generado: ahora_() };
  cacheGuardar_("inv", JSON.stringify(d), 300);
  d.sync = estadoSyncWeb_();
  return d;
}
function webInventario(tk) { return webAuth_(tk, L_, () => inventarioPayload_()); }

function catalogoWeb_() {
  return catalogoSku_().map(c => ({ sku: c.sku, prod: c.prod, cub: c.cub, piso: c.piso, plancha: c.plancha, cantEst: c.cantEst, pres: c.pres, ctx: c.ctx, usuario: c.usuario, minimo: c.minimo, t1: c.t1, t2: c.t2, ka: c.ka, estCara: c.estCara }));
}
function webCatalogo(tk) { return webAuth_(tk, L_, () => catalogoWeb_()); }
function webCanales(tk) { return webAuth_(tk, L_, () => ({ reglas: canalesListar_(), defecto: POCOS_DEFECTO })); }

function webResumen(tk) {
  return webAuth_(tk, L_, () => { const r = calcularResumen(); if (!r) throw new Error("Falta la pestaña 'Sku'."); delete r.listBloq; return r; });
}

function webPocos(tk) {
  return webAuth_(tk, L_, () => {
    const lis = calcularPocos();
    if (lis === null) throw new Error("Falta la pestaña 'Sku'.");
    return lis.map(it => ({ s: it.s, p: it.p, minimo: it.minimo, eq: Math.round(it.eq * 10) / 10, totE: it.totE, totC: it.totC, totU: it.totU, prio: it.prio, zonas: it.zonas, locs: it.locs.map(l => ({ m: l.m, e: l.e, c: l.c, u: l.u, v: l.v, vf: formatearFecha(l.v), d: l.d, actTxt: formatoActualizacion(l.act), vida: vidaUtilInfo(l.d).clave })) }));
  });
}

function webHuecos(tk) { return webAuth_(tk, L_, () => { const h = calcularHuecos(); if (h === null) throw new Error("La pestaña 'Capacidad_Bodega' está vacía."); return h; }); }
function webVacios(tk) { return webAuth_(tk, L_, () => { const v = calcularVacios(); if (v === null) throw new Error("Sin mapa de módulos: sincroniza primero."); return v; }); }
function webOrganizar(tk) { return webAuth_(tk, L_, () => (calcularOrganizar() || []).map(s => Object.assign({}, s, { vf: formatearFecha(s.v), actTxt: formatoActualizacion(s.act), vida: vidaUtilInfo(s.d).clave }))); }
function webConsolidar(tk) { return webAuth_(tk, L_, () => calcularConsolidar().map(g => ({ s: g.s, p: g.p, locs: g.locs.map(l => ({ m: l.m, e: l.e, c: l.c, u: l.u, vf: formatearFecha(l.v), d: l.d, actTxt: formatoActualizacion(l.act), vida: vidaUtilInfo(l.d).clave })) }))); }
function webInfiltrados(tk) {
  return webAuth_(tk, L_, () => {
    const r = calcularInfiltrados();
    if (!r) throw new Error("Falta la pestaña 'Sku'.");
    return { infWMS: r.infWMS.map(i => ({ s: i.s, p: i.p, m: i.m, e: i.e, c: i.c, u: i.u, est: i.est, disp: i.est === "DISPONIBLE", vf: formatearFecha(i.v), v: i.v, d: i.d, carpa: esModuloCarpa(i.m), vida: vidaUtilInfo(i.d).clave, obs: i.obs, cand: i.cand })), fantasmas: r.fantasmas };
  });
}
function webAvanzados(tk, tipo) { return webAuth_(tk, L_, () => calcularAvanzados(tipo === "MERMA" ? "MERMA" : "MALUBICADOS").map(i => ({ s: i.s, p: i.p, m: i.m, e: i.e, c: i.c, u: i.u, est: i.est, disp: i.est === "DISPONIBLE", v: i.v, vf: formatearFecha(i.v), d: i.d, sT: i.sT, sug: i.sug || "", actTxt: formatoActualizacion(i.act), vida: vidaUtilInfo(i.d).clave, obs: i.obs, cand: i.cand, fis: true }))); }
function webMezclados(tk) { return webAuth_(tk, L_, () => calcularMezclados().map(g => ({ m: g.m, skus: g.skus.map(x => ({ s: x.s, p: x.p, e: x.e, c: x.c, u: x.u, vf: x.v ? formatearFecha(x.v) : "Sin fecha", d: x.d, est: x.est, disp: x.est === "DISPONIBLE", vida: vidaUtilInfo(x.d).clave })) }))); }
function webAcomodar(tk, sku, fecha) {
  return webAuth_(tk, L_, () => {
    const r = calcularAcomodar(`${sku} ${fecha}`);
    if (r.error) throw new Error(r.error.replace(/[`*⚠️]/g, "").trim());
    r.fIngTxt = formatearFecha(r.fIng);
    r.opciones = r.opciones.map(o => Object.assign({}, o, { vf: formatearFecha(o.vence), actTxt: formatoActualizacion(o.act) }));
    return r;
  });
}
function webEnvasado(tk, fecha, meses) { return webAuth_(tk, L_, () => { const r = calcularFechaEnvasado(fecha, parseInt(meses, 10) || 0); if (!r.ok) throw new Error(r.error.replace(/⚠️\s*/, "")); return r.fecha; }); }

function miniLote_(l) { return { m: l.m, z: zonaModulo_(l.m), s: l.s, p: l.p, e: l.e, c: l.c, u: l.u, est: l.est, disp: l.est === "DISPONIBLE", v: l.v, vf: l.v ? formatearFecha(l.v) : "Sin fecha", d: l.d, prio: l.prio, tpc: l.tpc, obs: l.obs, cand: l.cand, actTxt: formatoActualizacion(l.act), vida: vidaUtilInfo(l.d).clave }; }

function webConsumo(tk) {
  return webAuth_(tk, L_, () => {
    const datos = calcularConsumo();
    if (datos === null) throw new Error("Crea la pestaña 'Consumo' en el Excel.");
    return datos.map(x => ({ sku: x.sku, nom: x.nom, elegido: x.elegido, auto: x.auto, modo: x.modo, elegidoPor: x.elegidoPor, elegidoEn: x.elegidoEn, manualVencido: x.manualVencido, estado: x.estado,
      locs: x.locs.map(l => Object.assign(miniLote_(l), { esOp: l.esOp, sel: l.sel, pct: l.pct, lleno: l.lleno, capTot: l.capTot, usadas: l.usadas })) }));
  });
}

function webCarpa(tk) {
  return webAuth_(tk, L_, () => calcularCarpa().map(x => ({ m: x.m, vacio: x.vacio, bloq: x.bloq, dMin: x.dMin, vida: vidaUtilInfo(x.dMin).clave, ocup: x.ocup, items: x.items.map(miniLote_) })));
}
function webBarriles(tk) {
  return webAuth_(tk, L_, () => { const b = calcularBarriles(); return { lotes: b.lotes.map(miniLote_), resumen: b.resumen.map(r => Object.assign({}, r, { vf: formatearFecha(r.vMin) })) }; });
}
function webLimbo(tk) { return webAuth_(tk, L_, () => listarLimbo_().map(x => ({ id: x.id, p: x.p, v: x.v, dias: x.dias, pres: x.pres, cub: x.cub, fecha: x.fecha, vida: vidaUtilInfo(x.dias).clave }))); }
function webHistorial(tk, filtros) { return webAuth_(tk, L_, u => histListar_(filtros, u)); }
function webMantPrevia(tk, dias) { return webAuth_(tk, A_, () => mantPreviaCore_(dias)); }
function webMantArchivar(tk, dias) { return webTurnoAuth_(tk, A_, u => mantArchivarCore_(dias, u.nombre)); }
function webTurnoEliminar(tk, id) { return webTurnoAuth_(tk, V_, u => turnoEliminarCore_(id, u)); }
function webTurnoRestaurar(tk, id) { return webTurnoAuth_(tk, A_, u => turnoRestaurarCore_(id, u)); }
function webTurnoNota(tk, id, nota) { return webTurnoAuth_(tk, V_, u => turnoNotaCore_(id, nota, u.nombre)); }
function webConcEliminar(tk, id) { return webTurnoAuth_(tk, V_, u => concEliminarCore_(id, u)); }
function webConcRestaurar(tk, id) { return webTurnoAuth_(tk, A_, u => concRestaurarCore_(id, u)); }
function webConcNota(tk, id, nota) { return webTurnoAuth_(tk, V_, u => { concNotaCore_(id, nota, u.nombre); return { estado: concEstadoCore_(id) }; }); }

// ---------------------------------------------------------
// ESCRITURA: operación
// ---------------------------------------------------------
function webSincronizar(tk, forzar) {
  return webAuth_(tk, L_, u => {
    const r = sincronizarWMSCore(forzar === true);
    if (!r.ok) throw new Error(r.error);
    console.log(`Sincronización desde el dashboard por ${u.nombre}: ${r.fisicas} ubicaciones`);
    return { filas: r.fisicas, modulos: r.modulos, inv: inventarioPayload_() };
  });
}
function webConsumoAgregar(tk, sku) { return webAuth_(tk, V_, () => { const r = agregarConsumoCore_(sku); if (!r.ok) throw new Error(r.error); return r.nombre; }); }
function webConsumoEliminar(tk, sku) { return webAuth_(tk, V_, () => { if (!eliminarConsumoCore_(sku)) throw new Error(`El SKU ${sku} no estaba en la lista.`); return true; }); }
function webConsumoElegir(tk, sku, modulo) { return webAuth_(tk, V_, u => elegirModuloConsumoCore_(sku, modulo, u.nombre)); }
function webLimboAgregar(tk, obj) {
  return webAuth_(tk, V_, () => {
    obj = obj || {};
    const f = normalizarFechaWMS(obj.fecha || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) throw new Error("Fecha de vencimiento inválida.");
    const r = agregarLimboCore_(obj.nombre, f, obj.pres, obj.cub);
    if (!r.ok) throw new Error(r.error);
    return r.id;
  });
}
function webLimboEliminar(tk, id) { return webAuth_(tk, V_, () => { if (!eliminarLimboCore_(id)) throw new Error(`ID ${id} no encontrado.`); return true; }); }

// ---------------------------------------------------------
// PDFs: descargar o enviar al grupo de Telegram
// ---------------------------------------------------------
function webPDF(tk, tipo, id) {
  return webAuth_(tk, L_, () => { const r = construirPDFPorTipo_(tipo, id); return { nombre: r.blob.getName() || (tipo + ".pdf"), b64: Utilities.base64Encode(r.blob.getBytes()) }; });
}
function webPDFTelegram(tk, tipo, id) {
  return webAuth_(tk, V_, u => {
    if (!GRUPO_CALIDAD_ID) throw new Error("No está configurado GRUPO_CALIDAD_ID.");
    const r = construirPDFPorTipo_(tipo, id);
    if (!enviarDocumento(GRUPO_CALIDAD_ID, r.blob, `${r.caption}\n_Enviado desde el dashboard por ${escapeMd(u.nombre)}_`)) throw new Error("Telegram no aceptó el archivo.");
    return true;
  });
}
function pdfB64_(r) { return { nombre: r.blob.getName(), b64: Utilities.base64Encode(r.blob.getBytes()) }; }

// ---------------------------------------------------------
// TURNO (compartido por validación y entrega)
// ---------------------------------------------------------
function webTurno(tk) { return webAuth_(tk, L_, () => turnoEstadoCore_()); }
function webTurnoAbrir(tk, numero, heredar) { return webTurnoAuth_(tk, V_, u => ({ resultado: abrirTurnoCore_(numero, heredar, u.nombre), turno: turnoEstadoCore_() })); }
function webTurnoCerrar(tk, opts) {
  return webTurnoAuth_(tk, V_, u => {
    opts = opts || {};
    const r = cerrarTurnoCore_(opts.nota, u.nombre);
    let pdfs = [], telegram = null;
    [["VALIDACION", construirPDFValidacion], ["ENTREGA", construirPDFEntrega]].forEach(([tipo, fn]) => {
      try {
        const p = fn(r.id);
        pdfs.push(pdfB64_(p));
        if (opts.telegram && GRUPO_CALIDAD_ID) telegram = enviarDocumento(GRUPO_CALIDAD_ID, p.blob, `${p.caption}\n_Turno cerrado por ${escapeMd(u.nombre)}_`) && telegram !== false;
      } catch (err) { console.error(tipo + ": " + err); }
    });
    return { resultado: r, pdfs: pdfs, telegram: telegram, turno: turnoEstadoCore_() };
  });
}

// ---------------------------------------------------------
// VALIDACIÓN (cada escritura devuelve el estado completo)
// ---------------------------------------------------------
// turnoId vacío = turno abierto; con id = turno del historial (se edita y queda "Editado por")
function webVal(tk, turnoId) { return webAuth_(tk, L_, () => valEstadoCore_(turnoId || "")); }
function webValSugerencias(tk, turnoId) { return webAuth_(tk, L_, () => valSugerenciasCore_(turnoId || "")); }
function webValAgregar(tk, items, turnoId) { return webTurnoAuth_(tk, V_, u => ({ resultado: valAgregarProductosCore_(items, u.nombre, turnoId || ""), estado: valEstadoCore_(turnoId || "") })); }
function webValInicial(tk, sku, inicial, contadoEn, turnoId) { return webTurnoAuth_(tk, V_, u => { valActualizarInicialCore_(sku, inicial, contadoEn, u.nombre, turnoId || ""); return { estado: valEstadoCore_(turnoId || "") }; }); }
function webValQuitar(tk, sku, turnoId) { return webTurnoAuth_(tk, V_, u => { valQuitarProductoCore_(sku, turnoId || "", u.nombre); return { estado: valEstadoCore_(turnoId || "") }; }); }
function webValRegistrar(tk, obj, turnoId) { return webTurnoAuth_(tk, V_, u => ({ resultado: valRegistrarCore_(obj, u.nombre, turnoId || ""), estado: valEstadoCore_(turnoId || "") })); }
function webValEditar(tk, id, obj, turnoId) { return webTurnoAuth_(tk, V_, u => { valEditarRegistroCore_(id, obj, u.nombre, turnoId || ""); return { estado: valEstadoCore_(turnoId || "") }; }); }
function webValAnular(tk, id, turnoId) { return webTurnoAuth_(tk, V_, u => { valAnularCore_(id, u.nombre, turnoId || ""); return { estado: valEstadoCore_(turnoId || "") }; }); }
function webValDestino(tk, accion, destino, turnoId) { return webTurnoAuth_(tk, V_, () => { valDestinoCore_(accion, destino); return { estado: valEstadoCore_(turnoId || "") }; }); }

// ---------------------------------------------------------
// ENTREGA DE TURNO
// ---------------------------------------------------------
function webEnt(tk, turnoId) { return webAuth_(tk, L_, () => entEstadoCore_(turnoId || "")); }
function webEntPrecargar(tk, secciones) { return webTurnoAuth_(tk, V_, u => ({ resultado: entPrecargarCore_(secciones, u.nombre), estado: entEstadoCore_() })); }
function webEntGuardar(tk, seccion, sku, producto, cantidades, turnoId) { return webTurnoAuth_(tk, V_, u => { entGuardarItemCore_(seccion, sku, producto, cantidades, u.nombre, turnoId || ""); return { estado: entEstadoCore_(turnoId || "") }; }); }
function webEntQuitar(tk, seccion, sku, turnoId) { return webTurnoAuth_(tk, V_, u => { entQuitarItemCore_(seccion, sku, turnoId || "", u.nombre); return { estado: entEstadoCore_(turnoId || "") }; }); }
function webEntQuitarSeccion(tk, seccion, turnoId) { return webTurnoAuth_(tk, V_, u => ({ quitados: entQuitarSeccionCore_(seccion, turnoId || "", u.nombre), estado: entEstadoCore_(turnoId || "") })); }
function webEntNota(tk, texto, turnoId) { return webTurnoAuth_(tk, V_, u => { entNotaAgregarCore_(texto, u.nombre, turnoId || ""); return { estado: entEstadoCore_(turnoId || "") }; }); }
function webEntNotaEditar(tk, id, texto, turnoId) { return webTurnoAuth_(tk, V_, u => { entNotaEditarCore_(id, texto, u.nombre, turnoId || ""); return { estado: entEstadoCore_(turnoId || "") }; }); }
function webEntNotaQuitar(tk, id, turnoId) { return webTurnoAuth_(tk, V_, u => { entNotaQuitarCore_(id, turnoId || "", u.nombre); return { estado: entEstadoCore_(turnoId || "") }; }); }

// ---------------------------------------------------------
// CONCILIACIÓN Y PRE-CONCILIACIÓN
// ---------------------------------------------------------
function webConc(tk, concId) { return webAuth_(tk, L_, () => concEstadoCore_(concId || "")); }
function webConcAbrir(tk, opts) { return webTurnoAuth_(tk, V_, u => ({ resultado: concAbrirCore_(opts, u.nombre), estado: concEstadoCore_() })); }
function webConcAgregar(tk, items, concId) { return webTurnoAuth_(tk, V_, u => ({ resultado: concAgregarProductosCore_(items, u.nombre, concId || ""), estado: concEstadoCore_(concId || "") })); }
function webConcGuardar(tk, sku, campos, concId) { return webTurnoAuth_(tk, V_, u => { concGuardarItemCore_(sku, campos, u.nombre, concId || ""); return { estado: concEstadoCore_(concId || "") }; }); }
function webConcQuitar(tk, sku, concId) { return webTurnoAuth_(tk, V_, u => { concQuitarItemCore_(sku, concId || "", u.nombre); return { estado: concEstadoCore_(concId || "") }; }); }
function webConcCerrar(tk, opts) {
  return webTurnoAuth_(tk, V_, u => {
    opts = opts || {};
    const id = concCerrarCore_(opts.nota, u.nombre);
    let pdf = null, telegram = null;
    try {
      const p = construirPDFConciliacion(id);
      pdf = pdfB64_(p);
      if (opts.telegram && GRUPO_CALIDAD_ID) telegram = enviarDocumento(GRUPO_CALIDAD_ID, p.blob, `${p.caption}\n_Cerrada por ${escapeMd(u.nombre)}_`);
    } catch (err) { console.error(err); }
    return { id: id, pdf: pdf, telegram: telegram, estado: concEstadoCore_() };
  });
}
function webPreAgregar(tk, sku, producto, motivo) { return webTurnoAuth_(tk, V_, u => { preAgregarCore_(sku, producto, motivo, u.nombre); return { estado: concEstadoCore_() }; }); }
function webPreQuitar(tk, id) { return webTurnoAuth_(tk, V_, () => { preQuitarCore_(id); return { estado: concEstadoCore_() }; }); }
function webPreLimpiar(tk) { return webTurnoAuth_(tk, V_, () => { preLimpiarCore_(); return { estado: concEstadoCore_() }; }); }

// ---------------------------------------------------------
// ADMINISTRADOR: usuarios, hoja Sku y canales
// ---------------------------------------------------------
function webUsuarios(tk) { return webAuth_(tk, A_, () => usrListarAdmin_()); }
function webUsuarioGuardar(tk, obj) { return webAuth_(tk, A_, u => { usrGuardarCore_(obj, u.nombre); return usrListarAdmin_(); }); }
function webUsuarioEliminar(tk, nombre) { return webAuth_(tk, A_, u => { usrEliminarCore_(nombre, u.nombre); return usrListarAdmin_(); }); }
function webSkuGuardar(tk, skuOriginal, obj) { return webAuth_(tk, A_, u => { skuGuardarCore_(skuOriginal, obj, u.nombre); return catalogoWeb_(); }); }
function webSkuEliminar(tk, sku) { return webAuth_(tk, A_, () => { skuEliminarCore_(sku); return catalogoWeb_(); }); }
function webCanalesGuardar(tk, filas) { return webAuth_(tk, A_, () => { canalesGuardarCore_(filas); return { reglas: canalesListar_(), defecto: POCOS_DEFECTO }; }); }

;
// ===== 31_Usuarios_Permisos.gs =====
// =========================================================
// 31 · USUARIOS Y PERMISOS (nombre + PIN)
// ---------------------------------------------------------
// Roles: lector (solo consulta) · validador (turnos, validación, entrega,
// conciliación, consumo, limbo) · administrador (todo + usuarios, hoja Sku y canales).
// - El PIN se guarda cifrado (SHA-256 con sal), nunca en claro.
// - El servidor revisa el rol en CADA función que escribe; ocultar botones no basta.
// - Si no hay usuarios, el primero que entra crea la cuenta de administrador.
// - 5 PIN errados seguidos bloquean ese nombre 10 minutos.
// Pestaña Usuarios en el archivo principal.
// =========================================================
const USR_DEF = { libro: "MAIN", nombre: "Usuarios", cab: ["Nombre", "PIN_hash", "Rol", "Activo", "Creado", "Creado_por", "Ultimo_acceso"], texto: [1, 2, 3, 5, 6, 7] };
const ROLES = { lector: 1, validador: 2, administrador: 3 };
const SESION_SEG = 21600; // 6 h (máximo de CacheService); se renueva con el uso

function salPin_() {
  const pr = PropertiesService.getScriptProperties();
  let s = pr.getProperty("PIN_SALT");
  if (!s) { s = Utilities.getUuid(); pr.setProperty("PIN_SALT", s); }
  return s;
}

function hashPin_(nombre, pin) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salPin_() + "|" + String(nombre).trim().toLowerCase() + "|" + String(pin), Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

function validarPin_(pin) {
  if (!/^\d{4,8}$/.test(String(pin || ""))) throw new Error("El PIN debe tener de 4 a 8 números.");
}

function usrListarTodos_() {
  const c = CacheService.getScriptCache().get("usuarios_v1");
  if (c) { try { return JSON.parse(c); } catch (e) {} }
  const lis = tLeer_(USR_DEF).map((r, k) => ({ fila: k + 2, nombre: txt_(r[0]), hash: txt_(r[1]), rol: txt_(r[2]).toLowerCase() || "lector", activo: !(r[3] === false || String(r[3]).toUpperCase() === "FALSE" || String(r[3]).toUpperCase() === "NO"), creado: txt_(r[4]), creadoPor: txt_(r[5]), ultimo: txt_(r[6]) })).filter(u => u.nombre);
  CacheService.getScriptCache().put("usuarios_v1", JSON.stringify(lis), 60);
  return lis;
}
function usrInvalidar_() { CacheService.getScriptCache().remove("usuarios_v1"); }
function usrBuscar_(nombre) {
  const n = String(nombre || "").trim().toLowerCase();
  return usrListarTodos_().find(u => u.nombre.toLowerCase() === n) || null;
}

// Datos públicos para la pantalla de ingreso
function usrPublico_() {
  const lis = usrListarTodos_();
  return { setup: lis.length === 0, nombres: lis.filter(u => u.activo).map(u => u.nombre).sort((a, b) => a.localeCompare(b)) };
}

function crearSesion_(u) {
  const token = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "").substring(0, 8);
  CacheService.getScriptCache().put("ses_" + token, JSON.stringify({ n: u.nombre, t: new Date().getTime() }), SESION_SEG);
  return token;
}

// Primer ingreso: crea el administrador (solo si no hay ningún usuario)
function usrSetupCore_(nombre, pin) {
  nombre = String(nombre || "").trim().substring(0, 40);
  if (!nombre) throw new Error("Escribe tu nombre.");
  validarPin_(pin);
  return conLock_(() => {
    usrInvalidar_();
    if (usrListarTodos_().length) throw new Error("Ya existen usuarios. Ingresa con tu nombre y PIN.");
    tAgregar_(USR_DEF, [[nombre, hashPin_(nombre, pin), "administrador", true, ahora_(), "Configuración inicial", ahora_()]]);
    usrInvalidar_();
    const u = usrBuscar_(nombre);
    return { token: crearSesion_(u), usuario: { nombre: u.nombre, rol: u.rol } };
  });
}

function usrLoginCore_(nombre, pin) {
  const cache = CacheService.getScriptCache();
  const kIntentos = "pinerr_" + String(nombre || "").trim().toLowerCase();
  const intentos = parseInt(cache.get(kIntentos) || "0", 10);
  if (intentos >= 5) throw new Error("Demasiados intentos. Espera 10 minutos o pide al administrador que revise tu PIN.");
  const u = usrBuscar_(nombre);
  if (!u || !u.activo || u.hash !== hashPin_(u.nombre, pin)) {
    cache.put(kIntentos, String(intentos + 1), 600);
    throw new Error("Nombre o PIN incorrecto.");
  }
  cache.remove(kIntentos);
  try { tEscribir_(USR_DEF, u.fila, 7, [ahora_()]); } catch (e) {}
  return { token: crearSesion_(u), usuario: { nombre: u.nombre, rol: u.rol } };
}

function usrLogout_(token) { if (token) CacheService.getScriptCache().remove("ses_" + token); return true; }

// Valida la sesión y el rol. Devuelve { nombre, rol }
function usrSesion_(token, rolMinimo) {
  if (!token) throw new Error("SESION: Ingresa con tu nombre y PIN.");
  const cache = CacheService.getScriptCache();
  const raw = cache.get("ses_" + token);
  if (!raw) throw new Error("SESION: Tu sesión venció. Ingresa de nuevo.");
  let s;
  try { s = JSON.parse(raw); } catch (e) { throw new Error("SESION: Sesión inválida."); }
  const u = usrBuscar_(s.n);
  if (!u || !u.activo) { cache.remove("ses_" + token); throw new Error("SESION: Tu usuario fue desactivado."); }
  if ((ROLES[u.rol] || 0) < (ROLES[rolMinimo] || 1)) throw new Error(`No tienes permiso para esto (se necesita rol ${rolMinimo}).`);
  if (new Date().getTime() - (s.t || 0) > 15 * 60000) cache.put("ses_" + token, JSON.stringify({ n: u.nombre, t: new Date().getTime() }), SESION_SEG);
  return { nombre: u.nombre, rol: u.rol };
}

// ---------------------------------------------------------
// ADMINISTRACIÓN (solo administrador)
// ---------------------------------------------------------
function usrListarAdmin_() {
  usrInvalidar_();
  return usrListarTodos_().map(u => ({ nombre: u.nombre, rol: u.rol, activo: u.activo, creado: u.creado, creadoPor: u.creadoPor, ultimo: u.ultimo }));
}

// obj = { nombreOriginal, nombre, rol, activo, pin (opcional al editar) }
function usrGuardarCore_(obj, admin) {
  const nombre = String(obj.nombre || "").trim().substring(0, 40);
  const rol = String(obj.rol || "lector").toLowerCase();
  if (!nombre) throw new Error("Escribe el nombre.");
  if (!ROLES[rol]) throw new Error("Rol no válido.");
  const activo = obj.activo !== false;
  return conLock_(() => {
    usrInvalidar_();
    const lis = usrListarTodos_();
    const orig = String(obj.nombreOriginal || "").trim().toLowerCase();
    const existente = orig ? lis.find(u => u.nombre.toLowerCase() === orig) : null;
    const choque = lis.find(u => u.nombre.toLowerCase() === nombre.toLowerCase() && u !== existente);
    if (choque) throw new Error(`Ya existe un usuario llamado ${choque.nombre}.`);
    if (existente) {
      const admins = lis.filter(u => u.rol === "administrador" && u.activo);
      if (existente.rol === "administrador" && (rol !== "administrador" || !activo) && admins.length <= 1) throw new Error("Debe quedar al menos un administrador activo.");
      let hash = existente.hash;
      if (obj.pin) { validarPin_(obj.pin); hash = hashPin_(nombre, obj.pin); }
      else if (nombre.toLowerCase() !== existente.nombre.toLowerCase()) throw new Error("Si cambias el nombre, escribe también un PIN nuevo.");
      tEscribir_(USR_DEF, existente.fila, 1, [nombre, hash, rol, activo]);
    } else {
      validarPin_(obj.pin);
      tAgregar_(USR_DEF, [[nombre, hashPin_(nombre, obj.pin), rol, activo, ahora_(), admin, ""]]);
    }
    usrInvalidar_();
    return true;
  });
}

function usrEliminarCore_(nombre, admin) {
  return conLock_(() => {
    usrInvalidar_();
    const lis = usrListarTodos_();
    const u = lis.find(x => x.nombre.toLowerCase() === String(nombre).trim().toLowerCase());
    if (!u) throw new Error("Usuario no encontrado.");
    if (u.nombre.toLowerCase() === String(admin).toLowerCase()) throw new Error("No puedes borrar tu propio usuario.");
    if (u.rol === "administrador" && lis.filter(x => x.rol === "administrador" && x.activo).length <= 1) throw new Error("Debe quedar al menos un administrador activo.");
    tReescribir_(USR_DEF, r => txt_(r[0]).toLowerCase() !== u.nombre.toLowerCase());
    usrInvalidar_();
    return true;
  });
}

// El propio usuario cambia su PIN
function usrCambiarPinCore_(nombre, pinActual, pinNuevo) {
  validarPin_(pinNuevo);
  return conLock_(() => {
    usrInvalidar_();
    const u = usrBuscar_(nombre);
    if (!u || u.hash !== hashPin_(u.nombre, pinActual)) throw new Error("El PIN actual no es correcto.");
    tEscribir_(USR_DEF, u.fila, 2, [hashPin_(u.nombre, pinNuevo)]);
    usrInvalidar_();
    return true;
  });
}

;
// ===== 40_PDF_Comun.gs =====
// =========================================================
// 40 · PIEZAS COMUNES DE LOS PDF (fondo claro para imprimir)
// =========================================================
function fechaCorte_() { return Utilities.formatDate(new Date(), TZ, "dd/MM/yyyy HH:mm"); }

// Cabecera en tabla (el conversor HTML→PDF de Google no respeta bien display:flex)
function cabeceraPDF_(titulo, fecha, colorTitulo) {
  return `<table class="hdr"><tr>
    <td class="hdr-brand">𝐹𝓇𝑒𝒸𝓈! ツ</td>
    <td class="hdr-title" style="color:${colorTitulo || "#003399"}">${titulo}</td>
    <td class="hdr-date">${fecha}</td>
  </tr></table>`;
}

const CSS_CABECERA_PDF = `.hdr{width:100%;border-collapse:collapse;border:none;border-bottom:2px solid #222;margin-bottom:10px}
  .hdr td{border:none !important;padding:4px 0;background:#fff !important}
  .hdr-brand{font-size:16px;font-weight:bold;color:#111;text-align:left;width:25%}
  .hdr-title{font-size:12.5px;font-weight:bold;text-align:center}
  .hdr-date{font-size:9px;color:#666;text-align:right;width:25%}`;

const CSS_PDF_BASE = `@page { size: letter; margin: 12mm; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #111; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  ${CSS_CABECERA_PDF}
  h3 { font-size: 11.5px; color: #003399; margin: 12px 0 5px; }
  table.t { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  table.t th, table.t td { border: 1px solid #777; padding: 4px 5px; text-align: center; font-size: 9.5px; }
  table.t th { background: #f2f2f2; color: #003399; font-weight: bold; }
  .izq { text-align: left !important; }
  .sm { font-size: 8.5px; color: #555; }
  .rojo { color: #b00020; }
  .vacio { font-style: italic; color: #777; }
  .tot td { font-weight: bold; background: #f7f7f7; }
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  table.info td { border: 1px solid #999; padding: 4px 6px; font-size: 10px; }
  table.info .k { background: #f2f2f2; font-weight: bold; width: 15%; }
  table.leyenda { width: 100%; border-collapse: collapse; margin: 0 0 8px 0; }
  table.leyenda td { border: 1px solid #999; padding: 3px 4px; font-size: 8.5px; font-weight: bold; text-align: center; }
  table.firmas { width: 100%; margin-top: 30px; border-collapse: collapse; }
  table.firmas td { width: 50%; padding: 0 16px; text-align: center; font-size: 10px; border: none; }
  .linea { border-top: 1px solid #000; padding-top: 4px; }
  tr { page-break-inside: avoid; }`;

function escHtml_(t) { return String(t === null || t === undefined ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// Fila coloreada según vida útil
function trVida_(dias, extraClase) {
  const vu = vidaUtilInfo(dias);
  return `<tr class="${extraClase || ""}" style="background-color:${vu.color} !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`;
}

function leyendaVidaPDF_() {
  const items = [["#d9d9d9", "Vencido (&lt;0)"], ["#ffcccc", "Rojo 0–29 días"], ["#fff2cc", "Amarillo 30–45 días"], ["#e2efda", "Verde claro 46–90 días"], ["#a9d08e", "Verde oscuro &gt;90 días"]];
  return `<table class="leyenda"><tr>${items.map(x => `<td style="background-color:${x[0]} !important;">${x[1]}</td>`).join("")}</tr></table>`;
}

// "Estibas: 3 | Cajas: 120 | Unidades: 0"
function cantHtml_(i) { return escHtml_(cantLinea_(i.e, i.c, i.u, i.p)); }

// Documento completo: cabecera + cuerpo. opts = { leyenda, css, horizontal }
function pdfDoc_(titulo, cuerpo, opts) {
  opts = opts || {};
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS_PDF_BASE}${opts.horizontal ? "@page{size:letter landscape;}" : ""}${opts.css || ""}</style></head><body>
    ${cabeceraPDF_(titulo, fechaCorte_())}${opts.leyenda ? leyendaVidaPDF_() : ""}${cuerpo}</body></html>`;
}

function htmlAPdf_(html, nombre) {
  return HtmlService.createHtmlOutput(html).getAs("application/pdf").setName(nombre);
}

// Todos los PDF del sistema por tipo (lo usan el bot y el dashboard)
function construirPDFPorTipo_(tipo, id) {
  let r;
  switch (tipo) {
    case "INFORME": r = construirInformePrioridades(); break;
    case "RESUMEN": r = construirPDFResumen(); break;
    case "POCOS": r = construirPDFPocos(); break;
    case "CONSUMO": r = construirPDFConsumo(); break;
    case "CONSUMO_SOLO": r = construirPDFConsumoSolo(); break;
    case "RETORNABLE": r = construirPDFRetornable(); break;
    case "CARPA": r = construirPDFCarpa(); break;
    case "BARRILES": r = construirPDFBarriles(); break;
    case "TPC": r = construirPDFTpc(); break;
    case "VALIDACION": r = construirPDFValidacion(id || ""); break;
    case "ENTREGA": r = construirPDFEntrega(id || ""); break;
    case "CONCILIACION": r = construirPDFConciliacion(id || ""); break;
    case "INSTRUCTIVO":
      if (!INSTRUCTIVO_DRIVE_ID) throw new Error("No está configurado el ID del instructivo.");
      r = { blob: DriveApp.getFileById(INSTRUCTIVO_DRIVE_ID).getBlob(), caption: "📘 *Instructivo WMS oficial*" };
      break;
    default: throw new Error("Tipo de PDF desconocido.");
  }
  if (r.error) throw new Error(r.error);
  return r;
}

;
// ===== 41_Alertas_Triggers.gs =====
// =========================================================
// 41 · ALERTAS AUTOMÁTICAS AL GRUPO (6 a.m. y 2 p.m.) E INSTRUCTIVO
// Las alertas NO consultan el WMS: usan la última sincronización hecha a mano
// (botón ⟳ del dashboard o /sincronizar en el bot) y dicen de hace cuánto son los datos.
// Ningún proceso automático hace GET al WMS.
//  - crearTriggersAutomaticos(): activa las alertas de las 6 a.m. y las 2 p.m.
//  - quitarTriggersAutomaticos(): las quita del todo.
// Se ejecutan una vez desde el editor.
// =========================================================
function crearTriggersAutomaticos() {
  quitarTriggersAutomaticos();
  ScriptApp.newTrigger("generarAlertaDiaria").timeBased().atHour(6).nearMinute(0).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger("generarAlertaDiaria").timeBased().atHour(14).nearMinute(0).everyDays(1).inTimezone(TZ).create();
}

function quitarTriggersAutomaticos() {
  let n = 0;
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "generarAlertaDiaria") { ScriptApp.deleteTrigger(t); n++; } });
  console.log(`Triggers de alertas quitados: ${n}`);
  return n;
}

function generarAlertaDiaria() {
  // Sin GET al WMS: se trabaja con lo que quedó en WMS_Base
  const inventarios = obtenerInventarioLocal();
  let rVencidos = 0, rVence = 0, rMal = 0;
  inventarios.forEach(i => {
    if (!i.tieneFisico) return;
    const c = evaluarCanales(i.d, i.fam, i.s, i.p);
    if (i.est === "DISPONIBLE") { if (i.d < 0) rVencidos++; else if (i.d < 60) rVence++; }
    if ((esZonaKA_(i.m) && !c.KA) || (esZonaPK_(i) && !c.T2)) rMal++;
  });
  const mLimbo = listarLimbo_().length;
  const mMezcla = calcularMezclados().length;
  const G = GRUPO_CALIDAD_ID;
  enviarMensaje(G, `⏰ *REPORTES DE TURNO*\n_Datos de la última sincronización manual:_\n${obtenerEstadoSync()}`);
  Utilities.sleep(800);
  enviarMensaje(G, rVencidos > 0 ? `🛑 *MERCANCÍA VENCIDA*\nSe detectaron *${rVencidos} ubicaciones* con producto vencido. ¡Acción requerida!` : `🛑 *MERCANCÍA VENCIDA*\n✅ Bodega libre de productos vencidos.`, rVencidos > 0 ? { inline_keyboard: [[{ text: "🔍 Ver vencidos", callback_data: "VENCIDOS|1" }]] } : null);
  enviarMensaje(G, rVence > 0 ? `⏳ *RIESGO DE VENCIMIENTO*\nHay *${rVence} ubicaciones* a menos de 60 días de vencer.` : `⏳ *RIESGO DE VENCIMIENTO*\n✅ Sin riesgos críticos a la vista.`, rVence > 0 ? { inline_keyboard: [[{ text: "🔍 Ver riesgos", callback_data: "FECH|60|1" }]] } : null);
  enviarMensaje(G, rMal > 0 ? `⚠️ *MAL UBICADOS (T2/KA)*\nSe detectaron *${rMal} infracciones* de canal.` : `⚠️ *MAL UBICADOS (T2/KA)*\n✅ Zonas T2 y KA limpias.`, rMal > 0 ? { inline_keyboard: [[{ text: "🔍 Ver mal ubicados", callback_data: "AVAN|MALUBICADOS|1" }]] } : null);
  enviarMensaje(G, mMezcla > 0 ? `🔀 *MÓDULOS CON 2 O MÁS SKUs*\nHay *${mMezcla} módulos* de los pasillos A a J con productos distintos. Posible error de ubicación.` : `🔀 *MÓDULOS CON 2 O MÁS SKUs*\n✅ Pasillos A a J sin productos mezclados.`, mMezcla > 0 ? { inline_keyboard: [[{ text: "🔍 Ver módulos", callback_data: "MEZC|1" }]] } : null);
  enviarMensaje(G, mLimbo > 0 ? `👻 *MERCANCÍA EN LIMBO*\nExisten *${mLimbo} registros* pendientes de SKU.` : `👻 *MERCANCÍA EN LIMBO*\n✅ No hay mercancía sin SKU.`, mLimbo > 0 ? { inline_keyboard: [[{ text: "🔍 Ver limbo", callback_data: "LIMBOLIST" }]] } : null);
}

function enviarInstructivoPDF(chatId) {
  if (!INSTRUCTIVO_DRIVE_ID) { enviarMensaje(chatId, "⚠️ El administrador aún no ha configurado el instructivo."); return; }
  enviarMensaje(chatId, "⏳ _Descargando instructivo desde Drive..._");
  try { enviarDocumento(chatId, DriveApp.getFileById(INSTRUCTIVO_DRIVE_ID).getBlob(), "📘 *Instructivo WMS oficial*"); }
  catch (e) { enviarMensaje(chatId, "❌ No se pudo obtener el archivo. Verifica el ID."); }
}

;
// ===== 42_Informe_Prioridad.gs =====
// =========================================================
// 42 · INFORME PDF: PRIORIDAD DE CONSUMO (índice de frescura)
// Todos los productos de la bodega, del que vence primero al último, con el color de
// su vida útil y la acción según el vencimiento (hacia dónde moverlo).
// Escala: <0 gris | 0-29 rojo | 30-45 amarillo | 46-90 verde claro | >90 verde oscuro
// El HTML se arma aquí (sin plantilla aparte) para que sirva igual en Apps Script y en la versión nueva.
// =========================================================
const LOGO_EMPRESA = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQIAJQAlAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCACKAIgDAREAAhEBAxEB/8QAHQAAAQUAAwEAAAAAAAAAAAAAAAMEBQYHAQIICf/EAD4QAAEDBAAEAwYFAgQEBwAAAAECAwQABQYRBxIhMRNBURQiM2GBsQgVMkJxI5FDUlOhCXKCwRZiY3OSotH/xAAcAQEAAgIDAQAAAAAAAAAAAAAABgcBBQIDBAj/xAAsEQEAAQMDBAAHAAEFAAAAAAAAAQIDBAURIQYSMUETFCIyUWFxBxUjQoGx/9oADAMBAAIRAxEAPwD6gUBQFAUBQFAUBQFAUBQFAUBQFAUCsb46fr9qBKgKAoCgKAoCgKDgnVBzQFAUBQFAUBQKxvjp+v2oEqAoCgKAoCgTceQjoT1rEzsG65XnvVctpYid1V4jZa1iOEXrI3pPg+wxFrbWf9Q+6gDfc8xHSkRuyy3hzx9fuIQi5Tg9z63zEa+npSY/Bs3Gz5LbrslHhPJCnBtIJ6K+Q+fypsTwl6wCgKAoCgVjfHT9ftQJUBQFAUBQVzOsuYxK1Nve6uXNeRFiNk9C4ogcx/8AKnez/agVQ74DQa8QrKR7y1HZUfMmsx+TbfhTr/xXxrHb6qwXcTmn0oQ74gY5mylQ6EEHZ9O3eorqnVOHpGRGPf33lu8TRb+dZ+Na8QxL8STWd8ZbTbcc4X5JjrVoaWZU9ifKciyZTyfhoHMjlCB36kbJG9AV6MXqfTsj/nEbuq9o+VZ80sBRjPGHhoWnspw25R4/MlKZUcCTHUTrQDjRUnuQK3lrKt3o3t1RMNfVaqt/dGz2jw2s15teIQk5AFN3GQkPutk9Wd/pR8iBrfzru33dMy07HL0uclcCWoe1RwDv/UR5K/n1pPljdNisMigKAoFY3x0/X7UCVAUBQFBwe1IHnX8QF1fmSi626pCYo0wQdcpB3zD576/2rn4cojdkF1/GpmOLwHIc7ErbdJjaQhqR4y2uZQ6bWgA7J+RFcau2PEMeatoFhzDidxFx3/xhxZxyNY7gucUWlhDXgretykcwJbUSvSVg6UrW+b5VT3+SKMa5VRcoq+uOE96Tm/RTVRX9iz2vZ5dgVXGLVNPtJciIn+LpZZ0yAUrhyXGifJJ6H+R2NTDSdRv2blPw65RrNx7VcTvDVmudbSC7oLUkFWvXXWrxxZqrtU1V+4QS52zXMwyn8Q3FYcFcatOcslK5TV4jMIY31fZKtvp/jwgvr5HVdOXkxjxE1T5bjRNKq1S5VRTHiHoW1XGHeLZDu9ueDsWcw3JYWP3NrSFJP9iK9Nurvp7mov26rNc26vMTsdVzdYoCgVjfHT9ftQJUBQFAUDO7y0wLXJln/CbJH89hWYgnjy87cXIcq7yExLYwt9yR0bSn+O5PYAeZpcqi3HdV4dluiquqKaY5lgqZmGYXdCLI1EyDJm1acujqQ5EgL3+mOg9HFjzcPQHt61XfUvVnwImzjTynuh9LVXIi7kxwmrXOl3F9ydcZbsmS8rmcddUVKUfmTVKZ2Vey73dfneU1jHs48dtunaFytagOX5V32I22lrMin2vOJwlTrjGY1tIPOv5JHWpr05hzl5lFPqEY1S9Fm1Mw1R1aG21OuLShKElSlqOgkDuSfIVeEzRat92/EQhFumvIuRTTD53/AIseKY4r5eItrcKrDYeeNBO+j7hP9R7+DoAfIfOq/wBS1P5rJ2ieIXb0vov+nYfdX99T2j+CjLJGU/h4xxEt7xZFlL1ocJOzytL/AKe/+hSR9KmOl3vjY1Mz6Vh1TjfLajXEeJ5brWx9o4KAoFY3x0/X7UCVAUBQFBBZqopx2RrfVSB/9hXOj7t5YmN94eIfxKcfVm4vcLMKmBHg/wBO8zmVe8SR1jIUO2v3kefT1qGdRapNG9m3PK0OkOmoqojLyY/jJ8XToISBoCqnz6pq37lgV09tO1PGzWsXYfluNxosdx55zQQ22kqUo/ICo1GJdy78UWYajMv0WKJquy06RiN6x2FFmXVlLYlEpCArakEDYCvQmpPlaBlaZZpu3o2iUYt6lZyrs0258NI4d2oRrau7PjSpHRBPYNjufr/2qyOjdPpxbM5d7jdEtaya796LFDDfxEcbjeY8nAsKln2FXuXGc2fj+rTZ/wAnqfPt2ry9RdT03J+WxvHuUs6Y6c7KoyMqP5DyleLfoFOulRjGvd07z5WPNURHD3L/AMP2DcYfB+6LloKYsi+OuQ9jXMnw0BZ/jmBq0NApn5bepS/Wd6i7n/R68vTtb9EP0KAoFY3x0/X7UCVAUBQFBReOV6kY1wiy3JIqAp+02t+a0D/nQglP++q6r9c27dVX6e3TLNN/Lt2/zL5G47JfmPGXKdU6+8suuuKPVa1Haif5JqrdRmeapneX0bZtU2rVNuniIhuvCbDb1nV7ZsdjZ2vXiPPL+Gw2O61n7DzPStFY0q9qt+LVuOPbRaxqdnTbM3a55e2sG4d4/gsBLFta8aWUgPTHQPEcPy/yp+Qq0dG6bxdLoiYpialOaprd7ULk908ej7L2bK9ZXBf5qIkVCkuF1R1opO9D1JGx09a7OoYwq8ffLqiIjl06XGRN3ezHMsN4n8VbjkUReO40hy3WYJDaiPddkJHkdfpT8vPz9KqbWusqsimMTD4ojj+rB0jp6nHn5jJ5r8sOuNv5QfdGh6VG7N6JnzumtFU7cm2JcNblxEyRqyQwpqOCHJknWwwzvqf+Y9gPX+KmXT+Dcz79MRH0+2p1rV7em483N+fT6C8I7Jb8dxFm02mKmPCikMsNj9qUpA+pPUk+u6ue1j041EW6fSksnKry7tV255mV2rm6BQFArG+On6/agSoCgKAoILO8ZZzTCb/iEn4d6tsmAry14jZSP9yK6r1PxKJj8vTg3psZFFyPETu+OtitNxt15dx1+Os3CNKVBWyB7xeSvkKdfyKrTPtTFc0+30LZy7c4tORvxMPo5wZwyw8JMKYg3GZETdpaUv3J4LBKnPJsefKjsPns+dSLTa8LSMfe5VHdKndeyr+r5MxTE9seExfOKMaIhbVkiKkOeTrvuoH07n/atRq/W9u1E040by44GgVVzvdZZkV1u+QSPabvMcfUN8qT0SgeiR2FVXqur5Wp1d12Z5TXBwbOLTtQrUyKFJI1UdqpmirhuaK9vCPtmEXjL7om02hjZPV11QPhtJ81KP8A286k2haXk6pci3bjj8vLqGq2cG3Ndc/9N0ttgxnhTijrLCglplPjTJKh/UkOfP7JTX0Domj2tLsRap8+1R6rql3U7vdV49Nm4fxpkbD7aq4t+HKkte1Ot/6ZcPMEf9KSkfyDW1qnulrI3nysNYZFAUCsb46fr9qBKgKAoCg416UYmXjHjFwCax38SDHE6LCSbLfWXJq+Ue6zc0ABW/TmB5x6kKqCdS4tVv8A3qPCwdK1yatO+UmeY/8AFgQAod+tV3kd8zvVMyzZrp28EXUHXXtWruWvUeWys3eNoR8lIAO9V47lmrxty9dFyI8ykMf4e3XJnA+8DEg7955Y95Q9EDz/AJqSaL0fk6lVFdcbU/trc/XbWJRNNM71NQjxcewizLbjJRFjNDmccUfeWr1Ue5NXNpOjY2l2otW4QDN1C7nVd9cq7jdjn8V8uiyLjHcax21uiSWFdPGUk+7zj5kdvQGtzMxx+ni5id4ehk9umtfKusc0BQFArG+On6/agSoCgKAoCm/JHHCPvllt+QW562XJkOMPJ0enVJ8lD0IrzZmNRlW5orh2Wa67Nf0ywLJOH+Q43OLBYMmOonwX0a0sfPfY/Kq9yumsqKp7I3hILGqWoj6vRnExW6TCPFLMdJ7latkfQV5bPRuVfq+uNoeirW7VEccrLasPsNvKZMlJmPI68zv6U/MDt/epRp3R+NizFd2N5hq8rXLl/wCiniCd44i2WA4YFtV+YzB7oZjnaUH0UrsPp1qWUWaKae2mNmpqqqrnumSdjw3IM5nN3C/q00k8zbABDbY/jzPzPWuyeePwxz5bXYrHCsEFMGE0EpHVSh3UfU1xmd2EjWAUBQFArG+On6/agSoCgKAoCgKBvOgRLlEdgzmA6y8OVaSSOnyI6g/MUjzuMYyvgVxEbecf4d8YZEVlZJ9ivkFqWEegQ+EhYH/MFfya590wxsqaPw9cZ7qtKMuz6LNZ7lDUlaW//iEDf1rE1TLlEQ0zC+CNrxttCprzby0/taSdf3P/AOU7pJ/DSY0SPEaDMdpKEJ8gK477sFqAoCgKAoFY3x0/X7UCVAUB1PQDZNBlkvjDlF/ucyDwg4YvZdDtshyHMvEm6tW23mQ2SFtMOLSpT5SoFKlJTyA7HMSDoH6OL4suHzck4kYXeMUmQJTUD8tVyTXJ8l3QZbhKZJEkuKPKkAAgg8wABNBFOcU+MkJo3m6fh0uSbKjbjiYl/iybo2zrfN7InQUrXdtLhV0IGzQdrj+I3B4t6wNmEl6dj+eNPqYvzPSPAcStDbSJKSOZvndX4WzrkcASrW6C18Vs8a4XYBd89kWty4N2hDSlRUOhtTnO8hvXMQda59/SgY8aeKCOD+GqyZvHZeQTXJjUOFaoi0oelOK2peiroAhpDrh35II86CRyrPrfj2BjPYUc3KC6iE9HS24EeK3JcbQhQJ2NadCvpQTOSZBZMPslwyTJbmzAtdqZU/LlOnSG209z6k+QA6kkAdaDNWeKnGC6tovePfh3uL1jdCXGTcL7GhXJ5o/vERYPISOoQ4tKuo2AaCy2Xi/g12wO4cRHrk5bLXZfGbu7dxZUzJtj7XRxh9o9UugkAJG+bmTy7CgSFab4rcYLk1+dWH8OlyesagHGDPv0WHcn2j15kxFA8iiNEIWtKuo2AaDTbJc/zq0RLt7BMg+1spdMWa14b7BPdDieulA7B60D2gVjfHT9ftQJUBQVviW9do3DjK5FhU8Lk1Y564amdlwPCOsoKNfu3rXz1QM+D8bHYnCfDGcRKFWYWCCqEpGtLaLCSFH1USSVHvzE760FfzoRn+O3C2NdVOexoi3+TARolpdzSzHDZV5c6Y65ZR5/r12oNPHQhQ3vy1QeZMVxaxZZxx4g4Pc7e1JxK4KvkVDCDypLjqbaqaEkfpIkKUoEdl7I60DTivk19h8AeIfCPPJTj+TYrGgqjTndbvVoVOYTGnD1WNeE8PJxO+y00Frzrirw4jfiQatGd5tZ7Tb8CsypCYsx0gyblcQUhRGiCluKhQ/mTQVHHMwxa7cAM0wHFsojXyJguRQrbCkMuFe7a9NYfhgk9+Rtws7/APRPpQa/x3TGeVgcS7E/k8jOraieNbQrQdVHSvy5DJSxvfny0Glkk7Ku5PWg8v8AEpu0H8SbFsnqSMXnXTFX7+kk+Eu8BM/2BLo/SQstxObfcpZ3+2g9QBJWvR3snz9aCHxLJoeYWRF9gMPNMrkSY/K7rm5mXltKPTyJQSPkRQTFArG+On6/agSoCg6uutsILzziW0IHMpayAlIHmSegFBkto4e5jhEySOD/ABBsbGKznnJSLBeoSpceA86sqUYTzLiFoaUsqPhK5kgk8mh0oHEjAZWY4kq2cS+J7E+8Sbii42e6WVDcAWmU0NN+wjmWVFJJ5udS+fnUlQ5Tqgau2zjjLtTdom8cMKix3XVRnb3Bsfh3BafRtK31R0P9uvIQD1CfKgnMQ4YYzhV9siMWuCURsftE2A5Fee8aU+7JfbeclPOE8ylqWhSlFQ6le+mtUEJ+IPglZ+OmJRW4+TIsNztz6HY16aAcR7L4qFSYzo2Atl1LYBBPuqSlQ6poLLw6wi1YvAur8yfBvV0yG8y71PnhtJS64+4fCQjZOkNtIbaSNno3/NBX+JnBZzMLtNvmK3qBZJ0+ytWqch2IXGZHgTG5UVxaUKSf6akvJ9Sl49elA4u2M5vxCtEvH+IN5wO5YtOSW7gm2xpbMhISeZK2ni+Q04hYSoL1tJSDQM41i462m0Ltds40YlcIKEpES83iyKduCGNgczqm30MPODtzlKQTokE72EhbeEXD5GF3rh1fLq7kD2RvmXfZ0yWn8wmTFFJTIJRrwloKG/CCAAjkQEjp1BnDx/jxboUjHbXxnxS5Iiabbul0sSnbpHa8i8Gn0suOgfvKEgkbI70F4wLEmMFxKBi8e6Srl7IHFuzZXKHZLzrinHXVBICU8y1qOkjQBAHagsFArG+On6/agSoDp60DK82/82tUq2+L4XtLRb5/8u/PpQRRxUGdbpwl+9bW1NoSoFfOF75iok7JA1yn9p5vWgZWzAG7bJtMo3V+Q5bW1ocUsBBeKvCA6NhKQAGta1131JPWgLTgX5bBjQpFyTMVHmxZaXHI6RpLJ34YCQB5nSj72j1KtboHLGKSGWo8Yyoa0RFuuIdVHJed50qADqt+8PfPNr9Wh2oHcexPt2GRZX5aNPBSG/CCgllBAASnZ5unU9/P5UCD2KBcm3S2py23YL7S1k7X47SCT4aiTvuQQfLr60D242h2cqZyyUNolx0M9UkkFKlEE9eqTzaI9N0DJ3G5cla5DjtubeHglDTMZQYWUHf9RPNtQ2Trtrp3oEpOLS5brkiTKhrUtHhIbEdSUNpDpWgp5VA8yemj6jZoHMvGfbGWPEkoD7cmHJcfDXvL8Egkb77Vrv5UCAxV5VlOPOyIiYimUx1utR+V51oEb5iSUkqSNE6PUk68qCatUR2BbmIT0pUlTCA2HVDSlJH6d/PWtnzoHdApG+On6/agruUTMriyLY1i0SI8H3JAlmUlXIhCWVFGinqCV8v89R03ugrdozDJZoNum265Q50uArkfVanCyxPA6o69PDA5SCo6JJG6BIX7iZbDBkTov5hFTJhR53h23kV4bhQXXkBKiraeZSSnRACd770D2Bf8sN3gsyPaJEaVcXmnmjaVNKZZ5fc05sp5Un3ipWidaAoGi8uzdu4TYxtbojtSHUw5CbY6pMhzf9OOU/qQkDqp8+7tXTsaAazvM3rbEWnEJSbg/DaeeZXEcCGXQF+0JKvPkPh8o7r2QPkHQZjm/O8hi0SH223AiE4u2OtmerYCkrH+Akb2FHofoaBK3ZbxMk3lqHd8dXbose0tyZL7cMutvSlJUeVJ3zAD3dpAKgdg+VBOyMrvLWJx7lGtcp+5rQphbPsa+kpJSOqB1Sg+8dny1QLM3nNJFrZKbFGYuaJKGJLb5WGFJ8IqU4hY68pVy6JHTej1oIWVmufRp8ZlrEFyY8eBJeuS0R3Enx0uIQ2ljfRewpSynqSlJ0dig6wMyzt2Ihc7H3GiICXg57A6S5OKElUYoHVKUkn+p2II11BoJC95HnDV2hwrDjjbzMluK4p10K5G+ZL5fSpQ7FKkR0j/ANwnyoOmLZjl95vTsS74VOt1vSuU0iS6zyguIdX4Y7/pU0Enm1oqPTpQRzGa8UI4t/5ngSXnJTMV95MELV4CDv2jmKiNLG0BKBs99/IJi35Vkr8iQbjj8qLHZSvwgqGsuvqSU7SAkkJB5jyk9x6cqqCbwi63u6wg7kVmXbZ7bq0raKdJKe6FJ6nfukA9e4NBL0AonWtmg4BOx1oOCT16mgNnr1Pag77PqaDrs7PU9qAST60HCCfWgBQdtnfegCTrvQdfICg7UHHnQBJHagWjfHT9ftQf/9k=";

function construirInformePrioridades() {
  const inv = obtenerInventarioLocal();
  if (inv.length === 0) return { error: "No hay datos en 'WMS_Base'. Sincroniza primero." };
  let datos = [];
  inv.forEach(r => {
    if (!r.tieneFisico) return;
    const dias = r.d;
    const obs = dias < 0 ? "⚠️ Vencido" : (r.est === "DISPONIBLE" ? "✅ Disponible" : "❌ Bloqueado");
    const vu = vidaUtilInfo(dias);
    const accion = { sin: "Sin fecha de vencimiento: verificar en WMS", venc: "Producto vencido, enviar a carpa", rojo: "Negociar venta y enviar a CRM", amar: "Enviar a picking y rotular como prioridad de consumo", vcla: "Apto para consumo", vosc: "Apto para KA y/o T1" }[vu.clave];
    const cantStr = r.e > 0 ? r.e + (r.e === 1 ? " Estiba" : " Estibas") : (r.c > 0 ? r.c + (r.c === 1 ? " Caja" : " Cajas") : r.u + " Unidades");
    let fFormat = formatearFecha(r.v);
    if (!fFormat || fFormat === "N/A") fFormat = "Sin fecha";
    datos.push({ ubi: r.m, sku: r.s, desc: r.p, cant: cantStr, vence: fFormat, dias: dias, diasTxt: dias === 9999 ? "—" : String(dias), accion: accion, obs: obs, color: vu.color });
  });
  datos.sort((a, b) => a.dias - b.dias);
  const fechaSync = Utilities.formatDate(new Date(), TZ, "dd/MM/yyyy");
  const filas = datos.map(x => `<tr style="background-color: ${x.color} !important; -webkit-print-color-adjust: exact;">
          <td class="col-center"><b>${escHtml_(x.ubi)}</b></td><td class="col-center">${escHtml_(x.sku)}</td><td><b>${escHtml_(x.desc)}</b></td>
          <td class="col-center"><b>${escHtml_(x.cant)}</b></td><td class="col-center">${escHtml_(x.vence)}</td><td class="col-center"><b>${x.diasTxt}</b></td>
          <td>${escHtml_(x.accion)}</td><td class="col-center" style="white-space: nowrap;">${x.obs}</td></tr>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { 
      size: letter landscape; 
      margin: 10mm;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #000;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .frecs-watermark {
      text-align: right;
      color: #28a745;
      font-size: 13px;
      font-style: italic;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid black;
      margin-bottom: 15px;
    }
    .header-table td {
      border: 1px solid black;
      text-align: center;
      vertical-align: middle;
      background-color: #ffffff;
    }
    .title-box {
      font-size: 22px;
      font-weight: bold;
      padding: 8px;
    }
    .subtitle-box {
      font-size: 20px;
      font-weight: bold;
      padding: 6px;
      border-top: 1px solid black;
    }
    
    .rules-table {
      width: 100%;
      border-collapse: collapse;
      height: 100%;
      font-size: 11px;
    }
    .rules-table td {
      border: 1px solid black;
      padding: 6px;
      font-weight: bold;
    }
    
    /* Logo de la empresa */
    .brand-box {
      padding: 8px;
      background-color: #ffffff !important;
      text-align: center;
      vertical-align: middle;
    }
    .brand-title {
      font-size: 14px;
      font-weight: bold;
      letter-spacing: 1px;
      color: #111;
      margin-bottom: 4px;
    }
    .brand-subtitle {
      font-size: 8.5px;
      font-weight: bold;
      color: #444;
      margin-bottom: 3px;
    }
    .brand-slogan {
      font-size: 6.5px;
      color: #666;
      line-height: 1.1;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid black;
    }
    .data-table th, .data-table td {
      border: 1px solid black;
      padding: 6px;
      text-align: left;
    }
    .data-table th {
      background-color: #f2f2f2 !important;
      color: #003399; /* AZUL FUERTE */
      font-weight: bold;
      font-size: 11px;
      text-align: center;
    }
    
    tr { page-break-inside: avoid; }
    .col-center { text-align: center !important; }
      .brand-box img { max-width: 100%; max-height: 118px; display: block; margin: 0 auto; }
</style></head><body>

  <div class="frecs-watermark">𝐹𝓇𝑒𝒸𝓈! ツ</div>

  <table class="header-table">
    <tr>
      <!-- Títulos sin fondo -->
      <td rowspan="2" style="width: 50%; padding: 0;">
         <div class="title-box">PRIORIDADES DE CONSUMO / ITAGUI</div>
         <div class="subtitle-box">Indice de Frescura</div>
      </td>
      <td rowspan="2" style="width: 35%; padding: 0;">
         <table class="rules-table">
           <tr>
             <td style="background-color: #a9d08e !important; -webkit-print-color-adjust: exact;">VERDE OSCURO</td>
             <td style="background-color: #ffffff !important;">Más de 90 días</td>
           </tr>
           <tr>
             <td style="background-color: #e2efda !important; -webkit-print-color-adjust: exact;">VERDE CLARO</td>
             <td style="background-color: #ffffff !important;">Entre 46 y 90 días</td>
           </tr>
           <tr>
             <td style="background-color: #fff2cc !important; -webkit-print-color-adjust: exact;">AMARILLO</td>
             <td style="background-color: #ffffff !important;">Entre 30 y 45 días</td>
           </tr>
           <tr>
             <td style="background-color: #ffcccc !important; -webkit-print-color-adjust: exact;">ROJO</td>
             <td style="background-color: #ffffff !important;">Menos de 30 días</td>
           </tr>
           <tr>
             <td style="background-color: #d9d9d9 !important; -webkit-print-color-adjust: exact;">GRIS</td>
             <td style="background-color: #ffffff !important;">Vencido</td>
           </tr>
           <tr>
             <td style="background-color: #ffffff !important;">Fecha:</td>
             <td style="background-color: #ffffff !important; font-weight: normal;">${fechaSync}</td>
           </tr>
         </table>
      </td>
      <!-- Logo de la empresa -->
      <td rowspan="2" style="width: 15%;" class="brand-box"><img src="${LOGO_EMPRESA}" alt="Logo"></td>
    </tr>
  </table>

  
  <table class="data-table">
    <thead><tr><th width="8%">Ubicación</th><th width="8%">SKU</th><th width="23%">Descripción</th><th width="10%">Cantidad</th><th width="10%">F. Vencimiento</th><th width="6%">Vida Útil</th><th width="25%">Acción Requerida</th><th width="10%">Obs.</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>
</body></html>`;
  return { blob: htmlAPdf_(html, `Prioridad_Consumo_${Utilities.formatDate(new Date(), TZ, "yyyyMMdd_HHmm")}.pdf`), caption: "📊 *Informe: prioridad de consumo*" };
}

;
// ---------------------------------------------------------------------
// Conexión del motor con la función del bot (Supabase)
// ---------------------------------------------------------------------
// PDF: se devuelve el HTML; la función lo dibuja (pdf.ts) antes de enviarlo a Telegram
htmlAPdf_ = function (html, nombre) { return { __html: html, __nombre: nombre, getName: () => nombre, getBytes: () => { throw new Error("PDF en el servidor"); } }; };
// El bot no tiene usuario del dashboard: actúa como administrador
usrSesion_ = function () { return { nombre: "Bot", rol: "administrador" }; };
// Traer el WMS lo sigue haciendo Apps Script (tiene la clave y llega al WMS)
sincronizarWMS = function (chatId, forzar) { __cola.push({ tipo: "sync", chatId: chatId, forzar: forzar === true }); return { ok: true }; };
// Lo que el bot guarda (limbo, consumo…) va a Supabase y luego se copia a las hojas de respaldo
const __espejoOriginal = sbEspejo_;
sbEspejo_ = function (tabla) { const r = __espejoOriginal(tabla); __cola.push({ tipo: "hojas", tabla: tabla }); return r; };

function __cargar(d, props, cache) {
  Object.keys(__libros).forEach(k => delete __libros[k]);
  Object.keys(__cache).forEach(k => delete __cache[k]);
  Object.keys(__props).forEach(k => delete __props[k]);
  __cacheCambios.poner = {}; __cacheCambios.quitar = [];
  __cola = [];
  _INV_CACHE = null; _MOD_CACHE = null; _SKU = null; _CANALES = null; _THOJAS = {}; _LIBROS = {}; _SS = null; _TURNOS = null; _TZ_HOJA = null;
  Object.assign(__props, props || {});
  Object.assign(__cache, cache || {});
  __props.mig_val_v2 = "1"; __props.mig_ka_12026 = "1";
  const s = d.sync || {};
  if (s.ultima_sync) __props.wms_last_sync_ts = String(s.ultima_sync);
  if (s.ultimo_movimiento) __props.wms_last_movement_ts = String(s.ultimo_movimiento);
  if (s.filas) __props.wms_last_rows = String(s.filas);

  const main = SpreadsheetApp.openById(SHEET_ID);
  main.poner("WMS_Base", [WMS_HEADERS].concat(d.wms_base || []));
  main.poner("WMS_Modulos", [WMS_MOD_HEADERS].concat(d.wms_modulos || []));
  main.poner("Sku", [Object.values(SKU_ENCABEZADOS)].concat(d.sku || []));
  main.poner("Canales", [CANALES_DEF.cab].concat(d.canales || []));
  main.poner("Capacidad_Bodega", [["Modulo", "Caras", "Capacidad"]].concat(d.capacidad || []));
  main.poner("Consumo", [CONSUMO_DEF.cab].concat(d.consumo || []));
  main.poner("Limbo", [["Id", "Producto", "Vencimiento", "Presentacion", "Cubicaje", "Fecha_reporte"]].concat(d.limbo || []));
  main.poner("Usuarios", [USR_DEF.cab]);
  const val = SpreadsheetApp.openById(ARCHIVOS.VAL);
  val.poner(VAL_T.destinos.nombre, [VAL_T.destinos.cab].concat(d.destinos || []));
  val.poner(VAL_T.productos.nombre, [VAL_T.productos.cab].concat(d.val_productos || []));
  val.poner(VAL_T.registros.nombre, [VAL_T.registros.cab].concat(d.val_registros || []));
  val.poner(VAL_T.histProd.nombre, [VAL_T.histProd.cab].concat(d.val_hist_productos || []));
  val.poner(VAL_T.histReg.nombre, [VAL_T.histReg.cab].concat(d.val_hist_registros || []));
  const ent = SpreadsheetApp.openById(ARCHIVOS.ENTREGA);
  ent.poner(TURNOS_DEF.nombre, [TURNOS_DEF.cab].concat(d.turnos || []));
  ent.poner(ENT_T.items.nombre, [ENT_T.items.cab].concat(d.ent_items || []));
  ent.poner(ENT_T.notas.nombre, [ENT_T.notas.cab].concat(d.ent_notas || []));
  const conc = SpreadsheetApp.openById(ARCHIVOS.CONC);
  conc.poner(CONC_T.conc.nombre, [CONC_T.conc.cab].concat(d.conciliaciones || []));
  conc.poner(CONC_T.items.nombre, [CONC_T.items.cab].concat(d.conc_items || []));
  conc.poner(CONC_T.pre.nombre, [CONC_T.pre.cab].concat(d.preconciliacion || []));
  _HIST_RESUMEN = d.resumen_turnos ? { turnos: d.resumen_turnos, conc: d.resumen_conc || {} } : null;
}

return {
  cargar: __cargar,
  // Mensaje de Telegram (el mismo doPost de Apps Script; la clave del webhook la revisa la función)
  telegram(contenido) { return doPost({ postData: { contents: contenido }, parameter: {} }); },
  alerta() { return generarAlertaDiaria(); },
  pdf(tipo, id) { const r = construirPDFPorTipo_(tipo, id || ""); return { nombre: r.blob.getName(), html: r.blob.__html, caption: r.caption || "" }; },
  // Lo que quedó por enviar y lo que cambió en la memoria del bot
  tomarCola() { const c = __cola; __cola = []; return c; },
  cambiosCache() { return { poner: Object.assign({}, __cacheCambios.poner), quitar: __cacheCambios.quitar.slice() }; },
  grupo: () => GRUPO_CALIDAD_ID
};

})(); }

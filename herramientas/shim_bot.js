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

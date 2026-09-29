// ---------------------------------------------------------------------
// Apps Script en el navegador (solo lo que usa la lógica de Frecs).
// Las "hojas" se arman en memoria con los datos que llegan de Supabase,
// así las mismas funciones del servidor (.gs) corren aquí sin cambios.
// ---------------------------------------------------------------------
const __TZ_DEF = "America/Bogota";
// Los errores de negocio ("ya está en la lista"…) ya se muestran en pantalla: en la consola van como aviso
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
const __props = {};
const __cache = {};
const SpreadsheetApp = {
  openById: id => { if (!__libros[id]) __libros[id] = new __Libro(id); return __libros[id]; },
  create: n => { throw new Error("No disponible en la versión web."); },
  flush() {}
};
const PropertiesService = { getScriptProperties: () => ({
  getProperty: k => (k in __props ? __props[k] : null),
  setProperty: (k, v) => { __props[k] = String(v); },
  deleteProperty: k => { delete __props[k]; },
  getProperties: () => Object.assign({}, __props)
}) };
const CacheService = { getScriptCache: () => ({
  get: k => (k in __cache ? __cache[k] : null), put: (k, v) => { __cache[k] = String(v); }, remove: k => { delete __cache[k]; },
  putAll: o => Object.assign(__cache, o), getAll: ks => { const r = {}; ks.forEach(k => { if (k in __cache) r[k] = __cache[k]; }); return r; }, removeAll: ks => ks.forEach(k => delete __cache[k])
}) };
const LockService = { getScriptLock: () => ({ tryLock: () => true, waitLock() {}, releaseLock() {} }) };
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
  getUuid: () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()),
  sleep() {},
  DigestAlgorithm: { SHA_256: "SHA_256", MD5: "MD5" }, Charset: { UTF_8: "UTF-8" },
  computeDigest: () => { throw new Error("No disponible en la versión web."); },
  base64Encode: b => btoa(String.fromCharCode.apply(null, b)),
  newBlob: () => { throw new Error("No disponible en la versión web."); }
};
const Session = { getActiveUser: () => ({ getEmail: () => "" }) };
const __noWeb = () => { throw new Error("No disponible en la versión web."); };
const UrlFetchApp = { fetch: __noWeb };
const HtmlService = { createHtmlOutput: __noWeb, createTemplateFromFile: __noWeb, createHtmlOutputFromFile: __noWeb, XFrameOptionsMode: {} };
const DriveApp = { getFileById: __noWeb };
const ScriptApp = { getProjectTriggers: () => [], newTrigger: __noWeb, deleteTrigger: __noWeb };
const ContentService = { createTextOutput: __noWeb, MimeType: {} };

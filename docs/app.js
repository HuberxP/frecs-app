// GENERADO por herramientas/construir.py: no editar a mano.
// =====================================================================
// Frecs! · Dashboard (JS)
// Núcleo: estado, llamadas al servidor, cola sin conexión, ingreso, navegación
// =====================================================================
// verificador y opm: solo Stock, Información de producto, Por módulo y los reportes de módulos (VERIF_VISTAS)
// opm: el que surte PK (T2), T1 o KA; igual al verificador, con el switch de canal encendido
const ROLES = { verificador: 1, opm: 1, lector: 1, validador: 2, administrador: 3 };
const NAV = [
  { g: "", items: [
    { id: "inicio", ic: "🏠", t: "Inicio" } ] },
  { g: "Reporte de módulos", items: [
    { id: "repvacio", ic: "⬜", t: "Reportar vacío" },
    { id: "repconflicto", ic: "⚠️", t: "Reportar conflicto" },
    { id: "repgen", ic: "📣", t: "Reportes generados" } ] },
  { g: "Turnos", cls: "turnos", items: [
    { id: "conciliacion", ic: "⚖️", t: "Conciliación" },
    { id: "validacion", ic: "📝", t: "Validaciones" },
    { id: "entrega", ic: "📋", t: "Entrega de turno" },
    { id: "final", ic: "📦", t: "Entrega final" },
    { id: "consumo", ic: "🥤", t: "Consumo" },
    { id: "rotular", ic: "🏷️", t: "Rotular", rol: "validador" },
    { id: "actualizacion", ic: "🕒", t: "Actualización de bodega" },
    { id: "preconciliacion", ic: "📌", t: "Pre-conciliación" } ] },
  { g: "Historial", cls: "turnos", items: [
    { id: "hval", ic: "🗂️", t: "Historial de validaciones" },
    { id: "hent", ic: "🗂️", t: "Historial de entregas" },
    { id: "hconc", ic: "🗂️", t: "Historial de conciliaciones" } ] },
  { g: "Operación", items: [
    { id: "stock", ic: "📡", t: "Stock por SKU" },
    { id: "producto", ic: "🔍", t: "Información de producto" },
    { id: "grupo", ic: "📦", t: "Búsqueda grupal" },
    { id: "modulo", ic: "📍", t: "Por módulo" },
    { id: "pk", ic: "🛒", t: "Picking / Preventa" },
    { id: "ka", ic: "🏬", t: "KA (grandes superficies)" },
    { id: "carpa", ic: "⛺", t: "Carpa (M1–M15)" },
    { id: "barriles", ic: "🛢️", t: "Barriles" },
    { id: "retornables", ic: "🍾", t: "Retornables" },
    { id: "fecha", ic: "📅", t: "Fecha exacta" } ] },
  { g: "Calidad y auditoría", items: [
    { id: "vencidos", ic: "🛑", t: "Vencidos" },
    { id: "fechas", ic: "⏳", t: "Fechas cortas" },
    { id: "bloqueados", ic: "❌", t: "Bloqueados" },
    { id: "candados", ic: "🔒", t: "Candados" },
    { id: "prioridades", ic: "🚨", t: "Prioridades" },
    { id: "tpc", ic: "🏷️", t: "Tapacódigos" },
    { id: "reempaque", ic: "📦", t: "Reempaques" },
    { id: "malubicados", ic: "⚠️", t: "Mal ubicados" },
    { id: "merma", ic: "📉", t: "Merma" },
    { id: "mezclados", ic: "🔀", t: "Módulos con 2+ SKUs" },
    { id: "infiltrados", ic: "👻", t: "Infiltrados" } ] },
  { g: "Gestión", items: [
    { id: "resumen", ic: "📊", t: "Resumen gerencial" },
    { id: "pocos", ic: "🧯", t: "Pocos (bajo el mínimo)" },
    { id: "limbo", ic: "🌫️", t: "Limbo (sin SKU)" } ] },
  { g: "Slotting", items: [
    { id: "organizar", ic: "🧩", t: "Organizar bodega" },
    { id: "huecos", ic: "🕳️", t: "Huecos" },
    { id: "vacios", ic: "⬜", t: "Módulos vacíos" },
    { id: "consolidar", ic: "🧹", t: "Consolidar sueltas" },
    { id: "acomodar", ic: "🎯", t: "Acomodar ingreso" },
    { id: "envasado", ic: "🧮", t: "Fecha de envasado" } ] },
  { g: "Reportes", items: [
    { id: "reportes", ic: "📄", t: "PDFs" } ] },
  { g: "Administración", rol: "administrador", items: [
    { id: "usuarios", ic: "👥", t: "Usuarios y PIN" },
    { id: "skus", ic: "🗃️", t: "Productos (hoja Sku)" },
    { id: "canales", ic: "🚦", t: "Canales (días mínimos)" },
    { id: "capacidad", ic: "🧱", t: "Capacidad de bodega" },
    { id: "consumolista", ic: "🥤", t: "Lista de consumo" },
    { id: "pocosvig", ic: "🔔", t: "Alerta de pocos" },
    { id: "vistasrol", ic: "🔐", t: "Secciones por rol" } ] }
];
const TITULOS = {}; NAV.forEach(g => g.items.forEach(i => TITULOS[i.id] = Object.assign({ rol: g.rol }, i)));

const S = { tk: "", usuario: null, inv: null, ocup: {}, cat: null, sync: null, vista: "inicio", params: {}, turno: null, val: null, ent: null, conc: null, grupoTg: false, instructivo: false, cargandoInv: null, online: navigator.onLine, sinCon: false };

// ---------- utilidades ----------
const $ = (sel, el) => (el || document).querySelector(sel);
const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
const h = s => String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fm = n => { if (n === null || n === undefined || n === "") return "0"; const v = Math.round(Number(n) * 10) / 10; if (!isFinite(v)) return "0"; const p = String(Math.abs(v)).split("."); return (v < 0 ? "-" : "") + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (p[1] ? "," + p[1] : ""); };
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tV = v => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : 8.64e15; };
const cmpMod = (a, b) => String(a.m).localeCompare(String(b.m), undefined, { numeric: true, sensitivity: "base" });
const cmpSku = (a, b) => String(a.s || a.sku).localeCompare(String(b.s || b.sku), undefined, { numeric: true });
const prio = (a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0);
const fechaCorta = s => { const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s || ""); return m ? `${m[3]}/${m[2]} ${m[4]}:${m[5]}` : (s || ""); };
const soloHora = s => { const m = /[ T](\d{2}):(\d{2})/.exec(s || ""); return m ? `${m[1]}:${m[2]}` : ""; };
const fechaDMY = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : (s || ""); };
const ahoraLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const ahoraTxt = () => ahoraLocal().replace("T", " ") + ":00";
const skuTxt = (s, p) => `<span class="sku">${h(s)}</span> · <span class="pnom">${h(p)}</span>`;
// Módulo como etiqueta (borde azul neón, letras negras) en toda la página
const modChip = m => `<span class="mod-chip">${h(m)}</span>`;
// Ícono de borrar (rojo en toda la página)
const ICO_DEL = `<svg class="ico-del" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;
// Cantidades con nombre completo: "Estibas: 3 | Cajas: 120 | Unidades: 0"
const qty = (e, c, u, emp) => `<span class="qty">Estibas: <b>${fm(e)}</b><span class="sep">|</span>${h(emp || "Cajas")}: <b>${fm(c)}</b><span class="sep">|</span>Unidades: <b>${fm(u)}</b></span>`;
const puede = rol => !!S.usuario && (ROLES[S.usuario.rol] || 0) >= (ROLES[rol] || 1);
// Verificador: solo estas pantallas
const VERIF_VISTAS = new Set(["stock", "producto", "modulo", "repvacio", "repconflicto", "repgen"]);
const ROLES_VERIF = new Set(["verificador", "opm"]);
const esVerif = () => !!S.usuario && ROLES_VERIF.has(S.usuario.rol);
// Reportes de módulos (vacío / conflicto) que llegan con los datos; pendientes = contador del menú
const repPend = () => (S.rep || []).filter(r => r.estado === "PENDIENTE");
function repDe(m) { const k = String(m || "").toUpperCase(), p = repPend(); return { v: p.find(r => r.tipo === "VACIO" && r.m === k), c: p.find(r => r.tipo === "CONFLICTO" && r.m === k) }; }
const repVacio = m => !!repDe(m).v;
function guardarRep(lista) { S.rep = Array.isArray(lista) ? lista : []; ls.setJ("rep", S.rep); if (S.usuario) pintarNav(); }
// ¿Qué pantallas ve cada rol? Por defecto lo de siempre; el administrador cambia lo que quiera en «Secciones por rol».
// Solo se puede dar lo que el rol alcanza (lo que el servidor le deja hacer); al administrador nunca se le quitan Usuarios ni Secciones por rol.
const ROL_LISTA = ["verificador", "opm", "lector", "validador", "administrador"];
const SIEMPRE_ADMIN = new Set(["usuarios", "vistasrol"]);
function itemNav(id) { for (const g of NAV) { const i = g.items.find(x => x.id === id); if (i) return [g, i]; } return [null, null]; }
function rolAlcanza(id, rol) { const [g, i] = itemNav(id); if (!i) return true; const r = i.rol || g.rol; return !r || (ROLES[rol] || 0) >= (ROLES[r] || 1); }
const vistaDefecto = (id, rol) => ROLES_VERIF.has(rol) ? VERIF_VISTAS.has(id) : rolAlcanza(id, rol);
function vistaPermitida(id, rol, cfg) {
  rol = rol || (S.usuario && S.usuario.rol); if (!rol) return false;
  if (rol === "administrador" && SIEMPRE_ADMIN.has(id)) return true;
  if (!rolAlcanza(id, rol)) return false;
  const o = (cfg || S.vistasRol || {})[rol];
  return o && typeof o[id] === "boolean" ? o[id] : vistaDefecto(id, rol);
}
const primeraVista = () => vistaPermitida("inicio") ? "inicio" : ((NAV.flatMap(g => g.items).find(i => vistaPermitida(i.id)) || { id: "inicio" }).id);
// Sugerencias de cantidades del WMS en validación: cada persona decide (apagadas por defecto)
const verWms = () => !!(S.usuario && S.usuario.prefs && S.usuario.prefs.wmsSug === true);
// Switch de canal (cada persona el suyo, queda guardado hasta que lo cambie): T1, T2 (PK) o KA.
// Encendido, las consultas muestran solo lo que cumple los días mínimos de ese canal (hoja Sku / Canales).
const CANALES = { T1: "T1", T2: "T2 · PK", KA: "KA" };
const canalAct = () => { const c = S.usuario && S.usuario.prefs && S.usuario.prefs.canal; return CANALES[c] ? c : ""; };
// ¿Esa ubicación sirve para el canal? Disponible y con los días mínimos del canal
const cumpleCanal = (i, c) => !!(i && i.disp && i[c || canalAct()]);
// En T2 (PK) primero lo que dice «reempaque» en la observación del WMS (prioridad reempaque)
const reempPrimero = (a, b) => (b.reemp ? 1 : 0) - (a.reemp ? 1 : 0);
function pintarCanal() {
  const b = $("#canalChip"); if (!b) return;
  const c = canalAct();
  b.classList.toggle("on", !!c); b.classList.toggle("hidden", !S.usuario);
  b.innerHTML = c ? `🚦 <b>${h(CANALES[c])}</b>` : `🚦 <span class="txt">Canal</span>`;
  b.title = c ? `Canal ${CANALES[c]} encendido: las consultas muestran solo lo que cumple sus días mínimos` : "Escoger un canal (T1, T2 / PK o KA)";
}
async function ponerCanal(c) {
  const antes = canalAct();
  if (antes === c) return;
  S.usuario.prefs = Object.assign({}, S.usuario.prefs, { canal: c || null }); ls.setJ("usuario", S.usuario); pintarCanal(); repintar();
  try { S.usuario.prefs = await api("webPref", "canal", c || null); ls.setJ("usuario", S.usuario); toast(c ? `Canal ${CANALES[c]} encendido` : "Canal apagado: se ve todo", "ok", 2500); }
  catch (e) { S.usuario.prefs = Object.assign({}, S.usuario.prefs, { canal: antes || null }); ls.setJ("usuario", S.usuario); pintarCanal(); repintar(); toast(e.message, "bad", 5000); }
}
function modalCanal() {
  const c = canalAct();
  const m = abrirModal(`<h3>🚦 Canal</h3><p class="small muted" style="margin-top:0">Encendido, Stock, Búsqueda grupal y Por módulo muestran solo el producto que cumple los días mínimos de ese canal (los de la hoja Sku y Canales). Si un producto no cumple, te dice dónde está. Queda guardado hasta que lo cambies.</p>
    <div class="canal-ops">${[["", "Apagado", "Se ve todo"], ["T1", "T1", "Tradicional"], ["T2", "T2 · PK", "Picking / preventa · primero lo de prioridad reempaque"], ["KA", "KA", "Grandes superficies"]].map(([k, t, d]) => `<button type="button" class="canal-op ${c === k ? "on" : ""}" data-c="${k}"><b>${t}</b><span>${d}</span></button>`).join("")}</div>
    <div class="modal-actions"><button class="btn" data-x>Cerrar</button></div>`);
  m.onclick = e => { const b = e.target.closest("[data-c]"); if (!b) return; cerrarModal(true); ponerCanal(b.dataset.c); };
}
// Aviso arriba de las consultas cuando el canal está encendido
const canalBanner = extra => { const c = canalAct(); return c ? `<div class="canal-ban"><span>🚦 Canal <b>${h(CANALES[c])}</b> encendido · solo lo que cumple sus días mínimos${extra ? ` · ${extra}` : ""}${c === "T2" ? " · primero lo de prioridad reempaque" : ""}</span><button type="button" class="btn sm" data-canal-off>Apagar</button></div>` : ""; };
document.addEventListener("click", e => { if (e.target.closest("[data-canal-off]")) ponerCanal(""); });
const ls = {
  get(k, d) { try { const v = localStorage.getItem("frecs_" + k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("frecs_" + k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem("frecs_" + k); } catch (e) {} },
  getJ(k, d) { try { const v = localStorage.getItem("frecs_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  setJ(k, v) { try { localStorage.setItem("frecs_" + k, JSON.stringify(v)); } catch (e) {} }
};

// ---------- llamadas al servidor ----------
const PUBLICAS = ["webPublico", "webSetup", "webLogin"];
function esErrorRed(e) { const m = String(e && e.message || e); return !navigator.onLine || /network|networkerror|failed to fetch|timeout|tiempo de espera|conexi[oó]n|0x|unable to connect|no se pudo conectar/i.test(m); }
let pendientes = 0;
function cargando(d) { pendientes = Math.max(0, pendientes + d); const b = document.getElementById("busyBar"); if (b) b.classList.toggle("on", pendientes > 0); }
const API_LIMITE_MS = 60000;
function api(fn, ...args) {
  cargando(1);
  return new Promise((res0, rej0) => {
    let listo = false;
    const fin = () => { if (listo) return false; listo = true; clearTimeout(reloj); cargando(-1); return true; };
    const res = v => res0(v), rej = e => rej0(e);
    const reloj = setTimeout(() => { if (fin()) { const er = new Error("El servidor no respondió a tiempo. Puede que sí se haya guardado: revisa antes de repetir."); er.tarde = true; rej(er); } }, API_LIMITE_MS);
    const run = google.script.run
      .withSuccessHandler(txt => {
        if (!fin()) return;
        marcarOnline(true);
        let r;
        try { r = typeof txt === "string" ? JSON.parse(txt) : txt; } catch (e) { return rej(new Error("Respuesta inválida del servidor")); }
        if (!r) return rej(new Error("Sin respuesta del servidor"));
        if (r.ok) return res(r.data);
        if (r.sesion) { mostrarLogin(r.error); const er = new Error(r.error); er.sesion = true; return rej(er); }
        rej(new Error(r.error || "Error desconocido"));
      })
      .withFailureHandler(e => {
        if (!fin()) return;
        const er = new Error((e && e.message) ? e.message : String(e));
        if (esErrorRed(er)) { er.red = true; marcarOnline(false); }
        rej(er);
      });
    if (PUBLICAS.includes(fn)) run[fn](...args); else run[fn](S.tk, ...args);
  });
}

function marcarOnline(on) {
  if (S.sinCon === !on) return;
  S.sinCon = !on;
  $("#offBar").classList.toggle("hidden", on);
  if (on) procesarCola();
}
window.addEventListener("online", () => { marcarOnline(true); procesarCola(); });
window.addEventListener("offline", () => marcarOnline(false));

// ---------- cola de cambios sin conexión ----------
// Se guardan en este equipo y se suben en orden cuando vuelve la conexión.
// Si al subir el servidor los rechaza (p. ej. ya no alcanza el saldo), quedan en "errores".
function cola() { return ls.getJ("cola", []); }
function colaErr() { return ls.getJ("colaErr", []); }
function pintarCola() {
  const c = cola(), e = colaErr(), chip = $("#colaChip");
  if (!c.length && !e.length) { chip.classList.add("hidden"); return; }
  chip.classList.remove("hidden");
  chip.classList.toggle("err", !!e.length);
  chip.textContent = e.length ? `⚠️ ${e.length} sin subir` : `⏳ ${c.length} por subir`;
}
function encolar(fn, args, desc) {
  const c = cola();
  c.push({ id: Date.now() + "" + Math.random().toString(36).slice(2, 6), fn: fn, args: args, desc: desc, ts: ahoraTxt(), quien: S.usuario ? S.usuario.nombre : "" });
  ls.setJ("cola", c);
  pintarCola();
  toast("Sin conexión: el cambio quedó guardado en este equipo y se sube al volver la conexión.", "warn", 6000);
}
let colaCorriendo = false;
async function procesarCola() {
  if (colaCorriendo || !S.tk) return;
  let c = cola();
  if (!c.length) { pintarCola(); return; }
  colaCorriendo = true;
  let subidos = 0;
  try {
    while (c.length) {
      const it = c[0];
      try { await api(it.fn, ...it.args); subidos++; }
      catch (e) {
        if (e.red) break;
        if (e.sesion) break;
        const er = colaErr(); er.push(Object.assign({}, it, { error: e.message })); ls.setJ("colaErr", er);
      }
      c = cola(); c.shift(); ls.setJ("cola", c);
    }
  } finally { colaCorriendo = false; pintarCola(); }
  if (subidos) { toast(`${subidos} cambio(s) guardados sin conexión se subieron.`, "ok"); refrescarVistaTurno(); }
  if (colaErr().length) toast("Algunos cambios hechos sin conexión no se pudieron subir. Toca el aviso ⚠️ arriba para verlos.", "bad", 8000);
}
setInterval(() => { if (navigator.onLine) procesarCola(); }, 30000);
$("#colaChip").onclick = () => {
  const c = cola(), e = colaErr();
  const card = abrirModal(`<h3>Cambios hechos sin conexión</h3>
    ${c.length ? `<p class="muted small">Por subir (${c.length}):</p><div class="mini-list">${c.map(x => `<div class="mini">${h(fechaCorta(x.ts))} · ${h(x.desc)}</div>`).join("")}</div>` : ""}
    ${e.length ? `<p class="small" style="color:var(--bad);margin-top:14px">No se pudieron subir (${e.length}):</p><div class="mini-list">${e.map(x => `<div class="mini v-rojo">${h(fechaCorta(x.ts))} · ${h(x.desc)}<br><b>${h(x.error)}</b></div>`).join("")}</div>` : ""}
    <div class="modal-actions">${e.length ? `<button class="btn" id="ceB">Borrar la lista de errores</button>` : ""}${c.length ? `<button class="btn primary" id="ceR">Reintentar ahora</button>` : ""}<button class="btn" data-x>Cerrar</button></div>`);
  const b = $("#ceB", card); if (b) b.onclick = () => { ls.setJ("colaErr", []); pintarCola(); cerrarModal(true); };
  const r = $("#ceR", card); if (r) r.onclick = () => { cerrarModal(true); procesarCola(); };
};

// Escritura que se puede encolar si no hay conexión
async function escribir(fn, args, desc, encolable) {
  try { return await api(fn, ...args); }
  catch (e) {
    if (e.red && encolable) { encolar(fn, args, desc); const x = new Error("encolado"); x.encolado = true; throw x; }
    throw e;
  }
}

// Guardado optimista: la pantalla muestra el cambio al instante (S.enviando) y el
// servidor confirma por detrás. Sin conexión queda en la cola; si el servidor lo
// rechaza, se quita y se avisa.
S.enviando = [];
async function enviarOptimista(fn, args, desc, alTerminar) {
  const it = { id: Date.now() + Math.random(), fn: fn, args: args, desc: desc, ts: ahoraTxt(), quien: S.usuario ? S.usuario.nombre : "" };
  S.enviando.push(it);
  let r = null;
  try { r = await api(fn, ...args); }
  catch (e) {
    if (e.red) encolar(fn, args, desc);
    else if (e.tarde) toast(`${desc || "Cambio"}: ${e.message}`, "warn", 9000);
    else toast("No se guardó: " + e.message, "bad", 7000);
  }
  S.enviando = S.enviando.filter(x => x !== it);
  if (alTerminar) alTerminar(r);
  return r;
}
// Cambios aún no confirmados (en camino o en la cola) de una función
const noConfirmados = fn => cola().concat(S.enviando).filter(x => x.fn === fn);

// Momento del último toque/tecla: el refresco automático no repinta si alguien está usando la pantalla
let ultimaInteraccion = 0;
["pointerdown", "keydown", "wheel", "touchstart"].forEach(ev => window.addEventListener(ev, () => { ultimaInteraccion = Date.now(); }, { passive: true, capture: true }));
const usandoPantalla = () => Date.now() - ultimaInteraccion < 15000;

// ---------- nunca cambiar la pantalla bajo el dedo ----------
// Antes, cuando llegaban datos nuevos del servidor la sección se volvía a dibujar sola.
// Si en ese instante alguien tocaba, el toque caía en otro botón (p. ej. el 🗑 de otra fila).
// Ahora: si la persona ya tocó la sección, no se redibuja; sale un aviso "Hay cambios · Ver".
function refrescarVista(pintar) {
  if (!modalAbierto() && ultimaInteraccion <= S.vistaDesde) { const y = window.scrollY; pintar(); if (window.scrollY !== y) window.scrollTo(0, y); return; }
  S.pendRepintar = pintar;
  $("#nuevoChip").classList.remove("hidden");
}
function quitarChip() { S.pendRepintar = null; const c = document.getElementById("nuevoChip"); if (c) c.classList.add("hidden"); }
function aplicarPendiente() {
  $("#nuevoChip").classList.add("hidden");
  const f = S.pendRepintar; S.pendRepintar = null;
  if (f) { const y = window.scrollY; f(); window.scrollTo(0, y); }
}
const mismo = (a, b) => { try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; } };

// Ningún error queda en silencio (antes la página parecía "pegada")
window.addEventListener("error", e => { console.error(e.error || e.message); });
window.addEventListener("unhandledrejection", e => { const m = e.reason && e.reason.message; if (m && m !== "encolado") toast("Algo falló: " + m, "bad", 6000); });

// ---------- avisos, modal ----------
function toast(msg, tipo, ms, extraHtml) {
  const t = document.createElement("div");
  t.className = "toast " + (tipo || "");
  t.innerHTML = `<span>${h(msg)}</span>${extraHtml || ""}`;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), ms || 4200);
}
const loader = txt => `<div class="loader"><div class="spin"></div>${h(txt || "Cargando…")}</div>`;
const vacio = (txt, ic) => `<div class="empty"><div class="big">${ic || "✅"}</div><div>${h(txt)}</div></div>`;
const errBox = e => `<div class="err">⚠️ ${h(e && e.message ? e.message : e)}</div>`;
// La explicación de cada sección queda detrás del botón «?» (se despliega al tocarlo)
// El botón «?» muestra / oculta todas las explicaciones de la pantalla (lo que lleva la clase «ayuda»);
// si la pantalla no tiene ninguna, el botón no se ve (CSS :has)
function cab(titulo, sub, tools) {
  return `<div class="vh"><div><h1>${titulo} <button class="ayuda-btn" data-ayuda title="Ver la explicación" aria-label="Ver la explicación">?</button></h1>${sub ? `<div class="sub ayuda">${sub}</div>` : ""}</div>${tools ? `<div class="tools">${tools}</div>` : ""}</div>`;
}
document.addEventListener("click", e => { const b = e.target.closest("[data-ayuda]"); if (!b) return; const v = b.closest("#view") || $("#view"); v.classList.toggle("ver-ayuda"); b.classList.toggle("on", v.classList.contains("ver-ayuda")); });
// Tarjetas desplegables: se abren y cierran al tocar su cabecera; se recuerda cuáles están abiertas
S.abiertos = {};
const abierto = (grupo, clave) => !!(S.abiertos[grupo] && S.abiertos[grupo][clave]);
document.addEventListener("click", e => {
  const c = e.target.closest("[data-plegar]"); if (!c) return;
  if (e.target.closest("button:not([data-plegar]), a, input, select, textarea, label")) return;
  const card = c.closest(".plegable"); if (!card) return;
  const [g, k] = c.dataset.plegar.split("|");
  S.abiertos[g] = S.abiertos[g] || {};
  const abrir = !card.classList.contains("abierto");
  const y0 = c.getBoundingClientRect().top;
  // Acordeón: al abrir una se cierran las demás del mismo grupo («Abrir todas» sigue abriéndolas todas)
  if (abrir) {
    S.abiertos[g] = {};
    $$(`.plegable.abierto`).forEach(o => {
      if (o === card) return;
      const oc = o.querySelector("[data-plegar]");
      if (!oc || oc.closest(".plegable") !== o || oc.dataset.plegar.split("|")[0] !== g) return;
      o.classList.remove("abierto"); oc.setAttribute("aria-expanded", "false");
    });
  }
  S.abiertos[g][k] = abrir;
  card.classList.toggle("abierto", abrir);
  c.setAttribute("aria-expanded", abrir ? "true" : "false");
  // Que la tarjeta tocada no se mueva de su sitio en la pantalla aunque se cierren otras arriba
  const dy = c.getBoundingClientRect().top - y0;
  if (Math.abs(dy) > 1) window.scrollBy(0, dy);
});
const LEYENDA = `<div class="leyenda"><span class="v-venc">Vencido</span><span class="v-rojo">0–29 días</span><span class="v-amar">30–45 días</span><span class="v-vcla">46–90 días</span><span class="v-vosc">&gt; 90 días</span></div>`;

// Con el teclado del celular abierto, la ventana sube y se ajusta para que Guardar y Cancelar sigan a la vista
if (window.visualViewport) {
  const vv = window.visualViewport;
  const aj = () => {
    const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    document.documentElement.style.setProperty("--kb", kb + "px");
    document.documentElement.style.setProperty("--vvh", Math.round(vv.height) + "px");
  };
  vv.addEventListener("resize", aj); vv.addEventListener("scroll", aj); aj();
}
document.addEventListener("focusin", e => {
  const t = e.target;
  if (t && t.closest && t.closest(".modal-card") && /INPUT|TEXTAREA|SELECT/.test(t.tagName) && t.type !== "checkbox" && window.innerWidth < 700)
    setTimeout(() => { try { t.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (x) {} }, 280);
});

// Modo de colores: oscuro (el de siempre) o claro neutro. Se recuerda en este equipo.
function ponerTema(t) {
  const claro = t === "claro";
  document.documentElement.dataset.tema = claro ? "claro" : "oscuro";
  const b = document.getElementById("temaBtn"); if (b) { b.textContent = claro ? "🌙" : "☀️"; b.title = claro ? "Cambiar a colores oscuros" : "Cambiar a colores claros"; }
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = claro ? "#ffffff" : "#04070f";
}
try { ponerTema(localStorage.getItem("frecs_tema") || "oscuro"); } catch (e) { ponerTema("oscuro"); }
document.addEventListener("click", e => {
  if (!e.target.closest("#temaBtn, [data-tema-tog]")) return;
  e.preventDefault();
  const t = document.documentElement.dataset.tema === "claro" ? "oscuro" : "claro";
  ponerTema(t); try { localStorage.setItem("frecs_tema", t); } catch (x) {}
});

let modalBusy = false, modalOnClose = null;
let modalDesde = 0;
function abrirModal(html, opts) {
  opts = opts || {};
  modalBusy = false;
  modalDesde = Date.now();
  const card = $("#modalCard");
  card.className = "modal-card" + (opts.wide ? " wide" : "") + (opts.clase ? " " + opts.clase : "");
  card.innerHTML = html;
  $("#modal").classList.remove("hidden");
  document.documentElement.classList.add("con-modal");
  card.scrollTop = 0;
  modalOnClose = opts.onClose || null;
  const f = card.querySelector("[autofocus]") || card.querySelector("input:not([type=checkbox]):not([type=hidden]), textarea");
  if (f && window.innerWidth > 699) setTimeout(() => f.focus(), 30);
  card.querySelectorAll("[data-x]").forEach(b => b.onclick = () => cerrarModal());
  return card;
}
function cerrarModal(forzar) {
  if (modalBusy && !forzar) return;
  modalBusy = false;
  $("#modal").classList.add("hidden");
  document.documentElement.classList.remove("con-modal");
  $("#modalCard").innerHTML = "";
  const cb = modalOnClose; modalOnClose = null;
  if (cb) cb();
}
const modalAbierto = () => !$("#modal").classList.contains("hidden");
// Un toque que llega justo después de abrir la ventana es el mismo toque repetido: se ignora
// (solo en los botones de confirmar: los demás campos de la ventana responden de inmediato)
$("#modal").addEventListener("click", e => { if (Date.now() - modalDesde < 450 && e.target.closest(".modal-actions .btn:not([data-x])")) { e.stopPropagation(); e.preventDefault(); } }, true);
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") cerrarModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && modalAbierto()) cerrarModal(); });
function ocupado(btn, on, txt) {
  modalBusy = on;
  if (!btn) return;
  if (on) { btn.dataset.txt = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin" style="width:16px;height:16px;border-width:2px"></span> ${h(txt || "Guardando…")}`; }
  else { btn.disabled = false; if (btn.dataset.txt) btn.innerHTML = btn.dataset.txt; }
}
function confirmar(titulo, texto, okTxt, peligro) {
  return new Promise(res => {
    const c = abrirModal(`<h3>${h(titulo)}</h3><p class="muted">${texto}</p>
      <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn ${peligro ? "danger" : "primary"}" id="cfOk">${h(okTxt || "Aceptar")}</button></div>`, { onClose: () => res(false) });
    $("#cfOk", c).onclick = () => { modalOnClose = null; cerrarModal(true); res(true); };
  });
}

// ---------- autocompletar productos (hoja Sku: Producto, Contexto y SKU) ----------
// Muestra la lista mientras se escribe; se puede escoger antes de terminar.
function similitud(a, b) {
  const bi = s => { s = " " + norm(s) + " "; const r = []; for (let k = 0; k < s.length - 1; k++) r.push(s.substr(k, 2)); return r; };
  const A = bi(a), B = bi(b); if (!A.length || !B.length) return 0;
  const m = new Map(); B.forEach(x => m.set(x, (m.get(x) || 0) + 1));
  let c = 0; A.forEach(x => { const n = m.get(x); if (n) { c++; m.set(x, n - 1); } });
  return 2 * c / (A.length + B.length);
}
// ¿Dos palabras difieren en una sola letra (cambiada, sobrante, faltante o dos al revés)? "mile" ≈ "miel"
function casiIgual(a, b) {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0; while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}
// Coincidencia de búsqueda: 2 = todas las palabras están tal cual · 1 = alguna con un error de digitación · 0 = no
function coincide(texto, toks) {
  let nivel = 2, pal = null;
  for (const k of toks) {
    if (texto.includes(k)) continue;
    if (k.length < 4 || /^\d+$/.test(k)) return 0; // los números (SKU, 330) deben ir exactos
    pal = pal || texto.split(/[^a-z0-9]+/).filter(x => x);
    if (!pal.some(w => casiIgual(k, w) || (w.length > k.length && casiIgual(k, w.slice(0, k.length))))) return 0;
    nivel = 1;
  }
  return nivel;
}
function buscarCat(q, max) {
  const cat = S.cat || [];
  const toks = norm(q).split(/\s+/).filter(x => x);
  if (!toks.length) return [];
  const exactos = [], parecidos = [];
  cat.forEach(c => { const n = coincide(norm(`${c.sku} ${c.prod} ${c.ctx}`), toks); if (n === 2) exactos.push(c); else if (n === 1) parecidos.push(Object.assign({ aprox: true }, c)); });
  let res = exactos.concat(parecidos);
  if (/^\d+$/.test(q.trim())) res.sort((a, b) => (a.sku.startsWith(q.trim()) ? 0 : 1) - (b.sku.startsWith(q.trim()) ? 0 : 1));
  if (!res.length && q.trim().length >= 3) {
    res = cat.map(c => ({ c: c, s: Math.max(similitud(q, c.prod), similitud(q, c.ctx)) })).filter(x => x.s > 0.35).sort((a, b) => b.s - a.s).map(x => Object.assign({ aprox: true }, x.c));
  }
  return res.slice(0, max || 12);
}
// En el celular el teclado tapa la lista de sugerencias: al empezar a escribir se sube el cuadro
function subirAlEscribir(input) {
  if (window.innerWidth > 1023) return;
  const r = input.getBoundingClientRect();
  if (r.top < window.innerHeight * 0.35) return;
  const modal = input.closest(".modal-card");
  if (modal) { modal.scrollTop += r.top - modal.getBoundingClientRect().top - 12; return; }
  window.scrollTo({ top: window.scrollY + r.top - 90, behavior: "smooth" });
}
function autoSku(input, onPick, opts) {
  opts = opts || {};
  const box = document.createElement("div");
  box.className = "ac-list hidden";
  input.parentNode.appendChild(box);
  input.setAttribute("autocomplete", "off");
  let items = [], sel = -1;
  const pintar = () => {
    const q = input.value.trim();
    items = q ? buscarCat(q, opts.max || 12) : [];
    sel = -1;
    if (!items.length) { box.classList.add("hidden"); return; }
    box.innerHTML = items.map((c, k) => `<div class="ac-item" data-k="${k}">${skuTxt(c.sku, c.prod)}<div class="sub">${h(c.pres || "")}${c.aprox ? " · parecido" : ""}</div></div>`).join("");
    box.classList.remove("hidden");
  };
  // Al escoger de la lista se esconde el teclado del celular
  const elegir = k => { const c = items[k]; if (!c) return; box.classList.add("hidden"); if (opts.limpiar) input.value = ""; else input.value = opts.soloSku ? c.sku : `${c.sku} · ${c.prod}`; input.blur(); onPick(c); };
  input.addEventListener("input", pintar);
  input.addEventListener("input", () => subirAlEscribir(input), { once: true });
  input.addEventListener("focus", () => { if (input.value.trim()) pintar(); });
  input.addEventListener("keydown", e => {
    if (box.classList.contains("hidden")) return;
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); }
    else if (e.key === "Enter" && sel >= 0) { e.preventDefault(); e.stopPropagation(); elegir(sel); return; }
    else if (e.key === "Escape") { box.classList.add("hidden"); return; }
    else return;
    $$(".ac-item", box).forEach((x, k) => x.classList.toggle("on", k === sel));
  });
  box.addEventListener("mousedown", e => { const it = e.target.closest("[data-k]"); if (it) { e.preventDefault(); elegir(+it.dataset.k); } });
  input.addEventListener("blur", () => setTimeout(() => box.classList.add("hidden"), 150));
  return { cerrar: () => box.classList.add("hidden") };
}
// Cuadro de búsqueda con el botón pequeño al final (a la derecha). La ✕ del cuadro limpia también el resultado.
const barraBusqueda = (id, ph, val, btn, etiqueta) => `<div class="buscador">${etiqueta ? `<span class="bq-l">${h(etiqueta)}</span>` : ""}<div class="bq-fila"><input type="search" id="${id}" placeholder="${h(ph || "SKU o nombre del producto…")}" value="${h(val || "")}" autocomplete="off">${btn ? `<button class="btn sm primary bq-btn" id="${id}B" type="button" title="${h(btn)}"><span class="ic">🔎</span><span class="txt">${h(btn)}</span></button>` : ""}</div></div>`;
// Al vaciar el cuadro (✕ o borrando) se avisa para dejar la página en blanco
function alLimpiar(input, fn) {
  const f = () => { if (!input.value.trim()) fn(); };
  input.addEventListener("search", f); input.addEventListener("input", f);
}
const campoAuto = (id, ph, val) => `<label class="field"><span>Producto (nombre o SKU)</span><input type="search" id="${id}" placeholder="${h(ph || "Escribe el nombre o el SKU…")}" value="${h(val || "")}"></label>`;

// ---------- ingreso con nombre + PIN ----------
function mostrarLogin(msg) {
  S.tk = ""; ls.del("tk");
  $("#login").classList.remove("hidden");
  const body = $("#loginBody");
  body.innerHTML = loader("Conectando…");
  api("webPublico").then(p => {
    if (p.setup) {
      body.innerHTML = `<p class="muted small" style="text-align:center">Primera vez: crea la cuenta de <b>administrador</b>. Luego podrás agregar a los demás desde Administración.</p>
        <label class="field"><span>Tu nombre</span><input type="text" id="lgN" maxlength="40" autocomplete="name"></label>
        <label class="field" style="margin-top:10px"><span>PIN (4 a 8 números)</span><input type="password" inputmode="numeric" class="pin" id="lgP" maxlength="8"></label>
        <label class="field" style="margin-top:10px"><span>Repite el PIN</span><input type="password" inputmode="numeric" class="pin" id="lgP2" maxlength="8"></label>
        <div id="lgE"></div><button class="btn primary" id="lgB">Crear administrador</button>`;
      $("#lgB").onclick = async () => {
        const n = $("#lgN").value.trim(), p1 = $("#lgP").value.trim(), p2 = $("#lgP2").value.trim();
        if (p1 !== p2) { $("#lgE").innerHTML = errBox("Los PIN no coinciden."); return; }
        try { const r = await api("webSetup", n, p1); entrar(r); } catch (e) { $("#lgE").innerHTML = errBox(e); }
      };
    } else {
      const ult = ls.get("ultNombre", "");
      body.innerHTML = `${msg ? `<div class="note warn">${h(msg)}</div>` : ""}
        <label class="field"><span>Nombre</span><input type="text" id="lgN" value="${h(ult)}" placeholder="Escribe tu nombre" autocomplete="off" autocapitalize="words" spellcheck="false"></label>
        <div class="lg-sug hidden" id="lgS" role="listbox"></div>
        <label class="field" style="margin-top:10px"><span>PIN</span><input type="password" inputmode="numeric" class="pin" id="lgP" maxlength="8" autocomplete="current-password"></label>
        <div id="lgE" style="margin-top:10px"></div><button class="btn primary" id="lgB">Entrar</button>`;
      // Nombres sugeridos mientras se escribe, separados por rol
      const us = (p.usuarios && p.usuarios.length ? p.usuarios : p.nombres.map(n => ({ n: n, r: "" })));
      const ROL_T = { administrador: "Administradores", validador: "Validadores", lector: "Lectores", verificador: "Verificadores", opm: "OPM", "": "Usuarios" };
      const exacto = v => us.find(u => norm(u.n).trim() === norm(v).trim());
      const pintarSug = () => {
        const q = norm($("#lgN").value).trim(), box = $("#lgS");
        const f = us.filter(u => !q || norm(u.n).split(/\s+/).some(w => w.startsWith(q)) || norm(u.n).includes(q));
        if (!f.length || (f.length === 1 && exacto($("#lgN").value))) { box.classList.add("hidden"); return; }
        const grupos = [];
        f.forEach(u => { let g = grupos.find(x => x.r === u.r); if (!g) grupos.push(g = { r: u.r, l: [] }); g.l.push(u); });
        box.innerHTML = grupos.map(g => `<div class="lg-g"><div class="lg-gt">${h(ROL_T[g.r] || g.r)} <span>${g.l.length}</span></div>${g.l.map(u => `<button type="button" class="lg-op" data-n="${h(u.n)}">${h(u.n)}</button>`).join("")}</div>`).join("");
        box.classList.remove("hidden");
      };
      const lgN = $("#lgN");
      lgN.oninput = pintarSug; lgN.onfocus = pintarSug;
      lgN.onkeydown = e => {
        if (e.key !== "Enter") return;
        const ops = $$("#lgS .lg-op"); if (ops.length) { e.preventDefault(); ops[0].click(); }
      };
      // pointerdown: elegir antes de que el campo pierda el foco
      $("#lgS").addEventListener("pointerdown", e => { const b = e.target.closest(".lg-op"); if (!b) return; e.preventDefault(); lgN.value = b.dataset.n; $("#lgS").classList.add("hidden"); $("#lgP").focus(); });
      $("#lgS").addEventListener("click", e => { const b = e.target.closest(".lg-op"); if (!b) return; lgN.value = b.dataset.n; $("#lgS").classList.add("hidden"); $("#lgP").focus(); });
      lgN.onblur = () => setTimeout(() => $("#lgS").classList.add("hidden"), 150);
      const ir2 = async () => {
        const u = exacto($("#lgN").value), n = u ? u.n : "", p1 = $("#lgP").value.trim();
        if (!$("#lgN").value.trim() || !p1) { $("#lgE").innerHTML = errBox("Escribe tu nombre y tu PIN."); return; }
        if (!u) { $("#lgE").innerHTML = errBox("Ese nombre no está registrado: escoge uno de la lista."); pintarSug(); return; }
        const b = $("#lgB"); b.disabled = true;
        try { const r = await api("webLogin", n, p1); ls.set("ultNombre", n); entrar(r); } catch (e) { $("#lgE").innerHTML = errBox(e); b.disabled = false; $("#lgP").value = ""; }
      };
      $("#lgB").onclick = ir2; $("#lgP").onkeydown = e => { if (e.key === "Enter") ir2(); };
      if (ult) setTimeout(() => $("#lgP").focus(), 50);
    }
  }).catch(e => { body.innerHTML = errBox(e.red ? "Sin conexión. Intenta cuando vuelva la conexión." : e) + `<button class="btn" onclick="mostrarLogin()">Reintentar</button>`; });
}
function entrar(r) {
  S.tk = r.token; ls.set("tk", r.token);
  $("#login").classList.add("hidden");
  arrancar();
}
// ---------- Confirmar con el PIN general (antes de cancelar un turno o una conciliación) ----------
const PIN_CANCELAR = "0000";
function pedirPin(titulo, texto, boton) {
  return new Promise(res => {
    let listo = false;
    const c = abrirModal(`<h3>${titulo}</h3><div class="small">${texto}</div>
      <label class="field" style="margin-top:12px"><span>PIN para confirmar</span><input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" id="ppP" autocomplete="off"></label>
      <div class="err hidden" id="ppE" style="margin-top:10px"></div>
      <div class="modal-actions"><button class="btn" data-x>Volver</button><button class="btn danger" id="ppOk" disabled>${h(boton || "Confirmar")}</button></div>`, { onClose: () => { if (!listo) res(false); } });
    const i = $("#ppP", c), b = $("#ppOk", c);
    i.oninput = () => { i.value = i.value.replace(/\D/g, ""); b.disabled = i.value.length < 4; };
    i.onkeydown = e => { if (e.key === "Enter" && !b.disabled) b.click(); };
    b.onclick = async () => {
      ocupado(b, true, "Revisando…");
      // PIN general para cancelar (no depende de la sesión ni de la conexión)
      if (i.value === PIN_CANCELAR) { listo = true; ocupado(b, false); cerrarModal(true); res(true); }
      else { ocupado(b, false); $("#ppE", c).textContent = "PIN incorrecto."; $("#ppE", c).classList.remove("hidden"); i.value = ""; b.disabled = true; i.focus(); }
    };
    setTimeout(() => i.focus(), 60);
  });
}
// ---------- Cajas o estibas en los cuadros de cantidad ----------
// Desplegable pequeño al lado de la etiqueta. Con «Estibas», lo escrito se convierte a cajas con «Cant x Estibas» de Sku.
const unBtn = cpe => `<span class="un-sel" data-unt="cj" data-cpe="${cpe || 0}"><button type="button" class="un-b" title="${cpe ? `Cajas o estibas (1 estiba = ${cpe} cajas)` : "Sin «Cant x Estibas» en Sku: solo cajas"}"><span class="un-t">Cajas</span><span class="un-f" aria-hidden="true">▾</span></button><span class="un-l hidden" role="listbox"><button type="button" data-u="cj" class="on">Cajas</button><button type="button" data-u="est" ${cpe ? "" : "disabled"}>Estibas${cpe ? ` <small>(${cpe} cj)</small>` : ""}</button></span></span>`;
const unCont = el => el.closest("label, .field, .cz-in") || el.parentNode;
// Cajas que representa lo escrito en un cuadro (vacío = "")
function cajasDe(input) {
  const t = String(input.value || "").replace(/\D/g, ""); if (t === "") return "";
  const u = unCont(input).querySelector(".un-sel");
  return u && u.dataset.unt === "est" ? Number(t) * (Number(u.dataset.cpe) || 0) : Number(t);
}
// Vuelve a «Cajas» (después de guardar lo escrito en estibas)
function unReset(cont) { const u = cont && cont.querySelector(".un-sel"); if (!u) return; u.dataset.unt = "cj"; $(".un-t", u).textContent = "Cajas"; $$("[data-u]", u).forEach(x => x.classList.toggle("on", x.dataset.u === "cj")); u.classList.remove("est"); const eq = cont.querySelector(".un-eq"); if (eq) eq.remove(); }
document.addEventListener("click", e => {
  const abiertos = $$(".un-sel .un-l:not(.hidden)");
  const u = e.target.closest(".un-sel");
  abiertos.forEach(l => { if (!u || l.parentNode !== u) l.classList.add("hidden"); });
  if (!u) return;
  e.preventDefault(); e.stopPropagation();
  const o = e.target.closest("[data-u]");
  if (o) {
    if (o.disabled) return;
    u.dataset.unt = o.dataset.u; $(".un-t", u).textContent = o.dataset.u === "est" ? "Estibas" : "Cajas"; u.classList.toggle("est", o.dataset.u === "est");
    $$("[data-u]", u).forEach(x => x.classList.toggle("on", x === o)); $(".un-l", u).classList.add("hidden");
    const i = unCont(u).querySelector("input");
    if (i) { i.placeholder = o.dataset.u === "est" ? "estibas" : (i.dataset.ph || "—"); i.dispatchEvent(new Event("input", { bubbles: true })); i.focus(); }
    return;
  }
  if (!Number(u.dataset.cpe)) { toast("Este producto no tiene «Cant x Estibas» en la hoja Sku: escribe en cajas.", "warn", 4000); return; }
  $(".un-l", u).classList.toggle("hidden");
}, true);
// Debajo del cuadro: «= 480 cj» cuando se escribe en estibas
document.addEventListener("input", e => {
  const i = e.target; if (!(i instanceof HTMLInputElement)) return;
  const cont = unCont(i); const u = cont && cont.querySelector(".un-sel"); if (!u) return;
  let p = cont.querySelector(".un-eq"); const v = cajasDe(i);
  if (u.dataset.unt === "est" && v !== "") { if (!p) { p = document.createElement("small"); p.className = "un-eq"; cont.appendChild(p); } p.textContent = `= ${fm(v)} cj`; }
  else if (p) p.remove();
});
function pintarUsuario() { $("#userChip").textContent = "👤 " + (S.usuario ? S.usuario.nombre : "…"); pintarCanal(); }
$("#canalChip").onclick = () => { if (S.usuario) modalCanal(); };
$("#userChip").onclick = () => {
  if (!S.usuario) return;
  const u = S.usuario;
  const c = abrirModal(`<h3>👤 ${h(u.nombre)}</h3>
    <div class="ficha"><span>Rol</span><b>${h(u.rol)}</b>${u.correo ? `<span>Correo</span><b>${h(u.correo)}</b>` : `<span>Correo</span><b class="muted">No disponible (cuenta Gmail)</b>`}</div>
    ${S.sync ? `<div class="ficha sync-f"><span>🔄 Última sincronización con el WMS</span><b>${h(S.sync.bot)}</b><span>📦 Último movimiento en el WMS</span><b>${h(S.sync.wms)}</b></div>` : ""}
    ${esVerif() ? "" : `<label class="sw-fila"><span><b>Sugerencias del WMS</b><br><span class="small muted">En validaciones: cuántas cajas tiene el WMS y el aviso cuando tiene menos</span></span><span class="sw"><input type="checkbox" id="pfW" ${verWms() ? "checked" : ""}><i></i></span></label>`}
    <details class="card" style="margin-top:14px"><summary>Cambiar mi PIN</summary>
      <label class="field"><span>PIN actual</span><input type="password" inputmode="numeric" id="cpA" maxlength="8"></label>
      <label class="field"><span>PIN nuevo (4 a 8 números)</span><input type="password" inputmode="numeric" id="cpN" maxlength="8"></label>
      <button class="btn" id="cpB" style="margin-top:10px">Guardar PIN</button></details>
    <div class="modal-actions"><button class="btn danger" id="lgOut">Cerrar sesión</button><button class="btn" data-x>Cerrar</button></div>`);
  const sw = $("#pfW", c);
  if (sw) sw.onchange = async () => {
    const v = sw.checked; sw.disabled = true;
    try { S.usuario.prefs = await api("webPref", "wmsSug", v); ls.setJ("usuario", S.usuario); toast(v ? "Verás las sugerencias del WMS" : "Sugerencias del WMS ocultas", "ok", 2500); if (S.vista === "validacion") repintar(); }
    catch (e) { sw.checked = !v; toast(e.message, "bad", 5000); }
    sw.disabled = false;
  };
  $("#cpB", c).onclick = async () => { try { await api("webCambiarPin", $("#cpA", c).value.trim(), $("#cpN", c).value.trim()); toast("PIN actualizado", "ok"); cerrarModal(true); } catch (e) { toast(e.message, "bad", 6000); } };
  $("#lgOut", c).onclick = async () => { try { await api("webLogout"); } catch (e) {} cerrarModal(true); S.usuario = null; pintarCanal(); mostrarLogin(); };
};

// ---------- navegación ----------
function pintarNav() {
  // Un ítem puede tener su propio rol (más bajo que el de su grupo): el grupo sale si alguno de sus ítems se puede ver.
  // El verificador solo ve sus secciones (VERIF_VISTAS).
  const ver = (g, i) => vistaPermitida(i.id);
  // Secciones desplegables: la de la pantalla actual siempre abierta; las demás como las dejó la persona
  const ab = ls.getJ("navAb", {}), nPend = repPend().length, nPocos = typeof pocosAlerta === "function" ? pocosAlerta().length : 0;
  const cnt = (n, t) => n ? `<span class="nav-n" title="${t || "Reportes pendientes"}">${n}</span>` : "";
  const cntDe = id => id === "repgen" ? cnt(nPend) : (id === "pocos" || id === "pocosvig") ? cnt(nPocos, "Productos vigilados bajo su mínimo") : "";
  const link = i => `<a href="#" data-v="${i.id}" class="${S.vista === i.id ? "on" : ""}"><span class="ic">${i.ic}</span><span class="nav-t">${h(i.t)}</span>${cntDe(i.id)}</a>`;
  const grupo = (g, items) => {
    const abierto = esVerif() || items.some(i => i.id === S.vista) || ab[g.g] === true;
    return `<div class="nav-g ${g.cls || ""} ${abierto ? "abierto" : ""}"><button type="button" class="nav-gt" data-navg="${h(g.g)}" aria-expanded="${abierto}"><span>${h(g.g)}</span>${items.some(i => i.id === "repgen") ? cnt(nPend) : items.some(i => i.id === "pocos") ? cnt(nPocos, "Productos vigilados bajo su mínimo") : ""}<span class="nav-fl" aria-hidden="true">▾</span></button><div class="nav-gi">${items.map(link).join("")}</div></div>`;
  };
  $("#nav").innerHTML = NAV.map(g => [g, g.items.filter(i => ver(g, i))]).filter(([g, it]) => it.length).map(([g, it]) => g.g ? grupo(g, it) : it.map(link).join("")).join("") +
    grupo({ g: "Pantalla" }, []).replace(`<div class="nav-gi"></div>`, `<div class="nav-gi"><a href="#" data-tema-tog><span class="ic">🎨</span>Cambiar colores (oscuro / claro)</a></div>`);
  pintarBarraAbajo();
  $$("#bottombar button").forEach(b => b.classList.toggle("on", b.dataset.v === S.vista));
}
const BARRA_ABAJO = [["inicio", "🏠", "Inicio"], ["validacion", "📝", "Validación"], ["entrega", "📋", "Entrega"], ["stock", "📡", "Stock"]];
const BARRA_VERIF = [["repvacio", "⬜", "Vacío"], ["repconflicto", "⚠️", "Conflicto"], ["repgen", "📣", "Reportes"], ["stock", "📡", "Stock"]];
const BARRA_OPM = [["stock", "📡", "Stock"], ["producto", "🔍", "Producto"], ["modulo", "📍", "Módulo"], ["repvacio", "⬜", "Vacío"]];
function pintarBarraAbajo() {
  const b = $("#bottombar"); if (!b) return;
  const items = (S.usuario && S.usuario.rol === "opm" ? BARRA_OPM : esVerif() ? BARRA_VERIF : BARRA_ABAJO).filter(x => vistaPermitida(x[0])), firma = items.map(x => x[0]).join(",");
  if (b.dataset.f === firma) return;
  b.dataset.f = firma;
  b.style.gridTemplateColumns = `repeat(${Math.max(items.length, 1)}, 1fr)`;
  b.innerHTML = items.map(([v, ic, t]) => `<button data-v="${v}"><span class="ic">${ic}</span>${t}</button>`).join("");
}
let menuDesde = 0;
const menuAbierto = () => $("#nav").classList.contains("open");
function abrirMenu(on) { $("#nav").classList.toggle("open", on); $("#scrim").classList.toggle("on", on); if (on) menuDesde = Date.now(); }
$("#menuBtn").onclick = e => { e.stopPropagation(); abrirMenu(!menuAbierto()); };
$("#scrim").onclick = () => abrirMenu(false);
// En el celular, el mismo toque que abre el menú no puede escoger una sección
$("#nav").addEventListener("click", e => {
  const g = e.target.closest("[data-navg]");
  if (g) {
    const box = g.parentElement, abrir = !box.classList.contains("abierto");
    box.classList.toggle("abierto", abrir); g.setAttribute("aria-expanded", abrir);
    const ab = ls.getJ("navAb", {}); ab[g.dataset.navg] = abrir; ls.setJ("navAb", ab);
    return;
  }
  const a = e.target.closest("a[data-v]"); if (!a) return; e.preventDefault(); if (window.innerWidth < 1024 && Date.now() - menuDesde < 400) return; ir(a.dataset.v); });
$("#bottombar").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; ir(b.dataset.v); });
$("#backBtn").onclick = () => atras();
$("#refBtn").onclick = e => refrescarTodo(e.currentTarget);
$("#nuevoChip").onclick = () => aplicarPendiente();

// Atrás: cierra la ventana abierta → cierra el menú → vuelve a la sección anterior → Inicio.
// En Inicio no sale de la página.
S.pila = [];
function atras() {
  if (modalAbierto()) { cerrarModal(); return; }
  if (menuAbierto()) { abrirMenu(false); return; }
  const prev = S.pila.pop();
  if (prev) ir(prev.vista, prev.params, true);
  else if (S.vista !== primeraVista()) ir(primeraVista(), {}, true);
}
// Botón atrás del celular: se deja una entrada "de reserva" en el historial del navegador;
// al pulsar atrás el navegador la consume, la página hace atras() y la vuelve a poner con el
// siguiente toque (Chrome no deja ponerla sin un toque de por medio).
const HIST_GS = window.google && google.script && google.script.history;
let atrasArmado = false;
function armarAtras() {
  if (atrasArmado) return;
  try { if (HIST_GS) HIST_GS.push({ f: Date.now() }, {}, ""); else history.pushState({ f: Date.now() }, ""); atrasArmado = true; } catch (e) {}
}
function alAtrasCelular() { atrasArmado = false; atras(); }
try { if (HIST_GS) HIST_GS.setChangeHandler(alAtrasCelular); else window.addEventListener("popstate", alAtrasCelular); } catch (e) {}
["pointerdown", "keydown"].forEach(ev => window.addEventListener(ev, armarAtras, { capture: true }));

let renderId = 0;
function ir(vista, params, esAtras) {
  if (!VISTAS[vista]) vista = "inicio";
  if (TITULOS[vista] && !vistaPermitida(vista)) vista = primeraVista();
  if (!esAtras && S.vista && (S.vista !== vista || !mismo(S.params, params || {}))) { S.pila.push({ vista: S.vista, params: S.params }); if (S.pila.length > 30) S.pila.shift(); }
  if (vista === "inicio" && !esAtras) S.pila = [];
  S.vista = vista; S.params = params || {};
  S.vistaDesde = Date.now(); S.pendRepintar = null; $("#nuevoChip").classList.add("hidden");
  $("#backBtn").classList.toggle("hidden", vista === "inicio" && !S.pila.length);
  ls.set("vista", vista);
  pintarNav(); abrirMenu(false);
  window.scrollTo(0, 0);
  const el = $("#view");
  el.onclick = el.oninput = el.onchange = el.onkeydown = null;
  el.classList.remove("ver-ayuda");
  const id = ++renderId;
  el.innerHTML = loader();
  Promise.resolve(VISTAS[vista](el, S.params, () => id === renderId)).catch(e => { if (id === renderId) el.innerHTML = errBox(e.red ? "Sin conexión: esta sección necesita conexión." : e); });
}
function repintar() { const y = window.scrollY; ir(S.vista, S.params); setTimeout(() => window.scrollTo(0, y), 60); }

// ---------- fechas: se escriben a mano (dd/mm/aaaa) y el calendario se abre solo con el ícono ----------
// El campo original (type=date o datetime-local) queda escondido y sigue teniendo el valor en formato ISO,
// así el resto del código no cambia.
function mejorarFechas(raiz) {
  $$('input[type="date"]:not([data-fm]), input[type="datetime-local"]:not([data-fm])', raiz).forEach(inp => {
    inp.dataset.fm = "1";
    const conHora = inp.type === "datetime-local";
    const txt = document.createElement("input");
    txt.type = "text"; txt.inputMode = "numeric"; txt.autocomplete = "off"; txt.className = "fecha-txt";
    txt.placeholder = conHora ? "dd/mm/aaaa hh:mm" : "dd/mm/aaaa";
    const aTxt = v => { const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v || ""); return m ? `${m[3]}/${m[2]}/${m[1]}${conHora && m[4] ? ` ${m[4]}:${m[5]}` : ""}` : ""; };
    const aIso = t => {
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(t.trim()); if (!m) return null;
      const y = m[3].length === 2 ? "20" + m[3] : m[3], mo = m[2].padStart(2, "0"), d = m[1].padStart(2, "0");
      const f = new Date(+y, +mo - 1, +d); if (f.getMonth() !== +mo - 1 || f.getDate() !== +d) return null;
      if (!conHora) return `${y}-${mo}-${d}`;
      const hh = (m[4] || "00").padStart(2, "0"), mi = m[5] || "00"; if (+hh > 23 || +mi > 59) return null;
      return `${y}-${mo}-${d}T${hh}:${mi}`;
    };
    txt.value = aTxt(inp.value);
    const caja = document.createElement("span"); caja.className = "fecha-caja";
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "fecha-ico"; btn.textContent = "📅"; btn.title = "Abrir calendario"; btn.setAttribute("aria-label", "Abrir calendario");
    inp.parentNode.insertBefore(caja, inp); caja.appendChild(txt); caja.appendChild(btn); caja.appendChild(inp);
    inp.classList.add("fecha-oculta"); inp.tabIndex = -1;
    const avisar = () => { inp.dispatchEvent(new Event("input", { bubbles: true })); inp.dispatchEvent(new Event("change", { bubbles: true })); };
    // Escribir: las barras se ponen solas
    txt.addEventListener("input", e => {
      if (e.inputType && e.inputType.indexOf("delete") === 0) return;
      let d = txt.value.replace(/[^\d]/g, "").slice(0, conHora ? 12 : 8), o = "";
      for (let k = 0; k < d.length; k++) { if (k === 2 || k === 4) o += "/"; if (conHora && k === 8) o += " "; if (conHora && k === 10) o += ":"; o += d[k]; }
      txt.value = o;
      const iso = aIso(o); if (iso) { inp.value = iso; avisar(); }
      txt.classList.toggle("mal", o.length >= 10 && !iso);
    });
    txt.addEventListener("blur", () => { const v = txt.value.trim(); if (!v) { if (inp.value) { inp.value = ""; avisar(); } txt.classList.remove("mal"); return; } const iso = aIso(v); if (iso) { txt.value = aTxt(iso); txt.classList.remove("mal"); } else txt.classList.add("mal"); });
    txt.addEventListener("keydown", e => { if (e.key === "Enter") { const iso = aIso(txt.value); if (iso) { inp.value = iso; avisar(); } } });
    btn.addEventListener("click", () => { try { inp.showPicker(); } catch (e) { inp.focus(); inp.click(); } });
    inp.addEventListener("change", () => { const t = aTxt(inp.value); if (t && document.activeElement !== txt) txt.value = t; });
  });
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) mejorarFechas(n.matches && n.matches("input") ? n.parentNode : n); }))).observe(document.body, { childList: true, subtree: true });

// ---------- ↻ refrescar: vuelve a traer datos y reglas (no hay «deslizar para recargar») ----------
async function refrescarTodo(btn) {
  if (btn.disabled) return;
  btn.disabled = true; btn.classList.add("girando");
  try { S.val = null; S.ent = null; S.conc = null; await arrancar(true, true); }
  catch (e) { toast(e.red ? "Sin conexión: no se pudo actualizar." : e.message, "bad", 5000); }
  finally { btn.disabled = false; btn.classList.remove("girando"); }
}

// ---------- datos base (con copia en el equipo para trabajar sin conexión) ----------
function pintarSync() {
  const s = S.sync;
  $("#syncChip").innerHTML = s ? `Base: <b>${h(s.bot)}</b><br>Últ. mov. WMS: <b>${h(s.wms)}</b>` : "";
}
function guardarInv(d) {
  S.inv = d.filas; S.ocup = d.ocupacion || {}; S.sync = d.sync; pintarSync(); pintarRecordatorio();
  if (Array.isArray(d.fotos)) S.fotos = d.fotos;
  ls.setJ("inv", { filas: d.filas, ocupacion: d.ocupacion, sync: d.sync, fotos: S.fotos || [], guardado: ahoraTxt() });
}
// Fotos del WMS (la que tomaron al marcar la prioridad), por producto y módulo: la más nueva
function fotoDe(sku, m) { const f = (S.fotos || []).find(x => x[0] === String(sku) && x[1] === String(m)); return f && f[2] && f[2].length ? f[2] : null; }
const botonFoto = (sku, m) => fotoDe(sku, m) ? `<button type="button" class="foto-btn" data-foto="${h(sku)}|${h(m)}" title="Ver la foto del WMS" aria-label="Ver la foto de ${h(sku)} en ${h(m)}">📷</button>` : "";
function verFoto(sku, m) {
  const urls = fotoDe(sku, m); if (!urls) return;
  const i = (S.inv || []).find(x => x.s === sku && x.m === m);
  const c = abrirModal(`<div class="foto-modal"><h3>📷 ${skuTxt(sku, i ? i.p : "")}</h3><p class="small muted" style="margin-top:0">Módulo ${modChip(m)}${i ? ` · vence <b>${h(i.vf)}</b>` : ""} · foto del WMS</p>
    <div class="foto-g">${urls.map((u, k) => `<a href="${h(u)}" target="_blank" rel="noopener noreferrer"><img src="${h(u)}" alt="Foto ${k + 1} de ${h(sku)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('a').classList.add('foto-mal')"></a>`).join("")}</div>
    <p class="small muted">Toca la foto para verla en grande.</p><div class="modal-actions"><button class="btn primary" data-x>Cerrar</button></div></div>`, { wide: true });
  return c;
}
document.addEventListener("click", e => { const b = e.target.closest("[data-foto]"); if (!b) return; e.preventDefault(); e.stopPropagation(); const [s, m] = b.dataset.foto.split("|"); verFoto(s, m); }, true);
async function cargarInv(forzar) {
  if (S.inv && !forzar) return S.inv;
  if (S.cargandoInv && !forzar) return S.cargandoInv;
  S.cargandoInv = api("webInventario").then(d => { guardarInv(d); S.cargandoInv = null; return S.inv; })
    .catch(e => {
      S.cargandoInv = null;
      const c = ls.getJ("inv", null);
      if (e.red && c) { S.inv = c.filas; S.ocup = c.ocupacion || {}; S.sync = c.sync; S.fotos = c.fotos || []; pintarSync(); toast(`Sin conexión: inventario guardado del ${fechaCorta(c.guardado)}`, "warn", 5000); return S.inv; }
      throw e;
    });
  return S.cargandoInv;
}
async function cargarCat(forzar) {
  if (S.cat && !forzar) return S.cat;
  try { S.cat = await api("webCatalogo"); ls.setJ("cat", S.cat); }
  catch (e) { const c = ls.getJ("cat", null); if (c) S.cat = c; else throw e; }
  return S.cat;
}

$("#syncBtn").onclick = async () => {
  const b = $("#syncBtn"); b.disabled = true; const t = b.innerHTML; b.innerHTML = `<span class="spin" style="width:16px;height:16px;border-width:2px"></span>`;
  const antes = { filas: (S.inv || []).filter(i => i.fis).length, mods: new Set((S.inv || []).filter(i => i.fis).map(i => i.m)).size };
  try {
    const r = await api("webSincronizar");
    guardarInv(r.inv); repintar(); avisoSync(r, antes);
  } catch (e) {
    if (/forzar/.test(e.message) && puede("validador") && await confirmar("Bajada grande de inventario", h(e.message) + "<br><br>¿La bajada es real y quieres reemplazar la base de todas formas?", "Sí, reemplazar")) {
      try { const r = await api("webSincronizar", true); guardarInv(r.inv); repintar(); avisoSync(r, antes); } catch (e2) { avisoSync(null, antes, e2); }
    } else avisoSync(null, antes, e);
  } finally { b.disabled = false; b.innerHTML = t; pintarRecordatorio(); }
};

// Resultado de la sincronización en una ventana (con Aceptar), con datos para saber si se puede confiar
function avisoSync(r, antes, err) {
  if (err) {
    const c = abrirModal(`<div class="sync-res mal"><div class="sync-ic">❌</div><h3>No se pudo actualizar</h3>
      <p>${h(err.message || String(err))}</p><p class="small muted">La información que ves sigue siendo la de la sincronización anterior${S.sync && S.sync.bot ? ` (${h(S.sync.bot)})` : ""}. No confíes en ella para lo que haya cambiado desde entonces.</p>
      <div class="modal-actions"><button class="btn primary" data-x>Aceptar</button></div></div>`);
    return c;
  }
  const filas = (S.inv || []).filter(i => i.fis).length, mods = new Set((S.inv || []).filter(i => i.fis).map(i => i.m)).size;
  const dif = antes && antes.filas ? (filas - antes.filas) / antes.filas : 0;
  const alerta = antes && antes.filas && dif < -0.15 ? `Trajo <b>${Math.round(-dif * 100)} % menos</b> ubicaciones que la vez anterior (${fm(antes.filas)} → ${fm(filas)}). Puede que el WMS respondiera a medias: revisa antes de confiar.` : "";
  const mov = S.sync && S.sync.wms ? S.sync.wms : "N/A";
  const movViejo = /🔴/.test(mov);
  // Productos vigilados que quedaron bajo su mínimo (alerta de pocos)
  const pocos = typeof pocosAlerta === "function" ? pocosAlerta() : [];
  if (S.usuario) pintarNav();
  abrirModal(`<div class="sync-res ${alerta ? "rev" : "ok"}"><div class="sync-ic">${alerta ? "⚠️" : "✅"}</div><h3>${alerta ? "Se actualizó, pero revisa" : "Base actualizada"}</h3>
    <div class="ficha"><span>Ubicaciones con producto</span><b>${fm(filas)}${antes && antes.filas ? ` <span class="small muted">(antes ${fm(antes.filas)})</span>` : ""}</b>
      <span>Módulos con producto</span><b>${fm(mods)}${antes && antes.mods ? ` <span class="small muted">(antes ${fm(antes.mods)})</span>` : ""}</b>
      <span>Último movimiento en el WMS</span><b>${h(mov)}</b></div>
    ${alerta ? `<div class="note warn" style="margin-top:12px">${alerta}</div>` : ""}
    ${movViejo ? `<div class="note warn" style="margin-top:12px">El último movimiento del WMS tiene más de 24 h: puede que nadie haya actualizado o que el WMS no esté al día.</div>` : ""}
    ${r && r.fotos && r.fotos.conFoto ? `<div class="note" style="margin-top:12px">📷 ${r.fotos.conFoto} foto${r.fotos.conFoto > 1 ? "s" : ""} nueva${r.fotos.conFoto > 1 ? "s" : ""} de productos con prioridad.</div>` : ""}
    ${pocos.length ? `<div class="note warn sync-pocos" style="margin-top:12px">🔔 <b>Quedan pocos</b> (${pocos.length}): ${pocos.slice(0, 5).map(x => `<span class="sku">${h(x.sku)}</span> ${h(x.prod)} <b>${x.agotado ? "agotado" : `≈ ${fm(x.eq)} de ${fm(x.min)} est.`}</b>`).join(" · ")}${pocos.length > 5 ? ` · y ${pocos.length - 5} más` : ""}</div>` : ""}
    <div class="modal-actions"><button class="btn primary" data-x>Aceptar</button></div></div>`);
}
// Recordatorio: si la última sincronización tiene más de 3 horas, una franja arriba para sincronizar
const SYNC_RECORDAR_MIN = 180;
function pintarRecordatorio() {
  let b = $("#syncRec");
  const ts = S.sync && S.sync.ts, min = ts ? Math.floor((Date.now() - ts) / 60000) : null;
  const sb = $("#syncBtn"), visible = !!sb && getComputedStyle(sb).display !== "none";
  const mostrar = !!S.usuario && visible && !$("#login:not(.hidden)") && (min === null || min >= SYNC_RECORDAR_MIN);
  if (!mostrar) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement("button"); b.id = "syncRec"; b.type = "button"; b.className = "sync-rec"; b.onclick = () => $("#syncBtn").click(); $("main").prepend(b); }
  const hh = min === null ? "" : `${Math.floor(min / 60)} h ${min % 60} min`;
  b.innerHTML = `⏰ ${min === null ? "Todavía no se ha sincronizado" : `La última sincronización fue hace <b>${hh}</b>`} · <u>Sincronizar ahora</u>`;
}
setInterval(pintarRecordatorio, 60000);

// ---------- PDFs ----------
// Íconos de los botones de PDF, WhatsApp y Telegram (WhatsApp y Telegram: las imágenes que mandó el usuario, en 64 px)
const ICO = {
  pdf: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 2.5h7.5l4.5 4.5v13a1.5 1.5 0 0 1-1.5 1.5h-10.5a1.5 1.5 0 0 1-1.5-1.5v-16a1.5 1.5 0 0 1 1.5-1.5z" fill="#fff" stroke="#d32f2f" stroke-width="1.5"/><path d="M14 2.5v4.5h4.5" fill="none" stroke="#d32f2f" stroke-width="1.5"/><rect x="2.5" y="11.5" width="15" height="7" rx="1.6" fill="#d32f2f"/><text x="10" y="17" text-anchor="middle" font-size="5.4" font-weight="700" fill="#fff" font-family="Arial,Helvetica,sans-serif">PDF</text></svg>`,
  wa: `<img class="ico" src="data:image/webp;base64,UklGRmoIAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSD0BAAABkLJtm7JF9zPzRdwzP8ndfwNNKrQPsjtEyHS2um9y900z7/Pc6zJP3yMiJgA/jUBj/9a192oFfrl7OtcD1PDbEW1LD1ny8/VeiPxKAkYfk1aplWGVkp8WgPAzCaiT2ViyZfK8CeEHiThgVpZuiVeaJACIWGOix8SLWhREDDHRZ+I2IqT1pakTJs4hYpmZXlXfdUnDI1M3zFzBAJV+zZ637FnliMqxm1RPlR19omvlHfNFfqZ3c/cfgF+82R2aJ+PHY6s8KW+OUz1Vttvy3MyRsh+rzH7UHjVI93tVN5lLiJhn8qL2ojUgYpfJSeIQIiTWLphcJNYRAQRpumSy4jRzH1EAIKDxjMxWlGWyjiD4aQAWPpFaWRmmlZGPRhAEvxRB7/ozlvxgsQ0Rv10DumdO7n62AvX91Y2+BiDipwBWUDggBgcAADAhAJ0BKkAAQAA+MRSJQyIhIRQMBaggAwS2AFqQoKrfGz5h+Hf5AfKLS/6jt9xkvTv3+/H/bz73fVN+Yv7H7gH6u/6T7M+4n5gP1u/xv+M98r0AegB/K/9F1gH65ewB+yvpWftr8Hn7X/tV7O3/avOn8J0OXlv2tzjf2Y/EflRyP+9HxV9UX+I3mMAH1T/y35X8xHek/Z3jU6AH5Z89n/T8tHzN/2/cG/lX9Q/2f91/cf9//qA9jP7c+yJ+sxlPJuY9yUaH/kT7tT+szSV0jv/QVF0pWx873qSElB4fL1t6IucL9gD8hXL86M37nwpV8d1iqW4v+o/UgVJwLyULqZ1hvJxwpS2oc1jlzSTgqbTuNdgA/v/qGjp1LLwdNyM8zIcnIdn+uO4RvHkuTt/NbehRaeKnn3bIou+OVYlpcs/l55YnTLoy9nUAnUPCOHpEBB6ZsN5BxNPHicy005wA5GGPxs+TC59dZbU/QHIXEcvPjrPsxZ1QoFrH2+oKodrgHwr9P3D66QH+H/6rnvQ42wWHf4DaB2ln2olg7mIguKS786jXOVHk2rdiaY7Hu8BobzXS2wDfIRjSmj4CFaad7erUbMKW4QpB9FwQEiO03L4m2eXrP3IHoUpSE79H/nvOpHUwaPiRLLtNWPWdquc4F/SanwfG7c5M024SWOuO4lCiXyPFhiyajkDaIPMbmqIMvyyk73zEBctUsIKW3/8A9P73p6JHsW41AeTqekRUly6jCCUeaKwsfQEhv+ZKDJNsMZzyN8rdaYQeBzf5bDUwx4mECkA+ePil3H69Xz8FEM9ugz7gNXPS7OAoHTJj4woo8TZ0Z2IQ8cUTks34WPhvyqy308+6u4RodXXdwY+T9+djPSZ79evwYFI15ls2H/2fvnzs04Vs6gCjuzq1iw7aC7PJdm8EpHjEsrexR9ATEZ/PXgDuhPVU7aIi0cnERY0dHz39TWMJ0hBd3Pw9AKvFB91CnZc3vsceXFWOn2rwc2Az/cI3YTCRP9GyBUDhpyrv7SOplNND6x5OUJbzXMjIJTN351U27VsgvQFPkS27tmjKGytdT/E7zywQk0/9hfxdXx4Q6HZq+1JQz/2P0aLvqR9hcYxcxe7lS2tnkYhW/+k5SHNZn2UXrn5Z9SuzGR8rEz+SqyTV2h9L+4EVzQqZ+qVxaTiLkhmcamFIDg7+YacWK4TXN3ihS4iFvoKoP/0SMZV2XKqTzN8omh+LyJrVUPJt/7GOi4tgA/5pogMDiUFE6X9gT6MnZiTTcP5XCUksZIocWJHtmxyrfTI8qf0tDOpk9vi/rb+/QnHPr+KRbaLeFMHwaJRbz1uMH56eTMNU+fMZhEL/pvfhdBex1YfFrOONKU//dLsbgHj/BebljXZW5dvj4TSWU9moo1nwxDNOW0+mhXcrAOA9yi7Z2wgyzBbfeDuPy8zojH+nA9Ji9fxqJ22761bdnn1qkckZs5A5jspvopkWFkmtQZ0/5Vu9OIi8celYjC4pBm/59plMrFzxmVHPT36crZ2qYwf2A/asD0fzPvNtFvn1/vGwvcach/pffJIB1HZfFgDIdp+d/66FRyxaepIESHgpTTzPNClm1ZwHQLIJTv362mrtP0lPq6wPb7S28w0VFs3J00Fc/T0Nxhrb2x6r4jPiS8M8A9OMGOJnkN86eUk1uU3s5wYt8JerYY51GQem9jEb/Ruq4PyLZi1Xf6Xr+23OX87leP/iViEb+/EGglil+uYWviitXKQghcmGv1FQD08PpKtjoYizp2FzEljoe/c/EQJf/9b7o75oWGLpJWS9bD3NBLoaN8Xiu7vUsmbIaXvw1Hm1wLf//P8la7p71UX6ZAkTJrJOTepRfKdY54hgo+x6dINffzE2D0ekNpqOXz/WWKDWC+gZSPUjX388WxnzZE+2HqyVtgi4EkzVD8TJsagXGjvEaTV7pZsEBek22CqT5txxZfA1QEL5KaqpXHe33hQ+iKOxC6+QKgpx8Q+HZqIcb+JsodX9yZapcIQ6cZFNSU4V7/BWW/5uOVxQC98brXeL1d0wWfqlRzjNBYEG3zeJR3C6n8mf6NodvLtv0jWtKqCHwjONXqklrv75BXMZlA6ifbJfVszPlTWCcoEaz5Vfch/NfGnT02oSxp0QWaiaGKil21F7zG1afCqb+mEGceo1Ma2QzF+Z9h/J8BFF4ST3YaSY6Znao4zmmWaD4ABfSe15+jVx2O+mSoDx8ZE1u5TskCjCBEDraPB5LdQgs6ggFZT/9JotWJs/nQhYr/LulTiFV7eMr5b+k+kLMaFu6zm1A/q57fGsV9Rvnzj6i0ziN2G2APSpJjgpWAz4EE2FpHGu13ySpfZy0A6PfvE0uL9+LNk/6X7vUZFA3xq88s3qo44s5glftOoAAAA=" alt="" aria-hidden="true">`,
  tg: `<img class="ico" src="data:image/webp;base64,UklGRoYEAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSA8BAAABgFtbe9vmk341XMXUDo6jGOokT4LjIbJbcgDlAKp1nEQJwKec/trnRAQbt20kSXNtt2X0BWwUAFVj3/KOK8bFxrE71pFrZU/WpFs/u6sgqQ0mPKuTjkkge/bdJ8ngfTiT3geSn3c7q4IHchEiz2oMC7KOyta7weCpoA/rJRBcRh+pYvS8gpSSPwYqGfiXlGC4oJoLGpRd9Hr4WMjFjKrOUsOgSeC9pdfE8/FJm49c+yNvadN32hTquP/fFOpzS0ebVq5N9qY9Nz5ZbazR/jCp+twuyt3gRL9b9LtJcE3FbruG6HZjAwJAUFft1q11q9vNgCAx3XN3+6CWHAh/IDX2KWuO3KmOinb+Zk0V2N4AAFZQOCBQAwAA0BQAnQEqQABAAD4xGIpDoiGhEgUkIAMEtgBkpL6/Xfxu1knkH4b/sZ/jOrB3C7Z8cicjqw/F/cZ2gPE2/m32idwDzAfpt+u/YQ9AD+bf1HrFPQA/aP0x/Yj/bf9nvgE/Ur/qNIFaDoc2oLGT6Aebv6d9gj9W+rd6Ff7VJedRY+Z6pKzWeJt1p3/+0vZn/6QagPLSdj1/7qQpmXGcINdy2V3M+IROKL3QR9PhJd0aAAD9Z8L3iGMd66lXg/MtVKptHbxbkHd4pJ37/FZ619PMN2sVF+ClPIIP+lTeX5EsHp3qC2i8jDGLytSCdU2p/FYgvQFnu3F8coX2Mm0zH2+P2dmcP0nuIAyYMNnvmElQ8lW2SbhehLQl6KTGEAhOqeea9y/g1bT6SeYGpgi1ya+r7uPB0K7LROJLL01RqIZu6Eko9/xbate/RzT2l1VZC1o8KV1FpYS/HDd+b1X9KUYjkRTLXJugWmcKZf+Y7stmeXce0GMiYo5F//tD0xxKpfMUn1txe6xCNIPKQxDkjmYFtmN/K+KeJ7xH4ext9Ihh6jZSaP4fR4Fy5ij+//f4U/08Rly6YVRrEGNbUlN/me/dYXdRIQUf4DWR+Ze4erhyLWswA6hvavHTSW/kZol4fq/PyGgWddhOGtTG+GTTZd37/m8caoRP8YJ4ipA/7USVHlgSYrafo70AGEna9HrkoeqphDFvObVy15z02DWNrjeiWMQUz69lto9V6CgPco2dF0sRxiv+UnglueI6Ujyxj10D9H4lik3Ag326e6ZWG0MbpTNPskkG8Ntdq9w3yW8ex1Lb/I8WTf0oCWvruWwW9XPHaOIsgSA13XoTZdwbagrXPwuV40iVBxcMDhiWvbjlie4/OLR++p3ixF9S9l0GEvQy6WdySnsvr37vFLW8AvE8x4vl0dSGnKe+2GNMxIfvMaZK0MLtfBzgTeEMKR+zCs4Dw36UBK71PyjXFMlyDHT6WrDJ6ipBVbLpEnQ+sUmezVMeteDmqZ4DTHINL3YQXU5SG1zDE9KG7Cx3z3QMgIXRL8a/wyzoL5nhp/4oBj29fvriKqQAjBIhNauT4ceHbGowHAczQyROgcbKNG2eSpb6HkDnQS6D4hTKF0qrJsyNQAA=" alt="" aria-hidden="true">`
};
// La validación sale en resumen (inicial, validado y disponible) o completa («Ver todo»: cada zona y cada destino)
const idPdf = (tipo, id) => tipo === "VALIDACION" && ls.get("valTodo", "") === "1" ? (id || "") + "|todo" : (id || "");
async function descargarPDF(tipo, id, btn) {
  if (btn) btn.disabled = true;
  toast("Generando PDF…", "", 2500);
  try { const r = await api("webPDF", tipo, idPdf(tipo, id)); bajarB64(r.nombre, r.b64); }
  catch (e) { toast(e.message, "bad", 6000); }
  finally { if (btn) btn.disabled = false; }
}
// ---------- 👁 Ver el informe tal como sale en el PDF (sin convertirlo) ----------
async function verInforme(tipo, id) {
  const todoV = tipo === "VALIDACION", riesgoV = tipo === "INFORME";
  const c = abrirModal(`<div class="vi-top"><b id="viT">Informe</b>${todoV ? `<label class="toggle vi-todo"><input type="checkbox" id="viTodo" ${ls.get("valTodo", "") === "1" ? "checked" : ""}> Ver todo</label>` : ""}${riesgoV ? `<label class="toggle vi-todo" title="Solo vencidos y hasta 45 días"><input type="checkbox" id="viRies" ${id === "riesgo" ? "checked" : ""}> Solo en riesgo (≤ 45 d)</label>` : ""}<span class="vi-z"><button class="btn sm icon" data-z="-1" aria-label="Alejar">−</button><button class="btn sm icon" data-z="1" aria-label="Acercar">＋</button></span></div>
    <div class="vi-marco" id="viM">${loader("Armando el informe…")}</div>
    <div class="modal-actions"><button class="btn" data-x>Cerrar</button><button class="btn sm" data-pdf="${h(tipo)}" data-id="${h(id)}"><span class="ic">${ICO.pdf}</span> PDF</button><button class="btn sm btn-wa" data-wa="${h(tipo)}" data-id="${h(id)}"><span class="ic">${ICO.wa}</span> WhatsApp</button></div>`, { wide: true, clase: "visor" });
  // «Ver todo» (validación): muestra lo contado en cada zona y lo validado a cada destino; el PDF y WhatsApp salen igual
  if (todoV) $("#viTodo", c).onchange = e => { ls.set("valTodo", e.target.checked ? "1" : ""); cargar(); };
  // Informe de prioridad: solo lo más en riesgo (vencidos y hasta 45 días); el PDF y WhatsApp de aquí salen igual
  if (riesgoV) $("#viRies", c).onchange = e => { id = e.target.checked ? "riesgo" : ""; $$(".modal-actions [data-id]", c).forEach(b => { b.dataset.id = id; }); cargar(); };
  let r;
  const M = $("#viM", c);
  let zoom = 1, ancho = 740;
  const ajustar = () => {
    const ifr = $("iframe", M), hoja = $(".vi-hoja", M), caja = $(".vi-caja", M);
    const d = ifr && ifr.contentDocument; if (!d || !d.body) return;
    d.body.style.margin = "0"; d.body.style.background = "#fff";
    const alto = Math.ceil(d.documentElement.scrollHeight);
    ifr.style.height = alto + "px";
    const base = Math.min(1, (M.clientWidth - 16) / (ancho + 40));
    const esc = base * zoom;
    hoja.style.transform = `scale(${esc})`;
    caja.style.width = Math.ceil((ancho + 40) * esc) + "px";
    caja.style.height = Math.ceil((alto + 40) * esc) + "px";
  };
  c.addEventListener("click", e => { const z = e.target.closest("[data-z]"); if (!z) return; zoom = Math.max(0.5, Math.min(3, zoom * (z.dataset.z === "1" ? 1.25 : 0.8))); ajustar(); });
  const cargar = async () => {
    M.innerHTML = loader("Armando el informe…");
    try { r = await api("webPDFHtml", tipo, idPdf(tipo, id)); } catch (e) { M.innerHTML = errBox(e); return; }
    if (!document.body.contains(c)) return;
    $("#viT", c).textContent = r.nombre.replace(/\.pdf$/i, "").replace(/_/g, " ");
    const horizontal = /size:\s*(letter\s+)?landscape/i.test(r.html);
    ancho = horizontal ? 980 : 740;   // lo mismo que usa el PDF (hoja carta menos márgenes)
    M.innerHTML = `<div class="vi-caja"><div class="vi-hoja" style="width:${ancho + 40}px"><iframe title="Informe" sandbox="allow-same-origin" style="width:${ancho}px"></iframe></div></div>`;
    const ifr = $("iframe", M);
    ifr.onload = () => { ajustar(); setTimeout(ajustar, 200); };
    ifr.srcdoc = r.html;
  };
  cargar();
}

// ---------- 🟢 Compartir por WhatsApp (el celular abre su menú de compartir y se escoge el grupo) ----------
function b64aArchivo(b64, nombre, tipo) {
  const bin = atob(b64); const bytes = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
  return new File([bytes], nombre, { type: tipo });
}
async function compartirWA(tipo, id) {
  const c = abrirModal(`<h3>Compartir por WhatsApp</h3><p class="muted small">Escoge cómo mandarlo. Luego tocas «Compartir» y en WhatsApp escoges el grupo.</p>
    <div class="seg seg-sm" id="waF"><button data-f="pdf" class="on"><span class="ic">${ICO.pdf}</span> PDF</button><button data-f="foto">🖼️ Foto</button></div>
    <p class="muted small" id="waT">Un solo archivo PDF, igual al que se descarga.</p>
    <div id="waE"></div>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="waOk">Preparar</button></div>`);
  let formato = "pdf", archivos = null;
  const textos = { pdf: "Un solo archivo PDF, igual al que se descarga.", foto: "Una foto por cada hoja: se ven de una vez en el chat, sin abrir archivos." };
  $("#waF", c).onclick = e => { const b = e.target.closest("[data-f]"); if (!b) return; formato = b.dataset.f; archivos = null; $$("#waF button", c).forEach(x => x.classList.toggle("on", x === b)); $("#waT", c).textContent = textos[formato]; $("#waOk", c).textContent = "Preparar"; $("#waE", c).innerHTML = ""; };
  $("#waOk", c).onclick = async () => {
    const btn = $("#waOk", c);
    // Segundo toque: compartir (el celular exige que salga de un toque del usuario)
    if (archivos) {
      try {
        if (navigator.canShare && navigator.canShare({ files: archivos })) { await navigator.share({ files: archivos, title: archivos[0].name }); cerrarModal(true); }
        else { archivos.forEach(f => { const u = URL.createObjectURL(f); const a = document.createElement("a"); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 1000); }); toast("Este equipo no deja compartir directo: se descargó. Adjúntalo en WhatsApp.", "warn", 8000); cerrarModal(true); }
      } catch (er) { if (er && er.name !== "AbortError") toast("No se pudo compartir: " + er.message, "bad", 6000); }
      return;
    }
    ocupado(btn, true, "Preparando…");
    try {
      if (formato === "pdf") { const r = await api("webPDF", tipo, idPdf(tipo, id)); archivos = [b64aArchivo(r.b64, r.nombre, "application/pdf")]; }
      else {
        const r = await api("webPDFFotos", tipo, idPdf(tipo, id)), base = r.nombre.replace(/\.pdf$/i, "");
        archivos = r.fotos.map((u, k) => b64aArchivo(u.split(",")[1], `${base}${r.fotos.length > 1 ? "_" + (k + 1) : ""}.jpg`, "image/jpeg"));
      }
      ocupado(btn, false); btn.textContent = "📤 Compartir";
      $("#waE", c).innerHTML = `<div class="note">Listo: ${archivos.length} ${formato === "pdf" ? "PDF" : (archivos.length > 1 ? "fotos" : "foto")}. Toca «Compartir».</div>`;
    } catch (er) { ocupado(btn, false); toast(er.message, "bad", 6000); }
  };
}

function bajarB64(nombre, b64) {
  const bin = atob(b64); const bytes = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a"); a.href = url; a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(() => a.remove(), 1000);
  toast(`PDF listo: ${nombre}`, "ok", 9000, `<a href="${url}" target="_blank" rel="noopener">Abrir</a>`);
}
async function enviarTG(tipo, id, btn) {
  if (!S.grupoTg) { toast("No está configurado el grupo de Telegram.", "bad"); return; }
  if (!(await confirmar("Enviar a Telegram", "¿Enviar este PDF al grupo de calidad?", "Enviar"))) return;
  if (btn) btn.disabled = true;
  toast("Enviando al grupo de Telegram…", "", 2500);
  try { await api("webPDFTelegram", tipo, idPdf(tipo, id)); toast("PDF enviado al grupo de Telegram", "ok"); }
  catch (e) { toast(e.message, "bad", 6000); }
  finally { if (btn) btn.disabled = false; }
}
// Descargar siempre; Telegram solo si el usuario lo pide con su botón
function botonesPDF(tipo, etiqueta, id) {
  const d = id ? ` data-id="${h(id)}"` : "";
  // Ver (tal cual, sin convertir) y compartir por WhatsApp: solo en la versión web
  const web = !!window.FRECS_WEB;
  // Solo los íconos: el nombre queda en title / aria-label
  const et = h(etiqueta && !/^(PDF|Descargar( PDF)?)$/i.test(etiqueta) ? etiqueta : "PDF");
  return (web ? `<button class="btn sm ic-only" data-verinf="${tipo}"${d} title="Ver ${et}" aria-label="Ver ${et}"><span class="ic">👁</span></button>` : "") +
    `<button class="btn sm btn-ico ic-only" data-pdf="${tipo}"${d} title="Descargar ${et}" aria-label="Descargar ${et}"><span class="ic">${ICO.pdf}</span></button>` +
    (web ? `<button class="btn sm btn-ico btn-wa ic-only" data-wa="${tipo}"${d} title="Compartir por WhatsApp" aria-label="Compartir ${et} por WhatsApp"><span class="ic">${ICO.wa}</span></button>` : "") + `${S.grupoTg && puede("validador") ? `<button class="btn sm btn-ico ghost ic-only" data-tg="${tipo}"${d} title="Enviar al grupo de Telegram" aria-label="Enviar ${et} al grupo de Telegram"><span class="ic">${ICO.tg}</span></button>` : ""}`;
}
// Barras de botones en una sola fila: si no caben con su texto, quedan solo los íconos
function ajustarBarras(raiz) {
  $$(".barra-acc", raiz || document).forEach(b => {
    // Si la barra ya se ajustó a este ancho no se vuelve a medir (medir mueve la página al deslizar en el celular)
    if (b.dataset.aw === String(b.clientWidth) && b.dataset.an === String(b.children.length)) return;
    const bs = $$(".btn", b);
    bs.forEach(x => { x.classList.remove("solo-ic"); if (!x.getAttribute("aria-label")) { const t = $(".txt", x); if (t) x.setAttribute("aria-label", t.textContent.trim()); } });
    // Se mide cada botón a su ancho natural; si no caben, se quita el texto al más largo, y así hasta que quepan
    b.classList.add("midiendo");
    for (let k = 0; k < bs.length && b.scrollWidth > b.clientWidth + 1; k++) {
      const con = bs.filter(x => !x.classList.contains("solo-ic") && $(".txt", x));
      if (!con.length) break;
      // Los principales (agregar, cerrar) conservan su texto hasta el final
      const prio = x => x.classList.contains("btn-neon") || x.classList.contains("warn") || x.classList.contains("primary") ? 1 : 0;
      con.sort((x, y) => prio(x) - prio(y) || y.offsetWidth - x.offsetWidth)[0].classList.add("solo-ic");
    }
    b.classList.remove("midiendo");
    b.dataset.aw = b.clientWidth; b.dataset.an = b.children.length;
  });
}
let _ajBarras = 0;
const pedirAjuste = () => { cancelAnimationFrame(_ajBarras); _ajBarras = requestAnimationFrame(() => ajustarBarras()); };
// Solo cuando aparecen barras nuevas (no con cada número que cambia dentro de una tarjeta)
new MutationObserver(ms => { if (ms.some(m => Array.from(m.addedNodes).some(n => n.nodeType === 1 && (n.matches(".barra-acc") || n.querySelector(".barra-acc"))))) pedirAjuste(); })
  .observe(document.getElementById("view") || document.body, { childList: true, subtree: true });
// En el celular la barra del navegador aparece y se esconde al deslizar (cambia el alto, no el ancho): eso no cuenta
let _anchoVent = window.innerWidth;
window.addEventListener("resize", () => { if (window.innerWidth === _anchoVent) return; _anchoVent = window.innerWidth; pedirAjuste(); });
document.addEventListener("click", e => {
  const v = e.target.closest("[data-verinf]"); if (v) { verInforme(v.dataset.verinf, v.dataset.id || ""); return; }
  const w = e.target.closest("[data-wa]"); if (w) { compartirWA(w.dataset.wa, w.dataset.id || ""); return; }
  const p = e.target.closest("[data-pdf]"); if (p) { descargarPDF(p.dataset.pdf, p.dataset.id || "", p); return; }
  const t = e.target.closest("[data-tg]"); if (t) { enviarTG(t.dataset.tg, t.dataset.id || "", t); }
});

const VISTAS = {};

// =====================================================================
// Tarjeta de inventario y listas
// =====================================================================
function vencTxt(i) {
  if (!i.v) return `Sin fecha`;
  const dd = i.d === 9999 ? "sin días" : (i.d < 0 ? `Vencido (${i.d} d)` : `${i.d} días`);
  return `<b>${h(i.vf)}</b> · ${dd}`;
}
const canal = (n, ok, extra) => `<span class="canal ${ok ? "si" : "no"}" title="${h(extra || "")}">${n}</span>`;
function canalesHtml(i) {
  const m = i.min || {};
  return `<div class="canales">${canal("T1", i.T1, "Mínimo " + (m.T1 || "") + " días")}${canal("T2", i.T2, "Mínimo " + (m.T2 || "") + " días")}${canal("KA", i.KA, "Mínimo " + (m.KA || "") + " días")}</div>`;
}
function invCard(i, o) {
  o = o || {};
  const tags = [];
  if (i.prio) tags.push(`<span class="tag t-prio">🚨 Prioridad</span>`);
  if (i.tpc) tags.push(`<span class="tag">🏷️ Tapacódigo</span>`);
  if (i.reemp) tags.push(`<span class="tag ${canalAct() === "T2" ? "t-reemp" : ""}">📦 Reempaque</span>`);
  // Canal encendido: si cumple o no sus días mínimos
  const cn = canalAct();
  if (cn && i.T1 !== undefined && o.canalTag !== false) {
    const mn = (i.min || {})[cn];
    tags.unshift(cumpleCanal(i, cn) ? `<span class="tag t-cumple">✅ Cumple ${h(CANALES[cn])}</span>`
      : `<span class="tag t-nocumple" title="Mínimo ${h(mn || "?")} días">⛔ No cumple ${h(CANALES[cn])}${!i.disp ? " (bloqueado)" : ` · ${i.d === 9999 ? "sin fecha" : i.d + " d"} de ${h(mn || "?")}`}</span>`);
  }
  if (i.carpa && o.carpa !== false) tags.push(`<span class="tag">⛺ Carpa</span>`);
  // Estibas del módulo respecto a lo que le cabe (como en Consumo) y si es el único módulo con el producto
  if (o.ocup && S.ocup[i.m] && S.ocup[i.m].capTot) { const oc = S.ocup[i.m]; tags.unshift(oc.usadas >= oc.capTot ? `<span class="tag t-lleno" title="Estibas en el módulo / capacidad">Lleno ${fm(oc.usadas)}/${fm(oc.capTot)}</span>` : `<span class="tag t-inc" title="Estibas en el módulo / capacidad">Incompleto ${fm(oc.usadas)}/${fm(oc.capTot)}</span>`); }
  if (o.unico) tags.unshift(`<span class="tag t-unico">⚠️ Único módulo</span>`);
  // Reportes pendientes del módulo: el vacío no lleva puesto FEFO (lo hace quien llama con fefoN)
  const rp = repDe(i.m);
  if (rp.v) tags.unshift(`<span class="tag t-rv" title="Reportado por ${h(rp.v.por)} · ${h(fechaCorta(rp.v.en))}">🟠 Reportado como vacío</span>`);
  if (rp.c) tags.unshift(`<span class="tag t-rc" title="Encontraron ${h(rp.c.skuEnc)} · ${h(rp.c.prodEnc)}">⚠️ Conflicto reportado</span>`);
  const est = i.disp ? `<span class="pill ok">DISPONIBLE</span>` : `<span class="pill bad">BLOQ · ${h(i.est)}</span>`;
  let obs = "";
  if (!i.disp && (i.cand || i.obs)) obs = `<div class="obs">🔑 ${i.cand ? `<b>${h(i.cand)}</b> ` : ""}${h(i.obs || "")}</div>`;
  else if (i.obs) obs = `<div class="obs">📝 ${h(i.obs)}</div>`;
  return `<article class="card inv v-${h(i.vida)} ${rp.v ? "rep-v" : ""}">
    <div class="row sb"><span class="mod-l">${modChip(i.m)}${o.fefo ? `<span class="fefo" title="Orden FEFO: primero lo que vence antes">#${o.fefo} FEFO</span>` : ""}${i.prio ? botonFoto(i.s, i.m) : ""}</span>${est}</div>
    ${o.producto === false ? "" : `<div class="prod">${skuTxt(i.s, i.p)}</div>${i.fam ? `<div class="sub">${h(i.fam)}</div>` : ""}`}
    ${qty(i.e, i.c, i.u, i.emp)}
    <div class="vence">${vencTxt(i)}</div>
    ${o.canales === false || i.T1 === undefined ? "" : canalesHtml(i)}
    ${tags.length ? `<div class="tags">${tags.join("")}</div>` : ""}
    ${obs}
    ${o.extra ? `<div class="extra">${o.extra}</div>` : ""}
    ${i.actTxt ? `<div class="act">Act: ${h(i.actTxt)}</div>` : ""}
  </article>`;
}

function listaInv(el, cfg) {
  const LOTE = 60;
  let limite = LOTE, filtro = "";
  el.innerHTML = cab(cfg.titulo, cfg.sub, cfg.tools) + (cfg.arriba || "") + LEYENDA +
    `<div class="lista-tools"><input type="search" placeholder="Filtrar por SKU, producto, módulo u observación…" id="lfq"><span class="count" id="lfc"></span></div><div id="lfg"></div>`;
  const pintar = () => {
    const q = norm(filtro).split(/\s+/).filter(x => x);
    const items = q.length ? cfg.items.filter(i => coincide(norm(`${i.s} ${i.p} ${i.m} ${i.obs || ""} ${i.cand || ""} ${i.est || ""}`), q) > 0) : cfg.items;
    $("#lfc", el).textContent = `${fm(items.length)} ${items.length === 1 ? "ubicación" : "ubicaciones"}`;
    if (!items.length) { $("#lfg", el).innerHTML = vacio(cfg.items.length ? "Nada coincide con el filtro." : (cfg.vacio || "Sin resultados."), cfg.items.length ? "🔎" : "✅"); return; }
    $("#lfg", el).innerHTML = `<div class="grid">${items.slice(0, limite).map(i => invCard(i, cfg.card ? cfg.card(i) : {})).join("")}</div>` +
      (items.length > limite ? `<div style="text-align:center;margin-top:14px"><button class="btn" id="lfm">Mostrar más (${fm(items.length - limite)} restantes)</button></div>` : "");
    const m = $("#lfm", el); if (m) m.onclick = () => { limite += LOTE; pintar(); };
  };
  $("#lfq", el).oninput = e => { filtro = e.target.value; limite = LOTE; pintar(); };
  pintar();
  if (cfg.alMontar) cfg.alMontar(el);
}
async function vistaFiltro(el, cfg) {
  const inv = await cargarInv();
  listaInv(el, Object.assign({}, cfg, { items: inv.filter(i => i.fis && cfg.filtro(i)).sort(cfg.orden) }));
}
const ordPrioD = (a, b) => prio(a, b) || (a.d - b.d);
const ordPrioModD = (a, b) => prio(a, b) || cmpMod(a, b) || (a.d - b.d);
const ordPrioVence = (a, b) => prio(a, b) || (tV(a.v) - tV(b.v));
// Mismo criterio de Consumo (pony gasto): disponibles de bodega primero (KA / PREV y bloqueados al final),
// 1) prioridad · 2) fecha más corta · 3) con la misma fecha, el módulo incompleto · 4) el que tiene menos estibas en su módulo
const ocupMod = m => { const o = S.ocup[m]; return o && o.capTot ? o : null; };
const ordConsumo = (a, b) => {
  const g = i => (!i.disp ? 2 : (i.esOp || repVacio(i.m)) ? 1 : 0);
  if (g(a) !== g(b)) return g(a) - g(b);
  if (prio(a, b)) return prio(a, b);
  const t = tV(a.v) - tV(b.v); if (t) return t;
  const oa = ocupMod(a.m), ob = ocupMod(b.m);
  const ia = oa ? oa.usadas < oa.capTot : false, ib = ob ? ob.usadas < ob.capTot : false;
  if (ia !== ib) return ia ? -1 : 1;
  const ua = oa ? oa.usadas : 9999, ub = ob ? ob.usadas : 9999;
  if (ua !== ub) return ua - ub;
  return cmpMod(a, b);
};

// =====================================================================
// INICIO
// =====================================================================
// Resumen para el que entra al turno (desplegable: cada quien decide si lo ve)
function resumenTurno(box) {
  if (!box || !S.inv) return;
  const ab = abierto("ini", "res"), rec = S.turno && S.turno.recibido;
  const pend = repPend(), mods = typeof modulosActualizacion === "function" ? modulosActualizacion(S.inv) : [];
  const rojos = mods.filter(x => x.niv === "r").length, secs = mods.length ? seccionesActualizacion(mods).filter(s => s.viejo && s.niv !== "v") : [];
  const cortas = S.inv.filter(i => i.fis && i.disp && i.d >= 0 && i.d <= 45).length, venc = S.inv.filter(i => i.fis && i.d < 0).length;
  const item = (ic, txt, v, cls) => `<button type="button" class="rs-i ${cls || ""}" ${v ? `data-go="${v}"` : ""}><span class="rs-ic">${ic}</span><span>${txt}</span></button>`;
  box.innerHTML = `<section class="card plegable rs-card ${ab ? "abierto" : ""}"><div class="pl-cab" data-plegar="ini|res" role="button" tabindex="0" aria-expanded="${ab}">
      <h3 style="margin:0">📋 Resumen para tu turno ${pend.length ? `<span class="nav-n">${pend.length}</span>` : ""}</h3><span class="pl-flecha" aria-hidden="true">▾</span></div>
    <div class="pl-cuerpo">
      ${rec ? `<div class="rs-rec"><div class="small muted">Recibes de</div><b>${h(rec.texto)}</b> · @${h(rec.cerradoPor)}${rec.cierre ? ` · ${h(fechaCorta(rec.cierre))}` : ""}
        ${rec.nota ? `<div class="rs-nota">📝 ${h(rec.nota)}</div>` : ""}${rec.notas && rec.notas.length ? `<ul class="rs-notas">${rec.notas.map(n => `<li>${h(n)}</li>`).join("")}</ul>` : ""}</div>` : ""}
      <div class="rs-g">
        ${item("📣", pend.length ? `<b>${pend.length}</b> reporte${pend.length > 1 ? "s" : ""} de módulos pendiente${pend.length > 1 ? "s" : ""}` : "Sin reportes de módulos pendientes", pend.length ? "repgen" : "", pend.length ? "warn" : "ok")}
        ${item("🕒", rojos ? `<b>${rojos}</b> módulos con más de 24 h sin actualizar${secs[0] ? ` · sigue <b>${h(nombreSeccion(secs[0].sec))}</b>` : ""}` : "Bodega actualizada en las últimas 24 h", "actualizacion", rojos ? "bad" : "ok")}
        ${item("⏳", `<b>${cortas}</b> ubicaciones disponibles vencen en 45 días o menos`, "fechas", cortas ? "warn" : "ok")}
        ${venc ? item("🛑", `<b>${venc}</b> ubicaciones vencidas`, "vencidos", "bad") : ""}
      </div></div></section>`;
  box.onclick = e => { const b = e.target.closest("[data-go]"); if (b) ir(b.dataset.go, b.dataset.go === "fechas" ? { dias: 45 } : {}); };
}
VISTAS.inicio = async (el, p, vigente) => {
  el.innerHTML = cab(`Hola, ${h(S.usuario ? S.usuario.nombre.split(" ")[0] : "")}`, "Resumen de la bodega y del turno") +
    `<div class="quick">${campoAuto("qq", "SKU, producto o módulo (ej: 3659, pony go, B12)")}</div>
     <div id="pvI"></div><div id="tb"></div><div id="rsT"></div><div id="kp">${loader()}</div><h2>Validación del turno</h2><div id="vs">${loader()}</div>`;
  resumenTurno($("#rsT", el));
  avisoPocos($("#pvI", el));
  autoSku($("#qq", el), c => ir("stock", { sku: c.sku }));
  $("#qq", el).addEventListener("keydown", e => {
    if (e.key !== "Enter" || e.defaultPrevented) return;
    const q = e.target.value.trim(); if (!q) return;
    if (/^\d+$/.test(q)) ir("stock", { sku: q });
    else if (/^[a-z]{1,2}\d{0,3}$/i.test(q)) ir("modulo", { mod: q });
    else ir("producto", { q: q });
  });
  barraTurno($("#tb", el), true);
  api("webResumen").then(r => {
    if (!vigente()) return;
    const k = (n, l, v, cls) => `<button class="kpi ${cls || ""}" data-go="${v}"><span class="n">${fm(n)}</span><span class="l">${l}</span></button>`;
    $("#kp", el).innerHTML = `<div class="kpis">
      ${k(r.cVencidos, "Ubicaciones vencidas", "vencidos", r.cVencidos ? "bad" : "ok")}
      ${k(r.cRiesgo, "En riesgo (< 45 días)", "fechas|45", r.cRiesgo ? "warn" : "ok")}
      ${k(r.cBloq, "Ubicaciones bloqueadas", "bloqueados", r.cBloq ? "warn" : "ok")}
      ${k(r.cPocos, "SKUs bajo su mínimo", "pocos", r.cPocos ? "warn" : "ok")}
      ${k(r.cMezcla, "Módulos con 2+ SKUs", "mezclados", r.cMezcla ? "warn" : "ok")}
      ${k(r.cPrio, "Con prioridad FEFO", "prioridades")}
      ${k(r.cTpc, "Tapacódigos", "tpc")}
      ${k(r.mLimbo, "Registros en limbo", "limbo", r.mLimbo ? "warn" : "ok")}
      ${k(r.mConsumo, "SKUs de consumo", "consumo")}</div>`;
    $("#kp", el).onclick = e => { const b = e.target.closest("[data-go]"); if (!b) return; const [v, d] = b.dataset.go.split("|"); ir(v, d ? { dias: +d } : {}); };
  }).catch(e => { if (vigente()) $("#kp", el).innerHTML = errBox(e.red ? "Sin conexión." : e); });
  cargarVal().then(v => {
    if (!vigente()) return;
    if (!v.turno) { $("#vs", el).innerHTML = `<div class="card muted">No hay turno abierto.</div>`; return; }
    if (!v.productos.length) { $("#vs", el).innerHTML = `<div class="card">No hay productos en validación. <button class="link" data-go2="1">Ir a Validaciones →</button></div>`; }
    else $("#vs", el).innerHTML = `<div class="grid">${v.productos.map(p => `<div class="card vcard ${estadoVal(p)}"><div class="prod">${skuTxt(p.sku, p.producto)}</div><div class="disp"><span class="n">${fm(p.disponible)}</span><span class="l">disponibles de ${fm(p.inicial)}</span></div><div class="bar"><i style="width:${pctVal(p)}%"></i></div></div>`).join("")}</div>
      <div style="margin-top:10px"><button class="btn" data-go2="1">Abrir validaciones →</button></div>`;
    $("#vs", el).onclick = e => { if (e.target.closest("[data-go2]")) ir("validacion"); };
  }).catch(e => { if (vigente()) $("#vs", el).innerHTML = errBox(e); });
};

// =====================================================================
// STOCK POR SKU (buscar por SKU o por nombre, con autocompletado)
// =====================================================================
VISTAS.stock = async (el, p, vigente) => {
  const [inv] = await Promise.all([cargarInv(), cargarCat()]);
  if (!vigente()) return;
  let sku = p.sku || ls.get("ultSku", ""), filtro = canalAct() || "DISP", verKA = false;
  const ficha0 = sku && S.cat.find(c => c.sku === sku);
  el.innerHTML = cab("📡 Stock por SKU", "Existencias físicas en bodega, ordenadas por prioridad y vencimiento") +
    barraBusqueda("sq", "SKU o nombre (ej: 3659 · pony go 2l)", ficha0 ? `${sku} · ${ficha0.prod}` : sku, "Consultar") + `<div id="sCan">${canalBanner()}</div><div id="sr"></div>`;
  const inp = $("#sq", el);
  // Un solo cuadro: si escribe el SKU o el nombre, igual encuentra
  autoSku(inp, c => { sku = c.sku; ls.set("ultSku", sku); pintar(); });
  alLimpiar(inp, () => { sku = ""; ls.set("ultSku", ""); pintar(); });
  const pintar = () => {
    const r = $("#sr", el);
    if (!sku) { r.innerHTML = ""; return; }
    const ficha = S.cat.find(c => c.sku === sku);
    if (!ficha) { r.innerHTML = vacio("Este SKU no existe en la hoja Sku.", "❌"); return; }
    const fis = inv.filter(i => i.s === sku && i.fis);
    if (!fis.length) { r.innerHTML = `<div class="card" style="margin-bottom:12px"><div class="prod" style="font-weight:700;font-size:17px">${skuTxt(sku, ficha.prod)}</div></div>` + vacio("No hay existencias físicas.", "⚠️"); return; }
    const visibles = fis.filter(i => verKA || !i.esOp);
    const tot = visibles.filter(i => i.disp).reduce((a, i) => ({ e: a.e + i.e, c: a.c + i.c, u: a.u + i.u }), { e: 0, c: 0, u: 0 });
    const lis = visibles.filter(i => (filtro === "DISP" ? i.disp : filtro === "ALL" ? true : cumpleCanal(i, filtro))).sort((a, b) => (filtro === "T2" && reempPrimero(a, b)) || ordConsumo(a, b));
    // Canal sin nada que cumpla: sí existe, pero no cumple; se muestra dónde está
    const esCanal = !!CANALES[filtro], noCumple = esCanal && !lis.length ? visibles.filter(i => i.disp).sort(ordConsumo) : [];
    const minC = esCanal ? Math.max(0, ...fis.map(i => +((i.min || {})[filtro]) || 0)) : 0;
    // Único módulo: el producto disponible está en un solo módulo de bodega (sin KA / PREV), igual que en Consumo
    const modsDisp = new Set(fis.filter(i => i.disp && !i.esOp).map(i => i.m)), unico = modsDisp.size === 1 ? [...modsDisp][0] : "";
    const segBtn = (f, t) => `<button data-f="${f}" class="${filtro === f ? "on" : ""}">${t}</button>`;
    $("#sCan", el).innerHTML = canalBanner(esCanal && minC ? `${h(CANALES[filtro])} pide ${minC} días para este producto` : "");
    r.innerHTML = `<div class="card st-card ${unico ? "unico" : ""}"><div class="prod">${skuTxt(sku, fis[0].p || ficha.prod)}</div>${unico ? `<span class="pill unico-p">⚠️ Único módulo con este producto: ${h(unico)}</span>` : ""}
        <div class="st-tot">${qty(tot.e, tot.c, tot.u, fis[0].emp)}</div></div>
      <div class="lista-tools"><div class="seg" id="sf">${segBtn("DISP", "Disponible")}${segBtn("ALL", "Todos")}${segBtn("T1", "T1")}${segBtn("T2", "T2")}${segBtn("KA", "KA")}</div>
        <label class="toggle"><input type="checkbox" id="sk" ${verKA ? "checked" : ""}> Mostrar KA / PREV</label><span class="count">${fm(lis.length)} ubicaciones</span></div>
      ${LEYENDA}${lis.length ? `<div class="grid">${(() => { let n = 0; return lis.map(i => invCard(i, { producto: false, ocup: true, unico: i.m === unico && i.disp, fefo: i.disp && !i.esOp && !repVacio(i.m) ? ++n : 0 })).join(""); })()}</div>`
        : noCumple.length ? `<div class="note warn no-cumple">⛔ <b>Sí hay este producto, pero no cumple los requisitos de ${h(CANALES[filtro])}</b>${minC ? ` (mínimo ${minC} días)` : ""}. Esto es lo que hay en bodega:</div><div class="grid">${noCumple.map(i => invCard(i, { producto: false, ocup: true })).join("")}</div>`
        : (fis.some(i => i.esOp) && !verKA ? vacio("Agotado en bodega general. Hay stock en KA / PREV: activa «Mostrar KA / PREV».", "⚠️") : vacio("Nada con este filtro.", "🔎"))}`;
    $("#sf", r).onclick = e => { const b = e.target.closest("button"); if (b) { filtro = b.dataset.f; pintar(); } };
    $("#sk", r).onchange = e => { verKA = e.target.checked; pintar(); };
  };
  const consultar = () => {
    const v = inp.value.trim();
    if (!v) { sku = ""; pintar(); return; }
    const m = v.match(/^(\d+)/);
    if (m) sku = m[1];
    else { const r = buscarCat(v, 1); if (r.length) { sku = r[0].sku; inp.value = `${sku} · ${r[0].prod}`; } }
    ls.set("ultSku", sku); pintar();
  };
  $("#sqB", el).onclick = consultar;
  inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.defaultPrevented) consultar(); });
  pintar();
};

// =====================================================================
// INFORMACIÓN DE PRODUCTO (hoja Sku)
// =====================================================================
function fichaHtml(c, conStock) {
  const cajas = conStock ? (S.inv || []).filter(i => i.s === c.sku && i.fis && i.disp).reduce((a, i) => a + i.c, 0) : null;
  return `<article class="card"><div style="font-weight:700;font-size:15.5px">${skuTxt(c.sku, c.prod)}</div>
    <div class="ficha"><span>Cubicaje</span><b>${h(c.cub || "N/A")}</b><span>Piso</span><b>${h(c.piso || "N/A")}</b><span>Plancha</span><b>${h(c.plancha || "N/A")}</b>
    <span>Cant x estiba</span><b>${h(c.cantEst || "N/A")}</b><span>Presentación</span><b>${h(c.pres || "N/A")}</b></div>
    ${conStock ? `<div class="row sb" style="margin-top:10px"><span class="small muted">Disponible WMS: <b>${fm(cajas)}</b> cajas</span><button class="btn sm" data-sku="${h(c.sku)}">Ver stock →</button></div>` : ""}</article>`;
}
// Producto en una fila desplegable (colores intercalados): cerrada muestra SKU, nombre, presentación y lo disponible
function filaProducto(c, opts) {
  opts = opts || {};
  const cajas = (S.inv || []).filter(i => i.s === c.sku && i.fis && i.disp).reduce((a, i) => a + i.c, 0);
  const ab = abierto(opts.grupo || "pf", c.sku);
  const v = x => x === null || x === undefined || x === "" ? `<span class="muted">—</span>` : h(x);
  const campos = [["Presentación", c.pres], ["Cubicaje", c.cub], ["Piso", c.piso], ["Plancha", c.plancha], ["Cant x estiba", c.cantEst]]
    .concat(opts.todo ? [["Est. por cara", c.estCara], ["Vida útil (días)", c.vida], ["Mínimo (pocos)", c.minimo], ["Días T1", c.t1], ["Días T2", c.t2], ["Días KA", c.ka], ["Contexto", c.ctx]] : []);
  return `<article class="pf plegable ${ab ? "abierto" : ""}"><div class="pl-cab" data-plegar="${opts.grupo || "pf"}|${h(c.sku)}" role="button" tabindex="0" aria-expanded="${ab}">
      <div class="pf-t"><div class="pf-n">${skuTxt(c.sku, c.prod)}</div><div class="pf-s">${c.pres ? `<span>${h(c.pres)}</span>` : ""}${opts.todo ? "" : `<span>Disponible <b>${fm(cajas)}</b> cj</span>`}</div></div>
      <span class="pl-flecha" aria-hidden="true">▾</span></div>
    <div class="pl-cuerpo"><div class="pf-campos">${campos.map(([t, x]) => `<div><span>${t}</span><b>${v(x)}</b></div>`).join("")}</div>
      <div class="pf-acc">${opts.todo ? "" : `<button class="btn sm" data-sku="${h(c.sku)}">📡 Ver stock</button>`}${opts.editar ? `<button class="btn sm" data-ed="${h(c.sku)}">✎ Editar</button>` : ""}${opts.borrar ? `<button class="btn sm del" data-bo="${h(c.sku)}" title="Borrar" aria-label="Borrar">${ICO_DEL}</button>` : ""}</div></div></article>`;
}
// Toda la información de un producto (al escogerlo de la lista)
function detalleProducto(c) {
  const v = x => x === null || x === undefined || x === "" ? `<span class="muted">—</span>` : h(x);
  const fis = (S.inv || []).filter(i => i.s === c.sku && i.fis), disp = fis.filter(i => i.disp);
  const bod = disp.filter(i => !i.esOp);
  const sum = l => l.reduce((a, i) => ({ e: a.e + i.e, c: a.c + i.c, u: a.u + i.u }), { e: 0, c: 0, u: 0 });
  const t = sum(disp), mods = new Set(bod.map(i => i.m));
  const cn = canalAct(), min = (fis[0] && fis[0].min) || {};
  const canalFila = k => { const ok = bod.filter(i => cumpleCanal(i, k)); const cj = ok.reduce((a, i) => a + i.c, 0);
    return `<div class="dp-can ${ok.length ? "si" : "no"} ${cn === k ? "act" : ""}"><b>${CANALES[k]}</b><span>${ok.length ? `✅ ${fm(cj)} cj en ${new Set(ok.map(i => i.m)).size} mód.` : "⛔ Nada cumple"}</span><small>Mínimo ${v(min[k] || c[k.toLowerCase()])} días</small></div>`; };
  const g = (tit, campos) => `<div class="dp-g"><div class="dp-gt">${tit}</div><div class="pf-campos">${campos.map(([t2, x]) => `<div><span>${t2}</span><b>${v(x)}</b></div>`).join("")}</div></div>`;
  return `<article class="card dp-card">
    <div class="dp-cab"><div><div class="dp-n">${skuTxt(c.sku, c.prod)}</div>${c.pres ? `<div class="sub">${h(c.pres)}</div>` : ""}</div>
      <div class="dp-acc"><button class="btn sm primary" data-sku="${h(c.sku)}">📡 Ver stock</button>${puede("administrador") ? `<button class="btn sm" data-ed="${h(c.sku)}">✎ Editar</button>` : ""}</div></div>
    <div class="dp-stock">${fis.length ? `<div class="dp-k"><span>Disponible</span><b>${fm(t.c)}</b><small>cajas · ${fm(t.e)} estibas</small></div><div class="dp-k"><span>Módulos de bodega</span><b>${fm(mods.size)}</b><small>${mods.size === 1 ? "⚠️ único módulo" : "con producto disponible"}</small></div><div class="dp-k"><span>Bloqueado</span><b>${fm(fis.length - disp.length)}</b><small>ubicaciones</small></div>` : `<div class="note">Sin existencias físicas en bodega.</div>`}</div>
    ${fis.length ? `<div class="dp-cans">${["T1", "T2", "KA"].map(canalFila).join("")}</div>` : ""}
    ${g("📦 Estiba y presentación", [["Presentación", c.pres], ["Cant x estiba", c.cantEst], ["Cubicaje", c.cub], ["Piso", c.piso], ["Plancha", c.plancha], ["Est. por cara", c.estCara]])}
    ${g("🚦 Reglas", [["Vida útil", c.vida ? c.vida + " días" : ""], ["Mínimo (pocos)", c.minimo || "10 (general)"], ["Días T1", c.t1], ["Días T2", c.t2], ["Días KA", c.ka], ["Contexto", c.ctx]])}
  </article>`;
}
VISTAS.producto = async (el, p, vigente) => {
  await Promise.all([cargarCat(), cargarInv().catch(() => null)]);
  if (!vigente()) return;
  let sku = p.sku || ls.get("ultProd", "");
  const c0 = sku && S.cat.find(c => c.sku === sku);
  el.innerHTML = cab("🔍 Información de producto", "Escribe el nombre o el SKU y escoge el producto de la lista.") +
    barraBusqueda("bq", "SKU o nombre (ej: pony go 2l · 3659)", c0 ? `${c0.sku} · ${c0.prod}` : "", "Buscar") + `<div id="br"></div>`;
  const inp = $("#bq", el);
  const pintar = () => {
    const c = sku && S.cat.find(x => x.sku === sku);
    $("#br", el).innerHTML = c ? detalleProducto(c) : (sku ? vacio("Ese producto ya no está en la hoja Sku.", "❌") : `<div class="muted small dp-ayuda">👆 Escribe y escoge un producto de la lista para ver toda su información.</div>`);
  };
  const escoger = c => { sku = c.sku; ls.set("ultProd", sku); inp.value = `${c.sku} · ${c.prod}`; pintar(); };
  autoSku(inp, escoger, { max: 30 });
  alLimpiar(inp, () => { sku = ""; ls.set("ultProd", ""); pintar(); });
  // «Buscar» o Enter sin escoger: el que más se parece
  const buscar = () => { const q = inp.value.trim(); if (!q) return; const m = q.match(/^(\d+)\s*(·|$)/); const c = m ? S.cat.find(x => x.sku === m[1]) : buscarCat(q, 1)[0]; if (c) escoger(c); else { sku = ""; $("#br", el).innerHTML = vacio("No se encontró ningún producto.", "❌"); } };
  $("#bqB", el).onclick = buscar;
  inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.defaultPrevented) buscar(); });
  $("#br", el).onclick = e => {
    const b = e.target.closest("[data-sku]"); if (b) return ir("stock", { sku: b.dataset.sku });
    const ed = e.target.closest("[data-ed]"); if (ed) modalSku(S.cat.find(x => x.sku === ed.dataset.ed), pintar);
  };
  pintar();
  if (p.q && !p.sku) { inp.value = p.q; buscar(); }
};

// =====================================================================
// BÚSQUEDA GRUPAL
// =====================================================================
VISTAS.grupo = async (el, p, vigente) => {
  const [inv] = await Promise.all([cargarInv(), cargarCat()]);
  if (!vigente()) return;
  let filtro = canalAct() || "DISP", verKA = false;
  el.innerHTML = cab("📦 Búsqueda grupal", "Varios SKUs a la vez: las 2 mejores ubicaciones de cada uno") +
    barraBusqueda("gq", "SKUs o nombres: 2222 3810, pony go 2l, aguila lata", ls.get("ultGrupo", ""), "Buscar", "Varios productos: SKUs separados por espacio; nombres separados por coma") + `<div id="gr"></div>`;
  // Cada parte separada por coma: números = SKUs; texto = el producto que más se parece
  const leer = t => String(t || "").split(/[,;\n]+/).map(x => x.trim()).filter(x => x).flatMap(x => /^[\d\s]+$/.test(x) ? x.match(/\d+/g) : [(buscarCat(x.replace(/^\d+\s*·\s*/, ""), 1)[0] || { sku: (x.match(/^(\d+)/) || [])[1] }).sku]).filter(x => x);
  const pintar = () => {
    const skus = leer($("#gq", el).value).filter((v, k, a) => a.indexOf(v) === k);
    ls.set("ultGrupo", $("#gq", el).value.trim());
    if (!skus.length) { $("#gr", el).innerHTML = ""; return; }
    const segBtn = (f, t) => `<button data-f="${f}" class="${filtro === f ? "on" : ""}">${t}</button>`;
    let html = canalBanner() + `<div class="lista-tools"><div class="seg" id="gf">${segBtn("DISP", "Disponible")}${segBtn("ALL", "Todos")}${segBtn("T1", "T1")}${segBtn("T2", "T2")}${segBtn("KA", "KA")}</div><label class="toggle"><input type="checkbox" id="gk" ${verKA ? "checked" : ""}> Mostrar KA / PREV</label></div>${LEYENDA}`;
    skus.forEach(s => {
      const f = S.cat.find(c => c.sku === s);
      if (!f) { html += `<h2>❌ <span class="sku">${h(s)}</span></h2><div class="note">No existe en la hoja Sku.</div>`; return; }
      const fis = inv.filter(i => i.s === s && i.fis);
      html += `<h2>${skuTxt(s, fis[0] ? fis[0].p : f.prod)}</h2>`;
      if (!fis.length) { html += `<div class="note">Sin existencias físicas registradas en bodega.</div>`; return; }
      const lis = fis.filter(i => verKA || !i.esOp).filter(i => filtro === "ALL" ? true : filtro === "DISP" ? i.disp : cumpleCanal(i, filtro)).sort((a, b) => (filtro === "T2" && reempPrimero(a, b)) || ordConsumo(a, b));
      if (!lis.length) {
        const otros = CANALES[filtro] ? fis.filter(i => (verKA || !i.esOp) && i.disp).sort(ordConsumo) : [];
        if (otros.length) { html += `<div class="note warn no-cumple">⛔ Sí hay, pero no cumple los requisitos de <b>${h(CANALES[filtro])}</b>${otros[0].min && otros[0].min[filtro] ? ` (mínimo ${h(otros[0].min[filtro])} días)` : ""}. Dónde está:</div><div class="grid">${otros.slice(0, 2).map(i => invCard(i, { producto: false })).join("")}</div>${otros.length > 2 ? `<div class="small muted" style="margin-top:6px">+${otros.length - 2} ubicaciones más · <button class="link" data-sku="${h(s)}">ver todas</button></div>` : ""}`; return; }
        html += `<div class="note">${fis.some(i => i.esOp) && !verKA ? "Agotado en pasillos generales (disponible en KA / PREV)." : "Filtrado u oculto por canal."}</div>`; return; }
      html += `<div class="grid">${lis.slice(0, 2).map(i => invCard(i, { producto: false })).join("")}</div>`;
      if (lis.length > 2) html += `<div class="small muted" style="margin-top:6px">+${lis.length - 2} ubicaciones más · <button class="link" data-sku="${h(s)}">ver todas</button></div>`;
    });
    $("#gr", el).innerHTML = html;
    $("#gf", el).onclick = e => { const b = e.target.closest("button"); if (b) { filtro = b.dataset.f; pintar(); } };
    $("#gk", el).onchange = e => { verKA = e.target.checked; pintar(); };
  };
  $("#gr", el).addEventListener("click", e => { const b = e.target.closest("[data-sku]"); if (b) ir("stock", { sku: b.dataset.sku }); });
  $("#gqB", el).onclick = pintar; $("#gq", el).onkeydown = e => { if (e.key === "Enter") pintar(); };
  alLimpiar($("#gq", el), () => { ls.set("ultGrupo", ""); $("#gr", el).innerHTML = ""; });
  pintar();
};

// =====================================================================
// POR MÓDULO
// =====================================================================
function limpiarMod(q) {
  const s = String(q || "").trim().toUpperCase().replace(/\s+/g, " ");
  let x = s.match(/^F\s*AUX\s*(\d+)$/); if (x) return "H" + (+x[1]);
  x = s.match(/^CARPA\s*M\s*(\d+)$/); if (x) return "M" + (+x[1]);
  return s;
}
VISTAS.modulo = async (el, p, vigente) => {
  const inv = await cargarInv();
  if (!vigente()) return;
  const q = limpiarMod(p.mod || ls.get("ultMod", ""));
  el.innerHTML = cab("📍 Por módulo", "Una letra para todo el pasillo (B = B1, B2…) o el módulo exacto (B12, KA3, M4, H2)") +
    barraBusqueda("mq", "Módulo o pasillo (ej: B o B12)", q, "Ver") + `<div id="mr"></div>`;
  const ver = () => { const v = $("#mq", el).value.trim(); ls.set("ultMod", v); ir("modulo", { mod: v }); };
  $("#mqB", el).onclick = ver;
  autoModulo($("#mq", el), modulosConProducto(inv), x => { ls.set("ultMod", x.m); ir("modulo", { mod: x.m }); }, { primero: false, dejar: true, alEnter: ver });
  alLimpiar($("#mq", el), () => { ls.set("ultMod", ""); $("#mr", el).innerHTML = ""; });
  if (!q) { $("#mr", el).innerHTML = ""; return; }
  const esPasillo = q.length <= 2 && !/\d/.test(q);
  const re = new RegExp("^" + q.replace(/[^A-Z]/g, "") + "\\d+$");
  const cn = canalAct();
  const todos = inv.filter(i => i.fis && (esPasillo ? re.test(i.m) : i.m === q)).sort((a, b) => (cn === "T2" && reempPrimero(a, b)) || ordPrioModD(a, b));
  // Pasillo con canal encendido: solo lo que cumple (lo demás, si se pide)
  const nNo = cn && esPasillo ? todos.filter(i => !cumpleCanal(i)).length : 0;
  const lis = nNo && !p.todo ? todos.filter(i => cumpleCanal(i)) : todos;
  let arriba = canalBanner(nNo ? (p.todo ? `<button class="link" data-solo-canal>ver solo lo que cumple</button>` : `<button class="link" data-todo-canal>ver también ${nNo} que no cumple${nNo > 1 ? "n" : ""}</button>`) : "");
  if (!esPasillo && S.ocup[q]) {
    const o = S.ocup[q];
    arriba = `<div class="card" style="margin-bottom:12px"><b>Ocupación:</b> ${fm(o.usadas)} / ${fm(o.capTot)} estibas (${o.caras} caras × ${o.porCara}) · ${o.libres <= 0 ? `<span class="pill bad">MÓDULO LLENO</span>` : `<span class="pill ok">Faltan ${fm(o.libres)} estibas</span>`}</div>`;
  }
  if (!esPasillo) arriba += `<div class="rep-atajos">${lis.length && !repVacio(q) ? `<button class="btn sm" data-rep="repvacio">⬜ Reportar ${h(q)} vacío</button>` : ""}<button class="btn sm" data-rep="repconflicto">⚠️ Reportar conflicto en ${h(q)}</button></div>`;
  el.onclick = e => { const b = e.target.closest("[data-rep]"); if (b) return ir(b.dataset.rep, { m: q });
    if (e.target.closest("[data-todo-canal]")) return ir("modulo", { mod: q, todo: 1 });
    if (e.target.closest("[data-solo-canal]")) return ir("modulo", { mod: q }); };
  const r = $("#mr", el);
  if (!lis.length) { r.innerHTML = arriba + (todos.length ? vacio(`Nada en ${q} cumple ${CANALES[cn]}.`, "⛔") : vacio(`Módulo ${q} vacío o no existe.`, "📭")); return; }
  r.innerHTML = "<div></div>";
  listaInv(r.firstChild, { titulo: `Inventario en ${h(q)}`, arriba, items: lis });
};

// =====================================================================
// ZONAS, CARPA, BARRILES, RETORNABLES, FECHA
// =====================================================================
VISTAS.pk = el => vistaFiltro(el, { titulo: "🛒 Picking / Preventa", sub: "Módulos PREV y ubicaciones de picking", filtro: i => i.esPK, orden: ordPrioModD, vacio: "Zona PK sin existencias." });
VISTAS.ka = el => vistaFiltro(el, { titulo: "🏬 KA (grandes superficies)", sub: "Módulos KA", filtro: i => i.esKA, orden: ordPrioModD, vacio: "Zona KA sin existencias." });

VISTAS.carpa = async (el, p, vigente) => {
  const lis = await api("webCarpa");
  if (!vigente()) return;
  const con = lis.filter(x => !x.vacio).length;
  el.innerHTML = cab("⛺ Carpa (M1 a M15)", `${con} módulos con producto · ${lis.length - con} vacíos`, botonesPDF("CARPA", "PDF carpa")) + LEYENDA +
    `<div class="carpa-grid">${lis.map(x => `<button class="carpa-t ${x.vacio ? "vacio" : "v-" + h(x.vida)}" data-m="${h(x.m)}">
      <div class="row sb"><span class="m">${h(x.m)}</span>${x.vacio ? `<span class="pill">Vacío</span>` : (x.bloq ? `<span class="pill bad">BLOQ</span>` : "")}</div>
      ${x.ocup ? `<div class="sub">${fm(x.ocup.usadas)} / ${fm(x.ocup.capTot)} estibas</div>` : ""}
      ${x.items.slice(0, 3).map(i => `<div class="l"><span class="sku">${h(i.s)}</span> ${h(i.p)}<br><span class="muted">${fm(i.e)} Estibas · ${fm(i.c)} Cajas · ${i.d === 9999 ? "sin fecha" : i.d + " d"}</span></div>`).join("")}
      ${x.items.length > 3 ? `<div class="sub">+${x.items.length - 3} más</div>` : ""}</button>`).join("")}</div>`;
  el.onclick = e => {
    const b = e.target.closest(".carpa-t"); if (!b) return;
    const x = lis.find(y => y.m === b.dataset.m); if (!x || x.vacio) return;
    abrirModal(`<h3>⛺ Módulo ${h(x.m)}</h3>${x.ocup ? `<p class="muted small">Ocupación ${fm(x.ocup.usadas)} / ${fm(x.ocup.capTot)} estibas</p>` : ""}<div class="grid">${x.items.map(i => invCard(Object.assign({ emp: "Cajas", fis: true }, i), { canales: false, carpa: false })).join("")}</div><div class="modal-actions"><button class="btn" data-x>Cerrar</button></div>`, { wide: true });
  };
};

VISTAS.barriles = async (el, p, vigente) => {
  const b = await api("webBarriles");
  if (!vigente()) return;
  el.innerHTML = cab("🛢️ Barriles", "Módulo BARRILES en orden FEFO (primero lo que vence antes)", botonesPDF("BARRILES", "PDF barriles")) +
    (b.lotes.length ? `<table class="tabla resp" style="margin-bottom:16px"><thead><tr><th>SKU</th><th>Producto</th><th class="num">Unidades</th><th>Lotes</th><th>Vence primero</th></tr></thead><tbody>${b.resumen.map(r => `<tr><td data-l="SKU" class="sku">${h(r.s)}</td><td data-l="Producto">${h(r.p)}</td><td data-l="Unidades" class="num"><b>${fm(r.u)}</b></td><td data-l="Lotes">${r.lotes}</td><td data-l="Vence">${h(r.vf)}${r.dMin !== 9999 ? ` (${r.dMin} d)` : ""}</td></tr>`).join("")}</tbody></table>
      ${LEYENDA}<div class="grid">${(() => { let n = 0; return b.lotes.map(i => invCard(Object.assign({ emp: "Cajas", fis: true }, i), { canales: false, fefo: repVacio(i.m) ? 0 : ++n })).join(""); })()}</div>` : vacio("No hay producto en el módulo BARRILES.", "🛢️"));
};

VISTAS.retornables = async (el, p, vigente) => {
  const inv = await cargarInv();
  if (!vigente()) return;
  let filtro = ls.get("retFiltro", "DISP");
  el.innerHTML = cab("🍾 Retornables", "Bodega general, top 2 FEFO por producto (sin KA / PREV). Lo que tiene prioridad siempre va primero.", botonesPDF("RETORNABLE", "PDF retornables")) +
    `<div class="lista-tools"><div class="seg" id="rf"><button data-f="DISP">Disponible</button><button data-f="BLOQ">Bloqueado</button><button data-f="ALL">Todos</button></div><span class="count" id="rc"></span></div>${LEYENDA}<div id="rr"></div>`;
  const pintar = () => {
    $$("#rf button", el).forEach(b => b.classList.toggle("on", b.dataset.f === filtro));
    const gr = {};
    inv.forEach(i => { if (i.fis && !i.esOp && i.ret && (filtro === "ALL" || (filtro === "DISP" ? i.disp : !i.disp))) (gr[i.s] = gr[i.s] || { p: i.p, s: i.s, u: [] }).u.push(i); });
    const lG = Object.values(gr).map(g => { g.u.sort((a, b) => (repVacio(a.m) ? 1 : 0) - (repVacio(b.m) ? 1 : 0) || ordPrioVence(a, b)); g.prio = g.u.some(x => x.prio); return g; }).sort((a, b) => prio(a, b) || cmpSku(a, b));
    $("#rc", el).textContent = `${lG.length} productos`;
    $("#rr", el).innerHTML = lG.length ? lG.map(g => `<h2>${skuTxt(g.s, g.p)}${g.prio ? ` <span class="tag t-prio">🚨 Prioridad</span>` : ""}</h2><div class="grid">${g.u.slice(0, 2).map((i, k) => invCard(i, { producto: false, fefo: i.disp && !repVacio(i.m) ? k + 1 : 0 })).join("")}</div>`).join("")
      : vacio(filtro === "BLOQ" ? "No hay retornables bloqueados." : "No hay retornables en almacenamiento general.");
  };
  $("#rf", el).onclick = e => { const b = e.target.closest("[data-f]"); if (!b) return; filtro = b.dataset.f; ls.set("retFiltro", filtro); pintar(); };
  pintar();
};

VISTAS.fecha = async (el, p, vigente) => {
  const inv = await cargarInv();
  if (!vigente()) return;
  const f = p.f || ls.get("ultFecha", "");
  el.innerHTML = cab("📅 Fecha exacta", "Todo el inventario que vence en una fecha") +
    `<div class="form-row"><label class="field" style="max-width:260px"><span>Fecha de vencimiento</span><input type="date" id="fq" value="${h(f)}"></label><button class="btn primary" id="fb">Buscar</button></div><div id="fr"></div>`;
  const ver = () => { const v = $("#fq", el).value; ls.set("ultFecha", v); ir("fecha", { f: v }); };
  $("#fb", el).onclick = ver; $("#fq", el).onchange = ver;
  if (!f) { $("#fr", el).innerHTML = `<div class="note">Escoge una fecha.</div>`; return; }
  const lis = inv.filter(i => i.fis && i.v === f).sort((a, b) => prio(a, b) || cmpSku(a, b));
  if (!lis.length) { $("#fr", el).innerHTML = vacio(`No hay inventario físico que venza el ${fechaDMY(f)}.`, "📭"); return; }
  const r = $("#fr", el); r.innerHTML = "<div></div>";
  listaInv(r.firstChild, { titulo: `Vence el ${h(fechaDMY(f))}`, items: lis });
};

// =====================================================================
// CALIDAD
// =====================================================================
VISTAS.vencidos = el => vistaFiltro(el, { titulo: "🛑 Vencidos", sub: "Ubicaciones con producto vencido", filtro: i => i.d < 0, orden: ordPrioD, vacio: "Bodega libre de productos vencidos." });
// Fechas cortas: disponibles (quizás aún en bodega sin identificar) o bloqueadas (ya identificadas, en carpa esperando vencer)
const FC_EST = {
  DISP: { t: "✅ Disponibles", nota: "Fecha corta <b>disponible</b>: puede estar todavía en bodega <b>sin identificar</b>. Revisa, muévela a carpa y bloquéala.", vacio: "No hay fechas cortas disponibles en ese plazo." },
  BLOQ: { t: "❌ Bloqueadas", nota: "Fecha corta <b>bloqueada</b>: ya está identificada (normalmente en carpa), a la espera de vencer para darla de baja.", vacio: "No hay fechas cortas bloqueadas en ese plazo." },
  ALL: { t: "Todas", nota: "", vacio: "Cero resultados en ese plazo." }
};
VISTAS.fechas = async (el, p, vigente) => {
  const dias = p.dias || +ls.get("ultDias", 60) || 60;
  const est = FC_EST[p.est] ? p.est : (FC_EST[ls.get("fcEst", "DISP")] ? ls.get("fcEst", "DISP") : "DISP");
  const inv = await cargarInv();
  if (!vigente()) return;
  const enPlazo = inv.filter(i => i.fis && i.d >= 0 && i.d <= dias);
  const n = { DISP: enPlazo.filter(i => i.disp).length, BLOQ: enPlazo.filter(i => !i.disp).length, ALL: enPlazo.length };
  listaInv(el, {
    titulo: `⏳ Fechas cortas (≤ ${dias} días)`, sub: "Producto que vence dentro del plazo indicado",
    tools: `<label class="field" style="width:130px"><span>Días</span><input type="number" min="1" id="fd" value="${dias}"></label><button class="btn" id="fdb" style="align-self:flex-end">Aplicar</button>`,
    arriba: `<div class="lista-tools"><div class="seg" id="fe">${Object.keys(FC_EST).map(k => `<button data-f="${k}" class="${k === est ? "on" : ""}">${FC_EST[k].t} <span class="sec-n">${n[k]}</span></button>`).join("")}</div></div>${FC_EST[est].nota ? `<div class="note small ayuda" style="margin:6px 0 10px">${FC_EST[est].nota}</div>` : ""}`,
    items: enPlazo.filter(i => est === "ALL" || (est === "DISP" ? i.disp : !i.disp)).sort(ordPrioD), vacio: FC_EST[est].vacio,
    alMontar: e2 => {
      const ap = () => { const v = parseInt($("#fd", e2).value, 10) || 60; ls.set("ultDias", v); ir("fechas", { dias: v, est: est }); };
      $("#fdb", e2).onclick = ap; $("#fd", e2).onkeydown = ev => { if (ev.key === "Enter") ap(); };
      $("#fe", e2).onclick = ev => { const b = ev.target.closest("[data-f]"); if (!b) return; ls.set("fcEst", b.dataset.f); ir("fechas", { dias: dias, est: b.dataset.f }); };
    }
  });
};
VISTAS.bloqueados = el => vistaFiltro(el, { titulo: "❌ Bloqueados", sub: "Ubicaciones con estado distinto a DISPONIBLE", filtro: i => !i.disp, orden: ordPrioModD, vacio: "No hay productos bloqueados." });
VISTAS.candados = el => vistaFiltro(el, { titulo: "🔒 Candados / bloqueos", sub: "Código de candado u observación de cada bloqueo", filtro: i => !i.disp, orden: ordPrioModD, vacio: "No hay productos bloqueados.", card: i => ({ extra: `🔑 <b>${h(i.cand || i.obs || "Sin candado registrado")}</b>` }) });
VISTAS.prioridades = el => vistaFiltro(el, { titulo: "🚨 Con prioridad", sub: "Observación con «prioridad» en el WMS", filtro: i => i.prio, orden: ordPrioD, vacio: "Sin prioridades activas." });
VISTAS.tpc = el => vistaFiltro(el, { titulo: "🏷️ Tapacódigos en bodega", tools: botonesPDF("TPC", "PDF tapacódigos"), filtro: i => i.tpc, orden: ordPrioD, vacio: "Sin tapacódigos activos." });
VISTAS.reempaque = el => vistaFiltro(el, { titulo: "📦 Reempaques en bodega", filtro: i => i.reemp, orden: ordPrioD, vacio: "Sin reempaques activos." });

async function vistaAvanzado(el, tipo, vigente) {
  const lis = await api("webAvanzados", tipo);
  if (!vigente()) return;
  const t = tipo === "MERMA" ? { titulo: "📉 Merma", sub: "Bloqueado y a menos de 30 días de vencer" } : { titulo: "⚠️ Mal ubicados", sub: "Producto en KA o Picking/Preventa que no cumple los días mínimos del canal" };
  listaInv(el, Object.assign(t, { items: lis.map(i => Object.assign({ emp: "Cajas" }, i)), vacio: "Zonas limpias. Cero infracciones.", card: i => ({ canales: false, extra: `📌 ${h(i.sT)}${i.sug ? `<br>💡 <b>${h(i.sug)}</b>` : ""}` }) }));
}
VISTAS.malubicados = (el, p, v) => vistaAvanzado(el, "MALUBICADOS", v);
VISTAS.merma = (el, p, v) => vistaAvanzado(el, "MERMA", v);

VISTAS.mezclados = async (el, p, vigente) => {
  const lis = await api("webMezclados");
  if (!vigente()) return;
  el.innerHTML = cab("🔀 Módulos con 2 o más SKUs", "Pasillos A a J (sin H, PREV ni KA). Posible error de ubicación en el WMS") +
    (lis.length ? `${LEYENDA}${lis.map(g => `<h2>${h(g.m)} <span class="muted small">${g.skus.length} SKUs</span></h2>
    <div class="mini-list">${g.skus.map(x => `<div class="mini v-${h(x.vida)}">${skuTxt(x.s, x.p)} · ${qty(x.e, x.c, x.u)} · vence ${h(x.vf)} (${x.d === 9999 ? "sin fecha" : x.d + " d"})${x.disp ? "" : ` · <b style="color:var(--bad)">❌ ${h(x.est)}</b>`}</div>`).join("")}</div>`).join("")}` : vacio("Ningún módulo de los pasillos A a J tiene dos productos distintos."));
};

VISTAS.infiltrados = async (el, p, vigente) => {
  const r = await api("webInfiltrados");
  if (!vigente()) return;
  el.innerHTML = cab("👻 Infiltrados y fantasmas", "Diferencias entre el WMS y la hoja Sku") +
    `<h2>❌ Faltan en la hoja Sku (físicos en el WMS) · ${r.infWMS.length}</h2>` +
    (r.infWMS.length ? `${LEYENDA}<div class="grid">${r.infWMS.map(i => invCard(Object.assign({ emp: "Cajas" }, i), { canales: false })).join("")}</div>` : vacio("Todos los productos del WMS están en la hoja Sku.")) +
    `<h2>🌫️ Fantasmas (en la hoja Sku, 0 en el WMS) · ${r.fantasmas.length}</h2>` +
    (r.fantasmas.length ? `<table class="tabla resp"><thead><tr><th>SKU</th><th>Producto</th></tr></thead><tbody>${r.fantasmas.map(f => `<tr><td data-l="SKU" class="sku">${h(f.s)}</td><td data-l="Producto">${h(f.p)}</td></tr>`).join("")}</tbody></table>` : vacio("Sin fantasmas."));
};

// =====================================================================
// GESTIÓN
// =====================================================================
VISTAS.resumen = async (el, p, vigente) => {
  const [r, inv] = await Promise.all([api("webResumen"), cargarInv()]);
  if (!vigente()) return;
  const bloq = inv.filter(i => i.fis && !i.disp).sort(cmpMod);
  const fila = (l, n, v) => `<tr><td data-l="Indicador">${l}</td><td data-l="Valor" class="num"><b>${fm(n)}</b></td><td class="acc">${v ? `<button class="btn sm" data-go="${v}">Ver</button>` : ""}</td></tr>`;
  el.innerHTML = cab("📊 Resumen gerencial", "Estado general, alertas de calidad y etiquetas activas", [["Prioridad", botonesPDF("INFORME", "Informe de prioridad (todos los productos)")], ["En riesgo", botonesPDF("INFORME", "Solo en riesgo (≤ 45 días)", "riesgo")], ["Resumen", botonesPDF("RESUMEN", "PDF resumen (5 págs)")]].map(([t, b]) => `<div class="pdf-grupo"><span>${t}</span>${b}</div>`).join("")) +
    `<table class="tabla resp"><thead><tr><th>Indicador</th><th class="num">Valor</th><th></th></tr></thead><tbody>
      ${fila("🧯 SKUs bajo su mínimo", r.cPocos, "pocos")}${fila("📦 SKUs críticos (&lt; 3 estibas)", r.c3, "pocos")}${fila("🔀 Módulos con 2+ SKUs", r.cMezcla, "mezclados")}
      ${fila("🌫️ Mercancía en limbo", r.mLimbo, "limbo")}${fila("🥤 SKUs de consumo interno", r.mConsumo, "consumo")}
      ${fila("🛑 Ubicaciones vencidas", r.cVencidos, "vencidos")}${fila("⏳ Riesgo (&lt; 45 días)", r.cRiesgo, "fechas|45")}${fila("❌ Bloqueados", r.cBloq, "bloqueados")}
      ${fila("🚨 Prioridad FEFO", r.cPrio, "prioridades")}${fila("🏷️ Tapacódigos", r.cTpc, "tpc")}${fila("📦 Reempaques", r.cReem, "reempaque")}
    </tbody></table><div id="rb"></div>`;
  el.querySelector("tbody").onclick = e => { const b = e.target.closest("[data-go]"); if (!b) return; const [v, d] = b.dataset.go.split("|"); ir(v, d ? { dias: +d } : {}); };
  $("#rb", el).innerHTML = bloq.length ? `<h2>🚫 Detalle de bloqueos en el WMS (${bloq.length})</h2>${LEYENDA}<div class="grid">${bloq.map(i => invCard(i, { canales: false })).join("")}</div>` : `<h2>🚫 Bloqueos</h2>` + vacio("No hay productos bloqueados en bodega.");
};

VISTAS.pocos = async (el, p, vigente) => {
  const lis = await api("webPocos");
  if (!vigente()) return;
  el.innerHTML = cab("🧯 Pocos en bodega", "SKUs con menos estibas disponibles que su mínimo (columna Minimo de la hoja Sku; vacío = 10)", botonesPDF("POCOS", "Formato de auditoría")) +
    `<div class="lista-tools"><input type="search" id="pq" placeholder="Filtrar SKU o producto…"><span class="count" id="pc"></span></div><div id="pr"></div>`;
  // Los vigilados (alerta de pocos) van primero, marcados con 🔔
  const vig = new Set(S.pocosVig || []);
  lis.sort((a, b) => (vig.has(b.s) ? 1 : 0) - (vig.has(a.s) ? 1 : 0));
  const pintar = () => {
    const q = norm($("#pq", el).value).split(/\s+/).filter(x => x);
    const items = lis.filter(it => coincide(norm(it.s + " " + it.p), q) > 0);
    $("#pc", el).textContent = `${items.length} SKUs`;
    $("#pr", el).innerHTML = items.length ? `<div class="grid">${items.map(it => `<article class="card">
      <div class="row sb"><b style="font-size:15.5px">${skuTxt(it.s, it.p)}</b><span>${vig.has(it.s) ? `<span class="pill warn" title="Producto vigilado (alerta de pocos)">🔔 Vigilado</span> ` : ""}${it.prio ? `<span class="pill bad">🚨 PRIORIDAD</span>` : ""}</span></div>
      <div class="sub">≈ <b>${fm(it.eq)}</b> estibas de mínimo <b>${fm(it.minimo)}</b> · Bodega ≈ ${fm(it.zonas.bodega)} est · KA ${fm(it.zonas.ka)} cajas · PK ${fm(it.zonas.pk)} cajas</div>
      <div style="margin:8px 0 4px">${qty(it.totE, it.totC, it.totU)}</div>
      <div class="mini-list">${it.locs.map(l => `<div class="mini v-${h(l.vida)}"><b>${h(l.m)}</b> · ${fm(l.e)} Estibas | ${fm(l.c)} Cajas · vence ${h(l.vf)} (${l.d === 9999 ? "sin fecha" : l.d + " d"})</div>`).join("")}</div>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-sku="${h(it.s)}">Ver stock →</button></div></article>`).join("")}</div>` : vacio(lis.length ? "Nada coincide." : "Ningún SKU está por debajo de su mínimo.");
  };
  $("#pq", el).oninput = pintar;
  $("#pr", el).onclick = e => { const b = e.target.closest("[data-sku]"); if (b) ir("stock", { sku: b.dataset.sku }); };
  pintar();
};

// Formulario del limbo (registrar y corregir): el SKU va si ya se sabe cuál es (tiene que existir en la hoja Sku)
function formLimbo(x) {
  x = x || {};
  const v = k => h(x[k] === null || x[k] === undefined || (typeof x[k] === "number" && !x[k] && k !== "sku") ? "" : x[k]);
  return `<div class="lb-form">
    <label class="field lb-ancho"><span>Producto</span><input type="text" data-l="nombre" value="${h(x.p || "")}" placeholder="Ej: Michelob 210 x6"></label>
    <label class="field lb-sku"><span>SKU (si existe)</span><input type="search" data-l="sku" value="${x.sku ? h(x.sku + (x.skuProd ? " · " + x.skuProd : "")) : ""}" placeholder="Nombre o SKU" autocomplete="off"></label>
    <label class="field lb-fecha"><span>Vencimiento</span><input type="date" data-l="fecha" value="${h(x.vIso || "")}"></label>
    <label class="field"><span>Presentación</span><input type="text" data-l="pres" list="lpres" value="${v("pres")}" placeholder="Lata, TW…"></label>
    <label class="field"><span>Cubicaje</span><input type="text" data-l="cub" value="${v("cub")}" placeholder="330cc"></label>
    <div class="lb-cant"><label class="field"><span>Estibas</span><input type="text" inputmode="decimal" data-l="e" value="${v("e")}" placeholder="0"></label>
      <label class="field"><span>Cajas</span><input type="text" inputmode="decimal" data-l="c" value="${v("c")}" placeholder="0"></label>
      <label class="field"><span>Unidades</span><input type="text" inputmode="decimal" data-l="u" value="${v("u")}" placeholder="0"></label></div>
    <datalist id="lpres"><option>Lata</option><option>Retornable</option><option>Pet</option><option>TW</option><option>Barril</option></datalist></div>`;
}
// Lee el formulario; con SKU escogido, el nombre y la presentación se llenan solos si están vacíos
function prepararFormLimbo(box) {
  const sk = $("[data-l=sku]", box);
  autoSku(sk, c => {
    sk.dataset.sku = c.sku;
    const n = $("[data-l=nombre]", box), pr = $("[data-l=pres]", box);
    if (!n.value.trim()) n.value = c.prod;
    if (!pr.value.trim() && c.pres) pr.value = c.pres;
  });
  sk.addEventListener("input", () => { delete sk.dataset.sku; });
  return () => {
    const g = k => $(`[data-l=${k}]`, box).value.trim();
    const t = g("sku"), m = t.match(/^(\d+)/);
    return { nombre: g("nombre"), fecha: g("fecha"), pres: g("pres"), cub: g("cub"), sku: sk.dataset.sku || (m ? m[1] : ""), skuTxt: t, e: g("e"), c: g("c"), u: g("u") };
  };
}
const validarLimbo = o => !o.nombre || !o.fecha ? "Escribe el producto y la fecha de vencimiento." : (o.skuTxt && !o.sku ? "Escoge el SKU de la lista (o déjalo vacío si no se sabe)." : "");
VISTAS.limbo = async (el, p, vigente) => {
  const [lis] = await Promise.all([api("webLimbo"), cargarCat().catch(() => null)]);
  if (!vigente()) return;
  const esc = puede("validador");
  const cant = x => x.e || x.c || x.u ? qty(x.e, x.c, x.u) : `<span class="small muted">Sin cantidades</span>`;
  el.innerHTML = cab("🌫️ Mercancía en limbo", "Producto físico que aún no tiene SKU asignado en el WMS. Si ya sabes cuál es, ponle el SKU.") +
    (esc ? `<details class="card lb-nuevo" ${lis.length ? "" : "open"} style="margin:0 0 14px"><summary>➕ Registrar producto en limbo</summary>
      ${formLimbo()}<div class="lb-acc"><button class="btn primary" id="lb">Guardar</button></div></details>` : "") +
    (lis.length ? `${LEYENDA}<div class="grid">${lis.map(x => `<article class="card inv v-${h(x.vida)}"><div class="row sb"><span class="mono small">${h(x.id)}</span>${esc ? `<span class="lb-bts"><button class="btn sm" data-ed="${h(x.id)}">✎ Editar</button><button class="btn sm del" data-del="${h(x.id)}" title="Eliminar" aria-label="Eliminar ${h(x.id)}">${ICO_DEL}</button></span>` : ""}</div>
      <div class="prod">${h(x.p)}</div>${x.sku ? `<div class="lb-skuv">🔖 ${skuTxt(x.sku, x.skuProd || "")}</div>` : `<div class="small muted">Sin SKU</div>`}
      <div style="margin:6px 0">${cant(x)}</div>
      <div class="vence">Vence <b>${h(x.v)}</b>${x.dias !== 9999 ? ` · ${x.dias < 0 ? "Vencido" : x.dias + " días"}` : ""}</div>
      <div class="small">Presentación: <b>${h(x.pres || "N/A")}</b> · Cubicaje: <b>${h(x.cub || "N/A")}</b></div><div class="act">Reportado: ${h(x.fecha)}</div></article>`).join("")}</div>` : vacio("No hay productos pendientes de SKU."));
  if (esc) {
    const leer = prepararFormLimbo($(".lb-nuevo", el));
    $("#lb", el).onclick = async () => {
      const obj = leer(), mal = validarLimbo(obj); if (mal) { toast(mal, "bad"); return; }
      const b = $("#lb", el); ocupado(b, true);
      try { const id = await api("webLimboAgregar", obj); ocupado(b, false); toast(`Añadido al limbo con ID ${id}`, "ok"); ir("limbo"); } catch (e) { ocupado(b, false); toast(e.message, "bad", 6000); }
    };
  }
  el.onclick = async e => {
    const ed = e.target.closest("[data-ed]");
    if (ed) {
      const x = lis.find(y => y.id === ed.dataset.ed); if (!x) return;
      const m = abrirModal(`<h3>✎ Limbo ${h(x.id)}</h3>${formLimbo(x)}<div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="lbE">Guardar</button></div>`);
      const leerE = prepararFormLimbo(m);
      if (x.sku) $("[data-l=sku]", m).dataset.sku = x.sku;
      $("#lbE", m).onclick = async () => {
        const obj = leerE(), mal = validarLimbo(obj); if (mal) { toast(mal, "bad"); return; }
        const b = $("#lbE", m); ocupado(b, true);
        try { await api("webLimboEditar", x.id, obj); ocupado(b, false); cerrarModal(true); toast("Registro corregido", "ok"); ir("limbo"); } catch (er) { ocupado(b, false); toast(er.message, "bad", 6000); }
      };
      return;
    }
    const b = e.target.closest("[data-del]"); if (!b) return;
    if (!(await confirmar("Eliminar del limbo", `¿Eliminar el registro <b>${h(b.dataset.del)}</b>?`, "Eliminar", true))) return;
    try { await api("webLimboEliminar", b.dataset.del); toast("Registro eliminado", "ok"); ir("limbo"); } catch (er) { toast(er.message, "bad"); }
  };
};

// =====================================================================
// SLOTTING
// =====================================================================
// Organizar bodega en dos partes: retornable y lata. Cada persona escoge qué secciones entran en cada una
// (queda guardado); lo que se mueve y a donde se mueve quedan dentro de la misma parte.
const ORG_PARTES = { ret: { t: "🍾 Retornable", def: ["A", "B", "C", "D"] }, lata: { t: "🥫 Lata", def: ["H", "M", "I", "F", "E", "G"] } };
const orgSecs = () => { const p = (S.usuario && S.usuario.prefs && S.usuario.prefs.orgSecs) || {}; const r = {}; Object.keys(ORG_PARTES).forEach(k => r[k] = Array.isArray(p[k]) ? p[k] : ORG_PARTES[k].def); return r; };
VISTAS.organizar = async (el, p, vigente) => {
  const inv = await cargarInv();
  if (!vigente()) return;
  let parte = ORG_PARTES[ls.get("orgParte", "")] ? ls.get("orgParte", "") : "ret", filtroF = ls.get("orgFefo", "ALL"), lis = [], editando = false;
  // Secciones que hay en bodega (sin KA ni PREV, que nunca se organizan)
  const todas = [...new Set(inv.filter(i => i.fis && !i.esKA && !i.esPK).map(i => seccionMod(i.m)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  el.innerHTML = cab("🧩 Organizar bodega", "Movimientos sugeridos para liberar módulos (mismo SKU repartido). Retornable y lata por separado: lo que se mueve se queda en las secciones de su parte.") +
    `<div class="seg org-partes" id="oP">${Object.keys(ORG_PARTES).map(k => `<button data-p="${k}">${ORG_PARTES[k].t}</button>`).join("")}</div>
    <div class="card org-secs" id="oS"></div>${LEYENDA}
    <div class="lista-tools"><input type="search" id="oq" placeholder="Buscar por SKU, producto o módulo…"><div class="seg" id="of"><button data-f="ALL">Todos</button><button data-f="OK">✅ FEFO se cumple</button><button data-f="MAL">⚠️ FEFO en riesgo</button></div><span class="count" id="oc"></span></div><div id="or"></div>`;
  const pintarSecs = () => {
    const sel = orgSecs()[parte];
    $$("#oP button", el).forEach(b => b.classList.toggle("on", b.dataset.p === parte));
    $("#oS", el).innerHTML = editando
      ? `<div class="org-st"><b>Secciones de ${ORG_PARTES[parte].t}</b><span class="small muted">Toca para poner o quitar</span></div>
        <div class="org-chips">${todas.map(x => `<button type="button" class="org-chip ${sel.includes(x) ? "on" : ""}" data-s="${h(x)}">${h(nombreSeccion(x))}</button>`).join("")}</div>
        <div class="org-acc"><button class="btn sm" data-def>↺ Las de siempre</button><button class="btn sm primary" data-listo>Listo</button></div>`
      : `<div class="org-st"><span>Secciones: ${sel.length ? sel.map(x => `<span class="org-chip on mini">${h(nombreSeccion(x))}</span>`).join("") : `<span class="muted">ninguna</span>`}</span><button class="btn sm" data-cambiar>✎ Cambiar</button></div>`;
  };
  const guardarSecs = async lista => {
    const v = Object.assign(orgSecs(), { [parte]: lista });
    S.usuario.prefs = Object.assign({}, S.usuario.prefs, { orgSecs: v }); ls.setJ("usuario", S.usuario);
    pintarSecs(); await calcular();
    try { S.usuario.prefs = await api("webPref", "orgSecs", v); ls.setJ("usuario", S.usuario); } catch (e) { toast(e.message, "bad", 5000); }
  };
  const calcular = async () => {
    const sel = orgSecs()[parte];
    if (!sel.length) { lis = []; pintar(); return; }
    $("#or", el).innerHTML = loader();
    try { lis = await api("webOrganizar", sel); } catch (e) { $("#or", el).innerHTML = errBox(e); return; }
    if (vigente()) pintar();
  };
  const pintar = () => {
    $$("#of button", el).forEach(b => b.classList.toggle("on", b.dataset.f === filtroF));
    const q = norm($("#oq", el).value).split(/\s+/).filter(x => x);
    const it = lis.filter(s2 => (filtroF === "ALL" || (filtroF === "OK" ? s2.fefoOk !== false : s2.fefoOk === false)) && (!q.length || coincide(norm(`${s2.sku} ${s2.p} ${s2.from} ${s2.to}`), q) > 0));
    $("#oc", el).textContent = `${it.length} movimientos`;
    $("#or", el).innerHTML = !orgSecs()[parte].length ? vacio(`Escoge las secciones de ${ORG_PARTES[parte].t}.`, "🧩") : it.length ? `<div class="grid">${it.map(s2 => `<article class="card inv v-${h(s2.vida)}">
    <div class="prod">${skuTxt(s2.sku, s2.p)}</div><div class="fefo-est ${s2.fefoOk === false ? "mal" : "bien"}"><b>${h(s2.fefo)}</b>${s2.fefoDet ? `<div class="small">${h(s2.fefoDet)}</div>` : ""}</div>
    <div style="font-size:16px;margin:6px 0">👉 Mover ${modChip(s2.from)} → ${modChip(s2.to)}</div>
    ${qty(s2.e, s2.c, s2.u)}
    <div class="vence">Vence <b>${h(s2.vf)}</b> · ${s2.d === 9999 ? "sin fecha" : s2.d + " días"}</div>
    <div class="extra">Beneficio: ${modChip(s2.from)} queda libre.</div><div class="act">Act: ${h(s2.actTxt)}</div></article>`).join("")}</div>` : vacio(lis.length ? "Nada coincide con la búsqueda." : `${ORG_PARTES[parte].t}: organizado. No hay nada por consolidar.`, lis.length ? "🔎" : "✅");
  };
  $("#oP", el).onclick = e => { const b = e.target.closest("[data-p]"); if (!b || b.dataset.p === parte) return; parte = b.dataset.p; ls.set("orgParte", parte); editando = false; pintarSecs(); calcular(); };
  $("#oS", el).onclick = e => {
    if (e.target.closest("[data-cambiar]")) { editando = true; pintarSecs(); return; }
    if (e.target.closest("[data-listo]")) { editando = false; pintarSecs(); return; }
    if (e.target.closest("[data-def]")) { guardarSecs(ORG_PARTES[parte].def.slice()); return; }
    const c = e.target.closest("[data-s]"); if (!c) return;
    const sel = orgSecs()[parte], x = c.dataset.s;
    guardarSecs(sel.includes(x) ? sel.filter(y => y !== x) : sel.concat(x));
  };
  $("#of", el).onclick = e => { const b = e.target.closest("[data-f]"); if (!b) return; filtroF = b.dataset.f; ls.set("orgFefo", filtroF); pintar(); };
  $("#oq", el).oninput = pintar;
  pintarSecs(); calcular();
};
VISTAS.huecos = async (el, p, vigente) => {
  const lis = await api("webHuecos");
  if (!vigente()) return;
  el.innerHTML = cab("🕳️ Huecos en bodega", "Capacidad = caras (Capacidad_Bodega) × estibas por cara del producto que está en el módulo") +
    `<div class="lista-tools"><input type="search" id="hq" placeholder="Filtrar módulo o producto…"><span class="count" id="hc"></span></div><div id="hr"></div>`;
  const pintar = () => {
    const q = norm($("#hq", el).value);
    const it = lis.filter(x => !q || norm(x.modulo + " " + x.prod).includes(q));
    $("#hc", el).textContent = `${it.length} módulos`;
    $("#hr", el).innerHTML = it.length ? `<table class="tabla resp"><thead><tr><th>Módulo</th><th class="num">Usado</th><th class="num">Capacidad</th><th class="num">Caben</th><th>Ocupa</th></tr></thead><tbody>${it.map(x => `<tr><td data-l="Módulo">${modChip(x.modulo)}</td><td data-l="Usado" class="num">${fm(x.estAct)}</td><td data-l="Capacidad" class="num">${fm(x.cTot)} <span class="muted small">(${x.caras}×${x.porCara})</span></td><td data-l="Caben" class="num"><b style="color:var(--ok)">${fm(x.libres)}</b></td><td data-l="Ocupa" class="small">${h(x.prod)}</td></tr>`).join("")}</tbody></table>` : vacio(lis.length ? "Nada coincide." : "Bodega al 100%. No hay huecos.", lis.length ? "🔎" : "❌");
  };
  $("#hq", el).oninput = pintar; pintar();
};
VISTAS.vacios = async (el, p, vigente) => {
  const lis = await api("webVacios");
  if (!vigente()) return;
  const secs = {};
  lis.forEach(x => (secs[x.sec || x.zona] = secs[x.sec || x.zona] || []).push(x.m));
  const orden = Object.keys(secs).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const nombre = k => ({ M: "Carpa (M)", KA: "KA", PREV: "Picking preventa", H: "Módulos H", BARRILES: "Barriles" }[k] || (/^[A-Z]$/.test(k) ? "Pasillo " + k : k));
  el.innerHTML = cab("⬜ Módulos 100% vacíos", "Solo los módulos que existen en físico (pestaña Capacidad_Bodega), sin inventario. Agrupados por pasillo.") +
    (lis.length ? `<div class="count" style="margin:4px 0 10px">${lis.length} módulos vacíos</div>` + orden.map(z => `<h2>${h(nombre(z))} <span class="muted small">(${secs[z].length})</span></h2><div class="vac-grid">${secs[z].map(m => modChip(m)).join("")}</div>`).join("") : vacio("No hay módulos 100% vacíos.", "❌"));
};
VISTAS.consolidar = async (el, p, vigente) => {
  const lis = await api("webConsolidar");
  if (!vigente()) return;
  el.innerHTML = cab("🧹 Picoteo y sueltas", "SKUs con estibas incompletas regadas en 3 o más módulos") + (lis.length ? lis.map(g => `<h2>${skuTxt(g.s, g.p)} <span class="muted small">· ${g.locs.length} módulos</span></h2>
    <div class="mini-list">${g.locs.map(l => `<div class="mini v-${h(l.vida)}"><b>${h(l.m)}</b> · ${fm(l.e)} Estibas | ${fm(l.c)} Cajas | ${fm(l.u)} Unidades · vence ${h(l.vf)} (${l.d === 9999 ? "sin fecha" : l.d + " d"}) · <span class="muted">${h(l.actTxt)}</span></div>`).join("")}</div>`).join("") : vacio("Cero regueros en bodega."));
};
VISTAS.acomodar = async (el, p) => {
  await cargarCat().catch(() => null);
  el.innerHTML = cab("🎯 Acomodar ingreso", "Dónde ubicar un ingreso sin tapar mercancía más vieja") +
    barraBusqueda("as", "SKU o nombre del producto", p.sku || "", "", "Producto") +
    `<div class="form-row"><label class="field" style="max-width:220px"><span>Vencimiento del ingreso</span><input type="date" id="af" value="${h(p.f || "")}"></label><button class="btn primary sm" id="ab">Calcular</button></div><div id="ar"></div>`;
  let sku = p.sku || "";
  autoSku($("#as", el), c => { sku = c.sku; });
  alLimpiar($("#as", el), () => { sku = ""; $("#ar", el).innerHTML = ""; });
  $("#ab", el).onclick = async () => {
    const v = $("#as", el).value.trim(), m = v.match(/^(\d+)/); if (m) sku = m[1]; else if (v) { const r = buscarCat(v, 1); if (r.length) sku = r[0].sku; }
    const f = $("#af", el).value;
    if (!sku || !f) { toast("Escribe el SKU y la fecha.", "bad"); return; }
    $("#ar", el).innerHTML = loader("Calculando…");
    try {
      const r = await api("webAcomodar", sku, f);
      $("#ar", el).innerHTML = `<div class="card" style="margin-bottom:12px">${skuTxt(r.sku, r.prodName)} · ingreso vence <b>${h(r.fIngTxt)}</b></div>` +
        (r.opciones.length ? `<div class="note ayuda">🔹 FEFO correcto (lo que hay vence igual o después) · 🔸 Taparía mercancía más vieja</div><div class="grid">${r.opciones.map(o => `<article class="card" style="border-left:5px solid ${o.fefoOk ? "var(--cyan)" : "var(--warn)"}">
          <div class="row sb"><span style="font-weight:800;font-size:17px">${o.fefoOk ? "🔹" : "🔸"} ${h(o.modulo)}</span><span class="pill ${o.fefoOk ? "info" : "warn"}">${o.fefoOk ? "FEFO correcto" : "Tapa mercancía vieja"}</span></div>
          <div>Caben <b>${fm(o.libres)}</b> estibas de ${fm(o.capTot)}</div><div class="small">Lote existente vence <b>${h(o.vf)}</b> (${o.dias === 9999 ? "sin fecha" : o.dias + " d"})</div><div class="act">Act: ${h(o.actTxt)}</div></article>`).join("")}</div>`
        : `<div class="err">Sin espacio en las ubicaciones actuales del producto.</div><h2>💡 Módulos vacíos sugeridos</h2>${r.vacios.length ? `<div class="vac-grid">${r.vacios.map(m => `<span>${h(m.m)}<br><small class="muted">caben ${fm(m.cap)}</small></span>`).join("")}</div>` : vacio("No hay módulos vacíos.", "❌")}`);
    } catch (e) { $("#ar", el).innerHTML = errBox(e); }
  };
};
// Fecha de envasado: producto + vencimiento → fecha de producción (vencimiento − vida útil)
// y fecha límite de salida de cada canal (vencimiento − días mínimos del canal)
VISTAS.envasado = async (el, p, vigente) => {
  await cargarCat();
  if (!vigente()) return;
  let prod = null;
  el.innerHTML = cab("🧮 Fecha de envasado", "Escoge el producto y la fecha de vencimiento: sale la fecha de producción (vencimiento menos la vida útil de la hoja Sku) y hasta cuándo puede salir a cada canal (vencimiento menos sus días mínimos).") +
    `<div class="card env-form"><div class="env-campos">
      <div class="env-prod">${campoAuto("eP", "Nombre o SKU")}</div>
      <label class="field env-f"><span>Fecha de vencimiento</span><input type="date" id="ef"></label>
      <label class="field env-v"><span>Vida útil (días)</span><input type="text" inputmode="numeric" id="eV" placeholder="de la hoja Sku"></label>
      <button class="btn primary" id="eb">Calcular</button></div><div class="small muted" id="eVh"></div></div><div id="er"></div>`;
  const pintarVida = () => {
    $("#eV", el).value = prod && prod.vida ? prod.vida : "";
    $("#eVh", el).textContent = !prod ? "" : prod.vida ? `Vida útil de ${prod.sku} en la hoja Sku: ${prod.vida} días (puedes cambiarla solo para este cálculo).` : `${prod.sku} no tiene vida útil en la hoja Sku: escríbela en días${puede("administrador") ? " (o guárdala en Productos)" : ""}.`;
  };
  autoSku($("#eP", el), c => { prod = c; pintarVida(); });
  $("#eP", el).addEventListener("input", () => { prod = null; pintarVida(); });
  const calcular = async () => {
    if (!prod) { toast("Escoge el producto de la lista.", "bad"); return; }
    const f = $("#ef", el).value;
    if (!f) { toast("Escoge la fecha de vencimiento.", "bad"); return; }
    const v = $("#eV", el).value.trim();
    try {
      const r = await api("webEnvasadoProducto", prod.sku, f, String(v) === String(prod.vida || "") ? "" : v);
      const est = n => n < 0 ? `<span class="pill bad">Ya pasó (hace ${-n} d)</span>` : n === 0 ? `<span class="pill warn">Hoy es el último día</span>` : `<span class="pill ok">Faltan ${n} d</span>`;
      $("#er", el).innerHTML = `<div class="card env-res"><div class="env-t">${skuTxt(r.sku, r.prod)}</div>
        <div class="env-g">
          <div class="env-k env-prodk"><span>🏭 Fecha de producción</span><b>${h(r.produccion)}</b><small>${h(r.vence)} menos ${fm(r.vida)} días de vida útil${r.edad >= 0 ? ` · tiene ${fm(r.edad)} días` : ""}</small></div>
          <div class="env-k"><span>⏳ Vencimiento</span><b>${h(r.vence)}</b><small>${r.venceFaltan < 0 ? `Vencido hace ${-r.venceFaltan} días` : `Faltan ${fm(r.venceFaltan)} días`}</small></div></div>
        <div class="env-st">Fecha límite de salida por canal</div>
        <div class="env-cans">${r.canales.map(c => `<div class="env-can ${c.faltan < 0 ? "no" : "si"}"><b>${h(CANALES[c.c] || c.c)}</b><span class="env-l">${h(c.limite)}</span><small>Mínimo ${fm(c.min)} días antes de vencer</small>${est(c.faltan)}</div>`).join("")}</div></div>`;
    } catch (e) { $("#er", el).innerHTML = errBox(e); }
  };
  $("#eb", el).onclick = calcular;
  $("#ef", el).addEventListener("keydown", e => { if (e.key === "Enter") calcular(); });
};

// =====================================================================
// REPORTES
// =====================================================================
VISTAS.reportes = async el => {
  const pdfs = [
    ["INFORME", "📊 Informe de prioridad de consumo", "Todos los productos, del que vence primero al último, con su color y hacia dónde moverlo según el vencimiento"],
    ["INFORME", "🚨 Prioridad de consumo · solo en riesgo", "Solo lo vencido y lo que vence en 45 días o menos (rojo, amarillo y gris)", "riesgo"],
    ["RESUMEN", "📋 Resumen gerencial (5 páginas)", "Riesgo, mal ubicados, bloqueados, etiquetas, limbo y vencidos"],
    ["POCOS", "🧯 Formato de pocos", "Hoja de auditoría física de los SKUs bajo su mínimo"],
    ["CONSUMO", "🥤 Consumo · completo", "Todos los módulos de cada SKU con el de consumo resaltado"],
    ["CONSUMO_SOLO", "🎯 Consumo · solo módulos a consumir", "Una fila por SKU, para quien saca el producto"],
    ["RETORNABLE", "🍾 Retornables (top FEFO)", "Letra grande para bodega"],
    ["CARPA", "⛺ Mapa de carpa", "M1 a M15 con lo que hay en cada módulo"],
    ["BARRILES", "🛢️ Barriles (FEFO)", "Módulo BARRILES en orden de vencimiento"],
    ["TPC", "🏷️ Tapacódigos", "Por producto: módulos, cantidades y vencimiento"],
    ["VALIDACION", "📝 Validación del turno abierto", "Saldo por producto, horas de conteo y de validación"],
    ["ENTREGA", "📋 Entrega del turno abierto", "Bodega, TPC, PK y KA en dos columnas, y notas"],
    ["CONCILIACION", "⚖️ Conciliación (abierta o la última)", "Conteos por área contra facturación"]
  ];
  if (S.instructivo) pdfs.push(["INSTRUCTIVO", "📘 Instructivo", "Manual de uso del bot"]);
  el.innerHTML = cab("📄 Reportes PDF", "Descárgalos; para enviarlos al grupo de Telegram usa el botón ✈️ de cada uno") +
    `<div style="display:flex;flex-direction:column;gap:10px">${pdfs.map(p => `<div class="card pdf-row"><div class="t"><b>${p[1]}</b><div class="sub ayuda">${p[2]}</div></div><div class="row">${botonesPDF(p[0], "Descargar", p[3])}</div></div>`).join("")}</div>
    <p class="muted small ayuda" style="margin-top:14px">Los PDF de turnos y conciliaciones anteriores están en <button class="link" id="goH">Historial</button>.</p>`;
  $("#goH", el).onclick = () => ir("historial");
};

// =====================================================================
// TURNO COMPARTIDO (validación + entrega de turno)
// =====================================================================
// Turno según la hora de Bogotá: 22–6 → 1 · 6–14 → 2 · 14–22 → 3 (se puede cambiar a mano)
function turnoPorHora() {
  let hr;
  try { hr = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", hour: "numeric", hourCycle: "h23" }).format(new Date())) % 24; }
  catch (e) { hr = new Date().getHours(); }
  return hr >= 22 || hr < 6 ? 1 : hr < 14 ? 2 : 3;
}
// Tres formas de guardar (cerrar): solo guardar · guardar y descargar el PDF · guardar y enviarlo al grupo
const botonesCierre = (id, dis) => `<div class="modal-actions cierre-acc">
  <button class="btn sm c-verde" data-modo="solo" id="${id}S" ${dis}>💾 Solo guardar</button>
  ${S.grupoTg ? `<button class="btn sm c-azul btn-ico" data-modo="tg" id="${id}T" ${dis}><span class="ic">${ICO.tg}</span> Guardar y enviar al grupo</button>` : ""}
  <button class="btn sm c-amar btn-ico" data-modo="pdf" id="${id}P" ${dis}><span class="ic">${ICO.pdf}</span> Guardar y descargar PDF</button>
  <button class="btn sm c-rojo" data-x>Cancelar</button></div>`;
// Al final de la página, pequeños: cancelar (borde rojo) o guardar (borde verde) el turno o la conciliación
const botonGuardar = (accion, texto, cancelar, textoCancelar) => `<div class="fin-acc">${cancelar ? `<button type="button" class="btn sm b-rojo" data-a="${cancelar}" title="Pide tu PIN">✖ ${h(textoCancelar)}</button>` : "<span></span>"}<button type="button" class="btn b-verde" data-a="${accion}">💾 ${h(texto)}</button></div>`;
// Lista para escoger de qué conciliación anterior copiar (filas de colores alternos; la escogida queda marcada)
const listaCopiar = (id, ants, conNinguna) => `<div class="cp-lista" id="${id}" role="listbox">${conNinguna ? `<button type="button" data-cp="" class="on"><b>No copiar</b></button>` : ""}${ants.map((x, k) => `<button type="button" data-cp="${h(x.id)}" class="${!conNinguna && !k ? "on" : ""}"><b>${h(x.texto)}</b><span>${x.productos} productos</span></button>`).join("")}</div>`;
document.addEventListener("click", e => { const b = e.target.closest(".cp-lista [data-cp]"); if (!b) return; $$("[data-cp]", b.parentNode).forEach(x => x.classList.toggle("on", x === b)); });
const cpElegida = (c, id) => { const b = $(`#${id} .on`, c); return b ? b.dataset.cp : ""; };

// La tarjeta del turno (y la de la conciliación) queda recogida: se ve el número y se despliega si el usuario quiere
const infoAbierta = () => ls.get("infoTurno", "") === "1";
const clsInfo = () => infoAbierta() ? "" : " plegada";
const togInfo = () => `<button type="button" class="turno-tog" data-info-tog title="Ver u ocultar la información" aria-expanded="${infoAbierta()}"><span class="tt-v">ℹ️ Ver</span><span class="tt-o">Ocultar ▴</span></button>`;
document.addEventListener("click", e => {
  const b = e.target.closest("[data-info-tog]"); if (!b) return;
  e.stopPropagation();
  const ab = !infoAbierta(); ls.set("infoTurno", ab ? "1" : "");
  $$(".turno[data-info]").forEach(x => x.classList.toggle("plegada", !ab));
  $$("[data-info-tog]").forEach(x => x.setAttribute("aria-expanded", ab ? "true" : "false"));
  if (ab) requestAnimationFrame(() => ajustarBarras());   // los botones de la tarjeta se miden ya visibles
}, true);

// ---------- piezas comunes de validación, conciliación y entrega ----------
// Presentación (columna Presentacion de Sku): PET, Lata, Retornable, TW, Barril y lo demás
const PRES_ORDEN = ["PET", "LATA", "RETORNABLE", "TW", "BARRIL"];
const presNorm = t => { const x = norm(t || "").toUpperCase(); return /\bPET\b/.test(x) ? "PET" : /\bLATA/.test(x) ? "LATA" : /RETORNABLE|\bRET\b/.test(x) ? "RETORNABLE" : /\bTW\b/.test(x) ? "TW" : /BARRIL|\bBRRL\b|\bBRL\b/.test(x) ? "BARRIL" : ""; };
// (para lo que todavía no confirmó el servidor)
const famDe = (sku, prod) => { const c = (S.cat || []).find(x => x.sku === sku); return presNorm(c && c.pres) || presNorm(prod || (c && c.prod)) || "OTROS"; };
const rangoPres = f => { const k = PRES_ORDEN.indexOf(f); return k === -1 ? PRES_ORDEN.length : k; };
const porPres = (a, b) => rangoPres(a.familia || famDe(a.sku, a.producto)) - rangoPres(b.familia || famDe(b.sku, b.producto)) || porNombre(a, b);
const NOMBRE_PRES = { PET: "PET", LATA: "Lata", RETORNABLE: "Retornable", TW: "TW", BARRIL: "Barril", OTROS: "Otros" };
// Grupos por presentación que se recogen y despliegan; se recuerda cuáles cerró el usuario
S.famCerradas = S.famCerradas || {};
// Ordena por presentación (PET, Lata, Retornable, TW, Barril, otros), una debajo de la otra y sin títulos
function gruposFamilia(clave, items, tarjeta, extra, orden) {
  return items.slice().sort((a, b) => rangoPres(a.familia || famDe(a.sku, a.producto)) - rangoPres(b.familia || famDe(b.sku, b.producto)) || (orden || porNombre)(a, b)).map(tarjeta).join("");
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-famtog]"); if (!b) return;
  const k = b.dataset.famtog; S.famCerradas[k] = !S.famCerradas[k];
  b.closest(".fam-g").classList.toggle("cerrada", S.famCerradas[k]); b.setAttribute("aria-expanded", String(!S.famCerradas[k]));
});
// Cajas por estiba de un SKU (columna «Cant x Estibas» de Sku; si no tiene, la del WMS)
const cpeDe = sku => { const c = (S.cat || []).find(x => x.sku === sku); const n = c ? parseInt(c.cantEst, 10) : 0; if (n > 0) return n; const i = (S.inv || []).find(x => x.s === sku && x.cpe > 1); return i ? i.cpe : 0; };
// Al buscar se abren los grupos y se esconden los que no tienen resultados
function filtrarGrupos(el, buscando, sel) {
  el.classList.toggle("buscando", buscando);
  $$(".fam-g, .pc-g", el).forEach(g => g.classList.toggle("hidden", !$$(sel + ":not(.hidden)", g).length));
}
// Selector pequeño propio (el del celular abre una lista enorme)
const miniSel = (id, opciones, valor, ph, otro) => `<div class="mini-sel" id="${id}" data-v="${h(valor || "")}"><button type="button" class="ms-b"><span class="ms-t">${h(valor || ph || "Escoge…")}</span><span aria-hidden="true">▾</span></button>
  <div class="ms-l hidden" role="listbox">${opciones.map(o => `<button type="button" data-o="${h(o)}" class="${o === valor ? "on" : ""}">${h(o)}</button>`).join("")}${otro ? `<button type="button" data-o="__otro" class="ms-otro">${h(otro)}</button>` : ""}</div></div>`;
document.addEventListener("click", e => {
  const ms = e.target.closest(".mini-sel");
  $$(".mini-sel .ms-l:not(.hidden)").forEach(l => { if (!ms || l.parentNode !== ms) l.classList.add("hidden"); });
  if (!ms) return;
  const o = e.target.closest("[data-o]");
  if (o) {
    ms.dataset.v = o.dataset.o; $(".ms-t", ms).textContent = o.dataset.o === "__otro" ? o.textContent : o.dataset.o;
    $$("[data-o]", ms).forEach(x => x.classList.toggle("on", x === o)); $(".ms-l", ms).classList.add("hidden");
    ms.dispatchEvent(new Event("elegido", { bubbles: true })); return;
  }
  if (e.target.closest(".ms-b")) {
    const l = $(".ms-l", ms); l.classList.toggle("hidden");
    if (l.classList.contains("hidden")) return;
    // Si abajo no cabe (fin de la ventana o del teclado), la lista se abre hacia arriba
    l.classList.remove("arriba");
    const caja = ms.closest(".modal-card") || document.documentElement;
    const r = ms.getBoundingClientRect(), lim = Math.min(caja.getBoundingClientRect().bottom, window.visualViewport ? window.visualViewport.height + window.visualViewport.offsetTop : window.innerHeight);
    const alto = l.scrollHeight;
    if (r.bottom + alto + 8 > lim && r.top - alto - 8 > (caja.getBoundingClientRect ? Math.max(0, caja.getBoundingClientRect().top) : 0)) l.classList.add("arriba");
  }
});
// Botón flotante de agregar (abajo a la derecha)
const fab = (accion, titulo) => `<button type="button" class="fab" data-a="${accion}" title="${h(titulo)}" aria-label="${h(titulo)}">＋</button>`;
// Hora pequeña y editable, con su calendario, al lado de un título
const aInputHora = t => t ? String(t).replace(" ", "T").slice(0, 16) : ahoraLocal();
const horaTxt = v => { const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/); return m ? `${m[3]}/${m[2]} ${m[4]}:${m[5]}` : "—"; };
const horaEd = (id, valor, etiqueta) => `<label class="hora-ed" title="${h(etiqueta || "Cambiar la hora")}"><span class="he-t">🕐 <b data-hora="${id}">${horaTxt(aInputHora(valor))}</b> 📅</span><input type="datetime-local" data-fm="1" id="${id}" value="${h(aInputHora(valor))}" aria-label="${h(etiqueta || "Hora")}"></label>`;
// La hora se ve como texto pequeño; al tocarla se abre el calendario del celular
document.addEventListener("change", e => { const i = e.target.closest(".hora-ed input"); if (!i) return; const b = document.querySelector(`[data-hora="${i.id}"]`); if (b) b.textContent = horaTxt(i.value); });
document.addEventListener("click", e => { const l = e.target.closest(".hora-ed"); if (!l) return; const i = l.querySelector("input"); if (i && i.showPicker) { e.preventDefault(); try { i.showPicker(); } catch (x) { i.focus(); } } });

function pintarBarra(cont, te, compacto, extra) {
  if (!cont) return;
  S.turno = te;
  const esc = puede("validador");
  let html;
  if (!te || !te.turno) {
    html = `<section class="card turno cerrado"><div class="turno-info"><div class="turno-num" style="color:var(--bad)">—</div>
      <div><div class="k">Turno</div><div class="v">No hay turno abierto</div></div>
      ${te && te.ultimo ? `<div class="solo-escritorio"><div class="k">Último</div><div class="v">${h(te.ultimo.texto)} · cerrado por ${h(te.ultimo.cerradoPor)}</div></div>` : ""}</div>
      <div class="acciones">${compacto ? `<span class="muted small">Se abre desde Entrega de turno</span>` : esc ? `<button class="btn primary" data-t="abrir">Abrir turno</button>` : `<span class="muted small">Un validador debe abrir el turno.</span>`}</div></section>`;
  } else {
    const t = te.turno;
    html = `<section class="card turno${clsInfo()}" data-info="turno"><div class="turno-info"><div class="turno-num">T${h(t.numero)}</div>
      <div class="t-res">${h(t.texto)}</div>${togInfo()}
      <div><div class="k">Turno</div><div class="v">${h(t.texto)} <span class="muted small solo-escritorio">(${h(t.horario)})</span></div></div>
      <div><div class="k">Abierto por</div><div class="v">${h(t.abiertoPor)} · ${h(soloHora(t.inicio))}</div></div>
      ${t.recibeDe ? `<div class="solo-escritorio"><div class="k">Recibe de</div><div class="v">${h(t.recibeDe.replace(/^Recibe de /, ""))}</div></div>` : ""}</div>
      ${extra ? `<div class="acciones barra-acc acc-inf">${extra}</div>` : ""}<div class="acciones barra-acc">${compacto ? `<button class="btn sm" data-t="val"><span class="ic">📝</span><span class="txt">Validaciones</span></button><button class="btn sm" data-t="ent"><span class="ic">📋</span><span class="txt">Entrega</span></button>` : ""}${esc && compacto && puedoEliminar(t.abiertoPor) ? `<button class="btn sm del" data-t="cancelar" title="Cancelar turno (deshacer)"><span class="ic">✖</span><span class="txt">Cancelar</span></button>` : ""}${esc && compacto ? `<button class="btn warn sm" data-t="cerrar"><span class="ic">💾</span><span class="txt">Guardar turno</span></button>` : ""}</div></section>`;
  }
  if (cont.__html !== html) { cont.innerHTML = html; cont.__html = html; }
  cont.onclick = e => {
    const b = e.target.closest("[data-t]"); if (!b) return;
    e.stopPropagation();
    if (b.dataset.t === "abrir") modalAbrirTurno(te);
    else if (b.dataset.t === "cerrar") modalCerrarTurno();
    else if (b.dataset.t === "cancelar") cancelarTurno(te.turno);
    else if (b.dataset.t === "val") ir("validacion");
    else if (b.dataset.t === "ent") ir("entrega");
  };
}
// Pinta de una vez con lo guardado y luego con lo fresco
async function barraTurno(cont, compacto) {
  const c = S.turno || ls.getJ("turno", null);
  if (c) pintarBarra(cont, c, compacto); else cont.innerHTML = loader("Cargando turno…");
  try { const te = await api("webTurno"); ls.setJ("turno", te); if (document.body.contains(cont)) pintarBarra(cont, te, compacto); }
  catch (e) { if (!c) cont.innerHTML = errBox(e); }
}

// Cancelar el turno abierto: se deshace completo (validación y entrega). Las conciliaciones no se tocan.
async function cancelarTurno(t) {
  if (!t) return;
  if (!(await pedirPin("✖ Cancelar turno", `¿Cancelar el <b>${h(t.texto || "turno abierto")}</b>?<br><br>Se deshace su <b>validación</b> y su <b>entrega de turno</b> y queda como si no se hubiera abierto. Las conciliaciones no se tocan. Un administrador lo puede restaurar desde el historial.<br><br>Para no cancelarlo por error, escribe tu PIN.`, "Cancelar turno"))) return;
  try { await api("webTurnoEliminar", t.id); S.turno = null; S.val = null; S.ent = null; ls.del("turno"); ls.del("val"); ls.del("ent"); toast("Turno cancelado", "ok"); repintar(); }
  catch (er) { toast(er.message, "bad", 7000); }
}

function modalAbrirTurno(te) {
  let num = turnoPorHora();
  const hor = (te && te.horarios) || { 1: "10 p.m. – 6 a.m.", 2: "6 a.m. – 2 p.m.", 3: "2 p.m. – 10 p.m." };
  const ult = (te && te.cerrados) || [];
  const c = abrirModal(`<h3>Abrir turno</h3><p class="muted small">Escoge tu turno. No se puede abrir otro hasta cerrar este.</p>
    <div class="num-pick" id="np">${[1, 2, 3].map(n => `<button type="button" data-n="${n}" class="${n === num ? "on" : ""}"><b>${n}</b><span>${h(String(hor[n] || "").replace(/:00/g, ""))}</span></button>`).join("")}</div>
    ${te && te.ultimo ? `<p class="small" style="margin:4px 0 8px">Recibes de <b>${h(te.ultimo.texto)}</b> de <b>@${h(te.ultimo.cerradoPor)}</b>.</p>` : ""}
    ${ult.length ? `<label class="check" id="atHL"><input type="checkbox" id="atH"><span>Heredar los productos de la validación de un turno anterior (se puede editar después)</span></label>
      <div id="atHB" class="hidden">
        <div class="seg seg-sm" id="atHM"><button type="button" data-hm="saldos" class="on">Con sus saldos</button><button type="button" data-hm="blanco">En blanco (solo los nombres)</button></div>
        <div class="small muted" style="margin:6px 0 4px">¿De qué turno? (los últimos ${ult.length})</div>
        <div class="ht-lista">${ult.map((t, k) => `<label class="ht-op ${k === 0 ? "on" : ""}"><input type="radio" name="atT" value="${h(t.id)}" ${k === 0 ? "checked" : ""}>
          <span class="ht-t"><b>${h(t.texto)}</b><span class="small muted">@${h(t.cerradoPor)} · cerró ${h(fechaCorta(t.cierre))}</span></span><span class="pill">${fm(t.productos)} prod.</span></label>`).join("")}</div>
      </div>` : `<p class="muted small">No hay turnos cerrados de los que heredar.</p>`}
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="atOk">Abrir turno</button></div>`);
  $("#np", c).onclick = e => { const b = e.target.closest("[data-n]"); if (!b) return; num = +b.dataset.n; $$("#np button", c).forEach(x => x.classList.toggle("on", x === b)); };
  // Heredar con los saldos o en blanco (solo los productos, para contarlos de nuevo), del turno que se escoja
  let modoH = "saldos";
  if ($("#atH", c)) {
    $("#atH", c).addEventListener("change", () => $("#atHB", c).classList.toggle("hidden", !$("#atH", c).checked));
    $("#atHM", c).onclick = e => { const b = e.target.closest("[data-hm]"); if (!b) return; modoH = b.dataset.hm; $$("#atHM button", c).forEach(x => x.classList.toggle("on", x === b)); };
    $(".ht-lista", c).addEventListener("change", () => $$(".ht-op", c).forEach(o => o.classList.toggle("on", $("input", o).checked)));
  }
  $("#atOk", c).onclick = async () => {
    const btn = $("#atOk", c); ocupado(btn, true, "Abriendo…");
    const her = $("#atH", c) && $("#atH", c).checked ? (modoH === "blanco" ? "blanco" : true) : false;
    const desde = her ? (($("input[name=atT]:checked", c) || {}).value || "") : "";
    try {
      const r = await api("webTurnoAbrir", num, her, desde);
      ocupado(btn, false); cerrarModal(true);
      S.turno = r.turno; ls.setJ("turno", r.turno); S.val = null; S.ent = null; ls.del("val"); ls.del("ent");
      toast(`Turno ${num} abierto${r.resultado.heredados ? `. Heredó ${r.resultado.heredados} producto(s) en validación` : ""}.`, "ok", 6000);
      repintar();
    } catch (e) { ocupado(btn, false); toast(e.message, "bad", 7000); }
  };
}

async function modalCerrarTurno() {
  const c = abrirModal(loader("Revisando el turno…"), { wide: true });
  let v, en;
  try { [v, en] = await Promise.all([api("webVal"), api("webEnt")]); }
  catch (e) { c.innerHTML = errBox(e.red ? "Para cerrar el turno necesitas conexión." : e) + `<div class="modal-actions"><button class="btn" data-x>Cerrar</button></div>`; $$("[data-x]", c).forEach(b => b.onclick = () => cerrarModal()); return; }
  if (!v.turno) { cerrarModal(true); toast("No hay turno abierto.", "bad"); return; }
  const conf = v.registros.filter(r => r.estado === "CONFLICTO").length;
  const pend = cola().length + S.enviando.length;
  const nSec = s => en.secciones[s].length;
  c.innerHTML = `<h3>Guardar ${h(v.turno.texto)}</h3>
    <p class="muted small">El turno se cierra y la validación y la entrega quedan en el historial. Escoge si solo guardar, descargar los dos PDF o enviarlos al grupo. Si se te olvida algo, después lo puedes editar desde el historial.</p>
    ${pend ? `<div class="err">Hay ${pend} cambio(s) que aún no suben. Espera a que suban antes de guardar.</div>` : ""}
    ${conf ? `<div class="note warn">⚠️ Hay ${conf} validación(es) en conflicto. Quedarán así si no las corriges o anulas.</div>` : ""}
    <div class="kv-list">
      <div><span>📝 Productos en validación</span><b>${v.productos.length}</b></div>
      <div><span>✔ Validaciones activas</span><b>${v.registros.filter(r => r.estado === "ACTIVO").length}</b></div>
      <div><span>📋 Bodega · TPC · KA · PK</span><b>${nSec("BODEGA")} · ${nSec("TPC")} · ${nSec("KA")} · ${nSec("PK")}</b></div>
      <div><span>🗒️ Puntos en la nota</span><b>${en.notas.length}</b></div></div>
    <label class="field"><span>Nota de cierre (opcional)</span><textarea id="ctN" placeholder="Algo más para el siguiente turno…"></textarea></label>
    ${botonesCierre("ct", pend ? "disabled" : "")}`;
  $$("[data-x]", c).forEach(b => b.onclick = () => cerrarModal());
  $$("[data-modo]", c).forEach(btn => btn.onclick = async () => {
    const modo = btn.dataset.modo;
    $$("[data-modo]", c).forEach(x => { x.disabled = true; }); ocupado(btn, true, "Guardando turno…");
    try {
      const r = await api("webTurnoCerrar", { nota: $("#ctN", c).value.trim(), pdf: modo === "pdf", telegram: modo === "tg", valTodo: ls.get("valTodo", "") === "1" });
      ocupado(btn, false); cerrarModal(true);
      S.turno = r.turno; ls.setJ("turno", r.turno); S.val = null; S.ent = null; ls.del("val"); ls.del("ent");
      toast(`Turno ${r.resultado.numero} guardado.`, "ok", 6000);
      if (modo === "tg") toast(r.telegram ? "PDF enviados al grupo de Telegram" : "El turno se guardó, pero no se pudieron enviar los PDF al grupo. Envíalos desde el historial.", r.telegram ? "ok" : "bad", 7000);
      if (modo === "pdf") (r.pdfs || []).forEach((p, k) => setTimeout(() => bajarB64(p.nombre, p.b64), k * 700));
      repintar();
    } catch (e) { ocupado(btn, false); $$("[data-modo]", c).forEach(x => { x.disabled = false; }); toast(e.message, "bad", 7000); }
  });
}

function refrescarVistaTurno() {
  if (["validacion", "entrega", "conciliacion", "preconciliacion", "inicio"].includes(S.vista) && !modalAbierto()) repintar();
}

// =====================================================================
// MODO HISTORIAL: aviso arriba de la vista cuando se edita algo ya cerrado
// =====================================================================
const puedoEliminar = abiertoPor => puede("administrador") || String(abiertoPor || "").replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase() === String(S.usuario && S.usuario.nombre || "").toLowerCase();
function bannerHist(o, tipo) {
  const volver = { VALIDACION: "hval", ENTREGA: "hent", CONCILIACION: "hconc" }[tipo];
  return `<section class="card hist-banner"><div class="row sb" style="align-items:flex-start">
      <div><div class="k">✏️ Editando desde el historial</div><div style="font-weight:800;font-size:17px">${h(o.texto || "")} <span class="pill ${o.estado === "ELIMINADO" || o.estado === "ELIMINADA" ? "bad" : ""}">${h(o.estado)}</span></div>
      <div class="sub">Abierto por ${h(o.abiertoPor)} · ${h(fechaCorta(o.inicio))}${o.cerradoPor ? ` · Cerrado por ${h(o.cerradoPor)} · ${h(fechaCorta(o.cierre))}` : ""}</div>
      ${o.editadoPor ? `<div class="sub" style="color:var(--warn)">Último cambio: ${h(fmtEd(o.editadoPor))}</div>` : ""}
      ${o.nota ? `<div class="sub">📝 ${h(o.nota)}</div>` : ""}
      <div class="sub">Los cambios quedan guardados con tu nombre.</div></div></div>
    <div class="acciones" style="margin-top:10px"><button class="btn sm" data-hb="volver" data-v="${volver}">← Volver al historial</button>${botonesPDF(tipo, "PDF", o.id)}
      ${puede("validador") ? `<button class="btn sm" data-hb="nota">📝 Nota</button>` : ""}${puede("validador") && puedoEliminar(o.abiertoPor) ? `<button class="btn sm del" data-hb="eliminar">${ICO_DEL} Eliminar</button>` : ""}</div></section>`;
}
function onBanner(e, o, tipo) {
  const b = e.target.closest("[data-hb]"); if (!b) return false;
  e.stopPropagation();
  if (b.dataset.hb === "volver") ir(b.dataset.v);
  else if (b.dataset.hb === "eliminar") eliminarHist(tipo, o, () => ir({ VALIDACION: "hval", ENTREGA: "hent", CONCILIACION: "hconc" }[tipo]));
  else if (b.dataset.hb === "nota") {
    const c = abrirModal(`<h3>Nota de cierre</h3><label class="field"><span>Nota</span><textarea id="hnT">${h(o.nota || "")}</textarea></label><div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="hnOk">Guardar</button></div>`);
    $("#hnOk", c).onclick = async () => {
      try { await api(tipo === "CONCILIACION" ? "webConcNota" : "webTurnoNota", o.id, $("#hnT", c).value.trim()); cerrarModal(true); toast("Nota guardada", "ok"); repintar(); }
      catch (er) { toast(er.message, "bad", 6000); }
    };
  }
  return true;
}
// Cada historial borra solo lo suyo: la validación no se lleva la entrega ni la conciliación, y al revés.
const PARTE = { VALIDACION: "VAL", ENTREGA: "ENT" };
async function eliminarHist(tipo, o, luego) {
  const esConc = tipo === "CONCILIACION";
  const abierto = /ABIERT/.test(o.estado);
  if (!esConc && abierto) return cancelarTurno(Object.assign({ texto: o.texto }, o)).then(luego);
  const que = esConc ? (abierto ? "Se cancela la conciliación abierta; lo que vino de la pre-conciliación vuelve a quedar pendiente." : "Solo esta conciliación: los turnos, validaciones y entregas no se tocan.")
    : tipo === "VALIDACION" ? "Solo la <b>validación</b> de ese turno: su entrega de turno y las conciliaciones no se tocan. No se hereda su saldo."
    : "Solo la <b>entrega de turno</b>: la validación de ese turno y las conciliaciones no se tocan.";
  if (!(await confirmar("Eliminar", `¿Eliminar <b>${h(o.texto || o.id)}</b>?<br><br>${que}<br><br>Queda oculto del historial. Un administrador lo puede restaurar.`, "Eliminar", true))) return;
  try { await api(esConc ? "webConcEliminar" : "webTurnoEliminar", o.id, esConc ? undefined : PARTE[tipo]); toast("Eliminado", "ok"); if (luego) luego(); }
  catch (er) { toast(er.message, "bad", 7000); }
}

// =====================================================================
// VALIDACIÓN DE FACTURACIÓN
// =====================================================================
const estadoVal = p => p.disponible <= 0 ? "bad" : (p.inicial > 0 && p.disponible / p.inicial < 0.2 ? "warn" : "ok");
const pctVal = p => p.inicial > 0 ? Math.max(0, Math.min(100, p.validado / p.inicial * 100)) : (p.validado > 0 ? 100 : 0);
S.valEnviando = [];
S.valTurno = null;

async function cargarVal() {
  if (S.valTurno) { S.val = await api("webVal", S.valTurno); return S.val; }
  try { S.val = await api("webVal"); ls.setJ("val", S.val); }
  catch (e) { const c = ls.getJ("val", null); if (e.red && c) { S.val = c; } else throw e; }
  return S.val;
}
function valConPendientes() {
  const v = JSON.parse(JSON.stringify(S.val));
  if (!v.turno || S.valTurno) return v;
  const pend = cola().filter(x => x.fn === "webValRegistrar" && x.args[0] && x.args[0].turnoId === v.turno.id).map(x => Object.assign({ _estado: "PENDIENTE" }, x.args[0]))
    .concat(S.valEnviando.map(x => Object.assign({ _estado: "ENVIANDO" }, x)));
  pend.forEach(o => {
    const p = v.productos.find(x => x.sku === o.sku);
    const n = parseInt(o.cantidad, 10) || 0;
    if (p) { p.validado += n; p.disponible -= n; p.porDestino[o.destino] = (p.porDestino[o.destino] || 0) + n; }
    v.registros.unshift({ id: "", fecha: o.hora, sku: o.sku, producto: p ? p.producto : o.sku, destino: o.destino, cantidad: n, usuario: S.usuario.nombre, nota: o.nota, estado: o._estado, contadoEn: p ? p.contadoEn : "" });
  });
  return v;
}

VISTAS.validacion = async (el, p, vigente) => {
  S.valTurno = p.turnoId || null;
  // Se pinta ya con lo guardado y luego con lo fresco
  const c = !S.valTurno && (S.val && !S.val.historial ? S.val : ls.getJ("val", null));
  if (c) { S.val = c; pintarVal(el); }
  await cargarVal();
  if (!vigente()) return;
  if (!c) pintarVal(el); else if (!mismo(c, S.val)) refrescarVista(() => pintarVal());
};

function pintarVal(el) {
  quitarChip();
  el = el || $("#view");
  const v = valConPendientes(), t = v.turno, hist = !!S.valTurno;
  const esc = puede("validador");
  let html = cab("📝 Validación de facturación", hist ? "" : "Saldo por producto escaso en el turno") + `<div id="tb"></div>`;
  if (!t) { el.innerHTML = html + vacio("Abre el turno para empezar a validar.", "🔒"); pintarBarra($("#tb", el), v.turnoInfo); return; }
  const regs = v.registros;
  const nConf = regs.filter(r => r.estado === "CONFLICTO").length;
  numerarRegs(v);
  const regsDe = sku => regs.filter(r => r.sku === sku);
  const tarjeta = p => cardVal(p, esc, hist, regsDe(p.sku));
  // Primero lo que está por confirmar (desaparece cuando todo está confirmado) y luego lo confirmado; cada uno por presentación
  const porConf = v.productos.filter(p => p.porConfirmar).sort(porPres), normales = v.productos.filter(p => !p.porConfirmar).sort(porPres);
  html += `
    ${nConf ? `<div class="err">⚠️ Hay ${nConf} validación(es) en conflicto: se hicieron sin conexión y al subir ya no alcanzaba el saldo. Corrígelas o anúlalas.</div>` : ""}
    ${v.productos.length ? `<div class="lista-tools"><input type="search" id="vq" placeholder="Buscar producto (SKU o nombre)…" value="${h(S.valQ || "")}"><button class="btn sm" data-a="vabrir">Abrir todas</button><button class="btn sm" data-a="vcerrar">Cerrar todas</button><span class="count" id="vqc"></span></div>
      ${porConf.length ? `<section class="pc-g"><div class="pc-t">⏳ Por confirmar <span class="fam-n">${porConf.length}</span></div><div class="vlista">${gruposFamilia("valpc", porConf, tarjeta)}</div></section>
        <section class="pc-g conf-g"><div class="pc-t">✅ Confirmadas <span class="fam-n">${normales.length}</span></div><div class="vlista">${gruposFamilia("valok", normales, tarjeta)}</div></section>` : `<div class="vlista">${gruposFamilia("valok", normales, tarjeta)}</div>`}` : vacio("No hay productos en este turno. Toca ＋ para agregarlos.", "📝")}
    ${esc && !hist ? botonGuardar("gturno", "Guardar", puedoEliminar(t.abiertoPor) ? "cturno" : "", "Cancelar") : ""}
    ${esc ? fab("agregar", "Agregar productos") : ""}`;
  el.innerHTML = html;
  if (hist) $("#tb", el).innerHTML = bannerHist(Object.assign({}, t, { texto: t.texto }), "VALIDACION");
  else pintarBarra($("#tb", el), v.turnoInfo, false, botonesPDF("VALIDACION", "PDF", t.id));
  el.onclick = e => { if (hist && onBanner(e, t, "VALIDACION")) return; onValClick(e); };
  const vq = $("#vq", el);
  if (vq) { vq.oninput = () => { S.valQ = vq.value; filtrarVal(el); }; filtrarVal(el); }
}
const porNombre = (a, b) => String(a.producto || "").localeCompare(String(b.producto || ""), "es", { numeric: true });
// El buscador solo esconde tarjetas (no repinta: el teclado no se cierra mientras se escribe)
function filtrarVal(el) {
  const q = norm(S.valQ || "").split(/\s+/).filter(x => x);
  let n = 0;
  $$(".vlista .vcard", el).forEach(c => { const ok = !q.length || coincide(norm(c.dataset.q), q) > 0; c.classList.toggle("hidden", !ok); if (ok) n++; });
  filtrarGrupos(el, q.length > 0, ".vcard");
  const c = $("#vqc", el); if (c) c.textContent = q.length ? `${n} de ${$$(".vlista .vcard", el).length}` : "";
}
// Número de cada validación dentro de su producto y saldo que quedó después (igual que el servidor)
function numerarRegs(v) {
  const ini = {}, n = {};
  v.productos.forEach(p => { ini[p.sku] = p.inicial; });
  v.registros.slice().sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : ((a.seq || 1e9) - (b.seq || 1e9))).forEach(r => {
    n[r.sku] = (n[r.sku] || 0) + 1; r.seq = n[r.sku];
    if (r.estado === "ANULADO" || r.estado === "CONFLICTO" || ini[r.sku] === undefined) { r.saldo = null; return; }
    ini[r.sku] -= r.cantidad; r.saldo = ini[r.sku];
  });
}
// Una validación dentro de la tarjeta de su producto (compacta, con editar y anular)
function filaReg(r, esc, hist) {
  const cls = r.estado === "ANULADO" ? "anulado" : r.estado === "CONFLICTO" ? "conflicto" : (r.estado === "PENDIENTE" || r.estado === "ENVIANDO") ? "pendiente" : "";
  return `<div class="vreg ${cls}" title="${h((r.usuario || "") + (r.modificadoPor ? " · " + r.modificadoPor : ""))}"><span class="rr-num">${r.seq}</span>
    <span class="vr-d">${h(r.destino)}</span><b class="vr-c">${fm(r.cantidad)}</b>
    <span class="vr-s">${r.saldo !== null && r.saldo !== undefined ? `saldo <b>${fm(r.saldo)}</b>` : ""}${r.estado === "ANULADO" ? ` <span class="pill">anulada</span>` : ""}${r.estado === "CONFLICTO" ? ` <span class="pill bad">conflicto</span>` : ""}${r.estado === "PENDIENTE" ? ` <span class="pill warn">⏳</span>` : ""}${r.estado === "ENVIANDO" ? ` <span class="pill info">↑</span>` : ""}</span>
    <span class="vr-h">${h(hist ? fechaCorta(r.fecha) : soloHora(r.fecha))}${r.nota ? ` · 📝 ${h(r.nota)}` : ""}</span>
    ${esc && r.id && r.estado !== "ANULADO" ? `<span class="vr-acc"><button class="btn sm icon" data-a="editar" data-id="${h(r.id)}" title="${r.estado === "CONFLICTO" ? "Corregir" : "Editar"}" aria-label="Editar">✎</button><button class="btn sm icon del" data-a="anular" data-id="${h(r.id)}" title="Anular" aria-label="Anular">🚫</button></span>` : ""}</div>`;
}
// Cada producto: cerrado muestra SKU, nombre y el saldo; abierto muestra lo contado en cada zona y sus validaciones
function cardVal(p, esc, hist, regs) {
  regs = regs || [];
  const activos = regs.filter(r => r.estado === "ACTIVO" || r.estado === "PENDIENTE" || r.estado === "ENVIANDO");
  const ultima = activos.map(r => r.fecha).filter(x => x).sort().pop();
  const ab = abierto("val", p.sku);
  const vacia = x => x === "" || x === null || x === undefined;
  const z = x => vacia(x) ? `<b class="z-no" title="No se contó">—</b>` : `<b>${fm(x)}</b>`;
  const hayZ = [p.bodega, p.ka, p.pk].some(x => !vacia(x));
  // Qué zona falta por contar (si se contó por zonas o todavía no tiene nada)
  const faltaZ = hayZ || !p.inicial ? [["bodega", "Bodega"], ["ka", "KA"], ["pk", "PK"]].filter(z => vacia(p[z[0]])).map(z => z[1]).join(", ") : "";
  const sinSaldo = p.disponible <= 0 && !p.porConfirmar;
  return `<article class="card vcard plegable ${estadoVal(p)} ${p.porConfirmar ? "pc" : ""} ${ab ? "abierto" : ""}" data-q="${h(p.sku + " " + p.producto)}">
    <div class="pl-cab" data-plegar="val|${h(p.sku)}" role="button" tabindex="0" aria-expanded="${ab}">
      <div class="rc-tit"><span class="rc-n" title="Validaciones">${activos.length}</span><div><div class="prod">${skuTxt(p.sku, p.producto)}</div>${faltaZ ? `<span class="z-falta">falta ${faltaZ}</span>` : ""}</div></div>
      <span class="vc-mini" title="Disponible de la cantidad inicial"><b>${fm(p.disponible)}</b><small>/${fm(p.inicial)}</small></span><span class="pl-flecha" aria-hidden="true">▾</span></div>
    <div class="pl-cuerpo">
      <div class="vc-zonas"><span>Bodega ${z(p.bodega)}</span><span>KA ${z(p.ka)}</span><span>PK ${z(p.pk)}</span><span class="vc-ini">Total <b>${fm(p.inicial)}</b></span></div>
      ${!hayZ && p.inicial ? `<div class="muted small">Sin detalle por zona (cantidad total).</div>` : ""}
      <div class="vc-cifras"><span class="vc-val">Validado <b>${fm(p.validado)}</b></span><span class="vc-dis">Disponible <b>${fm(p.disponible)}</b></span>${vNum(p.final) !== "" ? `<span class="vc-fin" title="Reconteo al entregar el turno">🔁 Al entregar <b>${fm(p.final)}</b></span>` : ""}${!hist && verWms() && p.wmsCajas !== undefined ? `<span class="muted small">WMS ${fm(p.wmsCajas)}</span>` : ""}
        <button type="button" class="reloj" data-a="horas" title="Ver horas de conteo y de validación" aria-label="Ver horas">🕐</button></div>
      <div class="vc-horas hidden">🕐 Contado: <b>${p.contadoEn ? h(fechaCorta(p.contadoEn)) : "Heredado"}</b> · ✔ Última validación: <b>${ultima ? h(fechaCorta(ultima)) : "—"}</b></div>
      ${p.porConfirmar ? `<div class="vc-alerta">⏳ Cantidad por confirmar: se puede validar, pero confirma el conteo con «✎ Cantidad».</div>` : ""}
      ${p.alertaWms && verWms() ? `<div class="vc-alerta">⚠️ El WMS tiene menos cajas (${fm(p.wmsCajas)}) que las disponibles.</div>` : ""}
      ${Object.keys(p.porDestino).length ? `<div class="dest">${Object.keys(p.porDestino).map(d => `<span class="chip">${h(d)} <b>${fm(p.porDestino[d])}</b></span>`).join("")}</div>` : ""}
      ${regs.length ? `<div class="vc-regs">${regs.slice().sort((a, b) => a.seq - b.seq).map(r => filaReg(r, esc, hist)).join("")}</div>` : `<div class="muted small">Sin validaciones todavía.</div>`}
      ${esc ? `<div class="vc-acc"><button class="btn primary sm grow" data-a="validar" data-sku="${h(p.sku)}" ${sinSaldo ? "disabled" : ""}>${sinSaldo ? "Sin saldo" : "Validar"}</button><button class="btn sm" data-a="sumari" data-sku="${h(p.sku)}" title="Sumar a la cantidad inicial">＋ Sumar</button><button class="btn sm" data-a="inicial" data-sku="${h(p.sku)}" title="Corregir la cantidad inicial">✎</button><button class="btn sm icon del" data-a="quitar" data-sku="${h(p.sku)}" title="Quitar del turno" aria-label="Quitar del turno">${ICO_DEL}</button></div>` : ""}
    </div>
  </article>`;
}

async function onValClick(e) {
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a, v = valConPendientes(), T = S.valTurno || "";
  const prod = sku => v.productos.find(x => x.sku === sku);
  if (a === "agregar") return modalAgregar();
  if (a === "gturno") return modalCerrarTurno();
  if (a === "cturno") return cancelarTurno(v.turno);
  if (a === "vabrir" || a === "vcerrar") { S.abiertos.val = {}; v.productos.forEach(p => { S.abiertos.val[p.sku] = a === "vabrir"; }); $$(".vlista .vcard").forEach(c => c.classList.toggle("abierto", a === "vabrir")); return; }
  if (a === "horas") { const hz = b.closest(".pl-cuerpo").querySelector(".vc-horas"); if (hz) hz.classList.toggle("hidden"); return; }
  if (a === "validar") return modalValidar(prod(b.dataset.sku));
  if (a === "editar") { const r = v.registros.find(x => x.id === b.dataset.id); return modalValidar(prod(r.sku), r); }
  if (a === "inicial") return modalInicial(prod(b.dataset.sku));
  if (a === "sumari") return modalInicial(prod(b.dataset.sku), true);
  if (a === "quitar") {
    const p = prod(b.dataset.sku);
    if (p.validado > 0 || p.conflictos) { toast(`No se puede quitar: tiene validaciones registradas. Anúlalas primero.`, "bad", 6000); return; }
    if (!(await confirmar("Quitar producto", `¿Quitar ${skuTxt(p.sku, p.producto)} del turno?`, "Quitar", true))) return;
    return guardarVal(api("webValQuitar", p.sku, T), "Producto quitado");
  }
  if (a === "anular") {
    const r = v.registros.find(x => x.id === b.dataset.id);
    if (!(await confirmar("Anular validación", `¿Anular <b>${fm(r.cantidad)}</b> cajas de ${skuTxt(r.sku, r.producto)} para <b>${h(r.destino)}</b>? El saldo vuelve a quedar disponible.`, "Anular", true))) return;
    return guardarVal(api("webValAnular", r.id, T), "Validación anulada");
  }
  if (a === "adest") { const n = $("#nd").value.trim(); if (!n) return; return guardarVal(api("webValDestino", "agregar", n, T), `Destino «${n}» agregado`); }
  if (a === "qdest") {
    if (!(await confirmar("Quitar destino", `¿Quitar <b>${h(b.dataset.d)}</b> de la lista? Las validaciones ya hechas no cambian.`, "Quitar"))) return;
    return guardarVal(api("webValDestino", "quitar", b.dataset.d, T), "Destino quitado");
  }
}

async function guardarVal(promesa, okMsg) {
  try { const r = await promesa; S.val = r.estado; if (!S.valTurno) ls.setJ("val", S.val); if (S.vista === "validacion") pintarVal(); if (okMsg) toast(okMsg, "ok"); return r; }
  catch (e) { toast(e.red ? "Sin conexión: esta acción necesita conexión." : e.message, "bad", 7000); throw e; }
}

function modalValidar(p, reg) {
  if (!p) return;
  const hist = !!S.valTurno;
  const max = p.disponible + (reg && reg.estado === "ACTIVO" ? reg.cantidad : 0);
  const libre = !!p.porConfirmar;   // por confirmar: se puede validar aunque quede negativo
  const destinos = S.val.destinos.slice();
  if (reg && reg.destino && !destinos.includes(reg.destino)) destinos.push(reg.destino);
  const c = abrirModal(`<div class="m-tit"><h3>${reg ? (reg.estado === "CONFLICTO" ? "Corregir validación" : "Editar validación") : (hist ? "Validación olvidada" : "Validar")}</h3>${horaEd("vh", reg ? reg.fecha : "", "Hora en que se validó")}</div>
    <div class="m-prod">${skuTxt(p.sku, p.producto)}</div>
    <div class="m-info">Disponible <b>${fm(max)}</b>${libre ? ` · <span class="pill warn">por confirmar</span>` : ""}</div>
    <div class="m-fila">
      <div class="field f-dest"><span>Destino</span>${miniSel("vd", destinos, reg ? reg.destino : "", "Escoge…", "＋ Otro destino…")}</div>
      <label class="field f-cant"><span>Cantidad ${unBtn(cpeDe(p.sku))}</span><input type="text" inputmode="numeric" pattern="[0-9]*" id="vc" value="${reg ? reg.cantidad : ""}" placeholder="0" autofocus></label></div>
    <label class="field hidden" id="otroF"><span>Nuevo destino (queda en la lista)</span><input type="text" id="otro" placeholder="Ej: Mayoristas"></label>
    <div class="small m-res" id="vr"></div>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="vok">${reg ? "Guardar" : "Validar"}</button></div>`);
  const horaIni = $("#vh", c).value;
  const cant = () => Number(cajasDe($("#vc", c))) || 0;
  const destino = () => $("#vd", c).dataset.v === "__otro" ? $("#otro", c).value.trim() : ($("#vd", c).dataset.v || "");
  const upd = () => {
    const n = cant(), resto = max - n;
    $("#otroF", c).classList.toggle("hidden", $("#vd", c).dataset.v !== "__otro");
    $("#vr", c).innerHTML = n ? (resto < 0 ? (libre ? `<span style="color:var(--warn)">Queda en ${fm(resto)} (producto por confirmar).</span>` : `<span style="color:var(--bad)">⛔ Excede el disponible por ${fm(-resto)} cajas.</span>`) : `Quedarán <b>${fm(resto)}</b> cajas.`) : "";
    $("#vok", c).disabled = !n || (resto < 0 && !libre) || !destino();
  };
  $("#vd", c).addEventListener("elegido", () => { upd(); if ($("#vd", c).dataset.v === "__otro") $("#otro", c).focus(); else $("#vc", c).focus(); });
  $("#vc", c).oninput = upd; $("#otro", c).oninput = upd;
  $("#vc", c).onkeydown = e => { if (e.key === "Enter" && !$("#vok", c).disabled) $("#vok", c).click(); };
  upd();
  $("#vok", c).onclick = async () => {
    const d = destino();
    const horaElegida = $("#vh", c).value && $("#vh", c).value !== horaIni;
    const obj = { sku: p.sku, destino: d, cantidad: cant(), nota: reg ? reg.nota : "", turnoId: S.val.turno.id, hora: horaElegida || hist ? $("#vh", c).value : ahoraTxt(), horaElegida: !!horaElegida };
    if (reg || hist) {
      const btn = $("#vok", c); ocupado(btn, true);
      try { await guardarVal(reg ? api("webValEditar", reg.id, obj, S.valTurno || "") : api("webValRegistrar", obj, S.valTurno)); ocupado(btn, false); cerrarModal(true); toast("Guardado", "ok"); } catch (e) { ocupado(btn, false); }
      return;
    }
    // Validación optimista: la pantalla descuenta ya y el servidor confirma por detrás
    cerrarModal(true);
    const tmp = Object.assign({ _tmp: Date.now() }, obj);
    S.valEnviando.push(tmp);
    if (S.vista === "validacion") pintarVal();
    toast(`✔ ${fm(obj.cantidad)} cajas de ${p.producto} para ${d}`, "ok", 3000);
    try {
      const r = await api("webValRegistrar", obj);
      S.valEnviando = S.valEnviando.filter(x => x !== tmp);
      S.val = r.estado; ls.setJ("val", S.val);
      if (r.resultado && r.resultado.conflicto) toast("La validación quedó en conflicto: ya no alcanzaba el saldo.", "bad", 8000);
    } catch (e) {
      S.valEnviando = S.valEnviando.filter(x => x !== tmp);
      if (e.red) encolar("webValRegistrar", [Object.assign({ offline: true }, obj)], `Validar ${obj.cantidad} cajas de ${p.sku} para ${d}`);
      else toast("No se registró: " + e.message, "bad", 8000);
    }
    if (S.vista === "validacion" && !modalAbierto()) pintarVal();
  };
}

// Cantidad inicial por zona (Bodega, PK y KA) y el total; «Sumar» agrega a lo que ya había
const campoZona = (id, l, v, cpe) => `<label class="field f-zona"><span>${l}${cpe !== undefined ? " " + unBtn(cpe) : ""}</span><input type="text" inputmode="numeric" pattern="[0-9]*" id="${id}" value="${v === "" || v === null || v === undefined ? "" : v}" placeholder="—"></label>`;
function modalInicial(p, sumar) {
  let modo = "fijar";
  const vacia = x => x === "" || x === null || x === undefined;
  const hayZ = [p.bodega, p.ka, p.pk].some(x => !vacia(x));
  const ant = { bodega: hayZ ? p.bodega : (p.inicial ? p.inicial : ""), pk: hayZ ? p.pk : "", ka: hayZ ? p.ka : "" };
  const c = abrirModal(`<div class="m-tit"><h3>Cantidad inicial</h3>${horaEd("ih", p.contadoEn, "Hora en que se contó")}</div>
    <div class="m-prod">${skuTxt(p.sku, p.producto)}</div>
    <div class="seg seg-sm" id="imo"><button data-m="fijar" class="on">Corregir</button><button data-m="sumar">＋ Sumar</button></div>
    <div class="m-zonas">${campoZona("iB", "Bodega", ant.bodega, cpeDe(p.sku))}${campoZona("iK", "KA", ant.ka, cpeDe(p.sku))}${campoZona("iP", "PK", ant.pk, cpeDe(p.sku))}<div class="z-tot"><span>Total</span><b id="iT">0</b></div></div>
    <div class="m-cifras"><span class="vc-val">Validado <b>${fm(p.validado)}</b></span>${verWms() && p.wmsCajas !== undefined ? `<span class="muted small">WMS hoy ${fm(p.wmsCajas)}</span>` : ""}</div>
    <div class="check solo-cuadro"><input type="checkbox" id="iC" ${p.porConfirmar ? "checked" : ""} aria-label="Cantidad por confirmar"><span>Cantidad por confirmar</span></div>
    <div class="small m-res" id="ir"></div>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="iok">Guardar</button></div>`);
  const horaIni = $("#ih", c).value;
  const val = id => cajasDe($("#" + id, c));
  const upd = () => {
    const z = { bodega: val("iB"), pk: val("iP"), ka: val("iK") };
    const suma = (z.bodega || 0) + (z.pk || 0) + (z.ka || 0);
    const total = modo === "sumar" ? (hayZ ? (p.bodega || 0) + (p.pk || 0) + (p.ka || 0) : p.inicial) + suma : suma;
    $("#iT", c).textContent = fm(total);
    $("#ir", c).innerHTML = (modo === "sumar" ? `Se suma <b>${fm(suma)}</b> a lo que ya había. ` : "") + (total < p.validado ? `<span style="color:var(--bad)">⚠️ Queda por debajo de lo ya validado: el disponible será ${fm(total - p.validado)}.</span>` : `Disponible quedará en <b>${fm(total - p.validado)}</b>.`);
  };
  $("#imo", c).onclick = e => {
    const b = e.target.closest("[data-m]"); if (!b) return;
    modo = b.dataset.m; $$("#imo button", c).forEach(x => x.classList.toggle("on", x === b));
    [["iB", "bodega"], ["iK", "ka"], ["iP", "pk"]].forEach(([id, k]) => { $("#" + id, c).value = modo === "sumar" ? "" : (vacia(ant[k]) ? "" : ant[k]); });
    upd(); $("#iB", c).focus();
  };
  c.addEventListener("input", e => { if (e.target.closest(".f-zona")) { e.target.value = e.target.value.replace(/\D/g, ""); upd(); } });
  upd();
  if (sumar) $("#imo [data-m=sumar]", c).click();
  $("#iok", c).onclick = async () => {
    const btn = $("#iok", c); ocupado(btn, true);
    const obj = { bodega: val("iB"), pk: val("iP"), ka: val("iK"), porConfirmar: $("#iC", c).checked, sumar: modo === "sumar" };
    const hora = $("#ih", c).value !== horaIni ? $("#ih", c).value : (modo === "fijar" ? $("#ih", c).value : "");
    try { await guardarVal(api("webValInicial", p.sku, obj, hora, S.valTurno || ""), modo === "sumar" ? "Cantidad sumada" : "Cantidad inicial actualizada"); ocupado(btn, false); cerrarModal(true); }
    catch (e) { ocupado(btn, false); }
  };
}

// Agregar productos: solo el buscador (SKU o nombre). Los «pocos» salen solo si se marca la casilla.
async function modalAgregar() {
  const sel = new Map();
  const c = abrirModal(`<div class="m-tit"><h3>Agregar productos</h3>${horaEd("agH", "", "Hora en que se contó")}</div>
    <div class="buscador"><div class="bq-fila"><input type="search" id="agQ" placeholder="SKU o nombre del producto…" autocomplete="off"></div></div>
    <label class="check"><input type="checkbox" id="agP"><span>Mostrar los <b>pocos</b> (debajo de su mínimo)</span></label>
    <div class="ag-list hidden" id="agPL"></div>
    <div id="agS"></div>
    <div class="modal-actions"><span class="muted small" id="agC">Ninguno</span><button class="btn" data-x>Cancelar</button><button class="btn primary" id="agOk" disabled>Agregar</button></div>`, { wide: true });
  const enTurno = new Set(S.val.productos.map(p => p.sku));
  let pocos = null;
  const cuenta = () => { $("#agC", c).textContent = sel.size ? `${sel.size} producto${sel.size > 1 ? "s" : ""}` : "Ninguno"; $("#agOk", c).disabled = !sel.size; };
  // Cada producto escogido: Bodega, PK y KA (vacío = no se contó ahí) y si la cantidad está por confirmar
  const pintarSel = () => {
    $("#agS", c).innerHTML = [...sel.values()].map(x => `<div class="ag-sel" data-sku="${h(x.sku)}"><div class="ag-st">${skuTxt(x.sku, x.producto)}<button type="button" class="btn sm icon del" data-q="${h(x.sku)}" title="Quitar de la lista" aria-label="Quitar">✕</button></div>
      <div class="m-zonas">${campoZona("b" + x.sku, "Bodega", x.bodega, cpeDe(x.sku))}${campoZona("k" + x.sku, "KA", x.ka, cpeDe(x.sku))}${campoZona("p" + x.sku, "PK", x.pk, cpeDe(x.sku))}<div class="z-tot"><span>Total</span><b>${fm((x.bodega || 0) + (x.pk || 0) + (x.ka || 0))}</b></div></div>
      <div class="check solo-cuadro"><input type="checkbox" data-pc="${h(x.sku)}" ${x.porConfirmar ? "checked" : ""} aria-label="Por confirmar"><span>No sé la cantidad real: <b>por confirmar</b></span></div></div>`).join("");
    cuenta();
  };
  const agregar = (sku, prod) => {
    // Si ya está en el turno se abre de una vez su cantidad (para sumar o corregir)
    if (enTurno.has(sku)) { const p = S.val.productos.find(x => x.sku === sku); if (!sel.size && p) { cerrarModal(true); toast("Ya está en el turno: suma o corrige su cantidad.", "", 3000); modalInicial(p, true); } else toast("Ese producto ya está en el turno.", "warn"); return; }
    if (!sel.has(sku)) sel.set(sku, { sku: sku, producto: prod, bodega: "", pk: "", ka: "", porConfirmar: false });
    pintarSel();
    const i = $("#b" + sku, c); if (i) i.focus();
  };
  autoSku($("#agQ", c), p => agregar(p.sku, p.prod), { limpiar: true });
  c.addEventListener("input", e => {
    const i = e.target.closest(".f-zona input"); if (!i) return;
    i.value = i.value.replace(/\D/g, "");
    const box = i.closest(".ag-sel"); if (!box) return;
    const x = sel.get(box.dataset.sku), k = { b: "bodega", p: "pk", k: "ka" }[i.id[0]];
    x[k] = cajasDe(i);
    box.querySelector(".z-tot b").textContent = fm((x.bodega || 0) + (x.pk || 0) + (x.ka || 0));
  });
  c.addEventListener("change", e => {
    const pc = e.target.closest("[data-pc]"); if (pc) { sel.get(pc.dataset.pc).porConfirmar = pc.checked; return; }
    const cb = e.target.closest("#agPL input[type=checkbox]");
    if (cb) { if (cb.checked) agregar(cb.dataset.sku, cb.dataset.prod); else { sel.delete(cb.dataset.sku); pintarSel(); } }
  });
  c.addEventListener("click", e => { const q = e.target.closest("[data-q]"); if (!q) return; sel.delete(q.dataset.q); const cb = $(`#agPL input[data-sku="${q.dataset.q}"]`, c); if (cb) cb.checked = false; pintarSel(); });
  $("#agP", c).onchange = async () => {
    const L = $("#agPL", c);
    L.classList.toggle("hidden", !$("#agP", c).checked);
    if (!$("#agP", c).checked) return;
    if (!pocos) {
      L.innerHTML = loader("Cargando pocos…");
      try { pocos = await api("webValSugerencias", S.valTurno || ""); } catch (er) { L.innerHTML = errBox(er); return; }
    }
    L.innerHTML = pocos.length ? pocos.map(it => `<label class="ag-row ${enTurno.has(it.sku) ? "dis" : ""}"><input type="checkbox" data-sku="${h(it.sku)}" data-prod="${h(it.producto)}" ${sel.has(it.sku) ? "checked" : ""} ${enTurno.has(it.sku) ? "disabled" : ""}>
      <div>${skuTxt(it.sku, it.producto)}${it.prio ? ' <span class="pill bad">PRIORIDAD</span>' : ""}<div class="sub">WMS ${fm(it.cajas)} cajas · ≈ ${fm(it.estibas)} de mín. ${fm(it.minimo)} estibas${enTurno.has(it.sku) ? " · <b>ya está</b>" : ""}</div></div></label>`).join("") : `<p class="muted small">No hay productos por debajo de su mínimo.</p>`;
  };
  $("#agOk", c).onclick = async () => {
    const btn = $("#agOk", c); ocupado(btn, true);
    const hora = $("#agH", c).value;
    try {
      const r = await guardarVal(api("webValAgregar", [...sel.values()].map(x => Object.assign({ contadoEn: hora }, x)), S.valTurno || ""));
      ocupado(btn, false); cerrarModal(true);
      toast(`${r.resultado.agregados} producto(s) agregados`, "ok");
      if (r.resultado.omitidos.length) toast("Omitidos: " + r.resultado.omitidos.join(" · "), "bad", 8000);
    } catch (e) { ocupado(btn, false); }
  };
  cargarCat().catch(() => null);
  if (window.innerWidth > 699) $("#agQ", c).focus();
}

// =====================================================================
// ENTREGA DE TURNO
// =====================================================================
const SECC = { BODEGA: { t: "🏭 Bodega", un: "Estibas", mod: true }, TPC: { t: "🏷️ TPC", un: "Estibas", mod: true }, KA: { t: "🏬 KA", un: "Cajas", mod: false }, PK: { t: "🛒 PK", un: "Cajas", mod: false } };
// «1 estiba», «4 estibas», «1 caja», «30 cajas»
const UN_PAL = { Estibas: ["estiba", "estibas"], Cajas: ["caja", "cajas"], Unidades: ["unidad", "unidades"] };
const unPal = (n, un) => `${fm(n)} ${(UN_PAL[un] || [un, un])[Number(n) === 1 ? 0 : 1]}`;
// Total por unidad (2 estibas + 2 estibas = 4 estibas, y aparte la suma de las cajas)
const totalUn = arr => { const t = {}; arr.forEach(x => { t[x.un] = (t[x.un] || 0) + (Number(x.n) || 0); }); return ["Estibas", "Cajas", "Unidades"].filter(u => t[u] !== undefined).map(u => unPal(t[u], u)).join(" + "); };
// Sin cantidades = «–» (falta contar, sin color) · un 0 contado se ve igual que cualquier número («0 cajas»)
const cantChips = (arr, s) => {
  if (!arr || !arr.length) return `<span class="cant-pend" title="Falta contar">–</span>`;
  if ((s === "KA" || s === "PK") && arr.length > 1) return `<span class="cant tot"><b>${totalUn(arr)}</b></span><span class="muted small">(${arr.length} conteos sumados)</span>`;
  const tot = arr.length > 1 ? `<span class="cant tot">Total: <b>${totalUn(arr)}</b></span>` : "";
  return tot + arr.map(x => `<span class="cant">${unPal(x.n, x.un).replace(/^([\d.]+)/, "<b>$1</b>")}${x.m ? ` ${modChip(x.m)}` : ""}</span>`).join("");
};
// Lo que vino de una conciliación y nadie ha revisado (al editarlo deja de estar marcado)
const esHeredadoEnt = x => /^Conciliación/.test(x.origen || "");
S.entTurno = null;

async function cargarEnt() {
  if (S.entTurno) { S.ent = await api("webEnt", S.entTurno); return S.ent; }
  try { S.ent = await api("webEnt"); ls.setJ("ent", S.ent); }
  catch (e) { const c = ls.getJ("ent", null); if (e.red && c) S.ent = c; else throw e; }
  return S.ent;
}
// Suma lo que está guardándose o en la cola (se ve al instante)
function entConPendientes() {
  const en = JSON.parse(JSON.stringify(S.ent));
  if (!en.turno) return en;
  const ctx = S.entTurno || "";
  noConfirmados("webEntGuardar").filter(x => (x.args[4] || "") === ctx).forEach(x => {
    const [s, sku, prod, cant] = x.args;
    const lista = en.secciones[s]; if (!lista) return;
    const it = lista.find(y => y.sku === sku);
    if (it) { it.cant = cant; it.pendiente = true; } else {
      lista.push({ sku: sku, producto: prod, cant: cant, pendiente: true, usuario: x.quien, actualizado: x.ts, origen: "Usuario" });
      // Igual que el servidor: lo nuevo en KA o PK aparece también en la otra y en Bodega con 0
      if (s === "KA" || s === "PK") ["BODEGA", "KA", "PK"].filter(o => o !== s && !en.secciones[o].some(y => y.sku === sku))
        .forEach(o => en.secciones[o].push({ sku: sku, producto: prod, cant: [], pendiente: true, usuario: x.quien, actualizado: x.ts, origen: `Automático (se agregó en ${s})` }));
    }
  });
  noConfirmados("webEntNota").filter(x => (x.args[1] || "") === ctx).forEach(x => en.notas.push({ id: "", hora: x.ts, usuario: x.quien, texto: x.args[0], pendiente: true }));
  return en;
}

VISTAS.entrega = async (el, p, vigente) => {
  S.entTurno = p.turnoId || null;
  const c = !S.entTurno && (S.ent && !S.ent.historial ? S.ent : ls.getJ("ent", null));
  if (c) { S.ent = c; pintarEnt(el); }
  await Promise.all([cargarEnt(), cargarCat().catch(() => null)]);
  if (!vigente()) return;
  if (!c) pintarEnt(el); else if (!mismo(c, S.ent)) refrescarVista(() => pintarEnt());
};

function pintarEnt(el) {
  quitarChip();
  el = el || $("#view");
  const en = entConPendientes(), esc = puede("validador"), hist = !!S.entTurno;
  let html = cab("📋 Entrega de turno", hist ? "" : "Lo que se cuenta en cada área") + `<div id="tb"></div>`;
  if (!en.turno) { el.innerHTML = html + vacio("Abre el turno para hacer la entrega.", "🔒"); pintarBarra($("#tb", el), en.turnoInfo); return; }
  // «Estoy en»: Bodega, KA o PK muestra solo esa sección (abierta y con lo que falta por contar primero); «Todo» las muestra todas
  const zona = hist ? "" : ls.get("entZona", "");
  const fila = s => x => `<div class="ent-row ${esHeredadoEnt(x) ? "her" : ""} ${x.cant && x.cant.length ? "" : "pend"}"><div class="ent-main"><div>${skuTxt(x.sku, x.producto)}${x.pendiente ? ` <span class="pill warn">guardando…</span>` : ""}${esHeredadoEnt(x) ? ` <span class="pill her-p" title="Viene de la conciliación: revísalo y edítalo si cambió">heredado · revisar</span>` : ""}</div><div class="cants">${cantChips(x.cant, s)}</div><div class="sub">${h(x.origen || "")}${x.usuario ? " · " + h(x.usuario) : ""}${x.actualizado ? " · " + h(fechaCorta(x.actualizado)) : ""}</div></div>
        ${esc ? `<div class="ent-acc"><button class="btn sm icon mas" data-a="mas" data-s="${s}" data-sku="${h(x.sku)}" title="Añadir otra cantidad" aria-label="Añadir otra cantidad">＋</button><button class="btn sm icon" data-a="edit" data-s="${s}" data-sku="${h(x.sku)}" aria-label="Editar">✎</button><button class="btn sm icon del" data-a="del" data-s="${s}" data-sku="${h(x.sku)}" aria-label="Quitar">${ICO_DEL}</button></div>` : ""}</div>`;
  // Cada sección es una tarjeta de su color: cerrada muestra el nombre y cuántos productos tiene
  const sec = s => {
    const it = en.secciones[s], ab = zona ? true : abierto("ent", s);
    const pendN = it.filter(x => !x.cant || !x.cant.length).length;
    // En «Estoy en …» lo que falta contar («–») va primero dentro de cada presentación
    const lista = `<div class="ent-list">${gruposFamilia("ent-" + s, it, fila(s), null, zona ? (a, b) => ((a.cant && a.cant.length) ? 1 : 0) - ((b.cant && b.cant.length) ? 1 : 0) || porNombre(a, b) : null)}</div>`;
    return `<section class="card sec-card plegable sec-${s.toLowerCase()} ${ab ? "abierto" : ""}">
      <div class="pl-cab" ${zona ? "" : `data-plegar="ent|${s}" role="button" tabindex="0"`} aria-expanded="${ab}"><h3><span>${SECC[s].t} <span class="sec-n">${it.length}</span>${pendN ? ` <span class="pill pend-p" title="Falta contar">– ${pendN}</span>` : ""}</span></h3>
        ${esc && it.length ? `<button type="button" class="btn sm danger-ghost sec-vaciar" data-a="vaciar" data-s="${s}" title="Quitar todos los productos de la sección">🧹 Quitar todo</button>` : ""}${zona ? "" : `<span class="pl-flecha" aria-hidden="true">▾</span>`}</div>
      <div class="pl-cuerpo">
      ${it.length ? lista : `<p class="muted small">Sin productos. Toca ＋ para agregar.</p>`}
      </div></section>`;
  };
  // Si ya se está agregando a mano, la precarga se bloquea (llenaría todo por error)
  const aMano = ["BODEGA", "TPC", "KA", "PK"].some(s2 => en.secciones[s2].some(x => !/^(WMS|Conciliación|Validación)/.test(x.origen || "")));
  S.entAMano = aMano;
  const botonesTurno = (esc && !hist ? `<button class="btn sm" data-a="precargar" title="Precargar (pocos o tu conciliación)"><span class="ic">⤓</span><span class="txt">Precargar</span></button>` : "") + botonesPDF("ENTREGA", "PDF", en.turno.id);
  const abN = abierto("entn", "notas");
  const cp = !hist && esc && en.concPropia && ls.get("entConcNo", "") !== en.turno.id + "|" + en.concPropia.id ? en.concPropia : null;
  html += `
    ${cp ? `<section class="card ent-cp"><div><b>⚖️ Tienes tu conciliación del turno ${h(cp.numero)}</b><div class="sub">${cp.porTraer} conteo(s) de Bodega, KA y PK que aún no están en la entrega. Se traen con sus valores (en cajas) para revisarlos y editarlos.</div></div>
      <div class="row"><button class="btn sm" data-a="cpno">No, gracias</button><button class="btn sm primary" data-a="cptraer">Traer</button></div></section>` : ""}
    ${hist ? "" : `<div class="seg seg-sm ent-zona" id="entZ"><span class="ez-l">📍 Estoy en</span>${[["", "Todo"], ["BODEGA", "Bodega"], ["KA", "KA"], ["PK", "PK"]].map(([k, t]) => `<button type="button" data-ez="${k}" class="${zona === k ? "on" : ""}">${t}</button>`).join("")}</div>`}
    ${zona ? sec(zona) : `<div class="grid2"><div class="col-sec">${sec("BODEGA")}${sec("TPC")}</div><div class="col-sec">${sec("KA")}${sec("PK")}</div></div>`}
    ${seccionReconteo(en, esc)}
    <section class="card notas-card plegable ${abN ? "abierto" : ""}" style="margin-top:14px"><div class="pl-cab" data-plegar="entn|notas" role="button" tabindex="0" aria-expanded="${abN}"><h3>🗒️ Notas del turno <span class="sec-n">${en.notas.length}</span></h3><span class="pl-flecha" aria-hidden="true">▾</span></div>
      <div class="pl-cuerpo"><ol class="notas-l">${en.notas.map(n => `<li><div class="row sb" style="flex-wrap:nowrap;align-items:flex-start"><span>${h(n.texto)}${n.pendiente ? ` <span class="pill warn">guardando…</span>` : ""}</span>${esc && n.id ? `<span class="row" style="flex-wrap:nowrap"><button class="btn sm icon" data-a="nedit" data-id="${h(n.id)}">✎</button><button class="btn sm icon del" data-a="ndel" data-id="${h(n.id)}">${ICO_DEL}</button></span>` : ""}</div><div class="sub">${h(soloHora(n.hora))} · ${h(n.usuario)}</div></li>`).join("")}</ol>
      ${esc ? `<div class="form-row" style="margin:10px 0 0"><label class="field"><span>Nueva novedad</span><input type="text" id="nNota" placeholder="Ej: llegó producto nuevo de Club Colombia 850"></label><button class="btn primary sm" data-a="nota">Agregar</button></div>` : ""}</div></section>
    ${esc && !hist ? botonGuardar("gturno", "Guardar", puedoEliminar(en.turno.abiertoPor) ? "cturno" : "", "Cancelar") : ""}
    ${esc ? fab("add", "Agregar a la entrega") : ""}`;
  el.innerHTML = html;
  // Lo validado que aún no está en la entrega se trae solo (una vez por turno), sin valor, para recontarlo
  if (!hist && esc && (en.validados || []).some(v => !v.enEntrega) && S.entSync !== en.turno.id) {
    S.entSync = en.turno.id;
    api("webEntTraerValidados").then(r => { if (r && r.estado) { S.ent = r.estado; ls.setJ("ent", S.ent); if (S.vista === "entrega" && !modalAbierto()) pintarEnt(); } }).catch(() => { S.entSync = null; });
  }
  if (hist) $("#tb", el).innerHTML = bannerHist(en.turno, "ENTREGA");
  else pintarBarra($("#tb", el), en.turnoInfo, false, botonesTurno);
  const nn = $("#nNota", el); if (nn) nn.onkeydown = e => { if (e.key === "Enter") agregarNota(); };
  el.onclick = e => {
    if (hist && onBanner(e, en.turno, "ENTREGA")) return;
    const z = e.target.closest("[data-ez]"); if (z) { ls.set("entZona", z.dataset.ez); pintarEnt(); return; }
    onEntClick(e);
  };
}

// Reconteo de los validados: lo contado en la entrega (Bodega + KA + PK + TPC, en cajas) contra lo que debería quedar
// (inicial − validado). No se escribe aquí: sale solo de lo que se cuenta en cada zona de la entrega.
const recUn = () => ls.get("recUn", "cj");
const enUn = (n, cpe) => recUn() === "est" && cpe ? (Math.round(n / cpe * 10) / 10) : n;
const fmUn = (n, cpe) => n === null || n === undefined ? "—" : fm(enUn(n, cpe));
const difRec = v => { if (v.diferencia === null || v.diferencia === undefined) return `<span class="muted">—</span>`; const d = v.diferencia; return d ? `<span class="rc-dif ${d < 0 ? "neg" : "pos"}">${d > 0 ? "+" : ""}${fmUn(d, v.cpe)}</span>` : `<span class="rc-dif ok">✓ cuadra</span>`; };
function seccionReconteo(en, esc) {
  const vs = en.validados || [];
  if (!vs.length) return "";
  const ab = abierto("entr", "rec"), listos = vs.filter(v => v.contado !== null && !v.faltan.length).length;
  const un = recUn() === "est" ? "estibas" : "cajas";
  return `<section class="card rec-card plegable ${ab ? "abierto" : ""}" style="margin-top:14px"><div class="pl-cab" data-plegar="entr|rec" role="button" tabindex="0" aria-expanded="${ab}"><h3>🔁 Reconteo de validados <span class="sec-n">${listos}/${vs.length}</span></h3><span class="pl-flecha" aria-hidden="true">▾</span></div>
    <div class="pl-cuerpo"><div class="rec-top"><p class="muted small ayuda">Se suma solo lo contado en <b>Bodega, KA, PK y TPC</b> de esta entrega y se compara con lo que debería quedar (inicial − validado).</p>
      <label class="rec-un"><span>Ver en</span>${miniSel("recU", ["Cajas", "Estibas"], recUn() === "est" ? "Estibas" : "Cajas").replace('class="mini-sel"', 'class="mini-sel ms-un"')}</label></div>
    <div class="rec-tabla"><div class="rec-h"><span>Producto</span><span>Inicial</span><span>Validado</span><span>Debe quedar</span><span>Contado</span><span>Diferencia</span></div>
    ${vs.map(v => `<div class="rec-row ${v.faltan.length ? "falta" : ""}"><div class="rec-p">${skuTxt(v.sku, v.producto)}${v.faltan.length ? `<span class="z-falta">falta ${h(v.faltan.join(", "))}</span>` : ""}${recUn() === "est" && !v.cpe ? `<span class="muted small"> (sin «Cant x Estibas»: en cajas)</span>` : ""}</div>
      <span class="r-ini" data-l="Inicial"><b>${fmUn(v.inicial, v.cpe)}</b></span><span data-l="Validado"><b>${fmUn(v.validado, v.cpe)}</b></span><span class="r-deb" data-l="Debe quedar"><b>${fmUn(v.disponible, v.cpe)}</b></span><span class="r-cont" data-l="Contado"><b>${fmUn(v.contado, v.cpe)}</b></span><span data-l="Diferencia">${difRec(v)}</span></div>`).join("")}</div>
    <p class="muted small" style="margin-bottom:0">En ${un}. ${vs.some(v => v.faltan.length) ? "«Falta» = zonas donde el producto está en la entrega pero todavía no se contó." : ""}</p></div></section>`;
}
document.addEventListener("elegido", e => { if (e.target.id !== "recU") return; ls.set("recUn", e.target.dataset.v === "Estibas" ? "est" : "cj"); if (S.vista === "entrega") pintarEnt(); });

// Guardar sin esperar: se pinta ya y el servidor confirma por detrás
function guardarEntRapido(fn, args, desc, okMsg) {
  enviarOptimista(fn, args, desc, r => { if (r && r.estado) { S.ent = r.estado; if (!S.entTurno) ls.setJ("ent", S.ent); } if (S.vista === "entrega" && !modalAbierto()) pintarEnt(); });
  if (S.vista === "entrega") pintarEnt();
  if (okMsg) toast(okMsg, "ok", 2000);
}
async function guardarEnt(fn, args, okMsg) {
  try { const r = await api(fn, ...args); S.ent = r.estado; if (!S.entTurno) ls.setJ("ent", S.ent); if (okMsg) toast(okMsg, "ok"); }
  catch (e) { toast(e.red ? "Sin conexión: esta acción necesita conexión." : e.message, "bad", 7000); }
  if (S.vista === "entrega") pintarEnt();
}
function agregarNota() {
  const i = $("#nNota"); const t = i.value.trim(); if (!t) return;
  i.value = "";
  guardarEntRapido("webEntNota", [t, S.entTurno || ""], `Nota: ${t.substring(0, 40)}`, "Punto agregado");
}
async function onEntClick(e) {
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a, en = entConPendientes(), T = S.entTurno || "";
  if (a === "add") return modalEntItem(b.dataset.s || ls.get("entZona", "") || S.entSec || Object.keys(SECC).find(s2 => abierto("ent", s2)) || "BODEGA", null, true);
  if (a === "gturno") return modalCerrarTurno();
  if (a === "cturno") return cancelarTurno(en.turno);
  if (a === "cpno") { ls.set("entConcNo", en.turno.id + "|" + en.concPropia.id); pintarEnt(); return; }
  if (a === "cptraer") {
    ocupado(b, true, "Trayendo…");
    try { const r = await api("webEntPrecargar", ["BODEGA", "KA", "PK"], { fuente: "conc" }); S.ent = r.estado; ls.setJ("ent", S.ent); toast(`Traído de tu conciliación: Bodega ${r.resultado.BODEGA} · KA ${r.resultado.KA} · PK ${r.resultado.PK}`, "ok", 6000); }
    catch (er) { toast(er.message, "bad", 7000); }
    pintarEnt(); return;
  }
  if (a === "edit") return modalEntItem(b.dataset.s, en.secciones[b.dataset.s].find(x => x.sku === b.dataset.sku));
  if (a === "mas") return modalEntItem(b.dataset.s, en.secciones[b.dataset.s].find(x => x.sku === b.dataset.sku), false, true);
  if (a === "del") {
    const it = en.secciones[b.dataset.s].find(x => x.sku === b.dataset.sku);
    if (!(await confirmar("Quitar de la entrega", `¿Quitar ${skuTxt(it.sku, it.producto)} de ${SECC[b.dataset.s].t}?`, "Quitar", true))) return;
    return guardarEnt("webEntQuitar", [b.dataset.s, it.sku, T], "Quitado");
  }
  if (a === "vaciar") {
    const s2 = b.dataset.s, n = en.secciones[s2].length;
    if (!(await confirmar("Quitar toda la sección", `¿Quitar los <b>${n}</b> productos de <b>${SECC[s2].t}</b>? Sirve si se precargó por error. No se puede deshacer.`, "Quitar todo", true))) return;
    return guardarEnt("webEntQuitarSeccion", [s2, T], `${SECC[s2].t}: sección vacía`);
  }
  if (a === "nota") return agregarNota();
  if (a === "ndel") { if (!(await confirmar("Quitar punto", "¿Quitar este punto de la nota?", "Quitar", true))) return; return guardarEnt("webEntNotaQuitar", [b.dataset.id, T], "Punto quitado"); }
  if (a === "nedit") {
    const n = en.notas.find(x => x.id === b.dataset.id);
    const c = abrirModal(`<h3>Editar punto</h3><label class="field"><span>Novedad</span><textarea id="neT">${h(n.texto)}</textarea></label><div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="neOk">Guardar</button></div>`);
    $("#neOk", c).onclick = async () => { const t = $("#neT", c).value.trim(); if (!t) return; cerrarModal(true); await guardarEnt("webEntNotaEditar", [n.id, t, T], "Punto actualizado"); };
    return;
  }
  if (a === "precargar") {
    let fuente = S.entAMano ? "conc" : "pocos";
    const c = abrirModal(`<h3>Precargar la entrega</h3>
      <div class="seg seg-sm" id="prF"><button data-f="conc" class="${fuente === "conc" ? "on" : ""}">⚖️ Mi conciliación</button><button data-f="pocos" class="${fuente === "pocos" ? "on" : ""}" ${S.entAMano ? "disabled" : ""}>Pocos del sistema</button></div>
      <p class="muted small" id="prT"></p>
      <div id="prS"></div>
      <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="prOk">Precargar</button></div>`);
    const pintarF = () => {
      $$("#prF button", c).forEach(x => x.classList.toggle("on", x.dataset.f === fuente));
      $("#prT", c).innerHTML = fuente === "conc"
        ? `Trae lo que <b>tú</b> contaste en tu conciliación de este turno o de hoy (a veces se hace en el turno 2): Bodega, KA y PK (en cajas). No toca lo que ya está en la entrega.`
        : (S.entAMano ? `Desactivado: ya estás agregando a mano. Para precargar los pocos, usa «Quitar todo» en cada sección.` : `⚠️ Carga <b>todos</b> los productos con pocas existencias (y los TPC). Pueden ser muchísimos. Se agregan los que falten.`);
      const secs = fuente === "conc" ? ["BODEGA", "KA", "PK"] : Object.keys(SECC);
      $("#prS", c).innerHTML = secs.map(s2 => `<label class="check"><input type="checkbox" data-s="${s2}"><span>${SECC[s2].t}</span></label>`).join("");
    };
    $("#prF", c).onclick = e => { const b2 = e.target.closest("[data-f]"); if (!b2 || b2.disabled) return; fuente = b2.dataset.f; pintarF(); };
    pintarF();
    $("#prOk", c).onclick = async () => {
      const secs = $$("input[data-s]:checked", c).map(x => x.dataset.s);
      if (!secs.length) { toast("Marca al menos una sección.", "bad"); return; }
      if (fuente === "pocos" && S.entAMano) { toast("La precarga de pocos está desactivada porque ya agregaste a mano.", "bad"); return; }
      const btn = $("#prOk", c); ocupado(btn, true, "Precargando…");
      try { const r = await api("webEntPrecargar", secs, { fuente: fuente }); ocupado(btn, false); cerrarModal(true); S.ent = r.estado; ls.setJ("ent", S.ent); toast(`Agregados: Bodega ${r.resultado.BODEGA} · TPC ${r.resultado.TPC} · KA ${r.resultado.KA} · PK ${r.resultado.PK}`, "ok", 6000); pintarEnt(); }
      catch (er) { ocupado(btn, false); toast(er.message, "bad", 7000); }
    };
  }
}

function modalEntItem(s, item, elegir, otra) {
  let cfg = SECC[s];
  let prodSel = item ? { sku: item.sku, prod: item.producto } : null;
  let cant = item ? JSON.parse(JSON.stringify(item.cant || [])) : [];
  // «＋»: se abre con una cantidad nueva al final para sumarla a las que ya tiene
  if (!cant.length || otra) cant.push({ n: "", un: cfg.un, m: "" });
  const c = abrirModal(`<h3 id="eiT">${item ? "Editar" : "Agregar"} · ${cfg.t}</h3>
    ${elegir && !item ? `<div class="seg seg-sm" id="eiS">${Object.keys(SECC).map(k => `<button data-s="${k}" class="${k === s ? "on" : ""}">${h(SECC[k].t.replace(/ \(.*\)$/, ""))}</button>`).join("")}</div>` : ""}
    ${item ? `<div class="m-prod">${skuTxt(item.sku, item.producto)}</div>` : `<div class="buscador"><div class="bq-fila"><input type="search" id="eiP" placeholder="SKU o nombre del producto…" autocomplete="off"></div></div>`}
    <div class="field"><span id="eiL">Cantidades ${cfg.mod ? "(cada una con su módulo)" : ""}</span><div id="eiC"></div></div>
    <button class="btn sm" id="eiMas" style="margin-top:6px">＋ Otra cantidad</button>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="eiOk">Guardar</button></div>`, { wide: true });
  const pintarCant = () => {
    $("#eiC", c).innerHTML = cant.map((x, k) => `<div class="cant-ed ${cfg.mod ? "" : "sin-mod"}" data-k="${k}"><span class="cant-n">${k + 1}</span>
      <input type="text" inputmode="decimal" data-f="n" value="${h(x.n)}" placeholder="Cantidad">
      ${miniSel("eu" + k, ["Estibas", "Cajas", "Unidades"], x.un).replace('class="mini-sel"', 'class="mini-sel ms-un" data-f="un"')}
      ${cfg.mod ? `<input type="text" data-f="m" value="${h(x.m)}" placeholder="Módulo" autocapitalize="characters" autocomplete="off">` : ""}
      <button class="btn sm icon" data-q="${k}" title="Quitar">✕</button></div>`).join("");
  };
  pintarCant();
  if (otra) setTimeout(() => { const ns = $$("#eiC input[data-f=n]", c); if (ns.length) ns[ns.length - 1].focus(); }, 80);
  if ($("#eiS", c)) $("#eiS", c).onclick = e => {
    const b = e.target.closest("[data-s]"); if (!b) return;
    s = b.dataset.s; S.entSec = s; cfg = SECC[s];
    $$("#eiS button", c).forEach(x => x.classList.toggle("on", x === b));
    $("#eiT", c).textContent = `Agregar · ${cfg.t}`; $("#eiL", c).textContent = `Cantidades ${cfg.mod ? "(cada una con su módulo)" : ""}`;
    cant = cant.map(x => Object.assign({}, x, { un: x.n === "" ? cfg.un : x.un }));
    pintarCant();
  };
  if (!item) {
    autoSku($("#eiP", c), p => {
      // Si ya está en esa sección se abre de una vez para editar sus cantidades
      const ya = ((S.ent && S.ent.secciones[s]) || []).find(x => x.sku === p.sku);
      if (ya) { cerrarModal(true); toast(`Ya está en ${SECC[s].t}: edita sus cantidades.`, "", 3000); modalEntItem(s, ya); return; }
      prodSel = p; const n = $("#eiC input[data-f=n]", c); if (n) n.focus();
    });
    alLimpiar($("#eiP", c), () => { prodSel = null; });
  }
  $("#eiC", c).addEventListener("input", e => { const r = e.target.closest("[data-k]"); if (!r) return; cant[+r.dataset.k][e.target.dataset.f] = e.target.value; });
  $("#eiC", c).addEventListener("elegido", e => { const r = e.target.closest("[data-k]"); if (!r) return; cant[+r.dataset.k].un = e.target.dataset.v; });
  $("#eiC", c).addEventListener("click", e => { const q = e.target.closest("[data-q]"); if (!q) return; cant.splice(+q.dataset.q, 1); if (!cant.length) cant.push({ n: "", un: cfg.un, m: "" }); pintarCant(); });
  $("#eiMas", c).onclick = () => { cant.push({ n: "", un: cfg.un, m: "" }); pintarCant(); };
  $("#eiOk", c).onclick = () => {
    if (!prodSel) { const v = $("#eiP", c).value.trim(); const m = v.match(/^(\d+)/); const f = m ? (S.cat || []).find(x => x.sku === m[1]) : (v ? buscarCat(v, 1)[0] : null); if (f) prodSel = f; }
    if (!prodSel) { toast("Escoge el producto de la lista.", "bad"); return; }
    const limpias = cant.map(x => ({ n: String(x.n).replace(",", "."), un: x.un, m: (x.m || "").trim().toUpperCase() })).filter(x => x.n !== "" || x.m);
    if (limpias.some(x => isNaN(Number(x.n)) || Number(x.n) < 0)) { toast("Revisa las cantidades.", "bad"); return; }
    cerrarModal(true);
    guardarEntRapido("webEntGuardar", [s, prodSel.sku, prodSel.prod, limpias.map(x => ({ n: Number(x.n) || 0, un: x.un, m: x.m })), S.entTurno || ""], `Entrega ${s}: ${prodSel.sku}`, "Guardado");
  };
}

// =====================================================================
// CONCILIACIÓN Y PRE-CONCILIACIÓN
// =====================================================================
S.concId = null;
async function cargarConc() {
  if (S.concId) { S.conc = await api("webConc", S.concId); return S.conc; }
  try { S.conc = await api("webConc"); ls.setJ("conc", S.conc); }
  catch (e) { const c = ls.getJ("conc", null); if (e.red && c) S.conc = c; else throw e; }
  return S.conc;
}
const vNum = x => x === "" || x === null || x === undefined ? "" : x;

VISTAS.conciliacion = async (el, p, vigente) => {
  if ((p.concId || null) !== S.concId) S.concZona = "";
  S.concId = p.concId || null; S.concHechos = [];
  const c = !S.concId && (S.conc && !S.conc.historial ? S.conc : ls.getJ("conc", null));
  if (c) { S.conc = c; pintarConc(el); }
  await Promise.all([cargarConc(), cargarCat().catch(() => null)]);
  if (!vigente()) return;
  if (!c) pintarConc(el); else if (!mismo(c, S.conc)) refrescarVista(() => pintarConc());
};

function pintarConc(el) {
  quitarChip();
  el = el || $("#view");
  const k = S.conc, esc = puede("validador"), hist = !!S.concId;
  const pend = k.pre.filter(x => x.estado === "PENDIENTE");
  let html = cab("⚖️ Conciliación con facturación", "Todo en cajas. Rojo: facturación tiene de más (revisar el bloqueo del excedente) · Verde: el conteo cubre la facturación · Azul: tenemos más del 50 % por encima de lo facturado, diferencia grande que hay que revisar.");
  if (!k.conc) {
    html += `<div class="card" style="margin-bottom:14px"><p style="margin-top:0">No hay conciliación abierta.</p>
      <p class="muted small ayuda">Al abrirla escoges el turno (normalmente el 3) y se precargan los pocos, lo que escojas de la pre-conciliación (${pend.length} pendientes), los conteos de la entrega del turno anterior o los productos de una conciliación anterior.</p>
      ${esc ? `<button class="btn primary" data-a="abrir">Abrir conciliación</button>` : ""}</div>
      ${k.ultima ? `<div class="card pdf-row"><div class="t"><b>Última conciliación</b><div class="sub">${h(fechaDMY(k.ultima.fecha))} · cerrada por ${h(k.ultima.cerradoPor)}</div></div>${botonesPDF("CONCILIACION", "PDF", k.ultima.id)}</div>` : ""}`;
    el.innerHTML = html; el.onclick = onConcClick; return;
  }
  k.items.forEach(concRecalc);
  html += hist ? bannerHist(k.conc, "CONCILIACION") : `<section class="card turno${clsInfo()}" data-info="conc"><div class="turno-info"><div class="turno-num">T${h(k.conc.numero)}</div>
      <div class="t-res">Conciliación · ${h(fechaDMY(k.conc.fecha))} <span data-cfalt>${k.faltantes ? `<span class="pill bad">✗ ${k.faltantes}</span>` : ""}</span></div>${togInfo()}
      <div><div class="k">Conciliación</div><div class="v">${h(fechaDMY(k.conc.fecha))}</div></div>
      <div><div class="k">Abierta por</div><div class="v">${h(k.conc.abiertoPor)} · ${h(soloHora(k.conc.inicio))}</div></div>
      <div><div class="k">Resultado</div><div class="v">${k.faltantes ? `<span class="pill bad">✗ ${k.faltantes} con facturación de más</span>` : `<span class="pill ok">✓ Sin faltantes</span>`}</div></div></div>
      <div class="acciones barra-acc">${botonesPDF("CONCILIACION", "PDF", k.conc.id)}</div></section>`;
  // «Falta Bodega / KA / PK»: muestra solo lo que le falta a esa zona, para ir llenándola rápido (se esconde cuando todo está completo)
  if (S.concZona && !k.items.some(x => vNum(x[S.concZona]) === "") && !(S.concHechos || []).length) S.concZona = "";
  const zf = esc ? (S.concZona || "") : "";
  const hayFaltas = ZONAS_C.some(([z]) => k.items.some(x => vNum(x[z]) === ""));
  const inc = k.items.filter(x => !x.completo), comp = k.items.filter(x => x.completo);
  const tarjeta = x => tarjetaConc(x, esc);
  // En el orden en que se agregaron; cada apartado sale solo si tiene productos
  const bloque = (t, cls, lis) => lis.length ? `<section class="cc-col ${cls}"><div class="cc-col-t">${t} <span class="fam-n">${lis.length}</span></div><div class="cc-col-b">${gruposFamilia("c" + cls, lis, tarjeta)}</div></section>` : "";
  const lista = zf ? `<div class="cz-tools"><span class="muted small">Escribe y pasa al siguiente: se guarda solo. Con <b>cj / est</b> escoges cajas o estibas; en lo ya contado, lo que escribas se <b>suma</b>.</span></div>
      <div class="cz-lista">${gruposFamilia("cz-" + zf, k.items.filter(x => vNum(x[zf]) === "" || (S.concHechos || []).includes(x.sku)), x => filaZonaConc(x, zf))}</div>`
    : `<div class="cc-cols ${inc.length && comp.length ? "" : "una"}">${bloque("⏳ Incompletos", "cc-inc", inc)}${bloque("✅ Completos", "cc-comp", comp)}</div>`;
  html += `${esc && pend.length && !hist ? `<div class="barra-acc barra-mini"><button class="btn sm" data-a="pasarpre" title="Pasar de pre-conciliación"><span class="ic">📌</span><span class="txt">Pre-conciliación (${pend.length})</span></button></div>` : ""}
    ${k.items.length ? `<div class="lista-tools"><input type="search" id="cq" placeholder="Buscar producto (SKU o nombre)…" value="${h(S.concQ || "")}">${zf ? "" : `<button class="btn sm" data-a="cabrir">Abrir todas</button><button class="btn sm" data-a="ccerrar">Cerrar todas</button>`}<span class="count" id="cqc"></span></div>
      ${esc && (hayFaltas || zf) ? `<div class="seg seg-sm cz-f" id="czf">${[["", "Todo"]].concat(ZONAS_C).map(([z, t]) => { const n = z ? k.items.filter(x => vNum(x[z]) === "").length : 0; return z && !n && zf !== z ? "" : `<button type="button" data-cz="${z}" class="${zf === z ? "on" : ""}" ${z ? `title="Falta ${h(t)}" aria-label="Falta ${h(t)}"` : ""}>${t}${z ? ` <b data-czn="${z}">${n}</b>` : ""}</button>`; }).join("")}</div>` : ""}
      <div class="conc-resumen" id="cRes">${resumenConc(k.items)}</div>` : ""}
    <div class="clista" id="cTab">${k.items.length ? lista : `<div class="card muted">Sin productos. Toca ＋ para agregarlos.</div>`}</div>
    ${esc && !hist ? botonGuardar("cerrar", "Guardar", puedoEliminar(k.conc.abiertoPor) ? "ccancelar" : "", "Cancelar") : ""}
    ${esc ? fab("agregarc", "Agregar producto") : ""}`;
  el.innerHTML = html;
  el.onclick = e => {
    if (hist && onBanner(e, k.conc, "CONCILIACION")) return;
    const z = e.target.closest("[data-cz]"); if (z) { S.concZona = z.dataset.cz; S.concHechos = []; pintarConc(); return; }
    onConcClick(e);
    // Al cerrar (o cambiar) de tarjeta, la que se completó pasa a «Completos»
    if (e.target.closest("[data-plegar]")) setTimeout(() => reubicarConc(e.target.closest(".conc-card")), 0);
  };
  const tab = $("#cTab", el);
  if (tab) tab.addEventListener("change", onConcCampo);
  const cq = $("#cq", el);
  if (cq) { cq.oninput = () => { S.concQ = cq.value; filtrarConc(el); }; filtrarConc(el); }
}
const ZONAS_C = [["bodega", "Bodega"], ["ka", "KA"], ["pk", "PK"]];
// Recalcula un producto con lo que hay en pantalla (igual que el servidor)
function concRecalc(x) {
  x.total = (Number(x.bodega) || 0) + (Number(x.ka) || 0) + (Number(x.pk) || 0);
  x.nivel = nivelConc(x.total, vNum(x.fact) === "" ? null : Number(x.fact));
  x.check = vNum(x.fact) === "" ? null : x.total >= Number(x.fact);
  x.completo = ZONAS_C.every(([z]) => vNum(x[z]) !== "");
  return x;
}
const resumenConc = items => `<span class="chip c-mal">✗ ${items.filter(x => x.nivel === "mal").length}</span><span class="chip c-ok">✓ ${items.filter(x => x.nivel === "ok").length}</span><span class="chip c-sobra">+50 % ${items.filter(x => x.nivel === "sobra").length}</span><span class="chip">Sin facturación ${items.filter(x => !x.nivel).length}</span>`;
const faltaConcHtml = x => { const f = ZONAS_C.filter(([z]) => vNum(x[z]) === "").map(z => z[1]); return f.length ? ` <span class="z-falta">falta ${f.join(", ")}</span>` : ""; };
// Fila rápida del modo «Falta …»: el producto y el cuadro de esa zona (cajas o estibas).
// Si ya tiene valor, lo que se escriba se SUMA (para ir agregando a medida que se cuenta).
function filaZonaConc(x, z) {
  const hecho = vNum(x[z]) !== "", cpe = cpeDe(x.sku);
  return `<div class="cz-row ${hecho ? "hecho" : ""}" data-row="${h(x.sku)}" data-q="${h(x.sku + " " + x.producto)}"><div class="cz-p">${skuTxt(x.sku, x.producto)}${hecho ? `<div class="sub">Lleva <b data-czv>${fm(x[z])}</b> cajas</div>` : ""}</div>
    <div class="cz-in">${unBtn(cpe)}<input type="text" inputmode="numeric" data-f="${z}" data-sku="${h(x.sku)}" ${hecho ? `data-sumar="1"` : ""} value="" placeholder="${hecho ? "＋ sumar" : "cantidad"}" data-ph="${hecho ? "＋ sumar" : "cantidad"}"><span class="cz-h">${hecho ? "✓" : ""}</span></div></div>`;
}
function filtrarConc(el) {
  const q = norm(S.concQ || "").split(/\s+/).filter(x => x);
  let n = 0;
  const filas = $$(".clista .conc-card, .clista .cz-row", el);
  filas.forEach(c => { const ok = !q.length || coincide(norm(c.dataset.q), q) > 0; c.classList.toggle("hidden", !ok); if (ok) n++; });
  filtrarGrupos(el, q.length > 0, S.concZona ? ".cz-row" : ".conc-card");
  const c = $("#cqc", el); if (c) c.textContent = q.length ? `${n} de ${filas.length}` : `${filas.length} productos`;
}
const nivelConc = (tot, fact) => fact === null || fact === "" ? "" : (tot < fact ? "mal" : (fact > 0 && tot > fact * 1.5 ? "sobra" : "ok"));
const chkConc = (nivel, tot, fact) => nivel === "mal" ? `<span class="chk-no">✗ faltan ${fm(fact - tot)}</span>` : nivel === "sobra" ? `<span class="chk-sobra">✓ +${Math.round((tot / fact - 1) * 100)} %</span>` : nivel === "ok" ? `<span class="chk-ok">✓</span>` : "";
// Cada producto es una tarjeta: cerrada muestra SKU, nombre, total y facturación con su color
function tarjetaConc(x, esc) {
  const inp = (f, v, l) => `<label class="cc-campo cc-${f}"><span>${l}${esc && f !== "fact" ? " " + unBtn(cpeDe(x.sku)) : ""}</span>${esc ? `<input type="text" inputmode="numeric" data-f="${f}" data-sku="${h(x.sku)}" value="${h(vNum(v))}" placeholder="—">` : `<b>${v === "" ? "—" : fm(v)}</b>`}</label>`;
  const ab = abierto("conc", x.sku);
  return `<article class="card conc-card plegable ${x.nivel || "sin"} ${ab ? "abierto" : ""}" data-row="${h(x.sku)}" data-comp="${x.completo ? 1 : 0}" data-q="${h(x.sku + " " + x.producto)}">
    <div class="pl-cab" data-plegar="conc|${h(x.sku)}" role="button" tabindex="0" aria-expanded="${ab}">
      <div class="cc-tit"><div class="prod">${skuTxt(x.sku, x.producto)}</div><div class="cc-res">Total <b data-tot>${fm(x.total)}</b> · Fact <b data-fact>${vNum(x.fact) === "" ? "—" : fm(x.fact)}</b> <span data-chk>${chkConc(x.nivel, x.total, x.fact)}</span><span data-falta>${faltaConcHtml(x)}</span>${x.bloqueo ? ` <span class="pill">🔒 bloqueo</span>` : ""}<span data-tnota>${x.nota ? ` <span class="pill cc-tn" title="${h(x.nota)}">📝</span>` : ""}</span></div></div>
      <span class="pl-flecha" aria-hidden="true">▾</span></div>
    <div class="pl-cuerpo">
      <div class="cc-grid">${inp("bodega", x.bodega, "Bodega")}${inp("ka", x.ka, "KA")}${inp("pk", x.pk, "PK")}${inp("fact", x.fact, "Facturación")}
        <label class="cc-bloq ${x.bloqueo ? "on" : ""}"><input type="checkbox" data-f="bloqueo" data-sku="${h(x.sku)}" ${x.bloqueo ? "checked" : ""} ${esc ? "" : "disabled"}><span>🔒 Bloqueo del excedente</span></label>
        ${esc ? `<button class="btn sm cc-sum" data-a="ccant" data-sku="${h(x.sku)}" title="Sumar o corregir (Bodega en cajas o estibas)">＋ Sumar</button><button class="btn sm icon del cc-del" data-a="qconc" data-sku="${h(x.sku)}" title="Quitar de la conciliación" aria-label="Quitar de la conciliación">${ICO_DEL}</button>` : ""}
        <label class="cc-nota"><span>📝 Nota</span>${esc ? `<input type="text" data-f="nota" data-sku="${h(x.sku)}" value="${h(x.nota || "")}" maxlength="300" placeholder="Opcional: algo que deba saber quien revise">` : `<b>${h(x.nota || "—")}</b>`}</label></div>
    </div></article>`;
}
// Lo que cambia en pantalla apenas se guarda un valor: la tarjeta (total, color, «falta …») y los contadores
function pintarConcItem(it) {
  const tr = document.querySelector(`.conc-card[data-row="${CSS.escape(it.sku)}"]`);
  if (tr) {
    tr.querySelector("[data-tot]").textContent = fm(it.total);
    tr.querySelector("[data-fact]").textContent = vNum(it.fact) === "" ? "—" : fm(it.fact);
    tr.querySelector("[data-chk]").innerHTML = chkConc(it.nivel, it.total, it.fact);
    tr.querySelector("[data-falta]").innerHTML = faltaConcHtml(it);
    ["mal", "ok", "sobra", "sin"].forEach(c => tr.classList.toggle(c, (it.nivel || "sin") === c));
    ZONAS_C.concat([["fact"]]).forEach(([z]) => { const i = tr.querySelector(`input[data-f="${z}"]`); if (i && document.activeElement !== i) i.value = vNum(it[z]); });
  }
  const items = S.conc.items;
  const r = $("#cRes"); if (r) r.innerHTML = resumenConc(items);
  ZONAS_C.forEach(([z]) => { const b = document.querySelector(`[data-czn="${z}"]`); if (b) b.textContent = items.filter(x => vNum(x[z]) === "").length; });
  const nf = items.filter(x => x.nivel === "mal").length, f = document.querySelector("[data-cfalt]");
  if (f) f.innerHTML = nf ? `<span class="pill bad">✗ ${nf}</span>` : "";
  setTimeout(() => reubicarConc(), 0);
}
// Una tarjeta cerrada que cambió de completo a incompleto (o al revés) pasa a su apartado sin recargar la página.
// La que está abierta (se está escribiendo en ella) espera a que se cierre.
function reubicarConc(ancla) {
  if (S.vista !== "conciliacion" || S.concZona || !S.conc || !S.conc.conc) return;
  const mal = $$(".conc-card").filter(c => !c.classList.contains("abierto")).some(c => { const it = S.conc.items.find(x => x.sku === c.dataset.row); return it && String(it.completo ? 1 : 0) !== c.dataset.comp; });
  if (!mal) return;
  const act = document.activeElement; if (act && /INPUT|TEXTAREA/.test(act.tagName) && act.closest(".conc-card")) return;
  const ref = ancla || $(".conc-card.abierto"), sku = ref && ref.dataset.row, y0 = ref ? ref.getBoundingClientRect().top : 0;
  pintarConc();
  if (sku) { const n = document.querySelector(`.conc-card[data-row="${CSS.escape(sku)}"]`); if (n) window.scrollBy(0, n.getBoundingClientRect().top - y0); }
}
function guardarConcCampos(sku, campos, desc) {
  enviarOptimista("webConcGuardar", [sku, campos, S.concId || ""], desc, r => {
    if (!(r && r.estado)) return;
    S.conc = r.estado; if (!S.concId) ls.setJ("conc", S.conc);
    // Si el servidor calculó distinto (otra persona también escribió), se corrige sin recargar
    const it = S.conc.items.find(x => x.sku === sku);
    if (it && S.vista === "conciliacion") pintarConcItem(concRecalc(it));
  });
}
function onConcCampo(e) {
  const i = e.target.closest("[data-f]"); if (!i) return;
  const sku = i.dataset.sku, f = i.dataset.f;
  const tr = i.closest(".conc-card");
  const it = S.conc && S.conc.items.find(x => x.sku === sku);
  if (f === "nota") {
    const nota = i.value.trim(); i.value = nota;
    if (tr) tr.querySelector("[data-tnota]").innerHTML = nota ? ` <span class="pill cc-tn" title="${h(nota)}">📝</span>` : "";
    if (it) it.nota = nota;
    guardarConcCampos(sku, { nota: nota }, `Conciliación ${sku}: nota`);
    return;
  }
  if (f === "bloqueo") {
    const l = i.closest(".cc-bloq"); if (l) l.classList.toggle("on", i.checked);
    if (it) it.bloqueo = i.checked;
    guardarConcCampos(sku, { bloqueo: i.checked }, `Conciliación ${sku}: bloqueo`);
    return;
  }
  // Lo escrito puede estar en estibas (cj / est): se guarda en cajas
  const n = f === "fact" ? (i.value.replace(/\D/g, "") === "" ? "" : Number(i.value.replace(/\D/g, ""))) : cajasDe(i);
  const cont = i.closest("label, .cz-in"), ub = cont && cont.querySelector(".un-sel");
  if (ub && ub.dataset.unt === "est") { unReset(cont); i.placeholder = i.dataset.ph || "—"; if (n !== "") toast(`= ${fm(n)} cajas`, "", 2500); }
  const row = i.closest(".cz-row");
  const valor = n === "" ? "" : String(n);
  // Modo «Falta …» en lo ya contado: lo escrito se suma
  if (row && i.dataset.sumar && n !== "") {
    if (it) { it[f] = (Number(it[f]) || 0) + n; concRecalc(it); pintarConcItem(it); }
    i.value = ""; const v = row.querySelector("[data-czv]"); if (v && it) v.textContent = fm(it[f]);
    const hz = row.querySelector(".cz-h"); if (hz) hz.textContent = `✓ +${fm(n)}`;
    const c2 = { sumar: true }; c2[f] = valor;
    guardarConcCampos(sku, c2, `Conciliación ${sku}: sumar ${f}`);
    return;
  }
  i.value = row ? "" : valor;
  if (it) { it[f] = valor === "" ? "" : Number(valor); concRecalc(it); pintarConcItem(it); }
  // Fila del modo «Falta …»: queda marcada como hecha y desde ahí lo que se escriba se suma
  if (row && valor !== "") {
    row.classList.add("hecho"); S.concHechos = (S.concHechos || []).concat([sku]);
    i.dataset.sumar = "1"; i.placeholder = "＋ sumar"; i.dataset.ph = "＋ sumar";
    const pz = row.querySelector(".cz-p"); if (pz && !pz.querySelector("[data-czv]")) pz.insertAdjacentHTML("beforeend", `<div class="sub">Lleva <b data-czv>${fm(Number(valor))}</b> cajas</div>`);
    const hz = row.querySelector(".cz-h"); if (hz) hz.textContent = "✓";
  }
  const campos = {}; campos[f] = valor;
  guardarConcCampos(sku, campos, `Conciliación ${sku}: ${f}`);
}
// Sumar o corregir Bodega, KA y PK de un producto; Bodega se puede escribir en estibas (se convierte con «Cant x Estibas»)
function modalConcCant(x) {
  let modo = "sumar";
  const cpe = cpeDe(x.sku);
  const c = abrirModal(`<h3>Cantidades</h3><div class="m-prod">${skuTxt(x.sku, x.producto)}</div>
    <div class="seg seg-sm" id="kmo"><button data-m="sumar" class="on">＋ Sumar</button><button data-m="fijar">Corregir</button></div>
    <div class="m-zonas">${campoZona("kB", "Bodega", "", cpe)}${campoZona("kK", "KA", "", cpe)}${campoZona("kP", "PK", "", cpe)}<div class="z-tot"><span>Total</span><b id="kT">0</b></div></div>
    <div class="small m-res" id="kr"></div>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="kok">Guardar</button></div>`);
  const val = id => cajasDe($("#" + id, c));
  const llenar = () => {
    $$(".f-zona", c).forEach(unReset);
    $("#kB", c).value = modo === "fijar" ? vNum(x.bodega) : ""; $("#kK", c).value = modo === "fijar" ? vNum(x.ka) : ""; $("#kP", c).value = modo === "fijar" ? vNum(x.pk) : "";
  };
  const upd = () => {
    const z = { bodega: val("kB"), ka: val("kK"), pk: val("kP") };
    const nuevo = k2 => modo === "sumar" ? (z[k2] === "" ? vNum(x[k2]) : (Number(x[k2]) || 0) + z[k2]) : z[k2];
    const tot = ZONAS_C.reduce((a, [k2]) => a + (Number(nuevo(k2)) || 0), 0);
    $("#kT", c).textContent = fm(tot);
    $("#kr", c).innerHTML = modo === "sumar" ? `Queda: Bodega <b>${nuevo("bodega") === "" ? "—" : fm(nuevo("bodega"))}</b> · KA <b>${nuevo("ka") === "" ? "—" : fm(nuevo("ka"))}</b> · PK <b>${nuevo("pk") === "" ? "—" : fm(nuevo("pk"))}</b> (en cajas)` : "";
  };
  $("#kmo", c).onclick = e => { const b = e.target.closest("[data-m]"); if (!b) return; modo = b.dataset.m; $$("#kmo button", c).forEach(y => y.classList.toggle("on", y === b)); llenar(); upd(); $("#kB", c).focus(); };
  c.addEventListener("input", e => { if (e.target.closest(".f-zona")) { e.target.value = e.target.value.replace(/\D/g, ""); upd(); } });
  llenar(); upd();
  $("#kok", c).onclick = () => {
    const z = { bodega: val("kB"), ka: val("kK"), pk: val("kP") };
    if (modo === "sumar" && ZONAS_C.every(([k2]) => z[k2] === "")) { toast("Escribe cuánto sumar.", "bad"); return; }
    const campos = modo === "sumar" ? Object.assign({ sumar: true }, z) : z;
    const it = S.conc.items.find(y => y.sku === x.sku);
    if (it) { ZONAS_C.forEach(([k2]) => { if (modo === "sumar") { if (z[k2] !== "") it[k2] = (Number(it[k2]) || 0) + z[k2]; } else it[k2] = z[k2]; }); concRecalc(it); }
    cerrarModal(true);
    if (it) pintarConcItem(it);
    guardarConcCampos(x.sku, campos, `Conciliación ${x.sku}: ${modo === "sumar" ? "sumar" : "cantidades"}`);
    toast(modo === "sumar" ? "Sumado" : "Guardado", "ok", 2000);
  };
  setTimeout(() => $("#kB", c).focus(), 60);
}
async function onConcClick(e) {
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a, k = S.conc;
  if (a === "abrir") {
    const pend = k.pre.filter(x => x.estado === "PENDIENTE");
    let num = turnoPorHora();
    const hor = k.horarios || { 1: "10 p.m. – 6 a.m.", 2: "6 a.m. – 2 p.m.", 3: "2 p.m. – 10 p.m." };
    const horC = n => String(hor[n] || "").replace(/:00/g, "");
    const ant = n => ({ 1: 3, 2: 1, 3: 2 })[n];
    const c = abrirModal(`<h3>Abrir conciliación</h3><p class="muted small">¿De qué turno es la conciliación? Normalmente se hace en el turno 3.</p>
      <div class="num-pick" id="caN">${[1, 2, 3].map(n => `<button type="button" data-n="${n}" class="${n === num ? "on" : ""}"><b>${n}</b><span>${h(horC(n))}</span></button>`).join("")}</div>
      <label class="check"><input type="checkbox" id="caP"><span>Precargar los <b>pocos</b> (columna Minimo)</span></label>
      <label class="check"><input type="checkbox" id="caE"><span>Incluir lo contado en la <b>entrega del turno <span id="caA">${ant(num)}</span></b> (y usar esos conteos)</span></label>
      ${(k.anteriores || []).length ? `<details class="cp-ant"><summary>📋 Copiar los productos de una conciliación anterior</summary><p class="muted small">Solo los productos, con los valores en blanco para contarlos.</p>${listaCopiar("caC", k.anteriores, true)}</details>` : ""}
      <h2 style="margin-top:14px">📌 Pre-conciliación (${pend.length})</h2>
      ${pend.length ? pend.map(x => `<label class="check"><input type="checkbox" data-pre="${h(x.id)}"><span>${skuTxt(x.sku, x.producto)}<br><span class="sub">Turno ${h(x.turno || "?")} · ${h(x.usuario)}${x.motivo ? " · " + h(x.motivo) : ""}</span></span></label>`).join("") : `<p class="muted small">No hay productos anotados.</p>`}
      <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="caOk">Abrir conciliación</button></div>`, { wide: true });
    $("#caN", c).onclick = e2 => { const bt = e2.target.closest("[data-n]"); if (!bt) return; num = +bt.dataset.n; $$("#caN button", c).forEach(x => x.classList.toggle("on", x === bt)); $("#caA", c).textContent = ant(num); };
    $("#caOk", c).onclick = async () => {
      const btn = $("#caOk", c); ocupado(btn, true, "Abriendo…");
      try {
        const r = await api("webConcAbrir", { numero: num, pocos: $("#caP", c).checked, entrega: $("#caE", c).checked, pre: $$("input[data-pre]:checked", c).map(x => x.dataset.pre), copiar: cpElegida(c, "caC") });
        ocupado(btn, false); cerrarModal(true); S.conc = r.estado; ls.setJ("conc", S.conc);
        toast(`Conciliación del turno ${r.resultado.numero} abierta con ${r.resultado.productos} productos${r.resultado.conteoDe ? ` (conteos de ${r.resultado.conteoDe})` : ""}`, "ok", 6000); pintarConc();
      } catch (er) { ocupado(btn, false); toast(er.message, "bad", 7000); }
    };
    return;
  }
  if (a === "ccancelar") {
    if (!(await pedirPin("✖ Cancelar conciliación", `¿Cancelar la conciliación del <b>turno ${h(k.conc.numero)}</b>?<br><br>Se deshace completa: sus productos y conteos quedan fuera y lo que vino de la pre-conciliación vuelve a quedar pendiente. Los turnos, validaciones y entregas no se tocan. Un administrador la puede restaurar desde el historial.<br><br>Para no cancelarla por error, escribe tu PIN.`, "Cancelar conciliación"))) return;
    try { await api("webConcEliminar", k.conc.id); S.conc = await api("webConc"); ls.setJ("conc", S.conc); toast("Conciliación cancelada", "ok"); pintarConc(); } catch (er) { toast(er.message, "bad", 7000); }
    return;
  }
  if (a === "cabrir" || a === "ccerrar") {
    S.abiertos.conc = {}; k.items.forEach(x => { S.abiertos.conc[x.sku] = a === "cabrir"; });
    $$(".conc-card").forEach(c => c.classList.toggle("abierto", a === "cabrir"));
    return;
  }
  if (a === "ccant") { const x = k.items.find(y => y.sku === b.dataset.sku); if (x) modalConcCant(x); return; }
  if (a === "agregarc") {
    const ants = k.anteriores || [];
    const c = abrirModal(`<h3>Agregar a la conciliación</h3><div class="buscador"><div class="bq-fila"><input type="search" id="cAdd" placeholder="SKU o nombre del producto…" autocomplete="off"></div></div><p class="muted small">Escoge el producto de la lista. Si la entrega del turno anterior lo contó, se trae ese conteo. Si ya está, se abre para sumar.</p>
      ${ants.length ? `<details class="cp-ant"><summary>📋 Copiar los productos de una conciliación anterior</summary><p class="muted small">Solo los productos, con los valores en blanco para contarlos. Los que ya están no se tocan.</p>${listaCopiar("cCp", ants, false)}<div class="cp-acc"><button class="btn sm primary" id="cCpOk">📋 Copiar</button></div></details>` : ""}
      <div class="modal-actions"><button class="btn" data-x>Cerrar</button></div>`);
    autoSku($("#cAdd", c), async p => {
      // Si ya está en la conciliación se abre de una vez para sumar o corregir
      const ya = k.items.find(x => x.sku === p.sku);
      if (ya) { cerrarModal(true); modalConcCant(ya); return; }
      try {
        const r = await api("webConcAgregar", [{ sku: p.sku, producto: p.prod }], S.concId || "");
        S.conc = r.estado; S.abiertos.conc = S.abiertos.conc || {}; S.abiertos.conc[p.sku] = true;
        toast(r.resultado.agregados ? `${p.prod} agregado` : "Ya estaba en la conciliación", r.resultado.agregados ? "ok" : "warn");
        cerrarModal(true); pintarConc();
      } catch (e) { toast(e.message, "bad", 6000); }
    }, { limpiar: true });
    if ($("#cCpOk", c)) $("#cCpOk", c).onclick = async () => {
      const btn = $("#cCpOk", c); ocupado(btn, true, "Copiando…");
      try { const r = await api("webConcCopiar", cpElegida(c, "cCp"), S.concId || ""); S.conc = r.estado; ocupado(btn, false); cerrarModal(true); toast(`${r.resultado.agregados} producto(s) copiados${r.resultado.yaEstaban ? ` · ${r.resultado.yaEstaban} ya estaban` : ""}`, "ok", 5000); pintarConc(); }
      catch (er) { ocupado(btn, false); toast(er.message, "bad", 6000); }
    };
    return;
  }
  if (a === "pasarpre") {
    const pend = k.pre.filter(x => x.estado === "PENDIENTE");
    const c = abrirModal(`<h3>Pasar de pre-conciliación</h3>${pend.map(x => `<label class="check"><input type="checkbox" data-pre="${h(x.id)}"><span>${skuTxt(x.sku, x.producto)}<br><span class="sub">Turno ${h(x.turno || "?")} · ${h(x.usuario)}${x.motivo ? " · " + h(x.motivo) : ""}</span></span></label>`).join("")}
      <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="ppOk">Pasar a la conciliación</button></div>`);
    $("#ppOk", c).onclick = async () => {
      const ids = new Set($$("input[data-pre]:checked", c).map(x => x.dataset.pre));
      const items = pend.filter(x => ids.has(x.id)).map(x => ({ sku: x.sku, producto: x.producto, preId: x.id }));
      try { const r = await api("webConcAgregar", items, ""); cerrarModal(true); S.conc = r.estado; toast(`${r.resultado.agregados} producto(s) pasados`, "ok"); pintarConc(); } catch (er) { toast(er.message, "bad", 6000); }
    };
    return;
  }
  if (a === "qconc") {
    if (!(await confirmar("Quitar producto", `¿Quitar el SKU <b>${h(b.dataset.sku)}</b> de la conciliación?`, "Quitar", true))) return;
    try { const r = await api("webConcQuitar", b.dataset.sku, S.concId || ""); S.conc = r.estado; pintarConc(); } catch (er) { toast(er.message, "bad"); }
    return;
  }
  if (a === "cerrar") {
    const pendCola = noConfirmados("webConcGuardar").length;
    const c = abrirModal(`<h3>Guardar conciliación</h3>
      ${pendCola ? `<div class="err">Hay ${pendCola} cambio(s) sin subir. Espera a que suban.</div>` : ""}
      ${k.faltantes ? `<div class="note warn">✗ ${k.faltantes} producto(s) con facturación de más. Revisa que tengan marcado el bloqueo del excedente.</div>` : ""}
      <p class="muted small">La conciliación se cierra y queda en el historial. Si se te olvida algo, después la puedes editar desde allá.</p>
      <label class="field"><span>Nota (opcional)</span><textarea id="ccN"></textarea></label>
      ${botonesCierre("cc", pendCola ? "disabled" : "")}`);
    $$("[data-modo]", c).forEach(btn => btn.onclick = async () => {
      const modo = btn.dataset.modo;
      $$("[data-modo]", c).forEach(x => { x.disabled = true; }); ocupado(btn, true, "Guardando…");
      try {
        const r = await api("webConcCerrar", { nota: $("#ccN", c).value.trim(), pdf: modo === "pdf", telegram: modo === "tg" });
        ocupado(btn, false); cerrarModal(true); S.conc = r.estado; ls.setJ("conc", S.conc); toast("Conciliación guardada", "ok");
        if (modo === "pdf" && r.pdf) bajarB64(r.pdf.nombre, r.pdf.b64);
        if (modo === "tg") toast(r.telegram ? "PDF enviado al grupo de Telegram" : "Se guardó, pero no se pudo enviar el PDF al grupo. Envíalo desde el historial.", r.telegram ? "ok" : "bad", 7000);
        pintarConc();
      } catch (er) { ocupado(btn, false); $$("[data-modo]", c).forEach(x => { x.disabled = false; }); toast(er.message, "bad", 7000); }
    });
  }
}

VISTAS.preconciliacion = async (el, p, vigente) => {
  S.concId = null;
  const c = S.conc && !S.conc.historial ? S.conc : ls.getJ("conc", null);
  if (c) { S.conc = c; pintarPre(el); }
  await Promise.all([cargarConc(), cargarCat().catch(() => null)]);
  if (!vigente()) return;
  if (!c) pintarPre(el); else if (!mismo(c, S.conc)) refrescarVista(() => pintarPre());
};
function pintarPre(el) {
  quitarChip();
  el = el || $("#view");
  const k = S.conc, esc = puede("validador");
  const locales = noConfirmados("webPreAgregar").map(x => ({ id: "", sku: x.args[0], producto: x.args[1], motivo: x.args[2], usuario: x.quien, fecha: x.ts, estado: "PENDIENTE", local: true }));
  const pend = k.pre.filter(x => x.estado === "PENDIENTE").concat(locales), pas = k.pre.filter(x => x.estado !== "PENDIENTE");
  el.innerHTML = cab("📌 Pre-conciliación", "Los turnos 1 y 2 anotan productos que creen que hay que conciliar; el turno 3 escoge cuáles pasar.",
      esc && k.pre.length ? `<button class="btn danger sm" data-a="limpiar">Limpiar lista</button>` : "") +
    (esc ? `<div class="card" style="margin-bottom:14px"><div class="form-row" style="margin:0"><div style="flex:2 1 280px">${campoAuto("preP")}</div><label class="field" style="flex:1 1 200px"><span>Motivo (opcional)</span><input type="text" id="preM" placeholder="Ej: facturaron más de lo que hay"></label><button class="btn primary" data-a="anotar">Anotar</button></div></div>` : "") +
    `<h2>Pendientes (${pend.length})</h2>` +
    (pend.length ? `<div class="grid tarjetas">${pend.map(x => `<article class="card ${x.local ? "pendiente" : ""}"><div class="row sb" style="flex-wrap:nowrap;align-items:flex-start"><div><b>${skuTxt(x.sku, x.producto)}</b>${x.local ? ` <span class="pill warn">guardando…</span>` : ""}</div>${esc && x.id ? `<button class="btn sm icon del" data-a="qpre" data-id="${h(x.id)}" aria-label="Quitar">${ICO_DEL}</button>` : ""}</div>
        <div class="sub" style="margin-top:6px">${x.turno ? "Turno " + h(x.turno) + " · " : ""}${h(x.usuario)} · ${h(fechaCorta(x.fecha))}</div>${x.motivo ? `<div class="small" style="margin-top:6px">📝 ${h(x.motivo)}</div>` : ""}</article>`).join("")}</div>` : vacio("No hay productos anotados.", "📌")) +
    (k.conc && pend.filter(x => x.id).length && esc ? `<div style="margin-top:12px"><button class="btn primary" data-a="pasar">Pasar pendientes a la conciliación abierta</button></div>` : "") +
    (pas.length ? `<details class="card"><summary>Ya pasados a una conciliación (${pas.length})</summary><div class="mini-list" style="margin-top:8px">${pas.map(x => `<div class="mini">${skuTxt(x.sku, x.producto)} · ${h(x.usuario)} · ${h(fechaCorta(x.fecha))}</div>`).join("")}</div></details>` : "");
  let elegido = null;
  const inp = $("#preP", el);
  if (inp) {
    autoSku(inp, c => { elegido = c; });
    inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.defaultPrevented && elegido) $("[data-a=anotar]", el).click(); });
  }
  el.onclick = async e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a;
    if (a === "anotar") {
      if (!elegido) { const v = inp.value.trim(), m = v.match(/^(\d+)/); if (m) elegido = (S.cat || []).find(x => x.sku === m[1]) || null; }
      if (!elegido) { toast("Escoge el producto de la lista.", "bad"); return; }
      const args = [elegido.sku, elegido.prod, $("#preM", el).value.trim()];
      enviarOptimista("webPreAgregar", args, `Pre-conciliación: ${elegido.sku}`, r => { if (r && r.estado) { S.conc = r.estado; ls.setJ("conc", S.conc); } if (S.vista === "preconciliacion") pintarPre(); });
      toast("Anotado", "ok", 2000);
      pintarPre();
    } else if (a === "qpre") {
      try { const r = await api("webPreQuitar", b.dataset.id); S.conc = r.estado; pintarPre(); } catch (er) { toast(er.message, "bad"); }
    } else if (a === "limpiar") {
      if (!(await confirmar("Limpiar pre-conciliación", "Se borra toda la lista (pendientes y ya pasados). Úsalo después de conciliar.", "Limpiar", true))) return;
      try { const r = await api("webPreLimpiar"); S.conc = r.estado; toast("Lista en blanco", "ok"); pintarPre(); } catch (er) { toast(er.message, "bad"); }
    } else if (a === "pasar") {
      const items = pend.filter(x => x.id).map(x => ({ sku: x.sku, producto: x.producto, preId: x.id }));
      try { const r = await api("webConcAgregar", items, ""); S.conc = r.estado; toast(`${r.resultado.agregados} producto(s) pasados a la conciliación`, "ok"); pintarPre(); } catch (er) { toast(er.message, "bad", 6000); }
    }
  };
}

// =====================================================================
// CONSUMO / PONY GASTO
// =====================================================================
VISTAS.consumo = async (el, p, vigente) => {
  const [lis] = await Promise.all([api("webConsumo"), cargarCat().catch(() => null)]);
  if (!vigente()) return;
  // Pony solo muestra: la lista, el nombre, el orden y el módulo se cambian en Administración › Lista de consumo
  const esc = false;
  // Los módulos van en su orden FEFO; el elegido (automático o a mano) solo se resalta, no sube
  const lote = (x, l) => `<div class="lote v-${h(l.vida)} ${l.sel ? "sel" : ""} ${l.sel && x.modo === "manual" ? "manual" : ""} ${l.sel && x.unico ? "unico" : ""} ${!l.disp ? "bloq" : ""}"><div>
      ${l.sel ? `🎯 <b style="color:var(--brand)">CONSUMIR AQUÍ</b>${x.modo === "manual" ? ` <span class="pill mano-p">✋ Elegido a mano</span>` : ""}<br>` : ""}${l.sel && x.unico ? `<span class="pill unico-p">⚠️ Único módulo con este producto</span><br>` : ""}${l.fefo ? `<span class="fefo-n" title="Puesto en el FEFO">${l.fefo}</span>` : ""}${modChip(l.m)}${l.rv ? ` <span class="tag t-rv">🟠 Reportado vacío</span>` : ""}${l.esOp ? ` <span class="pill info">KA/PREV</span>` : ""}${l.prio ? " 🚨" + botonFoto(x.sku, l.m) : ""}
      ${l.lleno === false ? ` <span class="pill warn">Incompleto ${fm(l.usadas)}/${fm(l.capTot)}</span>` : (l.lleno ? ` <span class="pill">Lleno</span>` : "")}
      ${!l.disp ? ` <span class="pill bad">BLOQ · ${h(l.est)}</span>` : ""}<br>${qty(l.e, l.c, l.u)}<br>
      <span class="small">Vence <b>${h(l.vf)}</b> (${l.d === 9999 ? "sin fecha" : l.d + " d"})</span></div>
      ${esc && l.disp && !l.sel && !l.esOp && !l.rv ? `<button class="btn sm" data-el="${h(l.m)}" data-sku="${h(x.sku)}">Elegir</button>` : ""}</div>`;
  // KA y PREV se surten desde bodega (ya están listos para despachar): se ocultan salvo que se pidan
  const verOp = ls.get("consVerOp", "") === "1";
  const visibles = x => x.locs.filter(l => verOp || !l.esOp);
  const sinTxt = x => x.estado === "sin_fisico" ? `❌ Sin existencias <span class="muted">· quizás haya en PK o KA</span>` : x.estado === "solo_operativa" ? "Solo en KA / PREV (ya surtido)" : x.estado === "solo_reportado" ? "🟠 Solo en módulos reportados vacíos" : "❌ Sin módulo disponible";
  // Dos tarjetas desplegables: los módulos a consumir y los módulos completos (la lista se edita en Administración)
  const abS = S.abiertos.consv ? !!S.abiertos.consv.solo : true, abT = !!(S.abiertos.consv && S.abiertos.consv.todo);
  const tarjetaV = (k, ab, tit, cuerpo) => `<section class="card plegable cons-sec ${ab ? "abierto" : ""}"><div class="pl-cab" data-plegar="consv|${k}" role="button" tabindex="0" aria-expanded="${ab}"><h3>${tit}</h3><span class="pl-flecha" aria-hidden="true">▾</span></div><div class="pl-cuerpo">${cuerpo}</div></section>`;
  const fila = x => { const t = x.locs.filter(l => l.sel); const l = t[0];
    return `<div class="cs-row ${x.unico ? "unico" : ""} ${l ? "" : "sin"}"><div class="cs-p">${skuTxt(x.sku, x.nom)}${x.unico ? ` <span class="pill unico-p">⚠️ Único módulo</span>` : ""}${x.modo === "manual" ? ` <span class="pill">✋ a mano</span>` : ""}</div>
      ${l ? `<div class="cs-m">${modChip(l.m)}${l.prio ? " 🚨" : ""}</div><div class="cs-q">${qty(t.reduce((a, y) => a + y.e, 0), t.reduce((a, y) => a + y.c, 0), t.reduce((a, y) => a + y.u, 0))}</div><div class="cs-v">Vence <b>${h(l.vf)}</b></div>` : `<div class="cs-sin">${sinTxt(x)}</div>`}</div>`; };
  const solo = `<div class="barra-acc barra-mini">${botonesPDF("CONSUMO_SOLO", "PDF")}</div><div class="cs-lista">${lis.map(fila).join("")}</div>`;
  const todo = `<div class="barra-acc barra-mini">${botonesPDF("CONSUMO", "PDF completo")}</div>
    <p class="small muted ayuda" style="margin-top:0">Orden FEFO (criterios): 1) prioridad · 2) fecha más corta y módulo incompleto · 3) fecha · 4) con la misma fecha, el más incompleto. ${esc ? "Toca «Elegir» para cambiar el módulo: el elegido se resalta y se queda en su puesto. " : "El módulo lo escoge el administrador. "}KA y PREV no se usan: se surten desde bodega y lo que hay allá ya está listo para despachar.</p>
    <div class="lista-tools"><button class="btn sm" id="cAll">Abrir todas</button><button class="btn sm" id="cNone">Cerrar todas</button><label class="toggle"><input type="checkbox" id="cOp" ${verOp ? "checked" : ""}> Mostrar KA / PREV</label></div>
    <div class="grid tarjetas">${lis.map(x => { const sel = x.locs.find(l => l.sel), ab = abierto("cons", x.sku); return `<article class="card plegable cons-card ${x.unico ? "unico" : ""} ${ab ? "abierto" : ""}">
      <div class="pl-cab" data-plegar="cons|${h(x.sku)}" role="button" tabindex="0" aria-expanded="${ab}"><div><div class="prod">${skuTxt(x.sku, x.nom)}</div>${x.unico ? `<span class="pill unico-p">⚠️ Observación: único módulo</span>` : ""}<div class="sub">${sel ? `🎯 Consumir en ${modChip(sel.m)}` : sinTxt(x)}</div></div><span class="pl-flecha" aria-hidden="true">▾</span></div>
      <div class="pl-cuerpo">
      <div class="sub" style="margin:4px 0 8px">${x.modo === "manual" ? `✋ Elegido a mano por <b>${h(x.elegidoPor)}</b> · ${h(fechaCorta(x.elegidoEn))} ${esc ? `<button class="link" data-auto="${h(x.sku)}">volver a automático</button>` : ""}` : "⚙️ Automático (criterios)"}${x.manualVencido ? ` · <span style="color:var(--warn)">el módulo elegido a mano se vació</span>` : ""}</div>
      ${x.estado === "sin_fisico" ? `<div class="mini">❌ Sin existencias físicas en bodega. Quizás haya en PK o KA.</div>` : ""}
      ${x.estado === "solo_bloqueado" ? `<div class="note warn">Todos los módulos están bloqueados.</div>` : ""}
      ${x.estado === "solo_operativa" ? `<div class="note warn">Solo hay en KA / PREV (ya surtido para despacho): no se consume de ahí.</div>` : ""}
      <div class="mini-list">${visibles(x).map(l => lote(x, l)).join("")}</div></div></article>`; }).join("")}</div>`;
  el.innerHTML = cab("🥤 Consumo / Pony gasto", "") +
    (lis.length ? tarjetaV("solo", abS, "🎯 Módulos a consumir", solo) + tarjetaV("todo", abT, "📦 Módulos completos", todo) : vacio(`La lista de consumo está vacía.${esc ? " Agrégala desde Administración › Lista de consumo." : " El administrador la arma."}`, "🛒"));
  const todas = abrir => { S.abiertos.cons = {}; lis.forEach(x => { S.abiertos.cons[x.sku] = abrir; }); $$(".cons-card", el).forEach(c => c.classList.toggle("abierto", abrir)); };
  if ($("#cAll", el)) { $("#cAll", el).onclick = () => todas(true); $("#cNone", el).onclick = () => todas(false); }
  if ($("#cOp", el)) $("#cOp", el).onchange = e => { ls.set("consVerOp", e.target.checked ? "1" : ""); ir("consumo"); };
  el.onclick = async e => {
    if (e.target.closest("[data-lista]")) return ir("consumolista");
    const s = e.target.closest("[data-el]");
    if (s) { try { await api("webConsumoElegir", s.dataset.sku, s.dataset.el); toast(`Módulo ${s.dataset.el} elegido para consumo`, "ok"); ir("consumo"); } catch (er) { toast(er.message, "bad", 6000); } return; }
    const a = e.target.closest("[data-auto]");
    if (a) { try { await api("webConsumoElegir", a.dataset.auto, ""); toast("Volvió al cálculo automático", "ok"); ir("consumo"); } catch (er) { toast(er.message, "bad"); } }
  };
};

// =====================================================================
// "Huber · 2026-09-27 22:37:41" → "Huber · 27/09 22:37"
const fmtEd = s => String(s || "").replace(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/, m => fechaCorta(m));
// HISTORIALES (uno para validaciones, otro para entregas y otro para conciliaciones)
// =====================================================================
const HIST = {
  VALIDACION: { t: "🗂️ Historial de validaciones", vista: "validacion", param: "turnoId", sub: "Turnos cerrados: saldo validado por producto" },
  ENTREGA: { t: "🗂️ Historial de entregas de turno", vista: "entrega", param: "turnoId", sub: "Bodega, TPC, KA, PK y notas de cada turno" },
  CONCILIACION: { t: "🗂️ Historial de conciliaciones", vista: "conciliacion", param: "concId", sub: "Conteos por área contra facturación" }
};
VISTAS.hval = (el, p, v) => vistaHistorial(el, "VALIDACION", v);
VISTAS.hent = (el, p, v) => vistaHistorial(el, "ENTREGA", v);
VISTAS.hconc = (el, p, v) => vistaHistorial(el, "CONCILIACION", v);

async function vistaHistorial(el, tipo, vigente) {
  const cfg = HIST[tipo];
  const f = Object.assign({ desde: "", hasta: "", turno: "", persona: "", eliminados: false }, ls.getJ("filt_" + tipo, {}));
  const admin = puede("administrador");
  el.innerHTML = cab(cfg.t, cfg.sub, admin ? `<button class="btn sm" id="hArch">🧹 Archivar historial viejo</button>` : "") +
    `<details class="card filtros" ${window.innerWidth > 699 ? "open" : ""}><summary>🔎 Filtros</summary><div class="form-row" style="margin:10px 0 0">
      <label class="field"><span>Desde</span><input type="date" id="hD" value="${h(f.desde)}"></label>
      <label class="field"><span>Hasta</span><input type="date" id="hH" value="${h(f.hasta)}"></label>
      <label class="field"><span>Turno</span><select id="hT"><option value="">Todos</option>${[1, 2, 3].map(n => `<option ${String(n) === String(f.turno) ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label class="field"><span>Persona</span><input type="text" id="hP" value="${h(f.persona)}" placeholder="Nombre"></label>
      ${admin ? `<label class="toggle"><input type="checkbox" id="hE" ${f.eliminados ? "checked" : ""}> Ver eliminados</label>` : ""}
      <button class="btn primary" id="hB">Buscar</button></div></details><div id="hR">${loader()}</div>`;
  let lis = [];
  const pintar = () => {
    $("#hR", el).innerHTML = lis.length ? `<div class="count" style="margin:4px 0 10px">${lis.length} registros</div><div class="grid tarjetas">${lis.map(x => {
      const elim = /ELIMINAD/.test(x.estado), abierto = /ABIERT/.test(x.estado);
      return `<article class="card hcard ${elim ? "elim" : ""}">
        <div class="row sb" style="flex-wrap:nowrap"><div class="row" style="flex-wrap:nowrap"><span class="turno-num sm">T${h(x.numero || "?")}</span><b style="font-size:16px">${h(fechaDMY(x.fecha))}</b></div>
          <span class="pill ${elim ? "bad" : abierto ? "warn" : "ok"}">${h(abierto ? "En curso" : elim ? "Eliminado" : "Cerrado")}</span></div>
        <div class="hc-l">🔓 <b>${h(x.abiertoPor)}</b> · ${h(fechaCorta(x.inicio))}</div>
        ${x.cerradoPor ? `<div class="hc-l">🔒 <b>${h(x.cerradoPor)}</b> · ${h(fechaCorta(x.cierre))}</div>` : ""}
        ${x.editadoPor ? `<div class="hc-l" style="color:var(--warn)">✏️ Editado: ${h(fmtEd(x.editadoPor))}</div>` : ""}
        ${x.eliminadoPor ? `<div class="hc-l" style="color:var(--bad)">${ICO_DEL} Eliminado: ${h(x.eliminadoPor)}</div>` : ""}
        <div class="hc-chips">${x.resumen.map(r => `<span class="chip">${h(r[0])} <b>${fm(r[1])}</b></span>`).join("")}</div>
        ${x.nota ? `<div class="hc-l small">📝 ${h(x.nota)}</div>` : ""}
        <div class="hc-acc">${!elim ? `<button class="btn sm primary" data-ver="${h(x.id)}">${puede("validador") ? "✏️ Ver / editar" : "👁 Ver"}</button><button class="btn sm" data-pdf="${tipo}" data-id="${h(x.id)}">📄 PDF</button>` : ""}
          ${!elim && puede("validador") && x.puedeEliminar ? `<button class="btn sm icon del" data-el="${h(x.id)}" title="Eliminar" aria-label="Eliminar">${ICO_DEL}</button>` : ""}
          ${elim && admin ? `<button class="btn sm" data-res="${h(x.id)}">↩ Restaurar</button>` : ""}</div></article>`;
    }).join("")}</div>` : vacio("Nada con esos filtros.", "🔎");
  };
  const buscar = async () => {
    const q = { tipo: tipo, desde: $("#hD", el).value, hasta: $("#hH", el).value, turno: $("#hT", el).value, persona: $("#hP", el).value.trim(), eliminados: $("#hE", el) ? $("#hE", el).checked : false };
    ls.setJ("filt_" + tipo, q);
    $("#hR", el).innerHTML = loader();
    try { lis = await api("webHistorial", q); if (vigente()) pintar(); }
    catch (e) { $("#hR", el).innerHTML = errBox(e); }
  };
  $("#hB", el).onclick = buscar;
  if ($("#hArch", el)) $("#hArch", el).onclick = () => modalArchivar(buscar);
  $("#hR", el).onclick = async e => {
    const ver = e.target.closest("[data-ver]");
    if (ver) {
      const x = lis.find(y => y.id === ver.dataset.ver);
      if (/ABIERT/.test(x.estado)) ir(cfg.vista); else { const p = {}; p[cfg.param] = x.id; ir(cfg.vista, p); }
      return;
    }
    const d = e.target.closest("[data-el]");
    if (d) { const x = lis.find(y => y.id === d.dataset.el); await eliminarHist(tipo, Object.assign({ texto: `${{ VALIDACION: "Validación", ENTREGA: "Entrega", CONCILIACION: "Conciliación" }[tipo]} · Turno ${x.numero} · ${fechaDMY(x.fecha)}` }, x), buscar); return; }
    const r = e.target.closest("[data-res]");
    if (r) { try { await (tipo === "CONCILIACION" ? api("webConcRestaurar", r.dataset.res) : api("webTurnoRestaurar", r.dataset.res, PARTE[tipo])); toast("Restaurado", "ok"); buscar(); } catch (er) { toast(er.message, "bad", 6000); } }
  };
  buscar();
}

// Refresco automático de las vistas de turno (varias personas trabajan a la vez).
// No repinta si alguien está escribiendo, tocando la pantalla o con una ventana abierta.
setInterval(async () => {
  if (document.hidden || S.sinCon || !S.tk || S.pendRepintar || S.enviando.length) return;
  const act = document.activeElement;
  if (act && /INPUT|TEXTAREA|SELECT/.test(act.tagName)) return;
  const vista = S.vista;
  try {
    if (vista === "validacion" && !S.valTurno && !S.valEnviando.length) { const v = await api("webVal"); if (S.vista === vista && !mismo(v, S.val)) { S.val = v; ls.setJ("val", v); refrescarVista(() => pintarVal()); } }
    else if (vista === "entrega" && !S.entTurno) { const v = await api("webEnt"); if (S.vista === vista && !mismo(v, S.ent)) { S.ent = v; ls.setJ("ent", v); refrescarVista(() => pintarEnt()); } }
    else if ((vista === "conciliacion" || vista === "preconciliacion") && !S.concId) { const v = await api("webConc"); if (S.vista === vista && !mismo(v, S.conc)) { S.conc = v; ls.setJ("conc", v); refrescarVista(() => vista === "conciliacion" ? pintarConc() : pintarPre()); } }
  } catch (e) {}
}, 30000);

// Archivar lo de hace más de 1 mes (validaciones, entregas, conciliaciones y pre-conciliación)
async function modalArchivar(alTerminar) {
  const c = abrirModal(`<h3>🧹 Archivar historial viejo</h3>${loader("Revisando qué hay para archivar…")}`);
  let p;
  try { p = await api("webMantPrevia", 30); }
  catch (e) { c.innerHTML = `<h3>🧹 Archivar historial viejo</h3>${errBox(e)}<div class="modal-actions"><button class="btn" data-x>Cerrar</button></div>`; $$("[data-x]", c).forEach(b => b.onclick = () => cerrarModal()); return; }
  const nada = !p.filas;
  c.innerHTML = `<h3>🧹 Archivar historial viejo</h3>
    <p class="muted small">Se mueve al archivo <b>Frecs_Archivo</b> todo lo cerrado o eliminado de antes del <b>${h(fechaDMY(p.corte))}</b> (más de 1 mes). No se borra: queda guardado allá con las mismas columnas. Lo abierto y el último turno cerrado nunca se mueven. Después de archivar, esos turnos ya no salen en los historiales.</p>
    <div class="kv-list">
      <div><span>🔄 Turnos (validación y entrega)</span><b>${fm(p.turnos)}</b></div>
      <div><span>⚖️ Conciliaciones</span><b>${fm(p.conciliaciones)}</b></div>
      <div><span>📄 Filas en total</span><b>${fm(p.filas)}</b></div></div>
    ${p.archivo ? `<p class="small"><a href="${h(p.archivo)}" target="_blank" rel="noopener">Abrir Frecs_Archivo</a></p>` : ""}
    ${nada ? `<div class="note">No hay nada de hace más de 1 mes para archivar.</div>` : ""}
    <div class="modal-actions"><button class="btn" data-x>${nada ? "Cerrar" : "Cancelar"}</button>${nada ? "" : `<button class="btn primary" id="arOk">Archivar ${fm(p.filas)} filas</button>`}</div>`;
  $$("[data-x]", c).forEach(b => b.onclick = () => cerrarModal());
  if (nada) return;
  $("#arOk", c).onclick = async () => {
    const b = $("#arOk", c); ocupado(b, true, "Archivando…"); modalBusy = true;
    try {
      const r = await api("webMantArchivar", 30);
      modalBusy = false; cerrarModal(true);
      toast(`Archivado: ${fm(r.turnos)} turnos y ${fm(r.conciliaciones)} conciliaciones (${fm(r.filas)} filas)`, "ok", 7000);
      if (alTerminar) alTerminar();
    } catch (e) { modalBusy = false; ocupado(b, false); toast(e.message, "bad", 8000); }
  };
}

// =====================================================================
// ENTREGA FINAL: un solo PDF con la entrega, las conciliaciones y la validación de un turno
// =====================================================================
VISTAS.final = async (el, p, vigente) => {
  el.innerHTML = cab("📦 Entrega final", "Une en un solo PDF lo del turno que escojas, en este orden: la entrega de turno (en su hoja), el reconteo de validados, las conciliaciones (si hubo), la validación detallada y, si quieres, el consumo / pony gasto. Conciliación y validación van juntas si caben; si son largas, cada una en su hoja.") + loader("Buscando turnos…");
  let base;
  try { base = await api("webFinal", ""); } catch (e) { if (vigente()) el.insertAdjacentHTML("beforeend", errBox(e)); return; }
  if (!vigente()) return;
  if (!base.turnos.length) { el.innerHTML = cab("📦 Entrega final") + vacio("No tienes turnos para armar la entrega final (solo se usan tus propios turnos).", "📭"); return; }
  const def = (base.turnos.find(t => t.estado === "CERRADO") || base.turnos[0]).id;
  S.finalTurno = base.turnos.some(t => t.id === S.finalTurno) ? S.finalTurno : def;
  await pintarFinal(el, base, vigente);
};
async function pintarFinal(el, base, vigente) {
  const cabF = cab("📦 Entrega final", "Une en un solo PDF lo del turno que escojas, en este orden: la entrega de turno (en su hoja), el reconteo de validados, las conciliaciones (si hubo), la validación detallada y, si quieres, el consumo / pony gasto. Conciliación y validación van juntas si caben; si son largas, cada una en su hoja.");
  const selT = `<label class="field"><span>Turno</span><select id="fnT">${base.turnos.map(t => `<option value="${h(t.id)}" ${t.id === S.finalTurno ? "selected" : ""}>${h(t.texto)}${t.estado === "ABIERTO" ? " (en curso)" : ""}</option>`).join("")}</select></label>`;
  el.innerHTML = cabF + `<section class="card fin-card"><h3>1 · Turno</h3>${selT}</section>` + loader("Revisando el turno…");
  $("#fnT", el).onchange = e => { S.finalTurno = e.target.value; pintarFinal(el, base, vigente); };
  let d;
  try { d = await api("webFinal", S.finalTurno); } catch (e) { el.insertAdjacentHTML("beforeend", errBox(e)); return; }
  if (!vigente() || S.vista !== "final") return;
  const sug = d.conc.filter(c => c.sugerida), otras = d.conc.filter(c => !c.sugerida);
  const chkConc = (c, on) => `<label class="check"><input type="checkbox" data-fc="${h(c.id)}" ${on ? "checked" : ""}><span>⚖️ ${h(c.texto)}<br><span class="sub">${c.estado === "ABIERTA" ? "En curso" : "Cerrada"}${c.cerradoPor ? " · " + h(c.cerradoPor) : ""}${c.sugerida ? " · del mismo turno" : ""}</span></span></label>`;
  const ent = d.ent || {}, val = d.val || {};
  el.innerHTML = cabF + `<section class="card fin-card"><h3>1 · Turno</h3>${selT}</section>
    <section class="card fin-card"><h3>2 · Qué va en el PDF</h3>
      <label class="check"><input type="checkbox" id="fnE" ${ent.items || ent.notas ? "checked" : ""}><span>📋 <b>Entrega de turno</b><br><span class="sub">${ent.items || 0} productos · ${ent.notas || 0} notas${ent.eliminada ? " · ⚠️ eliminada" : ""}</span></span></label>
      <label class="check"><input type="checkbox" id="fnR" ${val.productos ? "checked" : ""}><span>🔁 <b>Reconteo de validados</b><br><span class="sub">Lo contado en la entrega contra lo que debía quedar de cada producto validado</span></span></label>
      <div class="fin-sub">Conciliaciones</div>
      ${sug.length ? sug.map(c => chkConc(c, true)).join("") : `<p class="muted small">No hay conciliación tuya de este mismo turno.</p>`}
      ${otras.length ? `<details class="fin-otras"><summary>Ver otras conciliaciones (${otras.length})</summary>${otras.map(c => chkConc(c, false)).join("")}</details>` : ""}
      <div class="fin-sub">Validación</div>
      <label class="check"><input type="checkbox" id="fnV" ${val.productos || val.registros ? "checked" : ""}><span>📝 <b>Validación de facturación</b><br><span class="sub">${val.productos || 0} productos · ${val.registros || 0} validaciones${val.eliminada ? " · ⚠️ eliminada" : ""}</span></span></label>
      <label class="check sub-check"><input type="checkbox" id="fnW" checked><span>Detallada: con lo contado en cada zona y lo validado a cada destino</span></label>
      <div class="fin-sub">Consumo</div>
      <label class="check"><input type="checkbox" id="fnC"><span>🥤 <b>Consumo / pony gasto</b> (módulos a consumir)<br><span class="sub">${d.consumo || 0} productos en la lista</span></span></label>
    </section>
    <section class="card fin-card"><h3>3 · PDF</h3><p class="muted small" id="fnRes"></p><div class="barra-acc" id="fnB"></div></section>`;
  $("#fnT", el).onchange = e => { S.finalTurno = e.target.value; pintarFinal(el, base, vigente); };
  const actualizar = () => {
    const concs = $$("input[data-fc]:checked", el).map(x => x.dataset.fc);
    const partes = ($("#fnE", el).checked ? "E" : "") + ($("#fnR", el).checked ? "R" : "") + ($("#fnV", el).checked ? ($("#fnW", el).checked ? "W" : "V") : "") + ($("#fnC", el).checked ? "C" : "");
    const orden = [partes.includes("E") && "Entrega de turno", partes.includes("R") && "Reconteo de validados", concs.length && (concs.length > 1 ? `${concs.length} conciliaciones` : "Conciliación"), (partes.includes("V") || partes.includes("W")) && "Validación", partes.includes("C") && "Consumo"].filter(x => x);
    $("#fnRes", el).textContent = orden.length ? "Orden: " + orden.join(" → ") : "Escoge al menos una parte.";
    $("#fnB", el).innerHTML = orden.length ? botonesPDF("FINAL", "Descargar PDF", `${S.finalTurno}|${concs.join(",")}|${partes}`) : "";
  };
  el.onchange = e => { if (e.target.id !== "fnT") actualizar(); };
  actualizar();
}

// =====================================================================
// REPORTE DE MÓDULOS: reportar vacío, reportar conflicto y reportes generados
// Lo usa el verificador (y cualquiera con sesión). Al guardar le llega un aviso al grupo
// de Telegram; un validador o administrador lo marca completado (o se cierra solo cuando
// una sincronización del WMS lo confirma).
// =====================================================================
const seccionMod = m => { const x = /^[A-Za-z]+/.exec(String(m || "")); return x ? x[0].toUpperCase() : "OTROS"; };
// Módulos con producto según el aplicativo (lo que dice el WMS), agrupados por sección
function modulosConProducto(inv) {
  const mods = {};
  inv.forEach(i => { if (i.fis) (mods[i.m] = mods[i.m] || { m: i.m, sec: seccionMod(i.m), lotes: [] }).lotes.push(i); });
  return Object.values(mods).sort((a, b) => a.sec.localeCompare(b.sec) || cmpMod(a, b));
}
// Lo que dice el aplicativo de un módulo (queda guardado en el reporte)
function sistemaDe(lotes) {
  if (!lotes || !lotes.length) return { sku_sistema: "", producto_sistema: "(vacío en el aplicativo)", detalle_sistema: "" };
  const skus = [...new Set(lotes.map(l => l.s))], prods = [...new Set(lotes.map(l => l.p))];
  const e = lotes.reduce((a, l) => a + (l.e || 0), 0), c = lotes.reduce((a, l) => a + (l.c || 0), 0);
  const v = lotes.map(l => l.v).filter(x => x).sort()[0];
  return { sku_sistema: skus.join(", "), producto_sistema: prods.join(" / "), detalle_sistema: `${fm(e)} estibas · ${fm(c)} cajas${v ? " · vence " + fechaDMY(v) : ""}` };
}
const repMatch = (m, q) => !q || norm(m).replace(/\s+/g, "").startsWith(q) || norm(m).replace(/\s+/g, "").includes(q);
const qMod = v => norm(limpiarMod(v)).replace(/\s+/g, "");
// Lista de módulos por secciones (sirve de sugerencias mientras se escribe)
function listaModulos(mods, q, sel, opts) {
  const f = mods.filter(x => repMatch(x.m, q));
  if (!f.length) return "";
  const grupos = {};
  f.forEach(x => (grupos[x.sec] = grupos[x.sec] || []).push(x));
  return Object.keys(grupos).map(s => `<section class="rep-sec"><h3>${h(nombreSeccion(s))} <span class="sec-n">${grupos[s].length}</span></h3><div class="rep-mods">${grupos[s].map(x => {
    // Verde: con producto disponible · rojo: todo lo que tiene está bloqueado. Se muestra el lote que vence primero.
    const ya = opts.ya ? opts.ya(x.m) : null, on = sel.has(x.m);
    const l = x.lotes.slice().sort((a, b) => (b.disp ? 1 : 0) - (a.disp ? 1 : 0) || tV(a.v) - tV(b.v))[0];
    const disp = x.lotes.some(y => y.disp);
    return `<button type="button" class="rep-mod ${disp ? "m-disp" : "m-bloq"} ${on ? "on" : ""} ${ya ? "ya" : ""}" data-m="${h(x.m)}" ${ya ? `disabled title="${h(ya)}"` : ""}>
      <span class="rm-n">${h(x.m)}${disp ? "" : ` <span class="rm-b">BLOQ</span>`}</span>
      ${ya ? `<span class="rm-p">${h(ya)}</span>` : `<span class="rm-prod">${h(l.p)}</span>
      <span class="rm-p">Vence <b>${h(l.vf)}</b>${l.d !== 9999 ? ` · ${l.d < 0 ? `vencido hace ${-l.d} d` : `${l.d} d`}` : ""}</span>
      ${l.actTxt ? `<span class="rm-p">Act: ${h(l.actTxt)}</span>` : ""}${x.lotes.length > 1 ? `<span class="rm-p">+${x.lotes.length - 1} lote${x.lotes.length > 2 ? "s" : ""}</span>` : ""}`}</button>`;
  }).join("")}</div></section>`).join("");
}
// Sugerencias del módulo mientras se escribe (como el buscador de SKU): se toca y queda escogido
function autoModulo(input, mods, onPick, opts) {
  opts = opts || {};
  const box = document.createElement("div");
  box.className = "ac-list hidden";
  input.parentNode.appendChild(box);
  input.setAttribute("autocomplete", "off");
  let items = [], sel = -1;
  const pintar = () => {
    const q = qMod(input.value);
    if (!q) { items = []; box.classList.add("hidden"); return; }
    // primero los que empiezan igual (B1 → B1, B10, B11…), luego los que lo contienen
    items = mods.filter(x => qMod(x.m).startsWith(q)).concat(mods.filter(x => !qMod(x.m).startsWith(q) && qMod(x.m).includes(q))).slice(0, opts.max || 10);
    sel = items.length && opts.primero !== false ? 0 : -1;
    if (!items.length) { box.classList.add("hidden"); if (opts.sinCoincidencia) opts.sinCoincidencia(input.value.trim()); return; }
    if (opts.sinCoincidencia) opts.sinCoincidencia("");
    box.innerHTML = items.map((x, k) => {
      const l = x.lotes.slice().sort((a, b) => (b.disp ? 1 : 0) - (a.disp ? 1 : 0) || tV(a.v) - tV(b.v))[0], disp = x.lotes.some(y => y.disp), ya = opts.ya ? opts.ya(x.m) : null;
      return `<div class="ac-item ac-mod ${k === sel ? "on" : ""} ${ya ? "ya" : ""}" data-k="${k}"><span class="acm-n ${disp ? "d" : "b"}">${h(x.m)}</span><div class="acm-t"><b>${h(l.p)}</b><div class="sub">${ya ? h(ya) : `Vence ${h(l.vf)}${disp ? "" : " · BLOQUEADO"}${x.lotes.length > 1 ? ` · ${x.lotes.length} lotes` : ""}`}</div></div></div>`;
    }).join("");
    box.classList.remove("hidden");
  };
  const elegir = k => {
    const x = items[k]; if (!x) return;
    if (opts.ya && opts.ya(x.m)) { toast(opts.ya(x.m), "warn", 4000); return; }
    box.classList.add("hidden"); input.value = opts.dejar ? x.m : ""; input.blur();
    if (opts.dejar) input.dispatchEvent(new Event("change", { bubbles: true }));
    onPick(x);
  };
  input.addEventListener("input", pintar);
  input.addEventListener("input", () => subirAlEscribir(input), { once: true });
  input.addEventListener("focus", () => { if (input.value.trim()) pintar(); });
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); if (!box.classList.contains("hidden") && sel >= 0) elegir(sel); else if (opts.alEnter) opts.alEnter(); return; }
    if (box.classList.contains("hidden")) return;
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); }
    else if (e.key === "Escape") { box.classList.add("hidden"); return; }
    else return;
    $$(".ac-item", box).forEach((x, k) => x.classList.toggle("on", k === sel));
  });
  box.addEventListener("mousedown", e => { const it = e.target.closest("[data-k]"); if (it) { e.preventDefault(); elegir(+it.dataset.k); } });
  input.addEventListener("blur", () => setTimeout(() => box.classList.add("hidden"), 150));
}
function avisoGuardado(r, que) {
  const n = (r.creados || []).length, rep = (r.repetidos || []);
  if (n) toast(`${que}: ${n} módulo${n > 1 ? "s" : ""}${r.telegram ? " · aviso enviado al grupo" : ""}`, "ok", 4000);
  if (rep.length) toast(`Ya estaba${rep.length > 1 ? "n" : ""} reportado${rep.length > 1 ? "s" : ""}: ${rep.join(", ")}`, "warn", 6000);
  if (n && r.telegram === false && S.grupoTg) toast("El reporte quedó guardado, pero no se pudo avisar al grupo de Telegram.", "warn", 6000);
}

// ---------- Reportar vacío ----------
VISTAS.repvacio = async (el, p, vigente) => {
  const inv = await cargarInv();
  if (!vigente()) return;
  const mods = modulosConProducto(inv), sel = new Set();
  if (p.m && mods.some(x => x.m === p.m) && !repVacio(p.m)) sel.add(p.m);
  el.innerHTML = cab("⬜ Reportar módulo vacío", "Escribe el módulo que encontraste vacío (o búscalo en la lista), márcalo y guarda. A los validadores les llega un aviso para ponerlo en cero en el WMS. Mientras tanto el módulo sale con la etiqueta «Reportado como vacío» y el FEFO lo salta.") +
    `<div class="rep-busca"><input type="search" id="rvQ" placeholder="Módulo (ej: B12)" autocomplete="off" autocapitalize="characters" enterkeyhint="done"></div>
    <div class="rep-elegidos" id="rvS"></div><div id="rvL"></div>
    <div class="rep-pie card hidden" id="rvP"><label class="field"><span>Nota (opcional)</span><input type="text" id="rvN" maxlength="300" placeholder="Ej: quedó una estiba rota"></label>
      <div class="fin-acc"><span></span><button type="button" class="btn b-verde" id="rvG" disabled>💾 Guardar</button></div></div>`;
  const ya = m => repVacio(m) ? `Ya reportado vacío por ${repDe(m).v.por}` : null;
  const pintar = () => {
    const q = qMod($("#rvQ", el).value);
    $("#rvS", el).innerHTML = sel.size ? `<span class="small muted">Marcados como vacíos:</span> ${[...sel].map(m => `<span class="chip rep-chip">${h(m)}<button type="button" class="cs-x" data-x="${h(m)}" aria-label="Quitar ${h(m)}">✕</button></span>`).join("")}` : "";
    $("#rvL", el).innerHTML = listaModulos(mods, q, sel, { ya }) || vacio(q ? `Ningún módulo con producto coincide con «${h($("#rvQ", el).value.trim())}». Si el aplicativo ya lo muestra vacío, no hace falta reportarlo.` : "No hay módulos con producto.", "🔎");
    const b = $("#rvG", el); b.disabled = !sel.size; b.textContent = sel.size ? `💾 Guardar (${sel.size})` : "💾 Guardar";
    // La nota y Guardar aparecen solo cuando hay módulos marcados (en el celular ocupan mucho)
    $("#rvP", el).classList.toggle("hidden", !sel.size);
  };
  const q0 = $("#rvQ", el);
  q0.addEventListener("input", pintar);
  autoModulo(q0, mods, x => { sel.add(x.m); pintar(); }, { ya });
  el.onclick = async e => {
    const x = e.target.closest("[data-x]"); if (x) { sel.delete(x.dataset.x); pintar(); return; }
    const b = e.target.closest(".rep-mod[data-m]");
    if (b && !b.disabled) { const m = b.dataset.m; if (sel.has(m)) sel.delete(m); else sel.add(m); if (q0.value) { q0.value = ""; } pintar(); return; }
    if (e.target.closest("#rvG")) {
      if (!sel.size) return;
      const lista = [...sel];
      if (!(await confirmar("Reportar vacíos", `¿Reportar como <b>vacío${lista.length > 1 ? "s" : ""}</b>: ${lista.map(m => `<b>${h(m)}</b>`).join(", ")}?`, "Sí, reportar"))) return;
      const nota = $("#rvN", el).value.trim(), btn = $("#rvG", el); ocupado(btn, true);
      const items = lista.map(m => Object.assign({ tipo: "VACIO", modulo: m, nota: nota }, sistemaDe(mods.find(x => x.m === m).lotes)));
      try { const r = await api("webReporteCrear", items); guardarRep(r.lista); avisoGuardado(r, "Reportado vacío"); sel.clear(); $("#rvN", el).value = ""; ocupado(btn, false); pintar(); }
      catch (er) { ocupado(btn, false); toast(er.message, "bad", 7000); }
    }
  };
  pintar();
};

// ---------- Reportar conflicto (el módulo tiene otro producto) ----------
VISTAS.repconflicto = async (el, p, vigente) => {
  const [inv] = await Promise.all([cargarInv(), cargarCat().catch(() => null)]);
  if (!vigente()) return;
  const mods = modulosConProducto(inv), vacia = new Set();
  let mod = p.m ? limpiarMod(p.m) : "", prod = null;
  el.innerHTML = cab("⚠️ Reportar conflicto", "Cuando en el módulo hay un producto distinto al que dice el aplicativo (por ejemplo, no se reportó vacío y modularon ahí). Escoge el módulo, mira lo que dice el aplicativo y escoge el producto que encontraste.") +
    `<div id="rcPaso1"><div class="rep-busca"><input type="search" id="rcQ" placeholder="Módulo (ej: B12)" autocomplete="off" autocapitalize="characters" enterkeyhint="done"></div><div id="rcO"></div><div id="rcL"></div></div>
    <div id="rcPaso2" class="hidden"></div>`;
  const q0 = $("#rcQ", el);
  const pintarLista = () => {
    const txt = q0.value.trim(), q = qMod(txt);
    const exacto = mods.some(x => qMod(x.m) === q);
    $("#rcO", el).innerHTML = q.length >= 2 && !exacto ? `<button type="button" class="btn sm" data-otro="${h(limpiarMod(txt))}">Usar «${h(limpiarMod(txt))}» (el aplicativo lo tiene vacío)</button>` : "";
    $("#rcL", el).innerHTML = listaModulos(mods, q, vacia, { ya: m => repDe(m).c ? `Conflicto ya reportado por ${repDe(m).c.por}` : null }) || (q ? "" : vacio("No hay módulos con producto.", "🔎"));
  };
  const pintarForm = () => {
    const x = mods.find(y => y.m === mod), lotes = x ? x.lotes : [], yaC = repDe(mod).c;
    $("#rcPaso1", el).classList.add("hidden");
    const f = $("#rcPaso2", el); f.classList.remove("hidden");
    f.innerHTML = `<section class="card rep-form">
      <div class="row sb"><h3 style="margin:0">📍 ${modChip(mod)}</h3><button type="button" class="link" data-cambiar>Cambiar módulo</button></div>
      ${yaC ? `<div class="note warn">Ya hay un conflicto pendiente en ${h(mod)} (reportado por ${h(yaC.por)}).</div>` : ""}
      <div class="rep-dice"><div class="small muted">El aplicativo dice que tiene:</div>
        ${lotes.length ? `<div class="mini-list">${lotes.map(l => `<div class="mini v-${h(l.vida)}">${skuTxt(l.s, l.p)} · ${qty(l.e, l.c, l.u)} · vence ${h(l.vf)}</div>`).join("")}</div>` : `<div class="mini">Nada: el módulo está vacío en el aplicativo.</div>`}</div>
      <div style="margin-top:12px">${campoAuto("rcP", "¿Qué producto encontraste? Nombre o SKU")}</div>
      <div id="rcE" class="rep-enc"></div>
      <label class="field"><span>Nota (opcional)</span><input type="text" id="rcN" maxlength="300" placeholder="Ej: 3 estibas, sin etiqueta del WMS"></label>
      <div class="fin-acc"><span></span><button type="button" class="btn b-verde" id="rcG" ${yaC ? "disabled" : ""}>💾 Guardar</button></div></section>`;
    const pintarProd = () => { $("#rcE", f).innerHTML = prod ? `<span class="small muted">Encontrado:</span> <span class="chip rep-chip">${skuTxt(prod.sku, prod.prod)}<button type="button" class="cs-x" data-xp aria-label="Quitar">✕</button></span>` : ""; };
    autoSku($("#rcP", f), c => { prod = { sku: c.sku, prod: c.prod }; $("#rcP", f).value = ""; pintarProd(); }, { limpiar: true });
    pintarProd();
  };
  q0.addEventListener("input", pintarLista);
  autoModulo(q0, mods, x => { mod = x.m; pintarForm(); }, { ya: m => repDe(m).c ? `Conflicto ya reportado por ${repDe(m).c.por}` : null,
    alEnter: () => { const t = limpiarMod(q0.value.trim()); if (qMod(t).length >= 2) { mod = t; pintarForm(); } } });
  el.onclick = async e => {
    const b = e.target.closest(".rep-mod[data-m]"); if (b && !b.disabled) { mod = b.dataset.m; pintarForm(); return; }
    const o = e.target.closest("[data-otro]"); if (o) { mod = o.dataset.otro; pintarForm(); return; }
    if (e.target.closest("[data-cambiar]")) { mod = ""; prod = null; $("#rcPaso2", el).classList.add("hidden"); $("#rcPaso1", el).classList.remove("hidden"); q0.value = ""; pintarLista(); q0.focus(); return; }
    if (e.target.closest("[data-xp]")) { prod = null; $("#rcE", el).innerHTML = ""; return; }
    if (e.target.closest("#rcG")) {
      if (!prod) { toast("Escoge el producto que encontraste en el módulo.", "warn", 4000); $("#rcP", el).focus(); return; }
      const x = mods.find(y => y.m === mod), sis = sistemaDe(x ? x.lotes : []);
      if (x && x.lotes.length && x.lotes.every(l => l.s === prod.sku) && !(await confirmar("Mismo producto", `El aplicativo ya dice que ${h(mod)} tiene <b>${h(prod.sku)}</b>. ¿Reportarlo de todas formas?`, "Sí, reportar"))) return;
      const btn = $("#rcG", el); ocupado(btn, true);
      try {
        const r = await api("webReporteCrear", [Object.assign({ tipo: "CONFLICTO", modulo: mod, sku_encontrado: prod.sku, producto_encontrado: prod.prod, nota: $("#rcN", el).value.trim() }, sis)]);
        guardarRep(r.lista); avisoGuardado(r, "Conflicto reportado"); ocupado(btn, false);
        if ((r.creados || []).length) { mod = ""; prod = null; $("#rcPaso2", el).classList.add("hidden"); $("#rcPaso1", el).classList.remove("hidden"); q0.value = ""; pintarLista(); }
      } catch (er) { ocupado(btn, false); toast(er.message, "bad", 7000); }
    }
  };
  if (mod) pintarForm(); else pintarLista();
};

// ---------- Reportes generados ----------
VISTAS.repgen = async (el, p, vigente) => {
  const d = await api("webReportes");
  if (!vigente()) return;
  guardarRep(d.lista);
  let lis = d.lista, filtro = ls.get("repFiltro", "PEND"), mios = ls.get("repMios", esVerif() ? "1" : "") === "1";
  const yo = norm(S.usuario ? S.usuario.nombre : "");
  el.innerHTML = cab("📣 Reportes generados", "Módulos reportados vacíos o con conflicto. Quien tenga rol validador o administrador lo pone en el WMS y lo marca como completado. Si una sincronización posterior ya lo muestra corregido en el WMS, se cierra solo. Se ven los pendientes y lo de los últimos 30 días.") +
    `<div class="lista-tools"><div class="seg" id="rgF"></div><label class="toggle"><input type="checkbox" id="rgM" ${mios ? "checked" : ""}> Solo los míos</label></div><div id="rgL"></div>`;
  const fecha = t => h(fechaCorta(t));
  const tarjeta = r => {
    const pend = r.estado === "PENDIENTE", mio = norm(r.por) === yo;
    const cierre = r.estado === "COMPLETADO" ? (r.cierre === "WMS" ? `<div class="rep-cierre ok">🔄 Confirmado por el WMS (sincronización) · ${fecha(r.cerroEn)}</div>` : `<div class="rep-cierre ok">✅ Completado por <b>${h(r.cerroPor)}</b> · ${fecha(r.cerroEn)}</div>`)
      : r.estado === "ANULADO" ? `<div class="rep-cierre muted">✖ Anulado por ${h(r.cerroPor)} · ${fecha(r.cerroEn)}</div>` : "";
    return `<article class="card rep-card ${r.tipo === "VACIO" ? "t-v" : "t-c"} ${pend ? "pend" : "cerrado"}">
      <div class="row sb"><span class="row" style="gap:8px">${modChip(r.m)}<span class="pill ${r.tipo === "VACIO" ? "rv-p" : "rc-p"}">${r.tipo === "VACIO" ? "⬜ Vacío" : "⚠️ Conflicto"}</span></span>
        <span class="pill ${pend ? "warn" : r.estado === "ANULADO" ? "" : "ok"}">${pend ? "Pendiente" : r.estado === "ANULADO" ? "Anulado" : "Completado"}</span></div>
      <div class="rep-l"><span class="small muted">El aplicativo decía:</span> ${r.skuSis ? `${skuTxt(r.skuSis, r.prodSis)}` : h(r.prodSis || "—")}${r.detSis ? `<div class="small muted">${h(r.detSis)}</div>` : ""}</div>
      ${r.tipo === "CONFLICTO" ? `<div class="rep-l rep-enc"><span class="small muted">Encontró:</span> ${skuTxt(r.skuEnc, r.prodEnc)}</div>` : ""}
      ${r.nota ? `<div class="rep-l small">📝 ${h(r.nota)}</div>` : ""}
      <div class="rep-quien">📣 Reportado por <b>${h(r.por)}</b> · ${fecha(r.en)}</div>
      ${cierre}
      ${pend && (d.puedeCompletar || mio) ? `<div class="rep-acc">${mio || d.puedeCompletar ? `<button class="btn sm b-rojo" data-an="${h(r.id)}">Anular</button>` : ""}${d.puedeCompletar ? `<button class="btn sm b-verde" data-ok="${h(r.id)}">✔ Marcar completado</button>` : ""}</div>` : ""}
    </article>`;
  };
  const pintar = () => {
    const base = lis.filter(r => !mios || norm(r.por) === yo);
    const n = { PEND: base.filter(r => r.estado === "PENDIENTE").length, COMP: base.filter(r => r.estado !== "PENDIENTE").length, ALL: base.length };
    $("#rgF", el).innerHTML = [["PEND", "Pendientes"], ["COMP", "Cerrados"], ["ALL", "Todos"]].map(([k, t]) => `<button data-f="${k}" class="${filtro === k ? "on" : ""}">${t} <span class="sec-n">${n[k]}</span></button>`).join("");
    const f = base.filter(r => filtro === "ALL" || (filtro === "PEND" ? r.estado === "PENDIENTE" : r.estado !== "PENDIENTE"));
    $("#rgL", el).innerHTML = f.length ? `<div class="grid tarjetas">${f.map(tarjeta).join("")}</div>` : vacio(filtro === "PEND" ? "No hay reportes pendientes." : "No hay reportes.", "✅");
  };
  const cerrar = async (id, accion) => {
    const r = lis.find(x => String(x.id) === String(id)); if (!r) return;
    const ok = accion === "completar"
      ? await confirmar("Marcar completado", `¿Ya quedó <b>${h(r.m)}</b> ${r.tipo === "VACIO" ? "en cero" : "corregido"} en el WMS?`, "Sí, completado")
      : await confirmar("Anular reporte", `¿Anular el reporte de <b>${h(r.m)}</b>? Úsalo solo si se reportó por error.`, "Anular", true);
    if (!ok) return;
    try { const x = await api("webReporteCerrar", r.id, accion); lis = x.lista; guardarRep(lis); toast(accion === "completar" ? "Marcado como completado" : "Reporte anulado", "ok"); pintar(); }
    catch (er) { toast(er.message, "bad", 6000); }
  };
  $("#rgM", el).onchange = e => { mios = e.target.checked; ls.set("repMios", mios ? "1" : "0"); pintar(); };
  el.onclick = e => {
    const f = e.target.closest("#rgF [data-f]"); if (f) { filtro = f.dataset.f; ls.set("repFiltro", filtro); pintar(); return; }
    const c = e.target.closest("[data-ok]"); if (c) return cerrar(c.dataset.ok, "completar");
    const a = e.target.closest("[data-an]"); if (a) return cerrar(a.dataset.an, "anular");
  };
  pintar();
};

// =====================================================================
// ROTULAR (turno de la noche): módulos completos que se marcan con su información
// Cada rotulación tiene fecha y turno; los módulos van en el orden en que se agregan,
// con producto, SKU, vencimiento y estibas (las calcula el sistema; se pueden corregir)
// y dos marcas: 🖨️ impreso y 🏷️ rotulado. Se guarda en Supabase (rot_*).
// =====================================================================
const HOR_T = { 1: "10 p.m. – 6 a.m.", 2: "6 a.m. – 2 p.m.", 3: "2 p.m. – 10 p.m." };
VISTAS.rotular = async (el, p, vigente) => {
  if (p.id) return vistaRotulo(el, p.id, vigente);
  const lis = await api("webRotListar");
  if (!vigente()) return;
  el.innerHTML = cab("🏷️ Rotular", "El turno de la noche rotula los módulos completos. Crea una rotulación con tu turno, agrega cada módulo (el sistema trae el producto, el vencimiento y las estibas, que puedes corregir) y marca cuando lo mandaste a imprimir y cuando ya quedó rotulado.",
      `<button class="btn primary" data-a="nueva">＋ Nueva rotulación</button>`) +
    (lis.length ? `<div class="grid tarjetas">${lis.map(r => {
      const listo = r.n > 0 && r.rotulados === r.n;
      return `<article class="card rot-card ${listo ? "listo" : ""}" data-id="${r.id}" role="button" tabindex="0">
        <div class="row sb" style="flex-wrap:nowrap"><div class="row" style="flex-wrap:nowrap"><span class="turno-num sm">T${h(r.turno)}</span><b style="font-size:16px">${h(fechaDMY(r.fecha))}</b></div>
          <span class="pill ${listo ? "ok" : r.n ? "warn" : ""}">${listo ? "Rotulada" : r.n ? "En curso" : "Vacía"}</span></div>
        <div class="hc-l">🔓 <b>${h(r.por)}</b></div>
        <div class="hc-chips"><span class="chip">📦 <b>${fm(r.n)}</b> módulos</span><span class="chip">🖨️ <b>${fm(r.impresos)}</b>/${fm(r.n)}</span><span class="chip">🏷️ <b>${fm(r.rotulados)}</b>/${fm(r.n)}</span></div>
        <div class="bar"><i style="width:${r.n ? Math.round(r.rotulados / r.n * 100) : 0}%"></i></div></article>`;
    }).join("")}</div>` : vacio("Todavía no hay rotulaciones. Toca «＋ Nueva rotulación».", "🏷️"));
  el.onclick = e => {
    if (e.target.closest("[data-a=nueva]")) return modalNuevaRot();
    const c = e.target.closest(".rot-card[data-id]"); if (c) ir("rotular", { id: +c.dataset.id });
  };
};
function modalNuevaRot() {
  let num = typeof turnoPorHora === "function" ? turnoPorHora() : 1;
  const c = abrirModal(`<h3>Nueva rotulación</h3><p class="muted small">¿De qué turno es?</p>
    <div class="num-pick" id="rnT">${[1, 2, 3].map(n => `<button type="button" data-n="${n}" class="${n === num ? "on" : ""}"><b>${n}</b><span>${h(HOR_T[n])}</span></button>`).join("")}</div>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="rnOk">Crear</button></div>`);
  $("#rnT", c).onclick = e => { const b = e.target.closest("[data-n]"); if (!b) return; num = +b.dataset.n; $$("#rnT button", c).forEach(x => x.classList.toggle("on", x === b)); };
  $("#rnOk", c).onclick = async () => {
    const btn = $("#rnOk", c); ocupado(btn, true);
    try { const r = await api("webRotCrear", num); ocupado(btn, false); cerrarModal(true); toast(`Rotulación del turno ${num} creada`, "ok"); ir("rotular", { id: r.id }); }
    catch (er) { ocupado(btn, false); toast(er.message, "bad", 6000); }
  };
}

// Lo que el sistema sabe de un producto en un módulo: estibas (suma de sus lotes) y el vencimiento más próximo
function rotDatos(x, sku) {
  const ls2 = x.lotes.filter(l => l.s === sku);
  const v = ls2.map(l => l.v).filter(y => y).sort()[0] || "";
  return { sku: sku, prod: (ls2[0] || {}).p || "", vence: v, est: ls2.reduce((a, l) => a + (l.e || 0), 0) };
}

async function vistaRotulo(el, id, vigente) {
  const [r, inv] = await Promise.all([api("webRotVer", id), cargarInv(), cargarCat().catch(() => null)]);
  if (!vigente()) return;
  let rot = r, form = null;   // form: { m, sku, prod, vence, est, estSis, x }
  const mods = modulosConProducto(inv);
  const fila = (it, k) => `<div class="rot-row ${it.rotulado ? "hecho" : ""}" data-id="${it.id}">
      <span class="rot-k">${k + 1}</span>
      <div class="rot-info"><div class="rot-l1">${modChip(it.m)} <b class="rot-est">${it.est === null || it.est === undefined ? "—" : fm(it.est)} est.</b>${it.estSis !== null && it.estSis !== undefined && Number(it.est) !== Number(it.estSis) ? ` <span class="small muted" title="Lo que calculó el sistema">(sistema ${fm(it.estSis)})</span>` : ""}</div>
        <div class="rot-l2">${it.sku ? skuTxt(it.sku, it.prod) : `<span class="muted">${h(it.prod || "Sin producto")}</span>`}</div>
        <div class="rot-l3">Vence <b>${it.vence ? h(fechaDMY(it.vence)) : "—"}</b>${it.vence ? ` · ${diasA(it.vence)}` : ""}</div></div>
      <div class="rot-acc">
        <label class="rot-chk ${it.impreso ? "on" : ""}" title="${it.impreso ? "Impreso por " + h(it.impresoPor) : "Marcar como impreso"}"><input type="checkbox" data-mk="impreso" ${it.impreso ? "checked" : ""}><span>🖨️ Impreso</span></label>
        <label class="rot-chk ${it.rotulado ? "on" : ""}" title="${it.rotulado ? "Rotulado por " + h(it.rotuladoPor) : "Marcar como rotulado"}"><input type="checkbox" data-mk="rotulado" ${it.rotulado ? "checked" : ""}><span>🏷️ Rotulado</span></label>
        <div class="rot-ed"><button class="btn sm icon" data-ed title="Corregir" aria-label="Corregir">✎</button><button class="btn sm icon del" data-q title="Quitar" aria-label="Quitar">${ICO_DEL}</button></div></div></div>`;
  const pintarLista = () => {
    const its = rot.items, imp = its.filter(i => i.impreso).length, rotu = its.filter(i => i.rotulado).length;
    $("#roL", el).innerHTML = its.length ? `<div class="row sb rot-tit"><h3 style="margin:0">Módulos <span class="sec-n">${its.length}</span> <span class="small muted">🖨️ ${imp}/${its.length} · 🏷️ ${rotu}/${its.length}</span></h3>
        <div class="row" style="gap:6px">${imp < its.length ? `<button class="btn sm" data-todos="impreso">🖨️ Todos impresos</button>` : ""}${rotu < its.length ? `<button class="btn sm" data-todos="rotulado">🏷️ Todos rotulados</button>` : ""}</div></div>
      <div class="rot-lista">${its.map(fila).join("")}</div>` : vacio("Agrega el primer módulo a rotular.", "📦");
  };
  // Formulario: el módulo, el producto que hay ahí, el vencimiento y las estibas (calculadas, editables)
  const pintarForm = () => {
    const f = $("#roF", el);
    if (!form) { f.innerHTML = ""; f.classList.add("hidden"); $("#roB", el).classList.remove("hidden"); return; }
    $("#roB", el).classList.add("hidden"); f.classList.remove("hidden");
    const skus = form.x ? [...new Set(form.x.lotes.map(l => l.s))] : [];
    f.innerHTML = `<div class="row sb"><h3 style="margin:0">📍 ${modChip(form.m)}</h3><button type="button" class="link" data-cancel>Cambiar módulo</button></div>
      ${skus.length > 1 ? `<div class="small muted" style="margin-top:8px">En este módulo hay ${skus.length} productos: escoge cuál vas a rotular</div><div class="seg seg-sm rot-skus">${skus.map(s => { const d = rotDatos(form.x, s); return `<button type="button" data-sku="${h(s)}" class="${s === form.sku ? "on" : ""}">${h(s)} · ${h(d.prod)}</button>`; }).join("")}</div>` : ""}
      ${!form.x ? `<div class="note warn" style="margin-top:8px">El aplicativo no tiene producto en ${h(form.m)}: escoge el producto.</div>` : ""}
      <div style="margin-top:10px">${campoAuto("roP", "Producto: nombre o SKU", form.sku ? `${form.sku} · ${form.prod}` : "")}</div>
      <div class="grid2 rot-campos"><label class="field"><span>Vencimiento</span><input type="date" id="roV" value="${h(form.vence)}"></label>
        <label class="field"><span>Estibas${form.estSis !== null ? ` <span class="muted small">(sistema: ${fm(form.estSis)})</span>` : ""}</span><input type="text" inputmode="decimal" id="roE" value="${form.est === null ? "" : h(form.est)}" placeholder="—"></label></div>
      <div class="fin-acc"><button type="button" class="btn sm b-rojo" data-cancel>✖ Cancelar</button><button type="button" class="btn b-verde" id="roOk">＋ Agregar a la lista</button></div>`;
    autoSku($("#roP", f), c => { form.sku = c.sku; form.prod = c.prod; if (form.x && form.x.lotes.some(l => l.s === c.sku)) { const d = rotDatos(form.x, c.sku); form.vence = d.vence; form.est = d.est; form.estSis = d.est; } pintarForm(); });
  };
  const elegirModulo = (m, x) => {
    form = { m: m, x: x || null, sku: "", prod: "", vence: "", est: null, estSis: null };
    if (x) {
      // el producto con más estibas del módulo
      const skus = [...new Set(x.lotes.map(l => l.s))].map(s => rotDatos(x, s)).sort((a, b) => b.est - a.est);
      Object.assign(form, skus[0], { estSis: skus[0].est });
    }
    pintarForm();
  };
  el.innerHTML = `<div class="vh"><div><h1>🏷️ Rotulación · T${h(rot.turno)} · ${h(fechaDMY(rot.fecha))}</h1><div class="sub">Abierta por <b>${h(rot.por)}</b></div></div>
      <div class="tools"><button class="btn sm" data-volver>← Rotulaciones</button><button class="btn sm icon del" data-elim title="Quitar esta rotulación" aria-label="Quitar esta rotulación">${ICO_DEL}</button></div></div>
    <section class="card rot-agregar"><div id="roB"><h3 style="margin-top:0">＋ Agregar módulo</h3><div class="rep-busca"><input type="search" id="roQ" placeholder="Módulo (ej: B12)" autocomplete="off" autocapitalize="characters" enterkeyhint="done"></div><div id="roN"></div></div>
      <div id="roF" class="hidden"></div></section>
    <section id="roL"></section>`;
  // Si lo escrito no coincide con ningún módulo con producto, se avisa ahí mismo (sin error) y se puede usar igual
  const sinMod = t => { $("#roN", el).innerHTML = t ? `<div class="note warn rot-nomod">«${h(limpiarMod(t))}» no tiene producto en el aplicativo. Revisa el nombre o <button type="button" class="link" data-usar="${h(limpiarMod(t))}">agrégalo de todas formas</button>.</div>` : ""; };
  autoModulo($("#roQ", el), mods, x => { sinMod(""); elegirModulo(x.m, x); }, { sinCoincidencia: sinMod,
    alEnter: () => { const t = limpiarMod($("#roQ", el).value.trim()), x = mods.find(y => y.m === t); if (x) { $("#roQ", el).value = ""; elegirModulo(t, x); } else if (t) sinMod(t); } });
  const guardar = async obj => { rot = await api("webRotItem", rot.id, obj); pintarLista(); };
  el.onclick = async e => {
    if (e.target.closest("[data-volver]")) return ir("rotular");
    if (e.target.closest("[data-elim]")) {
      if (!(await confirmar("Quitar rotulación", `¿Quitar la rotulación del turno ${h(rot.turno)} del ${h(fechaDMY(rot.fecha))} con ${rot.items.length} módulos?`, "Quitar", true))) return;
      try { await api("webRotEliminar", rot.id); toast("Rotulación quitada", "ok"); ir("rotular"); } catch (er) { toast(er.message, "bad"); }
      return;
    }
    if (e.target.closest("[data-cancel]")) { form = null; pintarForm(); $("#roQ", el).focus(); return; }
    const us = e.target.closest("[data-usar]"); if (us) { $("#roQ", el).value = ""; $("#roN", el).innerHTML = ""; elegirModulo(us.dataset.usar, null); return; }
    const s = e.target.closest(".rot-skus [data-sku]");
    if (s && form) { Object.assign(form, rotDatos(form.x, s.dataset.sku)); form.estSis = form.est; pintarForm(); return; }
    if (e.target.closest("#roOk") && form) {
      const v = $("#roV", el).value, est = $("#roE", el).value.trim().replace(",", ".");
      if (!form.sku) { toast("Escoge el producto.", "warn"); $("#roP", el).focus(); return; }
      if (est !== "" && !(Number(est) >= 0)) { toast("Escribe las estibas con números.", "warn"); return; }
      const btn = $("#roOk", el); ocupado(btn, true);
      try { await guardar({ m: form.m, sku: form.sku, prod: form.prod, vence: v, est: est, estSis: form.estSis === null ? "" : form.estSis }); toast(`${form.m} agregado`, "ok", 2000); form = null; pintarForm(); }
      catch (er) { ocupado(btn, false); toast(er.message, "bad", 6000); }
      return;
    }
    const t = e.target.closest("[data-todos]");
    if (t) {
      const campo = t.dataset.todos, ids = rot.items.filter(i => !i[campo]).map(i => i.id);
      try { rot = await api("webRotMarcar", rot.id, ids, campo, true); pintarLista(); toast(campo === "impreso" ? "Todos marcados como impresos" : "Todos marcados como rotulados", "ok"); } catch (er) { toast(er.message, "bad"); }
      return;
    }
    const row = e.target.closest(".rot-row[data-id]"); if (!row) return;
    const it = rot.items.find(i => String(i.id) === row.dataset.id); if (!it) return;
    if (e.target.closest("[data-q]")) {
      if (!(await confirmar("Quitar módulo", `¿Quitar <b>${h(it.m)}</b> de la rotulación?`, "Quitar", true))) return;
      try { rot = await api("webRotQuitar", rot.id, it.id); pintarLista(); } catch (er) { toast(er.message, "bad"); }
      return;
    }
    if (e.target.closest("[data-ed]")) return modalRotItem(rot, it, async obj => { await guardar(obj); });
  };
  el.onchange = async e => {
    const mk = e.target.closest("[data-mk]"); if (!mk) return;
    const row = mk.closest(".rot-row[data-id]"), v = mk.checked;
    mk.closest(".rot-chk").classList.toggle("on", v);
    try { rot = await api("webRotMarcar", rot.id, [+row.dataset.id], mk.dataset.mk, v); pintarLista(); }
    catch (er) { mk.checked = !v; mk.closest(".rot-chk").classList.toggle("on", !v); toast(er.message, "bad"); }
  };
  pintarLista();
}
// Días que faltan para vencer (texto corto)
function diasA(v) {
  const d = Math.round((tV(v) - tV(new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10))) / 864e5);
  return d < 0 ? `vencido hace ${-d} d` : `${d} d`;
}
function modalRotItem(rot, it, alGuardar) {
  let prod = { sku: it.sku, prod: it.prod };
  const c = abrirModal(`<h3>Corregir ${modChip(it.m)}</h3>
    ${campoAuto("reP", "Producto: nombre o SKU", it.sku ? `${it.sku} · ${it.prod}` : "")}
    <div class="grid2 rot-campos"><label class="field"><span>Vencimiento</span><input type="date" id="reV" value="${h(it.vence)}"></label>
      <label class="field"><span>Estibas${it.estSis !== null && it.estSis !== undefined ? ` <span class="muted small">(sistema: ${fm(it.estSis)})</span>` : ""}</span><input type="text" inputmode="decimal" id="reE" value="${it.est === null || it.est === undefined ? "" : h(it.est)}"></label></div>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="reOk">Guardar</button></div>`);
  autoSku($("#reP", c), x => { prod = { sku: x.sku, prod: x.prod }; });
  $("#reOk", c).onclick = async () => {
    const est = $("#reE", c).value.trim().replace(",", ".");
    if (est !== "" && !(Number(est) >= 0)) return toast("Escribe las estibas con números.", "warn");
    const btn = $("#reOk", c); ocupado(btn, true);
    try { await alGuardar({ id: it.id, m: it.m, sku: prod.sku, prod: prod.prod, vence: $("#reV", c).value, est: est }); ocupado(btn, false); cerrarModal(true); toast("Corregido", "ok"); }
    catch (er) { ocupado(btn, false); toast(er.message, "bad", 6000); }
  };
}

// =====================================================================
// ACTUALIZACIÓN DE BODEGA: qué sección o módulo lleva más tiempo sin actualizarse en el WMS
// Son 3 turnos y no alcanza a actualizarse todo en cada uno: el que entra mira lo más reciente
// y sigue con lo que lleva más tiempo. Cada módulo toma la hora de su última actualización en el
// WMS (la más reciente de sus lotes) y usa la misma escala que «Act:»:
// 🟢 menos de 8 h · 🟡 8 a 16 h · 🟠 16 a 24 h · 🔴 más de 24 h.
// Los módulos vacíos no cuentan (el WMS no trae fecha para ellos).
// =====================================================================
const ACT_NIV = [
  { k: "v", t: "Menos de 8 h", max: 8 },
  { k: "a", t: "8 a 16 h", max: 16 },
  { k: "n", t: "16 a 24 h", max: 24 },
  { k: "r", t: "Más de 24 h", max: Infinity }
];
const ACT_EMO = { v: "🟢", a: "🟡", n: "🟠", r: "🔴", x: "⚪" };
const nivelAct = hrs => hrs === null ? "x" : ACT_NIV.find(n => hrs < n.max).k;
const haceTxt = hrs => {
  if (hrs === null) return "sin fecha";
  const m = Math.round(hrs * 60), d = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60);
  return d > 0 ? `hace ${d}d ${hh}h` : hh > 0 ? `hace ${hh}h ${m % 60}m` : `hace ${m % 60}m`;
};
// Un módulo por fila: su última actualización (la más reciente de sus lotes con producto)
function modulosActualizacion(inv) {
  const ahora = Date.now(), mods = {};
  inv.forEach(i => {
    if (!i.fis) return;
    const x = mods[i.m] = mods[i.m] || { m: i.m, sec: seccionMod(i.m), t: null, lotes: 0, prods: new Set() };
    x.lotes++; x.prods.add(i.p);
    const t = i.act ? new Date(i.act).getTime() : NaN;
    if (!isNaN(t) && (x.t === null || t > x.t)) x.t = t;
  });
  return Object.values(mods).map(x => { const hrs = x.t === null ? null : Math.max(0, (ahora - x.t) / 36e5); return Object.assign(x, { hrs: hrs, niv: nivelAct(hrs), prods: [...x.prods] }); });
}
// Secciones: la más urgente es la que tiene el módulo con más tiempo sin actualizar
function seccionesActualizacion(mods) {
  const g = {};
  mods.forEach(x => (g[x.sec] = g[x.sec] || { sec: x.sec, mods: [] }).mods.push(x));
  return Object.values(g).map(s => {
    s.mods.sort(cmpMod);
    const con = s.mods.filter(x => x.hrs !== null);
    s.viejo = con.reduce((a, x) => (!a || x.hrs > a.hrs ? x : a), null);
    s.nuevo = con.reduce((a, x) => (!a || x.hrs < a.hrs ? x : a), null);
    s.cuenta = { v: 0, a: 0, n: 0, r: 0, x: 0 }; s.mods.forEach(x => s.cuenta[x.niv]++);
    s.niv = s.viejo ? s.viejo.niv : "x";
    s.al = s.mods.length ? Math.round((s.cuenta.v + s.cuenta.a + s.cuenta.n) / s.mods.length * 100) : 0;   // % actualizado en las últimas 24 h
    return s;
  }).sort((a, b) => (b.viejo ? b.viejo.hrs : -1) - (a.viejo ? a.viejo.hrs : -1));
}
VISTAS.actualizacion = async (el, p, vigente) => {
  const inv = await cargarInv();
  if (!vigente()) return;
  const mods = modulosActualizacion(inv), secs = seccionesActualizacion(mods);
  let modo = ls.get("actModo", "sec"), q = "", nivF = "";
  const recSec = secs.slice().filter(s => s.nuevo).sort((a, b) => a.nuevo.hrs - b.nuevo.hrs)[0];
  const sig = secs.filter(s => s.viejo && s.niv !== "v").slice(0, 3);
  el.innerHTML = cab("🕒 Actualización de bodega", "Qué sección o módulo lleva más tiempo sin actualizarse en el WMS. Cada módulo toma la hora de su última actualización. El que entra al turno sigue con lo que lleva más tiempo (arriba). Los datos son los de la última sincronización (⟳); los módulos vacíos no cuentan.") +
    `<div class="act-res">
      <div class="card act-k"><div class="act-kt">✅ Lo más reciente</div>${recSec ? `<div class="act-kv">${h(nombreSeccion(recSec.sec))}</div><div class="small">${ACT_EMO[recSec.nuevo.niv]} ${h(recSec.nuevo.m)} · ${h(haceTxt(recSec.nuevo.hrs))}</div>` : `<div class="muted">—</div>`}</div>
      <div class="card act-k act-sig"><div class="act-kt">👉 Debería actualizarse</div>${sig.length ? sig.map((s, k) => `<button type="button" class="act-sig-b ${k === 0 ? "uno" : ""}" data-sec="${h(s.sec)}"><b>${h(nombreSeccion(s.sec))}</b> <span class="small">${ACT_EMO[s.niv]} ${h(haceTxt(s.viejo.hrs))} · ${s.cuenta.r + s.cuenta.n + s.cuenta.a} de ${s.mods.length} pendientes</span></button>`).join("") : `<div class="small">Todo está al día (menos de 8 h).</div>`}</div>
    </div>
    <div class="act-ley">${ACT_NIV.map(n => `<span class="act-chip ${n.k}" data-niv="${n.k}">${ACT_EMO[n.k]} ${n.t} <b>${mods.filter(x => x.niv === n.k).length}</b></span>`).join("")}</div>
    <div class="lista-tools"><div class="seg" id="acM"><button data-m="sec">Por secciones</button><button data-m="mod">Por módulos</button></div>
      <input type="search" id="acQ" placeholder="Buscar sección o módulo (ej: B, B12)" autocomplete="off"><span class="count" id="acC"></span></div>
    <div id="acL"></div>`;
  const modChipAct = x => `<span class="act-m ${x.niv}" title="${h(x.prods.join(" / "))}"><b>${h(x.m)}</b><span>${h(haceTxt(x.hrs).replace("hace ", ""))}</span></span>`;
  const pintar = () => {
    $$("#acM button", el).forEach(b => b.classList.toggle("on", b.dataset.m === modo));
    $$(".act-chip", el).forEach(c => c.classList.toggle("on", c.dataset.niv === nivF));
    const nq = norm(q).replace(/\s+/g, "");
    if (modo === "sec") {
      const f = secs.filter(s => (!nq || norm(s.sec + nombreSeccion(s.sec)).replace(/\s+/g, "").includes(nq) || s.mods.some(x => norm(x.m).startsWith(nq))) && (!nivF || s.cuenta[nivF]));
      $("#acC", el).textContent = `${f.length} secciones`;
      $("#acL", el).innerHTML = f.length ? `<div class="act-secs">${f.map(s => {
        const ab = abierto("acts", s.sec);
        const ms = s.mods.filter(x => !nivF || x.niv === nivF);
        return `<article class="card plegable act-sec n-${s.niv} ${ab ? "abierto" : ""}" data-sec="${h(s.sec)}">
          <div class="pl-cab" data-plegar="acts|${h(s.sec)}" role="button" tabindex="0" aria-expanded="${ab}">
            <div class="act-st"><div class="act-sn">${ACT_EMO[s.niv]} ${h(nombreSeccion(s.sec))} <span class="sec-n">${s.mods.length}</span></div>
              <div class="small">Más viejo: <b>${s.viejo ? `${h(s.viejo.m)} · ${h(haceTxt(s.viejo.hrs))}` : "—"}</b> · Más reciente: <b>${s.nuevo ? `${h(s.nuevo.m)} · ${h(haceTxt(s.nuevo.hrs))}` : "—"}</b></div>
              <div class="act-cnt">${["v", "a", "n", "r"].filter(k => s.cuenta[k]).map(k => `<span class="act-mini ${k}">${ACT_EMO[k]} ${s.cuenta[k]}</span>`).join("")}</div>
              <div class="act-bar" title="Actualizado en las últimas 24 h: ${s.al}%">${["v", "a", "n", "r", "x"].map(k => s.cuenta[k] ? `<i class="${k}" style="flex:${s.cuenta[k]}"></i>` : "").join("")}</div></div>
            <span class="pl-flecha" aria-hidden="true">▾</span></div>
          <div class="pl-cuerpo"><div class="act-mods">${ms.map(modChipAct).join("") || `<span class="muted small">Nada con ese filtro.</span>`}</div></div></article>`;
      }).join("")}</div>` : vacio("Nada coincide.", "🔎");
    } else {
      const f = mods.filter(x => (!nq || norm(x.m).replace(/\s+/g, "").startsWith(nq) || norm(x.sec).startsWith(nq)) && (!nivF || x.niv === nivF))
        .sort((a, b) => (b.hrs === null ? -1 : b.hrs) - (a.hrs === null ? -1 : a.hrs));
      $("#acC", el).textContent = `${f.length} módulos`;
      $("#acL", el).innerHTML = f.length ? `<div class="act-lista">${f.map(x => `<div class="act-row ${x.niv}"><span class="act-m ${x.niv}"><b>${h(x.m)}</b></span>
        <div class="act-rt"><b>${ACT_EMO[x.niv]} ${h(haceTxt(x.hrs))}</b><div class="small muted">${h(nombreSeccion(x.sec))} · ${h(x.prods.join(" / "))}</div></div></div>`).join("")}</div>` : vacio("Nada coincide.", "🔎");
    }
  };
  $("#acM", el).onclick = e => { const b = e.target.closest("[data-m]"); if (!b) return; modo = b.dataset.m; ls.set("actModo", modo); pintar(); };
  $("#acQ", el).oninput = e => { q = e.target.value.trim(); pintar(); };
  el.onclick = e => {
    const c = e.target.closest(".act-chip[data-niv]"); if (c) { nivF = nivF === c.dataset.niv ? "" : c.dataset.niv; pintar(); return; }
    const s = e.target.closest(".act-sig-b[data-sec]");
    if (s) { modo = "sec"; S.abiertos.acts = S.abiertos.acts || {}; S.abiertos.acts[s.dataset.sec] = true; q = ""; $("#acQ", el).value = ""; nivF = ""; pintar(); const a = $(`.act-sec[data-sec="${s.dataset.sec}"]`, el); if (a) a.scrollIntoView({ behavior: "smooth", block: "start" }); }
  };
  pintar();
};

// =====================================================================
// ADMINISTRACIÓN (solo administrador; el servidor también lo revisa)
// =====================================================================
VISTAS.usuarios = async (el, p, vigente) => {
  const lis = await api("webUsuarios");
  if (!vigente()) return;
  const pintar = lis2 => {
    el.innerHTML = cab("👥 Usuarios y PIN", "Quién entra al dashboard y qué puede hacer", `<button class="btn primary" data-a="nuevo">＋ Nuevo usuario</button>`) +
      `<div class="note ayuda">Roles: <b>verificador</b> solo ve Stock, Información de producto y Por módulo, y reporta módulos vacíos o con conflicto · <b>opm</b> igual que el verificador; es el que surte PK (T2), T1 o KA y usa el switch 🚦 de canal · <b>lector</b> solo consulta · <b>validador</b> abre y cierra turnos, valida, hace la entrega, la conciliación y limbo · <b>administrador</b> además maneja usuarios, la hoja Sku, los canales, la lista de consumo y la alerta de pocos.</div>
      <table class="tabla resp"><thead><tr><th>Nombre</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Creado</th><th></th></tr></thead><tbody>
      ${lis2.map(u => `<tr><td data-l="Nombre"><b>${h(u.nombre)}</b></td><td data-l="Rol">${h(u.rol)}</td><td data-l="Estado">${u.activo ? `<span class="pill ok">Activo</span>` : `<span class="pill bad">Inactivo</span>`}</td>
        <td data-l="Último acceso">${h(fechaCorta(u.ultimo) || "—")}</td><td data-l="Creado" class="small">${h(fechaCorta(u.creado))} · ${h(u.creadoPor)}</td>
        <td class="acc"><button class="btn sm" data-a="editar" data-n="${h(u.nombre)}">Editar</button> <button class="btn sm del" data-a="borrar" data-n="${h(u.nombre)}">${ICO_DEL}</button></td></tr>`).join("")}</tbody></table>`;
    el.onclick = async e => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "nuevo") return modalUsuario(null, pintar);
      const u = lis2.find(x => x.nombre === b.dataset.n);
      if (b.dataset.a === "editar") return modalUsuario(u, pintar);
      if (b.dataset.a === "borrar") {
        if (!(await confirmar("Borrar usuario", `¿Borrar a <b>${h(u.nombre)}</b>? Ya no podrá entrar.`, "Borrar", true))) return;
        try { pintar(await api("webUsuarioEliminar", u.nombre)); toast("Usuario borrado", "ok"); } catch (er) { toast(er.message, "bad", 6000); }
      }
    };
  };
  pintar(lis);
};
function modalUsuario(u, alGuardar) {
  const c = abrirModal(`<h3>${u ? "Editar usuario" : "Nuevo usuario"}</h3>
    <label class="field"><span>Nombre</span><input type="text" id="uN" maxlength="40" value="${h(u ? u.nombre : "")}"></label>
    <label class="field"><span>Rol</span><select id="uR">${ROL_LISTA.map(r => `<option ${u && u.rol === r ? "selected" : (!u && r === "validador" ? "selected" : "")}>${r}</option>`).join("")}</select></label>
    <label class="field"><span>PIN (4 a 8 números)${u ? " · déjalo vacío para no cambiarlo" : ""}</span><input type="password" inputmode="numeric" id="uP" maxlength="8"></label>
    <label class="check"><input type="checkbox" id="uA" ${!u || u.activo ? "checked" : ""}><span>Activo (puede entrar)</span></label>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="uOk">Guardar</button></div>`);
  $("#uOk", c).onclick = async () => {
    const obj = { nombreOriginal: u ? u.nombre : "", nombre: $("#uN", c).value.trim(), rol: $("#uR", c).value, pin: $("#uP", c).value.trim(), activo: $("#uA", c).checked };
    const btn = $("#uOk", c); ocupado(btn, true);
    try { const lis = await api("webUsuarioGuardar", obj); ocupado(btn, false); cerrarModal(true); toast("Usuario guardado", "ok"); alGuardar(lis); }
    catch (e) { ocupado(btn, false); toast(e.message, "bad", 6000); }
  };
}

// ---------- Productos (hoja Sku) ----------
const SKU_CAMPOS_UI = [
  ["sku", "SKU", "numeric"], ["prod", "Producto"], ["pres", "Presentación"], ["cub", "Cubicaje"], ["piso", "Piso"], ["plancha", "Plancha"], ["cantEst", "Cant x estiba", "numeric"],
  ["ctx", "Contexto (palabras para buscar)"], ["minimo", "Mínimo de estibas (pocos)", "decimal"], ["t1", "Días mínimos T1", "numeric"], ["t2", "Días mínimos T2", "numeric"], ["ka", "Días mínimos KA", "numeric"], ["estCara", "Estibas por cara", "numeric"], ["vida", "Vida útil (días)", "numeric"]
];
VISTAS.skus = async (el, p, vigente) => {
  await cargarCat(true);
  if (!vigente()) return;
  el.innerHTML = cab("🗃️ Productos (hoja Sku)", "Añadir, editar y borrar productos. Mínimo, T1, T2, KA y estibas por cara vacíos = regla general.", `<button class="btn primary" data-a="nuevo">＋ Nuevo producto</button>`) +
    `<div class="lista-tools"><input type="search" id="skQ" placeholder="Filtrar por SKU o nombre…"><span class="count" id="skC"></span></div><div id="skR"></div>`;
  const pintar = () => {
    const q = $("#skQ", el).value.trim();
    const lis = q ? buscarCat(q, 400) : S.cat.slice().sort(cmpSku);
    $("#skC", el).textContent = `${lis.length} productos`;
    const v = x => x === null || x === undefined || x === "" ? `<span class="muted">—</span>` : h(x);
    // Filas desplegables (colores intercalados): cerradas solo SKU, nombre y presentación
    $("#skR", el).innerHTML = `<div class="pf-lista">${lis.slice(0, 300).map(c => filaProducto(c, { grupo: "sk", todo: true, editar: true, borrar: true })).join("")}</div>${lis.length > 300 ? `<p class="small muted">Se muestran 300 de ${lis.length}: escribe para filtrar.</p>` : ""}`;
  };
  $("#skQ", el).oninput = pintar;
  el.onclick = async e => {
    const ed = e.target.closest("[data-ed]"); if (ed) return modalSku(S.cat.find(x => x.sku === ed.dataset.ed), pintar);
    const bo = e.target.closest("[data-bo]");
    const b = bo ? { dataset: { a: "borrar", sku: bo.dataset.bo } } : e.target.closest("[data-a]"); if (!b) return;
    if (b.dataset.a === "nuevo") return modalSku(null, pintar);
    const c = S.cat.find(x => x.sku === b.dataset.sku);
    if (b.dataset.a === "editar") return modalSku(c, pintar);
    if (b.dataset.a === "borrar") {
      if (!(await confirmar("Borrar producto", `¿Borrar ${skuTxt(c.sku, c.prod)} de la hoja Sku?`, "Borrar", true))) return;
      try { S.cat = await api("webSkuEliminar", c.sku); ls.setJ("cat", S.cat); toast("Producto borrado", "ok"); pintar(); } catch (er) { toast(er.message, "bad", 6000); }
    }
  };
  pintar();
};
// Grupos de la ventana de edición (más compacta: etiquetas y cuadros pequeños)
const SKU_GRUPOS = [["Producto", ["sku", "prod", "pres", "ctx"]], ["Estiba", ["cub", "piso", "plancha", "cantEst", "estCara"]], ["Reglas", ["vida", "minimo", "t1", "t2", "ka"]]];
function modalSku(c, alGuardar) {
  const campo = k => { const [, t, im] = SKU_CAMPOS_UI.find(x => x[0] === k); return `<label class="field ${k === "prod" || k === "ctx" ? "ancho" : ""}"><span>${h(t)}</span><input type="text" ${im ? `inputmode="${im}"` : ""} data-k="${k}" value="${h(c && c[k] !== null && c[k] !== undefined ? c[k] : "")}"></label>`; };
  const m = abrirModal(`<div class="m-sku"><h3>${c ? `✎ ${h(c.sku)}` : "Nuevo producto"}</h3>
    ${SKU_GRUPOS.map(([g, ks]) => `<div class="msk-g"><div class="msk-t">${g}</div><div class="msk-c">${ks.map(campo).join("")}</div></div>`).join("")}
    <p class="small muted" style="margin:6px 0 0">Vida útil: días que dura desde la producción hasta vencer (para la fecha de envasado). Mínimo, T1, T2, KA y estibas por cara vacíos = regla general.</p>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="skOk">Guardar</button></div></div>`);
  $("#skOk", m).onclick = async () => {
    const obj = {}; $$("input[data-k]", m).forEach(i => obj[i.dataset.k] = i.value.trim());
    const btn = $("#skOk", m); ocupado(btn, true);
    try { S.cat = await api("webSkuGuardar", c ? c.sku : "", obj); ls.setJ("cat", S.cat); ocupado(btn, false); cerrarModal(true); toast("Producto guardado", "ok"); alGuardar(); }
    catch (e) { ocupado(btn, false); toast(e.message, "bad", 6000); }
  };
}

// ---------- Capacidad de bodega (módulos que existen en físico) ----------
const nombreSeccion = k => ({ M: "Carpa (M)", KA: "KA", PREV: "Picking preventa", H: "Módulos H", BARRILES: "Barriles" }[k] || (/^[A-Z]$/.test(k) ? "Pasillo " + k : k));
VISTAS.capacidad = async (el, p, vigente) => {
  let d = await api("webCapacidad");
  if (!vigente()) return;
  const admin = puede("administrador");
  el.innerHTML = cab("🧱 Capacidad de bodega", "Los módulos que existen en físico. Con esta lista se cruzan huecos, módulos vacíos, organizar, consumo y la capacidad de cada módulo. Caras = frentes del módulo. Estibas por cara vacío = la del producto (columna Est/cara de Sku) o 8.",
      admin ? `<button class="btn primary" data-a="nuevo">＋ Nuevo módulo</button>` : "") +
    `<div class="lista-tools"><input type="search" id="cpQ" placeholder="Buscar módulo (B12, KA, M…)"><button class="btn sm" data-a="todas">Abrir todas</button><button class="btn sm" data-a="ninguna">Cerrar todas</button><span class="count" id="cpC"></span></div>
    <div id="cpR"></div><div id="cpF"></div>`;
  const pintar = () => {
    const q = norm($("#cpQ", el).value).replace(/\s+/g, "");
    const lis = q ? d.mods.filter(x => norm(x.m).replace(/\s+/g, "").includes(q)) : d.mods;
    $("#cpC", el).textContent = `${d.total} módulos · ${fm(d.caras)} caras${q ? ` · ${lis.length} coinciden` : ""}`;
    const secs = {};
    lis.forEach(x => (secs[x.sec] = secs[x.sec] || []).push(x));
    const orden = Object.keys(secs).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const v = (x, t) => x ? h(x) : `<span class="muted small">${t}</span>`;
    $("#cpR", el).innerHTML = lis.length ? `<div class="cap-lista">${orden.map(s => {
      const it = secs[s], ab = !!q || abierto("cap", s), caras = it.reduce((a, x) => a + x.caras, 0);
      return `<section class="card plegable cap-card ${ab ? "abierto" : ""}"><div class="pl-cab" data-plegar="cap|${h(s)}" role="button" tabindex="0" aria-expanded="${ab}">
        <h3>${h(nombreSeccion(s))} <span class="sec-n">${it.length} módulos · ${fm(caras)} caras</span></h3><span class="pl-flecha" aria-hidden="true">▾</span></div>
        <div class="pl-cuerpo"><table class="tabla resp"><thead><tr><th>Módulo</th><th class="num">Caras</th><th class="num">Estibas por cara</th><th class="num">Ubicaciones con producto</th><th>WMS</th>${admin ? "<th></th>" : ""}</tr></thead><tbody>
        ${it.map(x => `<tr><td data-l="Módulo">${modChip(x.m)}</td><td data-l="Caras" class="num"><b>${x.caras}</b></td><td data-l="Estibas por cara" class="num">${v(x.cap, "del producto u 8")}</td>
          <td data-l="Con producto" class="num">${v(x.ubic, "vacío")}</td><td data-l="WMS">${x.enWms ? "✓" : `<span class="cap-no">⚠️ no está en el WMS</span>`}</td>
          ${admin ? `<td class="acc"><button class="btn sm" data-a="editar" data-m="${h(x.m)}">Editar</button> <button class="btn sm del" data-a="borrar" data-m="${h(x.m)}" aria-label="Quitar ${h(x.m)}">${ICO_DEL}</button></td>` : ""}</tr>`).join("")}
        </tbody></table></div></section>`; }).join("")}</div>`
      : vacio(q ? "Ningún módulo coincide con la búsqueda." : "Todavía no hay módulos. Agrega los que existen en físico.", "🧱");
    const f = q ? d.faltan.filter(x => norm(x.m).replace(/\s+/g, "").includes(q)) : d.faltan;
    $("#cpF", el).innerHTML = f.length ? `<details class="card cap-faltan" ${q ? "open" : ""}><summary>📡 Módulos del WMS que no están en la lista (${f.length})</summary>
      <p class="muted small ayuda">No se cruzan en huecos, vacíos ni organizar. ${admin ? "Si existen en físico, tócalos para agregarlos." : ""}</p>
      <div class="cap-faltan-lista">${f.map(x => admin ? `<button class="btn sm" data-a="agregar" data-m="${h(x.m)}">＋ ${h(x.m)}${x.ubic ? ` <span class="muted small">· ${x.ubic} con producto</span>` : ""}</button>`
        : `<span class="mod-chip">${h(x.m)}</span>`).join("")}</div></details>` : "";
  };
  const guardado = nd => { d = nd; pintar(); };
  $("#cpQ", el).oninput = pintar;
  el.onclick = async e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a;
    if (a === "todas" || a === "ninguna") { S.abiertos.cap = {}; if (a === "todas") d.mods.forEach(x => { S.abiertos.cap[x.sec] = true; }); pintar(); return; }
    if (!admin) return;
    if (a === "nuevo") return modalCapacidad(null, "", guardado);
    if (a === "agregar") return modalCapacidad(null, b.dataset.m, guardado);
    const x = d.mods.find(y => y.m === b.dataset.m); if (!x) return;
    if (a === "editar") return modalCapacidad(x, "", guardado);
    if (a === "borrar") {
      const aviso = x.ubic ? ` Tiene ${x.ubic} ubicación(es) con producto: dejará de contar en huecos y capacidad.` : "";
      if (!(await confirmar("Quitar módulo", `¿Quitar ${modChip(x.m)} de la capacidad de bodega?${h(aviso)}`, "Quitar", true))) return;
      try { guardado(await api("webCapacidadEliminar", x.m)); toast(`Módulo ${x.m} quitado`, "ok"); } catch (er) { toast(er.message, "bad", 6000); }
    }
  };
  pintar();
};
function modalCapacidad(x, sugerido, alGuardar) {
  const m = abrirModal(`<h3>${x ? `Editar módulo ${h(x.m)}` : "Nuevo módulo"}</h3>
    <div class="grid2" style="gap:0 14px">
      <label class="field"><span>Módulo</span><input type="text" id="cmM" autocapitalize="characters" placeholder="B12, KA3, M4…" value="${h(x ? x.m : sugerido || "")}"></label>
      <label class="field"><span>Caras</span><input type="text" inputmode="numeric" id="cmC" placeholder="Ej.: 4" value="${h(x ? x.caras : "")}"></label>
      <label class="field"><span>Estibas por cara (opcional)</span><input type="text" inputmode="numeric" id="cmE" placeholder="Vacío = la del producto u 8" value="${h(x && x.cap ? x.cap : "")}"></label>
    </div>
    <p class="muted small">Caras = cuántos frentes tiene el módulo. Capacidad del módulo = caras × estibas por cara.</p>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="cmOk">Guardar</button></div>`);
  const ok = async () => {
    const btn = $("#cmOk", m); ocupado(btn, true);
    try {
      const d = await api("webCapacidadGuardar", x ? x.m : "", { modulo: $("#cmM", m).value.trim(), caras: $("#cmC", m).value.trim(), cap: $("#cmE", m).value.trim() });
      ocupado(btn, false); cerrarModal(true); toast("Módulo guardado", "ok"); alGuardar(d);
    } catch (e) { ocupado(btn, false); toast(e.message, "bad", 6000); }
  };
  $("#cmOk", m).onclick = ok;
  $$("input", m).forEach(i => i.addEventListener("keydown", e => { if (e.key === "Enter") ok(); }));
  setTimeout(() => $(x ? "#cmC" : (sugerido ? "#cmC" : "#cmM"), m).focus(), 50);
}

// ---------- Canales (días mínimos por defecto) ----------
VISTAS.canales = async (el, p, vigente) => {
  const d = await api("webCanales");
  if (!vigente()) return;
  const admin = puede("administrador");
  let filas = d.reglas.map(r => Object.assign({}, r));
  const pintar = () => {
    el.innerHTML = cab("🚦 Canales (días mínimos)", "Reglas por defecto. Si un SKU tiene su propio valor en la hoja Sku (columnas T1, T2, KA), ese manda.",
        admin ? `<button class="btn" data-a="add">＋ Regla</button><button class="btn primary" data-a="guardar">Guardar</button>` : "") +
      `<div class="note ayuda">Orden de prioridad: <b>columna del SKU</b> → la primera regla <b>Familia/Contiene</b> que coincida → la regla <b>General</b> del canal. «Familia» compara con la <b>presentación de la hoja Sku</b> (PET, Lata, Retornable, TW, Barril); si el SKU no la tiene, se deduce del nombre y solo al final se usa la familia del WMS. «Contiene» busca la palabra en el nombre del producto. Mínimo de estibas para «pocos» sin valor en Sku: <b>${d.defecto}</b>.</div>
      <datalist id="presL">${PRES_ORDEN.map(x => `<option value="${x}">`).join("")}</datalist><table class="tabla resp"><thead><tr><th>Canal</th><th>Tipo</th><th>Valor</th><th class="num">Días mínimos</th><th>Nota</th><th></th></tr></thead><tbody>
      ${filas.map((r, k) => admin ? `<tr data-k="${k}"><td data-l="Canal"><select data-f="canal">${["T1", "T2", "KA"].map(c => `<option ${c === r.canal ? "selected" : ""}>${c}</option>`).join("")}</select></td>
        <td data-l="Tipo"><select data-f="tipo">${["General", "Familia", "Contiene"].map(c => `<option ${norm(c) === norm(r.tipo) ? "selected" : ""}>${c}</option>`).join("")}</select></td>
        <td data-l="Valor"><input type="text" data-f="valor" value="${h(r.valor)}" list="presL" placeholder="${norm(r.tipo) === "familia" ? "PET, LATA, RETORNABLE, TW, BARRIL" : ""}" style="text-align:left;max-width:none"></td><td data-l="Días" class="num"><input type="text" inputmode="numeric" data-f="dias" value="${h(r.dias)}"></td>
        <td data-l="Nota"><input type="text" data-f="nota" value="${h(r.nota)}" style="text-align:left;max-width:none"></td><td class="acc"><button class="btn sm del" data-a="del" data-k="${k}">${ICO_DEL}</button></td></tr>`
        : `<tr><td data-l="Canal"><b>${h(r.canal)}</b></td><td data-l="Tipo">${h(r.tipo)}</td><td data-l="Valor">${h(r.valor || "—")}</td><td data-l="Días" class="num"><b>${h(r.dias)}</b></td><td data-l="Nota" class="small">${h(r.nota)}</td><td></td></tr>`).join("")}</tbody></table>`;
  };
  el.oninput = el.onchange = e => { const tr = e.target.closest("tr[data-k]"); if (tr && e.target.dataset.f) filas[+tr.dataset.k][e.target.dataset.f] = e.target.value; };
  el.onclick = async e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    if (b.dataset.a === "add") { filas.push({ canal: "KA", tipo: "Familia", valor: "", dias: "", nota: "" }); pintar(); }
    else if (b.dataset.a === "del") { filas.splice(+b.dataset.k, 1); pintar(); }
    else if (b.dataset.a === "guardar") {
      try { const r = await api("webCanalesGuardar", filas); filas = r.reglas.map(x => Object.assign({}, x)); toast("Canales guardados. El inventario se recalcula con las reglas nuevas.", "ok", 6000); S.inv = null; pintar(); }
      catch (er) { toast(er.message, "bad", 7000); }
    }
  };
  pintar();
};

// ---------- Lista de consumo (Pony gasto): agregar, ver, cambiar el módulo, volver a automático y quitar ----------
// Lista de consumo (solo el administrador): qué productos salen en Pony, con qué nombre, en qué orden y de qué módulo se consumen
VISTAS.consumolista = async (el, p, vigente) => {
  let [lis] = await Promise.all([api("webConsumo"), cargarCat().catch(() => null)]);
  if (!vigente()) return;
  const lugar = x => { const l = x.locs.filter(y => y.sel)[0];
    if (!l) return `<span class="muted small">${x.estado === "sin_fisico" ? "Sin existencias" : x.estado === "solo_operativa" ? "Solo en KA / PREV" : "Sin módulo disponible"}</span>`;
    return `${modChip(l.m)} <span class="small muted">FEFO ${l.fefo || "?"} · vence ${h(l.vf)}</span>`; };
  const catNom = sku => ((S.cat || []).find(c => c.sku === sku) || {}).prod || "";
  const pintar = () => {
    $("#clL", el).innerHTML = lis.length ? `<div class="cl-lista">${lis.map((x, k) => `<div class="cl-f" data-sku="${h(x.sku)}">
        <div class="cl-ord"><span class="cl-n">${k + 1}</span><button class="btn sm icon" data-a="sube" ${k ? "" : "disabled"} title="Subir" aria-label="Subir ${h(x.sku)}">▲</button><button class="btn sm icon" data-a="baja" ${k < lis.length - 1 ? "" : "disabled"} title="Bajar" aria-label="Bajar ${h(x.sku)}">▼</button></div>
        <div class="cl-d"><label class="cl-nom"><span class="sku">${h(x.sku)}</span><input type="text" value="${h(x.nom)}" data-nom="${h(x.sku)}" maxlength="120" aria-label="Nombre que sale en Pony"></label>
          ${catNom(x.sku) && catNom(x.sku) !== x.nom ? `<div class="small muted">En la hoja Sku: ${h(catNom(x.sku))}</div>` : ""}
          <div class="cl-m">${lugar(x)} ${x.modo === "manual" ? `<span class="pill mano-p">✋ A mano</span>` : `<span class="small muted">⚙️ Automático</span>`}${x.unico ? ` <span class="pill unico-p">⚠️ Único módulo</span>` : ""}</div></div>
        <div class="cl-acc"><button class="btn sm" data-a="mod">Cambiar módulo</button>${x.modo === "manual" ? `<button class="btn sm" data-a="auto">Automático</button>` : ""}<button class="btn sm del" data-a="del" title="Quitar de la lista" aria-label="Quitar ${h(x.sku)} de la lista">${ICO_DEL}</button></div></div>`).join("")}</div>`
      : vacio("La lista de consumo está vacía. Agrega un producto arriba.", "🛒");
  };
  const recargar = async () => { lis = await api("webConsumo"); if (vigente()) pintar(); };
  el.innerHTML = cab("🥤 Lista de consumo", "Lo que sale en Consumo / Pony gasto. Agrega productos, cambia el nombre con el que se muestran (vacío = el de la hoja Sku), el orden (▲ ▼), el módulo a consumir o quítalos. Pony solo muestra la lista.", `<button class="btn sm" data-a="ver">Ver Pony →</button>`) +
    `<div class="card" style="margin-bottom:14px"><h3 style="margin-top:0">＋ Agregar producto</h3><div style="max-width:520px">${campoAuto("clA", "Nombre o SKU")}</div></div><div id="clL"></div>`;
  pintar();
  autoSku($("#clA", el), async c => {
    try { await api("webConsumoAgregar", c.sku); toast(`${c.prod} añadido a la lista de consumo`, "ok"); await recargar(); } catch (e) { toast(e.message, "bad", 6000); }
  }, { limpiar: true });
  // Nombre: se guarda al salir del cuadro (o con Enter)
  // (#view se reusa en todas las pantallas: onchange / onkeydown, no addEventListener, para no acumular)
  el.onchange = async e => {
    const i = e.target.closest("[data-nom]"); if (!i) return;
    const x = lis.find(y => y.sku === i.dataset.nom); if (!x || i.value.trim() === x.nom) return;
    i.disabled = true;
    try { x.nom = await api("webConsumoNombre", x.sku, i.value.trim()); i.value = x.nom; toast(`Nombre de ${x.sku}: ${x.nom}`, "ok"); } catch (er) { toast(er.message, "bad", 6000); i.value = x.nom; }
    i.disabled = false;
  };
  el.onkeydown = e => { if (e.key === "Enter" && e.target.closest("[data-nom]")) e.target.blur(); };
  el.onclick = async e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    if (b.dataset.a === "ver") return ir("consumo");
    const f = b.closest("[data-sku]"); const x = f && lis.find(y => y.sku === f.dataset.sku); if (!x) return;
    const k = lis.indexOf(x);
    if (b.dataset.a === "sube" || b.dataset.a === "baja") {
      const j = b.dataset.a === "sube" ? k - 1 : k + 1; if (j < 0 || j >= lis.length) return;
      [lis[k], lis[j]] = [lis[j], lis[k]]; pintar();
      try { await api("webConsumoOrden", lis.map(y => y.sku)); } catch (er) { toast(er.message, "bad", 6000); await recargar(); }
    } else if (b.dataset.a === "del") {
      if (!(await confirmar("Quitar de consumo", `¿Quitar ${skuTxt(x.sku, x.nom)} de la lista de consumo?`, "Quitar", true))) return;
      try { await api("webConsumoEliminar", x.sku); toast("Producto quitado de la lista", "ok"); await recargar(); } catch (er) { toast(er.message, "bad"); }
    } else if (b.dataset.a === "auto") {
      try { await api("webConsumoElegir", x.sku, ""); toast("Volvió al cálculo automático", "ok"); await recargar(); } catch (er) { toast(er.message, "bad"); }
    } else if (b.dataset.a === "mod") modalModuloConsumo(x);
  };
};
function modalModuloConsumo(x) {
  const ops = x.locs.filter(l => l.disp && !l.esOp);
  if (!ops.length) return toast("No hay módulos disponibles de este producto en bodega (KA y PREV no cuentan).", "warn", 6000);
  const m = abrirModal(`<h3>Módulo a consumir</h3><p class="small">${skuTxt(x.sku, x.nom)}</p>
    <p class="small muted">En orden FEFO. El elegido a mano se resalta en Consumo pero se queda en su puesto.</p>
    <div class="cl-ops">${ops.map(l => `<label class="cl-op ${l.sel ? "on" : ""}"><input type="radio" name="clM" value="${h(l.m)}" ${l.sel ? "checked" : ""}><span class="fefo-n">${l.fefo}</span>${modChip(l.m)} <span class="small">${qty(l.e, l.c, l.u)} · vence <b>${h(l.vf)}</b>${l.lleno === false ? " · incompleto" : ""}${l.prio ? " · 🚨" : ""}</span>${l.m === x.auto ? ` <span class="pill">automático</span>` : ""}</label>`).join("")}</div>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="clOk">Guardar</button></div>`);
  $$(".cl-op input", m).forEach(i => i.onchange = () => $$(".cl-op", m).forEach(o => o.classList.toggle("on", $("input", o).checked)));
  $("#clOk", m).onclick = async () => {
    const r = $("input[name=clM]:checked", m); if (!r) return toast("Escoge un módulo", "warn");
    const btn = $("#clOk", m); ocupado(btn, true);
    // Escoger el mismo que da el cálculo automático = volver a automático
    try { await api("webConsumoElegir", x.sku, r.value === x.auto ? "" : r.value); ocupado(btn, false); cerrarModal(true); toast(`Módulo ${r.value} para consumo`, "ok"); ir("consumolista"); }
    catch (er) { ocupado(btn, false); toast(er.message, "bad", 6000); }
  };
}

// ---------- Alerta de pocos: productos vigilados ----------
// El administrador escoge qué productos vigilar; la página avisa (Inicio, menú y al sincronizar)
// cuando uno queda por debajo de su mínimo (columna Mínimo de la hoja Sku; vacío = 10 estibas).
// Estibas disponibles = cajas ÷ cant. por estiba (como en «Pocos»), en toda la bodega.
const POCOS_DEFECTO = 10;
function estadoVigilado(sku) {
  const c = (S.cat || []).find(x => x.sku === sku);
  const disp = (S.inv || []).filter(i => i.s === sku && i.fis && i.disp);
  const eq = disp.reduce((a, i) => a + (i.cpe > 1 ? i.c / i.cpe : i.e), 0);
  const min = c && c.minimo !== "" && c.minimo !== null && c.minimo !== undefined && !isNaN(+c.minimo) ? +c.minimo : POCOS_DEFECTO;
  return { sku: sku, prod: c ? c.prod : (disp[0] ? disp[0].p : "SKU " + sku), c: c, eq: Math.round(eq * 10) / 10, min: min, cajas: disp.reduce((a, i) => a + i.c, 0), mods: new Set(disp.filter(i => !i.esOp).map(i => i.m)).size, bajo: eq < min, agotado: !disp.length };
}
const pocosAlerta = () => (S.pocosVig || []).map(estadoVigilado).filter(x => x.bajo).sort((a, b) => (a.eq / (a.min || 1)) - (b.eq / (b.min || 1)));
const barraPocos = x => `<span class="pv-bar" title="${fm(x.eq)} de ${fm(x.min)} estibas"><i style="width:${Math.min(100, x.min ? x.eq / x.min * 100 : 100)}%"></i></span>`;
// Aviso en Inicio (siempre a la vista si hay alguno)
function avisoPocos(box) {
  if (!box) return;
  const l = pocosAlerta();
  if (!l.length) { box.innerHTML = ""; return; }
  box.innerHTML = `<section class="card pv-aviso"><div class="pv-cab"><b>🔔 Quedan pocos</b><span class="nav-n">${l.length}</span><span class="small muted">productos vigilados por debajo de su mínimo</span></div>
    <div class="pv-l">${l.map(x => `<button type="button" class="pv-i ${x.agotado ? "agot" : ""}" data-sku="${h(x.sku)}"><span class="pv-n">${skuTxt(x.sku, x.prod)}</span>
      <span class="pv-d">${x.agotado ? "<b>Agotado</b> en bodega" : `≈ <b>${fm(x.eq)}</b> de ${fm(x.min)} estibas · ${fm(x.cajas)} cj`}</span>${barraPocos(x)}</button>`).join("")}</div></section>`;
  box.onclick = e => { const b = e.target.closest("[data-sku]"); if (b) ir("stock", { sku: b.dataset.sku }); };
}
VISTAS.pocosvig = async (el, p, vigente) => {
  await Promise.all([cargarCat(), cargarInv().catch(() => null)]);
  if (!vigente()) return;
  const guardarLista = async (lista, msj) => {
    try { S.pocosVig = await api("webPocosVigilarGuardar", lista); ls.setJ("pocosVig", S.pocosVig); toast(msj, "ok"); pintarNav(); pintar(); }
    catch (e) { toast(e.message, "bad", 6000); }
  };
  const pintar = () => {
    const l = (S.pocosVig || []).map(estadoVigilado).sort((a, b) => (b.bajo ? 1 : 0) - (a.bajo ? 1 : 0) || (a.eq / (a.min || 1)) - (b.eq / (b.min || 1)));
    $("#pvL", el).innerHTML = l.length ? `<div class="pv-tabla">${l.map(x => `<div class="pv-f ${x.bajo ? "bajo" : "bien"}">
        <div class="pv-p">${skuTxt(x.sku, x.prod)}<div class="small muted">${x.agotado ? "Agotado en bodega" : `≈ ${fm(x.eq)} estibas · ${fm(x.cajas)} cj · ${fm(x.mods)} mód.`}</div>${barraPocos(x)}</div>
        <span class="pill ${x.bajo ? "bad" : "ok"}">${x.bajo ? "🔔 Bajo el mínimo" : "🟢 Bien"}</span>
        <label class="pv-min"><span>Mínimo</span><input type="text" inputmode="decimal" value="${h(x.c && x.c.minimo !== "" && x.c.minimo !== null && x.c.minimo !== undefined ? x.c.minimo : "")}" placeholder="${POCOS_DEFECTO}" data-min="${h(x.sku)}" ${x.c ? "" : "disabled"}></label>
        <button class="btn sm del" data-quitar="${h(x.sku)}" title="Dejar de vigilar" aria-label="Dejar de vigilar ${h(x.sku)}">${ICO_DEL}</button></div>`).join("")}</div>`
      : vacio("Todavía no vigilas ningún producto. Agrégalo arriba.", "🔔");
    $("#pvC", el).textContent = `${l.length} vigilados · ${l.filter(x => x.bajo).length} bajo el mínimo`;
  };
  el.innerHTML = cab("🔔 Alerta de pocos", "Escoge los productos a vigilar. Cuando uno queda por debajo de su mínimo de estibas (el de la hoja Sku; vacío = 10), sale el aviso en Inicio, en el menú y al sincronizar. El mínimo se cambia aquí mismo.") +
    `<div class="card" style="margin-bottom:14px"><h3 style="margin-top:0">＋ Vigilar un producto</h3><div style="max-width:520px">${campoAuto("pvA", "Nombre o SKU (ej: 22613)")}</div></div>
    <div class="lista-tools"><span class="count" id="pvC"></span></div><div id="pvL"></div>`;
  autoSku($("#pvA", el), c => {
    if ((S.pocosVig || []).includes(c.sku)) return toast(`${c.sku} ya está vigilado`, "warn");
    guardarLista((S.pocosVig || []).concat(c.sku), `Vigilando ${c.sku} · ${c.prod}`);
  }, { limpiar: true });
  el.onclick = async e => {
    const q = e.target.closest("[data-quitar]"); if (!q) return;
    if (!(await confirmar("Dejar de vigilar", `¿Dejar de vigilar ${h(q.dataset.quitar)}? Ya no saldrá la alerta de pocos para ese producto.`, "Dejar de vigilar", true))) return;
    guardarLista((S.pocosVig || []).filter(x => x !== q.dataset.quitar), "Ya no se vigila");
  };
  // El mínimo se guarda en la hoja Sku (el mismo de «Pocos»)
  el.onchange = async e => {
    const i = e.target.closest("[data-min]"); if (!i) return;
    const c = S.cat.find(x => x.sku === i.dataset.min); if (!c) return;
    const v = i.value.trim().replace(",", ".");
    if (v !== "" && (isNaN(+v) || +v < 0)) { toast("Escribe un número (o déjalo vacío para usar 10)", "warn"); return; }
    if (String(c.minimo === null || c.minimo === undefined ? "" : c.minimo) === v) return;   // sin cambio
    const obj = {}; SKU_CAMPOS_UI.forEach(([k]) => obj[k] = c[k] === null || c[k] === undefined ? "" : String(c[k])); obj.minimo = v;
    i.disabled = true;
    try { S.cat = await api("webSkuGuardar", c.sku, obj); ls.setJ("cat", S.cat); toast(`Mínimo de ${c.sku}: ${v || POCOS_DEFECTO + " (general)"}`, "ok"); pintarNav(); pintar(); }
    catch (er) { toast(er.message, "bad", 6000); i.disabled = false; }
  };
  pintar();
};

// ---------- Secciones por rol: qué pantallas ve cada rol ----------
VISTAS.vistasrol = async (el) => {
  let cfg = JSON.parse(JSON.stringify(S.vistasRol || {}));
  const RT = { verificador: "Verif.", opm: "OPM", lector: "Lector", validador: "Valid.", administrador: "Admin" };
  const pintar = () => {
    const grupos = NAV.map(g => ({ t: g.g || "General", items: g.items }));
    el.innerHTML = cab("🔐 Secciones por rol", "Marca qué secciones ve cada rol en el menú. Solo se puede dar lo que el rol alcanza a hacer (— = ese rol no tiene permiso para esa sección). Al administrador nunca se le quitan Usuarios ni Secciones por rol. Esto controla lo que se ve; lo que cada rol puede guardar lo sigue revisando el servidor.",
        `<button class="btn sm" data-a="fabrica">↺ Lo de fábrica</button><button class="btn primary" data-a="guardar">Guardar</button>`) +
      `<div class="vr-tabla"><div class="vr-h"><span>Sección</span>${ROL_LISTA.map(r => `<span>${RT[r]}</span>`).join("")}</div>
      ${grupos.map(g => `<div class="vr-g">${h(g.t)}</div>${g.items.map(i => `<div class="vr-f"><span class="vr-n"><span class="ic">${i.ic}</span>${h(i.t)}</span>${ROL_LISTA.map(r => {
        if (!rolAlcanza(i.id, r)) return `<span class="vr-c muted" title="Este rol no tiene permiso">—</span>`;
        const fijo = r === "administrador" && SIEMPRE_ADMIN.has(i.id), on = vistaPermitida(i.id, r, cfg);
        const cambiado = cfg[r] && typeof cfg[r][i.id] === "boolean";
        return `<label class="vr-c ${cambiado ? "cambio" : ""}"><input type="checkbox" data-v="${i.id}" data-r="${r}" ${on ? "checked" : ""} ${fijo ? "disabled" : ""}></label>`;
      }).join("")}</div>`).join("")}`).join("")}</div>`;
  };
  el.onchange = e => {
    const c = e.target.closest("input[data-v]"); if (!c) return;
    const { v, r } = c.dataset;
    cfg[r] = cfg[r] || {};
    if (c.checked === vistaDefecto(v, r)) delete cfg[r][v]; else cfg[r][v] = c.checked;
    if (!Object.keys(cfg[r]).length) delete cfg[r];
    c.closest(".vr-c").classList.toggle("cambio", !!(cfg[r] && typeof cfg[r][v] === "boolean"));
  };
  el.onclick = async e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    if (b.dataset.a === "fabrica") { if (await confirmar("Lo de fábrica", "¿Volver a las secciones que trae cada rol por defecto? (se aplica al guardar)", "Sí")) { cfg = {}; pintar(); } return; }
    ocupado(b, true);
    try { S.vistasRol = await api("webVistasRolGuardar", cfg); ls.setJ("vistasRol", S.vistasRol); ocupado(b, false); toast("Secciones por rol guardadas", "ok"); pintarNav(); }
    catch (er) { ocupado(b, false); toast(er.message, "bad", 6000); }
  };
  pintar();
};

// =====================================================================
// ARRANQUE
// =====================================================================
// Después del cambio definitivo, el dashboard de Apps Script solo muestra los turnos
function avisoTurnosNueva(url) {
  let b = $("#nuevaBar");
  document.body.classList.toggle("turnos-fuera", !!url);
  // (solo cuenta un aviso que se esté viendo: el de «modo prueba» queda escondido después del cambio definitivo)
  if (!url) { if (b) b.remove(); document.body.classList.toggle("con-aviso", !!$(".web-aviso:not(.hidden)")); return; }
  if (!b) { b = document.createElement("div"); b.id = "nuevaBar"; b.className = "web-aviso"; $("#offBar").after(b); }
  b.innerHTML = `🚀 Los turnos, validaciones, entregas y conciliaciones ahora se hacen en la <a href="${h(url)}" target="_blank" rel="noopener"><b>versión nueva</b></a>. Aquí solo se consultan.`;
  document.body.classList.add("con-aviso");
}
async function arrancar(yaPintado, forzarRepintar) {
  pintarCola();
  try {
    const i = await api("webInit");
    const cambioRol = !S.usuario || S.usuario.rol !== i.usuario.rol;
    S.usuario = i.usuario; S.grupoTg = i.grupoTelegram; S.instructivo = i.instructivo; S.turno = i.turno;
    S.rep = Array.isArray(i.reportes) ? i.reportes : []; ls.setJ("rep", S.rep);
    const cambioVistas = JSON.stringify(S.vistasRol || {}) !== JSON.stringify(i.vistasRol || {});
    S.vistasRol = i.vistasRol || {}; ls.setJ("vistasRol", S.vistasRol);
    S.pocosVig = Array.isArray(i.pocosVig) ? i.pocosVig : []; ls.setJ("pocosVig", S.pocosVig);
    avisoTurnosNueva(i.turnosNueva);
    guardarInv(i.inv); S.cat = i.cat; ls.setJ("cat", S.cat); ls.setJ("turno", i.turno);
    ls.setJ("usuario", S.usuario); ls.set("grupoTg", S.grupoTg ? "1" : "");
    if (yaPintado) {
      pintarUsuario(); pintarNav();
      // Repinta con los datos frescos solo si nadie está escribiendo o con una ventana abierta
      if (forzarRepintar || cambioRol || cambioVistas || (!modalAbierto() && !usandoPantalla())) repintar();
      if (forzarRepintar) toast("Datos actualizados", "ok", 2000);
      procesarCola();
      return;
    }
  } catch (e) {
    if (yaPintado) { if (forzarRepintar && e.red) throw e; if (!e.sesion) toast(e.red ? "Sin conexión: trabajando con los datos guardados." : "No se pudo actualizar: " + e.message, "warn", 6000); return; }
    if (e.sesion) return;
    const u = ls.getJ("usuario", null), inv = ls.getJ("inv", null);
    if (e.red && u) {
      S.usuario = u; S.cat = ls.getJ("cat", null);
      if (inv) { S.inv = inv.filas; S.ocup = inv.ocupacion || {}; S.sync = inv.sync; S.fotos = inv.fotos || []; pintarSync(); }
      toast("Sin conexión: trabajando con los datos guardados en este equipo.", "warn", 7000);
    } else { toast("No se pudo conectar: " + e.message, "bad", 8000); return; }
  }
  pintarUsuario(); pintarNav();
  ir(ls.get("vista", "inicio"));
  procesarCola();
}

// Ajustes de la versión web (Supabase)
if (window.FRECS_WEB) FRECS_WEB.ajustar();

(function inicio() {
  S.tk = ls.get("tk", "");
  pintarCola();
  if (!S.tk) { mostrarLogin(); return; }
  // Arranque instantáneo: si hay datos guardados en este equipo, se pinta ya
  // y la información fresca llega por detrás.
  const u = ls.getJ("usuario", null), inv = ls.getJ("inv", null);
  if (u && inv) {
    S.usuario = u; S.grupoTg = ls.get("grupoTg", "") === "1"; S.cat = ls.getJ("cat", null); S.turno = ls.getJ("turno", null); S.rep = ls.getJ("rep", []); S.vistasRol = ls.getJ("vistasRol", {}); S.pocosVig = ls.getJ("pocosVig", []);
    S.inv = inv.filas; S.ocup = inv.ocupacion || {}; S.sync = inv.sync; S.fotos = inv.fotos || []; pintarSync();
    pintarUsuario(); pintarNav();
    ir(ls.get("vista", "inicio"));
    arrancar(true);
    return;
  }
  arrancar();
})();

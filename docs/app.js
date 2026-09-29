// GENERADO por herramientas/construir.py: no editar a mano.
// =====================================================================
// Frecs! · Dashboard (JS)
// Núcleo: estado, llamadas al servidor, cola sin conexión, ingreso, navegación
// =====================================================================
const ROLES = { lector: 1, validador: 2, administrador: 3 };
const NAV = [
  { g: "", items: [
    { id: "inicio", ic: "🏠", t: "Inicio" } ] },
  { g: "Turnos", cls: "turnos", items: [
    { id: "conciliacion", ic: "⚖️", t: "Conciliación" },
    { id: "validacion", ic: "📝", t: "Validaciones" },
    { id: "entrega", ic: "📋", t: "Entrega de turno" },
    { id: "final", ic: "📦", t: "Entrega final" },
    { id: "consumo", ic: "🥤", t: "Consumo" },
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
    { id: "capacidad", ic: "🧱", t: "Capacidad de bodega" } ] }
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
function cab(titulo, sub, tools) {
  return `<div class="vh"><div><h1>${titulo}${sub ? ` <button class="ayuda-btn" data-ayuda title="¿Qué es esto?" aria-label="Ayuda">?</button>` : ""}</h1>${sub ? `<div class="sub ayuda">${sub}</div>` : ""}</div>${tools ? `<div class="tools">${tools}</div>` : ""}</div>`;
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

let modalBusy = false, modalOnClose = null;
let modalDesde = 0;
function abrirModal(html, opts) {
  opts = opts || {};
  modalBusy = false;
  modalDesde = Date.now();
  const card = $("#modalCard");
  card.className = "modal-card" + (opts.wide ? " wide" : "");
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
        <label class="field"><span>Nombre</span><select id="lgN"><option value="">Escoge tu nombre…</option>${p.nombres.map(n => `<option ${n === ult ? "selected" : ""}>${h(n)}</option>`).join("")}</select></label>
        <label class="field" style="margin-top:10px"><span>PIN</span><input type="password" inputmode="numeric" class="pin" id="lgP" maxlength="8" autocomplete="current-password"></label>
        <div id="lgE" style="margin-top:10px"></div><button class="btn primary" id="lgB">Entrar</button>`;
      const ir2 = async () => {
        const n = $("#lgN").value, p1 = $("#lgP").value.trim();
        if (!n || !p1) { $("#lgE").innerHTML = errBox("Escoge tu nombre y escribe el PIN."); return; }
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
function pintarUsuario() { $("#userChip").textContent = "👤 " + (S.usuario ? S.usuario.nombre : "…"); }
$("#userChip").onclick = () => {
  if (!S.usuario) return;
  const u = S.usuario;
  const c = abrirModal(`<h3>👤 ${h(u.nombre)}</h3>
    <div class="ficha"><span>Rol</span><b>${h(u.rol)}</b>${u.correo ? `<span>Correo</span><b>${h(u.correo)}</b>` : `<span>Correo</span><b class="muted">No disponible (cuenta Gmail)</b>`}</div>
    <details class="card" style="margin-top:14px"><summary>Cambiar mi PIN</summary>
      <label class="field"><span>PIN actual</span><input type="password" inputmode="numeric" id="cpA" maxlength="8"></label>
      <label class="field"><span>PIN nuevo (4 a 8 números)</span><input type="password" inputmode="numeric" id="cpN" maxlength="8"></label>
      <button class="btn" id="cpB" style="margin-top:10px">Guardar PIN</button></details>
    <div class="modal-actions"><button class="btn danger" id="lgOut">Cerrar sesión</button><button class="btn" data-x>Cerrar</button></div>`);
  $("#cpB", c).onclick = async () => { try { await api("webCambiarPin", $("#cpA", c).value.trim(), $("#cpN", c).value.trim()); toast("PIN actualizado", "ok"); cerrarModal(true); } catch (e) { toast(e.message, "bad", 6000); } };
  $("#lgOut", c).onclick = async () => { try { await api("webLogout"); } catch (e) {} cerrarModal(true); S.usuario = null; mostrarLogin(); };
};

// ---------- navegación ----------
function pintarNav() {
  $("#nav").innerHTML = NAV.filter(g => !g.rol || puede(g.rol)).map(g => `${g.g ? `<h4 class="${g.cls || ""}">${h(g.g)}</h4>` : ""}${g.items.map(i => `<a href="#" data-v="${i.id}" class="${S.vista === i.id ? "on" : ""}"><span class="ic">${i.ic}</span>${h(i.t)}</a>`).join("")}`).join("");
  $$("#bottombar button").forEach(b => b.classList.toggle("on", b.dataset.v === S.vista));
}
let menuDesde = 0;
const menuAbierto = () => $("#nav").classList.contains("open");
function abrirMenu(on) { $("#nav").classList.toggle("open", on); $("#scrim").classList.toggle("on", on); if (on) menuDesde = Date.now(); }
$("#menuBtn").onclick = e => { e.stopPropagation(); abrirMenu(!menuAbierto()); };
$("#scrim").onclick = () => abrirMenu(false);
// En el celular, el mismo toque que abre el menú no puede escoger una sección
$("#nav").addEventListener("click", e => { const a = e.target.closest("a[data-v]"); if (!a) return; e.preventDefault(); if (window.innerWidth < 1024 && Date.now() - menuDesde < 400) return; ir(a.dataset.v); });
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
  else if (S.vista !== "inicio") ir("inicio", {}, true);
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
  if (!VISTAS[vista] || (TITULOS[vista] && TITULOS[vista].rol && !puede(TITULOS[vista].rol))) vista = "inicio";
  if (!esAtras && S.vista && (S.vista !== vista || !mismo(S.params, params || {}))) { S.pila.push({ vista: S.vista, params: S.params }); if (S.pila.length > 30) S.pila.shift(); }
  if (vista === "inicio" && !esAtras) S.pila = [];
  S.vista = vista; S.params = params || {};
  S.vistaDesde = Date.now(); S.pendRepintar = null; $("#nuevoChip").classList.add("hidden");
  $("#backBtn").classList.toggle("hidden", vista === "inicio" && !S.pila.length);
  ls.set("vista", vista);
  pintarNav(); abrirMenu(false);
  window.scrollTo(0, 0);
  const el = $("#view");
  el.onclick = el.oninput = el.onchange = null;
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
  S.inv = d.filas; S.ocup = d.ocupacion || {}; S.sync = d.sync; pintarSync();
  ls.setJ("inv", { filas: d.filas, ocupacion: d.ocupacion, sync: d.sync, guardado: ahoraTxt() });
}
async function cargarInv(forzar) {
  if (S.inv && !forzar) return S.inv;
  if (S.cargandoInv && !forzar) return S.cargandoInv;
  S.cargandoInv = api("webInventario").then(d => { guardarInv(d); S.cargandoInv = null; return S.inv; })
    .catch(e => {
      S.cargandoInv = null;
      const c = ls.getJ("inv", null);
      if (e.red && c) { S.inv = c.filas; S.ocup = c.ocupacion || {}; S.sync = c.sync; pintarSync(); toast(`Sin conexión: inventario guardado del ${fechaCorta(c.guardado)}`, "warn", 5000); return S.inv; }
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
  try {
    const r = await api("webSincronizar");
    guardarInv(r.inv);
    toast(`Base actualizada: ${fm(r.filas)} ubicaciones con producto en ${fm(r.modulos)} módulos`, "ok");
    repintar();
  } catch (e) {
    if (/forzar/.test(e.message) && puede("validador") && await confirmar("Bajada grande de inventario", h(e.message) + "<br><br>¿La bajada es real y quieres reemplazar la base de todas formas?", "Sí, reemplazar")) {
      try { const r = await api("webSincronizar", true); guardarInv(r.inv); toast("Base actualizada", "ok"); repintar(); } catch (e2) { toast(e2.message, "bad", 7000); }
    } else toast(e.message, "bad", 7000);
  } finally { b.disabled = false; b.innerHTML = t; }
};

// ---------- PDFs ----------
async function descargarPDF(tipo, id, btn) {
  if (btn) btn.disabled = true;
  toast("Generando PDF…", "", 2500);
  try { const r = await api("webPDF", tipo, id || ""); bajarB64(r.nombre, r.b64); }
  catch (e) { toast(e.message, "bad", 6000); }
  finally { if (btn) btn.disabled = false; }
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
  try { await api("webPDFTelegram", tipo, id || ""); toast("PDF enviado al grupo de Telegram", "ok"); }
  catch (e) { toast(e.message, "bad", 6000); }
  finally { if (btn) btn.disabled = false; }
}
// Descargar siempre; Telegram solo si el usuario lo pide con su botón
function botonesPDF(tipo, etiqueta, id) {
  const d = id ? ` data-id="${h(id)}"` : "";
  return `<button class="btn sm" data-pdf="${tipo}"${d} title="Descargar ${h(etiqueta || "PDF")}"><span class="ic">📄</span><span class="txt">${h(etiqueta || "PDF")}</span></button>${S.grupoTg && puede("validador") ? `<button class="btn sm ghost" data-tg="${tipo}"${d} title="Enviar al grupo de Telegram"><span class="ic">✈️</span><span class="txt">Telegram</span></button>` : ""}`;
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
  if (i.reemp) tags.push(`<span class="tag">📦 Reempaque</span>`);
  if (i.carpa && o.carpa !== false) tags.push(`<span class="tag">⛺ Carpa</span>`);
  const est = i.disp ? `<span class="pill ok">DISPONIBLE</span>` : `<span class="pill bad">BLOQ · ${h(i.est)}</span>`;
  let obs = "";
  if (!i.disp && (i.cand || i.obs)) obs = `<div class="obs">🔑 ${i.cand ? `<b>${h(i.cand)}</b> ` : ""}${h(i.obs || "")}</div>`;
  else if (i.obs) obs = `<div class="obs">📝 ${h(i.obs)}</div>`;
  return `<article class="card inv v-${h(i.vida)}">
    <div class="row sb"><span class="mod-l">${modChip(i.m)}${o.fefo ? `<span class="fefo" title="Orden FEFO: primero lo que vence antes">#${o.fefo} FEFO</span>` : ""}</span>${est}</div>
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

// =====================================================================
// INICIO
// =====================================================================
VISTAS.inicio = async (el, p, vigente) => {
  el.innerHTML = cab(`Hola, ${h(S.usuario ? S.usuario.nombre.split(" ")[0] : "")}`, "Resumen de la bodega y del turno") +
    `<div class="quick">${campoAuto("qq", "SKU, producto o módulo (ej: 3659, pony go, B12)")}</div>
     <div id="tb"></div><div id="kp">${loader()}</div><h2>Validación del turno</h2><div id="vs">${loader()}</div>`;
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
  let sku = p.sku || ls.get("ultSku", ""), filtro = "ALL", verKA = false, modo = ls.get("modoStock", "sku");
  el.innerHTML = cab("📡 Stock por SKU", "Existencias físicas en bodega, ordenadas por prioridad y vencimiento") +
    `<div class="form-row"><div class="seg" id="smo"><button data-m="sku">Por SKU</button><button data-m="nombre">Por nombre</button></div></div>
     <div class="form-row"><label class="field" style="max-width:520px"><span id="slb"></span><input type="search" id="sq"></label><button class="btn primary" id="sb">Consultar</button></div><div id="sr"></div>`;
  const inp = $("#sq", el);
  const pintarModo = () => {
    $$("#smo button", el).forEach(b => b.classList.toggle("on", b.dataset.m === modo));
    $("#slb", el).textContent = modo === "sku" ? "SKU" : "Nombre del producto (escoge de la lista)";
    inp.setAttribute("inputmode", modo === "sku" ? "numeric" : "text");
    inp.placeholder = modo === "sku" ? "Ej: 3659" : "Ej: pony go 2l";
    inp.value = modo === "sku" ? sku : "";
  };
  autoSku(inp, c => { sku = c.sku; ls.set("ultSku", sku); if (modo === "nombre") inp.value = `${c.sku} · ${c.prod}`; pintar(); }, { soloSku: false });
  $("#smo", el).onclick = e => { const b = e.target.closest("[data-m]"); if (!b) return; modo = b.dataset.m; ls.set("modoStock", modo); pintarModo(); inp.focus(); };
  const pintar = () => {
    const r = $("#sr", el);
    if (!sku) { r.innerHTML = `<div class="note">Escribe un SKU o busca por nombre.</div>`; return; }
    const ficha = S.cat.find(c => c.sku === sku);
    if (!ficha) { r.innerHTML = vacio("Este SKU no existe en la hoja Sku.", "❌"); return; }
    const fis = inv.filter(i => i.s === sku && i.fis);
    if (!fis.length) { r.innerHTML = `<div class="card" style="margin-bottom:12px"><div class="prod" style="font-weight:700;font-size:17px">${skuTxt(sku, ficha.prod)}</div></div>` + vacio("No hay existencias físicas.", "⚠️"); return; }
    const visibles = fis.filter(i => verKA || !i.esOp);
    const tot = visibles.filter(i => i.disp).reduce((a, i) => ({ e: a.e + i.e, c: a.c + i.c, u: a.u + i.u }), { e: 0, c: 0, u: 0 });
    const lis = visibles.filter(i => (filtro === "DISP" ? i.disp : filtro === "ALL" ? true : i[filtro])).sort(ordPrioVence);
    const segBtn = (f, t) => `<button data-f="${f}" class="${filtro === f ? "on" : ""}">${t}</button>`;
    r.innerHTML = `<div class="card" style="margin-bottom:12px"><div class="prod" style="font-weight:700;font-size:17px">${skuTxt(sku, fis[0].p || ficha.prod)}</div>
        <div style="margin-top:8px">✅ <b>Total disponible</b>${verKA ? "" : " (sin KA/PREV)"}: ${qty(tot.e, tot.c, tot.u, fis[0].emp)}</div>
        <div class="small muted" style="margin-top:4px">Mínimo para no ser «poco»: ${ficha.minimo === null ? "10 (por defecto)" : fm(ficha.minimo)} estibas</div></div>
      <div class="lista-tools"><div class="seg" id="sf">${segBtn("ALL", "Todos")}${segBtn("DISP", "Disponible")}${segBtn("T1", "T1")}${segBtn("T2", "T2")}${segBtn("KA", "KA")}</div>
        <label class="toggle"><input type="checkbox" id="sk" ${verKA ? "checked" : ""}> Mostrar KA / PREV</label><span class="count">${fm(lis.length)} ubicaciones</span></div>
      ${LEYENDA}${lis.length ? `<div class="grid">${(() => { let n = 0; return lis.map(i => invCard(i, { producto: false, fefo: i.disp ? ++n : 0 })).join(""); })()}</div>` : (fis.some(i => i.esOp) && !verKA ? vacio("Agotado en bodega general. Hay stock en KA / PREV: activa «Mostrar KA / PREV».", "⚠️") : vacio("Nada con este filtro.", "🔎"))}`;
    $("#sf", r).onclick = e => { const b = e.target.closest("button"); if (b) { filtro = b.dataset.f; pintar(); } };
    $("#sk", r).onchange = e => { verKA = e.target.checked; pintar(); };
  };
  const consultar = () => {
    const v = inp.value.trim();
    const m = v.match(/^(\d+)/);
    if (m) sku = m[1];
    else { const r = buscarCat(v, 1); if (r.length) sku = r[0].sku; }
    ls.set("ultSku", sku); pintar();
  };
  $("#sb", el).onclick = consultar;
  inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.defaultPrevented) consultar(); });
  pintarModo(); pintar();
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
VISTAS.producto = async (el, p, vigente) => {
  await Promise.all([cargarCat(), cargarInv().catch(() => null)]);
  if (!vigente()) return;
  el.innerHTML = cab("🔍 Información de producto", "Busca por nombre, parecido o SKU. La lista se filtra mientras escribes.") +
    `<div class="form-row"><label class="field" style="max-width:560px"><span>Buscar</span><input type="search" id="bq" value="${h(p.q || "")}" placeholder="Ej: pony go 2l · 3659 · aguila lata"></label></div><div id="br"></div>`;
  const pintar = () => {
    const q = $("#bq", el).value.trim();
    if (!q) { $("#br", el).innerHTML = `<div class="note">Escribe al menos una palabra o el SKU.</div>`; return; }
    const res = buscarCat(q, 120);
    if (!res.length) { $("#br", el).innerHTML = vacio("No se encontró ningún producto.", "❌"); return; }
    $("#br", el).innerHTML = `<div class="count" style="margin-bottom:8px">${res.length} productos${res[0].aprox ? " (parecidos)" : ""}</div><div class="grid">${res.map(c => fichaHtml(c, true)).join("")}</div>`;
  };
  $("#bq", el).oninput = pintar;
  $("#br", el).onclick = e => { const b = e.target.closest("[data-sku]"); if (b) ir("stock", { sku: b.dataset.sku }); };
  pintar();
};

// =====================================================================
// BÚSQUEDA GRUPAL
// =====================================================================
VISTAS.grupo = async (el, p, vigente) => {
  const [inv] = await Promise.all([cargarInv(), cargarCat()]);
  if (!vigente()) return;
  let filtro = "ALL", verKA = false;
  el.innerHTML = cab("📦 Búsqueda grupal", "Varios SKUs a la vez: las 2 mejores ubicaciones de cada uno") +
    `<div class="form-row"><label class="field"><span>SKUs (separados por espacio o coma)</span><input type="text" id="gq" value="${h(ls.get("ultGrupo", ""))}" placeholder="2222 3810 7078"></label><button class="btn primary" id="gb">Buscar</button></div><div id="gr"></div>`;
  const pintar = () => {
    const skus = ($("#gq", el).value.match(/\d+/g) || []).filter((v, k, a) => a.indexOf(v) === k);
    ls.set("ultGrupo", skus.join(" "));
    if (!skus.length) { $("#gr", el).innerHTML = `<div class="note">Escribe uno o más SKUs numéricos.</div>`; return; }
    const segBtn = (f, t) => `<button data-f="${f}" class="${filtro === f ? "on" : ""}">${t}</button>`;
    let html = `<div class="lista-tools"><div class="seg" id="gf">${segBtn("ALL", "Todos")}${segBtn("DISP", "Disponible")}${segBtn("T1", "T1")}${segBtn("T2", "T2")}${segBtn("KA", "KA")}</div><label class="toggle"><input type="checkbox" id="gk" ${verKA ? "checked" : ""}> Mostrar KA / PREV</label></div>${LEYENDA}`;
    skus.forEach(s => {
      const f = S.cat.find(c => c.sku === s);
      if (!f) { html += `<h2>❌ <span class="sku">${h(s)}</span></h2><div class="note">No existe en la hoja Sku.</div>`; return; }
      const fis = inv.filter(i => i.s === s && i.fis);
      html += `<h2>${skuTxt(s, fis[0] ? fis[0].p : f.prod)}</h2>`;
      if (!fis.length) { html += `<div class="note">Sin existencias físicas registradas en bodega.</div>`; return; }
      const lis = fis.filter(i => verKA || !i.esOp).filter(i => filtro === "ALL" ? true : filtro === "DISP" ? i.disp : i[filtro]).sort(ordPrioVence);
      if (!lis.length) { html += `<div class="note">${fis.some(i => i.esOp) && !verKA ? "Agotado en pasillos generales (disponible en KA / PREV)." : "Filtrado u oculto por canal."}</div>`; return; }
      html += `<div class="grid">${lis.slice(0, 2).map(i => invCard(i, { producto: false })).join("")}</div>`;
      if (lis.length > 2) html += `<div class="small muted" style="margin-top:6px">+${lis.length - 2} ubicaciones más · <button class="link" data-sku="${h(s)}">ver todas</button></div>`;
    });
    $("#gr", el).innerHTML = html;
    $("#gf", el).onclick = e => { const b = e.target.closest("button"); if (b) { filtro = b.dataset.f; pintar(); } };
    $("#gk", el).onchange = e => { verKA = e.target.checked; pintar(); };
  };
  $("#gr", el).addEventListener("click", e => { const b = e.target.closest("[data-sku]"); if (b) ir("stock", { sku: b.dataset.sku }); });
  $("#gb", el).onclick = pintar; $("#gq", el).onkeydown = e => { if (e.key === "Enter") pintar(); };
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
    `<div class="form-row"><label class="field" style="max-width:260px"><span>Módulo o pasillo</span><input type="text" id="mq" value="${h(q)}" placeholder="Ej: B o B12"></label><button class="btn primary" id="mb">Ver</button></div><div id="mr"></div>`;
  const ver = () => { const v = $("#mq", el).value.trim(); ls.set("ultMod", v); ir("modulo", { mod: v }); };
  $("#mb", el).onclick = ver; $("#mq", el).onkeydown = e => { if (e.key === "Enter") ver(); };
  if (!q) { $("#mr", el).innerHTML = `<div class="note">Escribe un módulo.</div>`; return; }
  const esPasillo = q.length <= 2 && !/\d/.test(q);
  const re = new RegExp("^" + q.replace(/[^A-Z]/g, "") + "\\d+$");
  const lis = inv.filter(i => i.fis && (esPasillo ? re.test(i.m) : i.m === q)).sort(ordPrioModD);
  let arriba = "";
  if (!esPasillo && S.ocup[q]) {
    const o = S.ocup[q];
    arriba = `<div class="card" style="margin-bottom:12px"><b>Ocupación:</b> ${fm(o.usadas)} / ${fm(o.capTot)} estibas (${o.caras} caras × ${o.porCara}) · ${o.libres <= 0 ? `<span class="pill bad">MÓDULO LLENO</span>` : `<span class="pill ok">Faltan ${fm(o.libres)} estibas</span>`}</div>`;
  }
  const r = $("#mr", el);
  if (!lis.length) { r.innerHTML = arriba + vacio(`Módulo ${q} vacío o no existe.`, "📭"); return; }
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
      ${LEYENDA}<div class="grid">${b.lotes.map((i, k) => invCard(Object.assign({ emp: "Cajas", fis: true }, i), { canales: false, fefo: k + 1 })).join("")}</div>` : vacio("No hay producto en el módulo BARRILES.", "🛢️"));
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
    const lG = Object.values(gr).map(g => { g.u.sort(ordPrioVence); g.prio = g.u.some(x => x.prio); return g; }).sort((a, b) => prio(a, b) || cmpSku(a, b));
    $("#rc", el).textContent = `${lG.length} productos`;
    $("#rr", el).innerHTML = lG.length ? lG.map(g => `<h2>${skuTxt(g.s, g.p)}${g.prio ? ` <span class="tag t-prio">🚨 Prioridad</span>` : ""}</h2><div class="grid">${g.u.slice(0, 2).map((i, k) => invCard(i, { producto: false, fefo: i.disp ? k + 1 : 0 })).join("")}</div>`).join("")
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
VISTAS.fechas = async (el, p, vigente) => {
  const dias = p.dias || +ls.get("ultDias", 60) || 60;
  const inv = await cargarInv();
  if (!vigente()) return;
  listaInv(el, {
    titulo: `⏳ Fechas cortas (≤ ${dias} días)`, sub: "Producto que vence dentro del plazo indicado",
    tools: `<label class="field" style="width:130px"><span>Días</span><input type="number" min="1" id="fd" value="${dias}"></label><button class="btn" id="fdb" style="align-self:flex-end">Aplicar</button>`,
    items: inv.filter(i => i.fis && i.d >= 0 && i.d <= dias).sort(ordPrioD), vacio: "Cero resultados en ese plazo.",
    alMontar: e2 => { const ap = () => { const v = parseInt($("#fd", e2).value, 10) || 60; ls.set("ultDias", v); ir("fechas", { dias: v }); }; $("#fdb", e2).onclick = ap; $("#fd", e2).onkeydown = ev => { if (ev.key === "Enter") ap(); }; }
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
  el.innerHTML = cab("📊 Resumen gerencial", "Estado general, alertas de calidad y etiquetas activas", botonesPDF("INFORME", "Informe de prioridad (todos los productos)") + botonesPDF("RESUMEN", "PDF resumen (5 págs)")) +
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
  const pintar = () => {
    const q = norm($("#pq", el).value).split(/\s+/).filter(x => x);
    const items = lis.filter(it => coincide(norm(it.s + " " + it.p), q) > 0);
    $("#pc", el).textContent = `${items.length} SKUs`;
    $("#pr", el).innerHTML = items.length ? `<div class="grid">${items.map(it => `<article class="card">
      <div class="row sb"><b style="font-size:15.5px">${skuTxt(it.s, it.p)}</b>${it.prio ? `<span class="pill bad">🚨 PRIORIDAD</span>` : ""}</div>
      <div class="sub">≈ <b>${fm(it.eq)}</b> estibas de mínimo <b>${fm(it.minimo)}</b> · Bodega ≈ ${fm(it.zonas.bodega)} est · KA ${fm(it.zonas.ka)} cajas · PK ${fm(it.zonas.pk)} cajas</div>
      <div style="margin:8px 0 4px">${qty(it.totE, it.totC, it.totU)}</div>
      <div class="mini-list">${it.locs.map(l => `<div class="mini v-${h(l.vida)}"><b>${h(l.m)}</b> · ${fm(l.e)} Estibas | ${fm(l.c)} Cajas · vence ${h(l.vf)} (${l.d === 9999 ? "sin fecha" : l.d + " d"})</div>`).join("")}</div>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-sku="${h(it.s)}">Ver stock →</button></div></article>`).join("")}</div>` : vacio(lis.length ? "Nada coincide." : "Ningún SKU está por debajo de su mínimo.");
  };
  $("#pq", el).oninput = pintar;
  $("#pr", el).onclick = e => { const b = e.target.closest("[data-sku]"); if (b) ir("stock", { sku: b.dataset.sku }); };
  pintar();
};

VISTAS.limbo = async (el, p, vigente) => {
  const lis = await api("webLimbo");
  if (!vigente()) return;
  const esc = puede("validador");
  el.innerHTML = cab("🌫️ Mercancía en limbo", "Producto físico que aún no tiene SKU asignado") +
    (esc ? `<details class="card" ${lis.length ? "" : "open"} style="margin:0 0 14px"><summary>➕ Registrar producto en limbo</summary>
      <div class="form-row" style="margin-top:10px">
        <label class="field"><span>Producto</span><input type="text" id="ln" placeholder="Ej: Michelob 210 x6"></label>
        <label class="field" style="max-width:190px"><span>Vencimiento</span><input type="date" id="lf"></label>
        <label class="field" style="max-width:170px"><span>Presentación</span><input type="text" id="lp" list="lpres" placeholder="Lata, TW…"><datalist id="lpres"><option>Lata</option><option>Retornable</option><option>Pet</option><option>TW</option><option>Barril</option></datalist></label>
        <label class="field" style="max-width:150px"><span>Cubicaje</span><input type="text" id="lc" placeholder="330cc"></label>
        <button class="btn primary" id="lb">Guardar</button></div></details>` : "") +
    (lis.length ? `${LEYENDA}<div class="grid">${lis.map(x => `<article class="card inv v-${h(x.vida)}"><div class="row sb"><span class="mono small">${h(x.id)}</span>${esc ? `<button class="btn sm del" data-del="${h(x.id)}">${ICO_DEL} Eliminar</button>` : ""}</div>
      <div class="prod">${h(x.p)}</div><div class="vence">Vence <b>${h(x.v)}</b>${x.dias !== 9999 ? ` · ${x.dias < 0 ? "Vencido" : x.dias + " días"}` : ""}</div>
      <div class="small">Presentación: <b>${h(x.pres || "N/A")}</b> · Cubicaje: <b>${h(x.cub || "N/A")}</b></div><div class="act">Reportado: ${h(x.fecha)}</div></article>`).join("")}</div>` : vacio("No hay productos pendientes de SKU."));
  if (esc) $("#lb", el).onclick = async () => {
    const obj = { nombre: $("#ln", el).value.trim(), fecha: $("#lf", el).value, pres: $("#lp", el).value.trim(), cub: $("#lc", el).value.trim() };
    if (!obj.nombre || !obj.fecha) { toast("Escribe el producto y la fecha de vencimiento.", "bad"); return; }
    try { const id = await api("webLimboAgregar", obj); toast(`Añadido al limbo con ID ${id}`, "ok"); ir("limbo"); } catch (e) { toast(e.message, "bad", 6000); }
  };
  el.onclick = async e => {
    const b = e.target.closest("[data-del]"); if (!b) return;
    if (!(await confirmar("Eliminar del limbo", `¿Eliminar el registro <b>${h(b.dataset.del)}</b>?`, "Eliminar", true))) return;
    try { await api("webLimboEliminar", b.dataset.del); toast("Registro eliminado", "ok"); ir("limbo"); } catch (er) { toast(er.message, "bad"); }
  };
};

// =====================================================================
// SLOTTING
// =====================================================================
VISTAS.organizar = async (el, p, vigente) => {
  const lis = await api("webOrganizar");
  if (!vigente()) return;
  if (!lis.length) { el.innerHTML = cab("🧩 Organizar bodega", "Movimientos sugeridos para liberar módulos (mismo SKU repartido)") + vacio("Bodega organizada. No hay nada por consolidar."); return; }
  el.innerHTML = cab("🧩 Organizar bodega", "Movimientos sugeridos para liberar módulos (mismo SKU repartido)") + LEYENDA +
    `<div class="lista-tools"><input type="search" id="oq" placeholder="Buscar por SKU, producto o módulo…"><div class="seg" id="of"><button data-f="ALL">Todos</button><button data-f="OK">✅ FEFO se cumple</button><button data-f="MAL">⚠️ FEFO en riesgo</button></div><span class="count" id="oc"></span></div><div id="or"></div>`;
  let filtroF = ls.get("orgFefo", "ALL");
  $("#of", el).onclick = e => { const b = e.target.closest("[data-f]"); if (!b) return; filtroF = b.dataset.f; ls.set("orgFefo", filtroF); pintar(); };
  const pintar = () => {
    $$("#of button", el).forEach(b => b.classList.toggle("on", b.dataset.f === filtroF));
    const q = norm($("#oq", el).value).split(/\s+/).filter(x => x);
    const it = lis.filter(s2 => (filtroF === "ALL" || (filtroF === "OK" ? s2.fefoOk !== false : s2.fefoOk === false)) && (!q.length || coincide(norm(`${s2.sku} ${s2.p} ${s2.from} ${s2.to}`), q) > 0));
    $("#oc", el).textContent = `${it.length} movimientos`;
    $("#or", el).innerHTML = it.length ? `<div class="grid">${it.map(s2 => `<article class="card inv v-${h(s2.vida)}">
    <div class="prod">${skuTxt(s2.sku, s2.p)}</div><div class="fefo-est ${s2.fefoOk === false ? "mal" : "bien"}"><b>${h(s2.fefo)}</b>${s2.fefoDet ? `<div class="small">${h(s2.fefoDet)}</div>` : ""}</div>
    <div style="font-size:16px;margin:6px 0">👉 Mover ${modChip(s2.from)} → ${modChip(s2.to)}</div>
    ${qty(s2.e, s2.c, s2.u)}
    <div class="vence">Vence <b>${h(s2.vf)}</b> · ${s2.d === 9999 ? "sin fecha" : s2.d + " días"}</div>
    <div class="extra">Beneficio: ${modChip(s2.from)} queda libre.</div><div class="act">Act: ${h(s2.actTxt)}</div></article>`).join("")}</div>` : vacio("Nada coincide con la búsqueda.", "🔎");
  };
  $("#oq", el).oninput = pintar; pintar();
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
    `<div class="form-row"><label class="field" style="max-width:380px"><span>Producto (SKU o nombre)</span><input type="search" id="as" value="${h(p.sku || "")}"></label>
      <label class="field" style="max-width:220px"><span>Vencimiento del ingreso</span><input type="date" id="af" value="${h(p.f || "")}"></label><button class="btn primary" id="ab">Calcular</button></div><div id="ar"></div>`;
  let sku = p.sku || "";
  autoSku($("#as", el), c => { sku = c.sku; });
  $("#ab", el).onclick = async () => {
    const v = $("#as", el).value.trim(), m = v.match(/^(\d+)/); if (m) sku = m[1];
    const f = $("#af", el).value;
    if (!sku || !f) { toast("Escribe el SKU y la fecha.", "bad"); return; }
    $("#ar", el).innerHTML = loader("Calculando…");
    try {
      const r = await api("webAcomodar", sku, f);
      $("#ar", el).innerHTML = `<div class="card" style="margin-bottom:12px">${skuTxt(r.sku, r.prodName)} · ingreso vence <b>${h(r.fIngTxt)}</b></div>` +
        (r.opciones.length ? `<div class="note">🔹 FEFO correcto (lo que hay vence igual o después) · 🔸 Taparía mercancía más vieja</div><div class="grid">${r.opciones.map(o => `<article class="card" style="border-left:5px solid ${o.fefoOk ? "var(--cyan)" : "var(--warn)"}">
          <div class="row sb"><span style="font-weight:800;font-size:17px">${o.fefoOk ? "🔹" : "🔸"} ${h(o.modulo)}</span><span class="pill ${o.fefoOk ? "info" : "warn"}">${o.fefoOk ? "FEFO correcto" : "Tapa mercancía vieja"}</span></div>
          <div>Caben <b>${fm(o.libres)}</b> estibas de ${fm(o.capTot)}</div><div class="small">Lote existente vence <b>${h(o.vf)}</b> (${o.dias === 9999 ? "sin fecha" : o.dias + " d"})</div><div class="act">Act: ${h(o.actTxt)}</div></article>`).join("")}</div>`
        : `<div class="err">Sin espacio en las ubicaciones actuales del producto.</div><h2>💡 Módulos vacíos sugeridos</h2>${r.vacios.length ? `<div class="vac-grid">${r.vacios.map(m => `<span>${h(m.m)}<br><small class="muted">caben ${fm(m.cap)}</small></span>`).join("")}</div>` : vacio("No hay módulos vacíos.", "❌")}`);
    } catch (e) { $("#ar", el).innerHTML = errBox(e); }
  };
};
VISTAS.envasado = async el => {
  el.innerHTML = cab("🧮 Fecha de envasado", "Resta los meses de vida útil a la fecha de vencimiento") +
    `<div class="form-row"><label class="field" style="max-width:220px"><span>Fecha de vencimiento</span><input type="date" id="ef"></label>
      <label class="field" style="max-width:140px"><span>Meses</span><input type="number" min="0" id="em" value="6"></label><button class="btn primary" id="eb">Calcular</button></div><div id="er"></div>`;
  $("#eb", el).onclick = async () => {
    const f = $("#ef", el).value, m = $("#em", el).value;
    if (!f) { toast("Escoge la fecha de vencimiento.", "bad"); return; }
    try { const r = await api("webEnvasado", fechaDMY(f), m); $("#er", el).innerHTML = `<div class="card"><div class="muted">Fecha de envasado</div><div class="big-result">${h(r)}</div><div class="small muted">${fechaDMY(f)} menos ${h(m)} meses</div></div>`; }
    catch (e) { $("#er", el).innerHTML = errBox(e); }
  };
};

// =====================================================================
// REPORTES
// =====================================================================
VISTAS.reportes = async el => {
  const pdfs = [
    ["INFORME", "📊 Informe de prioridad de consumo", "Todos los productos, del que vence primero al último, con su color y hacia dónde moverlo según el vencimiento"],
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
    `<div style="display:flex;flex-direction:column;gap:10px">${pdfs.map(p => `<div class="card pdf-row"><div class="t"><b>${p[1]}</b><div class="sub">${p[2]}</div></div><div class="row">${botonesPDF(p[0], "Descargar")}</div></div>`).join("")}</div>
    <p class="muted small" style="margin-top:14px">Los PDF de turnos y conciliaciones anteriores están en <button class="link" id="goH">Historial</button>.</p>`;
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
// Tres formas de cerrar: solo cerrar · cerrar y descargar el PDF · cerrar y enviarlo al grupo
const botonesCierre = (id, dis) => `<div class="modal-actions cierre-acc"><button class="btn" data-x>Cancelar</button>
  <button class="btn" data-modo="solo" id="${id}S" ${dis}>Solo cerrar</button>
  <button class="btn primary" data-modo="pdf" id="${id}P" ${dis}>📄 Cerrar y descargar PDF</button>
  ${S.grupoTg ? `<button class="btn primary" data-modo="tg" id="${id}T" ${dis}>✈️ Cerrar y enviar al grupo</button>` : ""}</div>`;

function pintarBarra(cont, te, compacto) {
  if (!cont) return;
  S.turno = te;
  const esc = puede("validador");
  let html;
  if (!te || !te.turno) {
    html = `<section class="card turno cerrado"><div class="turno-info"><div class="turno-num" style="color:var(--bad)">—</div>
      <div><div class="k">Turno</div><div class="v">No hay turno abierto</div></div>
      ${te && te.ultimo ? `<div class="solo-escritorio"><div class="k">Último</div><div class="v">${h(te.ultimo.texto)} · cerrado por ${h(te.ultimo.cerradoPor)}</div></div>` : ""}</div>
      <div class="acciones">${esc ? `<button class="btn primary" data-t="abrir">Abrir turno</button>` : `<span class="muted small">Un validador debe abrir el turno.</span>`}</div></section>`;
  } else {
    const t = te.turno;
    html = `<section class="card turno"><div class="turno-info"><div class="turno-num">T${h(t.numero)}</div>
      <div><div class="k">Turno</div><div class="v">${h(t.texto)} <span class="muted small solo-escritorio">(${h(t.horario)})</span></div></div>
      <div><div class="k">Abierto por</div><div class="v">${h(t.abiertoPor)} · ${h(soloHora(t.inicio))}</div></div>
      ${t.recibeDe ? `<div class="solo-escritorio"><div class="k">Recibe de</div><div class="v">${h(t.recibeDe.replace(/^Recibe de /, ""))}</div></div>` : ""}</div>
      <div class="acciones barra-acc">${compacto ? `<button class="btn sm" data-t="val"><span class="ic">📝</span><span class="txt">Validaciones</span></button><button class="btn sm" data-t="ent"><span class="ic">📋</span><span class="txt">Entrega</span></button>` : ""}${esc && puedoEliminar(t.abiertoPor) ? `<button class="btn sm del" data-t="cancelar" title="Cancelar turno (deshacer)"><span class="ic">✖</span><span class="txt">Cancelar</span></button>` : ""}${esc ? `<button class="btn warn sm" data-t="cerrar"><span class="ic">🔒</span><span class="txt">Cerrar turno</span></button>` : ""}</div></section>`;
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
  if (!(await confirmar("Cancelar turno", `¿Cancelar el <b>${h(t.texto || "turno abierto")}</b>?<br><br>Se deshace su <b>validación</b> y su <b>entrega de turno</b> y queda como si no se hubiera abierto (puedes abrir otro). Las conciliaciones no se tocan. Un administrador lo puede restaurar desde el historial.`, "Cancelar turno", true))) return;
  try { await api("webTurnoEliminar", t.id); S.turno = null; S.val = null; S.ent = null; ls.del("turno"); ls.del("val"); ls.del("ent"); toast("Turno cancelado", "ok"); repintar(); }
  catch (er) { toast(er.message, "bad", 7000); }
}

function modalAbrirTurno(te) {
  let num = turnoPorHora();
  const hor = (te && te.horarios) || { 1: "10 p.m. – 6 a.m.", 2: "6 a.m. – 2 p.m.", 3: "2 p.m. – 10 p.m." };
  const c = abrirModal(`<h3>Abrir turno</h3><p class="muted small">Escoge tu turno. No se puede abrir otro hasta cerrar este.</p>
    <div class="num-pick" id="np">${[1, 2, 3].map(n => `<button type="button" data-n="${n}" class="${n === num ? "on" : ""}"><b>${n}</b><span>${h(String(hor[n] || "").replace(/:00/g, ""))}</span></button>`).join("")}</div>
    ${te && te.ultimo ? `<label class="check"><input type="checkbox" id="atH" checked><span>Recibo de <b>${h(te.ultimo.texto)}</b> de <b>@${h(te.ultimo.cerradoPor)}</b>: heredar el saldo de la validación (se puede editar después).</span></label>` : `<p class="muted small">No hay turno anterior del que recibir.</p>`}
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="atOk">Abrir turno</button></div>`);
  $("#np", c).onclick = e => { const b = e.target.closest("[data-n]"); if (!b) return; num = +b.dataset.n; $$("#np button", c).forEach(x => x.classList.toggle("on", x === b)); };
  $("#atOk", c).onclick = async () => {
    const btn = $("#atOk", c); ocupado(btn, true, "Abriendo…");
    try {
      const r = await api("webTurnoAbrir", num, $("#atH", c) ? $("#atH", c).checked : false);
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
  c.innerHTML = `<h3>Cerrar ${h(v.turno.texto)}</h3>
    <p class="muted small">Se guarda la validación y la entrega en el historial. Escoge si solo cerrar, descargar los dos PDF o enviarlos al grupo. Si se te olvida algo, después lo puedes editar desde el historial.</p>
    ${pend ? `<div class="err">Hay ${pend} cambio(s) que aún no suben. Espera a que suban antes de cerrar.</div>` : ""}
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
    $$("[data-modo]", c).forEach(x => { x.disabled = true; }); ocupado(btn, true, "Cerrando turno…");
    try {
      const r = await api("webTurnoCerrar", { nota: $("#ctN", c).value.trim(), pdf: modo === "pdf", telegram: modo === "tg" });
      ocupado(btn, false); cerrarModal(true);
      S.turno = r.turno; ls.setJ("turno", r.turno); S.val = null; S.ent = null; ls.del("val"); ls.del("ent");
      toast(`Turno ${r.resultado.numero} cerrado.`, "ok", 6000);
      if (modo === "tg") toast(r.telegram ? "PDF enviados al grupo de Telegram" : "El turno se cerró, pero no se pudieron enviar los PDF al grupo. Envíalos desde el historial.", r.telegram ? "ok" : "bad", 7000);
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
  const totIni = v.productos.reduce((a, p) => a + p.inicial, 0), totVal = v.productos.reduce((a, p) => a + p.validado, 0);
  const regs = v.registros;
  const nAct = regs.filter(r => r.estado === "ACTIVO").length, nAn = regs.filter(r => r.estado === "ANULADO").length, nConf = regs.filter(r => r.estado === "CONFLICTO").length;
  const regsDe = sku => regs.filter(r => r.sku === sku);
  numerarRegs(v);
  // Cada producto tiene su color (el mismo en su tarjeta y en su registro)
  const orden = v.productos.map(x => x.sku).concat(regs.map(r => r.sku)).filter((x, k, a) => a.indexOf(x) === k);
  const colorDe = sku => colorProducto(orden.indexOf(sku));
  const skusReg = orden.filter(sku => regs.some(r => r.sku === sku));
  html += `<div class="barra-acc">${esc ? `<button class="btn btn-neon" data-a="agregar"><span><span class="ic">＋</span><span class="txt"> Agregar productos</span></span></button>` : ""}${hist ? "" : botonesPDF("VALIDACION", "PDF", t.id)}</div><div class="count" style="margin:-2px 0 10px">Validado ${fm(totVal)} de ${fm(totIni)} cajas</div>
    ${nConf ? `<div class="err">⚠️ Hay ${nConf} validación(es) en conflicto: se hicieron sin conexión y al subir ya no alcanzaba el saldo. Corrígelas o anúlalas.</div>` : ""}
    ${v.productos.length ? `<div class="lista-tools"><input type="search" id="vq" placeholder="Buscar el producto a actualizar (nombre o SKU)…" value="${h(S.valQ || "")}"><span class="count" id="vqc"></span></div>
      <div class="vlista">${v.productos.map(p => cardVal(p, esc, hist, regsDe(p.sku), colorDe(p.sku))).join("")}</div>` : vacio("No hay productos en este turno. Usa «Agregar productos».", "📝")}
    <h2>Registro <span class="muted small">(${nAct} activas${nAn ? `, ${nAn} anuladas` : ""}${nConf ? `, ${nConf} en conflicto` : ""})</span></h2>
    ${regs.length ? `<div class="lista-tools"><button class="btn sm" data-a="rabrir">Abrir todas</button><button class="btn sm" data-a="rcerrar">Cerrar todas</button></div>
      <div class="rlista">${skusReg.map(sku => tarjetaReg(sku, regs.filter(r => r.sku === sku), v.productos.find(x => x.sku === sku), colorDe(sku), esc, hist)).join("")}</div>` : `<div class="card muted">Sin validaciones.</div>`}
    ${esc && !hist ? `<details class="card"><summary>Destinos (${v.destinos.length})</summary>
      <div class="row" style="margin:10px 0">${v.destinos.map(d => `<span class="chip-x">${h(d)}<button data-a="qdest" data-d="${h(d)}" title="Quitar">✕</button></span>`).join("")}</div>
      <div class="form-row" style="margin:0"><label class="field" style="max-width:260px"><span>Nuevo destino</span><input type="text" id="nd" placeholder="Ej: Mayoristas"></label><button class="btn" data-a="adest">Agregar</button></div></details>` : ""}`;
  el.innerHTML = html;
  if (hist) $("#tb", el).innerHTML = bannerHist(Object.assign({}, t, { texto: t.texto }), "VALIDACION");
  else pintarBarra($("#tb", el), v.turnoInfo);
  el.onclick = e => { if (hist && onBanner(e, t, "VALIDACION")) return; onValClick(e); };
  const vq = $("#vq", el);
  if (vq) { vq.oninput = () => { S.valQ = vq.value; filtrarVal(el); }; filtrarVal(el); }
}
// El buscador solo esconde tarjetas (no repinta: el teclado no se cierra mientras se escribe)
function filtrarVal(el) {
  const q = norm(S.valQ || "").split(/\s+/).filter(x => x);
  let n = 0;
  $$(".vlista .vcard", el).forEach(c => { const ok = !q.length || coincide(norm(c.dataset.q), q) > 0; c.classList.toggle("hidden", !ok); if (ok) n++; });
  const c = $("#vqc", el); if (c) c.textContent = q.length ? `${n} de ${$$(".vlista .vcard", el).length}` : "";
}

// Cada producto: cerrado muestra solo SKU y nombre; al tocarlo se despliega todo
// Colores claros por producto (se repiten si hay más de 10)
const TONOS = [0, 28, 52, 95, 150, 180, 205, 240, 280, 320];
const colorProducto = k => { const t = TONOS[((k % TONOS.length) + TONOS.length) % TONOS.length]; return `--pc:hsl(${t} 85% 66%);--pcs:hsla(${t},85%,60%,.13)`; };
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
// Registro: una tarjeta desplegable por producto, con cada validación numerada y su saldo
function tarjetaReg(sku, rs, p, color, esc, hist) {
  rs = rs.slice().sort((a, b) => a.seq - b.seq);
  const act = rs.filter(r => r.estado !== "ANULADO" && r.estado !== "CONFLICTO");
  const ab = abierto("reg", sku), ult = act[act.length - 1];
  return `<article class="card rcard plegable ${ab ? "abierto" : ""}" style="${color}">
    <div class="pl-cab" data-plegar="reg|${h(sku)}" role="button" tabindex="0" aria-expanded="${ab}">
      <div class="rc-tit"><span class="rc-n" title="Validaciones">${act.length}</span><div><div class="prod">${skuTxt(sku, rs[0].producto)}</div>
        <div class="sub">${act.length} ${act.length === 1 ? "validación" : "validaciones"}${ult && ult.saldo !== null ? ` · saldo <b>${fm(ult.saldo)}</b>` : ""}${p ? ` de ${fm(p.inicial)}` : ""}</div></div></div>
      <span class="pl-flecha" aria-hidden="true">▾</span></div>
    <div class="pl-cuerpo">${rs.map(r => {
      const cls = r.estado === "ANULADO" ? "anulado" : r.estado === "CONFLICTO" ? "conflicto" : (r.estado === "PENDIENTE" || r.estado === "ENVIANDO") ? "pendiente" : "";
      return `<div class="rreg ${cls}" title="${h(r.modificadoPor || "")}"><span class="rr-num">${r.seq}</span>
        <div class="rr-main"><div class="rr-l"><span class="chip">${h(r.destino)} <b>${fm(r.cantidad)}</b></span>${r.saldo !== null && r.saldo !== undefined ? `<span class="rr-saldo">Saldo <b>${fm(r.saldo)}</b></span>` : ""}
          ${r.estado === "ANULADO" ? `<span class="pill">ANULADA</span>` : ""}${r.estado === "CONFLICTO" ? `<span class="pill bad">CONFLICTO</span>` : ""}${r.estado === "PENDIENTE" ? `<span class="pill warn">⏳ sin subir</span>` : ""}${r.estado === "ENVIANDO" ? `<span class="pill info">guardando…</span>` : ""}</div>
          <div class="sub">✔ ${h(hist ? fechaCorta(r.fecha) : soloHora(r.fecha))} · 🕐 contado ${r.contadoEn ? h(fechaCorta(r.contadoEn)) : "—"} · ${h(r.usuario)}${r.nota ? ` · 📝 ${h(r.nota)}` : ""}</div></div>
        ${esc && r.id && r.estado !== "ANULADO" ? `<div class="rr-acc"><button class="btn sm" data-a="editar" data-id="${h(r.id)}">${r.estado === "CONFLICTO" ? "Corregir" : "Editar"}</button><button class="btn sm danger-ghost" data-a="anular" data-id="${h(r.id)}">Anular</button></div>` : ""}</div>`;
    }).join("")}</div></article>`;
}

function cardVal(p, esc, hist, regs, color) {
  const dest = Object.keys(p.porDestino);
  const activos = (regs || []).filter(r => r.estado === "ACTIVO" || r.estado === "PENDIENTE" || r.estado === "ENVIANDO");
  const ultima = activos.map(r => r.fecha).filter(x => x).sort().pop();
  const ab = abierto("val", p.sku);
  return `<article class="card vcard plegable ${estadoVal(p)} ${ab ? "abierto" : ""}" data-q="${h(p.sku + " " + p.producto)}" style="${color || ""}">
    <div class="pl-cab" data-plegar="val|${h(p.sku)}" role="button" tabindex="0" aria-expanded="${ab}"><div class="rc-tit"><span class="rc-n" title="Validaciones">${activos.length}</span><div class="prod">${skuTxt(p.sku, p.producto)}</div></div><span class="pl-flecha" aria-hidden="true">▾</span></div>
    <div class="pl-cuerpo">
      <div class="vc-top"><div class="vc-disp"><span class="n">${fm(p.disponible)}</span><span class="l">disponibles de ${fm(p.inicial)}</span></div></div>
      <div class="bar"><i style="width:${pctVal(p)}%"></i></div>
      <div class="vc-horas">
        <div>🕐 Hora de conteo: <b>${p.contadoEn ? h(fechaCorta(p.contadoEn)) : "Heredado"}</b></div>
        <div>✔ Última validación: <b>${ultima ? h(fechaCorta(ultima)) : "—"}</b></div></div>
      ${dest.length ? `<div class="dest">${dest.map(d => `<span class="chip">${h(d)} <b>${fm(p.porDestino[d])}</b></span>`).join("")}</div>` : `<div class="muted small">Sin validaciones todavía.</div>`}
      <div class="vc-meta">Inicial <b>${fm(p.inicial)}</b>${esc ? ` <button class="link" data-a="inicial" data-sku="${h(p.sku)}">✎</button>` : ""} · Validado <b>${fm(p.validado)}</b>${!hist ? ` · WMS ${fm(p.wmsCajas)}` : ""}${p.conflictos ? ` · <span style="color:var(--bad)">${p.conflictos} en conflicto</span>` : ""}</div>
      ${p.alertaWms ? `<div class="vc-alerta">⚠️ El WMS tiene menos cajas (${fm(p.wmsCajas)}) que las disponibles.</div>` : ""}
      ${esc ? `<div class="vc-acc"><button class="btn primary sm grow" data-a="validar" data-sku="${h(p.sku)}" ${p.disponible <= 0 ? "disabled" : ""}>${p.disponible <= 0 ? "Sin saldo" : "Validar"}</button><button class="btn sm icon del" data-a="quitar" data-sku="${h(p.sku)}" title="Quitar del turno" aria-label="Quitar del turno">${ICO_DEL}</button></div>` : ""}
    </div>
  </article>`;
}

async function onValClick(e) {
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a, v = valConPendientes(), T = S.valTurno || "";
  const prod = sku => v.productos.find(x => x.sku === sku);
  if (a === "agregar") return modalAgregar();
  if (a === "rabrir" || a === "rcerrar") { S.abiertos.reg = {}; v.registros.forEach(r => { S.abiertos.reg[r.sku] = a === "rabrir"; }); $$(".rcard").forEach(c => c.classList.toggle("abierto", a === "rabrir")); return; }
  if (a === "validar") return modalValidar(prod(b.dataset.sku));
  if (a === "editar") { const r = v.registros.find(x => x.id === b.dataset.id); return modalValidar(prod(r.sku), r); }
  if (a === "inicial") return modalInicial(prod(b.dataset.sku));
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
  let destino = reg ? reg.destino : "";
  const c = abrirModal(`<h3>${reg ? (reg.estado === "CONFLICTO" ? "Corregir validación en conflicto" : "Editar validación") : (hist ? "Agregar validación olvidada" : "Validar")}</h3>
    <div>${skuTxt(p.sku, p.producto)}</div>
    <div class="muted small">Disponible: <b>${fm(max)}</b> cajas · contado ${p.contadoEn ? h(fechaCorta(p.contadoEn)) : "(heredado)"}</div>
    <div class="field"><span>Destino (canal)</span><div class="dest-pick" id="dp">${S.val.destinos.map(d => `<button type="button" class="chip-btn ${d === destino ? "on" : ""}" data-d="${h(d)}">${h(d)}</button>`).join("")}<button type="button" class="chip-btn" data-d="__otro">＋ Otro</button></div></div>
    <label class="field hidden" id="otroF"><span>Nombre del nuevo destino</span><input type="text" id="otro" placeholder="Ej: Mayoristas"></label>
    <label class="field"><span>Cantidad (cajas)</span><input type="text" inputmode="numeric" pattern="[0-9]*" id="vc" class="grande" value="${reg ? reg.cantidad : ""}" placeholder="0" autofocus></label>
    <div class="small" id="vr" style="margin-top:6px;text-align:center"></div>
    ${hist && !reg ? `<label class="field"><span>Hora en que se validó</span><input type="datetime-local" id="vh" value="${ahoraLocal()}"></label>` : ""}
    <label class="field"><span>Nota (opcional)</span><input type="text" id="vn" value="${h(reg ? reg.nota : "")}" placeholder="Pedido, cliente, factura…"></label>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="vok">${reg ? "Guardar" : "Validar"}</button></div>`);
  const cant = () => parseInt(String($("#vc", c).value).replace(/\D/g, ""), 10) || 0;
  const upd = () => {
    const n = cant(), resto = max - n;
    $("#vr", c).innerHTML = n ? (resto < 0 ? `<span style="color:var(--bad)">⛔ Excede el disponible por ${fm(-resto)} cajas.</span>` : `Quedarán <b>${fm(resto)}</b> cajas disponibles.`) : "";
    $("#vok", c).disabled = !n || resto < 0 || !(destino && destino !== "__otro" || (destino === "__otro" && $("#otro", c).value.trim()));
  };
  $("#dp", c).onclick = e => {
    const bt = e.target.closest("[data-d]"); if (!bt) return;
    destino = bt.dataset.d;
    $$("#dp .chip-btn", c).forEach(x => x.classList.toggle("on", x === bt));
    $("#otroF", c).classList.toggle("hidden", destino !== "__otro");
    if (destino === "__otro") $("#otro", c).focus(); else $("#vc", c).focus();
    upd();
  };
  $("#vc", c).oninput = upd; $("#otro", c).oninput = upd;
  $("#vc", c).onkeydown = e => { if (e.key === "Enter" && !$("#vok", c).disabled) $("#vok", c).click(); };
  upd();
  $("#vok", c).onclick = async () => {
    const d = destino === "__otro" ? $("#otro", c).value.trim() : destino;
    const obj = { sku: p.sku, destino: d, cantidad: cant(), nota: $("#vn", c).value.trim(), turnoId: S.val.turno.id, hora: hist && $("#vh", c) ? $("#vh", c).value : ahoraTxt() };
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

function modalInicial(p) {
  const c = abrirModal(`<h3>Cantidad inicial</h3><div>${skuTxt(p.sku, p.producto)}</div>
    <p class="muted small">Ya validado: <b>${fm(p.validado)}</b>${p.wmsCajas !== undefined ? ` · WMS hoy: <b>${fm(p.wmsCajas)}</b> cajas` : ""}.</p>
    <label class="field"><span>Cantidad inicial (cajas)</span><input type="text" inputmode="numeric" id="ic" class="grande" value="${p.inicial}" autofocus></label>
    <label class="field"><span>Hora en que se contó</span><input type="datetime-local" id="ih" value="${ahoraLocal()}"></label>
    <div class="small" id="ir" style="margin-top:6px;text-align:center"></div>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="iok">Guardar</button></div>`);
  const upd = () => { const n = parseInt($("#ic", c).value.replace(/\D/g, ""), 10) || 0; $("#ir", c).innerHTML = n < p.validado ? `<span style="color:var(--bad)">⚠️ Queda por debajo de lo ya validado: el disponible será ${fm(n - p.validado)}.</span>` : `Disponible quedará en <b>${fm(n - p.validado)}</b>.`; };
  $("#ic", c).oninput = upd; upd();
  $("#iok", c).onclick = async () => {
    const btn = $("#iok", c); ocupado(btn, true);
    try { await guardarVal(api("webValInicial", p.sku, $("#ic", c).value.replace(/\D/g, ""), $("#ih", c).value, S.valTurno || ""), "Cantidad inicial actualizada"); ocupado(btn, false); cerrarModal(true); }
    catch (e) { ocupado(btn, false); }
  };
}

async function modalAgregar() {
  const sel = new Map();
  const c = abrirModal(`<h3>Agregar productos</h3>
    <label class="field" style="max-width:280px"><span>Hora en que se contó</span><input type="datetime-local" id="agH" value="${ahoraLocal()}"></label>
    <div class="tabs"><button class="tab on" data-t="esc">Pocos</button><button class="tab" data-t="bus">Buscar producto</button></div>
    <div id="agB">${loader("Cargando pocos…")}</div>
    <div class="modal-actions"><span class="muted small" id="agC">Ninguno seleccionado</span><button class="btn" data-x>Cancelar</button><button class="btn primary" id="agOk" disabled>Agregar</button></div>`, { wide: true });
  let tab = "esc", sug = null;
  const enTurno = new Set(S.val.productos.map(p => p.sku));
  const wmsCajas = sku => (S.inv || []).filter(i => i.s === sku && i.fis && i.disp).reduce((a, i) => a + (i.c || i.u), 0);
  const fila = it => {
    const ya = enTurno.has(it.sku), s = sel.get(it.sku);
    return `<label class="ag-row ${ya ? "dis" : ""}"><input type="checkbox" data-sku="${h(it.sku)}" data-prod="${h(it.producto)}" ${s ? "checked" : ""} ${ya ? "disabled" : ""}>
      <div>${skuTxt(it.sku, it.producto)}${it.prio ? ' <span class="pill bad">PRIORIDAD</span>' : ""}<div class="sub">WMS: <b>${fm(it.cajas)}</b> cajas${it.estibas !== undefined ? ` · ≈ ${fm(it.estibas)} de mín. ${fm(it.minimo)} estibas` : ""}${ya ? " · <b>ya está</b>" : ""}</div></div>
      <input type="text" inputmode="numeric" class="ag-ini" data-sku="${h(it.sku)}" value="${s ? s.inicial : it.cajas}" ${ya ? "disabled" : ""} aria-label="Cantidad inicial" title="Cantidad inicial (cajas)"></label>`;
  };
  const cuenta = () => { $("#agC", c).textContent = sel.size ? `${sel.size} seleccionado${sel.size > 1 ? "s" : ""}` : "Ninguno seleccionado"; $("#agOk", c).disabled = !sel.size; };
  const pintar = () => {
    const B = $("#agB", c);
    if (tab === "esc") {
      if (!sug) { B.innerHTML = loader("Cargando pocos…"); return; }
      B.innerHTML = `<p class="muted small" style="margin:0">SKUs con menos estibas que su mínimo. La cantidad inicial se propone con las cajas del WMS: ajústala a lo contado.</p><div class="ag-list">${sug.length ? sug.map(fila).join("") : `<p class="muted">No hay productos por debajo de su mínimo.</p>`}</div>`;
    } else {
      B.innerHTML = `<div class="field"><input type="search" id="agQ" placeholder="Nombre o SKU del producto"></div><div class="ag-list" id="agL"><p class="muted small">Escribe para buscar en la hoja Sku.</p></div>`;
      const q = $("#agQ", c);
      q.oninput = () => {
        const res = buscarCat(q.value, 40).map(x => ({ sku: x.sku, producto: x.prod, cajas: wmsCajas(x.sku) }));
        $("#agL", c).innerHTML = q.value.trim() ? (res.length ? res.map(fila).join("") : `<p class="muted">Sin resultados.</p>`) : `<p class="muted small">Escribe para buscar.</p>`;
      };
      if (window.innerWidth > 699) q.focus();
    }
  };
  c.addEventListener("change", e => {
    const cb = e.target.closest("input[type=checkbox][data-sku]"); if (!cb) return;
    const ini = cb.closest(".ag-row").querySelector(".ag-ini");
    if (cb.checked) sel.set(cb.dataset.sku, { sku: cb.dataset.sku, producto: cb.dataset.prod, inicial: ini.value.replace(/\D/g, "") || "0" });
    else sel.delete(cb.dataset.sku);
    cuenta();
  });
  c.addEventListener("input", e => {
    const ini = e.target.closest(".ag-ini"); if (!ini) return;
    const s = sel.get(ini.dataset.sku);
    if (s) s.inicial = ini.value.replace(/\D/g, "") || "0";
    else { const cb = ini.closest(".ag-row").querySelector("input[type=checkbox]"); if (cb && !cb.disabled) { cb.checked = true; cb.dispatchEvent(new Event("change", { bubbles: true })); } }
  });
  c.querySelector(".tabs").onclick = e => { const t = e.target.closest("[data-t]"); if (!t) return; tab = t.dataset.t; $$(".tab", c).forEach(x => x.classList.toggle("on", x === t)); pintar(); };
  $("#agOk", c).onclick = async () => {
    const btn = $("#agOk", c); ocupado(btn, true);
    const hora = $("#agH", c).value;
    try {
      const r = await guardarVal(api("webValAgregar", Array.from(sel.values()).map(x => Object.assign({ contadoEn: hora }, x)), S.valTurno || ""));
      ocupado(btn, false); cerrarModal(true);
      toast(`${r.resultado.agregados} producto(s) agregados`, "ok");
      if (r.resultado.omitidos.length) toast("Omitidos: " + r.resultado.omitidos.join(" · "), "bad", 8000);
    } catch (e) { ocupado(btn, false); }
  };
  try {
    const [s] = await Promise.all([api("webValSugerencias", S.valTurno || ""), cargarCat(), cargarInv()]);
    sug = s.map(x => ({ sku: x.sku, producto: x.producto, cajas: x.cajas, estibas: x.estibas, minimo: x.minimo, prio: x.prio }));
    pintar();
  } catch (e) { $("#agB", c).innerHTML = errBox(e); }
}

// =====================================================================
// ENTREGA DE TURNO
// =====================================================================
const SECC = { BODEGA: { t: "🏭 Bodega", un: "Estibas", mod: true }, TPC: { t: "🏷️ TPC", un: "Cajas", mod: true }, KA: { t: "🏬 KA", un: "Cajas", mod: false }, PK: { t: "🛒 PK (picking / preventa)", un: "Cajas", mod: false } };
const cantChips = (arr, s) => {
  if (!arr || !arr.length) return `<span class="cant cero"><b>0</b></span>`;
  if ((s === "KA" || s === "PK") && arr.length > 1) { const t = {}; arr.forEach(x => { t[x.un] = (t[x.un] || 0) + (Number(x.n) || 0); }); return `<span class="cant tot"><b>${["Estibas", "Cajas", "Unidades"].filter(u => t[u] !== undefined).map(u => `${fm(t[u])} ${u}`).join(" + ")}</b></span><span class="muted small">(${arr.length} conteos sumados)</span>`; }
  let tot = "";
  if (arr.length > 1) { const t = {}; arr.forEach(x => { t[x.un] = (t[x.un] || 0) + (Number(x.n) || 0); }); tot = `<span class="cant tot">Total: <b>${["Estibas", "Cajas", "Unidades"].filter(u => t[u]).map(u => `${fm(t[u])} ${u}`).join(" + ")}</b></span>`; }
  return tot + arr.map(x => `<span class="cant"><b>${fm(x.n)}</b> ${h(x.un)}${x.m ? ` ${modChip(x.m)}` : ""}</span>`).join("");
};
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
  // Cada sección es una tarjeta de su color: cerrada muestra el nombre y cuántos productos tiene
  const sec = s => {
    const it = en.secciones[s], ab = abierto("ent", s);
    return `<section class="card sec-card plegable sec-${s.toLowerCase()} ${ab ? "abierto" : ""}">
      <div class="pl-cab" data-plegar="ent|${s}" role="button" tabindex="0" aria-expanded="${ab}"><h3><span>${SECC[s].t} <span class="sec-n">${it.length}</span></span></h3><span class="pl-flecha" aria-hidden="true">▾</span></div>
      <div class="pl-cuerpo">
      ${esc ? `<div class="sec-acc"><button class="btn btn-neon sm" data-a="add" data-s="${s}"><span>＋ Agregar</span></button>${it.length ? `<button class="btn sm danger-ghost" data-a="vaciar" data-s="${s}">🧹 Quitar todo</button>` : ""}</div>` : ""}
      ${it.length ? `<div class="ent-list">${it.map(x => `<div class="ent-row"><div class="ent-main"><div>${skuTxt(x.sku, x.producto)}${x.pendiente ? ` <span class="pill warn">guardando…</span>` : ""}</div><div class="cants">${cantChips(x.cant, s)}</div><div class="sub">${h(x.origen || "")}${x.usuario ? " · " + h(x.usuario) : ""}${x.actualizado ? " · " + h(fechaCorta(x.actualizado)) : ""}</div></div>
        ${esc ? `<div class="ent-acc"><button class="btn sm icon" data-a="edit" data-s="${s}" data-sku="${h(x.sku)}" aria-label="Editar">✎</button><button class="btn sm icon del" data-a="del" data-s="${s}" data-sku="${h(x.sku)}" aria-label="Quitar">${ICO_DEL}</button></div>` : ""}</div>`).join("")}</div>` : `<p class="muted small">Sin productos.</p>`}
      </div></section>`;
  };
  // Si ya se está agregando a mano, la precarga se bloquea (llenaría todo por error)
  const aMano = ["BODEGA", "TPC", "KA", "PK"].some(s2 => en.secciones[s2].some(x => !/^(WMS|Conciliación)/.test(x.origen || "")));
  html += `<div class="barra-acc">${esc && !hist ? `<button class="btn sm" data-a="precargar" ${aMano ? "disabled" : ""} title="${aMano ? "Desactivado: ya estás agregando a mano. Para precargar, usa «Quitar todo» en cada sección." : "Precargar pocos y TPC"}"><span class="ic">⤓</span><span class="txt">Precargar pocos</span></button>` : ""}${hist ? "" : botonesPDF("ENTREGA", "PDF", en.turno.id)}</div>
    ${esc && !hist && aMano ? `<p class="muted small" style="margin:-4px 0 10px">⤓ Precarga desactivada: ya estás agregando a mano.</p>` : ""}
    <div class="grid2"><div class="col-sec">${sec("BODEGA")}${sec("TPC")}</div><div class="col-sec">${sec("PK")}${sec("KA")}</div></div>
    <section class="card notas-card" style="margin-top:14px"><h3>🗒️ Notas del turno <span class="muted small">(${en.notas.length})</span></h3>
      <ol class="notas-l">${en.notas.map(n => `<li><div class="row sb" style="flex-wrap:nowrap;align-items:flex-start"><span>${h(n.texto)}${n.pendiente ? ` <span class="pill warn">guardando…</span>` : ""}</span>${esc && n.id ? `<span class="row" style="flex-wrap:nowrap"><button class="btn sm icon" data-a="nedit" data-id="${h(n.id)}">✎</button><button class="btn sm icon del" data-a="ndel" data-id="${h(n.id)}">${ICO_DEL}</button></span>` : ""}</div><div class="sub">${h(soloHora(n.hora))} · ${h(n.usuario)}</div></li>`).join("")}</ol>
      ${esc ? `<div class="form-row" style="margin:10px 0 0"><label class="field"><span>Nueva novedad</span><input type="text" id="nNota" placeholder="Ej: llegó producto nuevo de Club Colombia 850"></label><button class="btn primary" data-a="nota">Agregar</button></div>` : ""}</section>`;
  el.innerHTML = html;
  if (hist) $("#tb", el).innerHTML = bannerHist(en.turno, "ENTREGA");
  else pintarBarra($("#tb", el), en.turnoInfo);
  const nn = $("#nNota", el); if (nn) nn.onkeydown = e => { if (e.key === "Enter") agregarNota(); };
  el.onclick = e => { if (hist && onBanner(e, en.turno, "ENTREGA")) return; onEntClick(e); };
}

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
  if (a === "add") return modalEntItem(b.dataset.s, null);
  if (a === "edit") return modalEntItem(b.dataset.s, en.secciones[b.dataset.s].find(x => x.sku === b.dataset.sku));
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
    const c = abrirModal(`<h3>Precargar la entrega</h3>
      <div class="note warn">⚠️ Esto carga <b>todos</b> los productos que el sistema considera con pocas existencias (y todos los TPC). Pueden ser <b>muchísimos</b>. Si prefieres agregar a mano, cancela.</div>
      <p class="muted small">Se agregan los que falten (no se tocan los que ya están). En Bodega, KA y PK: los pocos según la columna Minimo, con lo que dice el WMS o, si existe, la conciliación del turno ${h(en.turno.numero)}. En TPC: lo marcado como tapacódigo. Después corriges y quitas lo que no corresponda.</p>
      ${Object.keys(SECC).map(s => `<label class="check"><input type="checkbox" data-s="${s}" checked><span>${SECC[s].t}</span></label>`).join("")}
      <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="prOk">Precargar</button></div>`);
    $("#prOk", c).onclick = async () => {
      const secs = $$("input[data-s]:checked", c).map(x => x.dataset.s);
      const btn = $("#prOk", c); ocupado(btn, true, "Precargando…");
      try { const r = await api("webEntPrecargar", secs); ocupado(btn, false); cerrarModal(true); S.ent = r.estado; ls.setJ("ent", S.ent); toast(`Agregados: Bodega ${r.resultado.BODEGA} · TPC ${r.resultado.TPC} · KA ${r.resultado.KA} · PK ${r.resultado.PK}`, "ok", 6000); pintarEnt(); }
      catch (er) { ocupado(btn, false); toast(er.message, "bad", 7000); }
    };
  }
}

function modalEntItem(s, item) {
  const cfg = SECC[s];
  let prodSel = item ? { sku: item.sku, prod: item.producto } : null;
  let cant = item ? JSON.parse(JSON.stringify(item.cant || [])) : [];
  if (!cant.length) cant.push({ n: "", un: cfg.un, m: "" });
  const c = abrirModal(`<h3>${item ? "Editar" : "Agregar"} · ${cfg.t}</h3>
    ${item ? `<div>${skuTxt(item.sku, item.producto)}</div>` : campoAuto("eiP")}
    <div class="field"><span>Cantidades ${cfg.mod ? "(cada una con su módulo)" : ""}</span><div id="eiC"></div></div>
    <button class="btn sm" id="eiMas" style="margin-top:8px">＋ Otra cantidad</button>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="eiOk">Guardar</button></div>`, { wide: true });
  const pintarCant = () => {
    $("#eiC", c).innerHTML = cant.map((x, k) => `<div class="cant-ed ${cfg.mod ? "" : "sin-mod"}" data-k="${k}"><span class="cant-n">${k + 1}</span>
      <input type="text" inputmode="decimal" data-f="n" value="${h(x.n)}" placeholder="Cantidad">
      <select data-f="un">${["Estibas", "Cajas", "Unidades"].map(u => `<option ${u === x.un ? "selected" : ""}>${u}</option>`).join("")}</select>
      ${cfg.mod ? `<input type="text" data-f="m" value="${h(x.m)}" placeholder="Módulo">` : ""}
      <button class="btn sm icon" data-q="${k}" title="Quitar">✕</button></div>`).join("");
  };
  pintarCant();
  if (!item) autoSku($("#eiP", c), p => { prodSel = p; });
  $("#eiC", c).addEventListener("input", e => { const r = e.target.closest("[data-k]"); if (!r) return; cant[+r.dataset.k][e.target.dataset.f] = e.target.value; });
  $("#eiC", c).addEventListener("change", e => { const r = e.target.closest("[data-k]"); if (!r) return; cant[+r.dataset.k][e.target.dataset.f] = e.target.value; });
  $("#eiC", c).addEventListener("click", e => { const q = e.target.closest("[data-q]"); if (!q) return; cant.splice(+q.dataset.q, 1); if (!cant.length) cant.push({ n: "", un: cfg.un, m: "" }); pintarCant(); });
  $("#eiMas", c).onclick = () => { cant.push({ n: "", un: cfg.un, m: "" }); pintarCant(); };
  $("#eiOk", c).onclick = () => {
    if (!prodSel) { const v = $("#eiP", c).value.trim(); const m = v.match(/^(\d+)/); const f = m ? (S.cat || []).find(x => x.sku === m[1]) : null; if (f) prodSel = f; }
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
  S.concId = p.concId || null;
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
      <p class="muted small">Al abrirla escoges el turno (normalmente el 3) y se precargan los pocos, lo que escojas de la pre-conciliación (${pend.length} pendientes) y los conteos de la entrega del turno anterior.</p>
      ${esc ? `<button class="btn primary" data-a="abrir">Abrir conciliación</button>` : ""}</div>
      ${k.ultima ? `<div class="card pdf-row"><div class="t"><b>Última conciliación</b><div class="sub">${h(fechaDMY(k.ultima.fecha))} · cerrada por ${h(k.ultima.cerradoPor)}</div></div>${botonesPDF("CONCILIACION", "PDF", k.ultima.id)}</div>` : ""}`;
    el.innerHTML = html; el.onclick = onConcClick; return;
  }
  html += hist ? bannerHist(k.conc, "CONCILIACION") : `<section class="card turno"><div class="turno-info"><div class="turno-num">T${h(k.conc.numero)}</div>
      <div><div class="k">Conciliación</div><div class="v">${h(fechaDMY(k.conc.fecha))}</div></div>
      <div><div class="k">Abierta por</div><div class="v">${h(k.conc.abiertoPor)} · ${h(soloHora(k.conc.inicio))}</div></div>
      <div><div class="k">Resultado</div><div class="v">${k.faltantes ? `<span class="pill bad">✗ ${k.faltantes} con facturación de más</span>` : `<span class="pill ok">✓ Sin faltantes</span>`}</div></div></div>
      <div class="acciones barra-acc">${botonesPDF("CONCILIACION", "PDF", k.conc.id)}${esc && puedoEliminar(k.conc.abiertoPor) ? `<button class="btn sm del" data-a="ccancelar" title="Cancelar conciliación (deshacer)"><span class="ic">✖</span><span class="txt">Cancelar</span></button>` : ""}${esc ? `<button class="btn warn sm" data-a="cerrar" title="Cerrar conciliación"><span class="ic">🔒</span><span class="txt">Cerrar</span></button>` : ""}</div></section>`;
  const cuenta = n => k.items.filter(x => x.nivel === n).length;
  html += `${esc ? `<div class="barra-acc"><button class="btn btn-neon" data-a="agregarc"><span><span class="ic">＋</span><span class="txt"> Agregar producto</span></span></button>${pend.length && !hist ? `<button class="btn sm" data-a="pasarpre" title="Pasar de pre-conciliación"><span class="ic">📌</span><span class="txt">Pre-conciliación (${pend.length})</span></button>` : ""}</div>` : ""}
    ${k.items.length ? `<div class="lista-tools"><input type="search" id="cq" placeholder="Buscar producto (nombre o SKU)…" value="${h(S.concQ || "")}"><button class="btn sm" data-a="cabrir">Abrir todas</button><button class="btn sm" data-a="ccerrar">Cerrar todas</button><span class="count" id="cqc"></span></div>
      <div class="conc-resumen"><span class="chip c-mal">✗ ${cuenta("mal")}</span><span class="chip c-ok">✓ ${cuenta("ok")}</span><span class="chip c-sobra">+50 % ${cuenta("sobra")}</span><span class="chip">Sin facturación ${k.items.filter(x => !x.nivel).length}</span></div>` : ""}
    <div class="clista" id="cTab">${k.items.map(x => tarjetaConc(x, esc)).join("") || `<div class="card muted">Sin productos. Agrégalos con el botón de arriba.</div>`}</div>`;
  el.innerHTML = html;
  el.onclick = e => { if (hist && onBanner(e, k.conc, "CONCILIACION")) return; onConcClick(e); };
  const tab = $("#cTab", el);
  if (tab) tab.addEventListener("change", onConcCampo);
  const cq = $("#cq", el);
  if (cq) { cq.oninput = () => { S.concQ = cq.value; filtrarConc(el); }; filtrarConc(el); }
}
function filtrarConc(el) {
  const q = norm(S.concQ || "").split(/\s+/).filter(x => x);
  let n = 0;
  $$(".clista .conc-card", el).forEach(c => { const ok = !q.length || coincide(norm(c.dataset.q), q) > 0; c.classList.toggle("hidden", !ok); if (ok) n++; });
  const c = $("#cqc", el); if (c) c.textContent = q.length ? `${n} de ${$$(".clista .conc-card", el).length}` : `${$$(".clista .conc-card", el).length} productos`;
}
const nivelConc = (tot, fact) => fact === null || fact === "" ? "" : (tot < fact ? "mal" : (fact > 0 && tot > fact * 1.5 ? "sobra" : "ok"));
const chkConc = (nivel, tot, fact) => nivel === "mal" ? `<span class="chk-no">✗ faltan ${fm(fact - tot)}</span>` : nivel === "sobra" ? `<span class="chk-sobra">✓ +${Math.round((tot / fact - 1) * 100)} %</span>` : nivel === "ok" ? `<span class="chk-ok">✓</span>` : "";
// Cada producto es una tarjeta: cerrada muestra SKU, nombre, total y facturación con su color
function tarjetaConc(x, esc) {
  const inp = (f, v, l) => `<label class="cc-campo cc-${f}"><span>${l}</span>${esc ? `<input type="text" inputmode="numeric" data-f="${f}" data-sku="${h(x.sku)}" value="${h(vNum(v))}" placeholder="—">` : `<b>${v === "" ? "—" : fm(v)}</b>`}</label>`;
  const ab = abierto("conc", x.sku);
  return `<article class="card conc-card plegable ${x.nivel || "sin"} ${ab ? "abierto" : ""}" data-row="${h(x.sku)}" data-q="${h(x.sku + " " + x.producto)}">
    <div class="pl-cab" data-plegar="conc|${h(x.sku)}" role="button" tabindex="0" aria-expanded="${ab}">
      <div class="cc-tit"><div class="prod">${skuTxt(x.sku, x.producto)}</div><div class="cc-res">Total <b data-tot>${fm(x.total)}</b> · Fact <b data-fact>${x.fact === "" ? "—" : fm(x.fact)}</b> <span data-chk>${chkConc(x.nivel, x.total, x.fact)}</span>${x.bloqueo ? ` <span class="pill">🔒 bloqueo</span>` : ""}<span data-tnota>${x.nota ? ` <span class="pill cc-tn" title="${h(x.nota)}">📝</span>` : ""}</span></div></div>
      <span class="pl-flecha" aria-hidden="true">▾</span></div>
    <div class="pl-cuerpo">
      <div class="cc-grid">${inp("bodega", x.bodega, "Bodega")}${inp("ka", x.ka, "KA")}${inp("pk", x.pk, "PK")}${inp("fact", x.fact, "Facturación")}
        <label class="cc-bloq ${x.bloqueo ? "on" : ""}"><input type="checkbox" data-f="bloqueo" data-sku="${h(x.sku)}" ${x.bloqueo ? "checked" : ""} ${esc ? "" : "disabled"}><span>🔒 Bloqueo del excedente</span></label>
        ${esc ? `<button class="btn sm icon del cc-del" data-a="qconc" data-sku="${h(x.sku)}" title="Quitar de la conciliación" aria-label="Quitar de la conciliación">${ICO_DEL}</button>` : ""}
        <label class="cc-nota"><span>📝 Nota</span>${esc ? `<input type="text" data-f="nota" data-sku="${h(x.sku)}" value="${h(x.nota || "")}" maxlength="300" placeholder="Opcional: algo que deba saber quien revise">` : `<b>${h(x.nota || "—")}</b>`}</label></div>
    </div></article>`;
}
function onConcCampo(e) {
  const i = e.target.closest("[data-f]"); if (!i) return;
  const sku = i.dataset.sku, f = i.dataset.f;
  const tr = i.closest(".conc-card");
  if (f === "nota") {
    const nota = i.value.trim(); i.value = nota;
    tr.querySelector("[data-tnota]").innerHTML = nota ? ` <span class="pill cc-tn" title="${h(nota)}">📝</span>` : "";
    enviarOptimista("webConcGuardar", [sku, { nota: nota }, S.concId || ""], `Conciliación ${sku}: nota`, r => { if (r && r.estado) { S.conc = r.estado; if (!S.concId) ls.setJ("conc", S.conc); } });
    return;
  }
  const valor = f === "bloqueo" ? i.checked : i.value.replace(/\D/g, "");
  if (f !== "bloqueo") i.value = valor; else { const l = i.closest(".cc-bloq"); if (l) l.classList.toggle("on", i.checked); }
  // Se recalcula la fila de inmediato; el servidor guarda por detrás
  const val = n => { const x = tr.querySelector(`[data-f="${n}"]`); return x && x.value !== "" ? Number(x.value) : null; };
  const tot = (val("bodega") || 0) + (val("ka") || 0) + (val("pk") || 0), fact = val("fact"), nivel = nivelConc(tot, fact);
  tr.querySelector("[data-tot]").textContent = fm(tot);
  tr.querySelector("[data-fact]").textContent = fact === null ? "—" : fm(fact);
  tr.querySelector("[data-chk]").innerHTML = chkConc(nivel, tot, fact);
  ["mal", "ok", "sobra", "sin"].forEach(c => tr.classList.toggle(c, (nivel || "sin") === c));
  const campos = {}; campos[f] = valor;
  enviarOptimista("webConcGuardar", [sku, campos, S.concId || ""], `Conciliación ${sku}: ${f}`, r => { if (r && r.estado) { S.conc = r.estado; if (!S.concId) ls.setJ("conc", S.conc); } });
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
      <label class="check"><input type="checkbox" id="caP" checked><span>Precargar los <b>pocos</b> (columna Minimo)</span></label>
      <label class="check"><input type="checkbox" id="caE" checked><span>Incluir lo contado en la <b>entrega del turno <span id="caA">${ant(num)}</span></b> (y usar esos conteos)</span></label>
      <h2 style="margin-top:14px">📌 Pre-conciliación (${pend.length})</h2>
      ${pend.length ? pend.map(x => `<label class="check"><input type="checkbox" data-pre="${h(x.id)}" checked><span>${skuTxt(x.sku, x.producto)}<br><span class="sub">Turno ${h(x.turno || "?")} · ${h(x.usuario)}${x.motivo ? " · " + h(x.motivo) : ""}</span></span></label>`).join("") : `<p class="muted small">No hay productos anotados.</p>`}
      <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="caOk">Abrir conciliación</button></div>`, { wide: true });
    $("#caN", c).onclick = e2 => { const bt = e2.target.closest("[data-n]"); if (!bt) return; num = +bt.dataset.n; $$("#caN button", c).forEach(x => x.classList.toggle("on", x === bt)); $("#caA", c).textContent = ant(num); };
    $("#caOk", c).onclick = async () => {
      const btn = $("#caOk", c); ocupado(btn, true, "Abriendo…");
      try {
        const r = await api("webConcAbrir", { numero: num, pocos: $("#caP", c).checked, entrega: $("#caE", c).checked, pre: $$("input[data-pre]:checked", c).map(x => x.dataset.pre) });
        ocupado(btn, false); cerrarModal(true); S.conc = r.estado; ls.setJ("conc", S.conc);
        toast(`Conciliación del turno ${r.resultado.numero} abierta con ${r.resultado.productos} productos${r.resultado.conteoDe ? ` (conteos de ${r.resultado.conteoDe})` : ""}`, "ok", 6000); pintarConc();
      } catch (er) { ocupado(btn, false); toast(er.message, "bad", 7000); }
    };
    return;
  }
  if (a === "ccancelar") {
    if (!(await confirmar("Cancelar conciliación", `¿Cancelar la conciliación del <b>turno ${h(k.conc.numero)}</b>?<br><br>Se deshace completa: sus productos y conteos quedan fuera y lo que vino de la pre-conciliación vuelve a quedar pendiente. Los turnos, validaciones y entregas no se tocan. Un administrador la puede restaurar desde el historial.`, "Cancelar conciliación", true))) return;
    try { await api("webConcEliminar", k.conc.id); S.conc = await api("webConc"); ls.setJ("conc", S.conc); toast("Conciliación cancelada", "ok"); pintarConc(); } catch (er) { toast(er.message, "bad", 7000); }
    return;
  }
  if (a === "cabrir" || a === "ccerrar") {
    S.abiertos.conc = {}; k.items.forEach(x => { S.abiertos.conc[x.sku] = a === "cabrir"; });
    $$(".conc-card").forEach(c => c.classList.toggle("abierto", a === "cabrir"));
    return;
  }
  if (a === "agregarc") {
    const c = abrirModal(`<h3>Agregar a la conciliación</h3>${campoAuto("cAdd", "Nombre o SKU")}<p class="muted small">Escoge el producto de la lista. Si la entrega del turno anterior lo contó, se trae ese conteo.</p><div class="modal-actions"><button class="btn" data-x>Cerrar</button></div>`);
    autoSku($("#cAdd", c), async p => {
      try {
        const r = await api("webConcAgregar", [{ sku: p.sku, producto: p.prod }], S.concId || "");
        S.conc = r.estado; S.abiertos.conc = S.abiertos.conc || {}; S.abiertos.conc[p.sku] = true;
        toast(r.resultado.agregados ? `${p.prod} agregado` : "Ya estaba en la conciliación", r.resultado.agregados ? "ok" : "warn");
        cerrarModal(true); pintarConc();
      } catch (e) { toast(e.message, "bad", 6000); }
    }, { limpiar: true });
    return;
  }
  if (a === "pasarpre") {
    const pend = k.pre.filter(x => x.estado === "PENDIENTE");
    const c = abrirModal(`<h3>Pasar de pre-conciliación</h3>${pend.map(x => `<label class="check"><input type="checkbox" data-pre="${h(x.id)}" checked><span>${skuTxt(x.sku, x.producto)}<br><span class="sub">Turno ${h(x.turno || "?")} · ${h(x.usuario)}${x.motivo ? " · " + h(x.motivo) : ""}</span></span></label>`).join("")}
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
    const c = abrirModal(`<h3>Cerrar conciliación</h3>
      ${pendCola ? `<div class="err">Hay ${pendCola} cambio(s) sin subir. Espera a que suban.</div>` : ""}
      ${k.faltantes ? `<div class="note warn">✗ ${k.faltantes} producto(s) con facturación de más. Revisa que tengan marcado el bloqueo del excedente.</div>` : ""}
      <p class="muted small">Si se te olvida algo, después la puedes editar desde el historial.</p>
      <label class="field"><span>Nota (opcional)</span><textarea id="ccN"></textarea></label>
      ${botonesCierre("cc", pendCola ? "disabled" : "")}`);
    $$("[data-modo]", c).forEach(btn => btn.onclick = async () => {
      const modo = btn.dataset.modo;
      $$("[data-modo]", c).forEach(x => { x.disabled = true; }); ocupado(btn, true, "Cerrando…");
      try {
        const r = await api("webConcCerrar", { nota: $("#ccN", c).value.trim(), pdf: modo === "pdf", telegram: modo === "tg" });
        ocupado(btn, false); cerrarModal(true); S.conc = r.estado; ls.setJ("conc", S.conc); toast("Conciliación cerrada", "ok");
        if (modo === "pdf" && r.pdf) bajarB64(r.pdf.nombre, r.pdf.b64);
        if (modo === "tg") toast(r.telegram ? "PDF enviado al grupo de Telegram" : "Se cerró, pero no se pudo enviar el PDF al grupo. Envíalo desde el historial.", r.telegram ? "ok" : "bad", 7000);
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
  const esc = puede("validador");
  const lote = (x, l) => `<div class="lote v-${h(l.vida)} ${l.sel ? "sel" : ""} ${!l.disp ? "bloq" : ""}"><div>
      ${l.sel ? `🎯 <b style="color:var(--brand)">CONSUMIR AQUÍ</b><br>` : ""}${modChip(l.m)}${l.esOp ? ` <span class="pill info">KA/PREV</span>` : ""}${l.prio ? " 🚨" : ""}
      ${l.lleno === false ? ` <span class="pill warn">Incompleto ${fm(l.usadas)}/${fm(l.capTot)}</span>` : (l.lleno ? ` <span class="pill">Lleno</span>` : "")}
      ${!l.disp ? ` <span class="pill bad">BLOQ · ${h(l.est)}</span>` : ""}<br>${qty(l.e, l.c, l.u)}<br>
      <span class="small">Vence <b>${h(l.vf)}</b> (${l.d === 9999 ? "sin fecha" : l.d + " d"})</span></div>
      ${esc && l.disp && !l.sel && !l.esOp ? `<button class="btn sm" data-el="${h(l.m)}" data-sku="${h(x.sku)}">Elegir</button>` : ""}</div>`;
  // KA y PREV se surten desde bodega (ya están listos para despachar): se ocultan salvo que se pidan
  const verOp = ls.get("consVerOp", "") === "1";
  const visibles = x => x.locs.filter(l => verOp || !l.esOp);
  el.innerHTML = cab("🥤 Consumo / Pony gasto", "Criterio: 1) prioridad · 2) fecha más corta y módulo incompleto · 3) fecha · 4) con la misma fecha, el más incompleto. Toca «Elegir» para cambiar el módulo. KA y PREV no se usan: se surten desde bodega y lo que hay allá ya está listo para despachar.",
      botonesPDF("CONSUMO", "PDF completo") + botonesPDF("CONSUMO_SOLO", "Solo módulos a consumir")) +
    (esc ? `<div class="card" style="margin-bottom:14px"><div style="max-width:520px">${campoAuto("ca", "Agregar a la lista: nombre o SKU")}</div></div>` : "") +
    (lis.length ? `<div class="lista-tools"><button class="btn sm" id="cAll">Abrir todas</button><button class="btn sm" id="cNone">Cerrar todas</button><label class="toggle"><input type="checkbox" id="cOp" ${verOp ? "checked" : ""}> Mostrar KA / PREV</label><span class="count">${lis.length} productos</span></div><div class="grid tarjetas">${lis.map(x => { const sel = x.locs.find(l => l.sel), ab = abierto("cons", x.sku); return `<article class="card plegable cons-card ${ab ? "abierto" : ""}">
      <div class="pl-cab" data-plegar="cons|${h(x.sku)}" role="button" tabindex="0" aria-expanded="${ab}"><div><div class="prod">${skuTxt(x.sku, x.nom)}</div><div class="sub">${sel ? `🎯 Consumir en ${modChip(sel.m)}` : (x.estado === "sin_fisico" ? "❌ Sin existencias" : x.estado === "solo_operativa" ? "Solo en KA / PREV (ya surtido)" : "❌ Sin módulo disponible")}</div></div><span class="pl-flecha" aria-hidden="true">▾</span></div>
      <div class="pl-cuerpo">
      ${esc ? `<div class="row" style="justify-content:flex-end"><button class="btn sm icon del" data-del="${h(x.sku)}" title="Quitar de la lista" aria-label="Quitar de la lista">${ICO_DEL}</button></div>` : ""}
      <div class="sub" style="margin:4px 0 8px">${x.modo === "manual" ? `✋ Elegido a mano por <b>${h(x.elegidoPor)}</b> · ${h(fechaCorta(x.elegidoEn))} ${esc ? `<button class="link" data-auto="${h(x.sku)}">volver a automático</button>` : ""}` : "⚙️ Automático (criterios)"}${x.manualVencido ? ` · <span style="color:var(--warn)">el módulo elegido a mano se vació</span>` : ""}</div>
      ${x.estado === "sin_fisico" ? `<div class="mini">❌ Sin existencias físicas en bodega.</div>` : ""}
      ${x.estado === "solo_bloqueado" ? `<div class="note warn">Todos los módulos están bloqueados.</div>` : ""}
      ${x.estado === "solo_operativa" ? `<div class="note warn">Solo hay en KA / PREV (ya surtido para despacho): no se consume de ahí.</div>` : ""}
      <div class="mini-list">${visibles(x).map(l => lote(x, l)).join("")}</div></div></article>`; }).join("")}</div>` : vacio("La lista de consumo está vacía.", "🛒"));
  const todas = abrir => { S.abiertos.cons = {}; lis.forEach(x => { S.abiertos.cons[x.sku] = abrir; }); $$(".cons-card", el).forEach(c => c.classList.toggle("abierto", abrir)); };
  if ($("#cAll", el)) { $("#cAll", el).onclick = () => todas(true); $("#cNone", el).onclick = () => todas(false); $("#cOp", el).onchange = e => { ls.set("consVerOp", e.target.checked ? "1" : ""); ir("consumo"); }; }
  const ca = $("#ca", el);
  if (ca) autoSku(ca, async c => {
    try { await api("webConsumoAgregar", c.sku); toast(`${c.prod} añadido a la lista`, "ok"); ir("consumo"); } catch (e) { toast(e.message, "bad", 6000); }
  }, { limpiar: true });
  el.onclick = async e => {
    const d = e.target.closest("[data-del]");
    if (d) {
      if (!(await confirmar("Quitar de consumo", `¿Eliminar el SKU <b>${h(d.dataset.del)}</b> de la lista de consumo?`, "Eliminar", true))) return;
      try { await api("webConsumoEliminar", d.dataset.del); toast("SKU eliminado de la lista", "ok"); ir("consumo"); } catch (er) { toast(er.message, "bad"); }
      return;
    }
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
  el.innerHTML = cab("📦 Entrega final", "Une en un solo PDF lo del turno que escojas, en este orden: la entrega de turno (en su hoja), las conciliaciones (si hubo) y la validación. Conciliación y validación van juntas si caben; si son largas, cada una en su hoja.") + loader("Buscando turnos…");
  let base;
  try { base = await api("webFinal", ""); } catch (e) { if (vigente()) el.insertAdjacentHTML("beforeend", errBox(e)); return; }
  if (!vigente()) return;
  if (!base.turnos.length) { el.innerHTML = cab("📦 Entrega final") + vacio("Todavía no hay turnos.", "📭"); return; }
  const def = (base.turnos.find(t => t.estado === "CERRADO") || base.turnos[0]).id;
  S.finalTurno = base.turnos.some(t => t.id === S.finalTurno) ? S.finalTurno : def;
  await pintarFinal(el, base, vigente);
};
async function pintarFinal(el, base, vigente) {
  const cabF = cab("📦 Entrega final", "Une en un solo PDF lo del turno que escojas, en este orden: la entrega de turno (en su hoja), las conciliaciones (si hubo) y la validación. Conciliación y validación van juntas si caben; si son largas, cada una en su hoja.");
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
      <div class="fin-sub">Conciliaciones</div>
      ${sug.length ? sug.map(c => chkConc(c, true)).join("") : `<p class="muted small">No hay conciliación de este mismo turno.</p>`}
      ${otras.length ? `<details class="fin-otras"><summary>Ver otras conciliaciones (${otras.length})</summary>${otras.map(c => chkConc(c, false)).join("")}</details>` : ""}
      <div class="fin-sub">Validación</div>
      <label class="check"><input type="checkbox" id="fnV" ${val.productos || val.registros ? "checked" : ""}><span>📝 <b>Validación de facturación</b><br><span class="sub">${val.productos || 0} productos · ${val.registros || 0} validaciones${val.eliminada ? " · ⚠️ eliminada" : ""}</span></span></label>
    </section>
    <section class="card fin-card"><h3>3 · PDF</h3><p class="muted small" id="fnRes"></p><div class="barra-acc" id="fnB"></div></section>`;
  $("#fnT", el).onchange = e => { S.finalTurno = e.target.value; pintarFinal(el, base, vigente); };
  const actualizar = () => {
    const concs = $$("input[data-fc]:checked", el).map(x => x.dataset.fc);
    const partes = ($("#fnE", el).checked ? "E" : "") + ($("#fnV", el).checked ? "V" : "");
    const orden = [partes.includes("E") && "Entrega de turno", concs.length && (concs.length > 1 ? `${concs.length} conciliaciones` : "Conciliación"), partes.includes("V") && "Validación"].filter(x => x);
    $("#fnRes", el).textContent = orden.length ? "Orden: " + orden.join(" → ") : "Escoge al menos una parte.";
    $("#fnB", el).innerHTML = orden.length ? botonesPDF("FINAL", "Descargar PDF", `${S.finalTurno}|${concs.join(",")}|${partes}`) : "";
  };
  el.onchange = e => { if (e.target.id !== "fnT") actualizar(); };
  actualizar();
}

// =====================================================================
// ADMINISTRACIÓN (solo administrador; el servidor también lo revisa)
// =====================================================================
VISTAS.usuarios = async (el, p, vigente) => {
  const lis = await api("webUsuarios");
  if (!vigente()) return;
  const pintar = lis2 => {
    el.innerHTML = cab("👥 Usuarios y PIN", "Quién entra al dashboard y qué puede hacer", `<button class="btn primary" data-a="nuevo">＋ Nuevo usuario</button>`) +
      `<div class="note ayuda">Roles: <b>lector</b> solo consulta · <b>validador</b> abre y cierra turnos, valida, hace la entrega, la conciliación, consumo y limbo · <b>administrador</b> además maneja usuarios, la hoja Sku y los canales.</div>
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
    <label class="field"><span>Rol</span><select id="uR">${["lector", "validador", "administrador"].map(r => `<option ${u && u.rol === r ? "selected" : (!u && r === "validador" ? "selected" : "")}>${r}</option>`).join("")}</select></label>
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
  ["ctx", "Contexto (palabras para buscar)"], ["minimo", "Mínimo de estibas (pocos)", "decimal"], ["t1", "Días mínimos T1", "numeric"], ["t2", "Días mínimos T2", "numeric"], ["ka", "Días mínimos KA", "numeric"], ["estCara", "Estibas por cara", "numeric"]
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
    $("#skR", el).innerHTML = `<table class="tabla resp"><thead><tr><th>SKU</th><th>Producto</th><th>Presentación</th><th class="num">Cant x estiba</th><th class="num">Mínimo</th><th class="num">T1</th><th class="num">T2</th><th class="num">KA</th><th class="num">Est/cara</th><th></th></tr></thead><tbody>
      ${lis.map(c => `<tr><td data-l="SKU" class="sku">${h(c.sku)}</td><td data-l="Producto">${h(c.prod)}</td><td data-l="Presentación">${h(c.pres)}</td><td data-l="Cant x estiba" class="num">${v(c.cantEst)}</td>
        <td data-l="Mínimo" class="num">${v(c.minimo)}</td><td data-l="T1" class="num">${v(c.t1)}</td><td data-l="T2" class="num">${v(c.t2)}</td><td data-l="KA" class="num">${v(c.ka)}</td><td data-l="Est/cara" class="num">${v(c.estCara)}</td>
        <td class="acc"><button class="btn sm" data-a="editar" data-sku="${h(c.sku)}">Editar</button> <button class="btn sm del" data-a="borrar" data-sku="${h(c.sku)}">${ICO_DEL}</button></td></tr>`).join("")}</tbody></table>`;
  };
  $("#skQ", el).oninput = pintar;
  el.onclick = async e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
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
function modalSku(c, alGuardar) {
  const m = abrirModal(`<h3>${c ? "Editar producto" : "Nuevo producto"}</h3>
    <div class="grid2" style="gap:0 14px">${SKU_CAMPOS_UI.map(([k, t, im]) => `<label class="field"><span>${h(t)}</span><input type="text" ${im ? `inputmode="${im}"` : ""} data-k="${k}" value="${h(c && c[k] !== null && c[k] !== undefined ? c[k] : "")}"></label>`).join("")}</div>
    <div class="modal-actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" id="skOk">Guardar</button></div>`, { wide: true });
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
      <p class="muted small">No se cruzan en huecos, vacíos ni organizar. ${admin ? "Si existen en físico, tócalos para agregarlos." : ""}</p>
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
      `<div class="note ayuda">Orden de prioridad: <b>columna del SKU</b> → la primera regla <b>Familia/Contiene</b> que coincida → la regla <b>General</b> del canal. «Familia» compara con la familia del WMS (RETORNABLE no incluye NO RETORNABLE); «Contiene» busca la palabra en el nombre del producto. Mínimo de estibas para «pocos» sin valor en Sku: <b>${d.defecto}</b>.</div>
      <table class="tabla resp"><thead><tr><th>Canal</th><th>Tipo</th><th>Valor</th><th class="num">Días mínimos</th><th>Nota</th><th></th></tr></thead><tbody>
      ${filas.map((r, k) => admin ? `<tr data-k="${k}"><td data-l="Canal"><select data-f="canal">${["T1", "T2", "KA"].map(c => `<option ${c === r.canal ? "selected" : ""}>${c}</option>`).join("")}</select></td>
        <td data-l="Tipo"><select data-f="tipo">${["General", "Familia", "Contiene"].map(c => `<option ${norm(c) === norm(r.tipo) ? "selected" : ""}>${c}</option>`).join("")}</select></td>
        <td data-l="Valor"><input type="text" data-f="valor" value="${h(r.valor)}" style="text-align:left;max-width:none"></td><td data-l="Días" class="num"><input type="text" inputmode="numeric" data-f="dias" value="${h(r.dias)}"></td>
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

// =====================================================================
// ARRANQUE
// =====================================================================
// Después del cambio definitivo, el dashboard de Apps Script solo muestra los turnos
function avisoTurnosNueva(url) {
  let b = $("#nuevaBar");
  document.body.classList.toggle("turnos-fuera", !!url);
  if (!url) { if (b) b.remove(); document.body.classList.toggle("con-aviso", !!$(".web-aviso")); return; }
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
    avisoTurnosNueva(i.turnosNueva);
    guardarInv(i.inv); S.cat = i.cat; ls.setJ("cat", S.cat); ls.setJ("turno", i.turno);
    ls.setJ("usuario", S.usuario); ls.set("grupoTg", S.grupoTg ? "1" : "");
    if (yaPintado) {
      pintarUsuario(); pintarNav();
      // Repinta con los datos frescos solo si nadie está escribiendo o con una ventana abierta
      if (forzarRepintar || cambioRol || (!modalAbierto() && !usandoPantalla())) repintar();
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
      if (inv) { S.inv = inv.filas; S.ocup = inv.ocupacion || {}; S.sync = inv.sync; pintarSync(); }
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
    S.usuario = u; S.grupoTg = ls.get("grupoTg", "") === "1"; S.cat = ls.getJ("cat", null); S.turno = ls.getJ("turno", null);
    S.inv = inv.filas; S.ocup = inv.ocupacion || {}; S.sync = inv.sync; pintarSync();
    pintarUsuario(); pintarNav();
    ir(ls.get("vista", "inicio"));
    arrancar(true);
    return;
  }
  arrancar();
})();

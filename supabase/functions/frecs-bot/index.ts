// =====================================================================
// FRECS! · Bot de Telegram en Supabase (función frecs-bot)
// ---------------------------------------------------------------------
// Corre la misma lógica del bot de Apps Script (motor.js, armado desde gas/*.gs) sobre
// los datos de Supabase. Lo que el bot "envía" se anota en una cola y aquí se manda en
// orden: mensajes, botones, PDF (dibujados en pdf.ts) y los cambios a Supabase.
// Solo el GET al WMS sigue en Apps Script (acción sincronizar_bot).
//
// Pedidos que atiende (POST):
//   · Telegram (cabecera X-Telegram-Bot-Api-Secret-Token)
//   · { accion: "pdf_telegram", token, nombre, b64, caption }  → desde la página (validador)
//   · { accion: "reporte", token, ids }                        → aviso de módulos reportados (vacío / conflicto)
//   · { accion: "alerta", secreto }                           → alerta de las 6 a.m. y 2 p.m. (pg_cron)
// Secretos de la función: TELEGRAM_TOKEN. El resto viene de frecs_config (sb_bot_config).
// =====================================================================
import { crearMotor } from "./motor.js";
import { htmlAPdf } from "./pdf.ts";

const URL_SB = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const CLAVE = Deno.env.get("SB_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const TOKEN = Deno.env.get("TELEGRAM_TOKEN") || "";
const TG_BASE = Deno.env.get("TELEGRAM_BASE") || "https://api.telegram.org";   // (las pruebas usan otro)
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };

async function rpc(fn: string, args: unknown = {}) {
  const r = await fetch(`${URL_SB}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: CLAVE, Authorization: "Bearer " + CLAVE, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  const t = await r.text();
  let j: any = null; try { j = t ? JSON.parse(t) : null; } catch (_) { /* texto */ }
  if (!r.ok) throw new Error((j && (j.message || j.hint)) || t || `Supabase ${fn} ${r.status}`);
  return j;
}

let cfgCache: { t: number; v: Record<string, string> } | null = null;
async function config() {
  if (cfgCache && Date.now() - cfgCache.t < 60000) return cfgCache.v;
  cfgCache = { t: Date.now(), v: (await rpc("sb_bot_config")) || {} };
  return cfgCache.v;
}
function propsDe(cfg: Record<string, string>) {
  return {
    TELEGRAM_TOKEN: TOKEN, GRUPO_CALIDAD_ID: cfg.bot_grupo || "", CHATS_PERMITIDOS: cfg.bot_chats || "", DASHBOARD_URL: cfg.bot_dashboard || "",
    INSTRUCTIVO_DRIVE_ID: "supabase", SUPABASE_URL: URL_SB, SUPABASE_SECRET: CLAVE, WEBHOOK_SECRET: ""
  };
}
// El motor se crea con la configuración (las constantes de Apps Script se leen al crearlo)
let MOTOR: any = null, motorClave = "";
function motorPara(cfg: Record<string, string>) {
  const props = propsDe(cfg), k = JSON.stringify(props);
  if (!MOTOR || k !== motorClave) { MOTOR = crearMotor(props); motorClave = k; }
  return MOTOR;
}
// Turnos y conciliaciones viejos nombrados en el mensaje (para PDF del historial)
const idsDe = (t: string) => [...new Set((String(t || "").match(/[TC]\d{8}-\d{6}(?:-\d+)?/g) || []))];

// ---------- Telegram ----------
const tgUrl = (metodo: string) => `${TG_BASE}/bot${TOKEN}/${metodo}`;
async function tgJson(metodo: string, p: any) {
  const r = await fetch(tgUrl(metodo), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
  const t = await r.text();
  return { ok: r.ok, t };
}
// Igual que en Apps Script: si Telegram no acepta el formato, se reintenta sin formato y luego sin botones
async function tgMensaje(metodo: string, p: any) {
  let r = await tgJson(metodo, p);
  if (r.ok || /message is not modified/.test(r.t)) return r.ok;
  const q = Object.assign({}, p); delete q.parse_mode;
  r = await tgJson(metodo, q);
  if (r.ok) return true;
  console.warn(metodo, r.t.slice(0, 300));
  if (q.reply_markup && metodo === "sendMessage") { delete q.reply_markup; r = await tgJson(metodo, q); }
  return r.ok;
}
async function tgDocumento(chat: string, bytes: Uint8Array, nombre: string, caption: string) {
  const envio = async (conFormato: boolean) => {
    const f = new FormData();
    f.append("chat_id", String(chat));
    f.append("document", new Blob([bytes], { type: "application/pdf" }), nombre);
    if (caption) f.append("caption", conFormato ? caption : caption.replace(/[*_`]/g, ""));
    if (conFormato) f.append("parse_mode", "Markdown");
    const r = await fetch(tgUrl("sendDocument"), { method: "POST", body: f });
    const t = await r.text();
    if (!r.ok) console.warn("sendDocument", t.slice(0, 300));
    return r.ok;
  };
  return (await envio(true)) || (await envio(false));
}
async function instructivo(): Promise<Uint8Array | null> {
  const r = await fetch(`${URL_SB}/storage/v1/object/frecs/instructivo.pdf`, { headers: { apikey: CLAVE, Authorization: "Bearer " + CLAVE } });
  return r.ok ? new Uint8Array(await r.arrayBuffer()) : null;
}
const fM = (n: number) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Pedido a Apps Script (solo lo que necesita el WMS o las hojas de respaldo)
async function appsScript(cfg: Record<string, string>, cuerpo: any) {
  if (!cfg.bot_apps_script_url) throw new Error("Falta la dirección de Apps Script (corre sbPasarBotASupabase en Apps Script).");
  const r = await fetch(cfg.bot_apps_script_url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ secreto: cfg.bot_secreto }, cuerpo)), redirect: "follow" });
  try { return await r.json(); } catch (_) { return { ok: false, error: "Apps Script no respondió bien." }; }
}

// Envía en orden lo que dejó el motor
async function vaciarCola(cola: any[], cfg: Record<string, string>) {
  const hojas = new Set<string>();
  for (const it of cola) {
    try {
      if (it.tipo === "sync") {
        const r = await appsScript(cfg, { accion: "sincronizar_bot", forzar: it.forzar });
        if (!r.ok) await tgMensaje("sendMessage", { chat_id: it.chatId, text: "❌ " + (r.error || "No se pudo sincronizar.") });
        else if (String(it.chatId) !== String(cfg.bot_grupo || "")) await tgMensaje("sendMessage", { chat_id: it.chatId, text: `✅ *Base actualizada.*\n\n${fM(r.filas)} ubicaciones con producto en ${fM(r.modulos)} módulos.`, parse_mode: "Markdown" });
        continue;
      }
      if (it.tipo === "hojas") { hojas.add(it.tabla); continue; }
      const url: string = it.url || "", o = it.o || {};
      if (url.includes("api.telegram.org/bot")) {
        const metodo = url.split("/").pop() || "";
        if (metodo === "sendDocument" && o.payload && typeof o.payload === "object") {
          const b = o.payload.document || {};
          let bytes: Uint8Array | null = null, nombre = (b.getName && b.getName()) || "Frecs.pdf";
          if (b.__html) bytes = await htmlAPdf(b.__html);
          else if (b.__instructivo) { bytes = await instructivo(); if (!bytes) { await tgMensaje("sendMessage", { chat_id: o.payload.chat_id, text: "⚠ Todavía no se ha subido el instructivo (instructivo.pdf en el depósito «frecs» de Supabase)." }); continue; } }
          else if (b.__bytes) bytes = b.__bytes;
          if (bytes) await tgDocumento(o.payload.chat_id, bytes, nombre, o.payload.caption || "");
          continue;
        }
        const p = typeof o.payload === "string" ? JSON.parse(o.payload) : o.payload;
        if (metodo === "sendMessage" || metodo === "editMessageText") await tgMensaje(metodo, p);
        else await tgJson(metodo, p);
        continue;
      }
      if (url.startsWith(URL_SB)) {   // p. ej. guardar_filas de lo que cambió el bot
        const r = await fetch(url, { method: (o.method || "post").toUpperCase(), headers: Object.assign({ "Content-Type": o.contentType || "application/json" }, o.headers || {}), body: o.payload });
        if (!r.ok) console.warn("Supabase", r.status, (await r.text()).slice(0, 300));
        continue;
      }
      console.warn("Salida no reconocida:", url.slice(0, 80));
    } catch (e) { console.warn("cola:", (e as Error).message); }
  }
  // Copia de respaldo en las hojas (no es necesaria para que el bot funcione)
  if (hojas.size) { try { await appsScript(cfg, { accion: "maestros_bot", tablas: [...hojas] }); } catch (e) { console.warn("hojas:", (e as Error).message); } }
}

// Un paso del motor: cargar datos, correr y tomar lo que quedó por enviar (sin pausas en medio)
async function correr(extra: string[], fn: (m: any) => unknown) {
  const [datos, cache, cfg] = await Promise.all([rpc("sb_datos_bot", { p_extra: extra }), rpc("sb_bot_cache_leer"), config()]);
  const memoria: Record<string, string> = {};
  Object.keys(cache || {}).forEach(k => { if (!k.startsWith("upd_")) memoria[k] = cache[k]; });
  const M = motorPara(cfg);
  M.cargar(datos, propsDe(cfg), memoria);
  let error: unknown = null;
  try { fn(M); } catch (e) { error = e; }
  const cola = M.tomarCola(), cambios = M.cambiosCache();
  if (Object.keys(cambios.poner).length || cambios.quitar.length) await rpc("sb_bot_cache_guardar", { p_poner: cambios.poner, p_quitar: cambios.quitar }).catch(e => console.warn("memoria:", e.message));
  await vaciarCola(cola, cfg);
  if (error) throw error;
}

async function atenderTelegram(upd: any) {
  if (upd.update_id !== undefined && !(await rpc("sb_bot_update_nuevo", { p_update: upd.update_id }))) return;   // Telegram lo reenvió
  const texto = (upd.callback_query && upd.callback_query.data) || (upd.message && upd.message.text) || "";
  await correr(idsDe(texto), m => m.telegram(JSON.stringify(upd)));
}

function respuesta(obj: unknown, estado = 200) {
  return new Response(JSON.stringify(obj), { status: estado, headers: Object.assign({ "Content-Type": "application/json" }, CORS) });
}
const seguir = (p: Promise<unknown>) => {
  const er = (globalThis as any).EdgeRuntime;
  const q = p.catch(e => console.error("frecs-bot:", e));
  if (er && er.waitUntil) er.waitUntil(q); else return q;
};

export async function manejar(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Frecs! bot · " + (TOKEN ? "bot " + TOKEN.split(":")[0] : "sin token"), { headers: CORS });   // (el número del bot no es secreto)
  let cuerpo: any;
  try { cuerpo = await req.json(); } catch (_) { return respuesta({ ok: false, error: "JSON inválido" }, 400); }
  const cfg = await config();

  // Telegram: responde enseguida y trabaja por detrás (Telegram reintenta si se tarda)
  if (cuerpo && cuerpo.update_id !== undefined) {
    if (!cfg.bot_webhook_secreto || req.headers.get("x-telegram-bot-api-secret-token") !== cfg.bot_webhook_secreto) return new Response("no", { status: 401 });
    const p = seguir(atenderTelegram(cuerpo));
    if (p) await p;   // (fuera de Supabase, p. ej. en pruebas, se espera aquí)
    return new Response("ok");
  }

  // PDF armado en la página → grupo de Telegram (validador o administrador)
  if (cuerpo.accion === "pdf_telegram") {
    try {
      let u: any;
      try { u = await rpc("mi_sesion", { p_token: String(cuerpo.token || "") }); }
      catch (e) { const m = String((e as Error).message); return respuesta(/SESION:/.test(m) ? { ok: false, sesion: true, error: m.replace(/^.*SESION:\s*/, "") } : { ok: false, error: m }); }
      if (!u || !["validador", "administrador"].includes(u.rol)) return respuesta({ ok: false, error: "No tienes permiso para enviar al grupo." });
      if (!cfg.bot_grupo) return respuesta({ ok: false, error: "No está configurado el grupo de Telegram." });
      const b64 = String(cuerpo.b64 || "");
      if (!b64 || b64.length > 20 * 1024 * 1024) return respuesta({ ok: false, error: "El PDF está vacío o es demasiado grande." });
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      if (String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") return respuesta({ ok: false, error: "El archivo no es un PDF." });
      const nombre = String(cuerpo.nombre || "Frecs.pdf").replace(/[^\w.\-]+/g, "_").slice(0, 80);
      const cap = String(cuerpo.caption || "📄 PDF").slice(0, 800) + `\n_Enviado desde el dashboard por ${String(u.nombre).replace(/[_*[\]`]/g, "\\$&")}_`;
      const ok = await tgDocumento(cfg.bot_grupo, bytes, /\.pdf$/i.test(nombre) ? nombre : nombre + ".pdf", cap);
      return respuesta(ok ? { ok: true } : { ok: false, error: "Telegram no aceptó el archivo." });
    } catch (e) { return respuesta({ ok: false, error: (e as Error).message }); }
  }

  // Reporte de módulos (vacío / conflicto) → grupo de Telegram. El texto lo arma Supabase (reporte_aviso):
  // solo lo que esa persona acaba de reportar, así que no sirve para mandar mensajes arbitrarios.
  if (cuerpo.accion === "reporte") {
    try {
      if (!cfg.bot_grupo) return respuesta({ ok: false, error: "No está configurado el grupo de Telegram." });
      const ids = (Array.isArray(cuerpo.ids) ? cuerpo.ids : []).map((x: unknown) => Number(x)).filter((x: number) => Number.isInteger(x) && x > 0).slice(0, 60);
      if (!ids.length) return respuesta({ ok: false, error: "Sin reportes." });
      let texto = "";
      try { texto = String((await rpc("reporte_aviso", { p_token: String(cuerpo.token || ""), p_ids: ids })) || ""); }
      catch (e) { const m = String((e as Error).message); return respuesta(/SESION:/.test(m) ? { ok: false, sesion: true, error: m.replace(/^.*SESION:\s*/, "") } : { ok: false, error: m }); }
      if (!texto) return respuesta({ ok: false, error: "No hay reportes nuevos para avisar." });
      const ok = await tgMensaje("sendMessage", { chat_id: cfg.bot_grupo, text: texto });
      return respuesta(ok ? { ok: true } : { ok: false, error: "Telegram no aceptó el mensaje." });
    } catch (e) { return respuesta({ ok: false, error: (e as Error).message }); }
  }

  // Alerta diaria (la llama pg_cron con el secreto compartido)
  if (cuerpo.accion === "alerta") {
    if (!cfg.bot_secreto || cuerpo.secreto !== cfg.bot_secreto) return respuesta({ ok: false, error: "No autorizado" }, 401);
    if (!cfg.bot_grupo) return respuesta({ ok: false, error: "No está configurado el grupo de Telegram." });
    await correr([], m => m.alerta());
    return respuesta({ ok: true });
  }
  return respuesta({ ok: false, error: "Acción no válida." }, 400);
}

if (import.meta.main) Deno.serve(manejar);

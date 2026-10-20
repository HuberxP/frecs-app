// =====================================================================
// FRECS! · Sincronización directa con el WMS (solo GET) desde Supabase
// ---------------------------------------------------------------------
// Lo mismo que hacía Apps Script (03_WMS_Sync.gs), ahora en la función frecs-bot:
//   · la sesión del WMS se usa mientras sirva (como en el celular): solo se vuelve a iniciar
//     sesión cuando el token venció (campo exp) o el WMS lo rechaza (401 / 403);
//   · los módulos se traen por páginas de 500; si los conteos no cuadran, NO se toca la base;
//   · si trae muchas menos ubicaciones que la vez anterior (menos del 70 %) tampoco, salvo «forzar»;
//   · las peticiones llevan los mismos encabezados que manda Chrome desde la página del WMS.
// La conexión (direcciones, usuario y clave) la deja Apps Script una sola vez en el Vault de
// Supabase (pasarWmsASupabase): no está en el código ni en GitHub.
// =====================================================================

type Rpc = (fn: string, args?: unknown) => Promise<any>;
type Cfg = { login_url: string; inventarios_url: string; cd_id: string | number; usuario: string; clave: string; media_url?: string; token?: string };

const PAGINA = 500, MAX_PAGINAS = 20, MIN_PROPORCION = 0.7;
const TZ_SB = "-05:00";

// Encabezados de Chrome (Android) llamando a la API desde la página del WMS
const CHROME = "141";
function encabezados(cfg: Cfg, token: string) {
  const origen = new URL(cfg.login_url).origin;
  const h: Record<string, string> = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-CO,es;q=0.9,es-419;q=0.8,en;q=0.7",
    "User-Agent": `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME}.0.0.0 Mobile Safari/537.36`,
    "sec-ch-ua": `"Google Chrome";v="${CHROME}", "Not?A_Brand";v="8", "Chromium";v="${CHROME}"`,
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": `"Android"`,
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Origin": origen,
    "Referer": origen + "/",
    "X-CD-Id": String(cfg.cd_id)
  };
  if (token) h["Authorization"] = "Bearer " + token;
  return h;
}

// ¿El token ya venció? (JWT: exp en segundos, con 5 minutos de margen). Si no se puede leer, se da por bueno.
function vencido(tk: string) {
  try {
    const p = String(tk).split(".")[1]; if (!p) return false;
    const b64 = p.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((p.length + 3) % 4);
    const exp = Number(JSON.parse(atob(b64)).exp || 0);
    return exp > 0 && Date.now() > exp * 1000 - 5 * 60000;
  } catch (_) { return false; }
}

class Sesion {
  token = ""; peticiones = 0;
  constructor(private cfg: Cfg, private rpc: Rpc) { this.token = cfg.token && !vencido(cfg.token) ? cfg.token : ""; }
  async entrar() {
    const h = encabezados(this.cfg, "");
    h["Content-Type"] = "application/json";
    const r = await fetch(this.cfg.login_url, { method: "POST", headers: h, body: JSON.stringify({ username: this.cfg.usuario, password: this.cfg.clave }) });
    this.peticiones++;
    let d: any = null; try { d = await r.json(); } catch (_) { d = null; }
    if (!d || !d.token) throw new Error("No se pudo iniciar sesión en el WMS (revisa el usuario y la clave).");
    this.token = String(d.token);
    await this.rpc("sb_wms_token", { p_token: this.token }).catch(() => null);
  }
  async get(url: string): Promise<any> {
    if (!this.token) await this.entrar();
    let r = await fetch(url, { headers: encabezados(this.cfg, this.token) });
    this.peticiones++;
    if (r.status === 401 || r.status === 403) {
      await r.body?.cancel();
      await this.entrar();
      r = await fetch(url, { headers: encabezados(this.cfg, this.token) });
      this.peticiones++;
    }
    if (r.status !== 200) { await r.body?.cancel(); throw new Error(`El WMS respondió con código ${r.status}.`); }
    let d: any = null; try { d = await r.json(); } catch (_) { d = null; }
    if (!d || !Array.isArray(d.results)) throw new Error("Respuesta del WMS no válida.");
    return d;
  }
}

const urlModulos = (cfg: Cfg, start: number, length: number) => {
  const filtros = [{ campo: "bodega__tipo", operador: "=", valor: "WMS", type: "text" }];
  return `${cfg.inventarios_url}?activo=true&origen=WMS&cd_id=${encodeURIComponent(String(cfg.cd_id))}` +
    `&filters=${encodeURIComponent(JSON.stringify(filtros))}` +
    `&search=${encodeURIComponent(JSON.stringify({ search: "" }))}` +
    `&paging=${encodeURIComponent(JSON.stringify({ start, length }))}`;
};

// ---------- nombres y zonas (igual que 04_Inventario_Utils.gs) ----------
export function limpiarModulo(m: unknown) {
  if (m === null || m === undefined || String(m).trim() === "") return "N/A";
  const s = String(m).trim().replace(/\s+/g, " ").toUpperCase();
  let x = s.match(/^F\s*AUX\s*(\d+)$/); if (x) return "H" + parseInt(x[1], 10);
  x = s.match(/^CARPA\s*M\s*(\d+)$/); if (x) return "M" + parseInt(x[1], 10);
  return s;
}
export function zonaModulo(m: string) {
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
const tieneProducto = (i: any) => (Number(i.total_estibas) || 0) > 0 || (Number(i.total_cajas) || 0) > 0 || (Number(i.total_unidades) || 0) > 0;

// Fecha de hoy en Bogotá (YYYY-MM-DD) y días hasta una fecha
const hoyBogota = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
export function fechaISO(v: unknown): string | null {
  const s = String(v ?? "").trim(); if (!s) return null;
  let m = /^(\d{4}-\d{2}-\d{2})/.exec(s); if (m) return m[1];
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s); if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}
const diasHasta = (f: string) => Math.round((Date.parse(f + "T00:00:00Z") - Date.parse(hoyBogota() + "T00:00:00Z")) / 864e5);
// Fecha y hora para Postgres: con zona si la trae; sin zona, la de Bogotá (como Apps Script)
export function marcaTiempo(v: unknown): string | null {
  const s = String(v ?? "").trim(); if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}(:?\d{2})?)$/.test(s)) return s;
  let m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?(\.\d+)?$/.exec(s);
  if (m) return `${m[1]}T${m[2]}${m[3] || ":00"}${TZ_SB}`;
  m = /^(\d{4}-\d{2}-\d{2})$/.exec(s); if (m) return `${m[1]}T00:00:00${TZ_SB}`;
  return null;
}
const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
const txt = (v: unknown) => { const s = String(v ?? "").trim(); return s === "" ? null : s; };

// Módulos con el mismo nombre: se toma el que tiene producto; «Pasillo…» vacíos no existen
export function unificar(modulos: any[]) {
  const porNombre: Record<string, any[]> = {}, orden: string[] = [];
  modulos.forEach(m => {
    const nombre = limpiarModulo(m.nombre || ""), invs = Array.isArray(m.inventarios) ? m.inventarios : [];
    if (!porNombre[nombre]) { porNombre[nombre] = []; orden.push(nombre); }
    porNombre[nombre].push({ m, invs, conProd: invs.some(tieneProducto) });
  });
  const salida: any[] = [];
  orden.forEach(n => {
    const lista = porNombre[n];
    if (zonaModulo(n) === "OPCIONAL" && !lista.some(x => x.conProd)) return;
    let el = lista.filter(x => x.conProd);
    if (!el.length) el = [lista.find(x => x.invs.length > 0) || lista[0]];
    salida.push({ nombre: n, wms: el[0].m, invs: ([] as any[]).concat(...el.map(x => x.invs)), picking: el.some(x => x.m.es_picking === true) });
  });
  return salida;
}

// Filas para sb_reemplazar_wms (las mismas columnas de WMS_Base)
export function aplanar(mods: any[]) {
  const filas: any[] = [], filasMod: any[] = [];
  let maxMov = 0;
  mods.forEach(mod => {
    const skus = new Set<string>(); let lotes = 0;
    mod.invs.forEach((i: any) => {
      const fAct = i.fecha_ultima_actualizacion || "";
      if (fAct) { const t = Date.parse(fAct); if (!isNaN(t) && t > maxMov) maxMov = t; }
      const vence = fechaISO(i.fecha_vencimiento);
      let dias = i.dias_por_vencer;
      dias = dias === null || dias === undefined || dias === "" || isNaN(Number(dias)) ? (vence ? diasHasta(vence) : 9999) : Number(dias);
      const sku = String(i.producto_sku ?? "").trim();
      filas.push({
        sku, producto: txt(i.producto_descripcion), modulo: mod.nombre,
        estibas: num(i.total_estibas), cajas: num(i.total_cajas), unidades: num(i.total_unidades),
        vence, dias: Math.round(dias), estado: txt(String(i.estado_inventario_nombre || "").toUpperCase()), candado: txt(i.candado_codigo),
        carga: marcaTiempo(i.fecha_carga), familia: txt(String(i.familia_nombre || "").toUpperCase()), cajas_por_estiba: num(i.producto_cajas_por_estiba) || 1,
        obs: txt(i.observaciones), picking: !!(mod.picking || i.es_picking === true), actualizacion: marcaTiempo(fAct)
      });
      if (tieneProducto(i)) { skus.add(sku); lotes++; }
    });
    const w = mod.wms || {};
    filasMod.push({ modulo: mod.nombre, nombre_wms: txt(w.nombre), seccion: txt(w.section_nombre), bodega: txt(w.bodega_nombre), zona: zonaModulo(mod.nombre),
      picking: !!mod.picking, con_producto: lotes > 0, skus: skus.size, lotes });
  });
  return { filas, filasMod, maxMov };
}

// ---------- fotos de los lotes con prioridad (solo en la sincronización manual) ----------
const ES_FOTO = (v: unknown) => typeof v === "string" && /fotoinventario|\.(webp|jpe?g|png)(\?|$)/i.test(v);
const actividadDe = (r: any) => { const a = r.actividad_id !== undefined ? r.actividad_id : (r.actividad && typeof r.actividad === "object" ? r.actividad.id : r.actividad); return a === undefined || a === null ? "" : String(a); };
function urlsFoto(r: any, media: string) {
  const out: string[] = [];
  const poner = (v: unknown) => { if (!ES_FOTO(v)) return; let u = String(v).trim(); if (!/^https?:\/\//.test(u)) u = String(media || "").replace(/\/+$/, "") + "/" + u.replace(/^\/+/, ""); if (/^https:\/\//.test(u) && !out.includes(u)) out.push(u); };
  if (r.imagen) poner(r.imagen);
  Object.keys(r || {}).forEach(k => { const v = r[k]; if (typeof v === "string") poner(v); else if (v && typeof v === "object" && !Array.isArray(v)) Object.keys(v).forEach(k2 => poner(v[k2])); });
  return out;
}
async function fotosPrioridad(mods: any[], s: Sesion, cfg: Cfg, rpc: Rpc) {
  const lotes: Record<string, any> = {};
  mods.forEach(mod => mod.invs.forEach((i: any) => {
    const act = i.actividad_id === undefined || i.actividad_id === null ? "" : String(i.actividad_id).trim();
    if (!act || !/^\d+$/.test(act) || !tieneProducto(i)) return;
    if (!String(i.observaciones || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes("prioridad")) return;
    lotes[act] = { actividad_id: act, sku: String(i.producto_sku).trim(), modulo: mod.nombre, urls: [] as string[] };
  }));
  const ids = Object.keys(lotes);
  if (!ids.length) return { prioridades: 0, pedidas: 0 };
  const conocidas = new Set(((await rpc("sb_fotos_conocidas", { p_ids: ids })) || []).map(String));
  const nuevas = ids.filter(x => !conocidas.has(x));
  if (!nuevas.length) return { prioridades: ids.length, pedidas: 0 };
  const base = new URL(cfg.login_url).origin + "/api/calidad/foto-inventario/";
  const url = (f: unknown) => `${base}?filters=${encodeURIComponent(JSON.stringify(f))}&paging=${encodeURIComponent(JSON.stringify({ start: 0, length: 500 }))}`;
  const repartir = (res: any[]) => res.forEach(r => { const a = actividadDe(r); if (lotes[a]) urlsFoto(r, cfg.media_url || "").forEach(u => { if (!lotes[a].urls.includes(u)) lotes[a].urls.push(u); }); });
  const set = new Set(nuevas);
  let intentadas = nuevas;
  const r = await s.get(url([{ campo: "actividad_id", type: "text", operador: "in", valor: nuevas.map(Number) }])).catch(() => null);
  let sirve = !!r && r.results.every((x: any) => set.has(actividadDe(x)));
  if (sirve && r && !r.results.length) {
    const masNueva = nuevas.reduce((m, x) => Number(x) > Number(m) ? x : m);
    const rp = await s.get(url([{ campo: "actividad_id", type: "text", operador: "==", valor: Number(masNueva) }])).catch(() => null);
    if (rp && rp.results.length) sirve = false;
  }
  if (sirve && r) repartir(r.results);
  else {
    intentadas = nuevas.slice().sort((a, b) => Number(b) - Number(a)).slice(0, 20);
    for (const a of intentadas) {
      const r1 = await s.get(url([{ campo: "actividad_id", type: "text", operador: "==", valor: Number(a) }])).catch(() => null);
      if (r1) repartir(r1.results.filter((x: any) => !actividadDe(x) || actividadDe(x) === a).map((x: any) => Object.assign({ actividad_id: a }, x)));
      else lotes[a].fallo = true;
    }
  }
  const guardar = intentadas.map(a => lotes[a]).filter(x => !x.fallo);
  if (guardar.length) await rpc("sb_fotos_guardar", { p_filas: guardar.map(x => ({ actividad_id: x.actividad_id, sku: x.sku, modulo: x.modulo, urls: x.urls })) });
  return { prioridades: ids.length, pedidas: nuevas.length, conFoto: guardar.filter(x => x.urls.length).length };
}

// ---------- la sincronización ----------
export async function sincronizarWms(rpc: Rpc, o: { forzar?: boolean; por: string; fotos?: boolean }) {
  const cfg: Cfg = (await rpc("sb_wms_config")) || {};
  if (!cfg.login_url || !cfg.inventarios_url || !cfg.usuario || !cfg.clave || cfg.cd_id === undefined || cfg.cd_id === "")
    throw new Error("Falta la conexión al WMS en Supabase: en Apps Script corre una vez «pasarWmsASupabase».");
  const s = new Sesion(cfg, rpc);
  // Todos los módulos, por páginas
  let todos: any[] = [], total: number | null = null, start = 0;
  for (let p = 0; p < MAX_PAGINAS; p++) {
    const d = await s.get(urlModulos(cfg, start, PAGINA));
    const tf = parseInt(d.records_filtered, 10); if (!isNaN(tf)) total = tf;
    todos = todos.concat(d.results); start += d.results.length;
    if (!d.results.length) break;
    if (total !== null ? todos.length >= total : d.results.length < PAGINA) break;
  }
  if (total !== null && todos.length !== total) throw new Error(`El WMS reporta ${total} módulos pero llegaron ${todos.length}. No se actualizó la base.`);
  const mods = unificar(todos);
  const { filas, filasMod, maxMov } = aplanar(mods);
  const conProducto = filas.filter(r => r.estibas > 0 || r.cajas > 0 || r.unidades > 0).length;
  if (!conProducto) throw new Error("El WMS no devolvió inventario. La base anterior se conserva.");
  const previo = Number(((await rpc("sb_wms_previo")) || {}).filas || 0);
  if (!o.forzar && previo >= 50 && conProducto < previo * MIN_PROPORCION)
    throw new Error(`El WMS devolvió ${conProducto} ubicaciones con producto y la última vez fueron ${previo}. Por seguridad no se reemplazó la base. Si la bajada es real, puedes forzar la sincronización.`);
  await rpc("sb_reemplazar_wms", {
    p_filas: filas, p_modulos: filasMod,
    p_estado: { ultima_sync: new Date().toISOString(), ultimo_movimiento: maxMov ? new Date(maxMov).toISOString() : null, filas: conProducto, modulos: mods.length, por: o.por }
  });
  let fotos: any = null;
  if (o.fotos) { try { fotos = await fotosPrioridad(mods, s, cfg, rpc); } catch (e) { console.warn("fotos:", (e as Error).message); } }
  return { ok: true, filas: conProducto, fisicas: conProducto, modulos: mods.length, total, peticiones: s.peticiones, fotos };
}

// ---------- solo lo que cambió (cada 2 a 4 minutos) ----------
// 1) ¿Qué módulos tienen algo actualizado desde la última revisión? (respuesta casi vacía si nada cambió)
// 2) Esos módulos se piden completos (la consulta 1 solo trae los lotes que cambiaron)
// 3) En la base se cambian solo esos módulos; el resto queda igual
const MARGEN_MS = 90 * 1000;   // se repasa un poco hacia atrás para no perder nada entre una y otra
const urlFiltro = (cfg: Cfg, filtros: unknown[], start: number, length: number) =>
  `${cfg.inventarios_url}?activo=true&origen=WMS&cd_id=${encodeURIComponent(String(cfg.cd_id))}` +
  `&filters=${encodeURIComponent(JSON.stringify([{ campo: "bodega__tipo", operador: "=", valor: "WMS", type: "text" }].concat(filtros as any)))}` +
  `&search=${encodeURIComponent(JSON.stringify({ search: "" }))}` +
  `&paging=${encodeURIComponent(JSON.stringify({ start, length }))}`;
async function todasLasPaginas(s: Sesion, cfg: Cfg, filtros: unknown[]) {
  let out: any[] = [], total: number | null = null, start = 0;
  for (let p = 0; p < MAX_PAGINAS; p++) {
    const d = await s.get(urlFiltro(cfg, filtros, start, PAGINA));
    const tf = parseInt(d.records_filtered, 10); if (!isNaN(tf)) total = tf;
    out = out.concat(d.results); start += d.results.length;
    if (!d.results.length || (total !== null ? out.length >= total : d.results.length < PAGINA)) break;
  }
  if (total !== null && out.length !== total) throw new Error(`El WMS reporta ${total} módulos pero llegaron ${out.length}.`);
  return out;
}
export async function cambiosWms(rpc: Rpc) {
  const cfg: Cfg = (await rpc("sb_wms_config")) || {};
  if (!cfg.login_url || !cfg.inventarios_url || !cfg.usuario || !cfg.clave) throw new Error("Falta la conexión al WMS en Supabase.");
  const s = new Sesion(cfg, rpc);
  const desde = String((await rpc("sb_wms_delta_desde")) || "");
  const t0 = Date.now();
  const desdeMs = Math.min(Date.parse(desde) || t0 - 10 * 60000, t0) - MARGEN_MS;
  const desdeIso = new Date(desdeMs).toISOString().replace(/\.\d+Z$/, "Z");
  const cambiaron = await todasLasPaginas(s, cfg, [{ campo: "inventarios__fecha_ultima_actualizacion", operador: ">=", valor: desdeIso, type: "datetime" }]);
  const hasta = new Date(t0).toISOString();
  if (!cambiaron.length) return { ok: true, n: 0, modulos: [], hasta, peticiones: s.peticiones };
  // Los módulos completos (por nombre, de a 60)
  const nombres = [...new Set(cambiaron.map(m => String(m.nombre || "")).filter(Boolean))];
  let completos: any[] = [];
  for (let k = 0; k < nombres.length; k += 60) completos = completos.concat(await todasLasPaginas(s, cfg, [{ campo: "nombre", operador: "in", valor: nombres.slice(k, k + 60), type: "text" }]));
  const mods = unificar(completos);
  const nuevos = aplanar(mods), cambiados = new Set(mods.map(m => m.nombre));
  // Lo demás queda como está en la base
  const act = (await rpc("sb_wms_actual")) || {};
  const filas = (act.filas || []).filter((r: any) => !cambiados.has(r.modulo)).concat(nuevos.filas);
  const filasMod = (act.modulos || []).filter((r: any) => !cambiados.has(r.modulo)).concat(nuevos.filasMod);
  const conProducto = filas.filter((r: any) => Number(r.estibas) > 0 || Number(r.cajas) > 0 || Number(r.unidades) > 0).length;
  const antes = act.ultimo_movimiento ? Date.parse(act.ultimo_movimiento) : 0;
  await rpc("sb_reemplazar_wms", {
    p_filas: filas, p_modulos: filasMod,
    p_estado: { ultima_sync: new Date().toISOString(), ultimo_movimiento: new Date(Math.max(antes || 0, nuevos.maxMov || 0) || Date.now()).toISOString(), filas: conProducto, modulos: filasMod.length, por: "Cambios" }
  });
  return { ok: true, n: cambiados.size, modulos: [...cambiados], hasta, peticiones: s.peticiones };
}

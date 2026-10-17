// =====================================================================
// FRECS! · Notificaciones al celular (Web Push de la app)
// ---------------------------------------------------------------------
// Claves VAPID: la función las crea la primera vez y quedan en el Vault (la privada nunca sale
// de Supabase; la pública la pide la página para suscribirse). Cada mensaje va cifrado para
// cada celular (web-push arma el pedido; aquí se manda con fetch). Si el servicio de push dice
// que esa suscripción ya no existe (404 / 410), se apaga.
// =====================================================================
import webpush from "npm:web-push@3.6.7";

type Rpc = (fn: string, args?: unknown) => Promise<any>;
const SUJETO = "https://huberxp.github.io/frecs-app/";

export async function clavesPush(rpc: Rpc): Promise<{ publicKey: string; privateKey: string }> {
  let k = await rpc("sb_push_vapid");
  if (!k || !k.publicKey) k = await rpc("sb_push_vapid_guardar", { p_claves: webpush.generateVAPIDKeys() });
  return k;
}

// Manda el mismo aviso a una lista de suscripciones [{ id, endpoint, p256dh, auth }]
export async function enviarPush(rpc: Rpc, subs: any[], aviso: { titulo: string; cuerpo: string; url?: string; tag?: string }) {
  if (!subs || !subs.length) return { enviados: 0, fuera: 0 };
  const k = await clavesPush(rpc);
  const datos = JSON.stringify({ t: aviso.titulo, b: aviso.cuerpo, u: aviso.url || "./", tag: aviso.tag || "" });
  const ok: number[] = [], fuera: number[] = [];
  await Promise.all(subs.map(async s => {
    try {
      const d = webpush.generateRequestDetails({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, datos,
        { vapidDetails: { subject: SUJETO, publicKey: k.publicKey, privateKey: k.privateKey }, TTL: 24 * 3600, urgency: "high" });
      const r = await fetch(d.endpoint, { method: "POST", headers: d.headers, body: d.body });
      await r.body?.cancel();
      if (r.status >= 200 && r.status < 300) ok.push(s.id);
      else if (r.status === 404 || r.status === 410) fuera.push(s.id);
      else console.warn("push", r.status);
    } catch (e) { console.warn("push:", (e as Error).message); }
  }));
  await rpc("sb_push_resultado", { p_ok: ok, p_fuera: fuera }).catch(() => null);
  return { enviados: ok.length, fuera: fuera.length };
}

const fecha = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : v; };

// ⬜ Reporte de módulo vacío (al momento): a todos menos a quien lo reportó
export async function pushReporte(rpc: Rpc, id: number) {
  const r = await rpc("sb_push_reporte", { p_id: id });
  if (!r || r.tipo !== "VACIO" || r.estado !== "PENDIENTE") return { enviados: 0 };
  const subs = await rpc("sb_push_subs", r.reportado_por ? { p_excluir: r.reportado_por } : {});
  const que = [r.sku_sistema, r.producto_sistema].filter(Boolean).join(" · ");
  return enviarPush(rpc, subs, {
    titulo: `⬜ ${r.modulo} reportado vacío`,
    cuerpo: `${que ? que + (r.detalle_sistema ? ` (${r.detalle_sistema})` : "") + "\n" : ""}Reportó ${r.reportado_por}. Revísalo en el WMS.`,
    url: "./?ir=repgen", tag: "vacio-" + r.modulo
  });
}

// ⏳ Lotes que llegaron a su límite (una vez al día): un solo aviso con todos
export async function pushVencer(rpc: Rpc) {
  const l: any[] = (await rpc("sb_push_vencer")) || [];
  if (!l.length) return { enviados: 0, lotes: 0 };
  const subs = await rpc("sb_push_subs", {});
  const linea = (x: any) => `${x.modulo} · ${x.sku} ${String(x.producto).replace(/\s+x\s*\d+.*$/i, "")} · vence ${fecha(x.vence)} (${x.dias < 0 ? "vencido" : x.dias + " d"})`;
  const cuerpo = l.slice(0, 4).map(linea).join("\n") + (l.length > 4 ? `\n… y ${l.length - 4} más` : "");
  const r = await enviarPush(rpc, subs, { titulo: `⏳ ${l.length} ${l.length === 1 ? "lote llegó" : "lotes llegaron"} a su límite: bloquéalos`, cuerpo, url: "./?ir=fechas", tag: "vencer" });
  return Object.assign(r, { lotes: l.length });
}

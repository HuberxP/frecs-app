// Prueba del bot en Supabase (función frecs-bot) con: PostgreSQL local (como Supabase),
// un Telegram falso y un Apps Script falso. Correr:  deno run -A pruebas/bot_prueba.ts
const P_SB = 8791, P_TG = 8792, P_AS = 8793, P_WMS = 8794, P_PUSH = 8795;
const psql = async (sql: string, rol = "service_role") => {
  const cmd = new Deno.Command("su", { args: ["postgres", "-c", "psql -p 5439 -d frecs -At -v ON_ERROR_STOP=1 -q"], stdin: "piped", stdout: "piped", stderr: "piped" });
  const p = cmd.spawn();
  const w = p.stdin.getWriter();
  await w.write(new TextEncoder().encode(`set role ${rol};\ndo $d$ begin perform set_config('request.jwt.claims', '{"role":"${rol}"}', false); end $d$;\n` + sql));
  await w.close();
  const o = await p.output();
  if (!o.success) throw new Error(new TextDecoder().decode(o.stderr).replace(/^[\s\S]*?ERROR:\s*/, "").split("\n")[0]);
  return new TextDecoder().decode(o.stdout).trim();
};
const lit = (v: unknown) => `$J$${typeof v === "string" ? v : JSON.stringify(v)}$J$`;

// --- Supabase falso (PostgREST + Storage) ---
Deno.serve({ port: P_SB, onListen() {} }, async req => {
  const u = new URL(req.url);
  if (u.pathname.startsWith("/storage/v1/object/frecs/instructivo.pdf")) return new Response(new TextEncoder().encode("%PDF-1.4\n% instructivo de prueba\n"), { headers: { "Content-Type": "application/pdf" } });
  const fn = u.pathname.split("/rpc/")[1];
  if (req.headers.get("apikey") !== "clave-servicio") return new Response('{"message":"Invalid API key"}', { status: 401 });
  const args = JSON.parse((await req.text()) || "{}");
  try {
    const out = (await psql(`select coalesce(to_jsonb(public.${fn}(${Object.keys(args).map(k => `${k} => ${lit(args[k])}`).join(", ")}))::text, 'null');`)).split("\n").pop();
    return new Response(out, { headers: { "Content-Type": "application/json" } });
  } catch (e) { return new Response(JSON.stringify({ message: (e as Error).message }), { status: 400 }); }
});
// --- Telegram falso ---
const tg: any[] = [];
Deno.serve({ port: P_TG, onListen() {} }, async req => {
  const metodo = new URL(req.url).pathname.split("/").pop();
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart")) {
    const f = await req.formData(); const doc = f.get("document") as File;
    tg.push({ metodo, chat: String(f.get("chat_id")), caption: String(f.get("caption") || ""), nombre: doc.name, bytes: new Uint8Array(await doc.arrayBuffer()) });
  } else {
    const j = await req.json();
    // Simula que Telegram no entiende el formato Markdown de un texto
    if (j.parse_mode && /FALLA/.test(j.text || "")) return new Response('{"ok":false,"description":"Bad Request: can\'t parse entities"}', { status: 400 });
    tg.push(Object.assign({ metodo }, j));
  }
  return new Response('{"ok":true,"result":{}}', { headers: { "Content-Type": "application/json" } });
});
// --- Apps Script falso ---
const as: any[] = [];
Deno.serve({ port: P_AS, onListen() {} }, async req => {
  const j = JSON.parse(await req.text()); as.push(j);
  if (j.secreto !== "secreto-bot") return new Response(JSON.stringify({ ok: false, error: "No autorizado." }));
  if (j.accion === "sincronizar_bot") return new Response(JSON.stringify({ ok: true, filas: 1234, modulos: 383 }));
  return new Response(JSON.stringify({ ok: true, hojas: j.tablas }));
});

// --- WMS falso (login + inventario por páginas, armado con lo que hay en wms_base) ---
const wms = { logins: 0, gets: 0, heads: [] as Headers[], falla: 0, rechazo: 0, token: "" };
const jwt = (exp: number) => "h." + btoa(JSON.stringify({ exp })).replace(/=+$/, "") + ".f";
let invFalso: any[] = [];
async function armarInvFalso() {
  const filas = JSON.parse(await psql(`select coalesce(jsonb_agg(jsonb_build_object('nombre', m.modulo, 'section_nombre', m.seccion, 'bodega_nombre', m.bodega, 'es_picking', m.picking,
      'inventarios', coalesce((select jsonb_agg(jsonb_build_object('producto_sku', w.sku, 'producto_descripcion', w.producto, 'total_estibas', w.estibas, 'total_cajas', w.cajas, 'total_unidades', w.unidades,
        'fecha_vencimiento', w.vence, 'dias_por_vencer', w.dias, 'estado_inventario_nombre', w.estado, 'candado_codigo', w.candado, 'fecha_carga', w.carga::text, 'familia_nombre', w.familia,
        'producto_cajas_por_estiba', w.cajas_por_estiba, 'observaciones', w.obs, 'es_picking', w.picking, 'fecha_ultima_actualizacion', w.actualizacion::text) order by w.id) from wms_base w where w.modulo = m.modulo), '[]'::jsonb)) order by m.modulo), '[]')::text from wms_modulos m`, "postgres"));
  invFalso = filas;
}
Deno.serve({ port: P_WMS, onListen() {} }, async req => {
  const u = new URL(req.url);
  wms.heads.push(req.headers);
  if (u.pathname === "/api/login/") {
    const b = await req.json(); wms.logins++;
    if (b.username !== "usuario-wms" || b.password !== "clave-wms") return new Response('{"detail":"no"}', { status: 400 });
    wms.token = jwt(Math.floor(Date.now() / 1000) + 3 * 86400) + wms.logins;
    return new Response(JSON.stringify({ token: wms.token }), { headers: { "Content-Type": "application/json" } });
  }
  if (u.pathname === "/api/inventarios/") {
    wms.gets++;
    if (wms.falla) { wms.falla--; return new Response("error", { status: 500 }); }
    if (wms.rechazo) { wms.rechazo--; return new Response('{"detail":"token"}', { status: 401 }); }
    if (req.headers.get("authorization") !== "Bearer " + wms.token) return new Response('{"detail":"token"}', { status: 401 });
    const pg = JSON.parse(u.searchParams.get("paging") || "{}");
    return new Response(JSON.stringify({ records_filtered: invFalso.length, results: invFalso.slice(pg.start, pg.start + pg.length) }), { headers: { "Content-Type": "application/json" } });
  }
  return new Response("no", { status: 404 });
});

// --- Servicio de push falso (como el de Chrome / Apple): guarda lo que llega; /viejo responde 410 ---
const pushes: { ruta: string; headers: Headers; body: Uint8Array }[] = [];
Deno.serve({ port: P_PUSH, onListen() {} }, async req => {
  const ruta = new URL(req.url).pathname;
  pushes.push({ ruta, headers: req.headers, body: new Uint8Array(await req.arrayBuffer()) });
  return new Response("", { status: ruta === "/viejo" ? 410 : 201 });
});

Deno.env.set("SUPABASE_URL", `http://127.0.0.1:${P_SB}`);
Deno.env.set("SB_SECRET", "clave-servicio");
Deno.env.set("TELEGRAM_TOKEN", "t123");
Deno.env.set("TELEGRAM_BASE", `http://127.0.0.1:${P_TG}`);
await psql(`delete from frecs_config where clave like 'bot\\_%'; delete from bot_cache;
  insert into frecs_config values ('bot_grupo','-100'),('bot_webhook_secreto','webhook-secreto'),('bot_secreto','secreto-bot'),('bot_apps_script_url','http://127.0.0.1:${P_AS}/exec'),('bot_dashboard','https://huberxp.github.io/frecs-app/');`, "postgres");
const { manejar } = await import("../supabase/functions/frecs-bot/index.ts");

let fallos = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "✅ " : "❌ ") + m); if (!c) fallos++; };
let uid = 5000;
const enviar = (cuerpo: unknown, secreto = "webhook-secreto") => manejar(new Request("http://x/", { method: "POST", headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": secreto }, body: JSON.stringify(cuerpo) }));
const msj = (t: string, chat = 5) => enviar({ update_id: ++uid, message: { chat: { id: chat }, text: t } });
const cb = (d: string, chat = 5) => enviar({ update_id: ++uid, callback_query: { id: "c" + uid, data: d, message: { chat: { id: chat }, message_id: 9 } } });
const paginas = (b: Uint8Array) => (new TextDecoder("latin1").decode(b).match(/\/Type\s*\/Page[^s]/g) || []).length;

// Seguridad del webhook
ok((await enviar({ update_id: ++uid, message: { chat: { id: 5 }, text: "/start" } }, "otro")).status === 401, "sin el secreto del webhook no responde");

// Comandos
const comandos = ["/start", "/pocos", "/carpa", "/barriles", "/turno", "/validacion", "/entrega", "/conciliacion", "/pre", "/mezclados", "/b12", "/m15", "15781", "club col",
  "/fecha 13/03/2027", "/consumo", "/estado", "/pk", "/ka", "/retornables", "/limbo", "/candados", "/fechas", "/vencidos", "/bloqueados", "/prioridades", "/tpc", "/reempaque",
  "/resumen", "/vacios", "/huecos", "/infiltrados", "/consolidar", "/organizar", "/malubicados", "/merma", "/grupo 2222 3659", "/modulo b12", "/sku 2222", "/buscar pony", "/acomodar 2222 01/01/2027", "07/09/2026 6"];
for (const c of comandos) {
  const antes = tg.length;
  const t0 = Date.now();
  await msj(c);
  const nuevos = tg.slice(antes);
  ok(nuevos.some(x => String(x.chat_id ?? x.chat) === "5"), `bot responde ${c} (${Date.now() - t0} ms)`);
}
ok(!tg.some(x => /Error interno/.test(String(x.text || ""))), "sin «Error interno»");

// Botones y PDF
for (const d of ["CARPA|1", "BARR|1", "MEZC|1", "TURNO", "CONC", "PRE", "CONSO|1", "POCOS|1"]) {
  const antes = tg.length; await cb(d);
  ok(tg.length > antes, "botón " + d);
}
for (const d of ["PDFPOCOS", "PDFCONSO", "PDFCONSO2", "PDFRESUMEN", "PDFRETORNABLE", "INFORME", "VALPDF", "ENTPDF", "CONCPDF", "BARRPDF", "CARPAPDF"]) {
  const antes = tg.length, t0 = Date.now(); await cb(d);
  const doc = tg.slice(antes).find(x => x.metodo === "sendDocument");
  const esPdf = !!doc && new TextDecoder("latin1").decode(doc.bytes.slice(0, 5)) === "%PDF-";
  if (doc) await Deno.writeFile(`/tmp/bot_${d}.pdf`, doc.bytes);
  const err = tg.slice(antes).find(x => /^❌/.test(String(x.text || "")));
  ok(esPdf || !!err, `PDF ${d}: ${doc ? `${doc.nombre} · ${paginas(doc.bytes)} pág · ${Math.round(doc.bytes.length / 1024)} KB` : (err ? "aviso: " + err.text : "no llegó")} (${Date.now() - t0} ms)`);
}
{ const antes = tg.length; await cb("INSTRUCTIVO"); ok(tg.slice(antes).some(x => x.metodo === "sendDocument"), "instructivo desde el depósito de Supabase"); }

// Mensaje repetido por Telegram: se atiende una sola vez
{ const antes = tg.length; const u = { update_id: 99999, message: { chat: { id: 5 }, text: "/estado" } }; await enviar(u); const n1 = tg.length; await enviar(u); ok(n1 > antes && tg.length === n1, "un mensaje repetido se atiende una vez"); }

// /sincronizar: Supabase trae el WMS directamente (la conexión en el Vault; Apps Script solo copia a las hojas)
{
  // Sin la conexión al WMS en Supabase todavía: la manual la sigue haciendo Apps Script
  await psql("delete from vault.secrets where name = 'frecs_wms';", "postgres");
  { const a0 = tg.length; as.length = 0; await msj("/sincronizar");
    ok(as.some(x => x.accion === "sincronizar_bot" && x.secreto === "secreto-bot") && tg.slice(a0).some(x => /1\.234 ubicaciones/.test(x.text || "")), "sin la conexión en Supabase, /sincronizar lo sigue haciendo Apps Script"); }
  await armarInvFalso();
  await psql(`delete from vault.secrets where name = 'frecs_wms'; select vault.create_secret(${lit({ login_url: `http://127.0.0.1:${P_WMS}/api/login/`, inventarios_url: `http://127.0.0.1:${P_WMS}/api/inventarios/`, cd_id: 3, usuario: "usuario-wms", clave: "clave-wms" })}, 'frecs_wms', ''); update wms_sesion set token = null;`, "postgres");
  const filasAntes = await psql("select count(*) from wms_base", "postgres"), conProd = await psql("select count(*) from wms_base where estibas > 0 or cajas > 0 or unidades > 0", "postgres");
  const antes = tg.length; as.length = 0;
  await msj("/sincronizar");
  ok(wms.logins === 1 && wms.gets >= 1, `sincronizar consulta el WMS desde Supabase (${wms.logins} inicio de sesión, ${wms.gets} página(s))`);
  ok(tg.slice(antes).some(x => new RegExp(`Base actualizada[\\s\\S]*${Number(conProd).toLocaleString("es-CO")} ubicaciones`).test(x.text || "")), "sincronizar responde con el resultado");
  ok((await psql("select count(*) from wms_base", "postgres")) === filasAntes && (await psql("select por from sync_estado where id = 1", "postgres")) === "Bot", "la base queda con lo que trajo el WMS");
  const hd = wms.heads[wms.heads.length - 1];
  ok(/Chrome\/\d+/.test(hd.get("user-agent") || "") && hd.get("origin") === `http://127.0.0.1:${P_WMS}` && hd.get("sec-ch-ua-mobile") === "?1" && hd.get("x-cd-id") === "3", "pide con los encabezados de Chrome: " + hd.get("user-agent"));
  await new Promise(r => setTimeout(r, 300));
  ok(as.some(x => x.accion === "wms_hojas" && x.secreto === "secreto-bot"), "y pide a Apps Script la copia en las hojas (sin tocar el WMS)");
  // Desde la página: reutiliza la sesión (no vuelve a iniciar sesión)
  const tkV = JSON.parse(await psql("select ingresar('Ana María','5555')::text;", "anon")).token;
  const pag = (c: unknown) => manejar(new Request("http://x/", { method: "POST", body: JSON.stringify(c) })).then(r => r.json());
  let r = await pag({ accion: "wms_sync", token: tkV });
  ok(r.ok && wms.logins === 1, "la página sincroniza con la misma sesión del WMS (no inicia sesión otra vez)");
  ok(!(await pag({ accion: "wms_sync", token: "falso" })).ok, "sin sesión de Frecs no sincroniza");
  // El WMS rechaza el token: inicia sesión una vez y sigue
  wms.rechazo = 1; r = await pag({ accion: "wms_sync", token: tkV });
  ok(r.ok && wms.logins === 2, "si el WMS rechaza la sesión, inicia sesión otra vez y sigue");
  // Automática (pg_cron): si falla avisa al grupo una vez; cuando vuelve, avisa que volvió
  await psql(`update frecs_config set valor = '{"on":true,"ok":true}' where clave = 'sync_auto'; insert into frecs_config (clave, valor) select 'sync_auto', '{"on":true,"ok":true}' where not exists (select 1 from frecs_config where clave = 'sync_auto');`, "postgres");
  const auto = () => manejar(new Request("http://x/", { method: "POST", body: JSON.stringify({ accion: "wms_sync", secreto: "secreto-bot", auto: true }) }));
  ok((await manejar(new Request("http://x/", { method: "POST", body: JSON.stringify({ accion: "wms_sync", secreto: "malo" }) }))).status === 401, "la automática sin el secreto no corre");
  let a0 = tg.length; wms.falla = 1; await auto();
  ok(tg.slice(a0).some(x => String(x.chat_id) === "-100" && /no se pudo traer el WMS/.test(x.text || "")), "si la automática falla, avisa al grupo");
  a0 = tg.length; wms.falla = 1; await auto();
  ok(!tg.slice(a0).some(x => /Sincronización automática/.test(x.text || "")), "si sigue fallando no repite el aviso");
  a0 = tg.length; await auto();
  ok(tg.slice(a0).some(x => /volvió a responder/.test(x.text || "")), "cuando vuelve a funcionar, avisa una vez");
  const est = JSON.parse(await psql("select valor from frecs_config where clave = 'sync_auto'", "postgres"));
  ok(est.ok === true && /ubicaciones/.test(est.msg) && est.ult, "queda cómo le fue a la última automática");
  await psql(`update frecs_config set valor = '{}' where clave = 'sync_auto'`, "postgres");
}

// 🔔 Notificaciones al celular: claves en el Vault, aviso cifrado de módulo vacío y de prueba
{
  const nodeCrypto = await import("node:crypto");
  const ece = (await import("npm:http_ece@1.2.0")).default;
  await psql("delete from vault.secrets where name = 'frecs_push'; update push_subs set activo = false;", "postgres");
  const pag = (c: unknown) => manejar(new Request("http://x/", { method: "POST", body: JSON.stringify(c) })).then(r => r.json());
  const k1 = await pag({ accion: "push_clave" }), k2 = await pag({ accion: "push_clave" });
  ok(k1.ok && /^[A-Za-z0-9_-]{80,}$/.test(k1.clave) && k1.clave === k2.clave, "la clave pública de las notificaciones se crea una vez y se reutiliza");
  ok((await psql("select count(*) from vault.secrets where name = 'frecs_push'", "postgres")) === "1", "las claves quedan en el Vault");
  // Un celular de Ana María y uno viejo de Huber (ya no existe: el servicio responde 410)
  const ua = nodeCrypto.createECDH("prime256v1"); ua.generateKeys(); const auth = nodeCrypto.randomBytes(16);
  await psql(`insert into push_subs (usuario, endpoint, p256dh, auth) values ('Ana María', 'http://127.0.0.1:${P_PUSH}/ana', '${ua.getPublicKey().toString("base64url")}', '${auth.toString("base64url")}'),
    ('Huber', 'http://127.0.0.1:${P_PUSH}/viejo', '${ua.getPublicKey().toString("base64url")}', '${auth.toString("base64url")}') on conflict (endpoint) do update set activo = true, p256dh = excluded.p256dh, auth = excluded.auth;`, "postgres");
  const { Buffer } = await import("node:buffer");
  const leer = (b: Uint8Array) => JSON.parse(ece.decrypt(Buffer.from(b), { version: "aes128gcm", privateKey: ua, authSecret: auth }).toString());
  const tkH = JSON.parse(await psql("select ingresar('Huber','1234')::text;", "anon")).token;
  const mR = await psql("select modulo from wms_base where coalesce(estibas,0) > 0 and modulo not in (select modulo from reportes_modulo where estado = 'PENDIENTE') order by modulo limit 1", "postgres");
  const rc = JSON.parse(await psql(`select reporte_crear(${lit(tkH)}, ${lit([{ tipo: "VACIO", modulo: mR, sku_sistema: "2222", producto_sistema: "Pony" }])})::text;`, "anon"));
  pushes.length = 0;
  const r1 = await pag({ accion: "push_reporte", secreto: "secreto-bot", id: rc.creados[0] });
  const pa = pushes.find(x => x.ruta === "/ana");
  ok(r1.ok && r1.enviados === 1 && !!pa && pa.headers.get("content-encoding") === "aes128gcm" && /^vapid t=.+, k=/.test(pa.headers.get("authorization") || ""), "el aviso de vacío llega cifrado (aes128gcm + VAPID) a los demás");
  const msj = pa ? leer(pa.body) : {};
  ok(new RegExp(`${mR} reportado vacío`).test(msj.t) && /Reportó Huber/.test(msj.b) && msj.u === "./?ir=repgen", "se descifra con la clave del celular: " + JSON.stringify(msj));
  ok(!pushes.some(x => x.ruta === "/viejo"), "a quien reportó no le llega su propio aviso");
  ok((await pag({ accion: "push_reporte", secreto: "malo", id: rc.creados[0] })).ok === false, "sin el secreto no manda avisos");
  // Prueba desde el perfil: solo a esa persona; la suscripción vieja (410) se apaga
  pushes.length = 0;
  const rp = await pag({ accion: "push_prueba", token: tkH });
  ok(!rp.ok && pushes.some(x => x.ruta === "/viejo") && (await psql("select activo from push_subs where endpoint like '%/viejo'", "postgres")) === "f", "si el celular ya no existe (410), la suscripción se apaga");
  await psql(`delete from reportes_modulo where id = ${rc.creados[0]}; update push_subs set activo = false;`, "postgres");
}

// Limbo paso a paso (la memoria del bot queda en Supabase entre mensajes)
await cb("LIMBO_ADD");
ok((await psql("select valor from bot_cache where clave='limbo_step_5'", "postgres")) === "NOMBRE", "paso del limbo guardado en Supabase");
await msj("Producto de prueba del bot"); await msj("10/05/2027"); await msj("Lata"); await msj("330cc");
ok((await psql("select count(*) from limbo where producto='Producto de prueba del bot' and vencimiento='10/05/2027'", "postgres")) === "1", "limbo agregado por el bot llegó a Supabase");
ok(as.some(x => x.accion === "maestros_bot" && (x.tablas || []).includes("limbo")), "y se pidió copiarlo a las hojas de respaldo");
ok((await psql("select count(*) from bot_cache where clave like 'limbo_%5'", "postgres")) === "0", "al terminar se borra el paso del limbo");
await psql("delete from limbo where producto='Producto de prueba del bot'", "postgres");

// Consumo desde el bot
const skuC = await psql("select w.sku from wms_base w where not exists (select 1 from consumo c where c.sku = w.sku) and w.estado='DISPONIBLE' limit 1", "postgres");
// La lista de consumo la cambia solo el administrador, desde la página
tg.length = 0;
await msj("/consumo add " + skuC);
ok((await psql(`select count(*) from consumo where sku='${skuC}'`, "postgres")) === "0", "el bot ya no agrega a la lista de consumo: " + skuC);
ok(tg.some(x => /solo el administrador/.test(JSON.stringify(x))), "el bot dice que la cambia el administrador en la página");
const skuY = await psql("select sku from consumo limit 1", "postgres");
if (skuY) { await cb("CONSO_DEL|" + skuY); ok((await psql(`select count(*) from consumo where sku='${skuY}'`, "postgres")) === "1", "el bot ya no quita de la lista de consumo"); }

// Formato que Telegram no entiende: se reintenta sin formato
{ const antes = tg.length; await msj("FALLA_MD_xyz"); ok(tg.slice(antes).some(x => x.metodo === "sendMessage" && !x.parse_mode), "si falla el formato, reintenta sin formato"); }

// Alerta diaria
{ const antes = tg.length;
  const r = await manejar(new Request("http://x/", { method: "POST", body: JSON.stringify({ accion: "alerta", secreto: "secreto-bot" }) }));
  ok(r.status === 200 && tg.slice(antes).filter(x => String(x.chat_id) === "-100").length >= 5, "alerta diaria al grupo");
  const r2 = await manejar(new Request("http://x/", { method: "POST", body: JSON.stringify({ accion: "alerta", secreto: "malo" }) }));
  ok(r2.status === 401, "alerta sin secreto rechazada"); }

// PDF armado en la página → grupo
{ const tk = JSON.parse(await psql("select ingresar('Ana María','5555')::text;", "anon")).token;
  const b64 = btoa("%PDF-1.4\nprueba");
  const antes = tg.length;
  let r = await (await manejar(new Request("http://x/", { method: "POST", body: JSON.stringify({ accion: "pdf_telegram", token: tk, nombre: "Val.pdf", b64, caption: "📝 *Validación*" }) }))).json();
  ok(r.ok && tg.slice(antes).some(x => x.metodo === "sendDocument" && x.chat === "-100" && /Ana María/.test(x.caption)), "PDF de la página al grupo: " + JSON.stringify(r));
  r = await (await manejar(new Request("http://x/", { method: "POST", body: JSON.stringify({ accion: "pdf_telegram", token: "malo", b64 }) }))).json();
  ok(!r.ok && r.sesion, "sin sesión no envía");
  r = await (await manejar(new Request("http://x/", { method: "POST", body: JSON.stringify({ accion: "pdf_telegram", token: tk, b64: btoa("<html>") }) }))).json();
  ok(!r.ok && /no es un PDF/.test(r.error), "solo PDF"); }

// Reporte de módulos → aviso al grupo (solo lo que esa persona acaba de reportar)
{ const tk = JSON.parse(await psql("select ingresar('Ana María','5555')::text;", "anon")).token;
  await psql("delete from reportes_modulo;", "postgres");
  const c = JSON.parse(await psql(`select reporte_crear(${lit(tk)}, ${lit([{ tipo: "VACIO", modulo: "b12", sku_sistema: "2222", producto_sistema: "Pony 330" }, { tipo: "CONFLICTO", modulo: "A7", sku_encontrado: "3617", producto_encontrado: "Costeñita", nota: "tiene etiqueta nueva" }])})::text;`, "anon"));
  ok(c.creados.length === 2, "reportes creados: " + JSON.stringify(c.creados));
  const antes = tg.length;
  let r = await (await manejar(new Request("http://x/", { method: "POST", body: JSON.stringify({ accion: "reporte", token: tk, ids: c.creados }) }))).json();
  const m = tg.slice(antes).find(x => x.metodo === "sendMessage" && String(x.chat_id) === "-100");
  ok(r.ok && m && /B12 — reportado VACÍO/.test(m.text) && /A7 — CONFLICTO/.test(m.text) && /Ana María/.test(m.text) && /3617/.test(m.text), "aviso del reporte al grupo: " + (m && m.text));
  r = await (await manejar(new Request("http://x/", { method: "POST", body: JSON.stringify({ accion: "reporte", token: "malo", ids: c.creados }) }))).json();
  ok(!r.ok && r.sesion, "reporte sin sesión no avisa");
  const tk2 = JSON.parse(await psql("select ingresar('Huber','1234')::text;", "anon")).token;
  r = await (await manejar(new Request("http://x/", { method: "POST", body: JSON.stringify({ accion: "reporte", token: tk2, ids: c.creados }) }))).json();
  ok(!r.ok, "otra persona no puede reenviar el aviso de reportes ajenos");
  await psql("delete from reportes_modulo;", "postgres"); }

console.log(fallos ? `${fallos} FALLOS` : "TODO OK");
Deno.exit(fallos ? 1 : 0);

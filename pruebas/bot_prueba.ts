// Prueba del bot en Supabase (función frecs-bot) con: PostgreSQL local (como Supabase),
// un Telegram falso y un Apps Script falso. Correr:  deno run -A pruebas/bot_prueba.ts
const P_SB = 8791, P_TG = 8792, P_AS = 8793;
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

// /sincronizar: el WMS lo trae Apps Script
{ const antes = tg.length; await msj("/sincronizar");
  ok(as.some(x => x.accion === "sincronizar_bot" && x.secreto === "secreto-bot"), "sincronizar pide el WMS a Apps Script con el secreto");
  ok(tg.slice(antes).some(x => /Base actualizada[\s\S]*1\.234 ubicaciones/.test(x.text || "")), "sincronizar responde con el resultado"); }

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
await msj("/consumo add " + skuC);
ok((await psql(`select count(*) from consumo where sku='${skuC}'`, "postgres")) === "1", "consumo agregado por el bot: " + skuC);
await msj("/consumo del " + skuC); await cb("CONSO_DEL|" + skuC);
ok((await psql(`select count(*) from consumo where sku='${skuC}'`, "postgres")) === "0", "consumo quitado por el bot");

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

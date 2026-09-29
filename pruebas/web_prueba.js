// Prueba de la versión web en Chromium: GitHub Pages simulado (servidor local) + Supabase simulado (PostgreSQL local)
const { execFileSync, spawn } = require("child_process");
const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");
const psql = (sql, rol) => execFileSync("su", ["postgres", "-c", "psql -p 5439 -d frecs -At -v ON_ERROR_STOP=1 -q"], { input: `set role ${rol || "anon"};\n` + sql, maxBuffer: 1 << 28 }).toString().trim();
const lit = v => { const s = typeof v === "string" ? v : JSON.stringify(v); return `$J$${s}$J$`; };
let llamadasSb = 0, sinRed = false;
(async () => {
  const srv = spawn("python3", ["-m", "http.server", "8766", "--bind", "127.0.0.1"], { cwd: __dirname + "/../docs", stdio: "ignore" });
  await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch();
  const errores = [];
  const nueva = async (vp, nombre) => {
    const ctx = await b.newContext({ viewport: vp });
    await ctx.route("https://wktznckezlxptocmhhze.supabase.co/**", async route => {
      if (sinRed) return route.abort("internetdisconnected");
      llamadasSb++;
      const req = route.request(), fn = req.url().split("/rpc/")[1], args = JSON.parse(req.postData() || "{}");
      if (!/^sb_publishable_/.test(req.headers()["apikey"] || "")) return route.fulfill({ status: 401, body: '{"message":"Invalid API key"}' });
      const sql = `select coalesce(to_jsonb(public.${fn}(${Object.keys(args).map(k => `${k} => ${lit(args[k])}`).join(", ")}))::text, 'null');`;
      try { const out = psql(sql).split("\n").pop(); await route.fulfill({ status: 200, contentType: "application/json", body: out }); }
      catch (e) { const m = String(e.stderr || e.message).replace(/^.*ERROR:\s*/s, "").split("\n")[0]; await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: m }) }); }
    });
    const page = await ctx.newPage();
    page.on("pageerror", e => errores.push(`${nombre}: ${e.message}`));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_INTERNET/.test(m.text())) errores.push(`${nombre} consola: ${m.text()}`); });
    return { ctx, page };
  };
  const { ctx, page } = await nueva({ width: 1366, height: 900 }, "escritorio");
  const t0 = Date.now();
  await page.goto("http://127.0.0.1:8766/");
  await page.waitForSelector("#lgN");
  const nombres = await page.$$eval("#lgN option", o => o.map(x => x.value).filter(x => x));
  if (!nombres.includes("Huber")) errores.push("lista de nombres: " + nombres);
  await page.selectOption("#lgN", "Huber"); await page.fill("#lgP", "0000"); await page.click("#lgB");
  await page.waitForTimeout(700);
  if (!/incorrecto/i.test(await page.$eval("#login", e => e.innerText))) errores.push("PIN malo no avisa");
  await page.fill("#lgP", "1234"); await page.click("#lgB");
  await page.waitForSelector(".kpis", { timeout: 15000 });
  console.log(`ingreso + inicio: ${Date.now() - t0} ms (servidor simulado)`);
  await page.screenshot({ path: "/tmp/w_inicio.png" });
  const vistas = await page.evaluate(() => NAV.flatMap(g => g.items.map(i => i.id)));
  if (vistas.some(v => ["validacion", "entrega", "conciliacion", "hval", "usuarios", "reportes"].includes(v))) errores.push("siguen vistas de fase 4: " + vistas);
  for (const v of vistas) {
    await page.evaluate(v2 => ir(v2), v); await page.waitForTimeout(250);
    const t = await page.$eval("#view", el => el.innerText.slice(0, 120).replace(/\n/g, " "));
    if (/⚠️/.test(t) && !/⚠️ Mal/.test(t)) errores.push(`vista ${v}: ${t}`);
    if (["stock", "pocos", "carpa", "consumo", "resumen"].includes(v)) await page.screenshot({ path: `/tmp/w_${v}.png` });
  }
  // Stock de un SKU
  await page.evaluate(() => ir("stock")); await page.waitForTimeout(300);
  const campo = await page.$("#view input[type=search], #view input[type=text]");
  if (campo) { await campo.fill("2222"); await campo.press("Enter"); await page.waitForTimeout(500); await page.screenshot({ path: "/tmp/w_stock2.png" }); }
  // Algo que escribe: avisa y no rompe
  const aviso = await page.evaluate(async () => { try { await api("webTurnoAbrir", 2, true); return "sin error"; } catch (e) { return e.message; } });
  if (!/dashboard actual/.test(aviso)) errores.push("escritura no bloqueada: " + aviso);
  const sync = await page.evaluate(async () => { try { await api("webSincronizar"); return "sin error"; } catch (e) { return e.message; } });
  if (!/sincronizar/.test(sync)) errores.push("⟳ sin aviso: " + sync);
  // Recargar: arranque instantáneo desde lo guardado
  await page.evaluate(() => ir("inicio")); await page.waitForTimeout(200);
  const n0 = llamadasSb; const t1 = Date.now();
  await page.reload(); await page.waitForSelector(".kpis", { timeout: 15000 });
  console.log(`recarga (con sesión guardada): ${Date.now() - t1} ms · llamadas a Supabase: ${llamadasSb - n0}`);
  // Sin conexión: abre con lo guardado
  sinRed = true;
  await page.reload(); await page.waitForSelector(".kpis", { timeout: 15000 });
  await page.evaluate(() => ir("pocos")); await page.waitForTimeout(500);
  const offTxt = await page.$eval("#view", e => e.innerText.slice(0, 200));
  if (/⚠️/.test(offTxt)) errores.push("sin conexión, pocos falla: " + offTxt.slice(0, 100));
  sinRed = false;
  // Sesión vencida → vuelve a pedir PIN
  psql("delete from sesiones;", "postgres");
  await page.evaluate(() => api("webInit").catch(() => {})); await page.waitForTimeout(800);
  if (!(await page.$eval("#login", e => !e.classList.contains("hidden")))) errores.push("sesión vencida no pide PIN");
  // Celular
  const cel = await nueva({ width: 390, height: 844 }, "celular");
  await cel.page.goto("http://127.0.0.1:8766/"); await cel.page.waitForSelector("#lgN");
  await cel.page.selectOption("#lgN", "Huber"); await cel.page.fill("#lgP", "1234"); await cel.page.click("#lgB");
  await cel.page.waitForSelector(".kpis", { timeout: 15000 });
  await cel.page.screenshot({ path: "/tmp/m_w_inicio.png" });
  for (const v of ["pocos", "carpa"]) { await cel.page.evaluate(v2 => ir(v2), v); await cel.page.waitForTimeout(400); await cel.page.screenshot({ path: `/tmp/m_w_${v}.png` }); }
  const ancho = await cel.page.evaluate(() => document.documentElement.scrollWidth);
  if (ancho > 392) errores.push("celular se desborda: " + ancho);
  const sw = await cel.page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()));
  if (!sw) errores.push("sin service worker");
  const man = await cel.page.evaluate(async () => (await fetch("manifest.webmanifest")).ok);
  if (!man) errores.push("sin manifest");
  // ⟳ con Apps Script configurado
  const sy = await nueva({ width: 1280, height: 800 }, "sync");
  let respSync = { ok: true, filas: 362, modulos: 383, supabase: { filas: 362, modulos: 383 } }, pedidos = [];
  await sy.ctx.route("**/config.js*", async route => { const r = await route.fetch(); const t = (await r.text()).replace('appsScriptUrl: ""', 'appsScriptUrl: "https://script.google.com/macros/s/PRUEBA/exec"'); await route.fulfill({ response: r, body: t }); });
  await sy.ctx.route("https://script.google.com/**", async route => { pedidos.push(JSON.parse(route.request().postData())); await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(respSync) }); });
  await sy.page.goto("http://127.0.0.1:8766/"); await sy.page.waitForSelector("#lgN");
  await sy.page.selectOption("#lgN", "Huber"); await sy.page.fill("#lgP", "1234"); await sy.page.click("#lgB");
  await sy.page.waitForSelector(".kpis", { timeout: 15000 });
  if (!(await sy.page.isVisible("#syncBtn"))) errores.push("⟳ no aparece con Apps Script configurado");
  const nAntes = llamadasSb;
  await sy.page.click("#syncBtn"); await sy.page.waitForTimeout(1500);
  const tst = await sy.page.$eval("#toasts", e => e.innerText);
  if (!/Base actualizada/.test(tst)) errores.push("⟳ sin aviso de éxito: " + tst);
  if (!pedidos.length || pedidos[0].accion !== "sincronizar" || !pedidos[0].token) errores.push("⟳ pedido mal formado: " + JSON.stringify(pedidos));
  if (llamadasSb - nAntes < 1) errores.push("⟳ no recargó los datos de Supabase");
  respSync = { ok: false, error: "El WMS devolvió 10 ubicaciones con producto y la última vez fueron 362. Por seguridad no se reemplazó la base. Si la bajada es real, usa /sincronizar forzar." };
  await sy.page.click("#syncBtn"); await sy.page.waitForTimeout(800);
  const conf = await sy.page.isVisible("#cfOk");
  if (!conf) errores.push("⟳ bajada grande no pide confirmar");
  else { respSync = { ok: true, filas: 10, modulos: 383, supabase: { filas: 10 } }; await sy.page.waitForTimeout(500); await sy.page.click("#cfOk"); await sy.page.waitForTimeout(1200); if (!pedidos.some(p => p.forzar === true)) errores.push("⟳ forzar no se envió"); }
  await sy.page.screenshot({ path: "/tmp/w_sync.png" });
  console.log(errores.length ? "ERRORES:\n" + errores.join("\n") : "SIN ERRORES");
  await b.close(); srv.kill();
})();

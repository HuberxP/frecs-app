// Prueba rápida solo de los PDF (sin el resto de la prueba web)
const { execFileSync, spawn } = require("child_process");
const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");
const psql = (sql, rol) => execFileSync("su", ["postgres", "-c", "psql -p 5439 -d frecs -At -v ON_ERROR_STOP=1 -q"], { input: `set role ${rol || "anon"};\n` + sql, maxBuffer: 1 << 28 }).toString().trim();
const lit = v => `$J$${typeof v === "string" ? v : JSON.stringify(v)}$J$`;
(async () => {
  const srv = spawn("python3", ["-m", "http.server", "8767", "--bind", "127.0.0.1"], { cwd: "/home/claude/frecs-app/docs", stdio: "ignore" });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch(), ctx = await b.newContext();
  await ctx.route("https://wktznckezlxptocmhhze.supabase.co/**", async route => {
    const req = route.request(), fn = req.url().split("/rpc/")[1], args = JSON.parse(req.postData() || "{}");
    try { await route.fulfill({ status: 200, contentType: "application/json", body: psql(`select coalesce(to_jsonb(public.${fn}(${Object.keys(args).map(k => `${k} => ${lit(args[k])}`).join(", ")}))::text,'null');`).split("\n").pop() }); }
    catch (e) { await route.fulfill({ status: 400, body: JSON.stringify({ message: String(e.stderr).split("ERROR:")[1] }) }); }
  });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.log("ERR", e.message));
  await page.goto("http://127.0.0.1:8767/"); await page.waitForSelector("#lgN");
  await page.fill("#lgN", "Huber"); await page.fill("#lgP", "1234"); await page.click("#lgB"); await page.waitForSelector(".kpis", { timeout: 15000 });
  const T = process.env.TURNO || psql("select id from turnos where estado='CERRADO' order by cierre desc limit 1", "postgres");
  for (const [tipo, id] of [["RESUMEN", ""], ["ENTREGA", T], ["CONSUMO", ""], ["RETORNABLE", ""], ["POCOS", ""], ["CARPA", ""], ["VALIDACION", T], ["CONCILIACION", ""], ["BARRILES", ""], ["CONSUMO_SOLO", ""], ["TPC", ""], ["INFORME", ""]]) {
    const t0 = Date.now();
    const r = await page.evaluate(a => api("webPDF", a[0], a[1]).then(x => x, e => ({ error: e.message })), [tipo, id]);
    if (r.error) { console.log(tipo, "ERROR", r.error); continue; }
    require("fs").writeFileSync(`/tmp/p_${tipo}.pdf`, Buffer.from(r.b64, "base64"));
    console.log(tipo, r.nombre, Math.round(r.b64.length * 0.75 / 1024) + " KB", (Date.now() - t0) + " ms");
  }
  await b.close(); srv.kill();
})();

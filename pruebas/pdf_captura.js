// PDF tal cual lo arma la página: node pruebas/pdf_captura.js <TIPO> [id] → /tmp/p_<TIPO>.pdf
const { execFileSync, spawn } = require("child_process");
const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");
const psql = (sql, rol) => execFileSync("su", ["postgres", "-c", "psql -p 5439 -d frecs -At -v ON_ERROR_STOP=1 -q"], { input: `set role ${rol || "anon"};\n` + sql, maxBuffer: 1 << 28 }).toString().trim();
const lit = v => `$J$${typeof v === "string" ? v : JSON.stringify(v)}$J$`;
(async () => {
  const [tipo, id, antes] = process.argv.slice(2);
  const srv = spawn("python3", ["-m", "http.server", "8770", "--bind", "127.0.0.1"], { cwd: __dirname + "/../docs", stdio: "ignore" });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route("https://wktznckezlxptocmhhze.supabase.co/**", async route => {
    const req = route.request(), fn = req.url().split("/rpc/")[1], args = JSON.parse(req.postData() || "{}");
    try { await route.fulfill({ status: 200, contentType: "application/json", body: psql(`select coalesce(to_jsonb(public.${fn}(${Object.keys(args).map(k => `${k} => ${lit(args[k])}`).join(", ")}))::text,'null');`).split("\n").pop() }); }
    catch (e) { await route.fulfill({ status: 400, body: JSON.stringify({ message: String(e.stderr).split("ERROR:")[1] }) }); }
  });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.error("ERR", e.message));
  await page.goto("http://127.0.0.1:8770/"); await page.waitForSelector("#lgN");
  await page.selectOption("#lgN", "Huber"); await page.fill("#lgP", "1234"); await page.click("#lgB"); await page.waitForTimeout(2500);
  if (antes) { await page.evaluate(antes); await page.waitForTimeout(500); }
  const r = await page.evaluate(async ([t, i]) => { const x = await api("webPDF", t, i || ""); return x; }, [tipo, id || ""]);
  require("fs").writeFileSync(`/tmp/p_${tipo}.pdf`, Buffer.from(r.b64, "base64"));
  console.log(r.nombre);
  await b.close(); srv.kill();
})();

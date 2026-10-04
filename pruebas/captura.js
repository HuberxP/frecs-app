// Capturas rápidas de una vista (no valida nada): node pruebas/captura.js <vista> "<js antes>" [ancho]
const { execFileSync, spawn } = require("child_process");
const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");
const psql = (sql, rol) => execFileSync("su", ["postgres", "-c", "psql -p 5439 -d frecs -At -v ON_ERROR_STOP=1 -q"], { input: `set role ${rol || "anon"};\n` + sql, maxBuffer: 1 << 28 }).toString().trim();
const lit = v => `$J$${typeof v === "string" ? v : JSON.stringify(v)}$J$`;
(async () => {
  const [vista, antes, ancho] = process.argv.slice(2);
  const srv = spawn("python3", ["-m", "http.server", "8769", "--bind", "127.0.0.1"], { cwd: __dirname + "/../docs", stdio: "ignore" });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch();
  for (const w of (ancho ? [Number(ancho)] : [1280, 820, 390])) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 } });
    await ctx.route("https://wktznckezlxptocmhhze.supabase.co/**", async route => {
      const req = route.request(), fn = req.url().split("/rpc/")[1], args = JSON.parse(req.postData() || "{}");
      try { await route.fulfill({ status: 200, contentType: "application/json", body: psql(`select coalesce(to_jsonb(public.${fn}(${Object.keys(args).map(k => `${k} => ${lit(args[k])}`).join(", ")}))::text,'null');`).split("\n").pop() }); }
      catch (e) { await route.fulfill({ status: 400, body: JSON.stringify({ message: String(e.stderr).split("ERROR:")[1] }) }); }
    });
    await ctx.route("https://script.google.com/**", r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
    const page = await ctx.newPage();
    await page.goto("http://127.0.0.1:8769/"); await page.waitForSelector("#lgN");
    await page.fill("#lgN", "Huber"); await page.fill("#lgP", "1234"); await page.click("#lgB"); await page.waitForTimeout(2500);
    await page.evaluate(v => ir(v), vista); await page.waitForTimeout(1500);
    if (antes) { await page.evaluate(antes); await page.waitForTimeout(900); }
    await page.screenshot({ path: `/tmp/c_${vista}_${w}.png` });
    await ctx.close();
  }
  await b.close(); srv.kill();
})();

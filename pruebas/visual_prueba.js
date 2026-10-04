// Capturas rápidas de pantalla para revisar a ojo (no valida nada)
const { execFileSync, spawn } = require("child_process");
const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");
const psql = (sql, rol) => execFileSync("su", ["postgres", "-c", "psql -p 5439 -d frecs -At -v ON_ERROR_STOP=1 -q"], { input: `set role ${rol || "anon"};\n` + sql, maxBuffer: 1 << 28 }).toString().trim();
const lit = v => `$J$${typeof v === "string" ? v : JSON.stringify(v)}$J$`;
(async () => {
  const srv = spawn("python3", ["-m", "http.server", "8768", "--bind", "127.0.0.1"], { cwd: __dirname + "/../docs", stdio: "ignore" });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch();
  for (const [nombre, vp] of [["esc", { width: 1280, height: 800 }], ["cel", { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp });
    await ctx.route("https://wktznckezlxptocmhhze.supabase.co/**", async route => {
      const req = route.request(), fn = req.url().split("/rpc/")[1], args = JSON.parse(req.postData() || "{}");
      try { await route.fulfill({ status: 200, contentType: "application/json", body: psql(`select coalesce(to_jsonb(public.${fn}(${Object.keys(args).map(k => `${k} => ${lit(args[k])}`).join(", ")}))::text,'null');`).split("\n").pop() }); }
      catch (e) { await route.fulfill({ status: 400, body: JSON.stringify({ message: String(e.stderr).split("ERROR:")[1] }) }); }
    });
    const page = await ctx.newPage();
    await page.goto("http://127.0.0.1:8768/"); await page.waitForSelector("#lgN");
    await page.fill("#lgN", "Huber"); await page.fill("#lgP", "1234"); await page.click("#lgB"); await page.waitForTimeout(2500);
    await page.evaluate(() => ir("organizar")); await page.waitForTimeout(800);
    await page.fill("#oq", "a"); await page.waitForTimeout(200);
    await page.screenshot({ path: `/tmp/v_${nombre}_organizar.png` });
    await page.evaluate(() => ir("entrega")); await page.waitForTimeout(900);
    await page.evaluate(() => { const b = document.querySelector('[data-a="add"][data-s="BODEGA"]'); if (b) b.click(); });
    await page.waitForTimeout(300);
    for (let k = 0; k < 2; k++) { await page.click("#eiMas"); await page.waitForTimeout(100); }
    await page.screenshot({ path: `/tmp/v_${nombre}_entrega_modal.png` });
    await page.evaluate(() => { cerrarModal(true); ir("capacidad"); }); await page.waitForTimeout(900);
    await page.evaluate(() => { const c = document.querySelector('.cap-card .pl-cab'); if (c) c.click(); const d = document.querySelector('.cap-faltan'); if (d) d.open = true; });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `/tmp/v_${nombre}_capacidad.png`, fullPage: nombre === "cel" ? false : false });
    await ctx.close();
  }
  await b.close(); srv.kill();
})();

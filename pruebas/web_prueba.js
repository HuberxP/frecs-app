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
      const sql = `select coalesce(to_jsonb(public.${fn}(${Object.keys(args).map(k => `${k} => ${lit(k === "p_valor" && typeof args[k] === "string" ? JSON.stringify(args[k]) : args[k])}`).join(", ")}))::text, 'null');`;
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
  await page.click("#lgN"); await page.waitForTimeout(150);
  const nombres = await page.$$eval("#lgS .lg-op", o => o.map(x => x.dataset.n));
  const grupos = await page.$$eval("#lgS .lg-gt", o => o.map(x => x.textContent));
  if (!grupos.some(g => /Administradores/.test(g)) || !grupos.some(g => /Rotadores/.test(g))) errores.push("ingreso: nombres sin separar por rol: " + grupos);
  await page.fill("#lgN", "hub"); await page.waitForTimeout(100);
  const sug = await page.$$eval("#lgS .lg-op", o => o.map(x => x.dataset.n));
  if (sug.join() !== "Huber") errores.push("ingreso: sugerencia al escribir «hub»: " + sug);
  await page.click('#lgS .lg-op[data-n="Huber"]');
  if (await page.inputValue("#lgN") !== "Huber" || !(await page.evaluate(() => document.activeElement && document.activeElement.id === "lgP"))) errores.push("ingreso: tocar la sugerencia no llena el nombre ni pasa al PIN");
  await page.fill("#lgN", "Nadie"); await page.fill("#lgP", "1234"); await page.click("#lgB"); await page.waitForTimeout(200);
  if (!/no está registrado/.test(await page.$eval("#lgE", e => e.innerText))) errores.push("ingreso: nombre inexistente no avisa");
  await page.screenshot({ path: "/tmp/w_login.png" });
  if (!nombres.includes("Huber")) errores.push("lista de nombres: " + nombres);
  await page.fill("#lgN", "Huber"); await page.fill("#lgP", "0000"); await page.click("#lgB");
  await page.waitForTimeout(700);
  if (!/incorrecto/i.test(await page.$eval("#login", e => e.innerText))) errores.push("PIN malo no avisa");
  await page.fill("#lgP", "1234"); await page.click("#lgB");
  await page.waitForSelector(".kpis", { timeout: 15000 });
  console.log(`ingreso + inicio: ${Date.now() - t0} ms (servidor simulado)`);
  await page.screenshot({ path: "/tmp/w_inicio.png" });
  const vistas = await page.evaluate(() => NAV.flatMap(g => g.items.map(i => i.id)));
  if (!["validacion", "entrega", "consumo", "conciliacion", "preconciliacion", "hval", "hent", "hconc", "usuarios", "reportes"].every(v => vistas.includes(v))) errores.push("faltan vistas: " + vistas);
  for (const v of vistas) {
    await page.evaluate(v2 => ir(v2), v); await page.waitForTimeout(250);
    const t = await page.$eval("#view", el => el.innerText.slice(0, 120).replace(/\n/g, " "));
    if (/⚠️/.test(t) && !/⚠️ (Mal|Ojo|Cui|FE|Reportar)/.test(t)) errores.push(`vista ${v}: ${t}`);
    if (["stock", "pocos", "carpa", "consumo", "resumen"].includes(v)) await page.screenshot({ path: `/tmp/w_${v}.png` });
  }
  // Stock de un SKU
  await page.evaluate(() => ir("stock")); await page.waitForTimeout(300);
  const campo = await page.$("#view input[type=search], #view input[type=text]");
  if (campo) { await campo.fill("2222"); await campo.press("Enter"); await page.waitForTimeout(500); await page.screenshot({ path: "/tmp/w_stock2.png" }); }
  // Algo que escribe: avisa y no rompe
  const aviso = await page.evaluate(async () => { try { await api("webMantPrevia", 30); return "sin error"; } catch (e) { return e.message; } });
  if (!/no hace falta archivar/.test(aviso)) errores.push("archivar debería avisar que no hace falta: " + aviso);
  const sync = await page.evaluate(async () => { try { await api("webSincronizar"); return "sin error"; } catch (e) { return e.message; } });
  if (!/sincronizar|NetworkError/.test(sync)) errores.push("⟳ sin aviso: " + sync); // sin Apps Script simulado en este contexto
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
  await cel.page.fill("#lgN", "Huber"); await cel.page.fill("#lgP", "1234"); await cel.page.click("#lgB");
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
  await sy.ctx.route("**/config.js*", async route => { const r = await route.fetch(); const t = (await r.text()).replace(/appsScriptUrl: "[^"]*"/, 'appsScriptUrl: "https://script.google.com/macros/s/PRUEBA/exec"'); await route.fulfill({ response: r, body: t }); });
  await sy.ctx.route("https://script.google.com/**", async route => { pedidos.push(JSON.parse(route.request().postData())); await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(respSync) }); });
  await sy.page.goto("http://127.0.0.1:8766/"); await sy.page.waitForSelector("#lgN");
  await sy.page.fill("#lgN", "Huber"); await sy.page.fill("#lgP", "1234"); await sy.page.click("#lgB");
  await sy.page.waitForSelector(".kpis", { timeout: 15000 });
  if (!(await sy.page.isVisible("#syncBtn"))) errores.push("⟳ no aparece con Apps Script configurado");
  const nAntes = llamadasSb;
  await sy.page.click("#syncBtn"); await sy.page.waitForTimeout(1500);
  const tst = await sy.page.$eval("#modal", e => e.classList.contains("hidden") ? "" : e.innerText).catch(() => "");
  if (!/Base actualizada|revisa/.test(tst) || !/Ubicaciones con producto/.test(tst)) errores.push("⟳ sin ventana de resultado: " + tst);
  await sy.page.screenshot({ path: "/tmp/w_sync_ok.png" });
  await sy.page.evaluate(() => cerrarModal(true));
  if (!pedidos.length || pedidos[0].accion !== "sincronizar" || !pedidos[0].token) errores.push("⟳ pedido mal formado: " + JSON.stringify(pedidos));
  if (llamadasSb - nAntes < 1) errores.push("⟳ no recargó los datos de Supabase");
  respSync = { ok: false, error: "El WMS devolvió 10 ubicaciones con producto y la última vez fueron 362. Por seguridad no se reemplazó la base. Si la bajada es real, usa /sincronizar forzar." };
  await sy.page.click("#syncBtn"); await sy.page.waitForTimeout(800);
  const conf = await sy.page.isVisible("#cfOk");
  if (!conf) errores.push("⟳ bajada grande no pide confirmar");
  else { respSync = { ok: true, filas: 10, modulos: 383, supabase: { filas: 10 } }; await sy.page.waitForTimeout(500); await sy.page.click("#cfOk"); await sy.page.waitForTimeout(1200); if (!pedidos.some(p => p.forzar === true)) errores.push("⟳ forzar no se envió"); }
  await sy.page.screenshot({ path: "/tmp/w_sync.png" });
  await sy.page.evaluate(() => { if (modalAbierto()) cerrarModal(true); });
  // --- Sincronización automática: switch en el perfil del administrador (la hace Apps Script) ---
  {
    const prox = new Date(Date.now() + 3.3 * 3600e3).toISOString();
    respSync = { ok: true, estado: { on: true, por: "Huber", prox: prox, ult: "", ok: true, msg: "" } };
    const nPed = pedidos.length;
    await sy.page.evaluate(() => $("#userChip").click()); await sy.page.waitForSelector("#pfSAc");
    if (!/Manual/.test(await sy.page.textContent("#pfSA"))) errores.push("sync automática: no arranca en Manual");
    await sy.page.waitForTimeout(500); await sy.page.click("#pfSA .sw"); await sy.page.waitForTimeout(1200);
    const pd = pedidos.slice(nPed).pop();
    if (!pd || pd.accion !== "sync_auto" || pd.on !== true || !pd.token) errores.push("sync automática: el pedido a Apps Script está mal: " + JSON.stringify(pd));
    if (!/Automático/.test(await sy.page.textContent("#pfSA")) || !/Próxima/.test(await sy.page.textContent("#pfSA"))) errores.push("sync automática: no muestra Automático y la próxima: " + await sy.page.textContent("#pfSA"));
    await sy.page.screenshot({ path: "/tmp/w_sync_auto.png" });
    respSync = { ok: true, estado: { on: false } };
    await sy.page.click("#pfSA .sw"); await sy.page.waitForTimeout(1000);
    if (pedidos.slice(nPed).pop().on !== false || !/Manual/.test(await sy.page.textContent("#pfSA"))) errores.push("sync automática: no se pudo volver a Manual");
    await sy.page.evaluate(() => cerrarModal(true));
    // El rotador no ve el switch
    if (await sy.page.evaluate(() => { const r = S.usuario.rol; S.usuario.rol = "validador"; $("#userChip").click(); const x = !!$("#pfSA"); cerrarModal(true); S.usuario.rol = r; return x; })) errores.push("sync automática: el rotador ve el switch");
  }
  // --- Fase 4a: escrituras (con el mismo contexto que tiene Apps Script configurado) ---
  pedidos.length = 0; respSync = { ok: true, hojas: [] };
  const P = sy.page, q = sql => psql(sql, "postgres");
  const idL = await P.evaluate(() => api("webLimboAgregar", { nombre: "Prueba web limbo", fecha: "2027-05-10", pres: "LATA", cub: "269" }));
  if (q(`select producto from limbo where id='${idL}'`) !== "Prueba web limbo") errores.push("limbo agregado no llegó a Supabase: " + idL);
  if (q(`select vencimiento from limbo where id='${idL}'`) !== "10/05/2027") errores.push("limbo: fecha mal guardada");
  await P.waitForTimeout(300);
  if (!pedidos.some(p => p.accion === "maestros" && p.tablas.includes("limbo"))) errores.push("no avisó a Apps Script para copiar limbo a la hoja");
  await P.evaluate(i => api("webLimboEliminar", i), idL);
  if (q(`select count(*) from limbo where id='${idL}'`) !== "0") errores.push("limbo eliminado sigue en Supabase");
  const dup = await P.evaluate(() => api("webConsumoAgregar", "3617").then(() => "sin error", e => e.message));
  if (!/ya está/.test(dup)) errores.push("consumo repetido no avisa: " + dup);
  const skuC = await P.evaluate(async () => {
    const cands = [...new Set(S.inv.filter(x => x.fis && x.est === "DISPONIBLE" && !x.esOp).map(x => x.s))];
    for (const c of cands) { try { await api("webConsumoAgregar", c); return c; } catch (e) {} }
    return null;
  });
  if (!skuC || q(`select count(*) from consumo where sku='${skuC}'`) !== "1") errores.push("consumo agregado no llegó: " + skuC);
  const mod = await P.evaluate(s2 => { const r = S.inv.find(x => x.s === s2 && x.fis && x.est === "DISPONIBLE"); return r ? r.m : null; }, skuC);
  if (mod) {
    await P.evaluate(a2 => api("webConsumoElegir", a2[0], a2[1]), [skuC, mod]);
    const fila = q(`select modulo_elegido || '|' || elegido_por || '|' || to_char(elegido_en at time zone 'America/Bogota','YYYY-MM-DD') from consumo where sku='${skuC}'`);
    if (!fila.startsWith(mod + "|Huber|")) errores.push("consumo elegido mal guardado: " + fila);
  }
  const malMod = await P.evaluate(s2 => api("webConsumoElegir", s2, "Z99").then(() => "sin error", e => e.message), skuC);
  if (!/no hay producto disponible/.test(malMod)) errores.push("elegir módulo sin producto no avisa: " + malMod);
  await P.evaluate(s2 => api("webConsumoEliminar", s2), skuC);
  if (q(`select count(*) from consumo where sku='${skuC}'`) !== "0") errores.push("consumo eliminado sigue");
  const cat = await P.evaluate(() => api("webSkuGuardar", "", { sku: "99002", prod: "Prueba web sku", minimo: "5", estCara: "3" }));
  if (!cat.some(c => c.sku === "99002") || q("select minimo || '|' || estibas_por_cara || '|' || usuario from sku where sku='99002'") !== "5|3|Huber") errores.push("sku nuevo mal guardado");
  await P.evaluate(() => api("webSkuGuardar", "99002", { sku: "99003", prod: "Prueba web renombrada", minimo: "" }));
  if (q("select count(*) from sku where sku in ('99002')") !== "0" || q("select coalesce(minimo::text,'vacío') from sku where sku='99003'") !== "vacío") errores.push("renombrar sku falló");
  await P.evaluate(() => api("webSkuEliminar", "99003"));
  if (q("select count(*) from sku where sku='99003'") !== "0") errores.push("sku eliminado sigue");
  const canMal = await P.evaluate(() => api("webCanalesGuardar", [{ canal: "T1", tipo: "General", dias: 90 }]).then(() => "sin error", e => e.message));
  if (!/exactamente una regla General/.test(canMal)) errores.push("canales inválidos no avisan: " + canMal);
  await P.evaluate(() => api("webCanalesGuardar", [{ canal: "T1", tipo: "General", dias: 91 }, { canal: "T2", tipo: "General", dias: 30 }, { canal: "KA", tipo: "General", dias: 120 }, { canal: "KA", tipo: "Familia", valor: "RETORNABLE", dias: 45 }]));
  if (q("select string_agg(canal||tipo||dias_minimos, ',' order by orden) from canales") !== "T1General91,T2General30,KAGeneral120,KAFamilia45") errores.push("canales mal guardados: " + q("select string_agg(canal||tipo||dias_minimos, ',' order by orden) from canales"));
  // Nueva regla de canal: ventana con los datos; queda antes de la General de su canal y se guarda
  await P.evaluate(() => ir("canales")); await P.waitForTimeout(700);
  await P.click('[data-a="add"]'); await P.waitForSelector("#rcOk"); await P.waitForTimeout(500);
  await P.click('#rcC [data-c="KA"]'); await P.click('#rcT [data-t="Contiene"]'); await P.fill("#rcV", "PONY"); await P.fill("#rcD", "60"); await P.click("#rcOk"); await P.waitForTimeout(1500);
  const reglasN = q("select string_agg(canal||tipo||coalesce(valor,'')||dias_minimos, ',' order by orden) from canales");
  if (reglasN !== "T1General91,T2General30,KAGeneral120,KAFamiliaRETORNABLE45,KAContienePONY60") errores.push("canales: la regla nueva no quedó con las de KA: " + reglasN);
  await P.screenshot({ path: "/tmp/w_canal_regla.png" });
  await P.evaluate(() => api("webCanalesGuardar", [{ canal: "T1", tipo: "General", dias: 91 }, { canal: "T2", tipo: "General", dias: 30 }, { canal: "KA", tipo: "General", dias: 120 }, { canal: "KA", tipo: "Familia", valor: "RETORNABLE", dias: 45 }]));
  // Capacidad de bodega desde la pantalla de administración
  await P.evaluate(() => ir("capacidad"));
  await P.waitForSelector(".cap-card", { timeout: 10000 });
  const nCap0 = Number(q("select count(*) from capacidad_bodega"));
  await P.click('[data-a="nuevo"]'); await P.waitForSelector("#cmM"); await P.waitForTimeout(500);
  await P.fill("#cmM", "z55"); await P.fill("#cmC", "2"); await P.click("#cmOk");
  await P.waitForTimeout(800);
  if (q("select caras || '|' || coalesce(capacidad::text,'-') from capacidad_bodega where modulo='Z55'") !== "2|-") errores.push("capacidad: módulo nuevo no llegó a Supabase");
  if (!pedidos.some(p => p.accion === "maestros" && p.tablas.includes("capacidad_bodega"))) errores.push("capacidad: no avisó a Apps Script para copiarla a la hoja");
  if (!(await P.$('.cap-card button[data-m="Z55"]'))) errores.push("capacidad: el módulo nuevo no aparece en la lista");
  const vacCap = await P.evaluate(() => api("webVacios"));
  if (!vacCap.some(x => x.m === "Z55")) errores.push("capacidad: el módulo nuevo no se cruza en módulos vacíos");
  const dupCap = await P.evaluate(() => api("webCapacidadGuardar", "", { modulo: "Z55", caras: 3 }).then(() => "sin error", e => e.message));
  if (!/ya está en la lista/.test(dupCap)) errores.push("capacidad: módulo repetido no avisa: " + dupCap);
  await P.fill("#cpQ", "z55");
  await P.click('button[data-a="editar"][data-m="Z55"]'); await P.waitForSelector("#cmM"); await P.waitForTimeout(300);
  await P.fill("#cmM", "Z56"); await P.fill("#cmC", "4"); await P.fill("#cmE", "3"); await P.press("#cmE", "Enter");
  await P.waitForTimeout(800);
  if (q("select count(*) from capacidad_bodega where modulo='Z55'") !== "0" || q("select caras || '|' || capacidad from capacidad_bodega where modulo='Z56'") !== "4|3") errores.push("capacidad: renombrar/editar falló");
  await P.fill("#cpQ", "z56");
  await P.click('button[data-a="borrar"][data-m="Z56"]'); await P.waitForSelector("#cfOk"); await P.waitForTimeout(500); await P.click("#cfOk");
  await P.waitForTimeout(800);
  if (q("select count(*) from capacidad_bodega where modulo='Z56'") !== "0" || Number(q("select count(*) from capacidad_bodega")) !== nCap0) errores.push("capacidad: quitar módulo falló");
  await P.screenshot({ path: "/tmp/w_capacidad.png" });
  // Validador: no puede tocar Sku
  const val = await nueva({ width: 1200, height: 800 }, "validador");
  await val.page.goto("http://127.0.0.1:8766/"); await val.page.waitForSelector("#lgN");
  await val.page.fill("#lgN", "Ana María"); await val.page.fill("#lgP", "5555"); await val.page.click("#lgB");
  await val.page.waitForSelector(".kpis", { timeout: 15000 });
  const sinPermiso = await val.page.evaluate(() => api("webSkuGuardar", "", { sku: "99004", prod: "no" }).then(() => "sin error", e => e.message));
  if (!/permiso/.test(sinPermiso) || q("select count(*) from sku where sku='99004'") !== "0") errores.push("validador pudo tocar Sku: " + sinPermiso);
  if (await val.page.$('a[data-v="skus"]')) errores.push("validador ve Administración");
  const capVal = await val.page.evaluate(() => api("webCapacidadGuardar", "", { modulo: "Z57", caras: 2 }).then(() => "sin error", e => e.message));
  if (!/permiso/.test(capVal) || q("select count(*) from capacidad_bodega where modulo='Z57'") !== "0") errores.push("validador pudo tocar la capacidad: " + capVal);
  // Si Supabase rechaza, la página se deshace
  q("update perfiles set rol='lector' where nombre='Ana María'");
  const rech = await val.page.evaluate(() => api("webLimboAgregar", { nombre: "No debe quedar", fecha: "2027-01-01" }).then(() => "sin error", e => e.message));
  q("update perfiles set rol='validador' where nombre='Ana María'");
  if (!/permiso/i.test(rech) || q("select count(*) from limbo where producto='No debe quedar'") !== "0") errores.push("rechazo del servidor no se respetó: " + rech);
  await P.evaluate(() => ir("limbo")); await P.waitForTimeout(500); await P.screenshot({ path: "/tmp/w_limbo.png" });
  await P.evaluate(() => ir("skus")); await P.waitForTimeout(500); await P.screenshot({ path: "/tmp/w_skus.png" });
  // --- Fase 4b: turnos, validación y entrega ---
  const tkA = JSON.parse(psql("select ingresar('Ana María','5555')::text;")).token;
  const turnoAb = () => q("select id from turnos where estado='ABIERTO'");
  const T = turnoAb();
  if (!T) errores.push("no hay turno abierto para probar");
  let v = await P.evaluate(() => api("webVal"));
  const p2222 = v.productos.find(x => x.sku === "2222");
  if (!v.turno || v.turno.id !== T || !p2222) errores.push("webVal no trae el turno abierto: " + JSON.stringify(v.turno));
  const disp0 = p2222 ? p2222.disponible : 0;
  let r = await P.evaluate(() => api("webValRegistrar", { sku: "2222", destino: "KA", cantidad: 10, nota: "web" }));
  const idR = r.resultado.id;
  if (q(`select cantidad || '|' || destino || '|' || estado || '|' || usuario from val_registros where id='${idR}'`) !== "10|KA|ACTIVO|Huber") errores.push("validación no llegó a Supabase");
  if (r.resultado.disponible !== disp0 - 10) errores.push(`disponible mal: ${r.resultado.disponible} (esperado ${disp0 - 10})`);
  const mucho = await P.evaluate(() => api("webValRegistrar", { sku: "2222", destino: "KA", cantidad: 100000 }).then(() => "sin error", e => e.message));
  if (!/No alcanza/.test(mucho)) errores.push("sobre-validación no avisa: " + mucho);
  // Dos personas a la vez: la base no deja pasar el saldo aunque la página tenga datos viejos
  let falso = "sin error";
  try { psql(`select guardar_filas('${tkA}', ${lit([{ tabla: "val_registros", poner: [{ id: "VCHOQUE", turno_id: T, fecha: "2026-09-28T10:00:00-05:00", sku: "2222", producto: "Pony", destino: "KA", cantidad: disp0, usuario: "Ana María", estado: "ACTIVO" }] }])}::jsonb);`); } catch (e) { falso = String(e.stderr || e.message); }
  if (!/No alcanza.*al mismo tiempo/.test(falso) || q("select count(*) from val_registros where id='VCHOQUE'") !== "0") errores.push("la base dejó pasar el saldo: " + falso.slice(0, 200));
  // CONFLICTO no descuenta: sí entra
  try { psql(`select guardar_filas('${tkA}', ${lit([{ tabla: "val_registros", poner: [{ id: "VCONF", turno_id: T, fecha: "2026-09-28T10:00:00-05:00", sku: "2222", destino: "KA", cantidad: 99999, estado: "CONFLICTO" }] }])}::jsonb);`); } catch (e) { errores.push("un CONFLICTO fue rechazado"); }
  q("delete from val_registros where id='VCONF'");
  await P.evaluate(i => api("webValEditar", i, { destino: "Tradicional", cantidad: 12, nota: "editado" }), idR);
  if (q(`select cantidad || '|' || destino || '|' || (modificado_por like 'Editado por Huber%') from val_registros where id='${idR}'`) !== "12|Tradicional|true") errores.push("editar validación falló: " + q(`select to_jsonb(r) from val_registros r where id='${idR}'`));
  await P.evaluate(i => api("webValAnular", i), idR);
  if (q(`select estado from val_registros where id='${idR}'`) !== "ANULADO") errores.push("anular falló");
  await P.evaluate(() => api("webValAgregar", [{ sku: "3617", inicial: 20, contadoEn: "2026-09-28T09:15" }]));
  if (q(`select inicial || '|' || to_char(contado_en at time zone 'America/Bogota','HH24:MI') from val_productos where turno_id='${T}' and sku='3617'`) !== "20|09:15") errores.push("agregar producto a validación falló");
  await P.evaluate(() => api("webValInicial", "3617", 25, "2026-09-28T09:30"));
  if (q(`select inicial from val_productos where turno_id='${T}' and sku='3617'`) !== "25") errores.push("cambiar inicial falló");
  const ordenV = (await P.evaluate(() => api("webVal"))).productos.map(x => x.sku);
  if (ordenV[ordenV.length - 1] !== "3617") errores.push("orden de productos cambió: " + ordenV);
  await P.evaluate(() => api("webValQuitar", "3617"));
  if (q(`select count(*) from val_productos where turno_id='${T}' and sku='3617'`) !== "0") errores.push("quitar producto falló");
  await P.evaluate(() => api("webValDestino", "agregar", "Destino Web"));
  if (q("select count(*) from destinos where nombre='Destino Web'") !== "1") errores.push("destino nuevo no llegó");
  await P.evaluate(() => api("webValDestino", "quitar", "Destino Web"));
  if (q("select count(*) from destinos where nombre='Destino Web'") !== "0") errores.push("destino quitado sigue");
  // Entrega
  // (lo validado ya está en la entrega sin contar: la precarga llena esas filas en vez de repetirlas)
  const antesEnt = +q(`select count(*) from ent_items where turno_id='${T}'`);
  const pendVal = +q(`select count(*) from ent_items where turno_id='${T}' and cantidades::text = '[]'`);
  const pre = await P.evaluate(() => api("webEntPrecargar", ["BODEGA", "TPC", "KA", "PK"]));
  const nEnt = +q(`select count(*) from ent_items where turno_id='${T}'`), sumaPre = Object.values(pre.resultado).reduce((a, b) => a + b, 0);
  if (!nEnt || nEnt - antesEnt > sumaPre || nEnt - antesEnt < sumaPre - pendVal) errores.push(`precarga: ${antesEnt} → ${nEnt} en Supabase, ${JSON.stringify(pre.resultado)} en la página (pendientes de la validación: ${pendVal})`);
  if (antesEnt < 3) errores.push("lo validado no quedó en la entrega para recontarlo: " + antesEnt);
  await P.evaluate(() => api("webEntGuardar", "BODEGA", "2222", "Pony", [{ n: 3, un: "Estibas", m: "a1" }, { n: 5, un: "Cajas", m: "" }]));
  const cj = q(`select cantidades::text || '|' || origen from ent_items where turno_id='${T}' and seccion='BODEGA' and sku='2222'`);
  if (cj !== '[{"m": "A1", "n": 3, "un": "Estibas"}, {"m": "", "n": 5, "un": "Cajas"}]|Usuario') errores.push("entrega guardada mal: " + cj);
  await P.evaluate(() => api("webEntQuitar", "BODEGA", "2222"));
  if (q(`select count(*) from ent_items where turno_id='${T}' and seccion='BODEGA' and sku='2222'`) !== "0") errores.push("quitar de la entrega falló");
  await P.evaluate(() => api("webEntNota", "Nota desde la web"));
  const idN = q(`select id from ent_notas where turno_id='${T}' and texto='Nota desde la web'`);
  if (!idN) errores.push("nota de entrega no llegó");
  await P.evaluate(i => api("webEntNotaEditar", i, "Nota editada"), idN);
  if (q(`select texto from ent_notas where id='${idN}'`) !== "Nota editada") errores.push("editar nota falló");
  await P.evaluate(i => api("webEntNotaQuitar", i), idN);
  if (q(`select count(*) from ent_notas where id='${idN}'`) !== "0") errores.push("quitar nota falló");
  // El otro usuario ve los cambios (se releen los turnos si tienen más de 15 s)
  await val.page.evaluate(() => api("webVal"));
  await P.evaluate(() => api("webValRegistrar", { sku: "2882", destino: "Bodegas", cantidad: 7 }));
  await val.page.waitForTimeout(16000);
  const vA = await val.page.evaluate(() => api("webVal"));
  if (!vA.registros.some(x => x.sku === "2882" && x.cantidad === 7)) errores.push("el otro usuario no ve la validación nueva");
  const rA = await val.page.evaluate(() => api("webValRegistrar", { sku: "2882", destino: "KA", cantidad: 1 }));
  if (q(`select usuario from val_registros where id='${rA.resultado.id}'`) !== "Ana María") errores.push("validador no pudo validar");
  // Sin conexión: error de red (la página lo guarda en la cola)
  sinRed = true;
  const off = await val.page.evaluate(() => api("webValRegistrar", { sku: "2882", destino: "KA", cantidad: 1 }).then(() => "sin error", e => (e.red ? "red" : e.message)));
  sinRed = false;
  if (off !== "red") errores.push("sin conexión la validación no queda como error de red: " + off);
  // Cantidad inicial por zona y «por confirmar» llegan a Supabase
  await P.evaluate(() => api("webValAgregar", [{ sku: "3617", producto: "Costeñita", bodega: 4, pk: 3, ka: "" }, { sku: "15781", producto: "Club 850", porConfirmar: true }]));
  await P.waitForTimeout(800);
  const zz = q(`select bodega || '|' || pk || '|' || coalesce(ka::text, '-') || '|' || inicial || '|' || por_confirmar from val_productos where turno_id='${T}' and sku='3617'`);
  if (zz !== "4|3|-|7|false") errores.push("zonas de la cantidad inicial mal en Supabase: " + zz);
  if (q(`select por_confirmar from val_productos where turno_id='${T}' and sku='15781'`) !== "t") errores.push("«por confirmar» no llegó a Supabase");
  const neg = await P.evaluate(() => api("webValRegistrar", { sku: "15781", destino: "KA", cantidad: 2 }).then(() => "ok", e => e.message));
  if (neg !== "ok") errores.push("por confirmar no deja validar (la base lo frenó): " + neg);
  // Cerrar el turno desde la pantalla
  const nProd = q(`select count(*) from val_productos where turno_id='${T}'`), nReg = q(`select count(*) from val_registros where turno_id='${T}'`);
  await P.evaluate(() => ir("inicio")); await P.waitForTimeout(600);
  // La tarjeta del turno viene recogida: se despliega para ver «Cerrar turno»
  if (await P.$(".turno.plegada")) { await P.click("[data-info-tog]"); await P.waitForTimeout(300); }
  await P.click('[data-t="cerrar"]'); await P.waitForSelector("#ctS", { timeout: 10000 });
  if (!(await P.$("#ctP"))) errores.push("cerrar turno: falta la opción «Cerrar y descargar PDF»");
  await P.screenshot({ path: "/tmp/w_cerrar.png" });
  let bajados = 0; P.on("download", () => { bajados++; });
  await P.fill("#ctN", "cierre desde la web"); await P.waitForTimeout(450); await P.click("#ctS"); await P.waitForTimeout(1500);
  if (bajados) errores.push("«Solo cerrar» descargó PDF");
  if (q(`select estado || '|' || cerrado_por || '|' || nota || '|' || (cierre is not null) from turnos where id='${T}'`) !== "CERRADO|Huber|cierre desde la web|true") errores.push("cerrar turno falló: " + q(`select to_jsonb(t) from turnos t where id='${T}'`));
  if (q(`select count(*) from val_productos where turno_id='${T}'`) !== nProd || q(`select count(*) from val_registros where turno_id='${T}'`) !== nReg) errores.push("al cerrar se perdieron filas de la validación");
  const cerr = await P.evaluate(() => api("webValRegistrar", { sku: "2222", destino: "KA", cantidad: 1 }).then(() => "sin error", e => e.message));
  if (!/No hay turno abierto/.test(cerr)) errores.push("validar sin turno abierto no avisa: " + cerr);
  // Abrir el siguiente heredando el saldo
  const saldo = JSON.parse(q(`select jsonb_object_agg(p.sku, p.inicial - coalesce((select sum(cantidad) from val_registros r where r.turno_id=p.turno_id and r.sku=p.sku and r.estado='ACTIVO'),0)) from val_productos p where p.turno_id='${T}'`));
  await P.evaluate(() => ir("inicio")); await P.waitForTimeout(800);
  if (await P.$('#tb [data-t="abrir"]')) errores.push("inicio: todavía deja abrir el turno");
  await P.evaluate(() => ir("entrega")); await P.waitForTimeout(800);
  await P.click('[data-t="abrir"]'); await P.waitForSelector("#atOk", { timeout: 10000 });
  if (await P.$eval("#atH", x => x.checked).catch(() => true)) errores.push("heredar el saldo viene marcado por defecto");
  await P.click('#np [data-n="3"]'); await P.check("#atH"); await P.waitForTimeout(450); await P.click("#atOk"); await P.waitForTimeout(1500);
  const T2 = turnoAb();
  if (!T2 || T2 === T || q(`select numero || '|' || recibe_de_id || '|' || abierto_por from turnos where id='${T2}'`) !== `3|${T}|Huber`) errores.push("abrir turno falló: " + T2);
  const her = JSON.parse(q(`select coalesce(jsonb_object_agg(sku, inicial), '{}') from val_productos where turno_id='${T2}'`) || "{}");
  if (JSON.stringify(Object.keys(her).sort()) !== JSON.stringify(Object.keys(saldo).sort()) || Object.keys(saldo).some(k => Number(her[k]) !== Math.max(Number(saldo[k]), 0))) errores.push("herencia mal: " + JSON.stringify({ her, saldo }));
  await P.screenshot({ path: "/tmp/w_turno_nuevo.png" });
  const otra = await val.page.evaluate(() => api("webTurnoAbrir", 1, false).then(() => "sin error", e => e.message));
  if (!/Ya está abierto/.test(otra)) errores.push("se pudo abrir otro turno: " + otra);
  let carrera = "sin error";
  try { psql(`select guardar_filas('${tkA}', ${lit([{ tabla: "turnos", poner: [{ id: "TCARRERA", numero: 1, estado: "ABIERTO", inicio: "2026-09-28T10:00:00-05:00" }] }])}::jsonb);`); } catch (e) { carrera = String(e.stderr || e.message); }
  if (!/Alguien más acaba de abrir/.test(carrera)) errores.push("dos turnos abiertos a la vez: " + carrera.slice(0, 150));
  // --- Fase 4c: conciliación, pre-conciliación, historiales, PDF y usuarios ---
  const cAb = q("select id from conciliaciones where estado='ABIERTA'");
  let cst = await P.evaluate(() => api("webConc"));
  if (!cst.conc || cst.conc.id !== cAb) errores.push("webConc no trae la conciliación abierta: " + JSON.stringify(cst.conc && cst.conc.id));
  const skC2 = cst.items.some(x => x.sku === "2222") ? "3617" : "2222";
  await P.evaluate(s2 => api("webConcAgregar", [{ sku: s2 }]), skC2);
  if (q(`select count(*) from conc_items where conc_id='${cAb}' and sku='${skC2}'`) !== "1") errores.push("agregar a la conciliación no llegó");
  await P.evaluate(s2 => api("webConcGuardar", s2, { bodega: 10, ka: 2, pk: "", fact: 20, bloqueo: true }), skC2);
  const fc = q(`select bodega || '|' || ka || '|' || coalesce(pk::text,'vacío') || '|' || facturacion || '|' || bloqueo || '|' || usuario from conc_items where conc_id='${cAb}' and sku='${skC2}'`);
  if (fc !== "10|2|vacío|20|true|Huber") errores.push("guardar en la conciliación: " + fc);
  // Reempaque por área: se suma al total (10 + 2 + 4 + 3 = 19) y «Reempaque» queda con la suma
  await P.evaluate(s2 => api("webConcGuardar", s2, { reemp_ka: 4, reemp_bodega: 3 }), skC2);
  const fr = q(`select coalesce(reemp_bodega::text,'') || '|' || coalesce(reemp_ka::text,'') || '|' || coalesce(reemp_pk::text,'vacío') || '|' || reempaque from conc_items where conc_id='${cAb}' and sku='${skC2}'`);
  if (fr !== "3|4|vacío|7") errores.push("conciliación: reempaque por área no se guardó: " + fr);
  const itR = (await P.evaluate(() => api("webConc"))).items.find(x => x.sku === skC2);
  if (!itR || itR.total !== 19 || itR.reempaque !== 7) errores.push("conciliación: el reempaque no se suma al total: " + JSON.stringify(itR && [itR.total, itR.reempaque]));
  {
    const mv = await nueva({ width: 390, height: 844 }, "conc-movil");
    await mv.page.goto("http://127.0.0.1:8766/"); await mv.page.waitForSelector("#lgN");
    await mv.page.fill("#lgN", "Huber"); await mv.page.fill("#lgP", "1234"); await mv.page.click("#lgB"); await mv.page.waitForSelector(".kpis", { timeout: 15000 });
    await mv.page.evaluate(s2 => { S.abiertos.conc = { [s2]: true }; ir("conciliacion"); }, skC2); await mv.page.waitForTimeout(1500);
    const card = `.conc-card[data-row="${skC2}"]`;
    const pos = await mv.page.$$eval(`${card} .cc-zonas input`, is => is.map(i => Math.round(i.getBoundingClientRect().top)));
    if (pos.length !== 6 || new Set(pos.slice(0, 3)).size !== 1 || new Set(pos.slice(3)).size !== 1 || pos[3] <= pos[0]) errores.push("conciliación (celular): Bodega/KA/PK no salen en una fila con su reempaque debajo: " + pos);
    const fy = await mv.page.$eval(`${card} .cc-fact input`, i => Math.round(i.getBoundingClientRect().top)).catch(() => 0);
    if (!(fy > pos[3])) errores.push("conciliación (celular): la facturación no queda en la tercera fila");
    const ancho = await mv.page.evaluate(() => document.documentElement.scrollWidth);
    if (ancho > 392) errores.push("conciliación (celular): la página se sale de lado: " + ancho);
    await mv.page.$eval(card, e => e.scrollIntoView()); await mv.page.screenshot({ path: "/tmp/m_conc_reemp.png" });
    await mv.ctx.close();
  }
  await P.evaluate(s2 => api("webConcQuitar", s2), skC2);
  if (q(`select count(*) from conc_items where conc_id='${cAb}' and sku='${skC2}'`) !== "0") errores.push("quitar de la conciliación falló");
  await val.page.evaluate(() => api("webPreAgregar", "3617", "Costeñita", "revisar desde la web"));
  const idPre = q("select id from preconciliacion where motivo='revisar desde la web'");
  if (!idPre || q(`select usuario || '|' || estado from preconciliacion where id='${idPre}'`) !== "Ana María|PENDIENTE") errores.push("pre-conciliación no llegó");
  const dupPre = await P.evaluate(() => api("webPreAgregar", "3617", "x", "").then(() => "sin error", e => e.message));
  if (!/ya está anotado/.test(dupPre)) errores.push("pre-conciliación repetida no avisa: " + dupPre);
  await P.evaluate(i => api("webPreQuitar", i), idPre);
  if (q(`select count(*) from preconciliacion where id='${idPre}'`) !== "0") errores.push("quitar pre-conciliación falló");
  const cc = await P.evaluate(() => api("webConcCerrar", { nota: "cierre web", telegram: false }));
  if (q(`select estado || '|' || cerrado_por || '|' || nota from conciliaciones where id='${cAb}'`) !== "CERRADA|Huber|cierre web") errores.push("cerrar conciliación falló");
  if (!cc.pdf || !Buffer.from(cc.pdf.b64, "base64").toString("latin1").startsWith("%PDF")) errores.push("al cerrar la conciliación no salió el PDF");
  const cn = await P.evaluate(() => api("webConcAbrir", { numero: 3, pocos: false, entrega: false, pre: [] }));
  const cAb2 = q("select id from conciliaciones where estado='ABIERTA'");
  if (!cAb2 || cAb2 !== cn.resultado.id) errores.push("abrir conciliación falló");
  // Validación: agregar productos de la conciliación de este turno (o del anterior), con sus conteos
  {
    const skVc = q(`select sku from sku where sku ~ '^[0-9]+$' and sku not in (select sku from val_productos where turno_id='${T2}') order by sku limit 1`);
    await P.evaluate(s2 => api("webConcAgregar", [{ sku: s2 }]), skVc);
    await P.evaluate(s2 => api("webConcGuardar", s2, { bodega: "", ka: 7, pk: 3, fact: "", bloqueo: false }), skVc);
    const vc = await P.evaluate(() => api("webValConc"));
    const it = vc.length && vc[0].items.find(x => x.sku === skVc);
    if (!it || vc[0].cual !== "este" || it.total !== 10) errores.push("validación: webValConc no trae la conciliación de este turno: " + JSON.stringify(vc).slice(0, 300));
    await P.evaluate(() => ir("validacion")); await P.waitForTimeout(900);
    await P.click('[data-a="agregar"]'); await P.waitForSelector("#agCo"); await P.waitForTimeout(400);
    await P.check("#agCo"); await P.waitForSelector(`#agCL input[data-sku="${skVc}"]`, { timeout: 8000 }).catch(() => {});
    if (!(await P.$(`#agCL input[data-sku="${skVc}"]`))) errores.push("validación: la lista de la conciliación no sale al agregar");
    else {
      await P.check(`#agCL input[data-sku="${skVc}"]`); await P.waitForTimeout(300);
      await P.screenshot({ path: "/tmp/w_val_conc.png" });
      await P.waitForTimeout(300); await P.click("#agOk"); await P.waitForTimeout(1800);
      const ini = q(`select inicial || '|' || coalesce(ka::text,'') || '|' || coalesce(pk::text,'') from val_productos where turno_id='${T2}' and sku='${skVc}'`);
      if (ini !== "10|7|3") errores.push("validación: agregar desde la conciliación no dejó sus conteos: " + ini);
    }
    await P.evaluate(() => { if (modalAbierto()) cerrarModal(true); });
    await P.evaluate(s2 => api("webConcQuitar", s2), skVc);
  }
  // Historial: resumen, abrir un turno cerrado viejo, editarlo, eliminar y restaurar
  const hl = await P.evaluate(() => api("webHistorial", { tipo: "VALIDACION" }));
  const hT = hl.find(x => x.id === T);
  const esperado = q(`select count(*) || '|' || (select count(*) from val_registros where turno_id='${T}' and estado='ACTIVO') from val_productos where turno_id='${T}'`);
  if (!hT || `${hT.resumen[0][1]}|${hT.resumen[1][1]}` !== esperado) errores.push(`resumen del historial: ${hT && JSON.stringify(hT.resumen)} (esperado ${esperado})`);
  const viejo = q("select id from turnos where estado='CERRADO' order by inicio limit 1");
  const vv = await P.evaluate(i => api("webVal", i), viejo);
  if (!vv.historial || !vv.cerrado || vv.turno.id !== viejo) errores.push("abrir un turno viejo del historial falló");
  const pV = vv.productos.find(x => x.disponible > 0);
  if (pV) {
    await P.evaluate(a2 => api("webValRegistrar", { sku: a2[1], destino: "KA", cantidad: 1, nota: "olvidada", hora: "2026-09-27T02:00" }, a2[0]), [viejo, pV.sku]);
    if (q(`select count(*) from val_registros where turno_id='${viejo}' and nota='olvidada' and modificado_por like 'Agregado después del cierre por Huber%'`) !== "1") errores.push("validación olvidada en turno viejo no llegó");
    if (!/^Huber · /.test(q(`select coalesce(editado_por,'') from turnos where id='${viejo}'`))) errores.push("turno viejo no quedó como editado");
  }
  await P.evaluate(i => api("webTurnoEliminar", i), viejo);
  if (q(`select estado || '|' || (eliminado_por like 'Huber · %') from turnos where id='${viejo}'`) !== "ELIMINADO|true") errores.push("eliminar turno falló");
  await P.evaluate(i => api("webTurnoRestaurar", i), viejo);
  if (q(`select estado || '|' || coalesce(eliminado_por,'') from turnos where id='${viejo}'`) !== "CERRADO|") errores.push("restaurar turno falló");
  await P.evaluate(() => ir("hval")); await P.waitForTimeout(1200); await P.screenshot({ path: "/tmp/w_hval.png" });
  // PDF en el navegador
  const pdfV = await P.evaluate(i => api("webPDF", "VALIDACION", i), viejo);
  const binV = Buffer.from(pdfV.b64, "base64");
  if (!binV.toString("latin1").startsWith("%PDF")) errores.push("PDF de validación inválido");
  require("fs").writeFileSync("/tmp/w_validacion.pdf", binV);
  const pdfR = await P.evaluate(() => api("webPDF", "RESUMEN"));
  require("fs").writeFileSync("/tmp/w_resumen.pdf", Buffer.from(pdfR.b64, "base64"));
  const pdfE = await P.evaluate(i => api("webPDF", "ENTREGA", i), T);
  require("fs").writeFileSync("/tmp/w_entrega.pdf", Buffer.from(pdfE.b64, "base64"));
  const pdfC = await P.evaluate(() => api("webPDF", "CONSUMO"));
  require("fs").writeFileSync("/tmp/w_consumo.pdf", Buffer.from(pdfC.b64, "base64"));
  pedidos.length = 0; respSync = { ok: true };
  await P.evaluate(() => api("webPDFTelegram", "POCOS"));
  const pt = pedidos.find(x => x.accion === "pdf_telegram");
  if (!pt || !Buffer.from(pt.b64, "base64").toString("latin1").startsWith("%PDF") || !/Pocos|POCOS|pocos/.test(pt.caption + pt.nombre)) errores.push("PDF a Telegram mal enviado: " + JSON.stringify(pt && { nombre: pt.nombre, caption: pt.caption }));
  // Usuarios y PIN
  let us = await P.evaluate(() => api("webUsuarios"));
  if (!us.some(u => u.nombre === "Ana María")) errores.push("lista de usuarios: " + JSON.stringify(us));
  us = await P.evaluate(() => api("webUsuarioGuardar", { nombreOriginal: "", nombre: "Prueba Web", rol: "validador", pin: "4321", activo: true }));
  if (!us.some(u => u.nombre === "Prueba Web") || !JSON.parse(psql("select ingresar('Prueba Web','4321')::text;")).ok) errores.push("usuario nuevo no puede entrar");
  const pinMal = await P.evaluate(() => api("webUsuarioGuardar", { nombreOriginal: "", nombre: "Otro", rol: "lector", pin: "12", activo: true }).then(() => "sin error", e => e.message));
  if (!/PIN/.test(pinMal)) errores.push("PIN corto no avisa: " + pinMal);
  us = await P.evaluate(() => api("webUsuarioEliminar", "Prueba Web"));
  if (us.some(u => u.nombre === "Prueba Web")) errores.push("borrar usuario falló");
  const valNo = await val.page.evaluate(() => api("webUsuarios").then(() => "sin error", e => e.message));
  if (!/permiso|administrador/i.test(valNo)) errores.push("un validador ve los usuarios: " + valNo);
  await P.evaluate(() => api("webCambiarPin", "1234", "9876"));
  if (!JSON.parse(psql("select ingresar('Huber','9876')::text;")).ok) errores.push("cambiar PIN falló");
  await P.evaluate(() => api("webCambiarPin", "9876", "1234"));
  // --- Ajustes de pantalla (29/09) ---
  await P.evaluate(() => ir("validacion")); await P.waitForTimeout(900);
  const nCards = await P.$$eval(".vlista .vcard", c => c.length);
  const abiertas0 = await P.$$eval(".vlista .vcard .pl-cuerpo", c => c.filter(x => x.offsetParent !== null).length);
  if (!nCards || abiertas0) errores.push(`validación: ${nCards} tarjetas, ${abiertas0} abiertas al entrar (deben estar cerradas)`);
  await P.click(".vlista .vcard .pl-cab"); await P.waitForTimeout(200);
  if (!(await P.$eval(".vlista .vcard", c => c.classList.contains("abierto") && !!c.querySelector(".vc-horas") && c.querySelector(".pl-cuerpo").offsetParent !== null))) errores.push("tocar un producto no lo despliega");
  // Las horas quedan escondidas detrás del reloj
  if (await P.$eval(".vlista .vcard .vc-horas", e => e.offsetParent !== null)) errores.push("las horas de conteo se ven sin tocar el reloj");
  await P.click(".vlista .vcard .reloj"); await P.waitForTimeout(150);
  const horas = await P.$eval(".vlista .vcard .vc-horas", e => e.offsetParent !== null ? e.innerText : "");
  if (!/^🕐 Contado[\s\S]*Última validación/.test(horas)) errores.push("el reloj no muestra las horas: " + horas);
  await P.fill("#vq", "zzzz-no-existe"); await P.waitForTimeout(150);
  if (await P.$$eval(".vlista .vcard:not(.hidden)", c => c.length)) errores.push("el buscador de validación no filtra");
  await P.fill("#vq", ""); await P.waitForTimeout(100);
  await P.screenshot({ path: "/tmp/w_val_plegable.png" });
  // Entrega: quitar toda una sección
  const T3 = turnoAb();
  await P.evaluate(() => api("webEntPrecargar", ["TPC"]));
  const nTpc = q(`select count(*) from ent_items where turno_id='${T3}' and seccion='TPC'`);
  await P.evaluate(() => api("webEntQuitarSeccion", "TPC"));
  if (nTpc === "0" || q(`select count(*) from ent_items where turno_id='${T3}' and seccion='TPC'`) !== "0") errores.push(`quitar sección TPC: había ${nTpc}`);
  await P.evaluate(() => ir("entrega")); await P.waitForTimeout(900); await P.screenshot({ path: "/tmp/w_ent_plegable.png" });
  // Fechas escritas a mano
  await P.evaluate(() => ir("limbo")); await P.waitForTimeout(800);
  await P.evaluate(() => { const d = document.querySelector("#view details"); if (d) d.open = true; });
  const ft = await P.$("#view .lb-nuevo .fecha-caja:has([data-l=fecha]) .fecha-txt");
  if (!ft) errores.push("limbo: la fecha no se puede escribir a mano");
  else { await ft.click(); await ft.type("10052027"); await P.waitForTimeout(100); const iso = await P.$eval(".lb-nuevo [data-l=fecha]", e => e.value); const vis = await ft.evaluate(e => e.value); if (iso !== "2027-05-10" || vis !== "10/05/2027") errores.push(`fecha a mano: ${vis} → ${iso}`); }
  // Refrescar
  const nR = llamadasSb;
  await P.click("#refBtn"); await P.waitForTimeout(1500);
  if (llamadasSb === nR) errores.push("↻ no volvió a pedir los datos");
  if (await P.isVisible("#backBtn")) errores.push("en la versión web sigue el botón atrás");
  // Vacíos agrupados por pasillo (con Capacidad_Bodega)
  const vac = await P.evaluate(() => api("webVacios"));
  if (!vac.length || !vac.every(x => x.sec)) errores.push("vacíos sin pasillo: " + JSON.stringify(vac.slice(0, 3)));
  await P.evaluate(() => ir("vacios")); await P.waitForTimeout(700); await P.screenshot({ path: "/tmp/w_vacios.png" });
  // Canal no disponible en rojo claro
  await P.evaluate(() => { ls.set("ultSku", "2222"); ir("stock"); }); await P.waitForTimeout(700);
  const bgNo = await P.$eval(".canal.no", e => getComputedStyle(e).backgroundColor).catch(() => "sin canal no");
  if (bgNo !== "rgb(255, 208, 208)") errores.push("canal no disponible sin fondo rojo claro: " + bgNo);
  if (!(await P.$(".inv .fefo"))) errores.push("stock sin numeración FEFO");
  await P.screenshot({ path: "/tmp/w_stock_nuevo.png" });
  // Ayuda «?»
  const subVis = await P.$eval("#view .vh .sub", e => e.offsetParent !== null);
  await P.click("#view [data-ayuda]"); await P.waitForTimeout(100);
  const subVis2 = await P.$eval("#view .vh .sub", e => e.offsetParent !== null);
  if (subVis || !subVis2) errores.push("la ayuda «?» no funciona");
  await P.evaluate(() => ir("consumo")); await P.waitForTimeout(900); await P.screenshot({ path: "/tmp/w_consumo.png" });
  if (await P.$("#ca") || await P.$("[data-del]")) errores.push("consumo: todavía tiene el panel de la lista");
  await P.evaluate(() => ir("consumolista")); await P.waitForTimeout(900); await P.screenshot({ path: "/tmp/w_consumolista.png" });
  if (!(await P.$("#clA")) || !(await P.$("[data-a=mod]"))) errores.push("administración: falta la lista de consumo (agregar / cambiar módulo)");
  if (!(await P.evaluate(() => $$("#nav a[data-v=consumolista]").length))) errores.push("menú: falta Lista de consumo");
  await P.click("[data-a=mod]"); await P.waitForTimeout(400);
  if (!(await P.$(".cl-op"))) errores.push("lista de consumo: el modal de módulos no abrió");
  await P.screenshot({ path: "/tmp/w_consumolista_mod.png" });
  await P.evaluate(() => cerrarModal(true));
  await P.evaluate(() => ir("fechas", { dias: 400, est: "BLOQ" })); await P.waitForTimeout(700);
  const fe = await P.evaluate(() => ({ on: ($("#fe .on") || {}).dataset ? $("#fe .on").dataset.f : "", n: $("#lfc") ? $("#lfc").textContent : "" }));
  if (fe.on !== "BLOQ") errores.push("fechas cortas: no quedó en Bloqueadas: " + JSON.stringify(fe));
  await P.screenshot({ path: "/tmp/w_fechas.png" });
  await P.evaluate(() => ir("retornables")); await P.waitForTimeout(700); await P.screenshot({ path: "/tmp/w_retornables.png" });
  await P.evaluate(() => ir("conciliacion")); await P.waitForTimeout(1000); await P.screenshot({ path: "/tmp/w_conciliacion.png" });
  await P.evaluate(() => ir("usuarios")); await P.waitForTimeout(800); await P.screenshot({ path: "/tmp/w_usuarios.png" });
  await P.evaluate(() => ir("validacion")); await P.waitForTimeout(800); await P.screenshot({ path: "/tmp/w_validacion.png" });
  await P.evaluate(() => ir("entrega")); await P.waitForTimeout(800); await P.screenshot({ path: "/tmp/w_entrega.png" });
  await cel.page.evaluate(() => ir("validacion")); await cel.page.waitForTimeout(1500); await cel.page.screenshot({ path: "/tmp/m_w_validacion.png" });
  // --- Menú desplegable, «por confirmar», sugerencias del WMS y reportes de módulos ---
  const navG = await P.evaluate(() => { const g = [...document.querySelectorAll("#nav .nav-g")].find(x => !x.classList.contains("abierto")); if (!g) return null; g.querySelector("[data-navg]").click(); return g.classList.contains("abierto"); });
  if (navG !== true) errores.push("menú: la sección no se despliega al tocarla");
  if (!(await P.evaluate(() => $("#nav a.on") && $("#nav a.on").closest(".nav-g.abierto") !== null || S.vista === "inicio"))) errores.push("menú: la sección de la pantalla actual no está abierta");
  await P.evaluate(() => ir("validacion")); await P.waitForTimeout(800);
  const pc = await P.evaluate(async () => {
    if (!S.val || !S.val.productos.length) return "sin productos";
    modalInicial(S.val.productos[0]); await new Promise(r => setTimeout(r, 200));
    const i = $("#iC"); if (!i) return "sin casilla";
    const antes = i.checked; $("#modal .solo-cuadro span").click(); $("#modal .m-cifras").click();
    const r = i.checked === antes && !i.closest("label") ? "ok" : "se marca sin tocar el cuadrito";
    cerrarModal(true); return r;
  });
  if (pc !== "ok") errores.push("por confirmar: " + pc);
  const wms0 = await P.evaluate(() => /WMS \d/.test($("#view").innerText));
  await P.evaluate(async () => { S.usuario.prefs = await api("webPref", "wmsSug", true); repintar(); }); await P.waitForTimeout(800);
  const wms1 = await P.evaluate(() => /WMS \d/.test($("#view").innerText));
  if (wms0 || !wms1) errores.push(`sugerencias del WMS: por defecto ${wms0 ? "se ven" : "ocultas"}, activadas ${wms1 ? "se ven" : "no se ven"}`);
  if (q("select prefs->>'wmsSug' from perfiles where nombre='Huber'") !== "true") errores.push("la preferencia no se guardó en Supabase");
  await P.evaluate(async () => { S.usuario.prefs = await api("webPref", "wmsSug", false); });
  // Verificador (celular): solo sus pantallas, reporta un vacío
  const tkAdm = JSON.parse(psql("select ingresar('Huber','1234')::text;", "anon")).token;
  psql("delete from perfiles where nombre='Vero'; delete from reportes_modulo;", "postgres");
  psql(`select usuario_guardar(${lit(tkAdm)}, '', 'Vero', 'verificador', '2468', true);`, "anon");
  const ve = await nueva({ width: 390, height: 844 }, "verificador"), V = ve.page;
  await V.goto("http://127.0.0.1:8766/"); await V.waitForSelector("#lgN");
  await V.fill("#lgN", "Vero"); await V.fill("#lgP", "2468"); await V.click("#lgB");
  await V.waitForSelector("#rvQ", { timeout: 15000 });
  const navV = await V.evaluate(() => $$("#nav a[data-v]").map(a => a.dataset.v).sort().join(","));
  if (navV !== "enconsumo,modulo,pocosvig,producto,repconflicto,repgen,repvacio,stock") errores.push("verificador ve en el menú: " + navV);
  // Sincronizar con el WMS: solo rotador o administrador
  if (!(await V.isVisible("#syncBtn"))) errores.push("verificador: no ve el botón Sincronizar");
  const syncV = await V.evaluate(() => api("webSincronizar").then(() => "sin error", e => e.message));
  // El verificador ya puede sincronizar: no lo frena el rol (aquí Apps Script no está configurado y falla la conexión)
  if (/Solo el/.test(syncV)) errores.push("verificador: no lo deja sincronizar: " + syncV);
  const barV = await V.evaluate(() => $$("#bottombar button").map(b => b.dataset.v).join(","));
  if (barV !== "repvacio,repconflicto,repgen,stock") errores.push("verificador: barra de abajo " + barV);
  await V.evaluate(() => ir("validacion")); await V.waitForTimeout(300);
  if (await V.evaluate(() => S.vista) !== "repvacio") errores.push("el verificador pudo abrir validación");
  const modV = q("select modulo from wms_base where coalesce(estibas,0)+coalesce(cajas,0)+coalesce(unidades,0) > 0 and modulo ~ '^[A-J][0-9]+$' order by modulo limit 1");
  await V.fill("#rvQ", modV); await V.waitForTimeout(200);
  if (!(await V.$(".rep-busca .ac-mod"))) errores.push("reportar vacío: el buscador no sugiere módulos");
  await V.press("#rvQ", "Enter"); await V.waitForTimeout(300);
  // Un módulo a la vez: sale la tarjeta «¿Reportar … como vacío?» y con Aceptar queda reportado
  if (!/Reportar/.test(await V.textContent("#modalCard").catch(() => "")) || !(await V.$("#rvOk"))) errores.push("reportar vacío: no sale la tarjeta para confirmar");
  if (q(`select count(*) from reportes_modulo where modulo='${modV}'`) !== "0") errores.push("reportar vacío: reportó antes de aceptar");
  await V.screenshot({ path: "/tmp/m_w_repvacio.png" });
  await V.waitForTimeout(400); await V.click("#rvOk");
  await V.waitForFunction(() => /Reportado vacío|No se|rror/.test($("#toasts").innerText), null, { timeout: 15000 }).catch(() => {});
  if (q(`select tipo || '|' || reportado_por || '|' || estado from reportes_modulo where modulo='${modV}'`) !== "VACIO|Vero|PENDIENTE") errores.push("reporte de vacío no llegó: " + q("select to_jsonb(r) from reportes_modulo r") + " · " + (await V.$eval("#toasts", e => e.innerText)) + " · " + modV);
  await V.evaluate(m => ir("repconflicto", { m: m }), modV); await V.waitForTimeout(500);
  if (!(await V.$("#rcP"))) errores.push("conflicto: no abrió el formulario del módulo");
  await V.screenshot({ path: "/tmp/m_w_repconflicto.png" });
  await V.evaluate(() => ir("repgen")); await V.waitForTimeout(800); await V.screenshot({ path: "/tmp/m_w_reportes.png" });
  if (await V.$("[data-ok]")) errores.push("el verificador ve «Marcar completado»");
  // El módulo reportado sale con su etiqueta y sin puesto FEFO; el administrador lo completa
  await P.evaluate(() => api("webReportes").then(d => guardarRep(d.lista)));
  await P.evaluate(m => ir("modulo", { mod: m }), modV); await P.waitForTimeout(700);
  if (!(await P.$(".tag.t-rv"))) errores.push("el módulo reportado no muestra «Reportado como vacío»");
  const nBadge = await P.evaluate(() => ($("#nav .nav-n") || {}).textContent);
  if (nBadge !== "1") errores.push("contador de reportes pendientes: " + nBadge);
  await P.evaluate(() => ir("repgen")); await P.waitForTimeout(800); await P.screenshot({ path: "/tmp/w_repgen.png" });
  if (await P.$("[data-ok]")) { await P.click("[data-ok]"); await P.waitForSelector("#cfOk"); await P.waitForTimeout(500); await P.click("#cfOk"); await P.waitForTimeout(1000); }
  else errores.push("reportes generados (admin): sin «Marcar completado»: " + (await P.$eval("#view", e => e.innerText.slice(0, 80))) + " · " + (await P.evaluate(() => api("webReportes").then(d => JSON.stringify(d).slice(0, 300), e => "ERR " + e.message))) + " · BD " + q("select count(*) from reportes_modulo"));
  if (q(`select estado || '|' || completado_por || '|' || cierre from reportes_modulo where modulo='${modV}'`) !== "COMPLETADO|Huber|MANUAL") errores.push("completar reporte falló");
  psql("delete from reportes_modulo; delete from perfiles where nombre='Vero';", "postgres");
  // --- Stock por SKU: ocupación del módulo y «único módulo» ---
  await P.evaluate(() => { ls.set("ultSku", "2222"); ir("stock"); }); await P.waitForTimeout(700);
  if (!(await P.$(".inv .tag.t-lleno, .inv .tag.t-inc"))) errores.push("stock: falta la etiqueta de estibas del módulo (lleno / incompleto)");
  await P.screenshot({ path: "/tmp/w_stock_ocup.png" });
  // --- Rotular ---
  await P.evaluate(() => ir("rotular")); await P.waitForTimeout(700);
  await P.click("[data-a=nueva]"); await P.waitForSelector("#rnOk"); await P.click('#rnT [data-n="1"]'); await P.waitForTimeout(500); await P.click("#rnOk");
  await P.waitForSelector("#roQ", { timeout: 10000 });
  const modR = await P.evaluate(() => S.inv.find(i => i.fis && i.disp && /^[A-J]\d+$/.test(i.m)).m);
  await P.fill("#roQ", modR); await P.waitForTimeout(200);
  const sugR = await P.$$eval(".rot-agregar .ac-mod", o => o.length);
  if (!sugR) errores.push("rotular: el buscador de módulo no sugiere");
  await P.press("#roQ", "Enter"); await P.waitForTimeout(300);
  // (antes de seguir: un módulo inexistente avisa ahí mismo)
  const fR0 = await P.evaluate(() => !!$("#roP"));
  if (!fR0) errores.push("rotular: Enter con el módulo escrito no abrió el formulario");
  const fR = await P.evaluate(() => ({ p: $("#roP") && $("#roP").value, e: $("#roE") && $("#roE").value, v: $("#roV") && $("#roV").value }));
  if (!fR.p || !fR.e || !fR.v) errores.push("rotular: el sistema no llenó producto / estibas / vencimiento: " + JSON.stringify(fR));
  await P.fill("#roE", "7"); await P.click("#roOk"); await P.waitForTimeout(1200);
  await P.screenshot({ path: "/tmp/w_rotular.png" });
  const fila = q(`select modulo || '|' || estibas || '|' || estibas_sis::text || '|' || agregado_por from rotulo_items order by id desc limit 1`);
  if (!fila.startsWith(modR + "|7|") || !fila.endsWith("|Huber")) errores.push("rotular: el módulo no quedó guardado: " + fila);
  await P.click(".rot-row [data-mk=impreso]"); await P.waitForTimeout(900);
  if (q("select impreso || '|' || impreso_por from rotulo_items order by id desc limit 1") !== "true|Huber") errores.push("rotular: la marca de impreso no se guardó");
  // PDF, vista y foto de la rotulación (botones en la cabecera)
  if (!(await P.$('[data-pdf="ROTULACION"]')) || !(await P.$('[data-jpg="ROTULACION"]'))) errores.push("rotular: faltan los botones de PDF / foto");
  const idRot = await P.$eval('[data-pdf="ROTULACION"]', b => b.dataset.id);
  const hRot = await P.evaluate(i => api("webPDFHtml", "ROTULACION", i), idRot);
  if (!/ROTULACI/.test(hRot.html) || hRot.html.indexOf(modR) < 0 || !/Rotulacion_T1_\d{8}\.pdf/.test(hRot.nombre)) errores.push("rotular: el HTML del PDF no trae el módulo: " + hRot.nombre);
  const pRot = await P.evaluate(i => api("webPDF", "ROTULACION", i), idRot);
  if (!pRot || atob(pRot.b64.slice(0, 8)).slice(0, 4) !== "%PDF") errores.push("rotular: el PDF no salió");
  const fRot = await P.evaluate(i => api("webPDFFotos", "ROTULACION", i), idRot);
  if (!fRot.fotos || !fRot.fotos.length || !/^data:image\/jpeg/.test(fRot.fotos[0])) errores.push("rotular: la foto no salió");
  else require("fs").writeFileSync("/tmp/w_rot_foto.jpg", Buffer.from(fRot.fotos[0].split(",")[1], "base64"));
  const bajada = P.waitForEvent("download", { timeout: 20000 }).catch(() => null);
  await P.click('[data-jpg="ROTULACION"]');
  const dl = await bajada;
  if (!dl || !/\.jpg$/.test(dl.suggestedFilename())) errores.push("rotular: el botón de foto no descargó un JPG");
  await P.evaluate(() => ir("rotular")); await P.waitForTimeout(700); await P.screenshot({ path: "/tmp/w_rotulaciones.png" });
  q("delete from rotulaciones");
  // --- El usuario va de primero en el menú (no arriba) ---
  if (await P.isVisible("#userChip") || !(await P.$("#nav > a.nav-user[data-usuario]:first-child"))) errores.push("usuario: no está de primero en el menú o sigue arriba");
  await P.click("#nav a.nav-user"); await P.waitForSelector("#lgOut"); await P.evaluate(() => cerrarModal(true));
  // --- Sincronización vieja: punto rojo en «Sincronizar», sin franja ---
  {
    const r = await P.evaluate(() => { const t = S.sync.ts; S.sync.ts = Date.now() - 4 * 3600e3; pintarRecordatorio(); const a = $("#syncBtn").classList.contains("atrasada") && !$("#syncRec"); S.sync.ts = t; pintarRecordatorio(); return a && !$("#syncBtn").classList.contains("atrasada"); });
    if (!r) errores.push("sincronización vieja: no sale el punto rojo (o queda la franja)");
  }
  // --- Ajustes sin WMS (WMS caído) en «✍️ Actualizar módulos» (rotador / administrador) ---
  {
    const lt = await P.evaluate(() => { const i = S.inv.find(x => x.fis && x.disp && x.cpe > 1 && x.e >= 2 && /^[A-J]\d+$/.test(x.m)); return { m: i.m, s: i.s }; });
    const cj = () => Number(q(`select coalesce(sum(cajas),0) from wms_base where modulo='${lt.m}' and sku='${lt.s}'`));
    const cpe = Number(q(`select max(cajas_por_estiba) from wms_base where modulo='${lt.m}' and sku='${lt.s}'`)), cj0 = cj();
    const sec = lt.m.replace(/\d.*$/, "");
    // Por módulo quedó como antes: sin opciones de ajuste
    await P.evaluate(m => ir("modulo", { mod: m }), lt.m); await P.waitForTimeout(700);
    if (await P.$("#view [data-fijar], #view [data-borrar], #view [data-sacar], #view [data-poner], #view [data-bloquear]")) errores.push("Por módulo: todavía tiene opciones de ajuste");
    // Saqué (verificador u otro): sigue existiendo por API
    await P.evaluate(a => api("webAjusteSacar", { modulo: a.m, sku: a.s, cant: "1", unidad: "est" }).then(guardarAjustes), lt);
    if (cj() !== cj0 - cpe) errores.push(`sin WMS: «Saqué 1 estiba» no descontó (${cj0} → ${cj()}, cpe ${cpe})`);
    await P.evaluate(() => cargarInv(true)); await P.evaluate(m => ir("modulo", { mod: m }), lt.m); await P.waitForTimeout(700);
    if (!/Actualizado a mano: ➖ Sacaron/.test(await P.textContent("#view").catch(() => ""))) errores.push("tarjeta: no muestra la última actualización a mano");
    // Actualizar: la sección en orden, con semáforo
    if (!(await P.$('#nav a[data-v="actualizar"]'))) errores.push("actualizar: no está en el menú del administrador");
    await P.evaluate(s0 => { ls.set("amSolo", ""); ir("actualizar", { sec: s0 }); }, sec); await P.waitForTimeout(900);
    const modsA = await P.$$eval(".act-mod", cs => cs.map(c => c.dataset.mod));
    const ordenOk = modsA.every((m, k) => !k || modsA[k - 1].localeCompare(m, undefined, { numeric: true }) < 0);
    if (!modsA.length || !ordenOk || modsA.some(m => m.replace(/\d.*$/, "") !== sec)) errores.push("actualizar: la sección no sale en orden: " + modsA.slice(0, 8));
    if (!(await P.$(`.act-mod.ok[data-mod="${lt.m}"]`))) errores.push("actualizar: el módulo con «Saqué» no sale en verde");
    // Reportado vacío / conflicto: etiqueta en la tarjeta
    {
      const mR = modsA.find(m => m !== lt.m);
      await P.evaluate(m => api("webReporteCrear", [{ tipo: "VACIO", modulo: m, nota: "prueba" }, { tipo: "CONFLICTO", modulo: m, sku_encontrado: "2222", producto_encontrado: "Pony", nota: "prueba" }]).then(r => guardarRep(r.lista)), mR);
      await P.evaluate(s0 => ir("actualizar", { sec: s0 }), sec); await P.waitForTimeout(800);
      const tg = await P.textContent(`.act-mod[data-mod="${mR}"] .ac-cab`).catch(() => "");
      if (!/Reportado vacío/.test(tg) || !/Conflicto reportado/.test(tg)) errores.push("actualizar: la tarjeta no dice que fue reportado vacío / conflicto: " + tg);
      q(`delete from reportes_modulo where modulo='${mR}'`); await P.evaluate(() => api("webReportes").then(r => guardarRep(r.lista)));
      await P.evaluate(s0 => ir("actualizar", { sec: s0 }), sec); await P.waitForTimeout(700);
    }
    // ✏️ Corregir; luego dice el puesto FEFO
    await P.click(`.act-mod [data-fijar="${lt.s}|${lt.m}"]`); await P.waitForSelector("#ajC"); await P.waitForTimeout(500);
    await P.fill("#ajC", "3"); await P.click("#ajOk"); await P.waitForTimeout(1800);
    if (cj() !== 3 * cpe) errores.push(`sin WMS: «Corregir» a 3 estibas dejó ${cj()} cajas`);
    await P.screenshot({ path: "/tmp/w_aj_fijar.png" });
    await P.evaluate(() => api("webAjusteDeshacer", ajustesTodos().find(x => x.fijar !== null).id).then(guardarAjustes)); await P.evaluate(() => cargarInv(true));
    if (cj() !== cj0 - cpe) errores.push("sin WMS: deshacer la corrección no volvió");
    // ✅ Está bien en otro módulo (rojo → verde) y quitar la marca
    const rojo = await P.$eval(".act-mod.falta", c => c.dataset.mod).catch(() => "");
    if (rojo) {
      await P.click(`.act-mod[data-mod="${rojo}"] [data-revok]`); await P.waitForTimeout(1200);
      if (!(await P.$(`.act-mod.ok[data-mod="${rojo}"]`)) || q(`select count(*) from revisiones_modulo where modulo='${rojo}' and not quitada`) !== "1") errores.push("actualizar: «Está bien» no lo puso en verde");
      await P.click('#acF [data-f="1"]'); await P.waitForTimeout(300);
      if (await P.$(`.act-mod[data-mod="${rojo}"]`)) errores.push("actualizar: «Solo los que faltan» muestra uno revisado");
      await P.click('#acF [data-f=""]'); await P.waitForTimeout(300);
      // Switch «Estoy actualizando»: lo que falta gira en rojo, lo revisado en verde
      await P.click("#acModo"); await P.waitForTimeout(300);
      if (!(await P.$(".act-mod.modo.falta")) || !(await P.$(`.act-mod.modo.ok[data-mod="${rojo}"]`))) errores.push("actualizar: el switch no pone el modo de actualizar");
      if (await P.$(".act-mod .ac-prod .small:not(.ac-cant)")) {}
      const txtA = await P.textContent("#acL");
      if (!/Estibas: \d/.test(txtA) || !/Fecha de vencimiento: \d{2}\/\d{2}\/\d{4}/.test(txtA) || /Estibas: [\d.,]+ ?\|/.test(txtA)) errores.push("actualizar: las tarjetas no dicen «Estibas:» y «Fecha de vencimiento:»");
      await P.screenshot({ path: "/tmp/w_actualizar.png" });
      await P.click("#acModo"); await P.waitForTimeout(200);
      await P.click(`.act-mod[data-mod="${rojo}"] [data-revquitar]`); await P.waitForTimeout(1200);
      if (!(await P.$(`.act-mod.falta[data-mod="${rojo}"]`))) errores.push("actualizar: quitar ✅ no lo devolvió a rojo");
    } else errores.push("actualizar: no hay módulos en rojo para probar");
    // Guardar en un módulo nuevo con el botón de arriba (cualquier pantalla)
    await P.evaluate(() => ir("pocos")); await P.waitForTimeout(700);
    if (!(await P.isVisible("#ajFab"))) errores.push("sin WMS: no se ve el botón «Guardé producto» arriba");
    await P.click("#ajFab"); await P.waitForSelector("#ajM"); await P.waitForTimeout(500);
    await P.fill("#ajM", "z98"); await P.press("#ajM", "Tab"); await P.waitForTimeout(300);
    await P.fill("#ajP", lt.s); await P.waitForTimeout(300); await P.click("#ajP ~ .ac-list .ac-item"); await P.waitForTimeout(200);
    await P.fill("#ajV", "2027-02-01"); await P.click('#ajU [data-u="cj"]'); await P.fill("#ajC", "30"); await P.click("#ajOk"); await P.waitForTimeout(1800);
    if (q("select sku || '|' || cajas || '|' || estado from wms_base where modulo='Z98'") !== `${lt.s}|30|DISPONIBLE`) errores.push("sin WMS: «Guardé producto» no quedó en Z98");
    // Módulo vacío en Por módulo: dice por qué (sin opciones; lleva a Actualizar)
    await P.evaluate(() => ir("modulo", { mod: "Z96" })); await P.waitForTimeout(600);
    if (!/No aparece en el WMS/.test(await P.textContent(".mod-vacio").catch(() => "")) || !(await P.$(".mod-vacio [data-ir-act]"))) errores.push("Por módulo: el módulo vacío no explica o no lleva a Actualizar");
    // En Actualizar: 📥 Añadir otro, 🗑️ Quitar, añadir con reemplazo y 🔒 Bloquear
    {
      const otro = await P.evaluate(s0 => S.cat.find(c => c.sku !== s0 && S.inv.some(i => i.s === c.sku)).sku, lt.s);
      await P.evaluate(() => ir("actualizar", { sec: "Z" })); await P.waitForTimeout(800);
      await P.click('.act-mod[data-mod="Z98"] [data-poner="Z98"]'); await P.waitForSelector("#ajP"); await P.waitForTimeout(500);
      if (await P.isChecked("#ajR")) errores.push("sin WMS: «Añadir» viene marcado para reemplazar");
      await P.fill("#ajP", otro); await P.waitForTimeout(300); await P.click("#ajP ~ .ac-list .ac-item"); await P.waitForTimeout(200);
      await P.fill("#ajV", "2027-04-01"); await P.fill("#ajC", "2"); await P.click("#ajOk"); await P.waitForTimeout(1800);
      if (q("select count(*) from wms_base where modulo='Z98' and (cajas > 0 or estibas > 0)") !== "2") errores.push("sin WMS: «Añadir» no dejó los 2 productos en Z98");
      await P.click(`[data-borrar="${otro}|Z98"]`); await P.waitForSelector("#cfOk"); await P.waitForTimeout(500); await P.click("#cfOk"); await P.waitForTimeout(1800);
      if (q(`select coalesce(sum(cajas),0) from wms_base where modulo='Z98' and sku='${otro}'`) !== "0") errores.push("sin WMS: «Quitar» no dejó el producto en 0");
      if (await P.$(`[data-borrar="${otro}|Z98"]`)) errores.push("sin WMS: el producto quitado sigue en Actualizar");
      await P.click('.act-mod[data-mod="Z98"] [data-poner="Z98"]'); await P.waitForSelector("#ajP"); await P.waitForTimeout(500);
      await P.check("#ajR");
      await P.fill("#ajP", otro); await P.waitForTimeout(300); await P.click("#ajP ~ .ac-list .ac-item"); await P.waitForTimeout(200);
      await P.fill("#ajV", "2027-05-01"); await P.fill("#ajC", "1"); await P.click("#ajOk"); await P.waitForTimeout(1800);
      if (q("select string_agg(sku, ',') from wms_base where modulo='Z98' and (cajas > 0 or estibas > 0)") !== otro) errores.push("sin WMS: reemplazar no dejó solo lo nuevo");
      await P.click('.act-mod[data-mod="Z98"] [data-bloquear="Z98"]'); await P.waitForSelector("#blOk"); await P.waitForTimeout(500);
      await P.click('#blM [data-m="PRUEBA DE TRANSPORTE"]'); await P.fill("#blC", "E77"); await P.click("#blOk"); await P.waitForTimeout(1800);
      if (q("select string_agg(distinct estado || '/' || candado, ',') from wms_base where modulo='Z98' and (cajas > 0 or estibas > 0)") !== "PRUEBA DE TRANSPORTE/E77") errores.push("sin WMS: bloquear no quedó");
      if (!/BLOQ/.test(await P.textContent('.act-mod[data-mod="Z98"]'))) errores.push("actualizar: el módulo no sale bloqueado");
      await P.screenshot({ path: "/tmp/w_aj_bloq.png" });
      await P.evaluate(() => ir("inicio")); await P.waitForTimeout(700);
      if (!(await P.$("#ajI [data-desbloq]"))) { await P.click("#ajI [data-plegar]"); await P.waitForTimeout(200); }
      await P.click("#ajI [data-desbloq]"); await P.waitForSelector("#cfOk"); await P.waitForTimeout(500); await P.click("#cfOk"); await P.waitForTimeout(1500);
      if (q("select string_agg(distinct estado, ',') from wms_base where modulo='Z98' and (cajas > 0 or estibas > 0)") !== "DISPONIBLE") errores.push("sin WMS: desbloquear no volvió a disponible");
      // Se deshacen los de Z98 (añadir, quitar, reemplazar)
      for (const id of await P.evaluate(() => ajustesTodos().filter(x => x.m === "Z98").map(x => x.id).slice(0, 3))) await P.evaluate(id2 => api("webAjusteDeshacer", id2).then(guardarAjustes), id);
      await P.evaluate(() => cargarInv(true));
    }
    // Inicio: la lista con deshacer (quedan el «Saqué» de ${lt.m} y lo guardado en Z98)
    await P.evaluate(() => ir("inicio")); await P.waitForTimeout(700);
    if (!(await P.$$("#ajI .aj-f")).length && await P.$("#ajI [data-plegar]")) { await P.click("#ajI [data-plegar]"); await P.waitForTimeout(200); }
    if (!(await P.$("#ajI .aj-f"))) errores.push("sin WMS: Inicio no lista los ajustes");
    await P.screenshot({ path: "/tmp/w_aj_inicio.png" });
    const idSac = await P.evaluate(m => ajustesTodos().find(x => x.m === m && x.tipo === "SACAR").id, lt.m);
    await P.click(`#ajI [data-desh="${idSac}"]`); await P.waitForTimeout(500); await P.click("#cfOk"); await P.waitForTimeout(1800);
    if (cj() !== cj0) errores.push(`sin WMS: deshacer no devolvió las cajas (${cj()} de ${cj0})`);
    // ♻️ Sincronizar sin querer y volver a aplicar lo anotado a mano
    {
      q(`drop table if exists _bkw; create table _bkw as select id, estibas, cajas, unidades from wms_base where modulo='${lt.m}'`);
      await P.evaluate(a => api("webAjusteFijar", { modulo: a.m, sku: a.s, cant: "3", unidad: "est" }).then(guardarAjustes), lt);
      if (cj() !== 3 * cpe) errores.push("reaplicar: la corrección de prueba no quedó");
      await P.evaluate(() => cargarInv(true));
      const nAj = await P.evaluate(() => ajustesTodos().length);
      // Antes de sincronizar avisa (y Cancelar no sincroniza)
      const nPed = pedidos.length;
      await P.click("#syncBtn"); await P.waitForTimeout(700);
      if (!/Hay cambios a mano/.test(await P.textContent("#modalCard").catch(() => "")) || !(await P.isVisible("#cfOk"))) errores.push("reaplicar: sincronizar con cambios a mano no avisa antes");
      await P.click("#modalCard [data-x]"); await P.waitForTimeout(400);
      if (pedidos.length !== nPed) errores.push("reaplicar: Cancelar sincronizó igual");
      // El WMS no sabe nada: vuelve a lo de antes (lo simula la base) y se sincroniza de todas formas
      q(`update wms_base w set estibas = b.estibas, cajas = b.cajas, unidades = b.unidades from _bkw b where w.id = b.id; update wms_base set cajas = 0, estibas = 0, unidades = 0 where modulo = 'Z98'; update sync_estado set ultima_sync = now() where id = 1; drop table _bkw;`);
      await P.click("#syncBtn"); await P.waitForSelector("#cfOk"); await P.waitForTimeout(500); await P.click("#cfOk"); await P.waitForTimeout(2000);
      if (pedidos.length === nPed) errores.push("reaplicar: confirmar no sincronizó");
      if (await P.evaluate(() => ajustesTodos().length)) errores.push("reaplicar: después de sincronizar siguen contando los ajustes");
      if (!(await P.$("#modalCard [data-reaplicar]"))) errores.push("reaplicar: el resultado de sincronizar no ofrece volver a aplicar");
      await P.evaluate(() => cerrarModal(true));
      await P.evaluate(() => ir("inicio")); await P.waitForTimeout(1200);
      if (!(await P.$("#reI [data-reaplicar]"))) errores.push("reaplicar: Inicio no muestra «♻️ Lo anotado a mano antes de sincronizar»");
      await P.screenshot({ path: "/tmp/w_reapl_inicio.png" });
      await P.click("#reI [data-reaplicar]"); await P.waitForSelector("#reOk"); await P.waitForTimeout(500);
      const filas = await P.$$eval(".re-lista .re-f", fs => fs.map(f => f.querySelector("input").checked));
      if (filas.length !== nAj || !filas.every(Boolean)) errores.push(`reaplicar: la lista no trae lo anotado marcado (${filas} de ${nAj})`);
      await P.screenshot({ path: "/tmp/w_reapl.png" });
      await P.click("#reOk"); await P.waitForTimeout(2500);
      if (!/Se volvió a aplicar/.test(await P.textContent("#modalCard").catch(() => ""))) errores.push("reaplicar: no dice que se volvió a aplicar: " + await P.textContent("#modalCard").catch(() => ""));
      if (cj() !== 3 * cpe || q("select cajas from wms_base where modulo='Z98' and cajas > 0") !== "30") errores.push(`reaplicar: no volvió a dejar lo anotado (${cj()} cajas; Z98 ${q("select string_agg(cajas::text, ',') from wms_base where modulo='Z98'")})`);
      if ((await P.evaluate(() => ajustesTodos().length)) !== nAj) errores.push("reaplicar: lo aplicado no cuenta en la sincronización nueva");
      await P.evaluate(() => cerrarModal(true)); await P.evaluate(() => ir("inicio")); await P.waitForTimeout(1200);
      if (await P.$("#reI [data-reaplicar]")) errores.push("reaplicar: después de aplicar sigue saliendo el aviso");
      for (const id of await P.evaluate(m => ajustesTodos().filter(x => x.m === m).map(x => x.id), lt.m)) await P.evaluate(id2 => api("webAjusteDeshacer", id2).then(guardarAjustes), id);
      if (cj() !== cj0) errores.push(`reaplicar: deshacer lo reaplicado no volvió (${cj()} de ${cj0})`);
    }
    q("delete from wms_base where modulo='Z98'"); q("delete from wms_modulos where modulo='Z98'"); q("delete from ajustes_sin_wms"); q("delete from bloqueos_sin_wms"); q("delete from revisiones_modulo");
    await P.evaluate(() => Promise.all([api("webAjustes").then(guardarAjustes), cargarInv(true)]));
  }
  // --- Sugerencias de módulo en Por módulo y Rotular (módulo que no existe: aviso, no error) ---
  await P.evaluate(() => ir("modulo")); await P.waitForTimeout(500);
  await P.fill("#mq", "b1"); await P.waitForTimeout(200);
  if (!(await P.$(".buscador .ac-mod, #view .ac-mod"))) errores.push("por módulo: no sugiere módulos al escribir");
  await P.click("#view .ac-mod"); await P.waitForTimeout(500);
  if (!(await P.evaluate(() => S.vista === "modulo" && /^B1\d*$/.test(S.params.mod || "")))) errores.push("por módulo: tocar la sugerencia no abre el módulo: " + (await P.evaluate(() => JSON.stringify(S.params))));
  // --- Actualización de bodega ---
  await P.evaluate(() => ir("actualizacion")); await P.waitForTimeout(700);
  const act = await P.evaluate(() => ({ secs: $$(".act-sec").length, sig: $$(".act-sig-b").length, mods: S.inv.filter(i => i.fis).length }));
  if (!act.secs || !act.sig) errores.push("actualización: sin secciones o sin «debería actualizarse»: " + JSON.stringify(act));
  await P.click(".act-sig-b"); await P.waitForTimeout(400);
  if (!(await P.$(".act-sec.abierto .act-m"))) errores.push("actualización: tocar la sugerencia no abre la sección con sus módulos");
  await P.screenshot({ path: "/tmp/w_actualizacion.png" });
  await P.click('#acM [data-m="mod"]'); await P.waitForTimeout(300);
  if (!(await P.$(".act-row"))) errores.push("actualización: la vista por módulos está vacía");
  // --- Secciones por rol: quitarle Consumo al validador ---
  await P.evaluate(() => ir("vistasrol")); await P.waitForTimeout(500);
  if (!(await P.$(".vr-tabla input[data-v=consumo][data-r=validador]"))) errores.push("secciones por rol: falta la tabla");
  if (!(await P.$eval('input[data-v="usuarios"][data-r="administrador"]', x => x.disabled))) errores.push("secciones por rol: al administrador se le puede quitar Usuarios");
  await P.uncheck('input[data-v="consumo"][data-r="validador"]'); await P.click('[data-a="guardar"]'); await P.waitForTimeout(800);
  if (q("select valor::jsonb->'validador'->>'consumo' from frecs_config where clave='vistas_rol'") !== "false") errores.push("secciones por rol: no se guardó");
  await P.screenshot({ path: "/tmp/w_vistasrol.png" });
  const vAna = await nueva({ width: 390, height: 844 }, "validador-vistas");
  await vAna.page.goto("http://127.0.0.1:8766/"); await vAna.page.waitForSelector("#lgN");
  await vAna.page.fill("#lgN", "Ana María"); await vAna.page.fill("#lgP", "5555"); await vAna.page.click("#lgB"); await vAna.page.waitForTimeout(2500);
  const vNav = await vAna.page.evaluate(() => ({ consumo: !!$('#nav a[data-v="consumo"]'), val: !!$('#nav a[data-v="validacion"]') }));
  if (vNav.consumo || !vNav.val) errores.push("secciones por rol: el validador sigue viendo Consumo o perdió Validación: " + JSON.stringify(vNav));
  await vAna.page.evaluate(() => ir("consumo")); await vAna.page.waitForTimeout(300);
  if (await vAna.page.evaluate(() => S.vista) === "consumo") errores.push("secciones por rol: el validador abrió Consumo escribiendo la dirección");
  q("delete from frecs_config where clave='vistas_rol'");
  // --- Resumen para el turno (desplegable en Inicio) ---
  await P.evaluate(() => ir("inicio")); await P.waitForTimeout(600);
  if (!(await P.$(".rs-card:not(.abierto)"))) errores.push("inicio: el resumen del turno no está (o no viene cerrado)");
  await P.click(".rs-card .pl-cab"); await P.waitForTimeout(200);
  if ((await P.$$(".rs-card.abierto .rs-i")).length < 3) errores.push("inicio: el resumen no muestra sus puntos al abrirlo");
  await P.screenshot({ path: "/tmp/w_resumen.png" });
  // --- Información de producto: al escribir sale la lista; al escoger, toda la información ---
  await P.evaluate(() => { ls.set("ultProd", ""); ir("producto"); }); await P.waitForTimeout(500);
  if (await P.$(".dp-card")) errores.push("información de producto: muestra un producto sin escoger");
  await P.fill("#bq", "pony"); await P.waitForTimeout(300);
  if (!(await P.isVisible(".buscador .ac-list .ac-item"))) errores.push("información de producto: al escribir no sale la lista");
  if (await P.$(".dp-card")) errores.push("información de producto: carga el producto antes de escogerlo");
  await P.click(".buscador .ac-list .ac-item"); await P.waitForTimeout(300);
  if (!(await P.$(".dp-card .dp-cans")) || !(await P.$(".dp-card .pf-campos"))) errores.push("información de producto: al escoger no muestra la ficha completa");
  await P.screenshot({ path: "/tmp/w_producto.png" });
  await P.click(".dp-card [data-ed]"); await P.waitForTimeout(300);
  if (!(await P.$(".m-sku .msk-g"))) errores.push("editar producto: no abrió la ventana compacta");
  await P.screenshot({ path: "/tmp/w_sku_editar.png" });
  await P.evaluate(() => cerrarModal(true));
  // --- Switch de canal: queda guardado por persona; Stock solo muestra lo que cumple ---
  await P.evaluate(() => ponerCanal("T2")); await P.waitForTimeout(500);
  if (q("select prefs->>'canal' from perfiles where nombre='Huber'") !== "T2") errores.push("canal: no quedó guardado");
  if (!/T2/.test(await P.textContent("#canalChip"))) errores.push("canal: el botón de arriba no lo muestra");
  await P.evaluate(() => ir("stock", { sku: "2222" })); await P.waitForTimeout(500);
  if (!(await P.$(".canal-ban"))) errores.push("canal: Stock no avisa que está encendido");
  const cTags = await P.$$eval("#sr .inv", cs => cs.map(c => !!c.querySelector(".t-cumple")));
  if (!(await P.$(".no-cumple")) && (!cTags.length || cTags.some(x => !x))) errores.push("canal: Stock muestra lo que no cumple: " + cTags);
  await P.screenshot({ path: "/tmp/w_canal.png" });
  // Producto inventado que no cumple: se dice que existe y dónde está
  const nc = await P.evaluate(() => { const i = S.inv.find(x => x.fis && x.disp && !x.T2 && !x.esOp); if (!i) return ""; ir("stock", { sku: i.s }); return i.s; });
  if (nc) { await P.waitForTimeout(400); if (await P.$$eval("#sr .inv", cs => cs.length) && !(await P.$$eval("#sr .inv", cs => cs.every(c => c.querySelector(".t-cumple"))))) { if (!(await P.$(".no-cumple"))) errores.push("canal: no dice que el producto existe pero no cumple"); } }
  await P.evaluate(() => ir("stock", { sku: "2222" })); await P.waitForTimeout(400); await P.click("[data-canal-off]"); await P.waitForTimeout(500);
  if (q("select coalesce(prefs->>'canal','')  from perfiles where nombre='Huber'") !== "") errores.push("canal: no se apagó");
  if (await P.$(".canal-ban")) errores.push("canal: sigue el aviso después de apagarlo");
  // --- Rol OPM: igual que el verificador ---
  const vOpm = await P.evaluate(() => ["stock", "producto", "modulo", "repvacio", "validacion", "consumo"].map(v => vistaPermitida(v, "opm")).join(","));
  if (vOpm !== "true,true,true,true,false,false") errores.push("opm: secciones por defecto mal: " + vOpm);
  // --- Organizar bodega: retornable y lata ---
  await P.evaluate(() => ir("organizar")); await P.waitForTimeout(700);
  if ((await P.$$("#oP button")).length !== 2) errores.push("organizar: no está dividido en retornable y lata");
  await P.click('#oP [data-p="lata"]'); await P.waitForTimeout(500);
  await P.click("#oS [data-cambiar]"); await P.waitForTimeout(200);
  const chipsOn = await P.$$eval("#oS .org-chip.on", cs => cs.map(c => c.dataset.s));
  if (!chipsOn.includes("H") && !chipsOn.includes("E")) errores.push("organizar: lata no trae sus secciones por defecto: " + chipsOn);
  await P.screenshot({ path: "/tmp/w_organizar.png" });
  const secX = await P.$eval("#oS .org-chip", c => c.dataset.s);
  await P.click("#oS .org-chip"); await P.waitForTimeout(600);
  const gs = JSON.parse(q("select coalesce(prefs->'orgSecs','{}')::text from perfiles where nombre='Huber'"));
  if (!gs.lata) errores.push("organizar: las secciones escogidas no quedaron guardadas");
  const movs = await P.evaluate(() => api("webOrganizar", ["A", "B", "C", "D"]));
  if (movs.some(m => !/^[A-D]\d/.test(m.from) || !/^[A-D]\d/.test(m.to))) errores.push("organizar: se sale de las secciones de retornable");
  await P.evaluate(() => api("webPref", "orgSecs", null));
  // --- Alerta de pocos: productos vigilados (avisa con un solo módulo o agotado) ---
  // Un producto en un solo módulo (aunque tenga varias estibas) avisa; 2222 (2 módulos o más) no
  const skuUno = await P.evaluate(() => (S.cat.map(c => c.sku).find(s => s !== "2222" && estadoVigilado(s).unMod && estadoVigilado(s).eq > 1) || ""));
  if (!skuUno) errores.push("pocos: no hay producto de prueba en un solo módulo con varias estibas");
  if (await P.evaluate(() => estadoVigilado("2222").mods.length < 2 || estadoVigilado("2222").bajo)) errores.push("pocos: 2222 debería tener 2 módulos o más y no avisar");
  await P.evaluate(() => ir("pocosvig")); await P.waitForTimeout(600);
  for (const sk of ["2222", skuUno]) { await P.fill("#pvA", sk); await P.waitForTimeout(300); await P.click(".ac-list .ac-item"); await P.waitForTimeout(700); }
  if (JSON.parse(q("select valor from frecs_config where clave='pocos_vigilar'") || "[]").sort().join() !== ["2222", skuUno].sort().join()) errores.push("pocos: los vigilados no quedaron guardados");
  if (await P.$("[data-min]")) errores.push("pocos: el panel todavía pide mínimo de estibas");
  // En alerta solo el de un módulo (tarjeta corta); 2222 queda como chip abajo
  if ((await P.$$(".pv-g .pv-c")).length !== 1 || !(await P.$(`.pv-g .pv-c[data-vsku="${skuUno}"]`))) errores.push("pocos: la lista no muestra solo el que está en un módulo");
  if (!(await P.$('.pv-bien .pv-chip[data-vsku="2222"]'))) errores.push("pocos: el vigilado sin alerta no queda abajo como chip");
  const lnV = await P.$$eval(`.pv-c[data-vsku="${skuUno}"] .pv-ln`, l => l.map(x => x.textContent.includes(":") ? x.textContent.trim().split(":")[0] : "mod"));
  if (lnV.join() !== "mod,Estibas,Cajas,Unidades") errores.push("pocos: el orden de la tarjeta no es módulo, estibas, cajas, unidades: " + lnV);
  await P.screenshot({ path: "/tmp/w_pocosvig.png" });
  await P.evaluate(() => ir("inicio")); await P.waitForTimeout(700);
  if (!(await P.$(`#pvI .pv-aviso [data-vsku="${skuUno}"]`))) errores.push("pocos: Inicio no avisa del producto en un solo módulo: " + skuUno);
  if (await P.$('#pvI .pv-aviso [data-vsku="2222"]')) errores.push("pocos: avisa de un producto que tiene 2 módulos o más");
  // Botón para ver las tarjetas en lista (computador): una sola columna; se recuerda
  await P.evaluate(() => ir("rotular")); await P.waitForTimeout(300);
  await P.evaluate(() => ir("stock", { sku: "2222" })); await P.waitForTimeout(700);
  const colsAntes = await P.evaluate(() => { const g = $("#view .grid"); return g ? getComputedStyle(g).gridTemplateColumns.split(" ").length : 0; });
  await P.click("#vistaBtn"); await P.waitForTimeout(200);
  const colsLista = await P.evaluate(() => { const g = $("#view .grid"); return g ? getComputedStyle(g).gridTemplateColumns.split(" ").length : 0; });
  if (!(colsAntes > 1 && colsLista === 1) || (await P.evaluate(() => localStorage.getItem("frecs_vista"))) !== "lista") errores.push(`vista en lista: no cambió (${colsAntes} → ${colsLista})`);
  await P.screenshot({ path: "/tmp/w_vista_lista.png" });
  await P.click("#vistaBtn"); await P.waitForTimeout(200);
  if (await P.evaluate(() => document.documentElement.dataset.vista === "lista")) errores.push("vista en lista: no vuelve a cuadrícula");
  await P.evaluate(() => ir("inicio")); await P.waitForTimeout(700);
  if (!(await P.$('#nav a[data-v="pocos"] .nav-n'))) errores.push("pocos: el menú no marca los vigilados con 1 estiba o menos");
  await P.screenshot({ path: "/tmp/w_inicio_pocos.png" });
  await P.evaluate(() => ir("pocos")); await P.waitForTimeout(700);
  if (!(await P.$(".pv-vig"))) errores.push("pocos: la vista Pocos no muestra los vigilados");
  if (!(await P.evaluate(() => ["verificador", "opm", "lector", "validador"].every(r => vistaPermitida("pocosvig", r))))) errores.push("vigilados: no los ven todos los roles");
  await P.evaluate(() => api("webPocosVigilarGuardar", []));
  // --- Tapacódigos: lista en Administración; al llenar TPC solo salen esos ---
  {
    await P.evaluate(() => ir("tpclista")); await P.waitForTimeout(700);
    await P.fill("#tlA", "2222"); await P.waitForTimeout(300); await P.click("#tlA ~ .ac-list .ac-item"); await P.waitForTimeout(1200);
    if (q("select valor from frecs_config where clave='tpc_productos'") !== '["2222"]') errores.push("tapacódigos: la lista no se guardó: " + q("select valor from frecs_config where clave='tpc_productos'"));
    if (!(await P.$('#tlL [data-quitar="2222"]'))) errores.push("tapacódigos: el panel no muestra el producto agregado");
    await P.screenshot({ path: "/tmp/w_tpclista.png" });
    await P.evaluate(() => modalEntItem("TPC", null, true)); await P.waitForSelector("#eiP"); await P.waitForTimeout(300);
    await P.focus("#eiP"); await P.waitForTimeout(250);
    const sug = await P.$$eval("#eiP ~ .ac-list .ac-item .sku", x => x.map(e => e.textContent));
    if (sug.join() !== "2222") errores.push("TPC: al tocar el cuadro no salen solo los de la lista: " + sug);
    await P.fill("#eiP", "3617"); await P.waitForTimeout(250);
    if ((await P.$$("#eiP ~ .ac-list:not(.hidden) .ac-item")).length) errores.push("TPC: sale un producto que no está en la lista");
    if (!/lista de tapacódigos/.test(await P.textContent("#eiTpc").catch(() => ""))) errores.push("TPC: no dice que solo salen los de la lista");
    await P.click('#eiS [data-s="KA"]'); await P.waitForTimeout(200); await P.fill("#eiP", "3617"); await P.waitForTimeout(300);
    if (!(await P.$$("#eiP ~ .ac-list:not(.hidden) .ac-item")).length) errores.push("KA: el filtro de tapacódigos quedó puesto en otra sección: " + JSON.stringify(await P.evaluate(() => [S.entSec, $("#eiP").value, $("#eiTpc").textContent, (S.cat || []).some(c => c.sku === "3617")])));
    await P.evaluate(() => cerrarModal(true));
    await P.evaluate(() => api("webTpcListaGuardar", []).then(l => { S.tpcLista = l; }));
  }
  // --- Rotador (antes validador) ---
  const rot = await P.evaluate(() => ({ t: rolTxt("validador"), m: conRotador("se necesita rol validador") }));
  if (rot.t !== "rotador" || rot.m !== "se necesita rol rotador") errores.push("rotador: el nombre no cambió: " + JSON.stringify(rot));
  // --- Fechas cortas: los días para vencer se cuentan desde hoy (no los que traía el WMS) ---
  {
    const fila = q("select id || '|' || modulo || '|' || sku from wms_base where coalesce(estibas,0)+coalesce(cajas,0) > 0 and vence is not null order by id limit 1").split("|");
    const vence = q("select to_char((now() at time zone 'America/Bogota')::date + 10, 'YYYY-MM-DD')");
    const antes = q(`select to_char(vence,'YYYY-MM-DD') || '|' || coalesce(dias::text,'') from wms_base where id=${fila[0]}`);
    q(`update wms_base set vence='${vence}', dias=999 where id=${fila[0]}`);
    await P.evaluate(() => cargarInv(true));
    const dd = await P.evaluate(a => (S.inv.find(i => i.m === a[1] && i.s === a[2] && i.v === a[3]) || {}).d, [fila[0], fila[1], fila[2], vence]);
    if (dd !== 10) errores.push("fechas cortas: los días no se cuentan desde hoy: " + dd);
    await P.evaluate(() => ir("fechas", { dias: 12, est: "ALL" })); await P.waitForTimeout(700);
    if (!(await P.$$eval("#view .inv", (cs, m) => cs.some(c => c.textContent.includes(m)), fila[1]))) errores.push("fechas cortas: el producto que vence en 10 días no sale con «≤ 12 días»");
    const [v0, d0] = antes.split("|");
    q(`update wms_base set vence='${v0}', dias=${d0 === "" ? "null" : d0} where id=${fila[0]}`);
    await P.evaluate(() => cargarInv(true));
  }
  // --- Módulos en consumo por canal ---
  if (!(await P.evaluate(() => vistaPermitida("enconsumo", "verificador") && vistaPermitida("enconsumo", "opm") && vistaPermitida("enconsumo", "lector")))) errores.push("consumo canal: no lo ven todos los roles");
  await P.evaluate(() => ir("stock", { sku: "2222" })); await P.waitForTimeout(700);
  const modM = await P.$eval("#sr [data-marcar]", b => b.dataset.marcar.split("|")[1]).catch(() => "");
  if (!modM) errores.push("consumo canal: la tarjeta no tiene «Marcar consumo»");
  else {
    await P.click(`#sr [data-marcar="2222|${modM}"]`); await P.waitForTimeout(400);
    const cumple = await P.$$eval(".mc-can", cs => cs.map(c => c.classList.contains("si")));
    const ci = cumple.indexOf(true), ni = cumple.indexOf(false), C = ["T1", "T2", "KA"];
    if (ci >= 0) {
      await P.waitForTimeout(450); await P.click(`.mc-can [data-c="${C[ci]}"]`); await P.waitForTimeout(800);
      // «Cerrar» funciona después de marcar (la ventana se vuelve a pintar)
      await P.waitForTimeout(450); await P.click(".modal-card [data-x]"); await P.waitForTimeout(500);
      if (await P.$(".modal-card .mc-cans")) errores.push("consumo canal: «Cerrar» no cierra después de marcar");
      if (ni >= 0) { await P.click(`#sr [data-marcar="2222|${modM}"]`); await P.waitForTimeout(400); }
    }
    if (ni >= 0) {
      await P.waitForTimeout(450); await P.click(`.mc-can [data-c="${C[ni]}"]`); await P.waitForTimeout(500);
      if (!/No está disponible/.test(await P.textContent(".modal-card").catch(() => ""))) errores.push("consumo canal: no avisa que no cumple");
      await P.waitForTimeout(500); await P.click("#cfOk"); await P.waitForTimeout(900);
    }
    const filas = q(`select string_agg(canal || ':' || forzado || ':' || marcado_por, ',' order by canal) from marcas_consumo where sku='2222' and modulo='${modM}' and quitado_en is null`);
    const esper = [ci >= 0 ? `${C[ci]}:false:Huber` : null, ni >= 0 ? `${C[ni]}:true:Huber` : null].filter(Boolean).sort().join(",");
    if (filas !== esper) errores.push(`consumo canal: marcas mal guardadas (${filas} ≠ ${esper})`);
    await P.evaluate(() => cerrarModal(true)); await P.waitForTimeout(300);
    if (!(await P.$("#sr .tag.t-cons"))) errores.push("consumo canal: la tarjeta no muestra la etiqueta de consumo");
    // Al consultar el SKU, la tarjeta del módulo en consumo cambia de color (y solo esa)
    const resal = await P.$$eval("#sr .inv.en-cons", cs => cs.map(c => c.querySelector(".mod-chip").textContent.trim()));
    if (resal.length !== 1 || resal[0] !== modM) errores.push("consumo canal: la tarjeta del módulo en consumo no se resalta: " + resal);
    await P.screenshot({ path: "/tmp/w_marca_stock.png" });
    await P.evaluate(() => ir("enconsumo")); await P.waitForSelector(".mc-card", { timeout: 8000 }).catch(() => {}); await P.waitForTimeout(400);
    const nC = (await P.$$(".mc-card")).length;
    if (nC !== esper.split(",").length) errores.push("consumo canal: la sección no lista las marcas: " + nC);
    if (!(await P.$("#mcL h3.mc-fam + .grid .mc-card"))) errores.push("consumo canal: no se agrupa por familia");
    await P.screenshot({ path: "/tmp/w_enconsumo.png" });
    await P.click(".mc-card [data-quitar]"); await P.waitForTimeout(500); await P.click("#cfOk"); await P.waitForTimeout(900);
    if ((await P.$$(".mc-card")).length !== nC - 1) errores.push("consumo canal: quitar no funcionó");
    // ⬜ Reportar vacío desde aquí: se quita de consumo
    await P.evaluate(m => api("webMarcaPoner", { sku: "2222", producto: "Pony", modulo: m, canal: "KA", forzado: true, dias: "", minimo: "" }).then(guardarMarcas).catch(() => null), modM);
    await P.evaluate(() => ir("enconsumo")); await P.waitForTimeout(800);
    await P.click(`.mc-card [data-vacio="${modM}"]`); await P.waitForSelector("#cfOk"); await P.waitForTimeout(500); await P.click("#cfOk"); await P.waitForTimeout(1500);
    if (q(`select count(*) from marcas_consumo where modulo='${modM}' and quitado_en is null`) !== "0" || q(`select count(*) from marcas_consumo where modulo='${modM}' and cierre='VACIO'`) === "0") errores.push("consumo canal: reportar vacío no quitó el módulo de consumo");
    if (q(`select count(*) from reportes_modulo where modulo='${modM}' and tipo='VACIO' and estado='PENDIENTE'`) !== "1") errores.push("consumo canal: no quedó el reporte de vacío");
    if ((await P.$$(".mc-card")).length) errores.push("consumo canal: la tarjeta sigue después de reportar vacío");
    q(`delete from reportes_modulo where modulo='${modM}'`); await P.evaluate(() => api("webReportes").then(r => guardarRep(r.lista)).catch(() => null));
    // Actualización sola: otra persona marca un módulo (directo en la base) y aquí aparece sin tocar ↻
    await P.evaluate(() => ir("enconsumo")); await P.waitForTimeout(900);
    const n0 = (await P.$$(".mc-card")).length;
    q(`insert into marcas_consumo (sku, producto, modulo, canal, marcado_por) values ('2222', 'Pony', '${modM}', 'T1', 'Otra persona')`);
    await P.evaluate(() => { ultimaInteraccion = 0; return revisarCambios(true); }); await P.waitForTimeout(1500);
    if ((await P.$$(".mc-card")).length !== n0 + 1) errores.push(`actualización sola: no apareció lo que marcó otra persona (${n0} → ${(await P.$$(".mc-card")).length})`);
    q("delete from marcas_consumo"); await P.evaluate(() => api("webMarcas").then(guardarMarcas));
    q("delete from marcas_consumo");
    await P.evaluate(() => api("webMarcas").then(guardarMarcas));
  }
  // --- Limbo: SKU, cantidades y editar ---
  const idL2 = await P.evaluate(() => api("webLimboAgregar", { nombre: "Pony lata suelta", fecha: "2027-03-01", pres: "Lata", cub: "330", sku: "2222", e: "1", c: "12", u: "4" }));
  if (q(`select sku || '|' || estibas || '|' || cajas || '|' || unidades from limbo where id='${idL2}'`) !== "2222|1|12|4") errores.push("limbo: SKU y cantidades no llegaron: " + q(`select sku || '|' || estibas || '|' || cajas || '|' || unidades from limbo where id='${idL2}'`));
  const malSku = await P.evaluate(() => api("webLimboAgregar", { nombre: "x", fecha: "2027-03-01", sku: "99999999" }).then(() => "", e => e.message));
  if (!/no existe/.test(malSku)) errores.push("limbo: acepta un SKU que no existe: " + malSku);
  await P.evaluate(() => ir("limbo")); await P.waitForTimeout(700);
  await P.click(`[data-ed="${idL2}"]`); await P.waitForTimeout(300);
  await P.fill(".modal [data-l=c]", "30"); await P.waitForTimeout(500); await P.click("#lbE"); await P.waitForTimeout(900);
  if (q(`select cajas || '|' || sku || '|' || producto from limbo where id='${idL2}'`) !== "30|2222|Pony lata suelta") errores.push("limbo: editar no guardó: " + q(`select cajas || '|' || sku || '|' || producto from limbo where id='${idL2}'`));
  await P.screenshot({ path: "/tmp/w_limbo2.png" });
  await P.evaluate(id => api("webLimboEliminar", id), idL2);
  // --- Consumo: solo el administrador la cambia ---
  const rCons = await vAna.page.evaluate(() => api("webConsumoAgregar", "2222").then(() => "ok", e => e.message));
  if (!/permiso/i.test(rCons)) errores.push("consumo: un validador todavía cambia la lista: " + rCons);
  // …pero el rotador sí escoge a mano el módulo a consumir
  {
    const sC = q("select c.sku || '|' || min(w.modulo) from consumo c join wms_base w on w.sku = c.sku and w.estado = 'DISPONIBLE' and w.cajas > 0 and w.modulo !~ '^(KA|PREV)' group by c.sku order by c.sku limit 1").split("|");
    const rEl = await vAna.page.evaluate(a => api("webConsumoElegir", a[0], a[1]).then(() => "ok", e => e.message), sC);
    if (rEl !== "ok" || q(`select modulo_elegido || '|' || elegido_por from consumo where sku='${sC[0]}'`) !== `${sC[1]}|Ana María`) errores.push("consumo: el rotador no pudo escoger el módulo a mano: " + rEl + " · " + q(`select modulo_elegido || '|' || elegido_por from consumo where sku='${sC[0]}'`));
    await vAna.page.evaluate(a => api("webConsumoElegir", a[0], ""), sC);
    if (q(`select coalesce(modulo_elegido,'auto') from consumo where sku='${sC[0]}'`) !== "auto") errores.push("consumo: el rotador no pudo volver a automático");
  }
  // --- Lista de consumo en Administración: nombre y orden; Pony solo muestra ---
  await P.evaluate(() => ir("consumolista")); await P.waitForTimeout(900);
  const ordenA = await P.$$eval(".cl-f", fs => fs.map(f => f.dataset.sku));
  if (ordenA.length >= 2) {
    await P.click(`.cl-f[data-sku="${ordenA[1]}"] [data-a="sube"]`); await P.waitForTimeout(900);
    const ordenB = q("select string_agg(sku, ',' order by orden) from consumo").split(",");
    if (ordenB[0] !== ordenA[1] || ordenB[1] !== ordenA[0]) errores.push("consumo: subir no cambió el orden: " + ordenB);
    await P.fill(`[data-nom="${ordenA[0]}"]`, "Nombre de prueba Pony"); await P.press(`[data-nom="${ordenA[0]}"]`, "Enter"); await P.waitForTimeout(900);
    if (q(`select producto from consumo where sku='${ordenA[0]}'`) !== "Nombre de prueba Pony") errores.push("consumo: el nombre no se guardó");
    await P.screenshot({ path: "/tmp/w_consumolista2.png" });
    await P.evaluate(() => ir("consumo")); await P.waitForTimeout(900);
    const pony = await P.evaluate(() => ({ editar: !!$("[data-lista]"), elegir: !!$("[data-el]"), auto: !!$("[data-auto]"), primero: ($(".cs-lista .cs-row .cs-p") || {}).textContent || "", nombre: $("#view").textContent.includes("Nombre de prueba Pony") }));
    if (pony.editar) errores.push("Pony: todavía tiene botones para cambiar la lista: " + JSON.stringify(pony));
    if (!pony.elegir) errores.push("Pony: el administrador / rotador no puede «Elegir» el módulo a mano: " + JSON.stringify(pony));
    if (!pony.primero.includes(ordenA[1]) || !pony.nombre) errores.push("Pony: no sale en el orden o con el nombre del administrador: " + JSON.stringify(pony));
    await P.evaluate(() => ir("consumolista")); await P.waitForTimeout(700);
    await P.fill(`[data-nom="${ordenA[0]}"]`, ""); await P.press(`[data-nom="${ordenA[0]}"]`, "Enter"); await P.waitForTimeout(900);
    if (q(`select producto from consumo where sku='${ordenA[0]}'`) === "Nombre de prueba Pony") errores.push("consumo: el nombre vacío no volvió al de la hoja Sku");
  } else errores.push("consumo: la lista de prueba tiene menos de 2 productos");
  // --- Vida útil y fecha de envasado ---
  q("update sku set vida_util = 270 where sku = '2222'");
  await P.evaluate(() => ir("inicio")); await P.waitForTimeout(300); await P.reload(); await P.waitForSelector(".kpis", { timeout: 15000 }); await P.waitForTimeout(2500);
  await P.evaluate(() => ir("envasado")); await P.waitForTimeout(700);
  await P.fill("#eP", "2222"); await P.waitForTimeout(300); await P.click(".ac-list .ac-item"); await P.waitForTimeout(200);
  if (await P.inputValue("#eV") !== "270") errores.push("envasado: no trae la vida útil de la hoja Sku: " + await P.inputValue("#eV"));
  await P.fill("#ef", "2027-06-30"); await P.click("#eb"); await P.waitForTimeout(600);
  const envT = await P.textContent("#er");
  if (!envT.includes("03/10/2026")) errores.push("envasado: fecha de producción mal (30/06/2027 − 270 d = 03/10/2026): " + envT.slice(0, 200));
  const envR = await P.evaluate(() => api("webEnvasadoProducto", "2222", "2027-06-30", ""));
  const t2 = envR.canales.find(c => c.c === "T2");
  const espT2 = (() => { const d = new Date(2027, 5, 30); d.setDate(d.getDate() - t2.min); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; })();
  if (t2.limite !== espT2) errores.push(`envasado: límite T2 mal (${t2.limite} ≠ ${espT2})`);
  await P.screenshot({ path: "/tmp/w_envasado.png" });
  await P.evaluate(() => { ls.set("ultProd", "2222"); ir("producto"); }); await P.waitForTimeout(600);
  if (!(await P.textContent("#br")).includes("270 días")) errores.push("información de producto: no muestra la vida útil");
  q("update sku set vida_util = null where sku = '2222'");
  // --- Foto del WMS en los productos con prioridad ---
  const lp = q("select sku || '|' || modulo from wms_base where obs ilike '%prioridad%' and (cajas > 0 or estibas > 0) limit 1");
  if (!lp) errores.push("fotos: no hay un lote con prioridad en los datos de prueba");
  else {
    const [skP, mP] = lp.split("|");
    q(`insert into wms_fotos (actividad_id, sku, modulo, urls) values (999001, '${skP}', '${mP}', '["https://ejemplo.invalid/uploads/fotoinventario/imagen/x.webp"]') on conflict do nothing`);
    await P.evaluate(() => ir("inicio")); await P.waitForTimeout(300); await P.reload(); await P.waitForSelector(".kpis", { timeout: 15000 }); await P.waitForTimeout(2500);
    await P.evaluate(s => ir("stock", { sku: s }), skP); await P.waitForTimeout(700);
    const nF = await P.$$eval(`[data-foto="${skP}|${mP}"]`, x => x.length);
    if (!nF) errores.push("fotos: la tarjeta con prioridad no muestra 📷");
    else {
      await P.click(`[data-foto="${skP}|${mP}"]`); await P.waitForTimeout(400);
      const src = await P.$eval(".foto-g img", i => i.getAttribute("src")).catch(() => "");
      if (!src.includes("fotoinventario")) errores.push("fotos: al tocar 📷 no se abre la foto");
      await P.screenshot({ path: "/tmp/w_foto.png" });
      await P.evaluate(() => cerrarModal(true));
    }
    const sinPrio = await P.evaluate(() => S.inv.filter(i => !i.prio && i.fis).slice(0, 50).some(i => fotoDe(i.s, i.m) && !S.inv.some(j => j.prio && j.s === i.s && j.m === i.m)));
    if (sinPrio) errores.push("fotos: aparece en lotes sin prioridad");
    q("delete from wms_fotos where actividad_id = 999001");
  }
  // --- Bodega arranca en estibas (lo guardado en cajas se muestra bien) ---
  const cz = await P.evaluate(() => [campoZona("x", "Bodega", "", 24), campoZona("x", "Bodega", 48, 24), campoZona("x", "Bodega", 50, 24), campoZona("x", "KA", "", 24)].map(t => (t.match(/data-unt="(\w+)"/) || [])[1] + ":" + (t.match(/value="([^"]*)"/) || [])[1]));
  if (cz.join() !== "est:,est:2,cj:50,cj:") errores.push("bodega en estibas: " + cz.join());
  // --- Validación: «Estoy en» un área y reempaque ---
  if (q("select count(*) from turnos where estado='ABIERTO'") === "1") {
    await P.evaluate(() => api("webValAgregar", [{ sku: "3128", producto: "Prueba área", bodega: 48, pk: "", ka: "" }]));
    await P.evaluate(() => ir("validacion")); await P.waitForTimeout(800);
    if (!(await P.$('[data-vz-sel="ka"]'))) errores.push("validación: no deja escoger el área");
    else {
      await P.click('[data-vz-sel="ka"]'); await P.waitForTimeout(400);
      const inp = '[data-vz="ka"][data-sku="3128"]';
      if (!(await P.$(inp))) errores.push("validación: en KA no sale lo que falta contar");
      else {
        await P.fill(inp, "7"); await P.$eval(inp, i => i.dispatchEvent(new Event("change", { bubbles: true }))); await P.waitForTimeout(900);
        const kaV = q(`select ka || '|' || bodega || '|' || inicial from val_productos where sku='3128' and turno_id=(select id from turnos where estado='ABIERTO')`);
        if (kaV !== "7|48|55") errores.push("validación: lo del área no se guardó bien: " + kaV);
        await P.screenshot({ path: "/tmp/w_val_zona.png" });
      }
      await P.click('[data-vz-sel=""]'); await P.waitForTimeout(400);
    }
    // Reempaque desde «Cantidad»
    const pR = await P.evaluate(() => { const p = S.val.productos.find(x => x.sku === "3128"); modalInicial(p); return !!p; });
    await P.waitForTimeout(400);
    if (pR) { await P.fill("#iR", "10"); await P.waitForTimeout(500); await P.click("#iok"); await P.waitForTimeout(900); }
    if (q(`select reempaque from val_productos where sku='3128' and turno_id=(select id from turnos where estado='ABIERTO')`) !== "10") errores.push("validación: el reempaque no se guardó");
    await P.evaluate(() => ir("validacion")); await P.waitForTimeout(600);
    if (!(await P.$(".vcard .reemp-p"))) errores.push("validación: la tarjeta no muestra el reempaque");
    await P.screenshot({ path: "/tmp/w_val_reemp.png" });
    await P.evaluate(() => api("webValQuitar", "3128"));
  } else errores.push("validación: no hay turno abierto para probar el área");
  // --- Fase 4d: con el cambio definitivo, cada cambio de turno se copia a las hojas ---
  q("insert into frecs_config values ('turnos_en_supabase','si') on conflict (clave) do update set valor='si'");
  await P.evaluate(() => ir("inicio")); await P.waitForTimeout(300);
  await P.reload(); await P.waitForSelector(".kpis", { timeout: 15000 }); await P.waitForTimeout(800);
  if (await P.isVisible(".web-aviso.prueba")) errores.push("con el cambio definitivo sigue el aviso de modo prueba");
  pedidos.length = 0; respSync = { ok: true, hojas: { turnos: 1 } };
  const TT = turnoAb();
  await P.evaluate(() => api("webEntNota", "nota para la copia"));
  await P.waitForTimeout(500);
  const pe = pedidos.find(x => x.accion === "turnos");
  if (!pe || !pe.turnos.includes(TT)) errores.push("no se pidió copiar el turno a las hojas: " + JSON.stringify(pedidos.map(x => x.accion)));
  if (await P.evaluate(() => localStorage.getItem("frecs_espejo"))) errores.push("quedó pendiente la copia aunque Apps Script respondió bien");
  // Si Apps Script falla, queda pendiente y se reintenta con el siguiente cambio
  respSync = { ok: false, error: "caído" }; pedidos.length = 0;
  await P.evaluate(() => api("webEntNota", "otra nota"));
  await P.waitForTimeout(500);
  if (!(await P.evaluate(() => localStorage.getItem("frecs_espejo")))) errores.push("la copia fallida no quedó pendiente");
  respSync = { ok: true }; pedidos.length = 0;
  await P.evaluate(() => api("webEntNota", "tercera nota"));
  await P.waitForTimeout(500);
  if (await P.evaluate(() => localStorage.getItem("frecs_espejo"))) errores.push("la copia pendiente no se reintentó");
  q("delete from frecs_config where clave='turnos_en_supabase'");
  console.log(errores.length ? "ERRORES:\n" + errores.join("\n") : "SIN ERRORES");
  await b.close(); srv.kill();
})();

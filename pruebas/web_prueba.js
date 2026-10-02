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
  if (!["validacion", "entrega", "consumo", "conciliacion", "preconciliacion", "hval", "hent", "hconc", "usuarios", "reportes"].every(v => vistas.includes(v))) errores.push("faltan vistas: " + vistas);
  for (const v of vistas) {
    await page.evaluate(v2 => ir(v2), v); await page.waitForTimeout(250);
    const t = await page.$eval("#view", el => el.innerText.slice(0, 120).replace(/\n/g, " "));
    if (/⚠️/.test(t) && !/⚠️ (Mal|Ojo|Cui|FE)/.test(t)) errores.push(`vista ${v}: ${t}`);
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
  await sy.ctx.route("**/config.js*", async route => { const r = await route.fetch(); const t = (await r.text()).replace(/appsScriptUrl: "[^"]*"/, 'appsScriptUrl: "https://script.google.com/macros/s/PRUEBA/exec"'); await route.fulfill({ response: r, body: t }); });
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
  await val.page.selectOption("#lgN", "Ana María"); await val.page.fill("#lgP", "5555"); await val.page.click("#lgB");
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
  const ft = await P.$("#view .fecha-caja:has(#lf) .fecha-txt");
  if (!ft) errores.push("limbo: la fecha no se puede escribir a mano");
  else { await ft.click(); await ft.type("10052027"); await P.waitForTimeout(100); const iso = await P.$eval("#lf", e => e.value); const vis = await ft.evaluate(e => e.value); if (iso !== "2027-05-10" || vis !== "10/05/2027") errores.push(`fecha a mano: ${vis} → ${iso}`); }
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
  await P.evaluate(() => ir("retornables")); await P.waitForTimeout(700); await P.screenshot({ path: "/tmp/w_retornables.png" });
  await P.evaluate(() => ir("conciliacion")); await P.waitForTimeout(1000); await P.screenshot({ path: "/tmp/w_conciliacion.png" });
  await P.evaluate(() => ir("usuarios")); await P.waitForTimeout(800); await P.screenshot({ path: "/tmp/w_usuarios.png" });
  await P.evaluate(() => ir("validacion")); await P.waitForTimeout(800); await P.screenshot({ path: "/tmp/w_validacion.png" });
  await P.evaluate(() => ir("entrega")); await P.waitForTimeout(800); await P.screenshot({ path: "/tmp/w_entrega.png" });
  await cel.page.evaluate(() => ir("validacion")); await cel.page.waitForTimeout(1500); await cel.page.screenshot({ path: "/tmp/m_w_validacion.png" });
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

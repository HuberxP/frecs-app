// =====================================================================
// PUENTE: reemplaza google.script.run del dashboard de Apps Script.
// - Ingreso, salida: funciones de Supabase (rpc).
// - Consultas: los datos llegan de Supabase en UNA llamada (datos_consulta) y la
//   misma lógica del servidor (motor.js) los calcula aquí en el navegador.
// - Lo que escribe (turnos, validaciones, PDF, sincronizar…): todavía en el
//   dashboard actual (fase 4 de la migración).
// =====================================================================
(function () {
  const CFG = window.FRECS_CONFIG || {};
  const URL_SB = String(CFG.supabaseUrl || "").replace(/\/+$/, "");
  const CLAVE = String(CFG.supabaseKey || "");

  async function rpc(fn, args) {
    let r;
    try {
      r = await fetch(`${URL_SB}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: { apikey: CLAVE, Authorization: "Bearer " + CLAVE, "Content-Type": "application/json" },
        body: JSON.stringify(args || {})
      });
    } catch (e) { const er = new Error("NetworkError: no se pudo conectar"); er.red = true; throw er; }
    const txt = await r.text();
    let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok) {
      const m = (j && (j.message || j.hint || j.error)) || txt || ("Error " + r.status);
      throw new Error(String(m));
    }
    return j;
  }

  // ---------- datos para el motor ----------
  let datos = null, cargando = null;
  const CLAVE_LS = "frecs_motor";
  function usarDatos(d) { datos = d; MOTOR.cargar(d); }
  async function cargarDatos(tk, forzar) {
    if (datos && !forzar) return datos;
    if (!cargando) {
      cargando = rpc("datos_consulta", { p_token: tk })
        .then(d => { usarDatos(d); try { localStorage.setItem(CLAVE_LS, JSON.stringify(d)); } catch (e) {} return d; })
        .catch(e => {
          // Sin conexión: se trabaja con la última copia guardada en este equipo
          if (e.red) { let c = null; try { c = JSON.parse(localStorage.getItem(CLAVE_LS) || "null"); } catch (x) {} if (c) { usarDatos(c); return c; } }
          throw e;
        })
        .finally(() => { cargando = null; });
    }
    return cargando;
  }

  // Consultas que la versión nueva ya resuelve
  const LECTURA = new Set(["webInit", "webInventario", "webCatalogo", "webCanales", "webResumen", "webPocos", "webHuecos", "webVacios",
    "webOrganizar", "webConsolidar", "webInfiltrados", "webAvanzados", "webMezclados", "webAcomodar", "webEnvasado", "webConsumo",
    "webCarpa", "webBarriles", "webLimbo", "webTurno"]);
  const AVISO = {
    webSincronizar: "Para traer el WMS usa ⟳ en el dashboard actual o /sincronizar en el bot. Aquí se ve apenas termine (vuelve a abrir la página).",
    webPDF: "Los PDF todavía se sacan del dashboard actual.",
    webPDFTelegram: "Los PDF todavía se envían desde el dashboard actual.",
    webCambiarPin: "El PIN todavía se cambia en el dashboard actual.",
    webSetup: "Los usuarios se crean en el dashboard actual y se importan a Supabase."
  };
  const NO_AUN = "Esta versión nueva es solo de consulta por ahora. Hazlo en el dashboard actual (llega en la fase 4).";

  // ⟳ Sincronizar: lo hace Apps Script (tiene la clave del WMS). Autoriza con la sesión de Supabase.
  async function sincronizar(tk, forzar, ok, fallo) {
    if (!CFG.appsScriptUrl) return fallo(AVISO.webSincronizar);
    let r;
    try {
      r = await fetch(CFG.appsScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ accion: "sincronizar", token: tk, forzar: !!forzar }) });
    } catch (e) { const er = new Error("NetworkError: no se pudo conectar"); er.red = true; throw er; }
    let j = null;
    try { j = await r.json(); } catch (e) { return fallo("Apps Script no respondió bien (¿está publicada la versión nueva del código?)."); }
    if (!j.ok) return fallo(j.error || "No se pudo sincronizar.", j.sesion ? { sesion: true } : null);
    await cargarDatos(tk, true);
    const inv = JSON.parse(MOTOR.llamar("webInventario", [tk])).data;
    if (j.supabase && j.supabase.error) return fallo("El WMS se guardó en las hojas, pero no llegó a Supabase: " + j.supabase.error);
    return ok({ filas: j.filas, modulos: j.modulos, inv: inv });
  }

  // ---------- escrituras (fase 4a) ----------
  // La acción corre primero en el motor (mismas reglas y mensajes del Frecs actual) sobre
  // una copia fresca de los datos; luego solo las filas que cambiaron van a Supabase
  // (guardar_filas), que revisa la sesión y el rol. Si Supabase lo rechaza, se deshace.
  const ESCRITURA = {
    webLimboAgregar: ["Limbo"], webLimboEliminar: ["Limbo"],
    webConsumoAgregar: ["Consumo"], webConsumoEliminar: ["Consumo"], webConsumoElegir: ["Consumo"],
    webSkuGuardar: ["Sku"], webSkuEliminar: ["Sku"], webCanalesGuardar: ["Canales"]
  };
  const txt = v => (v === null || v === undefined) ? "" : String(v).trim();
  const nul = v => { const t = txt(v); return t === "" ? null : t; };
  const num = v => { const t = txt(v).replace(",", "."); if (t === "") return null; const n = Number(t); return isFinite(n) ? n : null; };
  const ts = v => { const t = txt(v); const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?$/.exec(t); return m ? `${m[1]}T${m[2]}${m[3] || ":00"}-05:00` : (t || null); };
  const HOJAS = {
    Limbo: { tabla: "limbo", clave: f => f.id, fila: r => ({ id: txt(r[0]), producto: txt(r[1]) || "(sin nombre)", vencimiento: nul(r[2]), presentacion: nul(r[3]), cubicaje: nul(r[4]), fecha_reporte: nul(r[5]) }) },
    Consumo: { tabla: "consumo", clave: f => f.sku, fila: (r, k) => ({ sku: txt(r[0]), producto: nul(r[1]), modulo_elegido: nul(r[2]), elegido_por: nul(r[3]), elegido_en: ts(r[4]), orden: k + 1 }) },
    Sku: { tabla: "sku", clave: f => f.sku, fila: (r, k, cab) => {
      const c = n => cab.indexOf(n), v = n => (c(n) === -1 ? "" : r[c(n)]);
      return { id_hoja: nul(v("Id")), sku: txt(v("SKU")), producto: txt(v("Producto")) || txt(v("SKU")), cubicaje: nul(v("Cubicaje")), piso: nul(v("Piso")), plancha: nul(v("Plancha")),
        cant_x_estiba: nul(v("Cant x Estibas")), presentacion: nul(v("Presentacion")), usuario: nul(v("Usuario")), contexto: nul(v("Contexto")),
        minimo: num(v("Minimo")), t1: num(v("T1")), t2: num(v("T2")), ka: num(v("KA")), estibas_por_cara: num(v("Estibas_por_cara")) };
    } },
    Canales: { tabla: "canales", reemplazar: true, fila: (r, k) => ({ orden: k + 1, canal: txt(r[0]).toUpperCase(), tipo: txt(r[1]), valor: txt(r[2]), dias_minimos: Math.round(num(r[3]) || 0), nota: nul(r[4]) }) }
  };
  function filasDe(nombre, datosHoja) {
    const cfg = HOJAS[nombre], cab = (datosHoja[0] || []).map(String);
    // Solo filas con dato clave (en Sku la primera columna es el Id, que puede ir vacío)
    return datosHoja.slice(1).filter(r => r && r.some(v => txt(v) !== "")).map((r, k) => cfg.fila(r, k, cab))
      .filter(f => cfg.clave ? txt(cfg.clave(f)) !== "" : txt(f.canal) !== "");
  }
  function cambiosDe(nombre, antes, despues) {
    const cfg = HOJAS[nombre], a = filasDe(nombre, antes), d = filasDe(nombre, despues);
    if (cfg.reemplazar) return JSON.stringify(a) === JSON.stringify(d) ? null : { tabla: cfg.tabla, reemplazar: true, poner: d };
    const mapA = new Map(a.map(f => [cfg.clave(f), JSON.stringify(f)])), claves = new Set(d.map(cfg.clave));
    const poner = d.filter(f => mapA.get(cfg.clave(f)) !== JSON.stringify(f));
    const quitar = a.filter(f => !claves.has(cfg.clave(f))).map(f => { const o = {}; o[cfg.tabla === "limbo" ? "id" : "sku"] = cfg.clave(f); return o; });
    return poner.length || quitar.length ? { tabla: cfg.tabla, poner: poner, quitar: quitar } : null;
  }
  // Avisa a Apps Script para que copie el cambio a las hojas (bot y dashboard actual). No se espera.
  function avisarHojas(tk, tablas) {
    if (!CFG.appsScriptUrl) return;
    fetch(CFG.appsScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ accion: "maestros", token: tk, tablas: tablas }) }).catch(() => {});
  }
  async function escribir(fn, args, ok, fallo) {
    const tk = args[0], hojas = ESCRITURA[fn];
    await cargarDatos(tk, true);                     // lo más reciente antes de cambiar
    const antes = MOTOR.foto(hojas);
    const r = JSON.parse(MOTOR.llamar(fn, args));    // reglas del Frecs actual
    if (!r.ok) return JSON.stringify(r);
    const despues = MOTOR.foto(hojas);
    const cambios = hojas.map(h => cambiosDe(h, antes[h], despues[h])).filter(Boolean);
    if (cambios.length) {
      try { await rpc("guardar_filas", { p_token: tk, p_cambios: cambios }); }
      catch (e) {
        datos = null; cargarDatos(tk, true).catch(() => {});   // se deshace con lo que hay en la base
        if (e.red) throw e;
        const m = String(e.message || e);
        if (m.indexOf("SESION:") === 0) return fallo(m.replace("SESION:", "").trim(), { sesion: true });
        return fallo(m.replace(/^PERMISO:\s*/, ""));
      }
      avisarHojas(tk, cambios.map(c => c.tabla));
      cargarDatos(tk, true).catch(() => {});
    }
    return JSON.stringify(r);
  }

  async function ejecutar(fn, args) {
    const ok = data => JSON.stringify({ ok: true, data: data });
    const fallo = (msg, extra) => JSON.stringify(Object.assign({ ok: false, error: msg }, extra || {}));
    try {
      if (fn === "webPublico") { const r = await rpc("ingreso_nombres", {}); return ok({ setup: false, nombres: r.nombres || [] }); }
      if (fn === "webLogin") {
        const r = await rpc("ingresar", { p_nombre: args[0], p_pin: args[1] });
        if (!r || !r.ok) return fallo((r && r.error) || "No se pudo ingresar.");
        datos = null;
        return ok({ token: r.token, usuario: r.usuario });
      }
      if (fn === "webLogout") { try { await rpc("salir", { p_token: args[0] }); } catch (e) {} datos = null; try { localStorage.removeItem(CLAVE_LS); } catch (e) {} return ok(true); }
      if (fn === "webSincronizar") return await sincronizar(args[0], args[1] === true, ok, fallo);
      if (ESCRITURA[fn]) return await escribir(fn, args, ok, fallo);
      if (LECTURA.has(fn)) {
        await cargarDatos(args[0], fn === "webInit" || fn === "webInventario");
        return MOTOR.llamar(fn, args);
      }
      return fallo(AVISO[fn] || NO_AUN);
    } catch (e) {
      const m = String((e && e.message) || e);
      if (m.indexOf("SESION:") === 0) { datos = null; return fallo(m.replace("SESION:", "").trim(), { sesion: true }); }
      if (e && e.red) throw e;
      return fallo(m);
    }
  }

  // google.script.run.withSuccessHandler(ok).withFailureHandler(fail).funcion(...args)
  window.google = window.google || {};
  window.google.script = {
    get run() {
      let alOk = null, alFallar = null;
      const p = new Proxy({}, {
        get(t, k) {
          if (k === "withSuccessHandler") return f => { alOk = f; return p; };
          if (k === "withFailureHandler") return f => { alFallar = f; return p; };
          return (...a) => { ejecutar(String(k), a).then(r => alOk && alOk(r)).catch(e => alFallar && alFallar(e)); };
        }
      });
      return p;
    }
  };

  // ---------- ajustes de la versión web (se llaman antes de arrancar la página) ----------
  window.FRECS_WEB = {
    ajustar() {
      // Consumo pasa a Operación; se quitan los grupos que todavía viven en el dashboard actual
      const turnos = NAV.find(g => g.g === "Turnos");
      const op = NAV.find(g => g.g === "Operación");
      if (turnos && op) { const c = turnos.items.find(i => i.id === "consumo"); if (c) op.items.push(c); }
      const fuera = ["Turnos", "Historial", "Reportes"];
      const adm = NAV.find(g => g.g === "Administración");
      if (adm) adm.items = adm.items.filter(i => { if (i.id === "usuarios") { delete VISTAS[i.id]; return false; } return true; });
      for (let k = NAV.length - 1; k >= 0; k--) if (fuera.includes(NAV[k].g)) {
        NAV[k].items.forEach(i => { if (i.id !== "consumo") delete VISTAS[i.id]; });
        NAV.splice(k, 1);
      }
      // Barra de abajo (celular): Inicio, Stock, Producto, Pocos
      const bb = document.getElementById("bottombar");
      if (bb) bb.innerHTML = [["inicio", "🏠", "Inicio"], ["stock", "📡", "Stock"], ["producto", "🔍", "Producto"], ["pocos", "🧯", "Pocos"]]
        .map(x => `<button data-v="${x[0]}"><span class="ic">${x[1]}</span>${x[2]}</button>`).join("");
      // Aviso de versión
      const aviso = document.createElement("div");
      aviso.className = "web-aviso";
      aviso.innerHTML = `🧪 <b>Versión nueva (Supabase)</b> · consultas, Limbo, Consumo, Sku y Canales. Turnos, PDF y usuarios: en el dashboard actual.`;
      const off = document.getElementById("offBar");
      if (off && off.parentNode) off.parentNode.insertBefore(aviso, off.nextSibling);
      document.body.classList.add("con-aviso");
      if (CFG.appsScriptUrl) document.body.classList.add("con-sync");
    }
  };
})();

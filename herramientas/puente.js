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
      const fuera = ["Turnos", "Historial", "Reportes", "Administración"];
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
      aviso.innerHTML = `🧪 <b>Versión nueva (Supabase)</b> · solo consultas. Turnos, PDF y cambios: en el dashboard actual.`;
      const off = document.getElementById("offBar");
      if (off && off.parentNode) off.parentNode.insertBefore(aviso, off.nextSibling);
      document.body.classList.add("con-aviso");
    }
  };
})();

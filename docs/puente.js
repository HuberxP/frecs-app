// =====================================================================
// PUENTE: reemplaza google.script.run del dashboard de Apps Script.
// - Ingreso, salida: funciones de Supabase (rpc).
// - Consultas: los datos llegan de Supabase en UNA llamada (datos_consulta) y la
//   misma lógica del servidor (motor.js) los calcula aquí en el navegador.
// - Escrituras: la acción corre en el motor y solo las filas que cambiaron van a
//   Supabase (guardar_filas). Maestros (4a) y turnos, validación y entrega (4b).
// - PDF, conciliación, historiales y usuarios: todavía en el dashboard actual.
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
  let datos = null, cargando = null, cargandoT = null, turnosEn = 0;
  const CLAVE_LS = "frecs_motor";
  const FRESCO_TURNOS_MS = 15000;   // varias personas trabajan el mismo turno: se relee si tiene más de 15 s
  function guardarLS() { try { localStorage.setItem(CLAVE_LS, JSON.stringify(datos)); } catch (e) {} }
  function usarDatos(d) { datos = d; turnosEn = Date.now(); MOTOR.cargar(d); }
  async function cargarDatos(tk, forzar) {
    if (datos && !forzar) return datos;
    if (!cargando) {
      cargando = rpc("datos_consulta", { p_token: tk })
        .then(d => { usarDatos(d); guardarLS(); return d; })
        .catch(e => {
          // Sin conexión: se trabaja con la última copia guardada en este equipo
          if (e.red) { let c = null; try { c = JSON.parse(localStorage.getItem(CLAVE_LS) || "null"); } catch (x) {} if (c) { usarDatos(c); return c; } }
          throw e;
        })
        .finally(() => { cargando = null; });
    }
    return cargando;
  }

  // Solo turnos, validación y entrega (sin volver a bajar el WMS). Sin conexión: error de red.
  async function cargarTurnos(tk) {
    if (!datos) return cargarDatos(tk, true);
    if (!cargandoT) {
      cargandoT = rpc("datos_turnos", { p_token: tk })
        .then(dt => { Object.assign(datos, dt); turnosEn = Date.now(); MOTOR.cargarTurnos(dt); guardarLS(); return datos; })
        .finally(() => { cargandoT = null; });
    }
    return cargandoT;
  }
  const TURNO_LECTURA = new Set(["webTurno", "webVal", "webValSugerencias", "webEnt"]);

  // Consultas que la versión nueva ya resuelve
  const LECTURA = new Set(["webInit", "webInventario", "webCatalogo", "webCanales", "webResumen", "webPocos", "webHuecos", "webVacios",
    "webOrganizar", "webConsolidar", "webInfiltrados", "webAvanzados", "webMezclados", "webAcomodar", "webEnvasado", "webConsumo",
    "webCarpa", "webBarriles", "webLimbo", "webTurno", "webVal", "webValSugerencias", "webEnt"]);
  const AVISO = {
    webSincronizar: "Para traer el WMS usa ⟳ en el dashboard actual o /sincronizar en el bot. Aquí se ve apenas termine (vuelve a abrir la página).",
    webPDF: "Los PDF todavía se sacan del dashboard actual.",
    webPDFTelegram: "Los PDF todavía se envían desde el dashboard actual.",
    webCambiarPin: "El PIN todavía se cambia en el dashboard actual.",
    webSetup: "Los usuarios se crean en el dashboard actual y se importan a Supabase."
  };
  const NO_AUN = "Esto todavía se hace en el dashboard actual (llega en la siguiente fase).";

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
  // Fase 4b: turnos, validación y entrega. Se comparan todas sus hojas como tablas lógicas.
  const ESCRITURA_TURNO = new Set(["webTurnoAbrir", "webTurnoCerrar", "webTurnoNota", "webTurnoEliminar", "webTurnoRestaurar",
    "webValAgregar", "webValInicial", "webValQuitar", "webValRegistrar", "webValEditar", "webValAnular", "webValDestino",
    "webEntPrecargar", "webEntGuardar", "webEntQuitar", "webEntNota", "webEntNotaEditar", "webEntNotaQuitar"]);
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
  // Cantidades de la entrega: siempre {n, un, m} en ese orden (la base las devuelve en otro)
  const cantJSON = v => { let a = []; try { a = JSON.parse(txt(v) || "[]"); } catch (e) { a = []; } return (Array.isArray(a) ? a : []).map(x => ({ n: Number(x.n) || 0, un: String(x.un || "Cajas"), m: String(x.m || "") })); };
  const filaReg = r => ({ id: txt(r[0]), turno_id: txt(r[1]), fecha: ts(r[2]), sku: txt(r[3]), producto: nul(r[4]), destino: nul(r[5]), cantidad: num(r[6]),
    usuario: nul(r[7]), nota: nul(r[8]), estado: txt(r[9]).toUpperCase() || "ACTIVO", modificado_por: nul(r[10]), contado_en: ts(r[11]) });
  // Una tabla de Supabase puede venir de varias hojas (la del turno abierto y la del historial).
  // En el historial faltan columnas (Actualizado, Usuario): se comparan y se mandan solo las que hay.
  const LOGICAS = [
    { tabla: "turnos", pk: ["id"], hojas: { Turnos: r => ({ id: txt(r[0]), numero: num(r[1]), fecha: nul(txt(r[2]).substring(0, 10)), estado: txt(r[3]).toUpperCase(),
      inicio: ts(r[4]), abierto_por: nul(r[5]), cierre: ts(r[6]), cerrado_por: nul(r[7]), recibe_de_id: nul(r[8]), recibe_de: nul(r[9]), nota: nul(r[10]),
      editado_por: nul(r[11]), eliminado_por: nul(r[12]) }) } },
    { tabla: "val_productos", pk: ["turno_id", "sku"], hojas: {
      Val_Productos: r => ({ turno_id: txt(r[0]), sku: txt(r[1]), producto: nul(r[2]), inicial: num(r[3]) || 0, actualizado: ts(r[4]), usuario: nul(r[5]), contado_en: ts(r[6]) }),
      Val_Hist_Productos: r => ({ turno_id: txt(r[0]), sku: txt(r[1]), producto: nul(r[2]), inicial: num(r[3]) || 0, contado_en: ts(r[7]) }) } },
    { tabla: "val_registros", pk: ["id"], hojas: { Val_Registros: filaReg, Val_Hist_Registros: filaReg } },
    { tabla: "destinos", pk: ["nombre"], hojas: { Val_Destinos: (r, k) => ({ nombre: txt(r[0]), orden: k + 1 }) } },
    { tabla: "ent_items", pk: ["turno_id", "seccion", "sku"], hojas: { Ent_Items: r => ({ turno_id: txt(r[0]), seccion: txt(r[1]).toUpperCase(), sku: txt(r[2]),
      producto: nul(r[3]), cantidades: cantJSON(r[4]), actualizado: ts(r[5]), usuario: nul(r[6]), origen: nul(r[7]) }) } },
    { tabla: "ent_notas", pk: ["id"], hojas: { Ent_Notas: r => ({ id: txt(r[1]), turno_id: txt(r[0]), hora: ts(r[2]), usuario: nul(r[3]), texto: txt(r[4]) }) } }
  ];
  const HOJAS_TURNO = [].concat(...LOGICAS.map(L => Object.keys(L.hojas)));
  function cambiosTurno(antes, despues) {
    const out = [];
    LOGICAS.forEach(L => {
      const clave = f => L.pk.map(k => txt(f[k])).join("\u0001");
      const leer = foto => {
        const m = new Map();
        Object.keys(L.hojas).forEach(h => (foto[h] || []).slice(1).filter(r => r && r.some(v => txt(v) !== "")).forEach((r, k) => {
          const f = L.hojas[h](r, k);
          if (L.pk.every(p => txt(f[p]) !== "")) m.set(clave(f), f);
        }));
        return m;
      };
      const A = leer(antes), D = leer(despues), grupos = {}, quitar = [];
      D.forEach((f, k) => {
        const a = A.get(k);
        if (a && Object.keys(f).every(c => JSON.stringify(f[c]) === JSON.stringify(a[c]))) return;
        const firma = Object.keys(f).join(",");
        (grupos[firma] = grupos[firma] || []).push(f);
      });
      A.forEach((f, k) => { if (!D.has(k)) { const o = {}; L.pk.forEach(p => { o[p] = f[p]; }); quitar.push(o); } });
      const firmas = Object.keys(grupos);
      if (!firmas.length && quitar.length) out.push({ tabla: L.tabla, poner: [], quitar: quitar });
      firmas.forEach((fm, i) => out.push({ tabla: L.tabla, poner: grupos[fm], quitar: i === 0 ? quitar : [] }));
    });
    return out;
  }
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
    const tk = args[0], esTurno = ESCRITURA_TURNO.has(fn), hojas = esTurno ? HOJAS_TURNO : ESCRITURA[fn];
    // Lo más reciente antes de cambiar (en turnos basta releer los turnos; sin conexión, error de red → cola)
    if (esTurno) await cargarTurnos(tk); else await cargarDatos(tk, true);
    const antes = MOTOR.foto(hojas);
    const r = JSON.parse(MOTOR.llamar(fn, args));    // reglas del Frecs actual
    if (!r.ok) return JSON.stringify(r);
    const despues = MOTOR.foto(hojas);
    const cambios = esTurno ? cambiosTurno(antes, despues) : hojas.map(h => cambiosDe(h, antes[h], despues[h])).filter(Boolean);
    if (cambios.length) {
      try { await rpc("guardar_filas", { p_token: tk, p_cambios: cambios }); }
      catch (e) {
        // Se deshace con lo que hay en la base
        if (esTurno) { turnosEn = 0; cargarTurnos(tk).catch(() => {}); } else { datos = null; cargarDatos(tk, true).catch(() => {}); }
        if (e.red) throw e;
        const m = String(e.message || e);
        if (m.indexOf("SESION:") === 0) return fallo(m.replace("SESION:", "").trim(), { sesion: true });
        return fallo(m.replace(/^PERMISO:\s*/, ""));
      }
      if (esTurno) { turnosEn = Date.now(); guardarLS(); }
      else { avisarHojas(tk, cambios.map(c => c.tabla)); cargarDatos(tk, true).catch(() => {}); }
    }
    return JSON.stringify(r);
  }
  // Una escritura a la vez (en orden), para que cada una parta de lo que guardó la anterior
  let cadena = Promise.resolve();
  function escribirEnOrden(fn, args, ok, fallo) {
    const p = cadena.then(() => escribir(fn, args, ok, fallo));
    cadena = p.catch(() => {});
    return p;
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
      if (ESCRITURA[fn] || ESCRITURA_TURNO.has(fn)) return await escribirEnOrden(fn, args, ok, fallo);
      if (LECTURA.has(fn)) {
        await cargarDatos(args[0], fn === "webInit" || fn === "webInventario");
        if (TURNO_LECTURA.has(fn) && Date.now() - turnosEn > FRESCO_TURNOS_MS) { await cadena; await cargarTurnos(args[0]); }
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
      // Turnos: solo Validaciones, Entrega y Consumo (conciliación y pre-conciliación llegan en la 4c)
      const turnos = NAV.find(g => g.g === "Turnos");
      if (turnos) turnos.items = turnos.items.filter(i => { if (["conciliacion", "preconciliacion"].includes(i.id)) { delete VISTAS[i.id]; return false; } return true; });
      const fuera = ["Historial", "Reportes"];
      const adm = NAV.find(g => g.g === "Administración");
      if (adm) adm.items = adm.items.filter(i => { if (i.id === "usuarios") { delete VISTAS[i.id]; return false; } return true; });
      for (let k = NAV.length - 1; k >= 0; k--) if (fuera.includes(NAV[k].g)) {
        NAV[k].items.forEach(i => delete VISTAS[i.id]);
        NAV.splice(k, 1);
      }
      // Aviso de versión
      const aviso = document.createElement("div");
      aviso.className = "web-aviso";
      aviso.innerHTML = `🧪 <b>Versión nueva</b> · <b>Turnos en modo prueba:</b> lo que hagas aquí en Validación y Entrega no pasa al dashboard actual ni al bot.<span class="solo-escritorio"> PDF, conciliación, historiales y usuarios: en el dashboard actual.</span>`;
      const off = document.getElementById("offBar");
      if (off && off.parentNode) off.parentNode.insertBefore(aviso, off.nextSibling);
      document.body.classList.add("con-aviso");
      if (CFG.appsScriptUrl) document.body.classList.add("con-sync");
    }
  };
})();

// =====================================================================
// PUENTE: reemplaza google.script.run del dashboard de Apps Script.
// - Ingreso, salida: funciones de Supabase (rpc).
// - Consultas: los datos llegan de Supabase en UNA llamada (datos_consulta) y la
//   misma lógica del servidor (motor.js) los calcula aquí en el navegador.
// - Escrituras: la acción corre en el motor y solo las filas que cambiaron van a
//   Supabase (guardar_filas). Maestros (4a) y turnos, validación y entrega (4b).
//   Conciliación, pre-conciliación e historiales (4c). Usuarios y PIN: funciones de Supabase.
// - PDF: el motor arma el HTML y aquí se pasa a PDF (jsPDF + html2canvas, carpeta vendor/).
//   Para Telegram, Apps Script solo lo envía al grupo (el token del bot vive allá).
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
  // Turnos y conciliaciones viejos que se abrieron desde el historial (se piden aparte)
  const extras = new Set();
  const ES_ID = /^[TC]\d{8}-\d{6}(-\d+)?$/;
  const CLAVE_LS = "frecs_motor";
  const FRESCO_TURNOS_MS = 15000;   // varias personas trabajan el mismo turno: se relee si tiene más de 15 s
  function guardarLS() { try { localStorage.setItem(CLAVE_LS, JSON.stringify(datos)); } catch (e) {} }
  function usarDatos(d) { datos = d; turnosEn = Date.now(); MOTOR.cargar(d); pintarModo(); }
  async function cargarDatos(tk, forzar) {
    if (datos && !forzar) return datos;
    if (!cargando) {
      cargando = rpc("datos_consulta", { p_token: tk, p_extra: [...extras] })
        .then(d => { usarDatos(d); guardarLS(); if (turnosReales()) espejoTurnos(tk, null); return d; })
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
      cargandoT = rpc("datos_turnos", { p_token: tk, p_extra: [...extras] })
        .then(dt => { Object.assign(datos, dt); turnosEn = Date.now(); MOTOR.cargarTurnos(dt); guardarLS(); pintarModo(); return datos; })
        .finally(() => { cargandoT = null; });
    }
    return cargandoT;
  }
  const TURNO_LECTURA = new Set(["webTurno", "webVal", "webValSugerencias", "webEnt", "webConc", "webHistorial", "webFinal"]);
  // Si la llamada nombra un turno o conciliación que no está cargado, se agrega a los que se piden
  function pideExtras(args) {
    let nuevo = false;
    // (el PDF de la entrega final nombra varios: "turno|conc,conc|partes")
    (args || []).slice(1).forEach(a => { if (typeof a === "string") a.split(/[|,]/).forEach(x => { if (ES_ID.test(x) && !extras.has(x)) { extras.add(x); nuevo = true; } }); });
    return nuevo;
  }

  // Consultas que la versión nueva ya resuelve
  const LECTURA = new Set(["webInit", "webInventario", "webCatalogo", "webCanales", "webResumen", "webPocos", "webHuecos", "webVacios",
    "webOrganizar", "webConsolidar", "webInfiltrados", "webAvanzados", "webMezclados", "webAcomodar", "webEnvasado", "webConsumo",
    "webCarpa", "webBarriles", "webLimbo", "webCapacidad", "webTurno", "webVal", "webValSugerencias", "webEnt", "webConc", "webHistorial", "webFinal"]);
  const AVISO = {
    webSincronizar: "Para traer el WMS usa ⟳ en el dashboard actual o /sincronizar en el bot. Aquí se ve apenas termine (vuelve a abrir la página).",
    webSetup: "Los usuarios se crean desde Administración → Usuarios.",
    webMantPrevia: "En la versión nueva no hace falta archivar: Supabase guarda el historial completo sin ponerse lento.",
    webMantArchivar: "En la versión nueva no hace falta archivar: Supabase guarda el historial completo sin ponerse lento."
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
    webSkuGuardar: ["Sku"], webSkuEliminar: ["Sku"], webCanalesGuardar: ["Canales"],
    webCapacidadGuardar: ["Capacidad_Bodega"], webCapacidadEliminar: ["Capacidad_Bodega"]
  };
  // Fase 4b: turnos, validación y entrega. Se comparan todas sus hojas como tablas lógicas.
  const ESCRITURA_TURNO = new Set(["webTurnoAbrir", "webTurnoCerrar", "webTurnoNota", "webTurnoEliminar", "webTurnoRestaurar",
    "webValAgregar", "webValInicial", "webValQuitar", "webValRegistrar", "webValEditar", "webValAnular", "webValDestino",
    "webEntPrecargar", "webEntGuardar", "webValFinal", "webEntTraerValidados", "webEntQuitar", "webEntQuitarSeccion", "webEntNota", "webEntNotaEditar", "webEntNotaQuitar",
    "webConcAbrir", "webConcAgregar", "webConcCopiar", "webConcGuardar", "webConcQuitar", "webConcCerrar", "webConcNota", "webConcEliminar", "webConcRestaurar",
    "webPreAgregar", "webPreQuitar", "webPreLimpiar"]);
  const txt = v => (v === null || v === undefined) ? "" : String(v).trim();
  const nul = v => { const t = txt(v); return t === "" ? null : t; };
  const num = v => { const t = txt(v).replace(",", "."); if (t === "") return null; const n = Number(t); return isFinite(n) ? n : null; };
  const bool = v => v === true || /^(true|si|sí|verdadero)$/i.test(txt(v));
  const ts = v => { const t = txt(v); const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?$/.exec(t); return m ? `${m[1]}T${m[2]}${m[3] || ":00"}-05:00` : (t || null); };
  const HOJAS = {
    Limbo: { tabla: "limbo", pk: "id", clave: f => f.id, fila: r => ({ id: txt(r[0]), producto: txt(r[1]) || "(sin nombre)", vencimiento: nul(r[2]), presentacion: nul(r[3]), cubicaje: nul(r[4]), fecha_reporte: nul(r[5]) }) },
    Consumo: { tabla: "consumo", pk: "sku", clave: f => f.sku, fila: (r, k) => ({ sku: txt(r[0]), producto: nul(r[1]), modulo_elegido: nul(r[2]), elegido_por: nul(r[3]), elegido_en: ts(r[4]), orden: k + 1 }) },
    Sku: { tabla: "sku", pk: "sku", clave: f => f.sku, fila: (r, k, cab) => {
      const c = n => cab.indexOf(n), v = n => (c(n) === -1 ? "" : r[c(n)]);
      return { id_hoja: nul(v("Id")), sku: txt(v("SKU")), producto: txt(v("Producto")) || txt(v("SKU")), cubicaje: nul(v("Cubicaje")), piso: nul(v("Piso")), plancha: nul(v("Plancha")),
        cant_x_estiba: nul(v("Cant x Estibas")), presentacion: nul(v("Presentacion")), usuario: nul(v("Usuario")), contexto: nul(v("Contexto")),
        minimo: num(v("Minimo")), t1: num(v("T1")), t2: num(v("T2")), ka: num(v("KA")), estibas_por_cara: num(v("Estibas_por_cara")) };
    } },
    Capacidad_Bodega: { tabla: "capacidad_bodega", pk: "modulo", clave: f => f.modulo,
      fila: r => ({ modulo: txt(r[0]).toUpperCase(), caras: Math.round(num(r[1]) || 0), capacidad: num(r[2]) === null ? null : Math.round(num(r[2])) }) },
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
      Val_Productos: r => ({ turno_id: txt(r[0]), sku: txt(r[1]), producto: nul(r[2]), inicial: num(r[3]) || 0, actualizado: ts(r[4]), usuario: nul(r[5]), contado_en: ts(r[6]),
        bodega: num(r[7]), pk: num(r[8]), ka: num(r[9]), por_confirmar: bool(r[10]), final: num(r[11]), final_en: ts(r[12]) }),
      Val_Hist_Productos: r => ({ turno_id: txt(r[0]), sku: txt(r[1]), producto: nul(r[2]), inicial: num(r[3]) || 0, contado_en: ts(r[7]),
        bodega: num(r[8]), pk: num(r[9]), ka: num(r[10]), por_confirmar: bool(r[11]), final: num(r[12]), final_en: ts(r[13]) }) } },
    { tabla: "val_registros", pk: ["id"], hojas: { Val_Registros: filaReg, Val_Hist_Registros: filaReg } },
    { tabla: "destinos", pk: ["nombre"], hojas: { Val_Destinos: (r, k) => ({ nombre: txt(r[0]), orden: k + 1 }) } },
    { tabla: "ent_items", pk: ["turno_id", "seccion", "sku"], hojas: { Ent_Items: r => ({ turno_id: txt(r[0]), seccion: txt(r[1]).toUpperCase(), sku: txt(r[2]),
      producto: nul(r[3]), cantidades: cantJSON(r[4]), actualizado: ts(r[5]), usuario: nul(r[6]), origen: nul(r[7]) }) } },
    { tabla: "ent_notas", pk: ["id"], hojas: { Ent_Notas: r => ({ id: txt(r[1]), turno_id: txt(r[0]), hora: ts(r[2]), usuario: nul(r[3]), texto: txt(r[4]) }) } },
    { tabla: "conciliaciones", pk: ["id"], hojas: { Conciliaciones: r => ({ id: txt(r[0]), turno_id: nul(r[1]), numero: num(r[2]), fecha: nul(txt(r[3]).substring(0, 10)),
      estado: txt(r[4]).toUpperCase(), inicio: ts(r[5]), abierto_por: nul(r[6]), cierre: ts(r[7]), cerrado_por: nul(r[8]), nota: nul(r[9]), editado_por: nul(r[10]), eliminado_por: nul(r[11]) }) } },
    { tabla: "conc_items", pk: ["conc_id", "sku"], hojas: { Conc_Items: r => ({ conc_id: txt(r[0]), sku: txt(r[1]), producto: nul(r[2]), bodega: num(r[3]), ka: num(r[4]), pk: num(r[5]),
      facturacion: num(r[6]), bloqueo: bool(r[7]), actualizado: ts(r[8]), usuario: nul(r[9]), origen: nul(r[10]), nota: nul(r[11]) }) } },
    { tabla: "preconciliacion", pk: ["id"], hojas: { Preconciliacion: r => ({ id: txt(r[0]), fecha: ts(r[1]), turno: num(r[2]), sku: txt(r[3]), producto: nul(r[4]), motivo: nul(r[5]),
      usuario: nul(r[6]), estado: txt(r[7]).toUpperCase() || "PENDIENTE", conc_id: nul(r[8]) }) } }
  ];
  const HOJAS_TURNO = [].concat(...LOGICAS.map(L => Object.keys(L.hojas)));
  function cambiosTurno(antes, despues) {
    const out = [];
    const toca = { turnos: new Set(), concs: new Set(), otros: false };
    const anotar = (tabla, f) => {
      if (tabla === "turnos") toca.turnos.add(f.id);
      else if (tabla === "conciliaciones") toca.concs.add(f.id);
      else if (tabla === "conc_items") toca.concs.add(f.conc_id);
      else if (f.turno_id) toca.turnos.add(f.turno_id);
      else toca.otros = true;
    };
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
        anotar(L.tabla, f);
        const firma = Object.keys(f).join(",");
        (grupos[firma] = grupos[firma] || []).push(f);
      });
      A.forEach((f, k) => { if (!D.has(k)) { anotar(L.tabla, f); const o = {}; L.pk.forEach(p => { o[p] = f[p]; }); quitar.push(o); } });
      const firmas = Object.keys(grupos);
      if (!firmas.length && quitar.length) out.push({ tabla: L.tabla, poner: [], quitar: quitar });
      firmas.forEach((fm, i) => out.push({ tabla: L.tabla, poner: grupos[fm], quitar: i === 0 ? quitar : [] }));
    });
    out.toca = toca;
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
    const quitar = a.filter(f => !claves.has(cfg.clave(f))).map(f => { const o = {}; o[cfg.pk] = cfg.clave(f); return o; });
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
      if (esTurno) { turnosEn = Date.now(); guardarLS(); if (turnosReales()) espejoTurnos(tk, cambios.toca); }
      else { avisarHojas(tk, cambios.map(c => c.tabla)); cargarDatos(tk, true).catch(() => {}); }
    }
    return JSON.stringify(r);
  }
  // ---------- después del cambio definitivo (4d): copia de los turnos a las hojas ----------
  // Apps Script copia a las hojas lo que cambió (el bot y sus PDF leen de allá). Si falla, se
  // guarda en este equipo y se reintenta con el siguiente cambio.
  const CLAVE_ESPEJO = "frecs_espejo";
  const turnosReales = () => !!datos && datos.modo_turnos === "si";
  function espejoTurnos(tk, toca) {
    if (!CFG.appsScriptUrl) return;
    let p = { turnos: [], concs: [] };
    try { p = JSON.parse(localStorage.getItem(CLAVE_ESPEJO) || '{"turnos":[],"concs":[]}'); } catch (e) {}
    const t = new Set(p.turnos.concat(toca ? [...toca.turnos] : [])), c = new Set(p.concs.concat(toca ? [...toca.concs] : []));
    if (!t.size && !c.size && !(toca && toca.otros)) return;
    const pend = { turnos: [...t], concs: [...c] };
    try { localStorage.setItem(CLAVE_ESPEJO, JSON.stringify(pend)); } catch (e) {}
    fetch(CFG.appsScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ accion: "turnos", token: tk }, pend)) })
      .then(r => r.json()).then(j => {
        if (!j.ok) return;
        // Solo se borra lo que se copió (pudo llegar otro cambio mientras tanto)
        let q = { turnos: [], concs: [] }; try { q = JSON.parse(localStorage.getItem(CLAVE_ESPEJO) || "null") || q; } catch (e) {}
        const resto = { turnos: q.turnos.filter(x => !t.has(x)), concs: q.concs.filter(x => !c.has(x)) };
        try { if (resto.turnos.length || resto.concs.length) localStorage.setItem(CLAVE_ESPEJO, JSON.stringify(resto)); else localStorage.removeItem(CLAVE_ESPEJO); } catch (e) {}
      }).catch(() => {});
  }
  // Aviso de arriba: en modo prueba se muestra; después del cambio definitivo se quita
  function pintarModo() {
    const reales = turnosReales();
    document.querySelectorAll(".web-aviso.prueba").forEach(a => a.classList.toggle("hidden", reales));
    document.body.classList.toggle("con-aviso", !reales && !!document.querySelector(".web-aviso.prueba"));
  }

  // ---------- PDF en el navegador ----------
  let libsPdf = null;
  function cargarScript(src) {
    return new Promise((ok, mal) => {
      const s = document.createElement("script"); s.src = src; s.onload = ok;
      s.onerror = () => { const e = new Error("NetworkError: no se pudo cargar el generador de PDF"); e.red = true; mal(e); };
      document.head.appendChild(s);
    });
  }
  function cargarLibsPdf() {
    if (!libsPdf) libsPdf = Promise.all([window.html2canvas ? 0 : cargarScript("vendor/html2canvas.min.js"), window.jspdf ? 0 : cargarScript("vendor/jspdf.umd.min.js")])
      .catch(e => { libsPdf = null; throw e; });
    return libsPdf;
  }
  const MM = 96 / 25.4;   // px por mm
  // HTML del motor → PDF tamaño carta. Se dibuja página por página y nunca se corta una fila por la mitad.
  // modo "img": devuelve cada hoja como foto JPG (para compartir por WhatsApp como imagen)
  async function pdfDesdeHtml(html, modo) {
    await cargarLibsPdf();
    const horizontal = /size:\s*(letter\s+)?landscape/i.test(html);
    const pag = horizontal ? { w: 279.4, h: 215.9 } : { w: 215.9, h: 279.4 }, margen = 10;
    const anchoPx = Math.round((pag.w - 2 * margen) * MM), altoPag = (pag.h - 2 * margen) * MM;
    const ifr = document.createElement("iframe");
    ifr.setAttribute("aria-hidden", "true"); ifr.tabIndex = -1;
    ifr.style.cssText = `position:fixed;left:-30000px;top:0;width:${anchoPx}px;height:${Math.round(altoPag)}px;border:0;background:#fff`;
    document.body.appendChild(ifr);
    try {
      await new Promise(r => { ifr.onload = r; ifr.srcdoc = html; });
      const doc = ifr.contentDocument, body = doc.body;
      body.style.margin = "0"; body.style.background = "#fff";
      try { await doc.fonts.ready; } catch (e) {}
      const alto = Math.ceil(body.scrollHeight);
      ifr.style.height = alto + "px";
      const top0 = body.getBoundingClientRect().top;
      const pos = n => { const r = n.getBoundingClientRect(); return [r.top - top0, r.bottom - top0]; };
      const estilo = n => doc.defaultView.getComputedStyle(n), todos = [...body.querySelectorAll("*")];
      // No se corta dentro de una fila ni de un bloque "no partir" (si cabe en una página)
      const enteros = todos.filter(n => n.tagName === "TR" || estilo(n).breakInside === "avoid" || estilo(n).pageBreakInside === "avoid")
        .map(pos).filter(f => f[1] - f[0] < altoPag * 0.6);
      const partiria = y => enteros.some(f => y > f[0] + 0.5 && y < f[1] - 0.5);
      const cortes = new Set();
      todos.forEach(n => pos(n).forEach(y => { if (!partiria(y)) cortes.add(Math.round(y)); }));
      // Saltos de página pedidos por el HTML (antes o después de un elemento)
      const forzados = [];
      todos.forEach(n => {
        const cs = estilo(n);
        if (cs.breakBefore === "page" || cs.pageBreakBefore === "always") forzados.push(Math.round(pos(n)[0]));
        if (cs.breakAfter === "page" || cs.pageBreakAfter === "always") forzados.push(Math.round(pos(n)[1]));
      });
      // 1) Dónde cortar cada página (nunca dentro de una fila)
      const paginas = [];
      let y = 0;
      while (y < alto - 2 && paginas.length < 300) {
        const lim = y + altoPag;
        const f = forzados.filter(v => v > y + 2 && v < lim).sort((a, b) => a - b)[0];
        let corte;
        if (f !== undefined) corte = f;
        else if (lim >= alto) corte = alto;
        else { const c = [...cortes].filter(v => v > y + altoPag * 0.3 && v <= lim); corte = c.length ? Math.max(...c) : Math.floor(lim); }
        paginas.push([y, corte]); y = corte;
      }
      // 2) Se dibujan varias páginas por vez (más rápido) sin pasar el límite de tamaño de imagen del celular
      // Más resolución = texto nítido (antes se veía borroso); los PDF largos un poco menos para no pesar tanto
      const largo = paginas.length > 8, escala = largo ? 2.2 : 2.8, calidad = largo ? 0.9 : 0.94;
      const maxPx = 12e6, porTrozo = Math.max(1, Math.floor(maxPx / (anchoPx * escala * altoPag * escala)));
      const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "letter", orientation: horizontal ? "landscape" : "portrait", compress: true });
      const fotos = [];
      for (let k = 0; k < paginas.length; k += porTrozo) {
        const grupo = paginas.slice(k, k + porTrozo), y0 = grupo[0][0], y1 = grupo[grupo.length - 1][1];
        const lienzo = await window.html2canvas(body, { scale: escala, backgroundColor: "#ffffff", x: 0, y: y0, width: anchoPx, height: y1 - y0, windowWidth: anchoPx, windowHeight: alto, logging: false, letterRendering: true });
        grupo.forEach((pg, n) => {
          const h = pg[1] - pg[0];
          const hoja = document.createElement("canvas");
          hoja.width = lienzo.width; hoja.height = Math.max(1, Math.round(h * escala));
          const cx = hoja.getContext("2d"); cx.imageSmoothingEnabled = false; cx.fillStyle = "#fff"; cx.fillRect(0, 0, hoja.width, hoja.height);
          cx.drawImage(lienzo, 0, Math.round((pg[0] - y0) * escala), lienzo.width, hoja.height, 0, 0, lienzo.width, hoja.height);
          if (modo === "img") {
            // Foto de la hoja completa (con su margen blanco), tamaño carta
            const foto = document.createElement("canvas"), mg = Math.round(margen * MM * escala);
            foto.width = hoja.width + 2 * mg; foto.height = Math.round((pag.h * MM) * escala);
            const fx = foto.getContext("2d"); fx.fillStyle = "#fff"; fx.fillRect(0, 0, foto.width, foto.height); fx.drawImage(hoja, mg, mg);
            fotos.push(foto.toDataURL("image/jpeg", 0.92));
            return;
          }
          if (k + n) pdf.addPage();
          pdf.addImage(hoja.toDataURL("image/jpeg", calidad), "JPEG", margen, margen, pag.w - 2 * margen, h / MM);
        });
      }
      if (modo === "img") return fotos;
      return pdf.output("datauristring").split(",")[1];
    } finally { ifr.remove(); }
  }
  async function pdfDe(tipo, id) {
    const p = MOTOR.pdf(tipo, id || "");
    return { nombre: p.nombre, b64: await pdfDesdeHtml(p.html), caption: p.caption };
  }
  // El envío lo hace la función del bot en Supabase; si aún no está lista (bot sin pasar), lo hace Apps Script
  const URL_BOT = CFG.botUrl || (CFG.supabaseUrl ? CFG.supabaseUrl.replace(/\/+$/, "") + "/functions/v1/frecs-bot" : "");
  async function pdfATelegram(tk, p) {
    let errBot = null;
    if (URL_BOT) {
      try {
        const rb = await fetch(URL_BOT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ accion: "pdf_telegram", token: tk, nombre: p.nombre, b64: p.b64, caption: p.caption }) });
        const jb = await rb.json();
        if (jb.ok) return true;
        if (jb.sesion) throw new Error("SESION:" + (jb.error || "Sesión vencida"));
        errBot = new Error(jb.error || "Telegram no aceptó el archivo.");
        if (/permiso/i.test(errBot.message)) throw errBot;
      } catch (e) { if (/^SESION:|permiso/i.test(e.message)) throw e; errBot = errBot || e; }
    }
    if (!CFG.appsScriptUrl) throw errBot || new Error("No está configurada la conexión con el bot.");
    let r;
    try { r = await fetch(CFG.appsScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ accion: "pdf_telegram", token: tk, nombre: p.nombre, b64: p.b64, caption: p.caption }) }); }
    catch (e) { const er = new Error("NetworkError: no se pudo conectar"); er.red = true; throw er; }
    let j = null; try { j = await r.json(); } catch (e) { throw new Error("Apps Script no respondió bien (¿está publicada la versión nueva del código?)."); }
    if (!j.ok) { const er = new Error(j.error || "Telegram no aceptó el archivo."); if (j.sesion) er.message = "SESION:" + er.message; throw er; }
    return true;
  }
  // Al cerrar turno o conciliación: los PDF se arman aquí (y se envían si lo pidieron)
  async function despuesDeEscribir(fn, args, res) {
    if (fn !== "webTurnoCerrar" && fn !== "webConcCerrar") return res;
    const r = JSON.parse(res);
    if (!r.ok) return res;
    const tk = args[0], opts = args[1] || {};
    try {
      // opts.pdf = false → solo cerrar; opts.telegram → al grupo (sin descargar si pdf es false)
      if (opts.pdf === false && !opts.telegram) return res;
      if (fn === "webTurnoCerrar") {
        const id = r.data.resultado.id;
        const pdfs = [await pdfDe("VALIDACION", opts.valTodo ? id + "|todo" : id), await pdfDe("ENTREGA", id)];
        if (opts.telegram) { r.data.telegram = true; for (const p of pdfs) { try { await pdfATelegram(tk, p); } catch (e) { r.data.telegram = false; } } }
        r.data.pdfs = opts.pdf === false ? [] : pdfs;
      } else {
        const pdf = await pdfDe("CONCILIACION", r.data.id);
        if (opts.telegram) { try { r.data.telegram = await pdfATelegram(tk, pdf); } catch (e) { r.data.telegram = false; } }
        r.data.pdf = opts.pdf === false ? null : pdf;
      }
    } catch (e) { console.warn("PDF al cerrar:", e); }
    return JSON.stringify(r);
  }

  // ---------- usuarios y PIN (funciones de Supabase) ----------
  async function usuarios(fn, args, ok) {
    const tk = args[0];
    if (fn === "webUsuarioGuardar") {
      const o = args[1] || {};
      await rpc("usuario_guardar", { p_token: tk, p_original: o.nombreOriginal || "", p_nombre: o.nombre || "", p_rol: o.rol || "", p_pin: o.pin || "", p_activo: o.activo !== false });
    }
    if (fn === "webUsuarioEliminar") await rpc("usuario_eliminar", { p_token: tk, p_nombre: args[1] });
    if (fn === "webCambiarPin") { await rpc("cambiar_pin", { p_token: tk, p_actual: args[1], p_nuevo: args[2] }); return ok(true); }
    return ok(await rpc("usuarios_listar", { p_token: tk }));
  }

  // ---------- reportes de módulos (vacío / conflicto): funciones de Supabase ----------
  // La lista fresca se pasa al motor (consumo y FEFO se saltan los reportados vacíos)
  async function reportes(fn, args, ok) {
    const tk = args[0];
    await cargarDatos(tk);
    let filas, extra = {};
    if (fn === "webReporteCrear") {
      const r = await rpc("reporte_crear", { p_token: tk, p_items: args[1] || [] });
      filas = r.reportes; extra = { creados: r.creados || [], repetidos: r.repetidos || [] };
      if (extra.creados.length) extra.telegram = await avisoReporte(tk, extra.creados);
    } else if (fn === "webReporteCerrar") filas = await rpc("reporte_cerrar", { p_token: tk, p_id: Number(args[1]), p_accion: String(args[2] || "") });
    else filas = await rpc("reportes_listar", { p_token: tk });
    datos.reportes = filas || [];
    MOTOR.cargarReportes(datos.reportes); guardarLS();
    const r = JSON.parse(MOTOR.llamar("webReportes", [tk]));
    if (!r.ok) return JSON.stringify(r);
    return ok(Object.assign(r.data, extra));
  }
  // Aviso al grupo de Telegram (lo arma Supabase con lo que se acaba de reportar). No frena el reporte si falla.
  async function avisoReporte(tk, ids) {
    if (!URL_BOT) return false;
    try {
      const rb = await fetch(URL_BOT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ accion: "reporte", token: tk, ids: ids }) });
      const jb = await rb.json();
      return !!jb.ok;
    } catch (e) { return false; }
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
      // Confirmar el PIN antes de cancelar un turno o una conciliación
      if (fn === "webVerificarPin") { const r = await rpc("verificar_pin", { p_token: args[0], p_pin: String(args[1] || "") }); return r && r.ok ? ok(true) : fallo((r && r.error) || "PIN incorrecto."); }
      if (fn === "webLogout") { try { await rpc("salir", { p_token: args[0] }); } catch (e) {} datos = null; try { localStorage.removeItem(CLAVE_LS); } catch (e) {} return ok(true); }
      if (fn === "webSincronizar") return await sincronizar(args[0], args[1] === true, ok, fallo);
      if (["webUsuarios", "webUsuarioGuardar", "webUsuarioEliminar", "webCambiarPin"].includes(fn)) return await usuarios(fn, args, ok);
      if (["webReportes", "webReporteCrear", "webReporteCerrar"].includes(fn)) return await reportes(fn, args, ok);
      // Preferencias de cada persona (p. ej. ver las sugerencias del WMS)
      if (fn === "webPref") {
        const p = await rpc("pref_guardar", { p_token: args[0], p_clave: String(args[1] || ""), p_valor: args[2] === undefined ? null : args[2] });
        if (datos && datos.usuario) { datos.usuario.prefs = p; guardarLS(); }
        return ok(p);
      }
      const nuevoExtra = pideExtras(args);
      if (ESCRITURA[fn] || ESCRITURA_TURNO.has(fn)) return await despuesDeEscribir(fn, args, await escribirEnOrden(fn, args, ok, fallo));
      if (fn === "webPDF" || fn === "webPDFTelegram" || fn === "webPDFHtml" || fn === "webPDFFotos") {
        await cargarDatos(args[0]);
        if (nuevoExtra || Date.now() - turnosEn > FRESCO_TURNOS_MS) { await cadena; await cargarTurnos(args[0]); }
        // Ver el informe tal cual (sin convertirlo) o sacarlo como fotos
        if (fn === "webPDFHtml") { const p = MOTOR.pdf(args[1], args[2] || ""); return ok({ nombre: p.nombre, html: p.html, caption: p.caption }); }
        if (fn === "webPDFFotos") { const p = MOTOR.pdf(args[1], args[2] || ""); return ok({ nombre: p.nombre, fotos: await pdfDesdeHtml(p.html, "img") }); }
        const p = await pdfDe(args[1], args[2]);
        if (fn === "webPDF") return ok({ nombre: p.nombre, b64: p.b64 });
        await pdfATelegram(args[0], p);
        return ok(true);
      }
      if (LECTURA.has(fn)) {
        await cargarDatos(args[0], fn === "webInit" || fn === "webInventario");
        if (nuevoExtra || (TURNO_LECTURA.has(fn) && Date.now() - turnosEn > FRESCO_TURNOS_MS)) { await cadena; await cargarTurnos(args[0]); }
        const res = MOTOR.llamar(fn, args);
        if (fn !== "webInit") return res;
        const r = JSON.parse(res);
        if (r.ok) r.data.grupoTelegram = !!(URL_BOT || CFG.appsScriptUrl);   // lo envía la función del bot (o Apps Script)
        return JSON.stringify(r);
      }
      return fallo(AVISO[fn] || NO_AUN);
    } catch (e) {
      const m = String((e && e.message) || e);
      if (m.indexOf("SESION:") === 0) { datos = null; return fallo(m.replace("SESION:", "").trim(), { sesion: true }); }
      if (e && e.red) throw e;
      return fallo(m.replace(/^PERMISO:\s*/, ""));
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

  // ---------- versión nueva publicada ----------
  // El celular deja la página abierta por días: al volver a ella se revisa si hay una versión nueva y se ofrece recargar
  let revisando = false;
  async function revisarVersion() {
    // Huella = las versiones de estilos y scripts que cargó esta página vs. las que tiene publicadas el servidor
    const huella = html => (html.match(/(?:app\.css|config\.js|motor\.js|puente\.js|app\.js)\?v=[\w]+/g) || []).sort().join("|");
    const mia = huella(document.documentElement.outerHTML);
    if (revisando || !mia || !navigator.onLine) return;
    revisando = true;
    try {
      const t = await (await fetch("index.html", { cache: "no-store" })).text();
      const nueva = huella(t);
      if (nueva && nueva !== mia && !document.getElementById("verChip")) {
        const b = document.createElement("button");
        b.id = "verChip"; b.className = "nuevo-chip ver-chip"; b.type = "button";
        b.textContent = "🔄 Hay una versión nueva · Actualizar";
        b.onclick = () => location.reload();
        document.body.appendChild(b);
      }
    } catch (e) {} finally { revisando = false; }
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) revisarVersion(); });
  setInterval(() => { if (!document.hidden) revisarVersion(); }, 10 * 60 * 1000);

  // ---------- ajustes de la versión web (se llaman antes de arrancar la página) ----------
  window.FRECS_WEB = {
    ajustar() {
      // Aviso de modo prueba (hasta el cambio definitivo, fase 4d)
      const aviso = document.createElement("div");
      aviso.className = "web-aviso prueba";
      aviso.innerHTML = `🧪 <b>Versión nueva</b> · <b>Turnos y conciliación en modo prueba:</b> lo que hagas aquí no pasa al dashboard actual ni al bot.<span class="solo-escritorio"> Limbo, Consumo, Sku y Canales sí se copian a las hojas.</span>`;
      const off = document.getElementById("offBar");
      if (off && off.parentNode) off.parentNode.insertBefore(aviso, off.nextSibling);
      document.body.classList.add("con-aviso");
      if (CFG.appsScriptUrl) document.body.classList.add("con-sync");
    }
  };
})();

// ---------------------------------------------------------------------
// Conexión del motor con la página
// ---------------------------------------------------------------------
let __usuario = null;
// La sesión la valida Supabase al entregar los datos; aquí solo se revisa el rol
usrSesion_ = function (tk, rolMinimo) {
  if (!__usuario) throw new Error("SESION: Ingresa con tu nombre y PIN.");
  if ((ROLES[__usuario.rol] || 0) < (ROLES[rolMinimo] || 1)) throw new Error(`No tienes permiso para esto (se necesita rol ${rolMinimo}).`);
  return { nombre: __usuario.nombre, rol: __usuario.rol, prefs: __usuario.prefs || {} };
};

// PDF: aquí no hay conversor de Apps Script; se devuelve el HTML y la página lo pasa a PDF
htmlAPdf_ = function (html, nombre) { return { __html: html, getName: () => nombre, getBytes: () => { throw new Error("PDF en el navegador"); } }; };

function __cargar(d) {
  __usuario = d.usuario || null;
  Object.keys(__libros).forEach(k => delete __libros[k]);
  Object.keys(__cache).forEach(k => delete __cache[k]);
  _INV_CACHE = null; _MOD_CACHE = null; _SKU = null; _CANALES = null; _THOJAS = {}; _LIBROS = {}; _SS = null; _TURNOS = null; _TZ_HOJA = null;
  Object.keys(__props).forEach(k => delete __props[k]);
  // Migraciones viejas ya hechas: que no intenten correr aquí
  __props.mig_val_v2 = "1"; __props.mig_ka_12026 = "1";
  const s = d.sync || {};
  if (s.ultima_sync) __props.wms_last_sync_ts = String(s.ultima_sync);
  if (s.ultimo_movimiento) __props.wms_last_movement_ts = String(s.ultimo_movimiento);
  if (s.filas) __props.wms_last_rows = String(s.filas);

  const main = SpreadsheetApp.openById(SHEET_ID);
  main.poner("WMS_Base", [WMS_HEADERS].concat(d.wms_base || []));
  main.poner("WMS_Modulos", [WMS_MOD_HEADERS].concat(d.wms_modulos || []));
  main.poner("Sku", [Object.values(SKU_ENCABEZADOS)].concat(d.sku || []));
  main.poner("Canales", [CANALES_DEF.cab].concat(d.canales || []));
  main.poner("Capacidad_Bodega", [["Modulo", "Caras", "Capacidad"]].concat(d.capacidad || []));
  main.poner("Consumo", [CONSUMO_DEF.cab].concat(d.consumo || []));
  main.poner("Limbo", [["Id", "Producto", "Vencimiento", "Presentacion", "Cubicaje", "Fecha_reporte"]].concat(d.limbo || []));
  main.poner(REP_DEF.nombre, [REP_DEF.cab].concat(d.reportes || []));
  main.poner("Usuarios", [USR_DEF.cab]);

  __cargarTurnos(d);
}

// Turnos, validación, entrega y conciliación (se recargan solos, sin volver a bajar el WMS)
function __cargarTurnos(d) {
  if (d.usuario) __usuario = d.usuario;
  _TURNOS = null; _THOJAS = {};
  delete __cache.turno_abierto;
  const val = SpreadsheetApp.openById(ARCHIVOS.VAL);
  val.poner(VAL_T.destinos.nombre, [VAL_T.destinos.cab].concat(d.destinos || []));
  val.poner(VAL_T.productos.nombre, [VAL_T.productos.cab].concat(d.val_productos || []));
  val.poner(VAL_T.registros.nombre, [VAL_T.registros.cab].concat(d.val_registros || []));
  val.poner(VAL_T.histProd.nombre, [VAL_T.histProd.cab].concat(d.val_hist_productos || []));
  val.poner(VAL_T.histReg.nombre, [VAL_T.histReg.cab].concat(d.val_hist_registros || []));
  const ent = SpreadsheetApp.openById(ARCHIVOS.ENTREGA);
  ent.poner(TURNOS_DEF.nombre, [TURNOS_DEF.cab].concat(d.turnos || []));
  ent.poner(ENT_T.items.nombre, [ENT_T.items.cab].concat(d.ent_items || []));
  ent.poner(ENT_T.notas.nombre, [ENT_T.notas.cab].concat(d.ent_notas || []));
  const conc = SpreadsheetApp.openById(ARCHIVOS.CONC);
  conc.poner(CONC_T.conc.nombre, [CONC_T.conc.cab].concat(d.conciliaciones || []));
  conc.poner(CONC_T.items.nombre, [CONC_T.items.cab].concat(d.conc_items || []));
  conc.poner(CONC_T.pre.nombre, [CONC_T.pre.cab].concat(d.preconciliacion || []));
  // Historiales: el resumen de cada turno viene calculado (no se bajan todas las filas viejas)
  _HIST_RESUMEN = d.resumen_turnos ? { turnos: d.resumen_turnos, conc: d.resumen_conc || {} } : null;
}

return {
  cargar: __cargar,
  cargarTurnos: __cargarTurnos,
  // Reportes de módulos recién leídos de Supabase (sin volver a cargar todo)
  cargarReportes(filas) {
    SpreadsheetApp.openById(SHEET_ID).poner(REP_DEF.nombre, [REP_DEF.cab].concat(filas || []));
    delete _THOJAS["MAIN|" + REP_DEF.nombre];
  },
  llamar(fn, args) {
    const f = __EXPORTAR[fn];
    if (typeof f !== "function") return JSON.stringify({ ok: false, error: "Función no disponible: " + fn });
    return f.apply(null, args || []);
  },
  exportadas: () => Object.keys(__EXPORTAR),
  // HTML de un PDF del sistema (tipo como en construirPDFPorTipo_)
  pdf(tipo, id) {
    if (tipo === "INSTRUCTIVO") throw new Error("El instructivo se descarga desde el bot (/instructivo).");
    const r = construirPDFPorTipo_(tipo, id || "");
    return { nombre: r.blob.getName(), html: r.blob.__html, caption: r.caption || "" };
  },
  // Copia de las hojas (de cualquier libro) para saber qué filas cambió una acción
  foto(nombres) {
    const r = {};
    nombres.forEach(n => {
      let h = null;
      Object.keys(__libros).some(id => (h = __libros[id].getSheetByName(n)));
      r[n] = h ? JSON.parse(JSON.stringify(h.data)) : [];
    });
    return r;
  }
};

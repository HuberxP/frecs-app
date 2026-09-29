// ---------------------------------------------------------------------
// Conexión del motor con la función del bot (Supabase)
// ---------------------------------------------------------------------
// PDF: se devuelve el HTML; la función lo dibuja (pdf.ts) antes de enviarlo a Telegram
htmlAPdf_ = function (html, nombre) { return { __html: html, __nombre: nombre, getName: () => nombre, getBytes: () => { throw new Error("PDF en el servidor"); } }; };
// El bot no tiene usuario del dashboard: actúa como administrador
usrSesion_ = function () { return { nombre: "Bot", rol: "administrador" }; };
// Traer el WMS lo sigue haciendo Apps Script (tiene la clave y llega al WMS)
sincronizarWMS = function (chatId, forzar) { __cola.push({ tipo: "sync", chatId: chatId, forzar: forzar === true }); return { ok: true }; };
// Lo que el bot guarda (limbo, consumo…) va a Supabase y luego se copia a las hojas de respaldo
const __espejoOriginal = sbEspejo_;
sbEspejo_ = function (tabla) { const r = __espejoOriginal(tabla); __cola.push({ tipo: "hojas", tabla: tabla }); return r; };

function __cargar(d, props, cache) {
  Object.keys(__libros).forEach(k => delete __libros[k]);
  Object.keys(__cache).forEach(k => delete __cache[k]);
  Object.keys(__props).forEach(k => delete __props[k]);
  __cacheCambios.poner = {}; __cacheCambios.quitar = [];
  __cola = [];
  _INV_CACHE = null; _MOD_CACHE = null; _SKU = null; _CANALES = null; _THOJAS = {}; _LIBROS = {}; _SS = null; _TURNOS = null; _TZ_HOJA = null;
  Object.assign(__props, props || {});
  Object.assign(__cache, cache || {});
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
  main.poner("Usuarios", [USR_DEF.cab]);
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
  _HIST_RESUMEN = d.resumen_turnos ? { turnos: d.resumen_turnos, conc: d.resumen_conc || {} } : null;
}

return {
  cargar: __cargar,
  // Mensaje de Telegram (el mismo doPost de Apps Script; la clave del webhook la revisa la función)
  telegram(contenido) { return doPost({ postData: { contents: contenido }, parameter: {} }); },
  alerta() { return generarAlertaDiaria(); },
  pdf(tipo, id) { const r = construirPDFPorTipo_(tipo, id || ""); return { nombre: r.blob.getName(), html: r.blob.__html, caption: r.caption || "" }; },
  // Lo que quedó por enviar y lo que cambió en la memoria del bot
  tomarCola() { const c = __cola; __cola = []; return c; },
  cambiosCache() { return { poner: Object.assign({}, __cacheCambios.poner), quitar: __cacheCambios.quitar.slice() }; },
  grupo: () => GRUPO_CALIDAD_ID
};

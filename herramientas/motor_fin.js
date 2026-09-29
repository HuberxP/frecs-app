// ---------------------------------------------------------------------
// Conexión del motor con la página
// ---------------------------------------------------------------------
let __usuario = null;
// La sesión la valida Supabase al entregar los datos; aquí solo se revisa el rol
usrSesion_ = function (tk, rolMinimo) {
  if (!__usuario) throw new Error("SESION: Ingresa con tu nombre y PIN.");
  if ((ROLES[__usuario.rol] || 0) < (ROLES[rolMinimo] || 1)) throw new Error(`No tienes permiso para esto (se necesita rol ${rolMinimo}).`);
  return { nombre: __usuario.nombre, rol: __usuario.rol };
};

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
  main.poner("Usuarios", [USR_DEF.cab]);

  const val = SpreadsheetApp.openById(ARCHIVOS.VAL);
  val.poner(VAL_T.destinos.nombre, [VAL_T.destinos.cab].concat(d.destinos || []));
  [VAL_T.productos, VAL_T.registros, VAL_T.histProd, VAL_T.histReg].forEach(t => val.poner(t.nombre, [t.cab]));
  const ent = SpreadsheetApp.openById(ARCHIVOS.ENTREGA);
  ent.poner(TURNOS_DEF.nombre, [TURNOS_DEF.cab].concat(d.turnos || []));
  [ENT_T.items, ENT_T.notas].forEach(t => ent.poner(t.nombre, [t.cab]));
  const conc = SpreadsheetApp.openById(ARCHIVOS.CONC);
  [CONC_T.conc, CONC_T.items, CONC_T.pre].forEach(t => conc.poner(t.nombre, [t.cab]));
}

return {
  cargar: __cargar,
  llamar(fn, args) {
    const f = __EXPORTAR[fn];
    if (typeof f !== "function") return JSON.stringify({ ok: false, error: "Función no disponible: " + fn });
    return f.apply(null, args || []);
  },
  exportadas: () => Object.keys(__EXPORTAR),
  // Copia de las hojas del libro principal (para saber qué filas cambió una acción)
  foto(nombres) {
    const main = SpreadsheetApp.openById(SHEET_ID), r = {};
    nombres.forEach(n => { const h = main.getSheetByName(n); r[n] = h ? JSON.parse(JSON.stringify(h.data)) : []; });
    return r;
  }
};

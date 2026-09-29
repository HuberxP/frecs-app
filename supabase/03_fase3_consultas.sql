-- =====================================================================
-- FRECS! · FASE 3 · Datos para el dashboard nuevo (solo consultas)
-- ---------------------------------------------------------------------
-- Una sola llamada trae todo lo que las consultas necesitan, con las filas
-- en el MISMO orden de columnas que las hojas. Así el dashboard nuevo usa
-- exactamente la misma lógica que el Frecs actual (canales, vida útil,
-- capacidad, consumo…), sin reescribirla.
-- Pide sesión válida (cualquier rol). Las horas van en hora de Bogotá, como
-- en las hojas.
-- =====================================================================
create or replace function public.datos_consulta(p_token text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'lector');
  tz constant text := 'America/Bogota';
begin
  return jsonb_build_object(
    'usuario', jsonb_build_object('nombre', u.nombre, 'rol', u.rol),
    'generado', to_char(now() at time zone tz, 'YYYY-MM-DD HH24:MI:SS'),
    'sync', (select jsonb_build_object(
               'ultima_sync', (extract(epoch from s.ultima_sync) * 1000)::bigint,
               'ultimo_movimiento', (extract(epoch from s.ultimo_movimiento) * 1000)::bigint,
               'filas', s.filas, 'modulos', s.modulos) from sync_estado s where id = 1),
    -- WMS_Base: SKU, Producto, Modulo, Estibas, Cajas, Unidades, Vence, Dias, Estado, Candado, Carga, Familia, CPE, Obs, Picking, Actualizacion
    'wms_base', coalesce((select jsonb_agg(jsonb_build_array(sku, coalesce(producto, ''), modulo, estibas, cajas, unidades,
        coalesce(to_char(vence, 'YYYY-MM-DD'), ''), coalesce(dias, 9999), coalesce(estado, ''), coalesce(candado, ''),
        coalesce(to_char(carga at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), ''), coalesce(familia, ''),
        coalesce(cajas_por_estiba, 1), coalesce(obs, ''), picking,
        coalesce(to_char(actualizacion at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), '')) order by id) from wms_base), '[]'::jsonb),
    -- WMS_Modulos: Modulo, Nombre_WMS, Seccion, Bodega, Zona, Picking, Con_producto, SKUs, Lotes
    'wms_modulos', coalesce((select jsonb_agg(jsonb_build_array(modulo, coalesce(nombre_wms, ''), coalesce(seccion, ''), coalesce(bodega, ''),
        coalesce(zona, ''), picking, con_producto, skus, lotes) order by modulo) from wms_modulos), '[]'::jsonb),
    -- Sku: Id, SKU, Producto, Cubicaje, Piso, Plancha, Cant x Estibas, Presentacion, Usuario, Contexto, Minimo, T1, T2, KA, Estibas_por_cara
    'sku', coalesce((select jsonb_agg(jsonb_build_array(coalesce(id_hoja, ''), sku, producto, coalesce(cubicaje, ''), coalesce(piso, ''),
        coalesce(plancha, ''), coalesce(cant_x_estiba, ''), coalesce(presentacion, ''), coalesce(usuario, ''), coalesce(contexto, ''),
        coalesce(minimo::text, ''), coalesce(t1::text, ''), coalesce(t2::text, ''), coalesce(ka::text, ''), coalesce(estibas_por_cara::text, ''))
        order by sku) from sku), '[]'::jsonb),
    -- Canales: Canal, Tipo, Valor, Dias_minimos, Nota (el orden importa: gana la primera regla que coincide)
    'canales', coalesce((select jsonb_agg(jsonb_build_array(canal, tipo, valor, dias_minimos, coalesce(nota, '')) order by orden, id) from canales), '[]'::jsonb),
    -- Capacidad_Bodega: Modulo, Caras, Capacidad
    'capacidad', coalesce((select jsonb_agg(jsonb_build_array(modulo, caras, coalesce(capacidad::text, '')) order by modulo) from capacidad_bodega), '[]'::jsonb),
    -- Consumo: Sku, Producto, Modulo_elegido, Elegido_por, Elegido_en
    'consumo', coalesce((select jsonb_agg(jsonb_build_array(sku, coalesce(producto, ''), coalesce(modulo_elegido, ''), coalesce(elegido_por, ''),
        coalesce(to_char(elegido_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), '')) order by orden, sku) from consumo), '[]'::jsonb),
    -- Limbo: Id, Producto, Vencimiento, Presentacion, Cubicaje, Fecha_reporte
    'limbo', coalesce((select jsonb_agg(jsonb_build_array(id, producto, coalesce(vencimiento, ''), coalesce(presentacion, ''), coalesce(cubicaje, ''),
        coalesce(fecha_reporte, '')) order by id) from limbo), '[]'::jsonb),
    'destinos', coalesce((select jsonb_agg(jsonb_build_array(nombre) order by orden, nombre) from destinos), '[]'::jsonb),
    -- Turnos: ID, Turno, Fecha, Estado, Inicio, Abierto_por, Cierre, Cerrado_por, Recibe_de_ID, Recibe_de, Nota, Editado_por, Eliminado_por
    'turnos', coalesce((select jsonb_agg(jsonb_build_array(id, coalesce(numero::text, ''), coalesce(to_char(fecha, 'YYYY-MM-DD'), ''), estado,
        to_char(inicio at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(abierto_por, ''),
        coalesce(to_char(cierre at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), ''), coalesce(cerrado_por, ''), coalesce(recibe_de_id, ''),
        coalesce(recibe_de, ''), coalesce(nota, ''), coalesce(editado_por, ''), coalesce(eliminado_por, '')) order by inicio) from turnos), '[]'::jsonb)
  );
end $$;

revoke execute on function public.datos_consulta(text) from public, anon, authenticated;
grant execute on function public.datos_consulta(text) to anon, authenticated, service_role;

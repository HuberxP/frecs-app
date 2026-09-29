-- =====================================================================
-- FRECS! · FASE 4c · Conciliación, pre-conciliación e historiales en el dashboard nuevo
-- ---------------------------------------------------------------------
--   · guardar_filas también con conciliaciones, conc_items y preconciliacion (validador)
--   · los datos de turnos traen todas las conciliaciones (solo la cabecera), un resumen
--     de cada turno y conciliación para los historiales, y los turnos o conciliaciones
--     viejos que la página pida (p_extra = ids) para verlos o editarlos
-- Sigue en modo prueba hasta el cambio definitivo (4d).
-- =====================================================================

create or replace function public.guardar_filas(p_token text, p_cambios jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c jsonb; t text; pk text[]; cols text; upd text; n1 int; n2 int; res jsonb := '{}'::jsonb; restr text;
  cfg constant jsonb := '{
    "limbo":         {"rol": "validador",     "pk": ["id"]},
    "consumo":       {"rol": "validador",     "pk": ["sku"]},
    "sku":           {"rol": "administrador", "pk": ["sku"]},
    "canales":       {"rol": "administrador", "pk": []},
    "turnos":        {"rol": "validador",     "pk": ["id"]},
    "val_productos": {"rol": "validador",     "pk": ["turno_id", "sku"]},
    "val_registros": {"rol": "validador",     "pk": ["id"]},
    "destinos":      {"rol": "validador",     "pk": ["nombre"]},
    "ent_items":     {"rol": "validador",     "pk": ["turno_id", "seccion", "sku"]},
    "ent_notas":     {"rol": "validador",     "pk": ["id"]},
    "conciliaciones":  {"rol": "validador",   "pk": ["id"]},
    "conc_items":      {"rol": "validador",   "pk": ["conc_id", "sku"]},
    "preconciliacion": {"rol": "validador",   "pk": ["id"]}
  }';
  u public.perfiles;
begin
  if jsonb_typeof(p_cambios) <> 'array' or jsonb_array_length(p_cambios) = 0 then raise exception 'No hay cambios para guardar.'; end if;
  -- Primero se revisan todos los permisos (si falta uno, no se guarda nada)
  for c in select * from jsonb_array_elements(p_cambios) loop
    t := c->>'tabla';
    if not cfg ? t then raise exception 'Tabla no permitida: %', t; end if;
    u := _actor(p_token, cfg->t->>'rol');
  end loop;

  begin
    for c in select * from jsonb_array_elements(p_cambios) loop
      t := c->>'tabla';
      select array_agg(x) into pk from jsonb_array_elements_text(cfg->t->'pk') x;
      n1 := 0; n2 := 0;
      if coalesce((c->>'reemplazar')::boolean, false) then
        execute format('delete from public.%I where true', t);
        get diagnostics n2 = row_count;
      elsif jsonb_array_length(coalesce(c->'quitar', '[]'::jsonb)) > 0 then
        if pk is null then raise exception 'La tabla % solo se puede reemplazar completa.', t; end if;
        execute format('delete from public.%I d using jsonb_populate_recordset(null::public.%I, $1) q where %s', t, t,
          (select string_agg(format('d.%I = q.%I', k, k), ' and ') from unnest(pk) k)) using c->'quitar';
        get diagnostics n2 = row_count;
      end if;
      if jsonb_array_length(coalesce(c->'poner', '[]'::jsonb)) > 0 then
        select string_agg(format('%I', col.column_name), ', ' order by col.ordinal_position),
               string_agg(format('%I = excluded.%I', col.column_name, col.column_name), ', ' order by col.ordinal_position)
               filter (where not (col.column_name = any(coalesce(pk, '{}'))))
          into cols, upd
        from information_schema.columns col
        where col.table_schema = 'public' and col.table_name = t and col.is_identity = 'NO'
          and col.column_name in (select jsonb_object_keys(c->'poner'->0));
        if pk is null then
          execute format('insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1)', t, cols, cols, t) using c->'poner';
        else
          execute format('insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1) on conflict (%s) do update set %s',
            t, cols, cols, t, (select string_agg(format('%I', k), ', ') from unnest(pk) k), coalesce(upd, format('%I = excluded.%I', pk[1], pk[1]))) using c->'poner';
        end if;
        get diagnostics n1 = row_count;
      end if;
      res := res || jsonb_build_object(t, jsonb_build_object('puestas', n1, 'quitadas', n2));
    end loop;
  exception
    when unique_violation then
      get stacked diagnostics restr = constraint_name;
      if restr = 'turnos_un_abierto_uk' then raise exception 'Alguien más acaba de abrir un turno. Recarga la página para verlo.'; end if;
      if restr = 'conc_un_abierta_uk' then raise exception 'Alguien más acaba de abrir una conciliación. Recarga la página para verla.'; end if;
      raise exception 'Otra persona guardó lo mismo al mismo tiempo. Recarga e inténtalo de nuevo.';
    when foreign_key_violation then
      raise exception 'Ese turno o esa conciliación ya no existe. Recarga la página.';
  end;
  return res;
end $$;


drop function if exists public._datos_turnos();
create or replace function public._datos_turnos(p_extra jsonb default '[]'::jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  tz constant text := 'America/Bogota';
  abierto text; hist text[]; todos text[]; concs text[]; extra text[];
begin
  select coalesce(array_agg(x), '{}') into extra from jsonb_array_elements_text(case when jsonb_typeof(p_extra) = 'array' then p_extra else '[]'::jsonb end) x;
  select id into abierto from turnos where estado = 'ABIERTO' limit 1;
  select coalesce(array_agg(x.id), '{}') into hist from (
    select id from turnos where estado <> 'ABIERTO' and inicio > now() - interval '10 days'
    union
    select * from (select id from turnos where estado = 'CERRADO' order by cierre desc nulls last, inicio desc limit 1) u
    union
    select id from turnos where id = any(extra) and estado <> 'ABIERTO'
  ) x;
  todos := hist || coalesce(abierto, '');
  select coalesce(array_agg(id), '{}') into concs from conciliaciones where estado = 'ABIERTA' or inicio > now() - interval '10 days' or id = any(extra);

  return jsonb_build_object(
    'modo_turnos', coalesce((select valor from frecs_config where clave = 'turnos_en_supabase'), 'prueba'),
    'turnos_generado', (extract(epoch from now()) * 1000)::bigint,
    'extra', to_jsonb(extra),
    -- Resumen de cada turno y conciliación para los historiales (sin bajar todas sus filas)
    'resumen_turnos', coalesce((select jsonb_object_agg(t.id, jsonb_build_object(
        'prod', (select count(*) from val_productos p where p.turno_id = t.id),
        'val', (select count(*) from val_registros r where r.turno_id = t.id and r.estado = 'ACTIVO'),
        'cajas', (select coalesce(sum(r.cantidad), 0) from val_registros r where r.turno_id = t.id and r.estado = 'ACTIVO'),
        'BODEGA', (select count(*) from ent_items e where e.turno_id = t.id and e.seccion = 'BODEGA'),
        'TPC', (select count(*) from ent_items e where e.turno_id = t.id and e.seccion = 'TPC'),
        'KA', (select count(*) from ent_items e where e.turno_id = t.id and e.seccion = 'KA'),
        'PK', (select count(*) from ent_items e where e.turno_id = t.id and e.seccion = 'PK'),
        'notas', (select count(*) from ent_notas n where n.turno_id = t.id))) from turnos t), '{}'::jsonb),
    'resumen_conc', coalesce((select jsonb_object_agg(c.id, jsonb_build_object(
        'prod', (select count(*) from conc_items i where i.conc_id = c.id),
        'mal', (select count(*) from conc_items i where i.conc_id = c.id and i.facturacion is not null
                  and coalesce(i.bodega, 0) + coalesce(i.ka, 0) + coalesce(i.pk, 0) < i.facturacion))) from conciliaciones c), '{}'::jsonb),
    'destinos', coalesce((select jsonb_agg(jsonb_build_array(nombre) order by orden, nombre) from destinos), '[]'::jsonb),
    -- Turnos: ID, Turno, Fecha, Estado, Inicio, Abierto_por, Cierre, Cerrado_por, Recibe_de_ID, Recibe_de, Nota, Editado_por, Eliminado_por
    'turnos', coalesce((select jsonb_agg(jsonb_build_array(id, coalesce(numero::text, ''), coalesce(to_char(fecha, 'YYYY-MM-DD'), ''), estado,
        to_char(inicio at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(abierto_por, ''),
        coalesce(to_char(cierre at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), ''), coalesce(cerrado_por, ''), coalesce(recibe_de_id, ''),
        coalesce(recibe_de, ''), coalesce(nota, ''), coalesce(editado_por, ''), coalesce(eliminado_por, '')) order by inicio, id) from turnos), '[]'::jsonb),
    -- Val_Productos: Turno_ID, SKU, Producto, Inicial, Actualizado, Usuario, Contado_en
    'val_productos', coalesce((select jsonb_agg(jsonb_build_array(turno_id, sku, coalesce(producto, ''), inicial,
        to_char(actualizado at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(usuario, ''),
        coalesce(to_char(contado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), '')) order by orden)
      from val_productos where turno_id = abierto), '[]'::jsonb),
    -- Val_Registros: ID, Turno_ID, Fecha, SKU, Producto, Destino, Cantidad, Usuario, Nota, Estado, Modificado_por, Contado_en
    'val_registros', coalesce((select jsonb_agg(jsonb_build_array(id, turno_id, to_char(fecha at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), sku,
        coalesce(producto, ''), coalesce(destino, ''), cantidad, coalesce(usuario, ''), coalesce(nota, ''), estado, coalesce(modificado_por, ''),
        coalesce(to_char(contado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), '')) order by fecha, id)
      from val_registros where turno_id = abierto), '[]'::jsonb),
    -- Val_Hist_Productos: Turno_ID, SKU, Producto, Inicial, Validado, Disponible, Detalle_destinos, Contado_en
    'val_hist_productos', coalesce((select jsonb_agg(jsonb_build_array(p.turno_id, p.sku, coalesce(p.producto, ''), p.inicial,
        coalesce(v.validado, 0), p.inicial - coalesce(v.validado, 0), coalesce(v.detalle, ''),
        coalesce(to_char(p.contado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), '')) order by p.turno_id, p.orden)
      from val_productos p
      left join lateral (
        select sum(d.cant) as validado, string_agg(d.destino || ': ' || d.cant, ' | ' order by d.primera) as detalle
        from (select coalesce(r.destino, '') as destino, sum(r.cantidad) as cant, min(r.fecha) as primera
              from val_registros r where r.turno_id = p.turno_id and r.sku = p.sku and r.estado = 'ACTIVO' group by 1) d
      ) v on true
      where p.turno_id = any(hist)), '[]'::jsonb),
    'val_hist_registros', coalesce((select jsonb_agg(jsonb_build_array(id, turno_id, to_char(fecha at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), sku,
        coalesce(producto, ''), coalesce(destino, ''), cantidad, coalesce(usuario, ''), coalesce(nota, ''), estado, coalesce(modificado_por, ''),
        coalesce(to_char(contado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), '')) order by turno_id, fecha, id)
      from val_registros where turno_id = any(hist)), '[]'::jsonb),
    -- Ent_Items: Turno_ID, Seccion, SKU, Producto, Cantidades (JSON), Actualizado, Usuario, Origen
    'ent_items', coalesce((select jsonb_agg(jsonb_build_array(turno_id, seccion, sku, coalesce(producto, ''), cantidades::text,
        to_char(actualizado at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(usuario, ''), coalesce(origen, '')) order by turno_id, seccion, sku)
      from ent_items where turno_id = any(todos)), '[]'::jsonb),
    -- Ent_Notas: Turno_ID, ID, Hora, Usuario, Texto
    'ent_notas', coalesce((select jsonb_agg(jsonb_build_array(turno_id, id, to_char(hora at time zone tz, 'YYYY-MM-DD HH24:MI:SS'),
        coalesce(usuario, ''), texto) order by hora, id)
      from ent_notas where turno_id = any(todos)), '[]'::jsonb),
    -- Conciliaciones: ID, Turno_ID, Turno, Fecha, Estado, Inicio, Abierto_por, Cierre, Cerrado_por, Nota, Editado_por, Eliminado_por
    'conciliaciones', coalesce((select jsonb_agg(jsonb_build_array(id, coalesce(turno_id, ''), coalesce(numero::text, ''), coalesce(to_char(fecha, 'YYYY-MM-DD'), ''),
        estado, to_char(inicio at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(abierto_por, ''),
        coalesce(to_char(cierre at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), ''), coalesce(cerrado_por, ''), coalesce(nota, ''),
        coalesce(editado_por, ''), coalesce(eliminado_por, '')) order by inicio, id)
      from conciliaciones), '[]'::jsonb),
    -- Conc_Items: Conc_ID, SKU, Producto, Bodega, KA, PK, Facturacion, Bloqueo, Actualizado, Usuario, Origen
    'conc_items', coalesce((select jsonb_agg(jsonb_build_array(conc_id, sku, coalesce(producto, ''),
        coalesce(to_jsonb(bodega), '""'), coalesce(to_jsonb(ka), '""'), coalesce(to_jsonb(pk), '""'), coalesce(to_jsonb(facturacion), '""'),
        bloqueo, to_char(actualizado at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(usuario, ''), coalesce(origen, '')) order by conc_id, sku)
      from conc_items where conc_id = any(concs)), '[]'::jsonb),
    -- Preconciliacion: ID, Fecha, Turno, SKU, Producto, Motivo, Usuario, Estado, Conc_ID
    'preconciliacion', coalesce((select jsonb_agg(jsonb_build_array(id, to_char(fecha at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(turno::text, ''),
        sku, coalesce(producto, ''), coalesce(motivo, ''), coalesce(usuario, ''), estado, coalesce(conc_id, '')) order by fecha, id)
      from preconciliacion where estado = 'PENDIENTE' or fecha > now() - interval '10 days'), '[]'::jsonb)
  );
end $$;


drop function if exists public.datos_turnos(text);
create or replace function public.datos_turnos(p_token text, p_extra jsonb default '[]'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector');
begin
  return jsonb_build_object('usuario', jsonb_build_object('nombre', u.nombre, 'rol', u.rol)) || _datos_turnos(p_extra);
end $$;

drop function if exists public.datos_consulta(text);
create or replace function public.datos_consulta(p_token text, p_extra jsonb default '[]'::jsonb)
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
        coalesce(fecha_reporte, '')) order by id) from limbo), '[]'::jsonb)
  ) || _datos_turnos(p_extra);
end $$;

revoke execute on function public._datos_turnos(jsonb) from public, anon, authenticated;
revoke execute on function public.datos_turnos(text, jsonb) from public, anon, authenticated;
revoke execute on function public.datos_consulta(text, jsonb) from public, anon, authenticated;
revoke execute on function public.guardar_filas(text, jsonb) from public, anon, authenticated;
grant execute on function public.datos_turnos(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.datos_consulta(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.guardar_filas(text, jsonb) to anon, authenticated, service_role;

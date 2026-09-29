-- =====================================================================
-- FRECS! · FASE 4b · Turnos, validación y entrega desde el dashboard nuevo
-- ---------------------------------------------------------------------
-- Igual que en la 4a: la página corre las reglas del Frecs actual y manda solo las
-- filas que cambiaron a guardar_filas. Aquí se agrega:
--   · turnos, val_productos, val_registros, destinos, ent_items, ent_notas (validador)
--   · un candado en la base para el saldo de la validación: si dos personas validan
--     el mismo producto a la vez, la segunda recibe "No alcanza…" en vez de pasarse.
--   · los datos de turnos para la página (turno abierto + los de los últimos 10 días
--     + el último cerrado, que es del que se hereda el saldo).
-- Hasta el cambio definitivo (fase 4d) esto es un ENTORNO DE PRUEBA: el dashboard
-- actual y el bot siguen trabajando sobre las hojas, y sbImportarTodo reinicia aquí
-- los turnos con lo que haya en las hojas. frecs_config.turnos_en_supabase = 'si'
-- marca el cambio definitivo.
-- =====================================================================

-- Orden de llegada de los productos de la validación (la hoja los muestra en ese orden)
alter table public.val_productos add column if not exists orden bigint generated always as identity;

-- ---------------------------------------------------------------------
-- 1. Saldo: la suma de validaciones ACTIVAS de un producto no puede pasar su inicial.
--    Solo se revisa cuando el cambio SUBE lo validado (bajar una cantidad o anular
--    siempre se puede). Los registros en CONFLICTO no descuentan.
--    La importación desde las hojas (clave secreta) no se revisa: allá manda la hoja.
-- ---------------------------------------------------------------------
create or replace function public._val_saldo()
returns trigger
language plpgsql set search_path = public as $$
declare claims jsonb; ini numeric; tot numeric; delta numeric; prod text;
begin
  begin claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb; exception when others then claims := null; end;
  if claims->>'role' = 'service_role' then return null; end if;
  delta := case when new.estado = 'ACTIVO' then new.cantidad else 0 end;
  if tg_op = 'UPDATE' and old.turno_id = new.turno_id and old.sku = new.sku and old.estado = 'ACTIVO' then
    delta := delta - old.cantidad;
  end if;
  if delta <= 0 then return null; end if;
  -- Un producto a la vez: quien llega segundo espera y ve lo que guardó el primero
  perform pg_advisory_xact_lock(hashtext('val|' || new.turno_id || '|' || new.sku));
  select v.inicial, v.producto into ini, prod from public.val_productos v where v.turno_id = new.turno_id and v.sku = new.sku;
  if not found then raise exception 'El producto % no está en el turno.', new.sku; end if;
  select coalesce(sum(r.cantidad), 0) into tot from public.val_registros r
   where r.turno_id = new.turno_id and r.sku = new.sku and r.estado = 'ACTIVO';
  if tot > ini then
    raise exception 'No alcanza: de % solo quedan % cajas disponibles (alguien validó al mismo tiempo).',
      coalesce(nullif(prod, ''), new.sku), greatest(ini - (tot - delta), 0);
  end if;
  return null;
end $$;

drop trigger if exists val_registros_saldo on public.val_registros;
create trigger val_registros_saldo after insert or update on public.val_registros
  for each row execute function public._val_saldo();

-- ---------------------------------------------------------------------
-- 2. guardar_filas con las tablas de turnos
--    p_cambios = [{ "tabla": "...", "poner": [ {fila}, … ], "quitar": [ {clave}, … ], "reemplazar": false }, …]
--    La página los manda en orden: turnos primero (las demás dependen de él).
-- ---------------------------------------------------------------------
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
    "ent_notas":     {"rol": "validador",     "pk": ["id"]}
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
      raise exception 'Otra persona guardó lo mismo al mismo tiempo. Recarga e inténtalo de nuevo.';
    when foreign_key_violation then
      raise exception 'Ese turno ya no existe (¿lo archivaron o eliminaron?). Recarga la página.';
  end;
  return res;
end $$;

-- ---------------------------------------------------------------------
-- 3. Datos de turnos para la página, en el MISMO orden de columnas que las hojas
--    · Val_Productos / Val_Registros : el turno abierto
--    · Val_Hist_* : turnos cerrados o eliminados de los últimos 10 días + el último
--      cerrado (validado, disponible y detalle se calculan aquí)
--    · Ent_Items / Ent_Notas : el abierto y esos mismos turnos
--    · Conciliaciones (la abierta y las de 10 días), sus productos y la pre-conciliación
--      (solo lectura en esta fase: la precarga de la entrega usa la conciliación)
-- ---------------------------------------------------------------------
create or replace function public._datos_turnos()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  tz constant text := 'America/Bogota';
  abierto text; hist text[]; todos text[]; concs text[];
begin
  select id into abierto from turnos where estado = 'ABIERTO' limit 1;
  select coalesce(array_agg(x.id), '{}') into hist from (
    select id from turnos where estado <> 'ABIERTO' and inicio > now() - interval '10 days'
    union
    select * from (select id from turnos where estado = 'CERRADO' order by cierre desc nulls last, inicio desc limit 1) u
  ) x;
  todos := hist || coalesce(abierto, '');
  select coalesce(array_agg(id), '{}') into concs from conciliaciones where estado = 'ABIERTA' or inicio > now() - interval '10 days';

  return jsonb_build_object(
    'modo_turnos', coalesce((select valor from frecs_config where clave = 'turnos_en_supabase'), 'prueba'),
    'turnos_generado', (extract(epoch from now()) * 1000)::bigint,
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
      from conciliaciones where id = any(concs)), '[]'::jsonb),
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

-- Solo los turnos (la página los refresca seguido sin volver a bajar el WMS)
create or replace function public.datos_turnos(p_token text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector');
begin
  return jsonb_build_object('usuario', jsonb_build_object('nombre', u.nombre, 'rol', u.rol)) || _datos_turnos();
end $$;

-- ---------------------------------------------------------------------
-- 4. datos_consulta = lo de la fase 3 + los turnos
-- ---------------------------------------------------------------------
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
        coalesce(fecha_reporte, '')) order by id) from limbo), '[]'::jsonb)
  ) || _datos_turnos();
end $$;

revoke execute on function public._val_saldo() from public, anon, authenticated;
revoke execute on function public._datos_turnos() from public, anon, authenticated;
revoke execute on function public.datos_turnos(text) from public, anon, authenticated;
revoke execute on function public.datos_consulta(text) from public, anon, authenticated;
revoke execute on function public.guardar_filas(text, jsonb) from public, anon, authenticated;
grant execute on function public.datos_turnos(text) to anon, authenticated, service_role;
grant execute on function public.datos_consulta(text) to anon, authenticated, service_role;
grant execute on function public.guardar_filas(text, jsonb) to anon, authenticated, service_role;

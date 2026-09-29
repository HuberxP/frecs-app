-- =====================================================================
-- FRECS! · Capacidad de bodega administrable desde la página
-- ---------------------------------------------------------------------
--   · guardar_filas acepta capacidad_bodega (solo administrador): añadir, editar y
--     quitar módulos físicos. Es la lista con la que se cruzan huecos, vacíos,
--     organizar, consumo y capacidad.
--   · sb_maestros la devuelve para copiarla a la hoja Capacidad_Bodega (respaldo).
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
    "preconciliacion": {"rol": "validador",   "pk": ["id"]},
    "capacidad_bodega": {"rol": "administrador", "pk": ["modulo"]}
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

create or replace function public.sb_maestros()
returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'limbo', coalesce((select jsonb_agg(to_jsonb(l) order by l.id) from limbo l), '[]'::jsonb),
    'consumo', coalesce((select jsonb_agg(jsonb_build_object('sku', c.sku, 'producto', c.producto, 'modulo_elegido', c.modulo_elegido,
        'elegido_por', c.elegido_por, 'elegido_en', to_char(c.elegido_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS')) order by c.orden, c.sku) from consumo c), '[]'::jsonb),
    'sku', coalesce((select jsonb_agg(to_jsonb(s) order by s.sku) from sku s), '[]'::jsonb),
    'canales', coalesce((select jsonb_agg(to_jsonb(k) - 'id' order by k.orden, k.id) from canales k), '[]'::jsonb),
    'capacidad', coalesce((select jsonb_agg(to_jsonb(c) order by c.modulo) from capacidad_bodega c), '[]'::jsonb)
  )
$$;

revoke execute on function public.guardar_filas(text, jsonb) from public;
grant execute on function public.guardar_filas(text, jsonb) to anon, authenticated, service_role;
revoke execute on function public.sb_maestros() from public, anon, authenticated;
grant execute on function public.sb_maestros() to service_role;

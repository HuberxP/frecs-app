-- =====================================================================
-- FRECS! · FASE 4a · Guardar desde el dashboard nuevo: Limbo, Consumo, Sku y Canales
-- ---------------------------------------------------------------------
-- La página valida con las mismas reglas del Frecs actual (la lógica de Apps Script
-- corre en el navegador) y manda solo las filas que cambiaron. Aquí se revisa la
-- sesión y el rol de cada tabla, y se guarda todo en una sola transacción.
--   limbo, consumo : validador
--   sku, canales   : administrador
-- Apps Script (con la clave secreta) puede leer estas tablas para copiarlas a las
-- hojas (sb_maestros), así el bot y el dashboard actual ven lo mismo.
-- =====================================================================

-- Quién hace el cambio: una sesión normal, o Apps Script con la clave secreta
-- actuando a nombre de alguien ("bot:Nombre").
create or replace function public._actor(p_token text, p_rol text)
returns public.perfiles
language plpgsql security definer set search_path = public as $$
declare u public.perfiles; claims jsonb;
begin
  begin claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb; exception when others then claims := null; end;
  if coalesce(p_token, '') like 'bot:%' and claims->>'role' = 'service_role' then
    u.nombre := substr(p_token, 5); u.rol := 'administrador'; u.activo := true;
    return u;
  end if;
  return _sesion(p_token, p_rol);
end $$;

-- p_cambios = [{ "tabla": "limbo", "poner": [ {fila}, … ], "quitar": [ {clave}, … ], "reemplazar": false }, …]
-- Devuelve cuántas filas se pusieron y quitaron por tabla.
create or replace function public.guardar_filas(p_token text, p_cambios jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c jsonb; t text; rol text; pk text[]; cols text; upd text; n1 int; n2 int; res jsonb := '{}'::jsonb;
  cfg constant jsonb := '{
    "limbo":   {"rol": "validador",     "pk": ["id"]},
    "consumo": {"rol": "validador",     "pk": ["sku"]},
    "sku":     {"rol": "administrador", "pk": ["sku"]},
    "canales": {"rol": "administrador", "pk": []}
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
  return res;
end $$;

-- Para Apps Script: estas tablas completas, para copiarlas a las hojas
create or replace function public.sb_maestros()
returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'limbo', coalesce((select jsonb_agg(to_jsonb(l) order by l.id) from limbo l), '[]'::jsonb),
    'consumo', coalesce((select jsonb_agg(jsonb_build_object('sku', c.sku, 'producto', c.producto, 'modulo_elegido', c.modulo_elegido,
        'elegido_por', c.elegido_por, 'elegido_en', to_char(c.elegido_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS')) order by c.orden, c.sku) from consumo c), '[]'::jsonb),
    'sku', coalesce((select jsonb_agg(to_jsonb(s) order by s.sku) from sku s), '[]'::jsonb),
    'canales', coalesce((select jsonb_agg(to_jsonb(k) - 'id' order by k.orden, k.id) from canales k), '[]'::jsonb)
  )
$$;

revoke execute on function public._actor(text, text) from public, anon, authenticated;
revoke execute on function public.guardar_filas(text, jsonb) from public, anon, authenticated;
revoke execute on function public.sb_maestros() from public, anon, authenticated;
grant execute on function public.guardar_filas(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.sb_maestros() to service_role;

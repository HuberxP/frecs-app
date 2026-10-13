-- =====================================================================
-- FRECS! · 30 · Bloquear un módulo sin WMS (rotador o administrador)
-- ---------------------------------------------------------------------
-- Con el WMS caído, el rotador bloquea un módulo (o un producto del módulo): fecha del bloqueo,
-- candados y motivo (PNC CALIDAD, PRUEBA DE TRANSPORTE u otro). Las filas de wms_base quedan con ese
-- estado, el candado y una observación, así que en todo el aplicativo salen BLOQUEADAS (no cuentan
-- como disponibles, no entran al FEFO). Se puede desbloquear (vuelve a como estaba) mientras no se
-- haya sincronizado; al sincronizar manda el WMS.
-- =====================================================================
create table if not exists public.bloqueos_sin_wms (
  id            bigint generated always as identity primary key,
  modulo        text not null,
  sku           text,                                -- vacío = todo el módulo
  motivo        text not null,
  candado       text,
  fecha         date not null,
  nota          text,
  antes         jsonb not null default '[]'::jsonb,  -- [{id, estado, candado, obs}]
  por           text not null,
  en            timestamptz not null default now(),
  sync_base     timestamptz,
  deshecho_por  text,
  deshecho_en   timestamptz
);
alter table public.bloqueos_sin_wms enable row level security;

-- [id, módulo, sku, motivo, candado, fecha, por, en, nota]
create or replace function public._bloqueos_json() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_agg(jsonb_build_array(b.id::text, b.modulo, coalesce(b.sku, ''), b.motivo, coalesce(b.candado, ''),
      to_char(b.fecha, 'YYYY-MM-DD'), b.por, to_char(b.en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'), coalesce(b.nota, ''))
      order by b.en desc, b.id desc)
    from bloqueos_sin_wms b
    where b.deshecho_en is null and b.sync_base is not distinct from (select ultima_sync from sync_estado where id = 1)), '[]'::jsonb)
$$;

-- p_item = { modulo, sku (opcional), motivo: 'PNC CALIDAD' | 'PRUEBA DE TRANSPORTE' | 'OTRO', otro, candado, fecha: 'YYYY-MM-DD', nota }
create or replace function public.bloqueo_poner(p_token text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'validador');
  m text := upper(btrim(coalesce(p_item->>'modulo', '')));
  s text := nullif(btrim(coalesce(p_item->>'sku', '')), '');
  mot text := upper(btrim(coalesce(p_item->>'motivo', '')));
  cand text := left(nullif(btrim(coalesce(p_item->>'candado', '')), ''), 120);
  nota text := left(nullif(btrim(coalesce(p_item->>'nota', '')), ''), 300);
  f date; antes jsonb;
begin
  if m = '' then raise exception 'Escribe el módulo.'; end if;
  if mot = 'OTRO' then mot := upper(left(btrim(coalesce(p_item->>'otro', '')), 60)); if mot = '' then raise exception 'Escribe el motivo del bloqueo.'; end if;
  elsif mot not in ('PNC CALIDAD', 'PRUEBA DE TRANSPORTE') then raise exception 'Escoge el motivo del bloqueo.'; end if;
  if coalesce(p_item->>'fecha', '') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Escribe la fecha del bloqueo.'; end if;
  f := (p_item->>'fecha')::date;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'estado', estado, 'candado', candado, 'obs', obs)), '[]'::jsonb) into antes
    from wms_base where modulo = m and (s is null or sku = s) and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0 or coalesce(unidades, 0) > 0);
  if jsonb_array_length(antes) = 0 then raise exception 'En % no hay producto para bloquear.', m; end if;
  update wms_base set estado = mot, candado = coalesce(cand, candado),
         obs = 'Bloqueado sin WMS el ' || to_char(f, 'DD/MM/YYYY') || ' por ' || u.nombre || coalesce(' · ' || nota, '')
   where modulo = m and (s is null or sku = s) and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0 or coalesce(unidades, 0) > 0);
  insert into bloqueos_sin_wms (modulo, sku, motivo, candado, fecha, nota, antes, por, sync_base)
  values (m, s, mot, cand, f, nota, antes, u.nombre, (select ultima_sync from sync_estado where id = 1));
  return _bloqueos_json();
end $$;

-- Desbloquear: vuelve a como estaba (solo antes de sincronizar)
create or replace function public.bloqueo_quitar(p_token text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador'); b public.bloqueos_sin_wms; x jsonb;
begin
  select * into b from bloqueos_sin_wms where id = p_id;
  if not found or b.deshecho_en is not null then raise exception 'Ese bloqueo ya no está.'; end if;
  if b.sync_base is distinct from (select ultima_sync from sync_estado where id = 1) then
    raise exception 'Ya se sincronizó después de ese bloqueo: ahora manda lo del WMS.';
  end if;
  for x in select * from jsonb_array_elements(b.antes) loop
    update wms_base set estado = x->>'estado', candado = x->>'candado', obs = x->>'obs' where id = (x->>'id')::bigint;
  end loop;
  update bloqueos_sin_wms set deshecho_por = u.nombre, deshecho_en = now() where id = b.id;
  return _bloqueos_json();
end $$;

grant execute on function public.bloqueo_poner(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.bloqueo_quitar(text, bigint) to anon, authenticated, service_role;

-- La página los recibe con sus datos
do $$
declare
  d text; n int;
  a constant text := $q$'ajustes', _ajustes_json()$q$;
  b constant text := $q$'ajustes', _ajustes_json(), 'bloqueos', _bloqueos_json()$q$;
begin
  select pg_get_functiondef('public.datos_consulta(text, jsonb)'::regprocedure) into d;
  if position(b in d) = 0 then
    n := (length(d) - length(replace(d, a, ''))) / length(a);
    if n <> 1 then raise exception 'datos_consulta: ajustes encontrado % veces', n; end if;
    execute replace(d, a, b);
  end if;
end $$;

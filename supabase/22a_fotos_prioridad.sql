-- =====================================================================
-- FRECS! · 22a · Fotos del WMS de los productos con prioridad
-- ---------------------------------------------------------------------
-- Al sincronizar a mano (⟳ o /sincronizar), Apps Script busca en el WMS la foto de cada
-- lote marcado como prioridad (por su actividad) y aquí guarda solo la dirección de la imagen.
-- Una actividad ya guardada no se vuelve a pedir. La página las muestra en las tarjetas.
-- =====================================================================
create table if not exists public.wms_fotos (
  actividad_id bigint primary key,
  sku          text,
  modulo       text,
  urls         jsonb not null default '[]'::jsonb,
  creado       timestamptz not null default now()
);
alter table public.wms_fotos enable row level security;
create index if not exists wms_fotos_lote on public.wms_fotos (sku, modulo, actividad_id desc);

-- ¿Cuáles de estas actividades ya están guardadas? (solo Apps Script, con la clave de servicio)
-- Las que se guardaron sin foto se vuelven a pedir durante su primer día (la foto pudo subirse después).
create or replace function public.sb_fotos_conocidas(p_ids jsonb) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(f.actividad_id), '[]'::jsonb) from wms_fotos f
   where (jsonb_array_length(f.urls) > 0 or f.creado < now() - interval '1 day')
     and f.actividad_id in (select x::bigint from jsonb_array_elements_text(case when jsonb_typeof(p_ids) = 'array' then p_ids else '[]'::jsonb end) x where x ~ '^[0-9]{1,18}$')
$$;

-- Guardar lo que se trajo: [{ actividad_id, sku, modulo, urls: [..] }]
create or replace function public.sb_fotos_guardar(p_filas jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into wms_fotos (actividad_id, sku, modulo, urls)
  select (x->>'actividad_id')::bigint, left(x->>'sku', 30), left(x->>'modulo', 30),
         coalesce((select jsonb_agg(u) from jsonb_array_elements_text(case when jsonb_typeof(x->'urls') = 'array' then x->'urls' else '[]'::jsonb end) u where u ~ '^https://' and length(u) < 600), '[]'::jsonb)
    from jsonb_array_elements(case when jsonb_typeof(p_filas) = 'array' then p_filas else '[]'::jsonb end) x
   where coalesce(x->>'actividad_id', '') ~ '^[0-9]{1,18}$'
  on conflict (actividad_id) do update set sku = excluded.sku, modulo = excluded.modulo, urls = excluded.urls;
  get diagnostics n = row_count;
  return n;
end $$;

grant execute on function public.sb_fotos_conocidas(jsonb) to service_role;
grant execute on function public.sb_fotos_guardar(jsonb) to service_role;

-- La página las recibe con sus datos: [sku, módulo, [urls]] de la más nueva a la más vieja
do $$
declare
  d text; n int;
  a constant text := $q$'pocos_vigilar', coalesce((select valor::jsonb from frecs_config where clave = 'pocos_vigilar'), '[]'::jsonb)$q$;
  b constant text := $q$'pocos_vigilar', coalesce((select valor::jsonb from frecs_config where clave = 'pocos_vigilar'), '[]'::jsonb), 'fotos', coalesce((select jsonb_agg(jsonb_build_array(f.sku, f.modulo, f.urls) order by f.actividad_id desc) from wms_fotos f where jsonb_array_length(f.urls) > 0), '[]'::jsonb)$q$;
begin
  select pg_get_functiondef('public.datos_consulta(text, jsonb)'::regprocedure) into d;
  if position(b in d) = 0 then
    n := (length(d) - length(replace(d, a, ''))) / length(a);
    if n <> 1 then raise exception 'datos_consulta: pocos_vigilar encontrado % veces', n; end if;
    execute replace(d, a, b);
  end if;
end $$;

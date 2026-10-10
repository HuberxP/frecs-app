-- =====================================================================
-- FRECS! · 23 · Módulos en consumo por canal
-- ---------------------------------------------------------------------
-- El verificador, el rotador (validador) o el administrador marca de qué módulo se está cargando
-- un producto para un canal (T1, T2 o KA). Un módulo puede estar marcado para varios canales.
-- Si la fecha no cumple los días mínimos del canal se puede marcar igual: queda como «forzado».
-- La marca se quita a mano o sola, cuando al sincronizar ese producto ya no está en el módulo.
-- Todos los roles la ven (Stock, Por módulo y la sección «Módulos en consumo»).
-- =====================================================================
create table if not exists public.marcas_consumo (
  id            bigint generated always as identity primary key,
  sku           text not null,
  producto      text,
  modulo        text not null,
  canal         text not null check (canal in ('T1', 'T2', 'KA')),
  forzado       boolean not null default false,
  dias          int,              -- días para vencer al marcar
  minimo        int,              -- días mínimos del canal al marcar
  marcado_por   text not null,
  marcado_en    timestamptz not null default now(),
  quitado_por   text,
  quitado_en    timestamptz,
  cierre        text              -- 'MANUAL' | 'WMS'
);
alter table public.marcas_consumo enable row level security;
create unique index if not exists marcas_consumo_activa on public.marcas_consumo (sku, modulo, canal) where quitado_en is null;
create index if not exists marcas_consumo_mod on public.marcas_consumo (modulo) where quitado_en is null;

-- ¿Puede marcar? verificador, validador (rotador) o administrador
create or replace function public._puede_marcar(u public.perfiles) returns boolean
language sql immutable as $$ select u.rol in ('verificador', 'validador', 'administrador') $$;

-- Las que ya no tienen el producto en el módulo (según la última sincronización) se cierran solas
create or replace function public._marcas_auto() returns void
language plpgsql security definer set search_path = public as $$
declare s timestamptz := (select ultima_sync from sync_estado where id = 1);
begin
  if s is null then return; end if;
  update marcas_consumo m set quitado_en = s, quitado_por = 'WMS', cierre = 'WMS'
   where m.quitado_en is null and m.marcado_en < s
     and not exists (select 1 from wms_base w where w.modulo = m.modulo and w.sku = m.sku
                       and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0));
end $$;

-- Las activas: [id, sku, producto, módulo, canal, forzado, días, mínimo, marcado_por, marcado_en]
create or replace function public._marcas_json() returns jsonb
language plpgsql security definer set search_path = public as $$
declare tz constant text := 'America/Bogota';
begin
  perform _marcas_auto();
  return coalesce((select jsonb_agg(jsonb_build_array(id::text, sku, coalesce(producto, ''), modulo, canal, forzado, dias, minimo, marcado_por,
      to_char(marcado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS')) order by marcado_en desc, id desc)
    from marcas_consumo where quitado_en is null), '[]'::jsonb);
end $$;

-- Marcar: p_item = { sku, producto, modulo, canal, forzado, dias, minimo }
create or replace function public.marca_poner(p_token text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'verificador');
  m text := upper(btrim(coalesce(p_item->>'modulo', '')));
  s text := btrim(coalesce(p_item->>'sku', ''));
  c text := upper(btrim(coalesce(p_item->>'canal', '')));
begin
  if not _puede_marcar(u) then raise exception 'PERMISO: Solo el verificador, el rotador o el administrador marcan módulos en consumo.'; end if;
  if c not in ('T1', 'T2', 'KA') then raise exception 'Escoge el canal (T1, T2 o KA).'; end if;
  if m = '' or length(m) > 30 or s !~ '^[0-9]{1,20}$' then raise exception 'Módulo o producto no válido.'; end if;
  if exists (select 1 from marcas_consumo where sku = s and modulo = m and canal = c and quitado_en is null) then
    raise exception '% ya está marcado en consumo para %.', m, c;
  end if;
  insert into marcas_consumo (sku, producto, modulo, canal, forzado, dias, minimo, marcado_por)
  values (s, left(nullif(p_item->>'producto', ''), 200), m, c, coalesce((p_item->>'forzado')::boolean, false),
          case when coalesce(p_item->>'dias', '') ~ '^-?[0-9]{1,6}$' then (p_item->>'dias')::int end,
          case when coalesce(p_item->>'minimo', '') ~ '^[0-9]{1,6}$' then (p_item->>'minimo')::int end, u.nombre);
  return _marcas_json();
end $$;

-- Quitar a mano
create or replace function public.marca_quitar(p_token text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'verificador');
begin
  if not _puede_marcar(u) then raise exception 'PERMISO: Solo el verificador, el rotador o el administrador quitan módulos de consumo.'; end if;
  update marcas_consumo set quitado_en = now(), quitado_por = u.nombre, cierre = 'MANUAL' where id = p_id and quitado_en is null;
  return _marcas_json();
end $$;

create or replace function public.marcas_listar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'verificador');
begin
  return _marcas_json();
end $$;

grant execute on function public.marca_poner(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.marca_quitar(text, bigint) to anon, authenticated, service_role;
grant execute on function public.marcas_listar(text) to anon, authenticated, service_role;

-- La página las recibe con sus datos
do $$
declare
  d text; n int;
  a constant text := $q$'fotos', coalesce((select jsonb_agg(jsonb_build_array(f.sku, f.modulo, f.urls) order by f.actividad_id desc) from wms_fotos f where jsonb_array_length(f.urls) > 0), '[]'::jsonb)$q$;
  b constant text := $q$'fotos', coalesce((select jsonb_agg(jsonb_build_array(f.sku, f.modulo, f.urls) order by f.actividad_id desc) from wms_fotos f where jsonb_array_length(f.urls) > 0), '[]'::jsonb), 'marcas', _marcas_json()$q$;
begin
  select pg_get_functiondef('public.datos_consulta(text, jsonb)'::regprocedure) into d;
  if position(b in d) = 0 then
    n := (length(d) - length(replace(d, a, ''))) / length(a);
    if n <> 1 then raise exception 'datos_consulta: fotos encontrado % veces', n; end if;
    execute replace(d, a, b);
  end if;
end $$;

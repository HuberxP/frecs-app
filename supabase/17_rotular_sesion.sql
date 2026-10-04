-- =====================================================================
-- FRECS! · 17 · Sesión sin vencimiento y rotulación de módulos
-- ---------------------------------------------------------------------
--   · La sesión dura hasta que la persona la cierre («Cerrar sesión»). Sigue terminando
--     si un administrador la desactiva o le borra el usuario.
--   · Rotular (turno de la noche): cada rotulación tiene fecha, turno y quién la abrió.
--     Sus módulos van en el orden en que se agregaron, con producto, SKU, vencimiento y
--     estibas (calculadas al escoger el módulo, editables), y dos marcas: impreso y rotulado.
-- =====================================================================

-- 1. Sesión hasta cerrar sesión (10 años en la práctica; se renueva con el uso)
do $$
declare d text; f text;
begin
  foreach f in array array['public._nueva_sesion(bigint)', 'public._sesion(text,text)'] loop
    select pg_get_functiondef(f::regprocedure) into d;
    if position($q$interval '7 days'$q$ in d) > 0 then execute replace(d, $q$interval '7 days'$q$, $q$interval '3650 days'$q$); end if;
  end loop;
end $$;
-- (las sesiones abiertas se alargan solas con el siguiente uso)

-- 2. Rotulación
create table if not exists public.rotulaciones (
  id          bigint generated always as identity primary key,
  fecha       date not null default (now() at time zone 'America/Bogota')::date,
  turno       int not null check (turno between 1 and 3),
  creado_por  text not null,
  creado_en   timestamptz not null default now(),
  eliminado_por text
);
create table if not exists public.rotulo_items (
  id          bigint generated always as identity primary key,
  rot_id      bigint not null references public.rotulaciones(id) on delete cascade,
  orden       int not null,
  modulo      text not null,
  sku         text,
  producto    text,
  vence       date,
  estibas     numeric,
  estibas_sis numeric,          -- lo que calculó el sistema al escoger el módulo
  agregado_por text not null,
  agregado_en timestamptz not null default now(),
  editado_por text,
  impreso     boolean not null default false,
  impreso_por text, impreso_en timestamptz,
  rotulado    boolean not null default false,
  rotulado_por text, rotulado_en timestamptz
);
alter table public.rotulaciones enable row level security;
alter table public.rotulo_items enable row level security;
create index if not exists rotulo_items_rot on public.rotulo_items (rot_id, orden);
create index if not exists rotulaciones_fecha on public.rotulaciones (fecha desc, id desc);

-- Una rotulación con sus módulos (para la página)
create or replace function public._rot_json(p_id bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', r.id, 'fecha', r.fecha, 'turno', r.turno, 'por', r.creado_por,
    'en', to_char(r.creado_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'm', i.modulo, 'sku', coalesce(i.sku, ''), 'prod', coalesce(i.producto, ''),
        'vence', coalesce(to_char(i.vence, 'YYYY-MM-DD'), ''), 'est', i.estibas, 'estSis', i.estibas_sis, 'por', i.agregado_por, 'editado', coalesce(i.editado_por, ''),
        'impreso', i.impreso, 'impresoPor', coalesce(i.impreso_por, ''), 'rotulado', i.rotulado, 'rotuladoPor', coalesce(i.rotulado_por, ''),
        'rotuladoEn', coalesce(to_char(i.rotulado_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'), '')) order by i.orden, i.id)
      from rotulo_items i where i.rot_id = r.id), '[]'::jsonb))
  from rotulaciones r where r.id = p_id
$$;

-- Lista: las de los últimos 45 días con sus cuentas
create or replace function public.rot_listar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador');
begin
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'fecha', r.fecha, 'turno', r.turno, 'por', r.creado_por,
      'n', (select count(*) from rotulo_items i where i.rot_id = r.id),
      'impresos', (select count(*) from rotulo_items i where i.rot_id = r.id and i.impreso),
      'rotulados', (select count(*) from rotulo_items i where i.rot_id = r.id and i.rotulado)) order by r.fecha desc, r.id desc)
    from rotulaciones r where r.eliminado_por is null and r.fecha > (now() at time zone 'America/Bogota')::date - 45), '[]'::jsonb);
end $$;

create or replace function public.rot_crear(p_token text, p_turno int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador'); nuevo bigint;
begin
  if p_turno is null or p_turno not between 1 and 3 then raise exception 'Escoge el turno (1, 2 o 3).'; end if;
  insert into rotulaciones (turno, creado_por) values (p_turno, u.nombre) returning id into nuevo;
  return _rot_json(nuevo);
end $$;

create or replace function public.rot_ver(p_token text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador');
begin
  if not exists (select 1 from rotulaciones where id = p_id and eliminado_por is null) then raise exception 'La rotulación no existe.'; end if;
  return _rot_json(p_id);
end $$;

-- Agregar (sin id) o corregir (con id) un módulo: { id?, m, sku, prod, vence, est, estSis }
create or replace function public.rot_item_guardar(p_token text, p_rot bigint, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'validador');
  m text := upper(btrim(coalesce(p_item->>'m', '')));
  v date; e numeric;
begin
  if not exists (select 1 from rotulaciones where id = p_rot and eliminado_por is null) then raise exception 'La rotulación no existe.'; end if;
  if m = '' or length(m) > 30 then raise exception 'Escribe el módulo.'; end if;
  begin v := nullif(p_item->>'vence', '')::date; exception when others then raise exception 'Fecha de vencimiento no válida.'; end;
  begin e := nullif(p_item->>'est', '')::numeric; exception when others then raise exception 'Cantidad de estibas no válida.'; end;
  if e is not null and (e < 0 or e > 999) then raise exception 'Cantidad de estibas no válida.'; end if;
  if coalesce(p_item->>'id', '') = '' then
    insert into rotulo_items (rot_id, orden, modulo, sku, producto, vence, estibas, estibas_sis, agregado_por)
      values (p_rot, coalesce((select max(orden) from rotulo_items where rot_id = p_rot), 0) + 1, m, left(nullif(p_item->>'sku', ''), 30),
              left(nullif(p_item->>'prod', ''), 200), v, e, nullif(p_item->>'estSis', '')::numeric, u.nombre);
  else
    update rotulo_items set modulo = m, sku = left(nullif(p_item->>'sku', ''), 30), producto = left(nullif(p_item->>'prod', ''), 200),
           vence = v, estibas = e, editado_por = u.nombre
     where id = (p_item->>'id')::bigint and rot_id = p_rot;
    if not found then raise exception 'Ese módulo ya no está en la rotulación.'; end if;
  end if;
  return _rot_json(p_rot);
end $$;

-- Marcas: p_campo = 'impreso' | 'rotulado'; p_ids = un módulo o varios
create or replace function public.rot_marcar(p_token text, p_rot bigint, p_ids jsonb, p_campo text, p_valor boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador');
  ids bigint[] := (select coalesce(array_agg(x::bigint), '{}') from jsonb_array_elements_text(case when jsonb_typeof(p_ids) = 'array' then p_ids else '[]'::jsonb end) x where x ~ '^[0-9]{1,18}$');
begin
  if p_campo = 'impreso' then
    update rotulo_items set impreso = p_valor, impreso_por = case when p_valor then u.nombre end, impreso_en = case when p_valor then now() end where rot_id = p_rot and id = any(ids);
  elsif p_campo = 'rotulado' then
    update rotulo_items set rotulado = p_valor, rotulado_por = case when p_valor then u.nombre end, rotulado_en = case when p_valor then now() end where rot_id = p_rot and id = any(ids);
  else raise exception 'Marca no válida.';
  end if;
  return _rot_json(p_rot);
end $$;

create or replace function public.rot_item_quitar(p_token text, p_rot bigint, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador');
begin
  delete from rotulo_items where id = p_id and rot_id = p_rot;
  return _rot_json(p_rot);
end $$;

-- Quitar una rotulación (queda guardada como eliminada)
create or replace function public.rot_eliminar(p_token text, p_id bigint) returns boolean
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador');
begin
  update rotulaciones set eliminado_por = u.nombre || ' · ' || to_char(now() at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI') where id = p_id and eliminado_por is null;
  return found;
end $$;

revoke execute on function public._rot_json(bigint) from public, anon, authenticated;
grant execute on function public.rot_listar(text) to anon, authenticated, service_role;
grant execute on function public.rot_crear(text, int) to anon, authenticated, service_role;
grant execute on function public.rot_ver(text, bigint) to anon, authenticated, service_role;
grant execute on function public.rot_item_guardar(text, bigint, jsonb) to anon, authenticated, service_role;
grant execute on function public.rot_marcar(text, bigint, jsonb, text, boolean) to anon, authenticated, service_role;
grant execute on function public.rot_item_quitar(text, bigint, bigint) to anon, authenticated, service_role;
grant execute on function public.rot_eliminar(text, bigint) to anon, authenticated, service_role;

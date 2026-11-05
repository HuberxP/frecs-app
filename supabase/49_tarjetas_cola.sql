-- =====================================================================
-- FRECS! · 49 · Tarjetas guardadas para imprimir (tarjetas rojas y rótulos), por usuario
-- ---------------------------------------------------------------------
-- Cada usuario va guardando las tarjetas que va a imprimir y al final saca un solo PDF.
-- Quedan guardadas (aunque cierre sesión o cambie de equipo) hasta que él las quite.
-- Quitar no borra: queda activo = false.
-- =====================================================================
create table if not exists public.tarjetas_cola (
  id         bigint generated always as identity primary key,
  usuario    text not null,
  seccion    text not null check (seccion in ('ROJAS', 'ROTULOS')),
  datos      jsonb not null,
  copias     smallint not null default 1 check (copias between 1 and 50),
  creada_en  timestamptz not null default now(),
  activo     boolean not null default true,
  quitada_en timestamptz
);
alter table public.tarjetas_cola enable row level security;
create index if not exists tarjetas_cola_usuario on public.tarjetas_cola (usuario, seccion, activo, id);

create or replace function public._trj_seccion(p text) returns text
language plpgsql immutable as $$
declare s text := upper(btrim(coalesce(p, '')));
begin
  if s not in ('ROJAS', 'ROTULOS') then raise exception 'Sección no válida.'; end if;
  return s;
end $$;

create or replace function public._trj_cola_json(p_usuario text, p_seccion text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'd', datos, 'copias', copias, 'en', creada_en) order by id), '[]'::jsonb)
    from tarjetas_cola where usuario = p_usuario and seccion = p_seccion and activo
$$;

create or replace function public.trj_cola_listar(p_token text, p_seccion text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector');
begin
  return _trj_cola_json(u.nombre, _trj_seccion(p_seccion));
end $$;

create or replace function public.trj_cola_agregar(p_token text, p_seccion text, p_datos jsonb, p_copias int default 1) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector'); s text := _trj_seccion(p_seccion);
begin
  if p_datos is null or jsonb_typeof(p_datos) <> 'object' then raise exception 'Faltan los datos de la tarjeta.'; end if;
  if length(p_datos::text) > 4000 then raise exception 'La tarjeta tiene demasiados datos.'; end if;
  if (select count(*) from tarjetas_cola where usuario = u.nombre and seccion = s and activo) >= 200 then
    raise exception 'Ya tienes 200 guardadas: genera el PDF y vacía la lista.';
  end if;
  insert into tarjetas_cola (usuario, seccion, datos, copias) values (u.nombre, s, p_datos, greatest(1, least(50, coalesce(p_copias, 1))));
  return _trj_cola_json(u.nombre, s);
end $$;

create or replace function public.trj_cola_copias(p_token text, p_id bigint, p_copias int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector'); x public.tarjetas_cola;
begin
  select * into x from tarjetas_cola where id = p_id and activo;
  if not found or x.usuario <> u.nombre then raise exception 'Esa tarjeta ya no está en tu lista.'; end if;
  update tarjetas_cola set copias = greatest(1, least(50, coalesce(p_copias, 1))) where id = p_id;
  return _trj_cola_json(u.nombre, x.seccion);
end $$;

create or replace function public.trj_cola_quitar(p_token text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector'); x public.tarjetas_cola;
begin
  select * into x from tarjetas_cola where id = p_id;
  if not found or x.usuario <> u.nombre then raise exception 'Esa tarjeta ya no está en tu lista.'; end if;
  update tarjetas_cola set activo = false, quitada_en = now() where id = p_id and activo;
  return _trj_cola_json(u.nombre, x.seccion);
end $$;

create or replace function public.trj_cola_vaciar(p_token text, p_seccion text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector'); s text := _trj_seccion(p_seccion);
begin
  update tarjetas_cola set activo = false, quitada_en = now() where usuario = u.nombre and seccion = s and activo;
  return _trj_cola_json(u.nombre, s);
end $$;

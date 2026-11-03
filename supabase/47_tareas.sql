-- =====================================================================
-- FRECS! · 47 · Tareas (sección Turnos, para todos)
-- ---------------------------------------------------------------------
-- Cualquiera crea una tarea por hacer, clasificada en FEFO, BLOQUEOS u OTROS. Quien la haga la marca
-- como hecha (con una nota opcional). Quedan quién y cuándo la creó y quién y cuándo la hizo.
--   · Editar o anular una pendiente: quien la creó o un rotador / administrador.
--   · Reabrir una hecha (si se marcó por error): quien la hizo o un rotador / administrador.
--   · Anular no borra: queda como ANULADA y ya no sale en la lista.
-- La lista trae las pendientes y las hechas de los últimos 60 días.
-- =====================================================================
create table if not exists public.tareas (
  id          bigint generated always as identity primary key,
  tipo        text not null check (tipo in ('FEFO', 'BLOQUEOS', 'OTROS')),
  texto       text not null check (length(btrim(texto)) between 1 and 500),
  creada_por  text not null,
  creada_en   timestamptz not null default now(),
  turno       smallint,
  estado      text not null default 'PENDIENTE' check (estado in ('PENDIENTE', 'HECHA', 'ANULADA')),
  hecha_por   text,
  hecha_en    timestamptz,
  nota        text,
  editada_por text,
  editada_en  timestamptz,
  anulada_por text,
  anulada_en  timestamptz
);
alter table public.tareas enable row level security;
create index if not exists tareas_estado on public.tareas (estado, creada_en desc);

-- Turno según la hora de Bogotá (1: 10 p. m. – 6 a. m. · 2: 6 a. m. – 2 p. m. · 3: 2 p. m. – 10 p. m.)
create or replace function public._turno_hora(t timestamptz default now()) returns smallint
language sql stable as $$
  select (case when extract(hour from t at time zone 'America/Bogota') >= 22 or extract(hour from t at time zone 'America/Bogota') < 6 then 1
               when extract(hour from t at time zone 'America/Bogota') < 14 then 2 else 3 end)::smallint
$$;

-- La lista para la página
create or replace function public._tareas_json() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'tipo', tipo, 'texto', texto, 'por', creada_por, 'en', creada_en, 'turno', turno, 'estado', estado,
      'hechaPor', hecha_por, 'hechaEn', hecha_en, 'nota', coalesce(nota, ''), 'editadaPor', editada_por, 'editadaEn', editada_en)
    order by case when estado = 'PENDIENTE' then 0 else 1 end, coalesce(hecha_en, creada_en) desc), '[]'::jsonb)
  from tareas
  where estado = 'PENDIENTE' or (estado = 'HECHA' and hecha_en > now() - interval '60 days')
$$;

create or replace function public._tarea_tipo(p_tipo text) returns text
language plpgsql immutable as $$
declare t text := upper(btrim(coalesce(p_tipo, '')));
begin
  if t = 'BLOQUEO' then t := 'BLOQUEOS'; end if;
  if t = 'OTRO' then t := 'OTROS'; end if;
  if t not in ('FEFO', 'BLOQUEOS', 'OTROS') then raise exception 'Escoge la clasificación: FEFO, Bloqueos u Otros.'; end if;
  return t;
end $$;

create or replace function public.tareas_listar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform _sesion(p_token, 'lector');
  return _tareas_json();
end $$;

create or replace function public.tarea_crear(p_token text, p_tipo text, p_texto text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector'); t text := btrim(coalesce(p_texto, ''));
begin
  if t = '' then raise exception 'Escribe qué hay que hacer.'; end if;
  if length(t) > 500 then raise exception 'La tarea es muy larga (máximo 500 letras).'; end if;
  insert into tareas (tipo, texto, creada_por, turno) values (_tarea_tipo(p_tipo), t, u.nombre, _turno_hora());
  return _tareas_json();
end $$;

-- Marcar como hecha (con nota opcional). Si otra persona ya la marcó, se avisa.
create or replace function public.tarea_completar(p_token text, p_id bigint, p_nota text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector'); x public.tareas; n text := btrim(coalesce(p_nota, ''));
begin
  select * into x from tareas where id = p_id for update;
  if not found or x.estado = 'ANULADA' then raise exception 'Esa tarea ya no existe.'; end if;
  if x.estado = 'HECHA' then raise exception 'Esa tarea ya la marcó como hecha %.', x.hecha_por; end if;
  if length(n) > 500 then raise exception 'La nota es muy larga (máximo 500 letras).'; end if;
  update tareas set estado = 'HECHA', hecha_por = u.nombre, hecha_en = now(), nota = nullif(n, '') where id = p_id;
  return _tareas_json();
end $$;

-- Reabrir una hecha (por error): quien la hizo o un rotador / administrador
create or replace function public.tarea_reabrir(p_token text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector'); x public.tareas;
begin
  select * into x from tareas where id = p_id for update;
  if not found or x.estado <> 'HECHA' then raise exception 'Esa tarea no está marcada como hecha.'; end if;
  if x.hecha_por <> u.nombre and _nivel(u.rol) < _nivel('validador') then raise exception 'PERMISO: Solo quien la hizo o un rotador puede reabrirla.'; end if;
  update tareas set estado = 'PENDIENTE', hecha_por = null, hecha_en = null, nota = null where id = p_id;
  return _tareas_json();
end $$;

-- Corregir una pendiente: quien la creó o un rotador / administrador
create or replace function public.tarea_editar(p_token text, p_id bigint, p_tipo text, p_texto text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector'); x public.tareas; t text := btrim(coalesce(p_texto, ''));
begin
  select * into x from tareas where id = p_id for update;
  if not found or x.estado <> 'PENDIENTE' then raise exception 'Solo se puede corregir una tarea pendiente.'; end if;
  if x.creada_por <> u.nombre and _nivel(u.rol) < _nivel('validador') then raise exception 'PERMISO: Solo quien la creó o un rotador puede corregirla.'; end if;
  if t = '' then raise exception 'Escribe qué hay que hacer.'; end if;
  if length(t) > 500 then raise exception 'La tarea es muy larga (máximo 500 letras).'; end if;
  update tareas set tipo = _tarea_tipo(p_tipo), texto = t, editada_por = u.nombre, editada_en = now() where id = p_id;
  return _tareas_json();
end $$;

-- Anular (no se borra): quien la creó o un rotador / administrador
create or replace function public.tarea_anular(p_token text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector'); x public.tareas;
begin
  select * into x from tareas where id = p_id for update;
  if not found or x.estado = 'ANULADA' then raise exception 'Esa tarea ya no existe.'; end if;
  if x.estado <> 'PENDIENTE' then raise exception 'Solo se puede quitar una tarea pendiente.'; end if;
  if x.creada_por <> u.nombre and _nivel(u.rol) < _nivel('validador') then raise exception 'PERMISO: Solo quien la creó o un rotador puede quitarla.'; end if;
  update tareas set estado = 'ANULADA', anulada_por = u.nombre, anulada_en = now() where id = p_id;
  return _tareas_json();
end $$;

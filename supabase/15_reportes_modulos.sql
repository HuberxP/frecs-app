-- =====================================================================
-- FRECS! · 15 · Rol verificador, reportes de módulos y preferencias por persona
-- ---------------------------------------------------------------------
--   · Rol nuevo «verificador»: mismo nivel de lectura que «lector» en la base (la página
--     le muestra solo Stock, Información de producto, Por módulo y los reportes).
--   · perfiles.prefs: preferencias de cada persona (p. ej. ver las sugerencias del WMS).
--   · reportes_modulo: «módulo vacío» y «conflicto» (el módulo tiene otro producto).
--     Lo crea cualquiera con sesión; lo marca completado un validador o administrador.
--     Se cierra solo cuando una sincronización posterior al reporte lo confirma en el WMS:
--       VACÍO → el módulo ya no tiene producto · CONFLICTO → el WMS ya muestra el producto encontrado.
--   · datos_consulta / datos_turnos / sb_datos_bot devuelven los reportes y las preferencias.
-- =====================================================================

-- 1. Rol verificador
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check check (rol in ('verificador', 'lector', 'validador', 'administrador'));
create or replace function public._nivel(rol text) returns int
language sql immutable as $$
  select case rol when 'administrador' then 3 when 'validador' then 2 when 'lector' then 1 when 'verificador' then 1 else 0 end
$$;

-- 2. Preferencias por persona
alter table public.perfiles add column if not exists prefs jsonb not null default '{}'::jsonb;
create or replace function public.pref_guardar(p_token text, p_clave text, p_valor jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'verificador'); r jsonb;
begin
  if coalesce(p_clave, '') !~ '^[a-zA-Z_]{1,40}$' then raise exception 'Preferencia no válida.'; end if;
  update perfiles set prefs = coalesce(prefs, '{}'::jsonb) || jsonb_build_object(p_clave, p_valor) where id = u.id returning prefs into r;
  return r;
end $$;

-- 3. Reportes de módulos
create table if not exists public.reportes_modulo (
  id               bigint generated always as identity primary key,
  tipo             text not null check (tipo in ('VACIO', 'CONFLICTO')),
  modulo           text not null,
  sku_sistema      text,          -- lo que decía el aplicativo (WMS) al reportar
  producto_sistema text,
  detalle_sistema  text,          -- p. ej. «2 estibas · vence 12/11/2026»
  sku_encontrado   text,          -- conflicto: lo que se encontró en físico
  producto_encontrado text,
  nota             text,
  reportado_por    text not null,
  reportado_en     timestamptz not null default now(),
  estado           text not null default 'PENDIENTE' check (estado in ('PENDIENTE', 'COMPLETADO', 'ANULADO')),
  completado_por   text,
  completado_en    timestamptz,
  cierre           text          -- MANUAL | WMS | ANULADO
);
alter table public.reportes_modulo enable row level security;
create unique index if not exists reportes_modulo_abierto on public.reportes_modulo (modulo, tipo) where estado = 'PENDIENTE';
create index if not exists reportes_modulo_fecha on public.reportes_modulo (reportado_en desc);

-- Cierre automático: solo con una sincronización hecha DESPUÉS del reporte
create or replace function public._reportes_auto() returns void
language plpgsql security definer set search_path = public as $$
declare s timestamptz := (select ultima_sync from sync_estado where id = 1);
begin
  if s is null then return; end if;
  update reportes_modulo r set estado = 'COMPLETADO', cierre = 'WMS', completado_por = 'WMS', completado_en = s
   where r.estado = 'PENDIENTE' and r.reportado_en < s and r.tipo = 'VACIO'
     and not exists (select 1 from wms_base w where w.modulo = r.modulo and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0));
  update reportes_modulo r set estado = 'COMPLETADO', cierre = 'WMS', completado_por = 'WMS', completado_en = s
   where r.estado = 'PENDIENTE' and r.reportado_en < s and r.tipo = 'CONFLICTO' and coalesce(r.sku_encontrado, '') <> ''
     and exists (select 1 from wms_base w where w.modulo = r.modulo and w.sku = r.sku_encontrado and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0));
end $$;

-- Para el motor (hoja «Reportes_Modulos»): los pendientes y lo de los últimos 30 días
-- Id, Tipo, Modulo, Sku_sistema, Producto_sistema, Detalle_sistema, Sku_encontrado, Producto_encontrado, Nota,
-- Reportado_por, Reportado_en, Estado, Completado_por, Completado_en, Cierre
create or replace function public._reportes_json() returns jsonb
language plpgsql security definer set search_path = public as $$
declare tz constant text := 'America/Bogota';
begin
  perform _reportes_auto();
  return coalesce((select jsonb_agg(jsonb_build_array(id::text, tipo, modulo, coalesce(sku_sistema, ''), coalesce(producto_sistema, ''), coalesce(detalle_sistema, ''),
      coalesce(sku_encontrado, ''), coalesce(producto_encontrado, ''), coalesce(nota, ''), reportado_por, to_char(reportado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'),
      estado, coalesce(completado_por, ''), coalesce(to_char(completado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), ''), coalesce(cierre, '')) order by reportado_en desc, id desc)
    from reportes_modulo where estado = 'PENDIENTE' or reportado_en > now() - interval '30 days'), '[]'::jsonb);
end $$;

-- Crear: p_items = [{ tipo, modulo, sku_sistema, producto_sistema, detalle_sistema, sku_encontrado, producto_encontrado, nota }]
-- Si el módulo ya tiene un reporte pendiente del mismo tipo no se repite (se devuelve en «repetidos»).
create or replace function public.reporte_crear(p_token text, p_items jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'verificador');
  x jsonb; t text; m text; nuevo bigint;
  creados bigint[] := '{}'; repetidos text[] := '{}';
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'No hay módulos para reportar.'; end if;
  if jsonb_array_length(p_items) > 60 then raise exception 'Son demasiados módulos en un solo reporte.'; end if;
  for x in select * from jsonb_array_elements(p_items) loop
    t := upper(coalesce(x->>'tipo', ''));
    m := upper(btrim(coalesce(x->>'modulo', '')));
    if t not in ('VACIO', 'CONFLICTO') then raise exception 'Tipo de reporte no válido.'; end if;
    if m = '' or length(m) > 30 then raise exception 'Módulo no válido.'; end if;
    if t = 'CONFLICTO' and coalesce(x->>'sku_encontrado', '') = '' then raise exception 'Escoge el producto que encontraste en %.', m; end if;
    if exists (select 1 from reportes_modulo where modulo = m and tipo = t and estado = 'PENDIENTE') then repetidos := repetidos || m; continue; end if;
    insert into reportes_modulo (tipo, modulo, sku_sistema, producto_sistema, detalle_sistema, sku_encontrado, producto_encontrado, nota, reportado_por)
      values (t, m, left(nullif(x->>'sku_sistema', ''), 60), left(nullif(x->>'producto_sistema', ''), 200), left(nullif(x->>'detalle_sistema', ''), 300),
              left(nullif(x->>'sku_encontrado', ''), 30), left(nullif(x->>'producto_encontrado', ''), 200), left(nullif(btrim(coalesce(x->>'nota', '')), ''), 500), u.nombre)
      returning id into nuevo;
    creados := creados || nuevo;
  end loop;
  return jsonb_build_object('creados', to_jsonb(creados), 'repetidos', to_jsonb(repetidos), 'reportes', _reportes_json());
end $$;

-- Completar (validador o administrador) o anular (quien lo reportó, o un validador) un reporte pendiente
create or replace function public.reporte_cerrar(p_token text, p_id bigint, p_accion text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'verificador');
  r public.reportes_modulo;
begin
  select * into r from reportes_modulo where id = p_id;
  if not found then raise exception 'El reporte no existe.'; end if;
  if r.estado <> 'PENDIENTE' then raise exception 'Ese reporte ya está %.', lower(r.estado); end if;
  if p_accion = 'completar' then
    if _nivel(u.rol) < 2 then raise exception 'PERMISO: Solo un validador o administrador marca la tarea como completada.'; end if;
    update reportes_modulo set estado = 'COMPLETADO', cierre = 'MANUAL', completado_por = u.nombre, completado_en = now() where id = p_id;
  elsif p_accion = 'anular' then
    if _nivel(u.rol) < 2 and lower(btrim(r.reportado_por)) <> lower(btrim(u.nombre)) then raise exception 'PERMISO: Solo quien lo reportó o un validador puede anularlo.'; end if;
    update reportes_modulo set estado = 'ANULADO', cierre = 'ANULADO', completado_por = u.nombre, completado_en = now() where id = p_id;
  else raise exception 'Acción no válida.';
  end if;
  return _reportes_json();
end $$;

-- Lista fresca (con el cierre automático hecho)
create or replace function public.reportes_listar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'verificador');
begin
  return _reportes_json();
end $$;

-- Texto del aviso para el grupo de Telegram (lo pide la función frecs-bot con la clave de servicio).
-- Solo reportes recién creados (10 min) por quien tiene la sesión.
drop function if exists public.reporte_aviso(text, bigint[]);
create or replace function public.reporte_aviso(p_token text, p_ids jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'verificador');
  t text := ''; r record; n int := 0; tz constant text := 'America/Bogota';
begin
  for r in select * from reportes_modulo where id in (select x::bigint from jsonb_array_elements_text(case when jsonb_typeof(p_ids) = 'array' then p_ids else '[]'::jsonb end) x where x ~ '^[0-9]{1,18}$') and lower(btrim(reportado_por)) = lower(btrim(u.nombre))
             and reportado_en > now() - interval '10 minutes' order by tipo desc, modulo loop
    n := n + 1;
    if r.tipo = 'VACIO' then
      t := t || E'\n⬜ ' || r.modulo || ' — reportado VACÍO' || coalesce(E'\n    El aplicativo dice: ' || coalesce(r.sku_sistema || ' · ', '') || r.producto_sistema, '');
    else
      t := t || E'\n⚠️ ' || r.modulo || ' — CONFLICTO' || coalesce(E'\n    El aplicativo dice: ' || coalesce(r.sku_sistema || ' · ', '') || r.producto_sistema, '')
             || E'\n    Encontró: ' || r.sku_encontrado || coalesce(' · ' || r.producto_encontrado, '');
    end if;
    if r.nota is not null then t := t || E'\n    📝 ' || r.nota; end if;
  end loop;
  if n = 0 then return ''; end if;
  return '📍 REPORTE DE MÓDULOS (' || n || ')' || E'\nPor ' || u.nombre || ' · ' || to_char(now() at time zone tz, 'DD/MM HH24:MI') || E'\n' || t
         || E'\n\nPonlo en el WMS y márcalo como completado en «Reportes generados».';
end $$;

revoke execute on function public._reportes_auto() from public, anon, authenticated;
revoke execute on function public._reportes_json() from public, anon, authenticated;
revoke execute on function public.reporte_aviso(text, jsonb) from public, anon, authenticated;
grant execute on function public.reporte_aviso(text, jsonb) to service_role;
grant execute on function public.reporte_crear(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.reporte_cerrar(text, bigint, text) to anon, authenticated, service_role;
grant execute on function public.reportes_listar(text) to anon, authenticated, service_role;
grant execute on function public.pref_guardar(text, text, jsonb) to anon, authenticated, service_role;

-- 4. Los datos que bajan la página y el bot: preferencias y reportes
do $$
declare
  d text; n int;
  usr_a constant text := $q$jsonb_build_object('nombre', u.nombre, 'rol', u.rol)$q$;
  usr_d constant text := $q$jsonb_build_object('nombre', u.nombre, 'rol', u.rol, 'prefs', coalesce(u.prefs, '{}'::jsonb))$q$;
  lim_a constant text := $q$coalesce(fecha_reporte, '')) order by id) from limbo), '[]'::jsonb)$q$;
  lim_d constant text := $q$coalesce(fecha_reporte, '')) order by id) from limbo), '[]'::jsonb), 'reportes', _reportes_json()$q$;
begin
  -- datos_consulta: preferencias + reportes
  select pg_get_functiondef('public.datos_consulta(text, jsonb)'::regprocedure) into d;
  if position(usr_d in d) = 0 then
    n := (length(d) - length(replace(d, usr_a, ''))) / length(usr_a);
    if n <> 1 then raise exception 'datos_consulta: usuario encontrado % veces', n; end if;
    d := replace(d, usr_a, usr_d);
  end if;
  if position(lim_d in d) = 0 then
    n := (length(d) - length(replace(d, lim_a, ''))) / length(lim_a);
    if n <> 1 then raise exception 'datos_consulta: limbo encontrado % veces', n; end if;
    d := replace(d, lim_a, lim_d);
  end if;
  execute d;
  -- datos_turnos: preferencias
  select pg_get_functiondef('public.datos_turnos(text, jsonb)'::regprocedure) into d;
  if position(usr_d in d) = 0 then
    n := (length(d) - length(replace(d, usr_a, ''))) / length(usr_a);
    if n <> 1 then raise exception 'datos_turnos: usuario encontrado % veces', n; end if;
    execute replace(d, usr_a, usr_d);
  end if;
  -- sb_datos_bot: reportes (para que el bot también salte los módulos reportados vacíos)
  select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = 'sb_datos_bot' and p.pronamespace = 'public'::regnamespace;
  if d is not null and position(lim_d in d) = 0 and position(lim_a in d) > 0 then execute replace(d, lim_a, lim_d); end if;
end $$;

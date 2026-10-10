-- =====================================================================
-- FRECS! · 19 · Rol OPM, lista de consumo solo del administrador y alerta de pocos
-- ---------------------------------------------------------------------
--   · Rol nuevo «opm» (el que surte PK / T2, T1 o KA): lee como el verificador (nivel 1).
--     La restricción de la tabla perfiles va aparte (19b) porque se borra y se vuelve a crear.
--   · La lista de consumo (agregar, quitar y escoger el módulo) la cambia solo el administrador.
--   · Productos vigilados para la alerta de pocos: frecs_config «pocos_vigilar» = ["22613", …].
--     La página avisa cuando uno queda por debajo de su mínimo (columna Mínimo de la hoja Sku).
-- =====================================================================

-- 1. Nivel del rol opm (igual al verificador)
create or replace function public._nivel(rol text) returns int
language sql immutable as $$
  select case rol when 'administrador' then 3 when 'validador' then 2 when 'lector' then 1 when 'verificador' then 1 when 'opm' then 1 else 0 end
$$;

-- 2. Secciones por rol: también el opm
create or replace function public.vistas_rol_guardar(p_token text, p_cfg jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'administrador'); r text;
begin
  if jsonb_typeof(p_cfg) <> 'object' then raise exception 'Configuración no válida.'; end if;
  for r in select jsonb_object_keys(p_cfg) loop
    if r not in ('verificador', 'opm', 'lector', 'validador', 'administrador') or jsonb_typeof(p_cfg->r) <> 'object' then raise exception 'Configuración no válida (%).', r; end if;
  end loop;
  if length(p_cfg::text) > 20000 then raise exception 'Configuración demasiado grande.'; end if;
  insert into frecs_config (clave, valor) values ('vistas_rol', p_cfg::text)
    on conflict (clave) do update set valor = excluded.valor;
  return p_cfg;
end $$;
grant execute on function public.vistas_rol_guardar(text, jsonb) to anon, authenticated, service_role;

-- 3. Lista de consumo: solo el administrador la cambia
do $$
declare
  d text;
  a constant text := $q$"consumo":       {"rol": "validador",$q$;
  b constant text := $q$"consumo":       {"rol": "administrador",$q$;
begin
  select pg_get_functiondef('public.guardar_filas(text, jsonb)'::regprocedure) into d;
  if position(b in d) = 0 then
    if position(a in d) = 0 then raise exception 'guardar_filas: no se encontró la regla de consumo'; end if;
    execute replace(d, a, b);
  end if;
end $$;

-- 4. Productos vigilados (alerta de pocos)
create or replace function public.pocos_vigilar_guardar(p_token text, p_skus jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'administrador'); l jsonb;
begin
  if jsonb_typeof(p_skus) <> 'array' then raise exception 'Lista no válida.'; end if;
  select coalesce(jsonb_agg(distinct x), '[]'::jsonb) into l
    from jsonb_array_elements_text(p_skus) x where x ~ '^[0-9]{1,20}$';
  if jsonb_array_length(l) > 500 then raise exception 'Son demasiados productos (máximo 500).'; end if;
  insert into frecs_config (clave, valor) values ('pocos_vigilar', l::text)
    on conflict (clave) do update set valor = excluded.valor;
  return l;
end $$;
grant execute on function public.pocos_vigilar_guardar(text, jsonb) to anon, authenticated, service_role;

-- La página la recibe con sus datos
do $$
declare
  d text; n int;
  a constant text := $q$'vistas_rol', coalesce((select valor::jsonb from frecs_config where clave = 'vistas_rol'), '{}'::jsonb)$q$;
  b constant text := $q$'vistas_rol', coalesce((select valor::jsonb from frecs_config where clave = 'vistas_rol'), '{}'::jsonb), 'pocos_vigilar', coalesce((select valor::jsonb from frecs_config where clave = 'pocos_vigilar'), '[]'::jsonb)$q$;
begin
  select pg_get_functiondef('public.datos_consulta(text, jsonb)'::regprocedure) into d;
  if position(b in d) = 0 then
    n := (length(d) - length(replace(d, a, ''))) / length(a);
    if n <> 1 then raise exception 'datos_consulta: vistas_rol encontrado % veces', n; end if;
    execute replace(d, a, b);
  end if;
end $$;

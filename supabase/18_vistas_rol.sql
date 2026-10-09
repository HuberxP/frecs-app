-- =====================================================================
-- FRECS! · 18 · Secciones por rol (las escoge el administrador)
-- ---------------------------------------------------------------------
-- frecs_config «vistas_rol» = { "lector": { "rotular": false, ... }, ... }: solo las diferencias
-- con lo que trae cada rol por defecto. Controla qué pantallas se ven; lo que cada rol puede
-- guardar lo siguen revisando las funciones de Supabase.
-- =====================================================================
create or replace function public.vistas_rol_guardar(p_token text, p_cfg jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'administrador'); r text;
begin
  if jsonb_typeof(p_cfg) <> 'object' then raise exception 'Configuración no válida.'; end if;
  for r in select jsonb_object_keys(p_cfg) loop
    if r not in ('verificador', 'lector', 'validador', 'administrador') or jsonb_typeof(p_cfg->r) <> 'object' then raise exception 'Configuración no válida (%).', r; end if;
  end loop;
  if length(p_cfg::text) > 20000 then raise exception 'Configuración demasiado grande.'; end if;
  insert into frecs_config (clave, valor) values ('vistas_rol', p_cfg::text)
    on conflict (clave) do update set valor = excluded.valor;
  return p_cfg;
end $$;
grant execute on function public.vistas_rol_guardar(text, jsonb) to anon, authenticated, service_role;

-- La página la recibe con sus datos
do $$
declare
  d text; n int;
  a constant text := $q$'reportes', _reportes_json()$q$;
  b constant text := $q$'reportes', _reportes_json(), 'vistas_rol', coalesce((select valor::jsonb from frecs_config where clave = 'vistas_rol'), '{}'::jsonb)$q$;
begin
  select pg_get_functiondef('public.datos_consulta(text, jsonb)'::regprocedure) into d;
  if position(b in d) = 0 then
    n := (length(d) - length(replace(d, a, ''))) / length(a);
    if n <> 1 then raise exception 'datos_consulta: reportes encontrado % veces', n; end if;
    execute replace(d, a, b);
  end if;
end $$;

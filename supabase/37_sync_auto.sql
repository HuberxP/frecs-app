-- =====================================================================
-- FRECS! · 37 · Sincronización automática con el WMS (switch del administrador)
-- ---------------------------------------------------------------------
-- El switch vive en Apps Script (que es quien consulta el WMS). Apps Script deja aquí el estado
-- para que la página lo muestre sin preguntarle: frecs_config «sync_auto» =
--   { on, por, en, prox, ult, ok, msg }  (prox / ult en ISO; ok/msg = cómo le fue a la última automática)
-- Solo Apps Script lo escribe (clave secreta); la página lo recibe con sus datos.
-- =====================================================================
create or replace function public.sb_sync_auto(p_valor jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(p_valor) <> 'object' then raise exception 'Estado no válido.'; end if;
  insert into frecs_config (clave, valor) values ('sync_auto', p_valor::text)
    on conflict (clave) do update set valor = excluded.valor;
  return p_valor;
end $$;

do $$
declare
  d text; n int;
  a constant text := $q$'tpc_productos', coalesce((select valor::jsonb from frecs_config where clave = 'tpc_productos'), '[]'::jsonb)$q$;
  b constant text := $q$'tpc_productos', coalesce((select valor::jsonb from frecs_config where clave = 'tpc_productos'), '[]'::jsonb), 'sync_auto', coalesce((select valor::jsonb from frecs_config where clave = 'sync_auto'), '{}'::jsonb)$q$;
begin
  select pg_get_functiondef('public.datos_consulta(text, jsonb)'::regprocedure) into d;
  if position(b in d) = 0 then
    n := (length(d) - length(replace(d, a, ''))) / length(a);
    if n <> 1 then raise exception 'datos_consulta: tpc_productos encontrado % veces', n; end if;
    execute replace(d, a, b);
  end if;
end $$;

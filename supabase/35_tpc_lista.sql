-- =====================================================================
-- FRECS! · 35 · Lista de productos que se pueden escoger como tapacódigos (TPC)
-- ---------------------------------------------------------------------
-- En Administración → «Tapacódigos (lista)» el administrador escoge los productos que pueden
-- llevar tapacódigos. Al llenar la sección TPC de la entrega de turno solo salen esos (la lista
-- no es enorme). Si la lista está vacía salen todos, como antes.
-- Se guarda en frecs_config «tpc_productos» = ["22613", …] y la página la recibe con sus datos.
-- =====================================================================
create or replace function public.tpc_productos_guardar(p_token text, p_skus jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'administrador'); l jsonb;
begin
  if jsonb_typeof(p_skus) <> 'array' then raise exception 'Lista no válida.'; end if;
  select coalesce(jsonb_agg(distinct x), '[]'::jsonb) into l
    from jsonb_array_elements_text(p_skus) x where x ~ '^[0-9]{1,20}$';
  if jsonb_array_length(l) > 500 then raise exception 'Son demasiados productos (máximo 500).'; end if;
  insert into frecs_config (clave, valor) values ('tpc_productos', l::text)
    on conflict (clave) do update set valor = excluded.valor;
  return l;
end $$;
grant execute on function public.tpc_productos_guardar(text, jsonb) to anon, authenticated, service_role;

-- La página la recibe con sus datos
do $$
declare
  d text; n int;
  a constant text := $q$'revisiones', _revisiones_json()$q$;
  b constant text := $q$'revisiones', _revisiones_json(), 'tpc_productos', coalesce((select valor::jsonb from frecs_config where clave = 'tpc_productos'), '[]'::jsonb)$q$;
begin
  select pg_get_functiondef('public.datos_consulta(text, jsonb)'::regprocedure) into d;
  if position(b in d) = 0 then
    n := (length(d) - length(replace(d, a, ''))) / length(a);
    if n <> 1 then raise exception 'datos_consulta: revisiones encontrado % veces', n; end if;
    execute replace(d, a, b);
  end if;
end $$;

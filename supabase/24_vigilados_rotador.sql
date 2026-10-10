-- =====================================================================
-- FRECS! · 24 · Los productos vigilados (alerta de pocos) los cambia también el rotador
-- (rol validador); antes solo el administrador. La sección pasó al menú de Turnos.
-- =====================================================================
create or replace function public.pocos_vigilar_guardar(p_token text, p_skus jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador'); l jsonb;
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

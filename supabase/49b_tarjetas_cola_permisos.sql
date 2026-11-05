-- FRECS! · 49b · Tarjetas guardadas: la página llama solo las funciones con sesión; las internas no
revoke execute on function public._trj_seccion(text) from public, anon, authenticated;
revoke execute on function public._trj_cola_json(text, text) from public, anon, authenticated;
revoke all on table public.tarjetas_cola from anon, authenticated;
grant execute on function public.trj_cola_listar(text, text) to anon, authenticated, service_role;
grant execute on function public.trj_cola_agregar(text, text, jsonb, int) to anon, authenticated, service_role;
grant execute on function public.trj_cola_copias(text, bigint, int) to anon, authenticated, service_role;
grant execute on function public.trj_cola_quitar(text, bigint) to anon, authenticated, service_role;
grant execute on function public.trj_cola_vaciar(text, text) to anon, authenticated, service_role;

-- FRECS! · 47b · Tareas: la página llama solo las funciones con sesión; las internas no
revoke execute on function public._tareas_json() from public, anon, authenticated;
revoke execute on function public._tarea_tipo(text) from public, anon, authenticated;
revoke execute on function public._turno_hora(timestamptz) from public, anon, authenticated;
revoke all on table public.tareas from anon, authenticated;
grant execute on function public.tareas_listar(text) to anon, authenticated, service_role;
grant execute on function public.tarea_crear(text, text, text) to anon, authenticated, service_role;
grant execute on function public.tarea_completar(text, bigint, text) to anon, authenticated, service_role;
grant execute on function public.tarea_reabrir(text, bigint) to anon, authenticated, service_role;
grant execute on function public.tarea_editar(text, bigint, text, text) to anon, authenticated, service_role;
grant execute on function public.tarea_anular(text, bigint) to anon, authenticated, service_role;

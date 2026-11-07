-- FRECS! · 50b · Entradas: la página llama solo las funciones con sesión; las internas no
revoke execute on function public._entradas_wms() from public, anon, authenticated;
revoke execute on function public._entrada_json(public.entradas) from public, anon, authenticated;
revoke execute on function public._entradas_json(date) from public, anon, authenticated;
revoke all on table public.entradas from anon, authenticated;
grant execute on function public.entradas_listar(text, date) to anon, authenticated, service_role;
grant execute on function public.entrada_registrar(text, jsonb, boolean) to anon, authenticated, service_role;
grant execute on function public.entrada_anular(text, bigint, text) to anon, authenticated, service_role;
grant execute on function public.entrada_revisar(text, bigint, text) to anon, authenticated, service_role;

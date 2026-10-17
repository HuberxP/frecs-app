-- FRECS! · 42b · Las notificaciones: cada persona se suscribe con su sesión; el resto solo la función frecs-bot
revoke execute on function public.sb_push_vapid() from public, anon, authenticated;
revoke execute on function public.sb_push_vapid_guardar(jsonb) from public, anon, authenticated;
revoke execute on function public.sb_push_subs(text, text) from public, anon, authenticated;
revoke execute on function public.sb_push_resultado(jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.sb_push_reporte(bigint) from public, anon, authenticated;
revoke execute on function public.sb_push_vencer() from public, anon, authenticated;
revoke execute on function public._push_llamar(jsonb) from public, anon, authenticated;
revoke execute on function public.sb_push_tic_vencer() from public, anon, authenticated;
grant execute on function public.sb_push_vapid() to service_role;
grant execute on function public.sb_push_vapid_guardar(jsonb) to service_role;
grant execute on function public.sb_push_subs(text, text) to service_role;
grant execute on function public.sb_push_resultado(jsonb, jsonb) to service_role;
grant execute on function public.sb_push_reporte(bigint) to service_role;
grant execute on function public.sb_push_vencer() to service_role;
grant execute on function public.push_suscribir(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.push_quitar(text, text) to anon, authenticated, service_role;

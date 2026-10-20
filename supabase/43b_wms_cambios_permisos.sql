-- FRECS! · 43b · Las revisiones de cambios solo las usa la función frecs-bot (clave de servicio)
revoke execute on function public.sb_wms_actual() from public, anon, authenticated;
revoke execute on function public.sb_wms_delta_desde() from public, anon, authenticated;
revoke execute on function public.sb_wms_delta_fin(jsonb) from public, anon, authenticated;
revoke execute on function public._sync_delta_prox(timestamptz) from public, anon, authenticated;
revoke execute on function public._sync_auto_prox(timestamptz) from public, anon, authenticated;
revoke execute on function public.sb_wms_tic() from public, anon, authenticated;
grant execute on function public.sb_wms_actual() to service_role;
grant execute on function public.sb_wms_delta_desde() to service_role;
grant execute on function public.sb_wms_delta_fin(jsonb) to service_role;
grant execute on function public.sync_auto_poner(text, boolean) to anon, authenticated, service_role;

-- FRECS! · 41b · La conexión al WMS y su estado solo los usa la función frecs-bot (clave de servicio);
-- prender / apagar la automática lo hace el administrador con su sesión (sync_auto_poner).
revoke execute on function public.sb_wms_config_guardar(jsonb) from public, anon, authenticated;
revoke execute on function public.sb_wms_config() from public, anon, authenticated;
revoke execute on function public.sb_wms_token(text) from public, anon, authenticated;
revoke execute on function public.sb_wms_previo() from public, anon, authenticated;
revoke execute on function public.sb_wms_resultado(boolean, boolean, text) from public, anon, authenticated;
revoke execute on function public.sb_wms_tic() from public, anon, authenticated;
revoke execute on function public._sync_auto_estado() from public, anon, authenticated;
revoke execute on function public._sync_auto_guardar(jsonb) from public, anon, authenticated;
revoke execute on function public._sync_auto_prox(timestamptz) from public, anon, authenticated;
grant execute on function public.sb_wms_config_guardar(jsonb) to service_role;
grant execute on function public.sb_wms_config() to service_role;
grant execute on function public.sb_wms_token(text) to service_role;
grant execute on function public.sb_wms_previo() to service_role;
grant execute on function public.sb_wms_resultado(boolean, boolean, text) to service_role;
grant execute on function public.sync_auto_poner(text, boolean) to anon, authenticated, service_role;

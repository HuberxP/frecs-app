-- FRECS! · 37b · Solo Apps Script (clave secreta) guarda el estado de la sincronización automática
revoke execute on function public.sb_sync_auto(jsonb) from public, anon, authenticated;
grant execute on function public.sb_sync_auto(jsonb) to service_role;

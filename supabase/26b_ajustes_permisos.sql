-- =====================================================================
-- FRECS! · 26b · Funciones internas de los ajustes sin WMS (no se llaman desde la página)
-- =====================================================================
revoke execute on function public._ajustes_json() from public, anon, authenticated;
revoke execute on function public._ajuste_permiso(public.perfiles) from public, anon, authenticated;

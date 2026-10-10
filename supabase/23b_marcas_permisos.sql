-- =====================================================================
-- FRECS! · 23b · Funciones internas de las marcas de consumo (no se llaman desde la página)
-- =====================================================================
revoke execute on function public._marcas_auto() from public, anon, authenticated;
revoke execute on function public._marcas_json() from public, anon, authenticated;

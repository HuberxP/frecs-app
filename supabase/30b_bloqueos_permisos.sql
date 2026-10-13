-- =====================================================================
-- FRECS! · 30b · Función interna de los bloqueos sin WMS (no se llama desde la página)
-- =====================================================================
revoke execute on function public._bloqueos_json() from public, anon, authenticated;

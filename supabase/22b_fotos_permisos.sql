-- =====================================================================
-- FRECS! · 22b · Las funciones de fotos solo las usa Apps Script (clave de servicio)
-- =====================================================================
revoke execute on function public.sb_fotos_conocidas(jsonb) from public, anon, authenticated;
revoke execute on function public.sb_fotos_guardar(jsonb) from public, anon, authenticated;

-- FRECS! · 34b · Funciones internas de «Volver a aplicar» (no se llaman desde la página)
revoke execute on function public._reaplicar_base() from public, anon, authenticated;
revoke execute on function public._reaplicar_ajustes() from public, anon, authenticated;
revoke execute on function public._cant_ahora(text, text, text) from public, anon, authenticated;

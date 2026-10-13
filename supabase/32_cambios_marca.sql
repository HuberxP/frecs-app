-- =====================================================================
-- FRECS! · 32 · Marca de cambios: para que la página se actualice sola
-- ---------------------------------------------------------------------
-- La página pregunta cada poco (y al cambiar de sección) esta marca, que es liviana. Si cambió
-- (alguien sincronizó, anotó un ajuste sin WMS, bloqueó, marcó consumo, reportó un módulo o eligió
-- módulo de Pony), vuelve a traer los datos. Así nadie tiene que tocar ↻.
-- =====================================================================
create or replace function public.cambios_marca(p_token text) returns text
language plpgsql stable security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector');
begin
  return concat_ws('|',
    (select extract(epoch from ultima_sync)::bigint from sync_estado where id = 1),
    (select extract(epoch from greatest(max(en), max(deshecho_en)))::bigint || ':' || count(*) from ajustes_sin_wms),
    (select extract(epoch from greatest(max(en), max(deshecho_en)))::bigint || ':' || count(*) from bloqueos_sin_wms),
    (select extract(epoch from greatest(max(marcado_en), max(quitado_en)))::bigint || ':' || count(*) from marcas_consumo),
    (select extract(epoch from greatest(max(reportado_en), max(completado_en)))::bigint || ':' || count(*) from reportes_modulo),
    (select extract(epoch from max(elegido_en))::bigint || ':' || count(*) || ':' || count(modulo_elegido) from consumo));
end $$;
grant execute on function public.cambios_marca(text) to anon, authenticated, service_role;

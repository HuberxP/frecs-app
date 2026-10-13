-- =====================================================================
-- FRECS! · 31 · Al reportar un módulo como vacío se quita de «Módulos en consumo»
-- ---------------------------------------------------------------------
-- Un disparador sobre reportes_modulo: cuando entra un reporte VACIO, las marcas de consumo activas
-- de ese módulo se cierran (cierre = 'VACIO', quitado_por = quien reportó).
-- =====================================================================
create or replace function public._vacio_quita_consumo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tipo = 'VACIO' then
    update marcas_consumo set quitado_en = now(), quitado_por = new.reportado_por, cierre = 'VACIO'
     where modulo = new.modulo and quitado_en is null;
  end if;
  return new;
end $$;
revoke execute on function public._vacio_quita_consumo() from public, anon, authenticated;
create or replace trigger reportes_vacio_quita_consumo after insert on public.reportes_modulo
  for each row execute function public._vacio_quita_consumo();

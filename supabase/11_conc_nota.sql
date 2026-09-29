-- =====================================================================
-- FRECS! · Nota por producto en la conciliación
-- ---------------------------------------------------------------------
--   · conc_items.nota: texto libre por producto (columna L «Nota» de Conc_Items).
--   · _datos_turnos y sb_turnos_hojas devuelven la nota al final de cada fila de conc_items
--     (se toma la función tal como está en la base y solo se le agrega esa columna).
-- =====================================================================

alter table public.conc_items add column if not exists nota text;
do $$
declare f text; d text; viejo constant text := 'coalesce(origen, '''')) order by conc_id, sku)'; nuevo constant text := 'coalesce(origen, ''''), coalesce(nota, '''')) order by conc_id, sku)';
begin
  foreach f in array array['_datos_turnos', 'sb_turnos_hojas'] loop
    select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = f and p.pronamespace = 'public'::regnamespace;
    if position(nuevo in d) > 0 then continue; end if;
    if (length(d) - length(replace(d, viejo, ''))) / length(viejo) <> 1 then raise exception 'No se encontró la fila de conc_items en %', f; end if;
    execute replace(d, viejo, nuevo);
  end loop;
end $$;

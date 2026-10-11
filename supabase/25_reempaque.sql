-- =====================================================================
-- FRECS! · 25 · Reempaque en validación y conciliación
-- ---------------------------------------------------------------------
--   · val_productos.reempaque / conc_items.reempaque: de lo contado, cuántas cajas son
--     reempaque (a veces no puede salir por un canal). Vacío = no se dijo.
--   · _datos_turnos y sb_turnos_hojas la devuelven al final de cada fila
--     (Val_Productos: N · Val_Hist_Productos: O · Conc_Items: M), como en las migraciones 12 y 14.
-- =====================================================================
alter table public.val_productos add column if not exists reempaque numeric;
alter table public.conc_items add column if not exists reempaque numeric;

do $$
declare
  f text; d text;
  cambios constant text[][] := array[
    array['coalesce(to_char(final_en at time zone tz, ''YYYY-MM-DD HH24:MI:SS''), '''')) order by orden)',
          'coalesce(to_char(final_en at time zone tz, ''YYYY-MM-DD HH24:MI:SS''), ''''), coalesce(to_jsonb(reempaque), ''""'')) order by orden)'],
    array['coalesce(to_char(p.final_en at time zone tz, ''YYYY-MM-DD HH24:MI:SS''), '''')) order by p.turno_id, p.orden)',
          'coalesce(to_char(p.final_en at time zone tz, ''YYYY-MM-DD HH24:MI:SS''), ''''), coalesce(to_jsonb(p.reempaque), ''""'')) order by p.turno_id, p.orden)'],
    array['coalesce(origen, ''''), coalesce(nota, '''')) order by conc_id, sku)',
          'coalesce(origen, ''''), coalesce(nota, ''''), coalesce(to_jsonb(reempaque), ''""'')) order by conc_id, sku)']];
begin
  foreach f in array array['_datos_turnos', 'sb_turnos_hojas'] loop
    select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = f and p.pronamespace = 'public'::regnamespace;
    for k in 1 .. array_length(cambios, 1) loop
      if position(cambios[k][2] in d) > 0 then continue; end if;
      if (length(d) - length(replace(d, cambios[k][1], ''))) / length(cambios[k][1]) <> 1 then raise exception 'No se encontró la fila % en %', k, f; end if;
      d := replace(d, cambios[k][1], cambios[k][2]);
    end loop;
    execute d;
  end loop;
end $$;

-- =====================================================================
-- FRECS! · Validación: reconteo al entregar el turno
-- ---------------------------------------------------------------------
--   · val_productos.final: lo que se contó del producto al entregar el turno (cajas);
--     vacío = todavía sin recontar. Se compara con lo que debería quedar (inicial − validado).
--   · val_productos.final_en: cuándo se hizo ese reconteo.
--   · _datos_turnos y sb_turnos_hojas devuelven las 2 columnas al final de cada fila
--     (Val_Productos: L–M · Val_Hist_Productos: M–N), igual que en la migración 12.
-- =====================================================================

alter table public.val_productos add column if not exists final numeric;
alter table public.val_productos add column if not exists final_en timestamptz;

do $$
declare
  f text; d text;
  cambios constant text[][] := array[
    array['coalesce(to_jsonb(ka), ''""''), por_confirmar) order by orden)',
          'coalesce(to_jsonb(ka), ''""''), por_confirmar, coalesce(to_jsonb(final), ''""''), coalesce(to_char(final_en at time zone tz, ''YYYY-MM-DD HH24:MI:SS''), '''')) order by orden)'],
    array['coalesce(to_jsonb(p.ka), ''""''), p.por_confirmar) order by p.turno_id, p.orden)',
          'coalesce(to_jsonb(p.ka), ''""''), p.por_confirmar, coalesce(to_jsonb(p.final), ''""''), coalesce(to_char(p.final_en at time zone tz, ''YYYY-MM-DD HH24:MI:SS''), '''')) order by p.turno_id, p.orden)']];
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

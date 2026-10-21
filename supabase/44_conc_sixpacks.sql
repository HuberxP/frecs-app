-- =====================================================================
-- FRECS! · 44 · Conciliación: sixpacks sueltos por área (Bodega, KA y PK), que SÍ se suman al total
-- ---------------------------------------------------------------------
--   · conc_items.sixp_bodega / sixp_ka / sixp_pk: cajas de sixpacks sueltos contadas en cada área,
--     aparte de lo original y del reempaque. Total = original + reempaque + sixpacks sueltos.
--   · _datos_turnos y sb_turnos_hojas los devuelven al final de cada fila de Conc_Items (Q, R, S).
--   · El resumen del historial («✗ con facturación de más») cuenta también reempaque y sixpacks
--     (antes solo sumaba Bodega + KA + PK).
-- =====================================================================
alter table public.conc_items add column if not exists sixp_bodega numeric;
alter table public.conc_items add column if not exists sixp_ka numeric;
alter table public.conc_items add column if not exists sixp_pk numeric;

do $$
declare
  f text; d text;
  a constant text := 'coalesce(to_jsonb(reemp_pk), ''""'')) order by conc_id, sku)';
  b constant text := 'coalesce(to_jsonb(reemp_pk), ''""''), coalesce(to_jsonb(sixp_bodega), ''""''), coalesce(to_jsonb(sixp_ka), ''""''), coalesce(to_jsonb(sixp_pk), ''""'')) order by conc_id, sku)';
  ra constant text := 'and coalesce(i.bodega, 0) + coalesce(i.ka, 0) + coalesce(i.pk, 0) < i.facturacion';
  rb constant text := 'and coalesce(i.bodega, 0) + coalesce(i.ka, 0) + coalesce(i.pk, 0) + coalesce(i.reemp_bodega, 0) + coalesce(i.reemp_ka, 0) + coalesce(i.reemp_pk, 0) + coalesce(i.sixp_bodega, 0) + coalesce(i.sixp_ka, 0) + coalesce(i.sixp_pk, 0) < i.facturacion';
begin
  foreach f in array array['_datos_turnos', 'sb_turnos_hojas'] loop
    select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = f and p.pronamespace = 'public'::regnamespace;
    if position(b in d) = 0 then
      if (length(d) - length(replace(d, a, ''))) / length(a) <> 1 then raise exception 'No se encontró la fila de Conc_Items en %', f; end if;
      d := replace(d, a, b);
    end if;
    if f = '_datos_turnos' and position(rb in d) = 0 then
      if (length(d) - length(replace(d, ra, ''))) / length(ra) <> 1 then raise exception 'No se encontró el resumen de conciliaciones en %', f; end if;
      d := replace(d, ra, rb);
    end if;
    execute d;
  end loop;
end $$;

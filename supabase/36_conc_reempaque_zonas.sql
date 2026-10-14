-- =====================================================================
-- FRECS! · 36 · Conciliación: reempaque por área (Bodega, KA y PK), que SÍ se suma al total
-- ---------------------------------------------------------------------
--   · conc_items.reemp_bodega / reemp_ka / reemp_pk: cajas de reempaque contadas en cada área,
--     aparte de lo original. Total = Bodega + KA + PK + los tres reempaques.
--   · conc_items.reempaque queda con la suma de los tres (para PDF, bot y entrega).
--   · _datos_turnos y sb_turnos_hojas los devuelven al final de cada fila de Conc_Items (N, O, P).
-- =====================================================================
alter table public.conc_items add column if not exists reemp_bodega numeric;
alter table public.conc_items add column if not exists reemp_ka numeric;
alter table public.conc_items add column if not exists reemp_pk numeric;

do $$
declare
  f text; d text;
  a constant text := 'coalesce(nota, ''''), coalesce(to_jsonb(reempaque), ''""'')) order by conc_id, sku)';
  b constant text := 'coalesce(nota, ''''), coalesce(to_jsonb(reempaque), ''""''), coalesce(to_jsonb(reemp_bodega), ''""''), coalesce(to_jsonb(reemp_ka), ''""''), coalesce(to_jsonb(reemp_pk), ''""'')) order by conc_id, sku)';
begin
  foreach f in array array['_datos_turnos', 'sb_turnos_hojas'] loop
    select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = f and p.pronamespace = 'public'::regnamespace;
    if position(b in d) > 0 then continue; end if;
    if (length(d) - length(replace(d, a, ''))) / length(a) <> 1 then raise exception 'No se encontró la fila de Conc_Items en %', f; end if;
    execute replace(d, a, b);
  end loop;
end $$;

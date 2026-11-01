-- =====================================================================
-- FRECS! · 46 · Factor cajas de cada producto (hoja Sku)
-- ---------------------------------------------------------------------
-- Unidades por caja o bandeja (X6 sixpack, X24, X30…). La página y el bot lo reciben al final
-- de cada fila de Sku (después de Revisado).
-- =====================================================================
alter table public.sku add column if not exists factor_cajas numeric;

do $$
declare
  f record; d text; n int := 0;
  a constant text := $q$coalesce(empaque, ''), coalesce(revisado, ''))$q$;
  b constant text := $q$coalesce(empaque, ''), coalesce(revisado, ''), coalesce(factor_cajas::text, ''))$q$;
begin
  for f in select p.oid from pg_proc p join pg_namespace s on s.oid = p.pronamespace
           where s.nspname = 'public' and p.prokind = 'f' and position(a in p.prosrc) > 0 loop
    d := pg_get_functiondef(f.oid);
    execute replace(d, a, b);
    n := n + 1;
  end loop;
  raise notice 'sku: % funciones actualizadas', n;
end $$;

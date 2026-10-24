-- =====================================================================
-- FRECS! · 45 · ✓ Revisado en cada producto (hoja Sku)
-- ---------------------------------------------------------------------
-- Quien actualiza toda la información de un producto lo marca como revisado: queda
-- «Nombre · fecha» (vacío = sin revisar). La página y el bot lo reciben al final de
-- cada fila de Sku (después de Empaque).
-- =====================================================================
alter table public.sku add column if not exists revisado text;

do $$
declare
  f record; d text; n int := 0;
  a constant text := $q$coalesce(vida_util::text, ''), coalesce(empaque, ''))$q$;
  b constant text := $q$coalesce(vida_util::text, ''), coalesce(empaque, ''), coalesce(revisado, ''))$q$;
begin
  for f in select p.oid from pg_proc p join pg_namespace s on s.oid = p.pronamespace
           where s.nspname = 'public' and p.prokind = 'f' and position(a in p.prosrc) > 0 loop
    d := pg_get_functiondef(f.oid);
    execute replace(d, a, b);
    n := n + 1;
  end loop;
  raise notice 'sku: % funciones actualizadas', n;
end $$;

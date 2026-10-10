-- =====================================================================
-- FRECS! · 21 · Vida útil de cada producto (hoja Sku)
-- ---------------------------------------------------------------------
-- Días que dura el producto desde su producción hasta el vencimiento. Con eso la
-- calculadora de envasado da la fecha de producción y la fecha límite de cada canal.
-- La página y el bot la reciben al final de cada fila de Sku.
-- =====================================================================
alter table public.sku add column if not exists vida_util numeric;

do $$
declare
  f record; d text; n int := 0;
  a constant text := $q$coalesce(estibas_por_cara::text, ''))$q$;
  b constant text := $q$coalesce(estibas_por_cara::text, ''), coalesce(vida_util::text, ''))$q$;
begin
  for f in select p.oid from pg_proc p join pg_namespace s on s.oid = p.pronamespace
           where s.nspname = 'public' and p.prokind = 'f' and position(a in p.prosrc) > 0 loop
    d := pg_get_functiondef(f.oid);
    execute replace(d, a, b);
    n := n + 1;
  end loop;
  raise notice 'sku: % funciones actualizadas', n;
end $$;

-- =====================================================================
-- FRECS! · 20 · Limbo con SKU (si ya se sabe) y cantidades; se puede corregir
-- ---------------------------------------------------------------------
-- Columnas nuevas (vacías en lo que ya estaba). La página y el bot las reciben al final
-- de cada fila del limbo: [id, producto, vence, presentación, cubicaje, reportado, sku, estibas, cajas, unidades].
-- =====================================================================
alter table public.limbo add column if not exists sku text;
alter table public.limbo add column if not exists estibas numeric;
alter table public.limbo add column if not exists cajas numeric;
alter table public.limbo add column if not exists unidades numeric;

do $$
declare
  f record; d text; n int := 0;
  a constant text := $q$coalesce(fecha_reporte, '')) order by id) from limbo)$q$;
  b constant text := $q$coalesce(fecha_reporte, ''), coalesce(sku, ''), estibas, cajas, unidades) order by id) from limbo)$q$;
begin
  for f in select p.oid from pg_proc p join pg_namespace s on s.oid = p.pronamespace
           where s.nspname = 'public' and p.prokind = 'f' and position(a in p.prosrc) > 0 loop
    d := pg_get_functiondef(f.oid);
    execute replace(d, a, b);
    n := n + 1;
  end loop;
  raise notice 'limbo: % funciones actualizadas', n;
end $$;

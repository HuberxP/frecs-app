-- =====================================================================
-- FRECS! · 38 · Empaque de cada producto (hoja Sku)
-- ---------------------------------------------------------------------
-- En qué se cuenta la estiba («Cant x Estibas»): Sixpacks, Fourpacks, Cajas, Bandejas o Barriles.
-- La voz lo usa para decir «su estibado es 180 sixpacks por estiba» y la app para nombrar las cajas.
-- Arranca lleno con la regla del nombre (X6 → Sixpacks · X4 → Fourpacks · barril → Barriles ·
-- Pony → Bandejas · el resto → Cajas); el administrador lo corrige en «Productos (Sku)».
-- La página y el bot lo reciben al final de cada fila de Sku (después de Vida_util).
-- =====================================================================
alter table public.sku add column if not exists empaque text;

-- Unidades del paquete: el último «x<número>» del nombre («… X30» → 30, «30Lx1» → 1)
update public.sku s set empaque = case
    when q.u = 6 then 'Sixpacks'
    when q.u = 4 then 'Fourpacks'
    when coalesce(s.presentacion, '') ~* 'barril' or s.producto ~* '\m(brr|brrl|barril)\M' or q.u = 1 then 'Barriles'
    when s.producto ~* '\mpony\M' then 'Bandejas'
    else 'Cajas' end
  from (select x.sku, (select (t.m[1])::int from regexp_matches(x.producto, 'x\s*(\d{1,3})(?!\d)', 'gi') with ordinality as t(m, k)
                       order by t.k desc limit 1) as u from public.sku x) q
 where s.sku = q.sku and coalesce(btrim(s.empaque), '') = '';

do $$
declare
  f record; d text; n int := 0;
  a constant text := $q$coalesce(vida_util::text, ''))$q$;
  b constant text := $q$coalesce(vida_util::text, ''), coalesce(empaque, ''))$q$;
begin
  for f in select p.oid from pg_proc p join pg_namespace s on s.oid = p.pronamespace
           where s.nspname = 'public' and p.prokind = 'f' and position(a in p.prosrc) > 0 loop
    d := pg_get_functiondef(f.oid);
    execute replace(d, a, b);
    n := n + 1;
  end loop;
  raise notice 'sku: % funciones actualizadas', n;
end $$;

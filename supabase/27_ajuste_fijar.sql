-- =====================================================================
-- FRECS! · 27 · Corregir la cantidad de un producto en un módulo (sin WMS)
-- ---------------------------------------------------------------------
-- Solo el rotador (validador) o el administrador: «en este módulo hay N estibas / cajas».
-- Si es menos de lo que hay, se descuenta (primero el lote que vence antes); si es más, se suma
-- al lote que vence primero. Queda como ajuste (tipo SACAR con fijar_a = la cantidad final; cant =
-- lo que se quitó, negativa si se sumó) y se deshace igual que los demás.
-- =====================================================================
alter table public.ajustes_sin_wms add column if not exists fijar_a numeric;

-- [id, tipo, módulo, sku, producto, cant, unidad, vence, reemplazo, por, en, fijar_a]
create or replace function public._ajustes_json() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_agg(jsonb_build_array(a.id::text, a.tipo, a.modulo, a.sku, coalesce(a.producto, ''), a.cant, a.unidad,
      coalesce(to_char(a.vence, 'YYYY-MM-DD'), ''), a.reemplazo, a.por, to_char(a.en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'), a.fijar_a)
      order by a.en desc, a.id desc)
    from ajustes_sin_wms a
    where a.deshecho_en is null and a.sync_base is not distinct from (select ultima_sync from sync_estado where id = 1)), '[]'::jsonb)
$$;

-- p_item = { modulo, sku, cant, unidad: 'est' | 'cj' }   (cant = lo que hay ahora en el módulo)
create or replace function public.ajuste_fijar(p_token text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'validador');
  m text := upper(btrim(coalesce(p_item->>'modulo', '')));
  s text := btrim(coalesce(p_item->>'sku', ''));
  un text := coalesce(p_item->>'unidad', 'est');
  q numeric; hay numeric := 0; dif numeric; f record; g public.wms_base%rowtype; cpe numeric; prod text;
  nc numeric; ne numeric; nu numeric; antes jsonb := '[]'::jsonb; l jsonb; idn bigint;
begin
  if un not in ('est', 'cj') then raise exception 'Escoge estibas o cajas.'; end if;
  if coalesce(p_item->>'cant', '') !~ '^[0-9]+([.,][0-9]+)?$' then raise exception 'Escribe la cantidad con números.'; end if;
  q := replace(p_item->>'cant', ',', '.')::numeric;
  for f in select * from wms_base where modulo = m and sku = s and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0) loop
    cpe := coalesce(nullif(f.cajas_por_estiba, 0), 1);
    hay := hay + case when un = 'cj' then coalesce(f.cajas, 0) when cpe > 1 and coalesce(f.cajas, 0) > 0 then f.cajas / cpe else coalesce(f.estibas, 0) end;
    prod := coalesce(prod, f.producto);
  end loop;
  if prod is null then raise exception 'En % no hay producto % según la última sincronización. Usa «Guardé producto».', m, s; end if;
  dif := hay - q;
  if abs(dif) < 0.0001 then raise exception 'Ya tiene esa cantidad.'; end if;
  if dif > 0 then
    -- Menos que antes: se descuenta como «Saqué» y se anota la cantidad final
    l := ajuste_sacar(p_token, jsonb_build_object('modulo', m, 'sku', s, 'cant', dif::text, 'unidad', un));
    select id into idn from ajustes_sin_wms where modulo = m and sku = s and por = u.nombre and deshecho_en is null order by id desc limit 1;
    update ajustes_sin_wms set fijar_a = q where id = idn;
    return _ajustes_json();
  end if;
  -- Más que antes: se suma al lote que vence primero
  select * into g from wms_base where modulo = m and sku = s and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0) order by vence nulls last, id limit 1;
  cpe := coalesce(nullif(g.cajas_por_estiba, 0), 1);
  if cpe > 1 then
    nc := coalesce(g.cajas, 0) + case when un = 'cj' then -dif else -dif * cpe end;
    ne := floor(nc / cpe + 0.0001);
  elsif un = 'est' then
    ne := coalesce(g.estibas, 0) - dif;
    nc := case when coalesce(g.estibas, 0) > 0 then round(coalesce(g.cajas, 0) * ne / g.estibas) else coalesce(g.cajas, 0) end;
  else
    nc := coalesce(g.cajas, 0) - dif;
    ne := coalesce(g.estibas, 0);
  end if;
  nu := case when coalesce(g.cajas, 0) > 0 then round(coalesce(g.unidades, 0) * nc / g.cajas) else coalesce(g.unidades, 0) end;
  antes := jsonb_build_array(jsonb_build_object('id', g.id, 'e', coalesce(g.estibas, 0) - ne, 'c', coalesce(g.cajas, 0) - nc, 'u', coalesce(g.unidades, 0) - nu));
  update wms_base set estibas = ne, cajas = nc, unidades = nu where id = g.id;
  insert into ajustes_sin_wms (tipo, modulo, sku, producto, cant, unidad, antes, por, sync_base, fijar_a)
  values ('SACAR', m, s, prod, dif, un, antes, u.nombre, (select ultima_sync from sync_estado where id = 1), q);
  return _ajustes_json();
end $$;
grant execute on function public.ajuste_fijar(text, jsonb) to anon, authenticated, service_role;

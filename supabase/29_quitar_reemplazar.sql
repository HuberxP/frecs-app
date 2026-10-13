-- =====================================================================
-- FRECS! · 29 · Quitar un producto de un módulo y reemplazar: solo rotador o administrador
-- ---------------------------------------------------------------------
--   · «🗑️ Quitar» = corregir la cantidad a 0: todas las filas de ese producto en el módulo quedan en 0
--     (exacto, sin redondeos). Solo rotador / administrador (ajuste_fijar ya lo exige).
--   · «Guardé producto» con «reemplaza lo que había» quita lo demás del módulo: solo rotador / administrador.
--     Añadir otro producto al mismo módulo (sin reemplazar) lo sigue haciendo cualquiera que ajuste.
-- =====================================================================
create or replace function public.ajuste_poner(p_token text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'verificador');
  m text := upper(btrim(coalesce(p_item->>'modulo', '')));
  s text := btrim(coalesce(p_item->>'sku', ''));
  un text := coalesce(p_item->>'unidad', 'est');
  reemp boolean := coalesce((p_item->>'reemplazar')::boolean, false);
  q numeric; v date; cpe numeric; upc numeric; ne numeric; nc numeric; prod text; fam text;
  ref public.wms_base%rowtype; antes jsonb := '[]'::jsonb; nueva bigint;
begin
  perform _ajuste_permiso(u);
  if reemp and _nivel(u.rol) < 2 then raise exception 'PERMISO: Solo el rotador o el administrador reemplazan (quitan) lo que había en el módulo.'; end if;
  if m = '' or length(m) > 30 then raise exception 'Escribe el módulo.'; end if;
  if s !~ '^[0-9]{1,20}$' then raise exception 'Escoge el producto.'; end if;
  if un not in ('est', 'cj') then raise exception 'Escoge estibas o cajas.'; end if;
  if coalesce(p_item->>'cant', '') !~ '^[0-9]+([.,][0-9]+)?$' then raise exception 'Escribe la cantidad con números.'; end if;
  q := replace(p_item->>'cant', ',', '.')::numeric;
  if q <= 0 then raise exception 'La cantidad debe ser mayor que 0.'; end if;
  if coalesce(p_item->>'vence', '') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Escribe la fecha de vencimiento.'; end if;
  v := (p_item->>'vence')::date;
  -- Datos del producto: de la hoja Sku y de cualquier lote suyo en el WMS (cajas por estiba, unidades por caja, familia)
  select * into ref from wms_base where sku = s order by (coalesce(cajas, 0) > 0) desc, id desc limit 1;
  select coalesce(nullif(btrim(producto), ''), ref.producto), case when btrim(coalesce(cant_x_estiba, '')) ~ '^[0-9]+([.][0-9]+)?$' then btrim(cant_x_estiba)::numeric end
    into prod, cpe from sku where sku.sku = s limit 1;
  prod := coalesce(prod, ref.producto, nullif(p_item->>'producto', ''));
  if prod is null then raise exception 'El producto % no está en la hoja Sku ni en el WMS.', s; end if;
  cpe := coalesce(nullif(cpe, 0), nullif(ref.cajas_por_estiba, 0), 1);
  upc := case when coalesce(ref.cajas, 0) > 0 then ref.unidades / ref.cajas else 0 end;
  fam := ref.familia;
  if un = 'est' then ne := q; nc := q * cpe; else nc := q; ne := floor(q / cpe + 0.0001); end if;
  -- Reemplazo: lo que había en el módulo queda en 0 (se guarda para devolverlo)
  if reemp then
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'e', coalesce(estibas, 0), 'c', coalesce(cajas, 0), 'u', coalesce(unidades, 0))), '[]'::jsonb) into antes
      from wms_base where modulo = m and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0 or coalesce(unidades, 0) > 0);
    update wms_base set estibas = 0, cajas = 0, unidades = 0
     where modulo = m and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0 or coalesce(unidades, 0) > 0);
  end if;
  insert into wms_base (sku, producto, modulo, estibas, cajas, unidades, vence, dias, estado, candado, carga, familia, cajas_por_estiba, obs, picking, actualizacion)
  values (s, prod, m, ne, nc, round(nc * upc), v, (v - (now() at time zone 'America/Bogota')::date), 'DISPONIBLE', '', now(), fam, cpe,
          'Anotado a mano sin WMS por ' || u.nombre, false, now())
  returning id into nueva;
  insert into wms_modulos (modulo, nombre_wms, seccion, con_producto, skus, lotes)
  values (m, m, regexp_replace(m, '[0-9]+$', ''), true, 1, 1) on conflict (modulo) do nothing;
  insert into ajustes_sin_wms (tipo, modulo, sku, producto, cant, unidad, vence, reemplazo, antes, fila_nueva, por, sync_base)
  values ('PONER', m, s, prod, q, un, v, reemp, antes, nueva, u.nombre, (select ultima_sync from sync_estado where id = 1));
  return _ajustes_json();
end $$;

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
  -- Quitar el producto del módulo (a 0): todas sus filas en 0, exacto
  if q = 0 then
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'e', coalesce(estibas, 0), 'c', coalesce(cajas, 0), 'u', coalesce(unidades, 0))), '[]'::jsonb) into antes
      from wms_base where modulo = m and sku = s and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0 or coalesce(unidades, 0) > 0);
    update wms_base set estibas = 0, cajas = 0, unidades = 0
     where modulo = m and sku = s and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0 or coalesce(unidades, 0) > 0);
    insert into ajustes_sin_wms (tipo, modulo, sku, producto, cant, unidad, antes, por, sync_base, fijar_a)
    values ('SACAR', m, s, prod, hay, un, antes, u.nombre, (select ultima_sync from sync_estado where id = 1), 0);
    return _ajustes_json();
  end if;
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

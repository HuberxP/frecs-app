-- =====================================================================
-- FRECS! · 26 · Ajustes a mano mientras el WMS está caído
-- ---------------------------------------------------------------------
-- Con el WMS caído se trabaja con la última sincronización. Para que lo que se ve sea lo real:
--   · SACAR: «saqué N estibas / cajas de este producto en este módulo» → se descuenta en wms_base
--     (primero el lote que vence antes).
--   · PONER: «guardé este producto en este módulo» (vencimiento y cantidad) → fila nueva en wms_base.
--     Con «reemplaza» lo que había en el módulo queda en 0 (el módulo quedó solo con lo nuevo).
-- Cada ajuste guarda cómo estaban las filas antes, quién y cuándo: se puede deshacer mientras no se
-- haya sincronizado. Al sincronizar, wms_base se reemplaza con lo del WMS y los ajustes dejan de contar
-- (quedan en la tabla como historial). Lo hacen verificador, OPM, rotador y administrador (no el lector).
-- Nada se borra: las filas quedan en 0 (sin producto físico), así el deshacer las devuelve.
-- =====================================================================
create table if not exists public.ajustes_sin_wms (
  id            bigint generated always as identity primary key,
  tipo          text not null check (tipo in ('SACAR', 'PONER')),
  modulo        text not null,
  sku           text not null,
  producto      text,
  cant          numeric not null,
  unidad        text not null check (unidad in ('est', 'cj')),
  vence         date,
  reemplazo     boolean not null default false,
  antes         jsonb not null default '[]'::jsonb,   -- [{id, e, c, u}] lo que se le quitó a cada fila (deshacer lo devuelve)
  fila_nueva    bigint,                               -- PONER: la fila agregada a wms_base
  por           text not null,
  en            timestamptz not null default now(),
  sync_base     timestamptz,                          -- la sincronización sobre la que se hizo
  deshecho_por  text,
  deshecho_en   timestamptz
);
alter table public.ajustes_sin_wms enable row level security;
create index if not exists ajustes_sin_wms_base on public.ajustes_sin_wms (sync_base) where deshecho_en is null;

create or replace function public._ajuste_permiso(u public.perfiles) returns void
language plpgsql stable as $$
begin
  if u.rol not in ('verificador', 'opm', 'validador', 'administrador') then
    raise exception 'PERMISO: Los ajustes sin WMS los hacen el verificador, el OPM, el rotador o el administrador.';
  end if;
end $$;

-- Los que cuentan: hechos sobre la sincronización actual y sin deshacer
-- [id, tipo, módulo, sku, producto, cant, unidad, vence, reemplazo, por, en]
create or replace function public._ajustes_json() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_agg(jsonb_build_array(a.id::text, a.tipo, a.modulo, a.sku, coalesce(a.producto, ''), a.cant, a.unidad,
      coalesce(to_char(a.vence, 'YYYY-MM-DD'), ''), a.reemplazo, a.por, to_char(a.en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'))
      order by a.en desc, a.id desc)
    from ajustes_sin_wms a
    where a.deshecho_en is null and a.sync_base is not distinct from (select ultima_sync from sync_estado where id = 1)), '[]'::jsonb)
$$;

-- Quitar cantidad de un producto en un módulo. p_item = { modulo, sku, cant, unidad: 'est' | 'cj' }
create or replace function public.ajuste_sacar(p_token text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'verificador');
  m text := upper(btrim(coalesce(p_item->>'modulo', '')));
  s text := btrim(coalesce(p_item->>'sku', ''));
  un text := coalesce(p_item->>'unidad', 'est');
  q numeric; r numeric; disp numeric := 0; f record;
  cpe numeric; tomar numeric; nc numeric; ne numeric; nu numeric; prod text;
  antes jsonb := '[]'::jsonb;
begin
  perform _ajuste_permiso(u);
  if un not in ('est', 'cj') then raise exception 'Escoge estibas o cajas.'; end if;
  if coalesce(p_item->>'cant', '') !~ '^[0-9]+([.,][0-9]+)?$' then raise exception 'Escribe la cantidad con números.'; end if;
  q := replace(p_item->>'cant', ',', '.')::numeric;
  if q <= 0 then raise exception 'La cantidad debe ser mayor que 0.'; end if;
  -- Lo que hay (en la unidad escogida)
  for f in select * from wms_base where modulo = m and sku = s and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0) loop
    cpe := coalesce(nullif(f.cajas_por_estiba, 0), 1);
    disp := disp + case when un = 'cj' then coalesce(f.cajas, 0) when cpe > 1 and coalesce(f.cajas, 0) > 0 then f.cajas / cpe else coalesce(f.estibas, 0) end;
    prod := coalesce(prod, f.producto);
  end loop;
  if disp = 0 then raise exception 'En % no hay producto % según la última sincronización.', m, s; end if;
  if q > disp + 0.0001 then raise exception 'En % solo hay % % de %.', m, round(disp, 1), case when un = 'cj' then 'cajas' else 'estibas' end, s; end if;
  r := q;
  -- Primero el lote que vence antes
  for f in select * from wms_base where modulo = m and sku = s and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0)
           order by vence nulls last, id loop
    exit when r <= 0.0001;
    cpe := coalesce(nullif(f.cajas_por_estiba, 0), 1);
    if cpe > 1 and coalesce(f.cajas, 0) > 0 then
      tomar := least(case when un = 'cj' then r else r * cpe end, f.cajas);
      nc := f.cajas - tomar;
      ne := floor(nc / cpe + 0.0001);
      r := r - case when un = 'cj' then tomar else tomar / cpe end;
    elsif un = 'est' then
      tomar := least(r, coalesce(f.estibas, 0));
      ne := f.estibas - tomar;
      nc := case when coalesce(f.estibas, 0) > 0 then round(coalesce(f.cajas, 0) * ne / f.estibas) else 0 end;
      r := r - tomar;
    else
      tomar := least(r, coalesce(f.cajas, 0));
      nc := f.cajas - tomar;
      ne := case when coalesce(f.cajas, 0) > 0 then round(coalesce(f.estibas, 0) * nc / f.cajas) else 0 end;
      r := r - tomar;
    end if;
    nu := case when coalesce(f.cajas, 0) > 0 then round(coalesce(f.unidades, 0) * nc / f.cajas) when coalesce(f.estibas, 0) > 0 then round(coalesce(f.unidades, 0) * ne / f.estibas) else 0 end;
    ne := greatest(ne, 0); nc := greatest(nc, 0); nu := greatest(nu, 0);
    antes := antes || jsonb_build_array(jsonb_build_object('id', f.id, 'e', coalesce(f.estibas, 0) - ne, 'c', coalesce(f.cajas, 0) - nc, 'u', coalesce(f.unidades, 0) - nu));
    update wms_base set estibas = ne, cajas = nc, unidades = nu where id = f.id;
  end loop;
  insert into ajustes_sin_wms (tipo, modulo, sku, producto, cant, unidad, antes, por, sync_base)
  values ('SACAR', m, s, prod, q, un, antes, u.nombre, (select ultima_sync from sync_estado where id = 1));
  return _ajustes_json();
end $$;

-- Guardar un producto en un módulo. p_item = { modulo, sku, cant, unidad, vence: 'YYYY-MM-DD', reemplazar: true|false }
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

-- Deshacer (quien lo hizo, el rotador o el administrador), solo si no se ha sincronizado desde entonces
create or replace function public.ajuste_deshacer(p_token text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'verificador'); a public.ajustes_sin_wms; x jsonb;
begin
  perform _ajuste_permiso(u);
  select * into a from ajustes_sin_wms where id = p_id;
  if not found or a.deshecho_en is not null then raise exception 'Ese ajuste ya no está.'; end if;
  if a.sync_base is distinct from (select ultima_sync from sync_estado where id = 1) then
    raise exception 'Ya se sincronizó después de ese ajuste: ahora manda lo del WMS.';
  end if;
  if _nivel(u.rol) < 2 and lower(btrim(a.por)) <> lower(btrim(u.nombre)) then
    raise exception 'PERMISO: Solo quien lo anotó, un rotador o el administrador lo deshace.';
  end if;
  for x in select * from jsonb_array_elements(a.antes) loop
    -- Se devuelve lo que se quitó (sumándolo: no se pisan otros ajustes hechos después)
    update wms_base set estibas = coalesce(estibas, 0) + (x->>'e')::numeric, cajas = coalesce(cajas, 0) + (x->>'c')::numeric,
           unidades = coalesce(unidades, 0) + (x->>'u')::numeric where id = (x->>'id')::bigint;
  end loop;
  if a.fila_nueva is not null then update wms_base set estibas = 0, cajas = 0, unidades = 0 where id = a.fila_nueva; end if;
  update ajustes_sin_wms set deshecho_por = u.nombre, deshecho_en = now() where id = a.id;
  return _ajustes_json();
end $$;

create or replace function public.ajustes_listar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector');
begin
  return _ajustes_json();
end $$;

grant execute on function public.ajuste_sacar(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.ajuste_poner(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.ajuste_deshacer(text, bigint) to anon, authenticated, service_role;
grant execute on function public.ajustes_listar(text) to anon, authenticated, service_role;

-- La página los recibe con sus datos
do $$
declare
  d text; n int;
  a constant text := $q$'marcas', _marcas_json()$q$;
  b constant text := $q$'marcas', _marcas_json(), 'ajustes', _ajustes_json()$q$;
begin
  select pg_get_functiondef('public.datos_consulta(text, jsonb)'::regprocedure) into d;
  if position(b in d) = 0 then
    n := (length(d) - length(replace(d, a, ''))) / length(a);
    if n <> 1 then raise exception 'datos_consulta: marcas encontrado % veces', n; end if;
    execute replace(d, a, b);
  end if;
end $$;

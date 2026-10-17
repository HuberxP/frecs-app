-- =====================================================================
-- FRECS! · 40 · Reportes de vacío y conflicto que se resuelven solos al sincronizar
-- ---------------------------------------------------------------------
-- Al reportar se guarda qué tenía el módulo en el WMS: cada producto con su fecha de creación
-- (carga). Después de cada sincronización hecha DESPUÉS del reporte se compara:
--   · sigue el mismo producto con la misma fecha de creación → sigue pendiente;
--   · el mismo producto con otra fecha de creación → solucionado;
--   · otro producto distinto → solucionado;
--   · el módulo en blanco → solucionado.
-- Los reportes viejos (sin esa foto) siguen con la regla de antes.
-- =====================================================================
alter table public.reportes_modulo add column if not exists lotes jsonb;

-- Lo que tiene el módulo ahora en el WMS: [{ sku, carga }] (carga = fecha de creación; sin ella, el vencimiento)
create or replace function public._reporte_lotes(p_modulo text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(distinct jsonb_build_object('sku', w.sku, 'carga', coalesce(w.carga::text, 'v:' || coalesce(w.vence::text, '')))), '[]'::jsonb)
    from wms_base w
   where w.modulo = upper(btrim(p_modulo)) and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0)
$$;

-- Cierre automático: solo con una sincronización hecha DESPUÉS del reporte
create or replace function public._reportes_auto() returns void
language plpgsql security definer set search_path = public as $$
declare s timestamptz := (select ultima_sync from sync_estado where id = 1);
begin
  if s is null then return; end if;
  -- Con foto de lo que había: pendiente solo si sigue algún lote igual (mismo producto y misma fecha de creación)
  update reportes_modulo r set estado = 'COMPLETADO', cierre = 'WMS', completado_por = 'WMS', completado_en = s
   where r.estado = 'PENDIENTE' and r.reportado_en < s and r.lotes is not null and jsonb_array_length(r.lotes) > 0
     and not exists (select 1 from jsonb_array_elements(_reporte_lotes(r.modulo)) a
                      where exists (select 1 from jsonb_array_elements(r.lotes) b where b->>'sku' = a->>'sku' and b->>'carga' = a->>'carga'));
  -- Sin foto (o el módulo estaba en blanco al reportar): la regla de antes
  update reportes_modulo r set estado = 'COMPLETADO', cierre = 'WMS', completado_por = 'WMS', completado_en = s
   where r.estado = 'PENDIENTE' and r.reportado_en < s and r.tipo = 'VACIO' and (r.lotes is null or jsonb_array_length(r.lotes) = 0)
     and not exists (select 1 from wms_base w where w.modulo = r.modulo and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0));
  update reportes_modulo r set estado = 'COMPLETADO', cierre = 'WMS', completado_por = 'WMS', completado_en = s
   where r.estado = 'PENDIENTE' and r.reportado_en < s and r.tipo = 'CONFLICTO' and (r.lotes is null or jsonb_array_length(r.lotes) = 0)
     and exists (select 1 from wms_base w where w.modulo = r.modulo and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0)
                   and (r.lotes is not null or (coalesce(r.sku_encontrado, '') <> '' and w.sku = r.sku_encontrado)));
end $$;

-- Crear: p_items = [{ tipo, modulo, sku_sistema, producto_sistema, detalle_sistema, sku_encontrado, producto_encontrado, nota }]
-- Si el módulo ya tiene un reporte pendiente del mismo tipo no se repite (se devuelve en «repetidos»).
create or replace function public.reporte_crear(p_token text, p_items jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'verificador');
  x jsonb; t text; m text; nuevo bigint;
  creados bigint[] := '{}'; repetidos text[] := '{}';
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'No hay módulos para reportar.'; end if;
  if jsonb_array_length(p_items) > 60 then raise exception 'Son demasiados módulos en un solo reporte.'; end if;
  for x in select * from jsonb_array_elements(p_items) loop
    t := upper(coalesce(x->>'tipo', ''));
    m := upper(btrim(coalesce(x->>'modulo', '')));
    if t not in ('VACIO', 'CONFLICTO') then raise exception 'Tipo de reporte no válido.'; end if;
    if m = '' or length(m) > 30 then raise exception 'Módulo no válido.'; end if;
    if t = 'CONFLICTO' and coalesce(x->>'sku_encontrado', '') = '' then raise exception 'Escoge el producto que encontraste en %.', m; end if;
    if exists (select 1 from reportes_modulo where modulo = m and tipo = t and estado = 'PENDIENTE') then repetidos := repetidos || m; continue; end if;
    insert into reportes_modulo (tipo, modulo, sku_sistema, producto_sistema, detalle_sistema, sku_encontrado, producto_encontrado, nota, reportado_por, lotes)
      values (t, m, left(nullif(x->>'sku_sistema', ''), 60), left(nullif(x->>'producto_sistema', ''), 200), left(nullif(x->>'detalle_sistema', ''), 300),
              left(nullif(x->>'sku_encontrado', ''), 30), left(nullif(x->>'producto_encontrado', ''), 200), left(nullif(btrim(coalesce(x->>'nota', '')), ''), 500), u.nombre,
              _reporte_lotes(m))
      returning id into nuevo;
    creados := creados || nuevo;
  end loop;
  return jsonb_build_object('creados', to_jsonb(creados), 'repetidos', to_jsonb(repetidos), 'reportes', _reportes_json());
end $$;

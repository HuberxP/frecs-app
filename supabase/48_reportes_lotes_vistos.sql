-- =====================================================================
-- FRECS! · 48 · Reportes de vacío / conflicto: la foto es lo que VIO quien reportó
-- ---------------------------------------------------------------------
-- Antes la foto del módulo se tomaba del WMS en el momento de guardar el reporte. Si el WMS ya había
-- cambiado (p. ej. se cargó un lote nuevo minutos antes) pero el aplicativo de quien reporta todavía
-- mostraba lo de antes, la foto quedaba con el lote nuevo y el reporte nunca se cerraba solo.
-- Ahora la página manda los lotes que mostraba (SKU + fecha de creación) y esa es la foto.
-- Si no los manda (página vieja) se usa la foto del WMS como antes.
-- Además las fechas de creación se comparan como fecha y hora (no como texto).
-- =====================================================================

-- ¿Es la misma fecha de creación? (texto igual, o la misma fecha y hora aunque el formato cambie)
create or replace function public._rep_carga_igual(a text, b text) returns boolean
language plpgsql stable as $$
begin
  if a is null or b is null then return false; end if;
  if a = b then return true; end if;
  if a like 'v:%' or b like 'v:%' then return false; end if;
  return a::timestamptz = b::timestamptz;
exception when others then return false;
end $$;

-- Lotes que mostraba la página: [{ sku, carga, v }] → [{ sku, carga }] (sin carga: 'v:' + vencimiento). null si no hay.
create or replace function public._reporte_lotes_vistos(p_lotes jsonb) returns jsonb
language plpgsql stable as $$
declare x jsonb; res jsonb := '[]'::jsonb; s text; c text;
begin
  if p_lotes is null or jsonb_typeof(p_lotes) <> 'array' then return null; end if;
  for x in select value from jsonb_array_elements(p_lotes) limit 40 loop
    s := left(btrim(coalesce(x->>'sku', '')), 30);
    if s = '' then continue; end if;
    c := null;
    begin c := (nullif(btrim(coalesce(x->>'carga', '')), ''))::timestamptz::text; exception when others then c := null; end;
    if c is null then c := 'v:' || coalesce(left(nullif(btrim(coalesce(x->>'v', '')), ''), 10), ''); end if;
    if not res @> jsonb_build_array(jsonb_build_object('sku', s, 'carga', c)) then
      res := res || jsonb_build_array(jsonb_build_object('sku', s, 'carga', c));
    end if;
  end loop;
  if jsonb_array_length(res) = 0 then return null; end if;
  return res;
end $$;

-- Cierre automático: solo con una sincronización hecha DESPUÉS del reporte
create or replace function public._reportes_auto() returns void
language plpgsql security definer set search_path = public as $$
declare s timestamptz := (select ultima_sync from sync_estado where id = 1);
begin
  if s is null then return; end if;
  -- Con foto: pendiente solo si en el WMS sigue algún lote de la foto (mismo producto y misma fecha de creación)
  update reportes_modulo r set estado = 'COMPLETADO', cierre = 'WMS', completado_por = 'WMS', completado_en = s
   where r.estado = 'PENDIENTE' and r.reportado_en < s and r.lotes is not null and jsonb_array_length(r.lotes) > 0
     and not exists (select 1 from jsonb_array_elements(_reporte_lotes(r.modulo)) a
                      where exists (select 1 from jsonb_array_elements(r.lotes) b where b->>'sku' = a->>'sku' and _rep_carga_igual(b->>'carga', a->>'carga')));
  -- Sin foto (o el módulo estaba en blanco al reportar): la regla de antes
  update reportes_modulo r set estado = 'COMPLETADO', cierre = 'WMS', completado_por = 'WMS', completado_en = s
   where r.estado = 'PENDIENTE' and r.reportado_en < s and r.tipo = 'VACIO' and (r.lotes is null or jsonb_array_length(r.lotes) = 0)
     and not exists (select 1 from wms_base w where w.modulo = r.modulo and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0));
  update reportes_modulo r set estado = 'COMPLETADO', cierre = 'WMS', completado_por = 'WMS', completado_en = s
   where r.estado = 'PENDIENTE' and r.reportado_en < s and r.tipo = 'CONFLICTO' and (r.lotes is null or jsonb_array_length(r.lotes) = 0)
     and exists (select 1 from wms_base w where w.modulo = r.modulo and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0)
                   and (r.lotes is not null or (coalesce(r.sku_encontrado, '') <> '' and w.sku = r.sku_encontrado)));
end $$;

-- Crear: p_items = [{ tipo, modulo, sku_sistema, producto_sistema, detalle_sistema, sku_encontrado, producto_encontrado, nota, lotes }]
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
              coalesce(_reporte_lotes_vistos(x->'lotes'), _reporte_lotes(m)))
      returning id into nuevo;
    creados := creados || nuevo;
  end loop;
  return jsonb_build_object('creados', to_jsonb(creados), 'repetidos', to_jsonb(repetidos), 'reportes', _reportes_json());
end $$;

revoke execute on function public._rep_carga_igual(text, text) from public, anon, authenticated;
revoke execute on function public._reporte_lotes_vistos(jsonb) from public, anon, authenticated;

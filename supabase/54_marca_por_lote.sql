-- =====================================================================
-- FRECS! · 54 · Marca de consumo por lote: se marca el producto con su fecha de vencimiento
-- ---------------------------------------------------------------------
-- Antes la marca era por producto y módulo: si en el módulo había varios lotes (fechas) del producto,
-- todos salían marcados. Ahora la marca guarda la fecha del lote que se tocó (vence) y solo ese sale
-- en consumo. Las marcas viejas (sin fecha) siguen valiendo para todo el producto en el módulo.
-- Se cierra sola cuando ese lote ya no está en el módulo según el WMS.
-- (Sigue habiendo una sola marca activa por producto, módulo y canal.)
-- =====================================================================
alter table public.marcas_consumo add column if not exists vence date;

-- Las activas: [id, sku, producto, módulo, canal, forzado, días, mínimo, marcado_por, marcado_en, nota, vence]
create or replace function public._marcas_json() returns jsonb
language plpgsql security definer set search_path = public as $$
declare tz constant text := 'America/Bogota';
begin
  perform _marcas_auto();
  return coalesce((select jsonb_agg(jsonb_build_array(id::text, sku, coalesce(producto, ''), modulo, canal, forzado, dias, minimo, marcado_por,
      to_char(marcado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(nota, ''), coalesce(to_char(vence, 'YYYY-MM-DD'), '')) order by marcado_en desc, id desc)
    from marcas_consumo where quitado_en is null), '[]'::jsonb);
end $$;

create or replace function public._marcas_auto() returns void
language plpgsql security definer set search_path = public as $$
declare s timestamptz := (select ultima_sync from sync_estado where id = 1);
begin
  if s is null then return; end if;
  update marcas_consumo m set quitado_en = s, quitado_por = 'WMS', cierre = 'WMS'
   where m.quitado_en is null and m.marcado_en < s
     and not exists (select 1 from wms_base w where w.modulo = m.modulo and w.sku = m.sku and (m.vence is null or w.vence = m.vence)
                       and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0));
end $$;

-- Marcar: p_item = { sku, producto, modulo, canal, forzado, dias, minimo, nota, vence }
create or replace function public.marca_poner(p_token text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'verificador');
  m text := upper(btrim(coalesce(p_item->>'modulo', '')));
  s text := btrim(coalesce(p_item->>'sku', ''));
  c text := upper(btrim(coalesce(p_item->>'canal', '')));
  v date; ya public.marcas_consumo;
begin
  if not _puede_marcar(u) then raise exception 'PERMISO: Solo el verificador, el rotador o el administrador marcan módulos en consumo.'; end if;
  if c not in ('T1', 'T2', 'KA') then raise exception 'Escoge el canal (T1, T2 o KA).'; end if;
  if m = '' or length(m) > 30 or s !~ '^[0-9]{1,20}$' then raise exception 'Módulo o producto no válido.'; end if;
  begin v := nullif(p_item->>'vence', '')::date; exception when others then v := null; end;
  select * into ya from marcas_consumo where sku = s and modulo = m and canal = c and quitado_en is null limit 1;
  if found then
    if ya.vence is not null and v is not null and ya.vence <> v then
      raise exception 'En % ya está marcado para % el lote que vence el %. Quítalo primero para marcar este.', m, c, to_char(ya.vence, 'DD/MM/YYYY');
    end if;
    raise exception '% ya está marcado en consumo para %.', m, c;
  end if;
  insert into marcas_consumo (sku, producto, modulo, canal, forzado, dias, minimo, marcado_por, nota, vence)
  values (s, left(nullif(p_item->>'producto', ''), 200), m, c, coalesce((p_item->>'forzado')::boolean, false),
          case when coalesce(p_item->>'dias', '') ~ '^-?[0-9]{1,6}$' then (p_item->>'dias')::int end,
          case when coalesce(p_item->>'minimo', '') ~ '^[0-9]{1,6}$' then (p_item->>'minimo')::int end, u.nombre,
          left(nullif(btrim(coalesce(p_item->>'nota', '')), ''), 300), v);
  -- Pony gasto consume de este módulo
  update consumo set modulo_elegido = m, elegido_por = u.nombre, elegido_en = now() where sku = s;
  return _marcas_json();
end $$;

revoke execute on function public._marcas_json() from public, anon, authenticated;
revoke execute on function public._marcas_auto() from public, anon, authenticated;

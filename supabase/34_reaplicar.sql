-- =====================================================================
-- FRECS! · 34 · ♻️ Volver a aplicar lo anotado a mano (después de sincronizar sin querer)
-- ---------------------------------------------------------------------
-- Al sincronizar manda el WMS: lo anotado a mano (correcciones, quitados, productos guardados,
-- bloqueos y ✅ revisados) deja de contar, pero queda guardado. Si el WMS todavía no tiene esos
-- cambios, el rotador o el administrador los vuelve a aplicar sobre los datos nuevos:
--   · Corregir / Quitar → deja el módulo en la misma cantidad final (si ya la tiene, no hace nada).
--     Si el mismo producto del mismo módulo se corrigió varias veces seguidas, solo cuenta la última.
--   · Guardé producto → lo vuelve a guardar (si el WMS ya lo muestra con esa fecha, sale desmarcado).
--   · Saqué (sin corregir) → lo vuelve a descontar.
--   · Bloqueos → se vuelven a bloquear.  · ✅ Está bien → se vuelven a marcar (opcional).
-- Va en el mismo orden en que se anotó y queda con el nombre y la hora de quien lo anotó.
-- Lo que no se escoge queda «descartado» y no vuelve a salir. Nada se borra.
-- =====================================================================
alter table public.ajustes_sin_wms add column if not exists reaplicado text;
alter table public.ajustes_sin_wms add column if not exists reaplicado_en timestamptz;
alter table public.ajustes_sin_wms add column if not exists reaplicado_por text;
alter table public.ajustes_sin_wms add column if not exists origen bigint;
alter table public.bloqueos_sin_wms add column if not exists reaplicado text;
alter table public.bloqueos_sin_wms add column if not exists reaplicado_en timestamptz;
alter table public.bloqueos_sin_wms add column if not exists reaplicado_por text;
alter table public.bloqueos_sin_wms add column if not exists origen bigint;
alter table public.revisiones_modulo add column if not exists reaplicado_en timestamptz;

-- La sincronización anterior que tiene cosas anotadas a mano
create or replace function public._reaplicar_base() returns timestamptz
language sql stable security definer set search_path = public as $$
  with s as (select ultima_sync u from sync_estado where id = 1)
  select max(b) from (
    select max(sync_base) b from ajustes_sin_wms, s where sync_base < s.u
    union all select max(sync_base) from bloqueos_sin_wms, s where sync_base < s.u
    union all select max(sync_base) from revisiones_modulo, s where sync_base < s.u) x
$$;

-- Ajustes pendientes de esa sincronización; «tapado» = una corrección que otra más nueva del mismo
-- producto y módulo reemplaza (sin nada en medio que cambie ese producto ahí)
create or replace function public._reaplicar_ajustes() returns table (id bigint, tapado boolean)
language sql stable security definer set search_path = public as $$
  with p as (
    select a.* from ajustes_sin_wms a
     where a.sync_base = _reaplicar_base() and a.deshecho_en is null and a.reaplicado_en is null)
  select a.id, (a.fijar_a is not null and exists (
      select 1 from p b
       where b.modulo = a.modulo and b.sku = a.sku and b.fijar_a is not null and (b.en, b.id) > (a.en, a.id)
         and not exists (select 1 from p c
                          where c.modulo = a.modulo and (c.sku = a.sku or c.reemplazo) and c.fijar_a is null
                            and (c.en, c.id) > (a.en, a.id) and (c.en, c.id) < (b.en, b.id))))
  from p a
$$;

-- Cuánto hay ahora de un producto en un módulo (en estibas o cajas)
create or replace function public._cant_ahora(p_m text, p_s text, p_un text) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(case when p_un = 'cj' then coalesce(w.cajas, 0)
                           when coalesce(w.cajas_por_estiba, 0) > 1 and coalesce(w.cajas, 0) > 0 then w.cajas / w.cajas_por_estiba
                           else coalesce(w.estibas, 0) end), 0)
    from wms_base w where w.modulo = p_m and w.sku = p_s and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0)
$$;

-- Lista para escoger:
--   ajustes:   [id, tipo, módulo, sku, producto, cant, unidad, vence, reemplazo, fijar_a, por, en, ahora, ya]
--   bloqueos:  [id, módulo, sku, motivo, candado, fecha, nota, por, en, ya]
--   revisiones:[módulo, por, en]
create or replace function public.reaplicar_lista(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador'); b timestamptz := _reaplicar_base();
begin
  if b is null then return jsonb_build_object('base', null, 'ajustes', '[]'::jsonb, 'bloqueos', '[]'::jsonb, 'revisiones', '[]'::jsonb); end if;
  return jsonb_build_object(
    'base', to_char(b at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'),
    'ajustes', coalesce((select jsonb_agg(jsonb_build_array(a.id::text, a.tipo, a.modulo, a.sku, coalesce(a.producto, ''), a.cant, a.unidad,
        coalesce(to_char(a.vence, 'YYYY-MM-DD'), ''), a.reemplazo, a.fijar_a, a.por, to_char(a.en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'),
        _cant_ahora(a.modulo, a.sku, a.unidad),
        -- Quitar y luego guardar el mismo producto ahí: si el WMS ya muestra lo guardado, el quitar también está hecho
        case when a.fijar_a = 0 then _cant_ahora(a.modulo, a.sku, a.unidad) < 0.0001 or exists (
               select 1 from ajustes_sin_wms p join _reaplicar_ajustes() t2 on t2.id = p.id
                where p.modulo = a.modulo and p.sku = a.sku and p.tipo = 'PONER' and p.fijar_a is null and (p.en, p.id) > (a.en, a.id)
                  and exists (select 1 from wms_base w where w.modulo = p.modulo and w.sku = p.sku and w.vence = p.vence
                                and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0)))
             when a.fijar_a is not null then abs(_cant_ahora(a.modulo, a.sku, a.unidad) - a.fijar_a) < 0.0001
             when a.tipo = 'PONER' then exists (select 1 from wms_base w where w.modulo = a.modulo and w.sku = a.sku and w.vence = a.vence
                                                  and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0))
             else false end) order by a.en, a.id)
      from ajustes_sin_wms a join _reaplicar_ajustes() t on t.id = a.id where not t.tapado), '[]'::jsonb),
    'bloqueos', coalesce((select jsonb_agg(jsonb_build_array(x.id::text, x.modulo, coalesce(x.sku, ''), x.motivo, coalesce(x.candado, ''),
        to_char(x.fecha, 'YYYY-MM-DD'), coalesce(x.nota, ''), x.por, to_char(x.en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'),
        exists (select 1 from wms_base w where w.modulo = x.modulo and (x.sku is null or w.sku = x.sku) and w.estado = x.motivo
                  and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0))) order by x.en, x.id)
      from bloqueos_sin_wms x where x.sync_base = b and x.deshecho_en is null and x.reaplicado_en is null), '[]'::jsonb),
    'revisiones', coalesce((select jsonb_agg(jsonb_build_array(r.modulo, r.por, to_char(r.en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS')) order by r.modulo)
      from (select distinct on (modulo) modulo, por, en, quitada from revisiones_modulo
             where sync_base = b and reaplicado_en is null order by modulo, id desc) r where not r.quitada), '[]'::jsonb));
end $$;

-- p_sel = { ajustes: [ids], bloqueos: [ids], revisiones: true|false }
create or replace function public.reaplicar(p_token text, p_sel jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'validador');
  b timestamptz := _reaplicar_base();
  ahora timestamptz := (select ultima_sync from sync_estado where id = 1);
  sel_a bigint[] := array(select jsonb_array_elements_text(coalesce(p_sel->'ajustes', '[]'::jsonb))::bigint);
  sel_b bigint[] := array(select jsonb_array_elements_text(coalesce(p_sel->'bloqueos', '[]'::jsonb))::bigint);
  r record; a public.ajustes_sin_wms; x public.bloqueos_sin_wms; mx bigint;
  n_ok int := 0; n_ya int := 0; n_bl int := 0; n_rev int := 0; errores jsonb := '[]'::jsonb; ya boolean; mot text;
begin
  if b is null then raise exception 'No hay nada anotado a mano de antes de la última sincronización.'; end if;
  for r in
    select 'a' k, t.id, t.tapado, aj.en from _reaplicar_ajustes() t join ajustes_sin_wms aj on aj.id = t.id
    union all
    select 'b', bl.id, false, bl.en from bloqueos_sin_wms bl where bl.sync_base = b and bl.deshecho_en is null and bl.reaplicado_en is null
    order by 4, 2
  loop
    if r.k = 'a' then
      select * into a from ajustes_sin_wms where id = r.id;
      if r.tapado or not (a.id = any(sel_a)) then
        update ajustes_sin_wms set reaplicado = case when r.tapado then 'reemplazado por una corrección más nueva' else 'descartado' end,
               reaplicado_en = now(), reaplicado_por = u.nombre where id = a.id;
        continue;
      end if;
      select coalesce(max(id), 0) into mx from ajustes_sin_wms;
      begin
        if a.fijar_a is not null then
          perform ajuste_fijar(p_token, jsonb_build_object('modulo', a.modulo, 'sku', a.sku, 'cant', a.fijar_a::text, 'unidad', a.unidad));
        elsif a.tipo = 'PONER' then
          perform ajuste_poner(p_token, jsonb_build_object('modulo', a.modulo, 'sku', a.sku, 'producto', a.producto, 'cant', a.cant::text,
                  'unidad', a.unidad, 'vence', to_char(a.vence, 'YYYY-MM-DD'), 'reemplazar', a.reemplazo));
        else
          perform ajuste_sacar(p_token, jsonb_build_object('modulo', a.modulo, 'sku', a.sku, 'cant', a.cant::text, 'unidad', a.unidad));
        end if;
        -- Queda a nombre de quien lo anotó, con su hora
        update wms_base set obs = 'Anotado a mano sin WMS por ' || a.por
         where id in (select fila_nueva from ajustes_sin_wms where id > mx and fila_nueva is not null);
        update ajustes_sin_wms set por = a.por, en = a.en, origen = a.id where id > mx;
        update ajustes_sin_wms set reaplicado = 'aplicado', reaplicado_en = now(), reaplicado_por = u.nombre where id = a.id;
        n_ok := n_ok + 1;
      exception when others then
        ya := sqlerrm like 'Ya tiene esa cantidad%' or (a.fijar_a = 0 and sqlerrm like 'En % no hay producto %');
        update ajustes_sin_wms set reaplicado = case when ya then 'ya estaba' else 'no se pudo: ' || left(sqlerrm, 200) end,
               reaplicado_en = now(), reaplicado_por = u.nombre where id = a.id;
        if ya then n_ya := n_ya + 1;
        else errores := errores || jsonb_build_array(jsonb_build_array(a.modulo, a.sku, coalesce(a.producto, ''), regexp_replace(sqlerrm, '^[A-Z]+: ', ''))); end if;
      end;
    else
      select * into x from bloqueos_sin_wms where id = r.id;
      if not (x.id = any(sel_b)) then
        update bloqueos_sin_wms set reaplicado = 'descartado', reaplicado_en = now(), reaplicado_por = u.nombre where id = x.id;
        continue;
      end if;
      select coalesce(max(id), 0) into mx from bloqueos_sin_wms;
      mot := case when x.motivo in ('PNC CALIDAD', 'PRUEBA DE TRANSPORTE') then x.motivo else 'OTRO' end;
      begin
        perform bloqueo_poner(p_token, jsonb_build_object('modulo', x.modulo, 'sku', x.sku, 'motivo', mot, 'otro', x.motivo,
                'candado', x.candado, 'fecha', to_char(x.fecha, 'YYYY-MM-DD'), 'nota', x.nota));
        update wms_base set obs = replace(obs, ' por ' || u.nombre, ' por ' || x.por)
         where modulo = x.modulo and (x.sku is null or sku = x.sku) and obs like 'Bloqueado sin WMS%';
        update bloqueos_sin_wms set por = x.por, en = x.en, origen = x.id where id > mx;
        update bloqueos_sin_wms set reaplicado = 'aplicado', reaplicado_en = now(), reaplicado_por = u.nombre where id = x.id;
        n_bl := n_bl + 1;
      exception when others then
        update bloqueos_sin_wms set reaplicado = 'no se pudo: ' || left(sqlerrm, 200), reaplicado_en = now(), reaplicado_por = u.nombre where id = x.id;
        errores := errores || jsonb_build_array(jsonb_build_array(x.modulo, coalesce(x.sku, ''), '🔒 Bloqueo ' || x.motivo, regexp_replace(sqlerrm, '^[A-Z]+: ', '')));
      end;
    end if;
  end loop;
  -- ✅ Está bien: se vuelven a marcar (con su nombre y hora) si se pidió
  if coalesce((p_sel->>'revisiones')::boolean, false) then
    insert into revisiones_modulo (modulo, por, en, sync_base)
    select r2.modulo, r2.por, r2.en, ahora from (
      select distinct on (modulo) modulo, por, en, quitada from revisiones_modulo
       where sync_base = b and reaplicado_en is null order by modulo, id desc) r2 where not r2.quitada;
    get diagnostics n_rev = row_count;
  end if;
  update revisiones_modulo set reaplicado_en = now() where sync_base = b and reaplicado_en is null;
  return jsonb_build_object('aplicados', n_ok, 'ya', n_ya, 'bloqueos', n_bl, 'revisiones', n_rev, 'errores', errores,
    'ajustes_l', _ajustes_json(), 'bloqueos_l', _bloqueos_json(), 'revisiones_l', _revisiones_json());
end $$;

grant execute on function public.reaplicar_lista(text) to anon, authenticated, service_role;
grant execute on function public.reaplicar(text, jsonb) to anon, authenticated, service_role;

-- La marca de cambios también ve lo que se vuelve a aplicar
create or replace function public.cambios_marca(p_token text) returns text
language plpgsql stable security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector');
begin
  return concat_ws('|',
    (select extract(epoch from ultima_sync)::bigint from sync_estado where id = 1),
    (select extract(epoch from greatest(max(en), max(deshecho_en), max(reaplicado_en)))::bigint || ':' || count(*) from ajustes_sin_wms),
    (select extract(epoch from greatest(max(en), max(deshecho_en), max(reaplicado_en)))::bigint || ':' || count(*) from bloqueos_sin_wms),
    (select extract(epoch from greatest(max(marcado_en), max(quitado_en)))::bigint || ':' || count(*) from marcas_consumo),
    (select extract(epoch from greatest(max(reportado_en), max(completado_en)))::bigint || ':' || count(*) from reportes_modulo),
    (select extract(epoch from max(elegido_en))::bigint || ':' || count(*) || ':' || count(modulo_elegido) from consumo),
    (select extract(epoch from max(en))::bigint || ':' || count(*) from revisiones_modulo));
end $$;

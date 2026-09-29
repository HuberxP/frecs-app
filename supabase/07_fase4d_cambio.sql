-- =====================================================================
-- FRECS! · FASE 4d · Cambio definitivo: los turnos pasan a Supabase
-- ---------------------------------------------------------------------
-- Nada de esto se activa solo. Apps Script (función sbCambioDefinitivo, a mano)
-- hace la importación final y llama a sb_cambio_definitivo(). Desde ahí:
--   · turnos, validación, entrega y conciliación se hacen en la versión nueva;
--   · después de cada cambio, Apps Script copia a las hojas los turnos y
--     conciliaciones tocados (sb_turnos_hojas), así el bot y sus PDF siguen igual;
--   · la importación desde las hojas queda cerrada (ya no pisa Supabase).
-- Para volver atrás (emergencia): sb_volver_a_hojas() y la propiedad de Apps Script.
-- =====================================================================

-- Filas de los turnos y conciliaciones pedidos, en el orden de columnas de las hojas
create or replace function public.sb_turnos_hojas(p_turnos jsonb default '[]'::jsonb, p_concs jsonb default '[]'::jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  tz constant text := 'America/Bogota';
  ts text[]; cs text[]; abiertos text[]; cerrados text[];
begin
  select coalesce(array_agg(x), '{}') into ts from jsonb_array_elements_text(coalesce(p_turnos, '[]'::jsonb)) x;
  select coalesce(array_agg(x), '{}') into cs from jsonb_array_elements_text(coalesce(p_concs, '[]'::jsonb)) x;
  select coalesce(array_agg(id) filter (where estado = 'ABIERTO'), '{}'), coalesce(array_agg(id) filter (where estado <> 'ABIERTO'), '{}')
    into abiertos, cerrados from turnos where id = any(ts);
  return jsonb_build_object(
    'turnos_pedidos', to_jsonb(ts), 'concs_pedidas', to_jsonb(cs),
    'turnos', coalesce((select jsonb_agg(jsonb_build_array(id, coalesce(numero::text, ''), coalesce(to_char(fecha, 'YYYY-MM-DD'), ''), estado,
        to_char(inicio at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(abierto_por, ''),
        coalesce(to_char(cierre at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), ''), coalesce(cerrado_por, ''), coalesce(recibe_de_id, ''),
        coalesce(recibe_de, ''), coalesce(nota, ''), coalesce(editado_por, ''), coalesce(eliminado_por, '')) order by inicio, id) from turnos where id = any(ts)), '[]'::jsonb),
    'val_productos', coalesce((select jsonb_agg(jsonb_build_array(turno_id, sku, coalesce(producto, ''), inicial,
        to_char(actualizado at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(usuario, ''),
        coalesce(to_char(contado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), '')) order by orden)
      from val_productos where turno_id = any(abiertos)), '[]'::jsonb),
    'val_registros', coalesce((select jsonb_agg(jsonb_build_array(id, turno_id, to_char(fecha at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), sku,
        coalesce(producto, ''), coalesce(destino, ''), cantidad, coalesce(usuario, ''), coalesce(nota, ''), estado, coalesce(modificado_por, ''),
        coalesce(to_char(contado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), '')) order by fecha, id)
      from val_registros where turno_id = any(abiertos)), '[]'::jsonb),
    'val_hist_productos', coalesce((select jsonb_agg(jsonb_build_array(p.turno_id, p.sku, coalesce(p.producto, ''), p.inicial,
        coalesce(v.validado, 0), p.inicial - coalesce(v.validado, 0), coalesce(v.detalle, ''),
        coalesce(to_char(p.contado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), '')) order by p.turno_id, p.orden)
      from val_productos p
      left join lateral (
        select sum(d.cant) as validado, string_agg(d.destino || ': ' || d.cant, ' | ' order by d.primera) as detalle
        from (select coalesce(r.destino, '') as destino, sum(r.cantidad) as cant, min(r.fecha) as primera
              from val_registros r where r.turno_id = p.turno_id and r.sku = p.sku and r.estado = 'ACTIVO' group by 1) d
      ) v on true
      where p.turno_id = any(cerrados)), '[]'::jsonb),
    'val_hist_registros', coalesce((select jsonb_agg(jsonb_build_array(id, turno_id, to_char(fecha at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), sku,
        coalesce(producto, ''), coalesce(destino, ''), cantidad, coalesce(usuario, ''), coalesce(nota, ''), estado, coalesce(modificado_por, ''),
        coalesce(to_char(contado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), '')) order by turno_id, fecha, id)
      from val_registros where turno_id = any(cerrados)), '[]'::jsonb),
    'ent_items', coalesce((select jsonb_agg(jsonb_build_array(turno_id, seccion, sku, coalesce(producto, ''), cantidades::text,
        to_char(actualizado at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(usuario, ''), coalesce(origen, '')) order by turno_id, seccion, sku)
      from ent_items where turno_id = any(ts)), '[]'::jsonb),
    'ent_notas', coalesce((select jsonb_agg(jsonb_build_array(turno_id, id, to_char(hora at time zone tz, 'YYYY-MM-DD HH24:MI:SS'),
        coalesce(usuario, ''), texto) order by hora, id)
      from ent_notas where turno_id = any(ts)), '[]'::jsonb),
    'conciliaciones', coalesce((select jsonb_agg(jsonb_build_array(id, coalesce(turno_id, ''), coalesce(numero::text, ''), coalesce(to_char(fecha, 'YYYY-MM-DD'), ''),
        estado, to_char(inicio at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(abierto_por, ''),
        coalesce(to_char(cierre at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), ''), coalesce(cerrado_por, ''), coalesce(nota, ''),
        coalesce(editado_por, ''), coalesce(eliminado_por, '')) order by inicio, id)
      from conciliaciones where id = any(cs)), '[]'::jsonb),
    'conc_items', coalesce((select jsonb_agg(jsonb_build_array(conc_id, sku, coalesce(producto, ''),
        coalesce(to_jsonb(bodega), '""'), coalesce(to_jsonb(ka), '""'), coalesce(to_jsonb(pk), '""'), coalesce(to_jsonb(facturacion), '""'),
        bloqueo, to_char(actualizado at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(usuario, ''), coalesce(origen, '')) order by conc_id, sku)
      from conc_items where conc_id = any(cs)), '[]'::jsonb),
    -- Pequeñas: van completas
    'preconciliacion', coalesce((select jsonb_agg(jsonb_build_array(id, to_char(fecha at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(turno::text, ''),
        sku, coalesce(producto, ''), coalesce(motivo, ''), coalesce(usuario, ''), estado, coalesce(conc_id, '')) order by fecha, id) from preconciliacion), '[]'::jsonb),
    'destinos', coalesce((select jsonb_agg(jsonb_build_array(nombre) order by orden, nombre) from destinos), '[]'::jsonb)
  );
end $$;

-- Interruptor del cambio definitivo (lo llama Apps Script con la clave secreta)
create or replace function public.sb_cambio_definitivo()
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  insert into frecs_config (clave, valor) values ('importacion_cerrada', 'si'), ('turnos_en_supabase', 'si')
  on conflict (clave) do update set valor = excluded.valor;
  return jsonb_build_object('turnos_en_supabase', 'si', 'importacion_cerrada', 'si');
end $$;

-- Emergencia: las hojas vuelven a mandar (tienen la copia al día) y la importación se reabre
create or replace function public.sb_volver_a_hojas()
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  delete from frecs_config where clave in ('importacion_cerrada', 'turnos_en_supabase');
  return jsonb_build_object('turnos_en_supabase', 'prueba', 'importacion_cerrada', 'no');
end $$;

create or replace function public.sb_modo_turnos()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select valor from frecs_config where clave = 'turnos_en_supabase'), 'prueba')
$$;

revoke execute on function public.sb_turnos_hojas(jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.sb_cambio_definitivo() from public, anon, authenticated;
revoke execute on function public.sb_volver_a_hojas() from public, anon, authenticated;
revoke execute on function public.sb_modo_turnos() from public, anon, authenticated;
grant execute on function public.sb_turnos_hojas(jsonb, jsonb) to service_role;
grant execute on function public.sb_cambio_definitivo() to service_role;
grant execute on function public.sb_volver_a_hojas() to service_role;
grant execute on function public.sb_modo_turnos() to service_role;

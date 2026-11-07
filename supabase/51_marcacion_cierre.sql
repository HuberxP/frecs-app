-- =====================================================================
-- FRECS! · 51 · Marcación de bodega (rotulación): se cierra sola
-- ---------------------------------------------------------------------
-- Una marcación está en curso hasta que pase una de estas cosas:
--   · se abre otra marcación (más nueva);
--   · se cierra un turno después de que se creó la marcación;
--   · pasan 16 horas (por si nadie cierra el turno).
-- Cerrada ya no deja agregar ni corregir módulos (sí ver e imprimir); la página tampoco ofrece quitarlos.
-- Ya no se usan las marcas de impreso / rotulado (las columnas quedan).
-- =====================================================================
create or replace function public._rot_cerrada(p_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select r.creado_en < now() - interval '16 hours'
      or exists (select 1 from rotulaciones r2 where r2.id > r.id and r2.eliminado_por is null)
      or exists (select 1 from turnos t where t.estado = 'CERRADO' and t.eliminado_por is null and t.cierre > r.creado_en)
    from rotulaciones r where r.id = p_id), true)
$$;

create or replace function public._rot_json(p_id bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', r.id, 'fecha', r.fecha, 'turno', r.turno, 'por', r.creado_por,
    'en', to_char(r.creado_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'),
    'cerrada', _rot_cerrada(r.id),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'm', i.modulo, 'sku', coalesce(i.sku, ''), 'prod', coalesce(i.producto, ''),
        'vence', coalesce(to_char(i.vence, 'YYYY-MM-DD'), ''), 'est', i.estibas, 'estSis', i.estibas_sis, 'por', i.agregado_por, 'editado', coalesce(i.editado_por, ''),
        'impreso', i.impreso, 'impresoPor', coalesce(i.impreso_por, ''), 'rotulado', i.rotulado, 'rotuladoPor', coalesce(i.rotulado_por, ''),
        'rotuladoEn', coalesce(to_char(i.rotulado_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'), '')) order by i.orden, i.id)
      from rotulo_items i where i.rot_id = r.id), '[]'::jsonb))
  from rotulaciones r where r.id = p_id
$$;

create or replace function public.rot_listar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador');
begin
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'fecha', r.fecha, 'turno', r.turno, 'por', r.creado_por,
      'en', to_char(r.creado_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'), 'cerrada', _rot_cerrada(r.id),
      'n', (select count(*) from rotulo_items i where i.rot_id = r.id),
      'impresos', (select count(*) from rotulo_items i where i.rot_id = r.id and i.impreso),
      'rotulados', (select count(*) from rotulo_items i where i.rot_id = r.id and i.rotulado)) order by r.fecha desc, r.id desc)
    from rotulaciones r where r.eliminado_por is null and r.fecha > (now() at time zone 'America/Bogota')::date - 45), '[]'::jsonb);
end $$;

-- Agregar (sin id) o corregir (con id) un módulo: { id?, m, sku, prod, vence, est, estSis } · solo en una marcación en curso
create or replace function public.rot_item_guardar(p_token text, p_rot bigint, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'validador');
  m text := upper(btrim(coalesce(p_item->>'m', '')));
  v date; e numeric;
begin
  if not exists (select 1 from rotulaciones where id = p_rot and eliminado_por is null) then raise exception 'La rotulación no existe.'; end if;
  if _rot_cerrada(p_rot) then raise exception 'Esta marcación ya está cerrada: abre una nueva.'; end if;
  if m = '' or length(m) > 30 then raise exception 'Escribe el módulo.'; end if;
  begin v := nullif(p_item->>'vence', '')::date; exception when others then raise exception 'Fecha de vencimiento no válida.'; end;
  begin e := nullif(p_item->>'est', '')::numeric; exception when others then raise exception 'Cantidad de estibas no válida.'; end;
  if e is not null and (e < 0 or e > 999) then raise exception 'Cantidad de estibas no válida.'; end if;
  if coalesce(p_item->>'id', '') = '' then
    insert into rotulo_items (rot_id, orden, modulo, sku, producto, vence, estibas, estibas_sis, agregado_por)
      values (p_rot, coalesce((select max(orden) from rotulo_items where rot_id = p_rot), 0) + 1, m, left(nullif(p_item->>'sku', ''), 30),
              left(nullif(p_item->>'prod', ''), 200), v, e, nullif(p_item->>'estSis', '')::numeric, u.nombre);
  else
    update rotulo_items set modulo = m, sku = left(nullif(p_item->>'sku', ''), 30), producto = left(nullif(p_item->>'prod', ''), 200),
           vence = v, estibas = e, editado_por = u.nombre
     where id = (p_item->>'id')::bigint and rot_id = p_rot;
    if not found then raise exception 'Ese módulo ya no está en la rotulación.'; end if;
  end if;
  return _rot_json(p_rot);
end $$;

revoke execute on function public._rot_cerrada(bigint) from public, anon, authenticated;

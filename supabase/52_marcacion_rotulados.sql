-- =====================================================================
-- FRECS! · 52 · Al cerrarse una marcación, todos sus módulos quedan como rotulados
-- ---------------------------------------------------------------------
-- La marcación se cierra sola (ver 51): otra marcación nueva, un turno cerrado o 16 horas.
-- Al listar, ver o crear marcaciones se marcan los módulos de las cerradas (rotulado_por = 'CIERRE').
-- No borra nada: solo pone la marca a los que no la tenían.
-- =====================================================================
create or replace function public._rot_marcar_cerradas() returns void
language plpgsql security definer set search_path = public as $$
begin
  update rotulo_items i set rotulado = true, rotulado_por = 'CIERRE', rotulado_en = now()
   where not coalesce(i.rotulado, false)
     and i.rot_id in (select r.id from rotulaciones r
                       where r.eliminado_por is null and r.fecha > (now() at time zone 'America/Bogota')::date - 45
                         and _rot_cerrada(r.id));
end $$;

create or replace function public.rot_listar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador');
begin
  perform _rot_marcar_cerradas();
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'fecha', r.fecha, 'turno', r.turno, 'por', r.creado_por,
      'en', to_char(r.creado_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'), 'cerrada', _rot_cerrada(r.id),
      'n', (select count(*) from rotulo_items i where i.rot_id = r.id),
      'impresos', (select count(*) from rotulo_items i where i.rot_id = r.id and i.impreso),
      'rotulados', (select count(*) from rotulo_items i where i.rot_id = r.id and i.rotulado)) order by r.fecha desc, r.id desc)
    from rotulaciones r where r.eliminado_por is null and r.fecha > (now() at time zone 'America/Bogota')::date - 45), '[]'::jsonb);
end $$;

create or replace function public.rot_crear(p_token text, p_turno int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador'); nuevo bigint;
begin
  if p_turno is null or p_turno not between 1 and 3 then raise exception 'Escoge el turno (1, 2 o 3).'; end if;
  insert into rotulaciones (turno, creado_por) values (p_turno, u.nombre) returning id into nuevo;
  perform _rot_marcar_cerradas();   -- la anterior queda cerrada con sus módulos rotulados
  return _rot_json(nuevo);
end $$;

create or replace function public.rot_ver(p_token text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador');
begin
  if not exists (select 1 from rotulaciones where id = p_id and eliminado_por is null) then raise exception 'La rotulación no existe.'; end if;
  perform _rot_marcar_cerradas();
  return _rot_json(p_id);
end $$;

revoke execute on function public._rot_marcar_cerradas() from public, anon, authenticated;

-- =====================================================================
-- Frecs! · 13 · Confirmar el PIN de quien ya está dentro
-- ---------------------------------------------------------------------
-- Se pide antes de acciones que no se deben hacer por error (cancelar un turno
-- o una conciliación). Usa el mismo conteo de intentos del ingreso: 5 PIN errados
-- seguidos bloquean ese nombre 10 minutos.
-- Devuelve { ok } o { ok: false, error } sin lanzar excepción (una excepción desharía el conteo).
-- =====================================================================
create or replace function public.verificar_pin(p_token text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  u public.perfiles := _sesion(p_token);
  clave text := lower(btrim(u.nombre));
  i public.intentos_ingreso;
  bueno boolean := false;
begin
  select * into i from intentos_ingreso where nombre_clave = clave;
  if found and i.bloqueado_hasta is not null and i.bloqueado_hasta > now() then
    return jsonb_build_object('ok', false, 'error', 'Demasiados intentos. Espera 10 minutos.');
  end if;
  if u.pin_hash is not null then bueno := (crypt(coalesce(p_pin, ''), u.pin_hash) = u.pin_hash);
  elsif u.pin_legado is not null then bueno := (_pin_legado(u.nombre, coalesce(p_pin, '')) = u.pin_legado);
  end if;
  if not bueno then
    insert into intentos_ingreso (nombre_clave, fallos) values (clave, 1)
      on conflict (nombre_clave) do update set
        fallos = case when intentos_ingreso.bloqueado_hasta is not null then 1 else intentos_ingreso.fallos + 1 end,
        bloqueado_hasta = case when intentos_ingreso.bloqueado_hasta is null and intentos_ingreso.fallos + 1 >= 5
                               then now() + interval '10 minutes' else null end;
    return jsonb_build_object('ok', false, 'error', 'PIN incorrecto.');
  end if;
  delete from intentos_ingreso where nombre_clave = clave;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.verificar_pin(text, text) to anon, authenticated;

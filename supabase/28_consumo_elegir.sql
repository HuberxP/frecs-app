-- =====================================================================
-- FRECS! · 28 · El rotador vuelve a escoger a mano el módulo a consumir (en Consumo / Pony)
-- ---------------------------------------------------------------------
-- La lista de consumo (agregar, quitar, nombre, orden) sigue siendo solo del administrador
-- (guardar_filas). Escoger el módulo o volver a automático lo hacen el rotador y el administrador
-- con esta función, que solo toca modulo_elegido / elegido_por / elegido_en.
-- =====================================================================
create or replace function public.consumo_elegir(p_token text, p_sku text, p_modulo text) returns boolean
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador'); m text := upper(btrim(coalesce(p_modulo, '')));
begin
  if not exists (select 1 from consumo where sku = btrim(p_sku)) then raise exception 'El SKU % no está en la lista de consumo.', p_sku; end if;
  if m <> '' and not exists (select 1 from wms_base where sku = btrim(p_sku) and modulo = m and (coalesce(estibas, 0) > 0 or coalesce(cajas, 0) > 0 or coalesce(unidades, 0) > 0)) then
    raise exception 'En % no hay producto disponible del SKU %.', m, p_sku;
  end if;
  update consumo set modulo_elegido = nullif(m, ''), elegido_por = case when m = '' then null else u.nombre end,
         elegido_en = case when m = '' then null else now() end
   where sku = btrim(p_sku);
  return true;
end $$;
grant execute on function public.consumo_elegir(text, text, text) to anon, authenticated, service_role;

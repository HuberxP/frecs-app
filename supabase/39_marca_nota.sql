-- =====================================================================
-- FRECS! · 39 · Nota en la marca de consumo y Pony gasto sincronizado con las marcas
-- ---------------------------------------------------------------------
-- Al marcar forzado (la fecha no cumple los días del canal o está bloqueado) se puede dejar una nota
-- opcional: por qué se marcó. La página la recibe al final de cada marca.
-- Pony gasto (lista de consumo) y los módulos en consumo van juntos: si un producto de la lista se
-- marca en consumo, Pony gasto queda consumiendo de ese módulo; si se quita la marca, Pony vuelve al
-- otro módulo marcado o al cálculo automático. (Elegir en Pony gasto marca el módulo para un canal.)
-- =====================================================================
alter table public.marcas_consumo add column if not exists nota text;

-- Las activas: [id, sku, producto, módulo, canal, forzado, días, mínimo, marcado_por, marcado_en, nota]
create or replace function public._marcas_json() returns jsonb
language plpgsql security definer set search_path = public as $$
declare tz constant text := 'America/Bogota';
begin
  perform _marcas_auto();
  return coalesce((select jsonb_agg(jsonb_build_array(id::text, sku, coalesce(producto, ''), modulo, canal, forzado, dias, minimo, marcado_por,
      to_char(marcado_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), coalesce(nota, '')) order by marcado_en desc, id desc)
    from marcas_consumo where quitado_en is null), '[]'::jsonb);
end $$;

-- Marcar: p_item = { sku, producto, modulo, canal, forzado, dias, minimo, nota }
create or replace function public.marca_poner(p_token text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'verificador');
  m text := upper(btrim(coalesce(p_item->>'modulo', '')));
  s text := btrim(coalesce(p_item->>'sku', ''));
  c text := upper(btrim(coalesce(p_item->>'canal', '')));
begin
  if not _puede_marcar(u) then raise exception 'PERMISO: Solo el verificador, el rotador o el administrador marcan módulos en consumo.'; end if;
  if c not in ('T1', 'T2', 'KA') then raise exception 'Escoge el canal (T1, T2 o KA).'; end if;
  if m = '' or length(m) > 30 or s !~ '^[0-9]{1,20}$' then raise exception 'Módulo o producto no válido.'; end if;
  if exists (select 1 from marcas_consumo where sku = s and modulo = m and canal = c and quitado_en is null) then
    raise exception '% ya está marcado en consumo para %.', m, c;
  end if;
  insert into marcas_consumo (sku, producto, modulo, canal, forzado, dias, minimo, marcado_por, nota)
  values (s, left(nullif(p_item->>'producto', ''), 200), m, c, coalesce((p_item->>'forzado')::boolean, false),
          case when coalesce(p_item->>'dias', '') ~ '^-?[0-9]{1,6}$' then (p_item->>'dias')::int end,
          case when coalesce(p_item->>'minimo', '') ~ '^[0-9]{1,6}$' then (p_item->>'minimo')::int end, u.nombre,
          left(nullif(btrim(coalesce(p_item->>'nota', '')), ''), 300));
  -- Pony gasto consume de este módulo
  update consumo set modulo_elegido = m, elegido_por = u.nombre, elegido_en = now() where sku = s;
  return _marcas_json();
end $$;

-- Quitar a mano: si Pony gasto consumía de ese módulo, pasa al otro marcado (el más reciente) o a automático
create or replace function public.marca_quitar(p_token text, p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'verificador'); x public.marcas_consumo; otro public.marcas_consumo;
begin
  if not _puede_marcar(u) then raise exception 'PERMISO: Solo el verificador, el rotador o el administrador quitan módulos de consumo.'; end if;
  update marcas_consumo set quitado_en = now(), quitado_por = u.nombre, cierre = 'MANUAL' where id = p_id and quitado_en is null returning * into x;
  if x.id is not null and not exists (select 1 from marcas_consumo where sku = x.sku and modulo = x.modulo and quitado_en is null) then
    select * into otro from marcas_consumo where sku = x.sku and quitado_en is null order by marcado_en desc, id desc limit 1;
    update consumo set modulo_elegido = otro.modulo,
           elegido_por = case when otro.id is null then null else otro.marcado_por end,
           elegido_en = case when otro.id is null then null else otro.marcado_en end
     where sku = x.sku and modulo_elegido = x.modulo;
  end if;
  return _marcas_json();
end $$;

-- Los productos de la lista que ya tienen módulo marcado y Pony en automático: consumen del marcado
update consumo c set modulo_elegido = k.modulo, elegido_por = k.marcado_por, elegido_en = k.marcado_en
  from (select distinct on (sku) sku, modulo, marcado_por, marcado_en from marcas_consumo where quitado_en is null order by sku, marcado_en desc, id desc) k
 where c.sku = k.sku and c.modulo_elegido is null;

-- =====================================================================
-- FRECS! · 53 · Entradas: estibado distinto al configurado (hoja Sku) y alertas de fecha corta con historial
-- ---------------------------------------------------------------------
--   · Cada entrada guarda las cajas por estiba configuradas en Sku al registrarla (cajas_estiba_sku).
--     Si las cajas por estiba del rótulo son otras, la entrada tiene «estibado distinto».
--   · Revisar sirve para la fecha corta (menos de 90 días) y para el estibado distinto.
--   · La sección trae además: 'cortas' (fecha corta, 30 días, revisadas o no) y 'estibado' (estibado distinto, 30 días).
-- =====================================================================
alter table public.entradas add column if not exists cajas_estiba_sku numeric;

-- Cajas por estiba de la hoja Sku (el texto puede traer palabras: «45 cajas»)
create or replace function public._sku_cpe(p_sku text) returns numeric
language sql stable security definer set search_path = public as $$
  select nullif(substring(replace(coalesce(s.cant_x_estiba, ''), ',', '.') from '[0-9]+(?:\.[0-9]+)?'), '')::numeric
    from sku s where s.sku = p_sku
$$;

create or replace function public._entrada_json(e public.entradas) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', e.id, 'sku', e.sku, 'prod', e.producto, 'pres', coalesce(e.presentacion, ''),
    'vence', to_char(e.vence, 'YYYY-MM-DD'), 'env', coalesce(to_char(e.envasado, 'YYYY-MM-DD'), ''), 'rec', to_char(e.recibo, 'YYYY-MM-DD'),
    'lim', coalesce(to_char(e.limite, 'YYYY-MM-DD'), ''), 'cpe', e.cajas_estiba, 'est', e.estibas, 'tot', e.total_cajas,
    'cpeSku', x.cs, 'estDif', coalesce(e.cajas_estiba is not null and x.cs is not null and round(e.cajas_estiba) <> round(x.cs), false),
    'por', e.creada_por, 'rol', coalesce(e.rol, ''), 'en', to_char(e.creada_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'),
    'dia', to_char(e.creada_en at time zone 'America/Bogota', 'YYYY-MM-DD'), 'turno', e.turno,
    'horas', round(extract(epoch from (now() - e.creada_en)) / 3600.0, 1),
    'dias', (e.vence - e.recibo), 'estado', e.estado, 'anuladaPor', coalesce(e.anulada_por, ''), 'motivo', coalesce(e.anulada_motivo, ''),
    'wms', e.wms_en is not null, 'wmsEn', coalesce(to_char(e.wms_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'), ''), 'wmsEst', e.wms_estibas,
    'alerta', e.alerta, 'revisadaPor', coalesce(e.revisada_por, ''), 'revisadaEn', coalesce(to_char(e.revisada_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'), ''),
    'nota', coalesce(e.revisada_nota, ''))
  from (select coalesce(e.cajas_estiba_sku, _sku_cpe(e.sku)) cs) x
$$;

create or replace function public._entrada_dif(e public.entradas) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(e.cajas_estiba is not null and x.cs is not null and round(e.cajas_estiba) <> round(x.cs), false)
    from (select coalesce(e.cajas_estiba_sku, _sku_cpe(e.sku)) cs) x
$$;

create or replace function public._entradas_json(p_dia date) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'dia', to_char(p_dia, 'YYYY-MM-DD'),
    'lista', coalesce((select jsonb_agg(_entrada_json(e) order by e.creada_en desc) from entradas e
                        where (e.creada_en at time zone 'America/Bogota')::date = p_dia), '[]'::jsonb),
    'alertas', coalesce((select jsonb_agg(_entrada_json(e) order by e.vence, e.creada_en) from entradas e
                          where e.estado = 'ACTIVA' and e.alerta and e.revisada_en is null), '[]'::jsonb),
    'cortas', coalesce((select jsonb_agg(_entrada_json(e) order by (e.revisada_en is not null), e.creada_en desc) from entradas e
                         where e.estado = 'ACTIVA' and e.alerta and (e.revisada_en is null or e.creada_en > now() - interval '30 days')), '[]'::jsonb),
    'estibado', coalesce((select jsonb_agg(_entrada_json(e) order by (e.revisada_en is not null), e.creada_en desc) from entradas e
                           where e.estado = 'ACTIVA' and _entrada_dif(e) and (e.revisada_en is null or e.creada_en > now() - interval '30 days')), '[]'::jsonb),
    'pendientes', coalesce((select jsonb_agg(_entrada_json(e) order by e.creada_en) from entradas e
                             where e.estado = 'ACTIVA' and e.wms_en is null and e.creada_en > now() - interval '15 days'), '[]'::jsonb),
    'dias', coalesce((select jsonb_agg(jsonb_build_object('dia', d, 'n', n) order by d desc) from (
                        select to_char((creada_en at time zone 'America/Bogota')::date, 'YYYY-MM-DD') d, count(*) n from entradas
                         where estado = 'ACTIVA' and creada_en > now() - interval '60 days' group by 1) x), '[]'::jsonb))
$$;

-- Registrar: igual que antes, y guarda las cajas por estiba configuradas (las manda la página; si no, las de Sku)
create or replace function public.entrada_registrar(p_token text, p_datos jsonb, p_forzar boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'lector');
  s text := left(btrim(coalesce(p_datos->>'sku', '')), 30);
  p text := left(btrim(coalesce(p_datos->>'prod', '')), 200);
  v date; en date; li date; n int; c numeric; t numeric; cs numeric; hoy date := (now() at time zone 'America/Bogota')::date;
  r public.entradas; nuevo public.entradas;
begin
  if s = '' or p = '' then raise exception 'Escoge el producto.'; end if;
  begin v := (p_datos->>'vence')::date; exception when others then v := null; end;
  if v is null then raise exception 'Escribe la fecha de vencimiento.'; end if;
  begin n := (p_datos->>'est')::int; exception when others then n := null; end;
  if n is null or n < 1 or n > 200 then raise exception 'Escribe cuántos rótulos (estibas) son: de 1 a 200.'; end if;
  begin en := nullif(p_datos->>'env', '')::date; exception when others then en := null; end;
  begin li := nullif(p_datos->>'lim', '')::date; exception when others then li := null; end;
  begin c := nullif(p_datos->>'cpe', '')::numeric; exception when others then c := null; end;
  begin t := nullif(p_datos->>'tot', '')::numeric; exception when others then t := null; end;
  begin cs := nullif(p_datos->>'cpeSku', '')::numeric; exception when others then cs := null; end;
  cs := coalesce(cs, _sku_cpe(s));
  if not coalesce(p_forzar, false) then
    select * into r from entradas where estado = 'ACTIVA' and sku = s and vence = v and creada_en > now() - interval '30 minutes' order by creada_en desc limit 1;
    if found then return jsonb_build_object('repetida', _entrada_json(r)); end if;
  end if;
  insert into entradas (sku, producto, presentacion, vence, envasado, recibo, limite, cajas_estiba, cajas_estiba_sku, estibas, total_cajas, creada_por, rol, turno, alerta)
    values (s, p, left(nullif(btrim(coalesce(p_datos->>'pres', '')), ''), 40), v, en, hoy, li, c, cs, n, t, u.nombre, u.rol, _turno_hora(), (v - hoy) < 90)
    returning * into nuevo;
  return jsonb_build_object('entrada', _entrada_json(nuevo));
end $$;

-- Revisar una novedad (fecha corta o estibado distinto): solo rotador / administrador
create or replace function public.entrada_revisar(p_token text, p_id bigint, p_nota text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador'); x public.entradas;
begin
  select * into x from entradas where id = p_id for update;
  if not found or x.estado <> 'ACTIVA' or not (x.alerta or _entrada_dif(x)) then raise exception 'Esa novedad ya no está.'; end if;
  if x.revisada_en is not null then raise exception 'Ya la revisó %.', x.revisada_por; end if;
  update entradas set revisada_por = u.nombre, revisada_en = now(), revisada_nota = nullif(left(btrim(coalesce(p_nota, '')), 300), '') where id = p_id;
  return _entradas_json((now() at time zone 'America/Bogota')::date);
end $$;

revoke execute on function public._sku_cpe(text) from public, anon, authenticated;
revoke execute on function public._entrada_dif(public.entradas) from public, anon, authenticated;
revoke execute on function public._entrada_json(public.entradas) from public, anon, authenticated;

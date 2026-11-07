-- =====================================================================
-- FRECS! · 50 · Entradas de producto (se registran al imprimir en «Rótulos de entrada»)
-- ---------------------------------------------------------------------
-- Cada impresión en Rótulos de entrada deja una entrada: producto, fechas, estibas (= número de rótulos),
-- cajas por estiba, total de cajas, quién, cuándo y en qué turno.
--   · Alerta: si al entrar le quedan menos de 90 días para vencer. Solo rotador / administrador la marca
--     como revisada (con nota opcional) y deja de salir.
--   · WMS: la entrada queda verificada cuando el WMS muestra ese producto con esa fecha de vencimiento
--     (cargado desde 24 h antes de la entrada). Mientras no, sale en «Pendientes en el WMS».
--   · Repetida: si ya hay una entrada igual (mismo SKU y vencimiento) en los últimos 30 min, no se guarda
--     sola: la página pregunta si es otra entrada o una reimpresión.
--   · Anular no borra: queda ANULADA con motivo.
-- =====================================================================
create table if not exists public.entradas (
  id            bigint generated always as identity primary key,
  sku           text not null,
  producto      text not null,
  presentacion  text,
  vence         date not null,
  envasado      date,
  recibo        date not null default (now() at time zone 'America/Bogota')::date,
  limite        date,
  cajas_estiba  numeric,
  estibas       int not null check (estibas between 1 and 200),
  total_cajas   numeric,
  creada_por    text not null,
  rol           text,
  creada_en     timestamptz not null default now(),
  turno         smallint,
  estado        text not null default 'ACTIVA' check (estado in ('ACTIVA', 'ANULADA')),
  anulada_por   text,
  anulada_en    timestamptz,
  anulada_motivo text,
  wms_en        timestamptz,
  wms_estibas   numeric,
  alerta        boolean not null default false,
  revisada_por  text,
  revisada_en   timestamptz,
  revisada_nota text
);
alter table public.entradas enable row level security;
create index if not exists entradas_creada on public.entradas (creada_en desc);
create index if not exists entradas_pend on public.entradas (estado, wms_en);

-- Verificación con el WMS (se corre al listar)
create or replace function public._entradas_wms() returns void
language plpgsql security definer set search_path = public as $$
begin
  update entradas e set wms_en = now(),
         wms_estibas = (select sum(coalesce(w.estibas, 0)) from wms_base w
                         where w.sku = e.sku and w.vence = e.vence and (w.carga is null or w.carga >= e.creada_en - interval '24 hours'))
   where e.estado = 'ACTIVA' and e.wms_en is null and e.creada_en > now() - interval '30 days'
     and exists (select 1 from wms_base w
                  where w.sku = e.sku and w.vence = e.vence and (w.carga is null or w.carga >= e.creada_en - interval '24 hours')
                    and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0));
end $$;

create or replace function public._entrada_json(e public.entradas) returns jsonb
language sql stable as $$
  select jsonb_build_object('id', e.id, 'sku', e.sku, 'prod', e.producto, 'pres', coalesce(e.presentacion, ''),
    'vence', to_char(e.vence, 'YYYY-MM-DD'), 'env', coalesce(to_char(e.envasado, 'YYYY-MM-DD'), ''), 'rec', to_char(e.recibo, 'YYYY-MM-DD'),
    'lim', coalesce(to_char(e.limite, 'YYYY-MM-DD'), ''), 'cpe', e.cajas_estiba, 'est', e.estibas, 'tot', e.total_cajas,
    'por', e.creada_por, 'rol', coalesce(e.rol, ''), 'en', to_char(e.creada_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS'),
    'dia', to_char(e.creada_en at time zone 'America/Bogota', 'YYYY-MM-DD'), 'turno', e.turno,
    'horas', round(extract(epoch from (now() - e.creada_en)) / 3600.0, 1),
    'dias', (e.vence - e.recibo), 'estado', e.estado, 'anuladaPor', coalesce(e.anulada_por, ''), 'motivo', coalesce(e.anulada_motivo, ''),
    'wms', e.wms_en is not null, 'wmsEn', coalesce(to_char(e.wms_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'), ''), 'wmsEst', e.wms_estibas,
    'alerta', e.alerta, 'revisadaPor', coalesce(e.revisada_por, ''), 'revisadaEn', coalesce(to_char(e.revisada_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'), ''),
    'nota', coalesce(e.revisada_nota, ''))
$$;

-- Lo que muestra la sección: las del día escogido, las alertas sin revisar, las pendientes en el WMS (15 días)
-- y los días con entradas (para escoger)
create or replace function public._entradas_json(p_dia date) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'dia', to_char(p_dia, 'YYYY-MM-DD'),
    'lista', coalesce((select jsonb_agg(_entrada_json(e) order by e.creada_en desc) from entradas e
                        where (e.creada_en at time zone 'America/Bogota')::date = p_dia), '[]'::jsonb),
    'alertas', coalesce((select jsonb_agg(_entrada_json(e) order by e.vence, e.creada_en) from entradas e
                          where e.estado = 'ACTIVA' and e.alerta and e.revisada_en is null), '[]'::jsonb),
    'pendientes', coalesce((select jsonb_agg(_entrada_json(e) order by e.creada_en) from entradas e
                             where e.estado = 'ACTIVA' and e.wms_en is null and e.creada_en > now() - interval '15 days'), '[]'::jsonb),
    'dias', coalesce((select jsonb_agg(jsonb_build_object('dia', d, 'n', n) order by d desc) from (
                        select to_char((creada_en at time zone 'America/Bogota')::date, 'YYYY-MM-DD') d, count(*) n from entradas
                         where estado = 'ACTIVA' and creada_en > now() - interval '60 days' group by 1) x), '[]'::jsonb))
$$;

create or replace function public.entradas_listar(p_token text, p_dia date default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector');
begin
  perform _entradas_wms();
  return _entradas_json(coalesce(p_dia, (now() at time zone 'America/Bogota')::date));
end $$;

-- Registrar al imprimir. p_datos = { sku, prod, pres, vence, env, lim, cpe, est, tot }
-- Si hay una igual (mismo SKU y vencimiento) en los últimos 30 min y no viene p_forzar, no se guarda: se devuelve «repetida».
create or replace function public.entrada_registrar(p_token text, p_datos jsonb, p_forzar boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.perfiles := _sesion(p_token, 'lector');
  s text := left(btrim(coalesce(p_datos->>'sku', '')), 30);
  p text := left(btrim(coalesce(p_datos->>'prod', '')), 200);
  v date; en date; li date; n int; c numeric; t numeric; hoy date := (now() at time zone 'America/Bogota')::date;
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
  if not coalesce(p_forzar, false) then
    select * into r from entradas where estado = 'ACTIVA' and sku = s and vence = v and creada_en > now() - interval '30 minutes' order by creada_en desc limit 1;
    if found then return jsonb_build_object('repetida', _entrada_json(r)); end if;
  end if;
  insert into entradas (sku, producto, presentacion, vence, envasado, recibo, limite, cajas_estiba, estibas, total_cajas, creada_por, rol, turno, alerta)
    values (s, p, left(nullif(btrim(coalesce(p_datos->>'pres', '')), ''), 40), v, en, hoy, li, c, n, t, u.nombre, u.rol, _turno_hora(), (v - hoy) < 90)
    returning * into nuevo;
  return jsonb_build_object('entrada', _entrada_json(nuevo));
end $$;

-- Anular (reimpresión o error): quien la registró o rotador / administrador
create or replace function public.entrada_anular(p_token text, p_id bigint, p_motivo text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector'); x public.entradas; m text := left(btrim(coalesce(p_motivo, '')), 200);
begin
  select * into x from entradas where id = p_id for update;
  if not found or x.estado <> 'ACTIVA' then raise exception 'Esa entrada ya no está activa.'; end if;
  if x.creada_por <> u.nombre and _nivel(u.rol) < _nivel('validador') then raise exception 'PERMISO: Solo quien la registró o un rotador puede anularla.'; end if;
  if m = '' then raise exception 'Escribe el motivo (por ejemplo: reimpresión, error).'; end if;
  update entradas set estado = 'ANULADA', anulada_por = u.nombre, anulada_en = now(), anulada_motivo = m where id = p_id;
  return _entradas_json((x.creada_en at time zone 'America/Bogota')::date);
end $$;

-- Marcar una alerta como revisada: solo rotador / administrador
create or replace function public.entrada_revisar(p_token text, p_id bigint, p_nota text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador'); x public.entradas;
begin
  select * into x from entradas where id = p_id for update;
  if not found or x.estado <> 'ACTIVA' or not x.alerta then raise exception 'Esa alerta ya no está.'; end if;
  if x.revisada_en is not null then raise exception 'Esa alerta ya la revisó %.', x.revisada_por; end if;
  update entradas set revisada_por = u.nombre, revisada_en = now(), revisada_nota = nullif(left(btrim(coalesce(p_nota, '')), 300), '') where id = p_id;
  return _entradas_json((now() at time zone 'America/Bogota')::date);
end $$;

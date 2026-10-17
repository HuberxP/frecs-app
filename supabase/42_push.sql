-- =====================================================================
-- FRECS! · 42 · Notificaciones al celular (Web Push de la app)
-- ---------------------------------------------------------------------
-- Cada persona prende «🔔 Notificaciones» en su perfil (en cada celular o computador) y recibe:
--   · ⬜ un aviso apenas alguien reporta un módulo vacío;
--   · ⏳ una vez al día (6:05 a. m.) los lotes disponibles que llegaron a su límite para bloquearlos:
--     los días mínimos de T2 del producto (información de producto) o, si no tiene, 30 días;
--     10 días para los barriles. Cada lote se avisa una sola vez.
-- Las envía la función frecs-bot (claves VAPID en el Vault: la privada nunca sale de Supabase).
-- =====================================================================
create table if not exists public.push_subs (
  id        bigint generated always as identity primary key,
  usuario   text not null,
  endpoint  text not null unique,
  p256dh    text not null,
  auth      text not null,
  activo    boolean not null default true,
  creado    timestamptz not null default now(),
  ultimo_ok timestamptz,
  fallos    int not null default 0
);
alter table public.push_subs enable row level security;
create table if not exists public.push_avisados (
  clave text primary key,          -- sku|módulo|vence
  en    timestamptz not null default now()
);
alter table public.push_avisados enable row level security;

-- ---------- suscribirse / quitar (cada persona, con su sesión) ----------
create or replace function public.push_suscribir(p_token text, p_sub jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'verificador');
  e text := btrim(coalesce(p_sub->>'endpoint', '')); k text := coalesce(p_sub->'keys'->>'p256dh', ''); a text := coalesce(p_sub->'keys'->>'auth', '');
begin
  if e !~ '^https://' or length(e) > 1000 or k = '' or a = '' or length(k) > 200 or length(a) > 100 then raise exception 'Suscripción no válida.'; end if;
  insert into push_subs (usuario, endpoint, p256dh, auth) values (u.nombre, e, k, a)
  on conflict (endpoint) do update set usuario = excluded.usuario, p256dh = excluded.p256dh, auth = excluded.auth, activo = true, fallos = 0;
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.push_quitar(p_token text, p_endpoint text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'verificador');
begin
  update push_subs set activo = false where endpoint = btrim(coalesce(p_endpoint, ''));
  return jsonb_build_object('ok', true);
end $$;

-- ---------- para la función frecs-bot (clave de servicio) ----------
-- Claves VAPID: se crean una vez (la función las genera) y se guardan en el Vault
create or replace function public.sb_push_vapid() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select decrypted_secret::jsonb from vault.decrypted_secrets where name = 'frecs_push' limit 1), '{}'::jsonb)
$$;
create or replace function public.sb_push_vapid_guardar(p_claves jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_claves->>'publicKey', '') = '' or coalesce(p_claves->>'privateKey', '') = '' then raise exception 'Claves no válidas.'; end if;
  if not exists (select 1 from vault.secrets where name = 'frecs_push') then
    perform vault.create_secret(jsonb_build_object('publicKey', p_claves->>'publicKey', 'privateKey', p_claves->>'privateKey')::text, 'frecs_push', 'Frecs: claves de las notificaciones');
  end if;
  return sb_push_vapid();
end $$;
-- A quiénes (activos; sin la persona que lo causó)
create or replace function public.sb_push_subs(p_excluir text default null, p_usuario text default null) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'endpoint', endpoint, 'p256dh', p256dh, 'auth', auth) order by id), '[]'::jsonb)
    from push_subs where activo
     and (p_excluir is null or lower(btrim(usuario)) <> lower(btrim(p_excluir)))
     and (p_usuario is null or lower(btrim(usuario)) = lower(btrim(p_usuario)))
$$;
-- Cómo le fue a cada envío: el servicio de push dice 404 / 410 cuando la suscripción ya no existe
create or replace function public.sb_push_resultado(p_ok jsonb, p_fuera jsonb) returns void
language sql security definer set search_path = public as $$
  update push_subs set ultimo_ok = now(), fallos = 0 where id in (select x::bigint from jsonb_array_elements_text(coalesce(p_ok, '[]'::jsonb)) x);
  update push_subs set activo = false, fallos = fallos + 1 where id in (select x::bigint from jsonb_array_elements_text(coalesce(p_fuera, '[]'::jsonb)) x);
$$;
-- El reporte de vacío recién creado
create or replace function public.sb_push_reporte(p_id bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(r) - 'lotes' from (select id, tipo, modulo, sku_sistema, producto_sistema, detalle_sistema, reportado_por, reportado_en, estado
    from reportes_modulo where id = p_id) r
$$;
-- Lotes que llegaron a su límite para bloquearlos (cada uno una sola vez: quedan anotados)
create or replace function public.sb_push_vencer() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  with l as (
    select w.sku, coalesce(nullif(w.producto, ''), w.sku) as producto, w.modulo, w.vence,
           (w.vence - (now() at time zone 'America/Bogota')::date) as dias,
           coalesce(s.t2::int, case when coalesce(s.empaque, '') = 'Barriles' or coalesce(s.presentacion, '') ~* 'barril'
                                     or coalesce(w.producto, '') ~* '\m(brr|brrl|barril)\M' then 10 else 30 end) as umbral,
           w.sku || '|' || w.modulo || '|' || w.vence::text as clave
      from wms_base w left join sku s on s.sku = w.sku
     where upper(coalesce(w.estado, '')) = 'DISPONIBLE' and w.vence is not null
       and (coalesce(w.estibas, 0) > 0 or coalesce(w.cajas, 0) > 0 or coalesce(w.unidades, 0) > 0)
  ), nuevos as (
    select distinct on (clave) * from l where dias <= umbral and not exists (select 1 from push_avisados a where a.clave = l.clave) order by clave
  ), anotados as (
    insert into push_avisados (clave) select clave from nuevos on conflict do nothing returning clave
  )
  select coalesce(jsonb_agg(jsonb_build_object('sku', n.sku, 'producto', n.producto, 'modulo', n.modulo, 'vence', n.vence, 'dias', n.dias, 'umbral', n.umbral) order by n.dias, n.modulo), '[]'::jsonb)
    into r from nuevos n where n.clave in (select clave from anotados);
  return r;
end $$;

-- ---------- quién lo dispara ----------
create or replace function public._push_llamar(p_cuerpo jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare url text; sec text;
begin
  if not exists (select 1 from push_subs where activo) then return; end if;
  select valor into url from frecs_config where clave = 'bot_funcion_url';
  select valor into sec from frecs_config where clave = 'bot_secreto';
  if coalesce(url, '') = '' or coalesce(sec, '') = '' then return; end if;
  perform net.http_post(url := url, body := p_cuerpo || jsonb_build_object('secreto', sec),
                        headers := '{"Content-Type": "application/json"}'::jsonb, timeout_milliseconds := 30000);
end $$;
-- Reporte de vacío: aviso al momento
create or replace function public._push_reporte_trg() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tipo = 'VACIO' then perform _push_llamar(jsonb_build_object('accion', 'push_reporte', 'id', new.id)); end if;
  return new;
end $$;
create or replace trigger push_reporte after insert on public.reportes_modulo for each row execute function public._push_reporte_trg();
-- Por vencer: todos los días a las 6:05 a. m. (Bogotá = 11:05 UTC)
create or replace function public.sb_push_tic_vencer() returns void
language sql security definer set search_path = public as $$ select _push_llamar(jsonb_build_object('accion', 'push_vencer')) $$;
select cron.schedule('frecs-push-vencer', '5 11 * * *', 'select public.sb_push_tic_vencer()');

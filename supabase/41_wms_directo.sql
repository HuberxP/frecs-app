-- =====================================================================
-- FRECS! · 41 · Supabase consulta el WMS directamente (solo GET)
-- ---------------------------------------------------------------------
-- La función frecs-bot trae el inventario del WMS (wms.ts) y lo guarda con sb_reemplazar_wms.
--   · La conexión (direcciones, centro, usuario y clave) la deja Apps Script una sola vez en el
--     Vault de Supabase (sb_wms_config_guardar): no queda en el código ni en GitHub.
--   · La sesión del WMS (token) se guarda y se reutiliza mientras sirva (wms_sesion).
--   · Sincronización automática (switch del administrador): pg_cron revisa cada minuto
--     (sb_wms_tic) y, cuando toca, llama a la función; la siguiente queda entre 30 y 45 minutos
--     después, con minutos y segundos al azar (nunca el mismo intervalo).
--   · frecs_config «sync_auto» = { on, por, en, prox, ult, ok, msg } (la página lo muestra).
-- Todo esto solo lo usa la función (clave de servicio) o el administrador con su sesión.
-- =====================================================================
create table if not exists public.wms_sesion (
  id          int primary key default 1 check (id = 1),
  token       text,
  actualizado timestamptz
);
alter table public.wms_sesion enable row level security;

-- Conexión al WMS → Vault (secreto «frecs_wms»). Devuelve solo los nombres de los campos guardados.
create or replace function public.sb_wms_config_guardar(p_cfg jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v uuid; k text;
begin
  if jsonb_typeof(p_cfg) <> 'object' then raise exception 'Configuración no válida.'; end if;
  foreach k in array array['login_url', 'inventarios_url', 'cd_id', 'usuario', 'clave'] loop
    if coalesce(p_cfg->>k, '') = '' then raise exception 'Falta % en la conexión al WMS.', k; end if;
  end loop;
  if (p_cfg->>'login_url') !~ '^https://' or (p_cfg->>'inventarios_url') !~ '^https://' then raise exception 'Las direcciones del WMS deben empezar por https://'; end if;
  select id into v from vault.secrets where name = 'frecs_wms';
  if v is null then perform vault.create_secret(p_cfg::text, 'frecs_wms', 'Frecs: conexión al WMS (solo lectura)');
  else perform vault.update_secret(v, p_cfg::text); end if;
  update wms_sesion set token = null, actualizado = now() where id = 1;   -- con otra cuenta, sesión nueva
  return jsonb_build_object('ok', true, 'campos', (select jsonb_agg(x order by x) from jsonb_object_keys(p_cfg) x));
end $$;

-- La conexión y la última sesión (solo la función frecs-bot)
create or replace function public.sb_wms_config() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select decrypted_secret::jsonb from vault.decrypted_secrets where name = 'frecs_wms' limit 1), '{}'::jsonb)
         || jsonb_build_object('token', coalesce((select token from wms_sesion where id = 1), ''))
$$;
create or replace function public.sb_wms_token(p_token text) returns void
language sql security definer set search_path = public as $$
  insert into wms_sesion (id, token, actualizado) values (1, nullif(p_token, ''), now())
  on conflict (id) do update set token = excluded.token, actualizado = excluded.actualizado
$$;
-- Ubicaciones con producto de la última sincronización (para no reemplazar si llega mucho menos)
create or replace function public.sb_wms_previo() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('filas', coalesce((select filas from sync_estado where id = 1), 0))
$$;

-- ---------- estado de la automática (frecs_config «sync_auto») ----------
create or replace function public._iso(t timestamptz) returns text
language sql immutable as $$ select case when t is null then '' else to_char(t at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end $$;
create or replace function public._sync_auto_estado() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select valor::jsonb from frecs_config where clave = 'sync_auto'), '{}'::jsonb)
$$;
create or replace function public._sync_auto_guardar(e jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  insert into frecs_config (clave, valor) values ('sync_auto', e::text) on conflict (clave) do update set valor = excluded.valor;
  return e;
end $$;
-- La siguiente: entre 30 y 45 minutos, con minutos y segundos al azar
create or replace function public._sync_auto_prox(desde timestamptz) returns timestamptz
language sql volatile as $$ select desde + make_interval(secs => round((30 + random() * 15) * 60 + random() * 59)) $$;

-- Prender / apagar (solo el administrador, desde su perfil)
create or replace function public.sync_auto_poner(p_token text, p_on boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'administrador'); e jsonb := _sync_auto_estado();
begin
  e := e || jsonb_build_object('on', coalesce(p_on, false), 'por', u.nombre, 'en', _iso(now()),
                               'prox', case when coalesce(p_on, false) then _iso(_sync_auto_prox(now())) else '' end, 'corre', '', 'modo', 'supabase');
  return _sync_auto_guardar(e);
end $$;

-- Resultado de una sincronización (la función frecs-bot). Automática: queda la última (ult, ok, msg)
-- y se devuelve cómo le fue a la anterior (para avisar solo si cambia). Manual buena con la automática
-- prendida: la siguiente automática cuenta desde ahora (no repite al rato).
create or replace function public.sb_wms_resultado(p_auto boolean, p_ok boolean, p_msg text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e jsonb := _sync_auto_estado(); antes boolean := coalesce((_sync_auto_estado()->>'ok')::boolean, true);
begin
  if coalesce(p_auto, false) then
    e := e || jsonb_build_object('ult', _iso(now()), 'ok', coalesce(p_ok, false), 'msg', left(coalesce(p_msg, ''), 300), 'corre', '');
  elsif coalesce(p_ok, false) and coalesce((e->>'on')::boolean, false) then
    e := e || jsonb_build_object('prox', _iso(_sync_auto_prox(now())));
  else
    return jsonb_build_object('antes_ok', antes);
  end if;
  perform _sync_auto_guardar(e);
  return jsonb_build_object('antes_ok', antes);
end $$;

-- Cada minuto (pg_cron): si la automática está prendida y ya es la hora, la lanza (una sola vez)
create or replace function public.sb_wms_tic() returns text
language plpgsql security definer set search_path = public as $$
declare e jsonb := _sync_auto_estado(); url text; sec text;
begin
  if not coalesce((e->>'on')::boolean, false) then return 'apagada'; end if;
  if coalesce(e->>'prox', '') <> '' and (e->>'prox')::timestamptz > now() then return 'espera'; end if;
  if coalesce(e->>'corre', '') <> '' and (e->>'corre')::timestamptz > now() - interval '10 minutes' then return 'corriendo'; end if;
  select valor into url from frecs_config where clave = 'bot_funcion_url';
  select valor into sec from frecs_config where clave = 'bot_secreto';
  if coalesce(url, '') = '' or coalesce(sec, '') = '' then return 'sin función'; end if;
  perform _sync_auto_guardar(e || jsonb_build_object('prox', _iso(_sync_auto_prox(now())), 'corre', _iso(now())));
  perform net.http_post(url := url, body := jsonb_build_object('accion', 'wms_sync', 'secreto', sec, 'auto', true),
                        headers := '{"Content-Type": "application/json"}'::jsonb, timeout_milliseconds := 120000);
  return 'lanzada';
end $$;

-- Programar el tic (cada minuto). Si ya existe con ese nombre, se actualiza.
select cron.schedule('frecs-wms-auto', '* * * * *', 'select public.sb_wms_tic()');

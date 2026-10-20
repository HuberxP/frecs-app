-- =====================================================================
-- FRECS! · 43 · Solo lo que cambió en el WMS (cada 2 a 4 minutos) + todo cada 2 a 3 horas
-- ---------------------------------------------------------------------
-- Con la automática prendida, pg_cron revisa cada minuto (sb_wms_tic):
--   · «cambios»: cada 2 a 4 minutos al azar la función frecs-bot le pregunta al WMS qué módulos se
--     actualizaron desde la última vez; si hay, trae esos módulos completos y cambia solo esos.
--   · «completa»: cada 2 a 3 horas al azar, todo el inventario (red de seguridad: lo que se borre
--     en el WMS no aparece como cambio).
-- frecs_config «sync_auto» = { on, por, en, prox, ult, ok, msg, corre,      ← la completa
--                              dprox, ddesde, dult, dok, dmsg, dn, dcorre } ← los cambios
-- =====================================================================

-- La siguiente completa: entre 2 y 3 horas (antes 30–45 min); los cambios: entre 2 y 4 minutos
create or replace function public._sync_auto_prox(desde timestamptz) returns timestamptz
language sql volatile as $$ select desde + make_interval(secs => round((120 + random() * 60) * 60 + random() * 59)) $$;
create or replace function public._sync_delta_prox(desde timestamptz) returns timestamptz
language sql volatile as $$ select desde + make_interval(secs => round(120 + random() * 120)) $$;

-- Lo que hay ahora en la base (para cambiar solo los módulos que se movieron)
create or replace function public.sb_wms_actual() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'filas', coalesce((select jsonb_agg(jsonb_build_object('sku', sku, 'producto', producto, 'modulo', modulo, 'estibas', estibas, 'cajas', cajas, 'unidades', unidades,
        'vence', vence, 'dias', dias, 'estado', estado, 'candado', candado, 'carga', carga, 'familia', familia, 'cajas_por_estiba', cajas_por_estiba, 'obs', obs,
        'picking', picking, 'actualizacion', actualizacion) order by id) from wms_base), '[]'::jsonb),
    'modulos', coalesce((select jsonb_agg(to_jsonb(m)) from wms_modulos m), '[]'::jsonb),
    'ultimo_movimiento', (select ultimo_movimiento from sync_estado where id = 1))
$$;

-- Desde cuándo preguntar: la última revisión de cambios o, si no hay, la última sincronización
create or replace function public.sb_wms_delta_desde() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(_sync_auto_estado()->>'ddesde', ''), _iso((select ultima_sync from sync_estado where id = 1) - interval '2 minutes'), _iso(now() - interval '10 minutes'))
$$;
-- Cómo le fue a la revisión de cambios (y hasta dónde quedó revisado)
create or replace function public.sb_wms_delta_fin(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e jsonb := _sync_auto_estado();
begin
  e := e || jsonb_build_object('dult', _iso(now()), 'dok', coalesce((p->>'ok')::boolean, false), 'dmsg', left(coalesce(p->>'msg', ''), 200),
                               'dn', coalesce((p->>'n')::int, 0), 'dcorre', '');
  if coalesce((p->>'ok')::boolean, false) and coalesce(p->>'hasta', '') <> '' then e := e || jsonb_build_object('ddesde', p->>'hasta'); end if;
  return _sync_auto_guardar(e);
end $$;

-- Prender / apagar: la completa en 2–3 h y los cambios ya mismo
create or replace function public.sync_auto_poner(p_token text, p_on boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'administrador'); e jsonb := _sync_auto_estado();
begin
  e := e || jsonb_build_object('on', coalesce(p_on, false), 'por', u.nombre, 'en', _iso(now()),
                               'prox', case when coalesce(p_on, false) then _iso(_sync_auto_prox(now())) else '' end,
                               'dprox', case when coalesce(p_on, false) then _iso(now()) else '' end, 'corre', '', 'dcorre', '', 'modo', 'supabase');
  return _sync_auto_guardar(e);
end $$;

-- Cada minuto (pg_cron): primero la completa si ya toca; si no, los cambios si ya toca (una sola cosa a la vez)
create or replace function public.sb_wms_tic() returns text
language plpgsql security definer set search_path = public as $$
declare e jsonb := _sync_auto_estado(); url text; sec text; accion text;
begin
  if not coalesce((e->>'on')::boolean, false) then return 'apagada'; end if;
  if not exists (select 1 from vault.secrets where name = 'frecs_wms') then return 'sin conexión (la hace Apps Script)'; end if;
  if coalesce(e->>'corre', '') <> '' and (e->>'corre')::timestamptz > now() - interval '10 minutes' then return 'corriendo'; end if;
  if coalesce(e->>'dcorre', '') <> '' and (e->>'dcorre')::timestamptz > now() - interval '3 minutes' then return 'revisando cambios'; end if;
  select valor into url from frecs_config where clave = 'bot_funcion_url';
  select valor into sec from frecs_config where clave = 'bot_secreto';
  if coalesce(url, '') = '' or coalesce(sec, '') = '' then return 'sin función'; end if;
  if coalesce(e->>'prox', '') = '' or (e->>'prox')::timestamptz <= now() then
    accion := 'wms_sync';
    perform _sync_auto_guardar(e || jsonb_build_object('prox', _iso(_sync_auto_prox(now())), 'corre', _iso(now())));
  elsif coalesce(e->>'dprox', '') = '' or (e->>'dprox')::timestamptz <= now() then
    accion := 'wms_cambios';
    perform _sync_auto_guardar(e || jsonb_build_object('dprox', _iso(_sync_delta_prox(now())), 'dcorre', _iso(now())));
  else
    return 'espera';
  end if;
  perform net.http_post(url := url, body := jsonb_build_object('accion', accion, 'secreto', sec, 'auto', true),
                        headers := '{"Content-Type": "application/json"}'::jsonb, timeout_milliseconds := 120000);
  return 'lanzada: ' || accion;
end $$;

-- Si ya estaba prendida, la siguiente completa pasa a 2–3 h y los cambios arrancan ya
update frecs_config set valor = (valor::jsonb || jsonb_build_object('prox', _iso(_sync_auto_prox(now())), 'dprox', _iso(now())))::text
 where clave = 'sync_auto' and coalesce((valor::jsonb->>'on')::boolean, false);

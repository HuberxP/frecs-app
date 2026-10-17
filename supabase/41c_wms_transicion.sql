-- =====================================================================
-- FRECS! · 41c · Paso de Apps Script a Supabase sin que choquen
-- ---------------------------------------------------------------------
-- Mientras la conexión al WMS no esté en el Vault (Apps Script no ha corrido pasarWmsASupabase),
-- la automática la sigue haciendo Apps Script y aquí no se lanza nada. Al guardar la conexión,
-- si la automática está prendida, la siguiente queda en 30 a 45 minutos (ya la lleva Supabase).
-- =====================================================================
create or replace function public.sb_wms_tic() returns text
language plpgsql security definer set search_path = public as $$
declare e jsonb := _sync_auto_estado(); url text; sec text;
begin
  if not coalesce((e->>'on')::boolean, false) then return 'apagada'; end if;
  if not exists (select 1 from vault.secrets where name = 'frecs_wms') then return 'sin conexión (la hace Apps Script)'; end if;
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

create or replace function public.sb_wms_config_guardar(p_cfg jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v uuid; k text; e jsonb := _sync_auto_estado();
begin
  if jsonb_typeof(p_cfg) <> 'object' then raise exception 'Configuración no válida.'; end if;
  foreach k in array array['login_url', 'inventarios_url', 'cd_id', 'usuario', 'clave'] loop
    if coalesce(p_cfg->>k, '') = '' then raise exception 'Falta % en la conexión al WMS.', k; end if;
  end loop;
  if (p_cfg->>'login_url') !~ '^https://' or (p_cfg->>'inventarios_url') !~ '^https://' then raise exception 'Las direcciones del WMS deben empezar por https://'; end if;
  select id into v from vault.secrets where name = 'frecs_wms';
  if v is null then perform vault.create_secret(p_cfg::text, 'frecs_wms', 'Frecs: conexión al WMS (solo lectura)');
  else perform vault.update_secret(v, p_cfg::text); end if;
  update wms_sesion set token = null, actualizado = now() where id = 1;
  if coalesce((e->>'on')::boolean, false) then
    perform _sync_auto_guardar(e || jsonb_build_object('prox', _iso(_sync_auto_prox(now())), 'corre', '', 'modo', 'supabase'));
  end if;
  return jsonb_build_object('ok', true, 'campos', (select jsonb_agg(x order by x) from jsonb_object_keys(p_cfg) x));
end $$;

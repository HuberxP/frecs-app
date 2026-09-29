-- =====================================================================
-- FRECS! · FASE 5 · El bot de Telegram en Supabase (función frecs-bot)
-- ---------------------------------------------------------------------
-- · sb_datos_bot: los mismos datos que usa la página (inventario, maestros y turnos),
--   para el bot. Solo con la clave secreta (la función la tiene; el navegador no).
-- · bot_cache: la memoria corta del bot (pasos del registro de limbo, botones largos,
--   mensajes de Telegram ya atendidos). Antes vivía en CacheService de Apps Script.
-- · Depósito "frecs" (privado): ahí se sube el instructivo (instructivo.pdf).
-- =====================================================================

create or replace function public.sb_datos_bot(p_extra jsonb default '[]'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare tz constant text := 'America/Bogota';
begin
  return jsonb_build_object(
    'usuario', jsonb_build_object('nombre', 'Bot', 'rol', 'administrador'),
    'generado', to_char(now() at time zone tz, 'YYYY-MM-DD HH24:MI:SS'),
    'sync', (select jsonb_build_object(
               'ultima_sync', (extract(epoch from s.ultima_sync) * 1000)::bigint,
               'ultimo_movimiento', (extract(epoch from s.ultimo_movimiento) * 1000)::bigint,
               'filas', s.filas, 'modulos', s.modulos) from sync_estado s where id = 1),
    'wms_base', coalesce((select jsonb_agg(jsonb_build_array(sku, coalesce(producto, ''), modulo, estibas, cajas, unidades,
        coalesce(to_char(vence, 'YYYY-MM-DD'), ''), coalesce(dias, 9999), coalesce(estado, ''), coalesce(candado, ''),
        coalesce(to_char(carga at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), ''), coalesce(familia, ''),
        coalesce(cajas_por_estiba, 1), coalesce(obs, ''), picking,
        coalesce(to_char(actualizacion at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), '')) order by id) from wms_base), '[]'::jsonb),
    'wms_modulos', coalesce((select jsonb_agg(jsonb_build_array(modulo, coalesce(nombre_wms, ''), coalesce(seccion, ''), coalesce(bodega, ''),
        coalesce(zona, ''), picking, con_producto, skus, lotes) order by modulo) from wms_modulos), '[]'::jsonb),
    'sku', coalesce((select jsonb_agg(jsonb_build_array(coalesce(id_hoja, ''), sku, producto, coalesce(cubicaje, ''), coalesce(piso, ''),
        coalesce(plancha, ''), coalesce(cant_x_estiba, ''), coalesce(presentacion, ''), coalesce(usuario, ''), coalesce(contexto, ''),
        coalesce(minimo::text, ''), coalesce(t1::text, ''), coalesce(t2::text, ''), coalesce(ka::text, ''), coalesce(estibas_por_cara::text, ''))
        order by sku) from sku), '[]'::jsonb),
    'canales', coalesce((select jsonb_agg(jsonb_build_array(canal, tipo, valor, dias_minimos, coalesce(nota, '')) order by orden, id) from canales), '[]'::jsonb),
    'capacidad', coalesce((select jsonb_agg(jsonb_build_array(modulo, caras, coalesce(capacidad::text, '')) order by modulo) from capacidad_bodega), '[]'::jsonb),
    'consumo', coalesce((select jsonb_agg(jsonb_build_array(sku, coalesce(producto, ''), coalesce(modulo_elegido, ''), coalesce(elegido_por, ''),
        coalesce(to_char(elegido_en at time zone tz, 'YYYY-MM-DD HH24:MI:SS'), '')) order by orden, sku) from consumo), '[]'::jsonb),
    'limbo', coalesce((select jsonb_agg(jsonb_build_array(id, producto, coalesce(vencimiento, ''), coalesce(presentacion, ''), coalesce(cubicaje, ''),
        coalesce(fecha_reporte, '')) order by id) from limbo), '[]'::jsonb)
  ) || _datos_turnos(p_extra);
end $$;

create table if not exists public.bot_cache (
  clave text primary key,
  valor text not null,
  vence timestamptz not null
);
alter table public.bot_cache enable row level security;
revoke all on table public.bot_cache from anon, authenticated;

-- Lo vigente (y de paso se borra lo vencido)
create or replace function public.sb_bot_cache_leer()
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  delete from bot_cache where vence < now();
  return coalesce((select jsonb_object_agg(clave, valor) from bot_cache), '{}'::jsonb);
end $$;

-- p_poner = { clave: [valor, segundos] } · p_quitar = [claves]
create or replace function public.sb_bot_cache_guardar(p_poner jsonb default '{}'::jsonb, p_quitar jsonb default '[]'::jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from bot_cache where clave in (select jsonb_array_elements_text(coalesce(p_quitar, '[]'::jsonb)));
  insert into bot_cache (clave, valor, vence)
  select k, v->>0, now() + make_interval(secs => coalesce((v->>1)::int, 600)) from jsonb_each(coalesce(p_poner, '{}'::jsonb)) as e(k, v)
  on conflict (clave) do update set valor = excluded.valor, vence = excluded.vence;
  get diagnostics n = row_count;
  return n;
end $$;

-- Marca un mensaje de Telegram como atendido. Devuelve false si ya lo estaba (Telegram lo reenvió).
create or replace function public.sb_bot_update_nuevo(p_update bigint)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into bot_cache (clave, valor, vence) values ('upd_' || p_update, '1', now() + interval '6 hours');
  return true;
exception when unique_violation then
  return false;
end $$;

-- Configuración del bot (la pone Apps Script con sbPasarBotASupabase): grupo, chats permitidos,
-- dirección del dashboard y de Apps Script, y los secretos compartidos (webhook y Apps Script)
create or replace function public.sb_bot_config()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(clave, valor), '{}'::jsonb) from frecs_config where clave like 'bot\_%'
$$;
create or replace function public.sb_bot_config_guardar(p_config jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  insert into frecs_config (clave, valor)
  select k, v from jsonb_each_text(coalesce(p_config, '{}'::jsonb)) as e(k, v) where k like 'bot\_%'
  on conflict (clave) do update set valor = excluded.valor;
  delete from frecs_config where clave like 'bot\_%' and clave in (select k from jsonb_each_text(coalesce(p_config, '{}'::jsonb)) as e(k, v) where v = '');
  return sb_bot_config() - 'bot_secreto' - 'bot_webhook_secreto';
end $$;

-- Alertas de las 6 a.m. y 2 p.m. (hora de Bogotá = 11:00 y 19:00 UTC) con pg_cron + pg_net.
-- Las activa sbPasarBotASupabase y las quita sbVolverBotAAppsScript (Apps Script).
do $$ begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then create extension if not exists pg_cron with schema pg_catalog; end if;
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then create extension if not exists pg_net with schema extensions; end if;
end $$;

create or replace function public.sb_bot_alertas(p_activar boolean)
returns text
language plpgsql security definer set search_path = public as $$
declare cmd constant text := $c$select net.http_post(
    url := (select valor from public.frecs_config where clave = 'bot_funcion_url'),
    body := jsonb_build_object('accion', 'alerta', 'secreto', (select valor from public.frecs_config where clave = 'bot_secreto')),
    headers := '{"Content-Type": "application/json"}'::jsonb)$c$;
begin
  if to_regnamespace('cron') is null or to_regnamespace('net') is null then raise exception 'Faltan las extensiones pg_cron y pg_net en Supabase.'; end if;
  perform cron.unschedule(jobname) from cron.job where jobname in ('frecs-alerta-6', 'frecs-alerta-14');
  if p_activar then
    perform cron.schedule('frecs-alerta-6', '0 11 * * *', cmd);
    perform cron.schedule('frecs-alerta-14', '0 19 * * *', cmd);
    return 'activadas';
  end if;
  return 'quitadas';
end $$;
revoke execute on function public.sb_bot_alertas(boolean) from public, anon, authenticated;
grant execute on function public.sb_bot_alertas(boolean) to service_role;

-- Depósito privado para el instructivo del bot
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('frecs', 'frecs', false) on conflict (id) do nothing;
  end if;
end $$;

revoke execute on function public.sb_datos_bot(jsonb) from public, anon, authenticated;
revoke execute on function public.sb_bot_config() from public, anon, authenticated;
revoke execute on function public.sb_bot_config_guardar(jsonb) from public, anon, authenticated;
grant execute on function public.sb_bot_config() to service_role;
grant execute on function public.sb_bot_config_guardar(jsonb) to service_role;
revoke execute on function public.sb_bot_cache_leer() from public, anon, authenticated;
revoke execute on function public.sb_bot_cache_guardar(jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.sb_bot_update_nuevo(bigint) from public, anon, authenticated;
grant execute on function public.sb_datos_bot(jsonb) to service_role;
grant execute on function public.sb_bot_cache_leer() to service_role;
grant execute on function public.sb_bot_cache_guardar(jsonb, jsonb) to service_role;
grant execute on function public.sb_bot_update_nuevo(bigint) to service_role;

-- =====================================================================
-- FRECS! · Limpieza automática (para no gastar la cuota gratuita)
-- ---------------------------------------------------------------------
-- Todos los días a las 3:17 a.m. (Bogotá = 08:17 UTC) se borra lo que ya no sirve:
--   · sesiones vencidas e intentos de ingreso viejos
--   · memoria del bot vencida
--   · el registro de pg_cron de más de 30 días
-- El inventario del WMS NO crece: cada sincronización reemplaza el anterior.
-- El historial de turnos y conciliaciones se conserva (ocupa muy poco).
-- =====================================================================
create or replace function public.sb_limpieza()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare n1 int; n2 int; n3 int; n4 int := 0;
begin
  delete from sesiones where expira < now();
  get diagnostics n1 = row_count;
  delete from intentos_ingreso where coalesce(bloqueado_hasta, now()) < now() - interval '1 day';
  get diagnostics n2 = row_count;
  delete from bot_cache where vence < now();
  get diagnostics n3 = row_count;
  if to_regclass('cron.job_run_details') is not null then
    execute 'delete from cron.job_run_details where end_time < now() - interval ''30 days''';
    get diagnostics n4 = row_count;
  end if;
  return jsonb_build_object('sesiones', n1, 'intentos', n2, 'bot_cache', n3, 'cron', n4);
end $$;
revoke execute on function public.sb_limpieza() from public, anon, authenticated;
grant execute on function public.sb_limpieza() to service_role;

do $$ begin
  if to_regnamespace('cron') is not null then
    perform cron.unschedule(jobname) from cron.job where jobname = 'frecs-limpieza';
    perform cron.schedule('frecs-limpieza', '17 8 * * *', 'select public.sb_limpieza()');
  end if;
end $$;

-- =====================================================================
-- FRECS! · 33 · «Actualizar módulos»: el rotador marca los módulos que ya revisó
-- ---------------------------------------------------------------------
-- En la sección Actualizar (rotador / administrador) cada módulo tiene un semáforo: queda en verde si
-- desde la última sincronización alguien lo corrigió, lo quitó, lo bloqueó, le añadió producto o lo
-- marcó «✅ Está bien». Esta tabla guarda esa última marca. Al sincronizar vuelve a empezar.
-- =====================================================================
create table if not exists public.revisiones_modulo (
  id         bigint generated always as identity primary key,
  modulo     text not null,
  por        text not null,
  en         timestamptz not null default now(),
  sync_base  timestamptz,
  quitada    boolean not null default false
);
alter table public.revisiones_modulo enable row level security;

-- [módulo, por, en] (la última de cada módulo, desde la última sincronización)
create or replace function public._revisiones_json() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_agg(jsonb_build_array(r.modulo, r.por, to_char(r.en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS')) order by r.modulo)
    from (select distinct on (modulo) modulo, por, en, quitada from revisiones_modulo
           where sync_base is not distinct from (select ultima_sync from sync_estado where id = 1)
           order by modulo, id desc) r where not r.quitada), '[]'::jsonb)
$$;

-- ✅ Está bien (p_ok = true) o quitar la marca (p_ok = false)
create or replace function public.revision_marcar(p_token text, p_modulo text, p_ok boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'validador'); m text := upper(btrim(coalesce(p_modulo, '')));
begin
  if m = '' or length(m) > 30 then raise exception 'Escribe el módulo.'; end if;
  insert into revisiones_modulo (modulo, por, sync_base, quitada) values (m, u.nombre, (select ultima_sync from sync_estado where id = 1), not coalesce(p_ok, true));
  return _revisiones_json();
end $$;
grant execute on function public.revision_marcar(text, text, boolean) to anon, authenticated, service_role;

-- La página las recibe con sus datos
do $$
declare
  d text; n int;
  a constant text := $q$'bloqueos', _bloqueos_json()$q$;
  b constant text := $q$'bloqueos', _bloqueos_json(), 'revisiones', _revisiones_json()$q$;
begin
  select pg_get_functiondef('public.datos_consulta(text, jsonb)'::regprocedure) into d;
  if position(b in d) = 0 then
    n := (length(d) - length(replace(d, a, ''))) / length(a);
    if n <> 1 then raise exception 'datos_consulta: bloqueos encontrado % veces', n; end if;
    execute replace(d, a, b);
  end if;
end $$;

-- La marca de cambios también mira las revisiones
create or replace function public.cambios_marca(p_token text) returns text
language plpgsql stable security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'lector');
begin
  return concat_ws('|',
    (select extract(epoch from ultima_sync)::bigint from sync_estado where id = 1),
    (select extract(epoch from greatest(max(en), max(deshecho_en)))::bigint || ':' || count(*) from ajustes_sin_wms),
    (select extract(epoch from greatest(max(en), max(deshecho_en)))::bigint || ':' || count(*) from bloqueos_sin_wms),
    (select extract(epoch from greatest(max(marcado_en), max(quitado_en)))::bigint || ':' || count(*) from marcas_consumo),
    (select extract(epoch from greatest(max(reportado_en), max(completado_en)))::bigint || ':' || count(*) from reportes_modulo),
    (select extract(epoch from max(elegido_en))::bigint || ':' || count(*) || ':' || count(modulo_elegido) from consumo),
    (select extract(epoch from max(en))::bigint || ':' || count(*) from revisiones_modulo));
end $$;

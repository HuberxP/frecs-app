-- =====================================================================
-- FRECS! · 55 · Usuarios: sesiones abiertas y cerrarlas
-- ---------------------------------------------------------------------
-- La lista de usuarios (solo administrador) trae cuántas sesiones abiertas tiene cada uno (equipos
-- donde ingresó y no han vencido) y cuándo la usó por última vez (se guarda cada 10 minutos).
-- «Cerrar sesión» vence sus sesiones: tendrá que ingresar de nuevo con su PIN. No borra nada
-- (la sesión queda vencida) y nunca cierra la sesión del administrador que lo hace.
-- =====================================================================
create or replace function public.usuarios_listar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'administrador');
begin
  return coalesce((select jsonb_agg(jsonb_build_object('nombre', p.nombre, 'rol', p.rol, 'activo', p.activo,
      'creado', p.creado, 'creadoPor', p.creado_por, 'ultimo', p.ultimo_acceso,
      'sesiones', (select count(*) from sesiones s where s.perfil_id = p.id and s.expira > now()),
      'usado', (select to_char(max(s.usada) at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS') from sesiones s where s.perfil_id = p.id and s.expira > now()),
      'min', (select round(extract(epoch from now() - max(s.usada)) / 60) from sesiones s where s.perfil_id = p.id and s.expira > now())) order by p.nombre) from perfiles p), '[]'::jsonb);
end $$;

create or replace function public.usuario_cerrar_sesiones(p_token text, p_nombre text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare u public.perfiles := _sesion(p_token, 'administrador'); x public.perfiles; n int;
begin
  select * into x from perfiles where nombre = p_nombre;
  if not found then raise exception 'Ese usuario no existe.'; end if;
  update sesiones set expira = now()
   where perfil_id = x.id and expira > now() and token_hash <> encode(digest(p_token, 'sha256'), 'hex');
  get diagnostics n = row_count;
  if n = 0 then raise exception '% no tiene otras sesiones abiertas.', x.nombre; end if;
  return usuarios_listar(p_token);
end $$;

grant execute on function public.usuarios_listar(text) to anon, authenticated;
grant execute on function public.usuario_cerrar_sesiones(text, text) to anon, authenticated;

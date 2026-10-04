-- =====================================================================
-- FRECS! · 16 · Pantalla de ingreso: nombres con su rol
-- ---------------------------------------------------------------------
-- La página agrupa los nombres por rol y los sugiere mientras se escribe.
-- «nombres» se deja igual (la versión anterior de la página lo usa).
-- =====================================================================
create or replace function public.ingreso_nombres() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'nombres', coalesce((select jsonb_agg(nombre order by nombre) from perfiles where activo), '[]'::jsonb),
    'usuarios', coalesce((select jsonb_agg(jsonb_build_object('n', nombre, 'r', rol) order by _nivel(rol) desc, rol, nombre) from perfiles where activo), '[]'::jsonb),
    'sinUsuarios', not exists (select 1 from perfiles))
$$;
grant execute on function public.ingreso_nombres() to anon, authenticated;

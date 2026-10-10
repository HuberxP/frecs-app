-- =====================================================================
-- FRECS! · 19b · El rol «opm» se puede guardar en perfiles
-- (aparte de la 19 porque borra la restricción y la vuelve a crear)
-- =====================================================================
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check check (rol in ('verificador', 'opm', 'lector', 'validador', 'administrador'));

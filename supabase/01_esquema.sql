-- =====================================================================
-- FRECS! · FASE 1 · Esquema de la base de datos en Supabase
-- ---------------------------------------------------------------------
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar TODO este archivo → Run.
-- Se puede volver a correr sin dañar datos (usa "if not exists" / "or replace").
--
-- Seguridad (léelo una vez):
--  * Todas las tablas tienen RLS activado y NINGUNA política: desde el navegador
--    nadie puede leer ni escribir una tabla directamente, aunque tenga la clave pública.
--  * El dashboard solo entra por FUNCIONES (rpc) que revisan la sesión y el rol,
--    igual que hoy hace 30_Web_Api con webAuth_. Si algo queda mal, queda cerrado,
--    no abierto.
--  * Apps Script (sincronizar el WMS, bot) usa la clave SECRETA, que nunca va al
--    navegador.
--  * Ingreso con NOMBRE + PIN, como hoy. Los PIN actuales siguen sirviendo: al
--    importar se copia su huella vieja y, en el primer ingreso bueno, se cambia
--    sola a bcrypt.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. USUARIOS, SESIONES Y CONFIGURACIÓN
-- ---------------------------------------------------------------------
create table if not exists public.frecs_config (
  clave text primary key,
  valor text not null
);

create table if not exists public.perfiles (
  id            bigint generated always as identity primary key,
  nombre        text not null,
  pin_hash      text,              -- bcrypt (nuevo)
  pin_legado    text,              -- huella SHA-256 de la hoja Usuarios (se borra al primer ingreso)
  rol           text not null default 'lector' check (rol in ('lector','validador','administrador')),
  activo        boolean not null default true,
  creado        timestamptz not null default now(),
  creado_por    text,
  ultimo_acceso timestamptz
);
create unique index if not exists perfiles_nombre_uk on public.perfiles (lower(btrim(nombre)));

create table if not exists public.intentos_ingreso (
  nombre_clave    text primary key,
  fallos          int not null default 0,
  bloqueado_hasta timestamptz
);

create table if not exists public.sesiones (
  token_hash text primary key,     -- se guarda la huella del token, nunca el token
  perfil_id  bigint not null references public.perfiles(id) on delete cascade,
  creada     timestamptz not null default now(),
  usada      timestamptz not null default now(),
  expira     timestamptz not null
);
create index if not exists sesiones_perfil_ix on public.sesiones (perfil_id);

-- ---------------------------------------------------------------------
-- 2. INVENTARIO DEL WMS (lo escribe solo la sincronización)
-- ---------------------------------------------------------------------
create table if not exists public.wms_base (
  id               bigint generated always as identity primary key,
  sku              text not null,
  producto         text,
  modulo           text not null,
  estibas          numeric not null default 0,
  cajas            numeric not null default 0,
  unidades         numeric not null default 0,
  vence            date,
  dias             int,
  estado           text,
  candado          text,
  carga            timestamptz,
  familia          text,
  cajas_por_estiba numeric,
  obs              text,
  picking          boolean not null default false,
  actualizacion    timestamptz
);
create index if not exists wms_base_sku_ix on public.wms_base (sku);
create index if not exists wms_base_modulo_ix on public.wms_base (modulo);

create table if not exists public.wms_modulos (
  modulo       text primary key,
  nombre_wms   text,
  seccion      text,
  bodega       text,
  zona         text,
  picking      boolean not null default false,
  con_producto boolean not null default false,
  skus         int not null default 0,
  lotes        int not null default 0
);

-- Una sola fila con el estado de la última sincronización
create table if not exists public.sync_estado (
  id                int primary key default 1 check (id = 1),
  ultima_sync       timestamptz,
  ultimo_movimiento timestamptz,
  filas             int,
  modulos           int,
  por               text
);

-- ---------------------------------------------------------------------
-- 3. MAESTROS (antes: pestañas del libro principal)
-- ---------------------------------------------------------------------
create table if not exists public.sku (
  sku              text primary key,
  id_hoja          text,
  producto         text not null,
  cubicaje         text,
  piso             text,
  plancha          text,
  cant_x_estiba    text,
  presentacion     text,
  usuario          text,
  contexto         text,
  minimo           numeric,        -- vacío = 10
  t1               numeric,        -- días mínimos por canal (vacío = regla general)
  t2               numeric,
  ka               numeric,
  estibas_por_cara numeric
);

create table if not exists public.canales (
  id           bigint generated always as identity primary key,
  orden        int not null default 0,
  canal        text not null check (canal in ('T1','T2','KA')),
  tipo         text not null check (tipo in ('General','Familia','Contiene')),
  valor        text not null default '',
  dias_minimos int not null,
  nota         text
);

create table if not exists public.capacidad_bodega (
  modulo    text primary key,
  caras     int not null,
  capacidad int
);

create table if not exists public.consumo (
  sku            text primary key,
  producto       text,
  modulo_elegido text,
  elegido_por    text,
  elegido_en     timestamptz,
  orden          int not null default 0
);

create table if not exists public.limbo (
  id            text primary key,
  producto      text not null,
  vencimiento   text,
  presentacion  text,
  cubicaje      text,
  fecha_reporte text
);

create table if not exists public.destinos (
  nombre text primary key,
  orden  int not null default 0
);

-- ---------------------------------------------------------------------
-- 4. TURNOS, VALIDACIÓN Y ENTREGA
-- (Ya no hay pestañas "Hist": el historial es la misma tabla filtrada por turno)
-- ---------------------------------------------------------------------
create table if not exists public.turnos (
  id            text primary key,           -- se conservan los ID de la hoja (T20260927-…)
  numero        int check (numero in (1,2,3)),
  fecha         date,
  estado        text not null check (estado in ('ABIERTO','CERRADO','ELIMINADO')),
  inicio        timestamptz not null default now(),
  abierto_por   text,
  cierre        timestamptz,
  cerrado_por   text,
  recibe_de_id  text,
  recibe_de     text,
  nota          text,
  editado_por   text,
  eliminado_por text
);
-- La base misma impide dos turnos abiertos a la vez
create unique index if not exists turnos_un_abierto_uk on public.turnos ((true)) where estado = 'ABIERTO';
create index if not exists turnos_inicio_ix on public.turnos (inicio desc);

create table if not exists public.val_productos (
  turno_id   text not null references public.turnos(id) on delete cascade,
  sku        text not null,
  producto   text,
  inicial    numeric not null default 0,
  actualizado timestamptz not null default now(),
  usuario    text,
  contado_en timestamptz,
  primary key (turno_id, sku)
);

create table if not exists public.val_registros (
  id             text primary key,
  turno_id       text not null references public.turnos(id) on delete cascade,
  fecha          timestamptz not null default now(),   -- hora de la validación
  sku            text not null,
  producto       text,
  destino        text,
  cantidad       numeric not null check (cantidad > 0),
  usuario        text,
  nota           text,
  estado         text not null default 'ACTIVO' check (estado in ('ACTIVO','ANULADO','CONFLICTO')),
  modificado_por text,
  contado_en     timestamptz
);
create index if not exists val_registros_turno_ix on public.val_registros (turno_id, sku);

create table if not exists public.ent_items (
  turno_id    text not null references public.turnos(id) on delete cascade,
  seccion     text not null check (seccion in ('BODEGA','TPC','KA','PK')),
  sku         text not null,
  producto    text,
  cantidades  jsonb not null default '[]'::jsonb,       -- [{n, un, m}]
  actualizado timestamptz not null default now(),
  usuario     text,
  origen      text,
  primary key (turno_id, seccion, sku)
);

create table if not exists public.ent_notas (
  id       text primary key,
  turno_id text not null references public.turnos(id) on delete cascade,
  hora     timestamptz not null default now(),
  usuario  text,
  texto    text not null
);
create index if not exists ent_notas_turno_ix on public.ent_notas (turno_id);

-- ---------------------------------------------------------------------
-- 5. CONCILIACIÓN Y PRE-CONCILIACIÓN
-- ---------------------------------------------------------------------
create table if not exists public.conciliaciones (
  id            text primary key,
  turno_id      text,
  numero        int check (numero in (1,2,3)),
  fecha         date,
  estado        text not null check (estado in ('ABIERTA','CERRADA','ELIMINADA')),
  inicio        timestamptz not null default now(),
  abierto_por   text,
  cierre        timestamptz,
  cerrado_por   text,
  nota          text,
  editado_por   text,
  eliminado_por text
);
create unique index if not exists conc_un_abierta_uk on public.conciliaciones ((true)) where estado = 'ABIERTA';
create index if not exists conc_inicio_ix on public.conciliaciones (inicio desc);

create table if not exists public.conc_items (
  conc_id     text not null references public.conciliaciones(id) on delete cascade,
  sku         text not null,
  producto    text,
  bodega      numeric,
  ka          numeric,
  pk          numeric,
  facturacion numeric,
  bloqueo     boolean not null default false,
  actualizado timestamptz not null default now(),
  usuario     text,
  origen      text,
  primary key (conc_id, sku)
);

create table if not exists public.preconciliacion (
  id       text primary key,
  fecha    timestamptz not null default now(),
  turno    int,
  sku      text not null,
  producto text,
  motivo   text,
  usuario  text,
  estado   text not null default 'PENDIENTE',
  conc_id  text
);

-- ---------------------------------------------------------------------
-- 6. CANDADO: RLS activado en TODAS las tablas, sin políticas, y sin permisos
--    directos para el navegador (roles anon / authenticated).
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['frecs_config','perfiles','intentos_ingreso','sesiones','wms_base','wms_modulos','sync_estado',
    'sku','canales','capacidad_bodega','consumo','limbo','destinos','turnos','val_productos','val_registros',
    'ent_items','ent_notas','conciliaciones','conc_items','preconciliacion'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. FUNCIONES DE INGRESO Y SESIÓN
-- ---------------------------------------------------------------------
-- Nivel de cada rol
create or replace function public._nivel(rol text) returns int
language sql immutable as $$
  select case rol when 'administrador' then 3 when 'validador' then 2 when 'lector' then 1 else 0 end
$$;

-- Revisa el token y el rol mínimo. Devuelve el perfil o lanza "SESION:" (el
-- dashboard muestra la pantalla de ingreso) / "PERMISO:" (falta rol).
create or replace function public._sesion(p_token text, p_rol text default 'lector')
returns public.perfiles
language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.sesiones;
  u public.perfiles;
begin
  if coalesce(p_token, '') = '' then raise exception 'SESION: Ingresa con tu nombre y PIN.'; end if;
  select * into s from sesiones where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if not found or s.expira < now() then raise exception 'SESION: Tu sesión terminó. Ingresa de nuevo.'; end if;
  select * into u from perfiles where id = s.perfil_id;
  if not found or not u.activo then raise exception 'SESION: Usuario inactivo.'; end if;
  if _nivel(u.rol) < _nivel(p_rol) then raise exception 'PERMISO: No tienes permiso para esto (se necesita rol %).', p_rol; end if;
  -- Sesión deslizante: se extiende con el uso (a lo sumo una escritura cada 10 min)
  if s.usada < now() - interval '10 minutes' then
    update sesiones set usada = now(), expira = now() + interval '7 days' where token_hash = s.token_hash;
  end if;
  return u;
end $$;

-- Huella del PIN de la hoja Usuarios (misma fórmula de 31_Usuarios_Permisos: hashPin_)
create or replace function public._pin_legado(p_nombre text, p_pin text) returns text
language sql stable security definer set search_path = public, extensions as $$
  select encode(digest((select valor from frecs_config where clave = 'pin_sal_legado') || '|' || lower(btrim(p_nombre)) || '|' || p_pin, 'sha256'), 'base64')
$$;

create or replace function public._validar_pin(p_pin text) returns void
language plpgsql immutable as $$
begin
  if coalesce(p_pin, '') !~ '^\d{4,8}$' then raise exception 'El PIN debe tener de 4 a 8 números.'; end if;
end $$;

create or replace function public._nueva_sesion(p_perfil bigint) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare tk text := encode(gen_random_bytes(24), 'hex');
begin
  insert into sesiones (token_hash, perfil_id, expira) values (encode(digest(tk, 'sha256'), 'hex'), p_perfil, now() + interval '7 days');
  delete from sesiones where expira < now();   -- limpieza
  return tk;
end $$;

-- Pantalla de ingreso: lista de nombres activos (lo único que se ve sin PIN, igual que hoy)
create or replace function public.ingreso_nombres() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'nombres', coalesce((select jsonb_agg(nombre order by nombre) from perfiles where activo), '[]'::jsonb),
    'sinUsuarios', not exists (select 1 from perfiles))
$$;

-- Primer administrador (solo funciona si todavía no hay ningún usuario)
create or replace function public.crear_admin_inicial(p_nombre text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare u public.perfiles;
begin
  perform _validar_pin(p_pin);
  if btrim(coalesce(p_nombre, '')) = '' then raise exception 'Escribe tu nombre.'; end if;
  lock table perfiles in exclusive mode;
  if exists (select 1 from perfiles) then raise exception 'Ya existen usuarios. Ingresa con tu nombre y PIN.'; end if;
  insert into perfiles (nombre, pin_hash, rol, creado_por, ultimo_acceso)
    values (btrim(p_nombre), crypt(p_pin, gen_salt('bf')), 'administrador', 'Configuración inicial', now()) returning * into u;
  return jsonb_build_object('token', _nueva_sesion(u.id), 'usuario', jsonb_build_object('nombre', u.nombre, 'rol', u.rol));
end $$;

-- Ingresar con nombre + PIN. 5 PIN errados seguidos bloquean ese nombre 10 minutos.
create or replace function public.ingresar(p_nombre text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  clave text := lower(btrim(coalesce(p_nombre, '')));
  i public.intentos_ingreso;
  u public.perfiles;
  bueno boolean := false;
begin
  select * into i from intentos_ingreso where nombre_clave = clave;
  if found and i.bloqueado_hasta is not null and i.bloqueado_hasta > now() then
    raise exception 'Demasiados intentos. Espera 10 minutos o pide al administrador que revise tu PIN.';
  end if;
  select * into u from perfiles where lower(btrim(nombre)) = clave and activo;
  if found then
    if u.pin_hash is not null then bueno := (crypt(coalesce(p_pin, ''), u.pin_hash) = u.pin_hash);
    elsif u.pin_legado is not null then bueno := (_pin_legado(u.nombre, coalesce(p_pin, '')) = u.pin_legado);
    end if;
  end if;
  if not bueno then
    insert into intentos_ingreso (nombre_clave, fallos) values (clave, 1)
      on conflict (nombre_clave) do update set
        -- si ya pasó un bloqueo, se vuelve a contar desde 1
        fallos = case when intentos_ingreso.bloqueado_hasta is not null then 1 else intentos_ingreso.fallos + 1 end,
        bloqueado_hasta = case when intentos_ingreso.bloqueado_hasta is null and intentos_ingreso.fallos + 1 >= 5
                               then now() + interval '10 minutes' else null end;
    -- el fallo se guarda y se devuelve el error sin lanzar excepción (una excepción desharía el conteo)
    return jsonb_build_object('ok', false, 'error', 'Nombre o PIN incorrecto.');
  end if;
  delete from intentos_ingreso where nombre_clave = clave;
  -- PIN viejo correcto: se pasa a bcrypt y se borra la huella vieja
  update perfiles set ultimo_acceso = now(),
    pin_hash = coalesce(pin_hash, crypt(p_pin, gen_salt('bf'))), pin_legado = null
    where id = u.id;
  return jsonb_build_object('ok', true, 'token', _nueva_sesion(u.id), 'usuario', jsonb_build_object('nombre', u.nombre, 'rol', u.rol));
end $$;

create or replace function public.salir(p_token text) returns boolean
language sql security definer set search_path = public, extensions as $$
  delete from sesiones where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') returning true
$$;

-- Quién soy (al abrir la página con un token guardado)
create or replace function public.mi_sesion(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token);
begin
  return jsonb_build_object('nombre', u.nombre, 'rol', u.rol);
end $$;

create or replace function public.cambiar_pin(p_token text, p_actual text, p_nuevo text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare u public.perfiles := _sesion(p_token);
begin
  perform _validar_pin(p_nuevo);
  if not ((u.pin_hash is not null and crypt(coalesce(p_actual, ''), u.pin_hash) = u.pin_hash)
       or (u.pin_hash is null and u.pin_legado = _pin_legado(u.nombre, coalesce(p_actual, '')))) then
    raise exception 'El PIN actual no es correcto.';
  end if;
  update perfiles set pin_hash = crypt(p_nuevo, gen_salt('bf')), pin_legado = null where id = u.id;
  return true;
end $$;

-- ---------------------------------------------------------------------
-- 8. ADMINISTRACIÓN DE USUARIOS (solo administrador)
-- ---------------------------------------------------------------------
create or replace function public.usuarios_listar(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.perfiles := _sesion(p_token, 'administrador');
begin
  return coalesce((select jsonb_agg(jsonb_build_object('nombre', nombre, 'rol', rol, 'activo', activo,
      'creado', creado, 'creadoPor', creado_por, 'ultimo', ultimo_acceso) order by nombre) from perfiles), '[]'::jsonb);
end $$;

-- p_original vacío = crear. p_pin vacío al editar = no cambiar el PIN.
create or replace function public.usuario_guardar(p_token text, p_original text, p_nombre text, p_rol text, p_pin text, p_activo boolean)
returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare
  a public.perfiles := _sesion(p_token, 'administrador');
  e public.perfiles;
begin
  if btrim(coalesce(p_nombre, '')) = '' then raise exception 'Escribe el nombre.'; end if;
  if _nivel(p_rol) = 0 then raise exception 'Rol no válido.'; end if;
  if coalesce(p_original, '') = '' then
    perform _validar_pin(p_pin);
    if exists (select 1 from perfiles where lower(btrim(nombre)) = lower(btrim(p_nombre))) then raise exception 'Ya existe un usuario con ese nombre.'; end if;
    insert into perfiles (nombre, pin_hash, rol, activo, creado_por) values (btrim(p_nombre), crypt(p_pin, gen_salt('bf')), p_rol, coalesce(p_activo, true), a.nombre);
  else
    select * into e from perfiles where lower(btrim(nombre)) = lower(btrim(p_original));
    if not found then raise exception 'Usuario no encontrado.'; end if;
    if e.id = a.id and (p_rol <> 'administrador' or not coalesce(p_activo, true)) then raise exception 'No puedes quitarte a ti mismo el rol de administrador ni desactivarte.'; end if;
    if coalesce(p_pin, '') <> '' then perform _validar_pin(p_pin); end if;
    update perfiles set nombre = btrim(p_nombre), rol = p_rol, activo = coalesce(p_activo, true),
      pin_hash = case when coalesce(p_pin, '') <> '' then crypt(p_pin, gen_salt('bf')) else pin_hash end,
      pin_legado = case when coalesce(p_pin, '') <> '' then null else pin_legado end
      where id = e.id;
    if not coalesce(p_activo, true) then delete from sesiones where perfil_id = e.id; end if;
  end if;
  return true;
end $$;

create or replace function public.usuario_eliminar(p_token text, p_nombre text) returns boolean
language plpgsql security definer set search_path = public as $$
declare a public.perfiles := _sesion(p_token, 'administrador');
begin
  if lower(btrim(p_nombre)) = lower(a.nombre) then raise exception 'No puedes borrar tu propio usuario.'; end if;
  delete from perfiles where lower(btrim(nombre)) = lower(btrim(p_nombre));
  return true;
end $$;

-- ---------------------------------------------------------------------
-- 9. PERMISOS DE LAS FUNCIONES
--    Por defecto Postgres deja ejecutar cualquier función a todos: se cierra
--    todo y se abren solo las públicas. Las que empiezan por "_" son internas.
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.ingreso_nombres() to anon, authenticated;
grant execute on function public.crear_admin_inicial(text, text) to anon, authenticated;
grant execute on function public.ingresar(text, text) to anon, authenticated;
grant execute on function public.salir(text) to anon, authenticated;
grant execute on function public.mi_sesion(text) to anon, authenticated;
grant execute on function public.cambiar_pin(text, text, text) to anon, authenticated;
grant execute on function public.usuarios_listar(text) to anon, authenticated;
grant execute on function public.usuario_guardar(text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.usuario_eliminar(text, text) to anon, authenticated;
-- Funciones nuevas: cerradas por defecto (cada fase abre las suyas)
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Ajustes tras la revisión de seguridad de Supabase (migración fase1_ajustes_seguridad)
alter function public._nivel(text) set search_path = '';
alter function public._validar_pin(text) set search_path = '';
-- Mientras no haya usuarios, cualquiera con la URL podría crear el primer administrador:
-- se cierra. Los usuarios llegan de la importación de la hoja Usuarios (fase 2).
revoke execute on function public.crear_admin_inicial(text, text) from anon, authenticated;

-- Fin de la fase 1
select 'Frecs! fase 1 lista: ' || count(*) || ' tablas' as resultado
from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE';

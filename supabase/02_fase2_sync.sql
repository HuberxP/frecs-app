-- =====================================================================
-- FRECS! · FASE 2 · Funciones para que Apps Script escriba en Supabase
-- ---------------------------------------------------------------------
-- Solo las puede llamar la clave SECRETA (rol service_role), que vive en las
-- Propiedades del script. El navegador (anon) no puede ejecutarlas.
-- =====================================================================

-- 1) Sincronización: reemplaza el inventario del WMS en una sola transacción
--    (quien consulte mientras tanto ve el inventario viejo o el nuevo, nunca a medias)
create or replace function public.sb_reemplazar_wms(p_filas jsonb, p_modulos jsonb, p_estado jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare n1 int; n2 int;
begin
  if coalesce(jsonb_array_length(p_filas), 0) = 0 then
    raise exception 'El WMS no devolvió inventario: se conserva la base anterior.';
  end if;
  delete from wms_base where true;
  insert into wms_base (sku, producto, modulo, estibas, cajas, unidades, vence, dias, estado, candado, carga,
                        familia, cajas_por_estiba, obs, picking, actualizacion)
  select x.sku, x.producto, x.modulo, coalesce(x.estibas, 0), coalesce(x.cajas, 0), coalesce(x.unidades, 0), x.vence, x.dias,
         x.estado, x.candado, x.carga, x.familia, x.cajas_por_estiba, x.obs, coalesce(x.picking, false), x.actualizacion
  from jsonb_to_recordset(p_filas) as x(sku text, producto text, modulo text, estibas numeric, cajas numeric, unidades numeric,
       vence date, dias int, estado text, candado text, carga timestamptz, familia text, cajas_por_estiba numeric, obs text,
       picking boolean, actualizacion timestamptz)
  where coalesce(x.sku, '') <> '' and coalesce(x.modulo, '') <> '';
  get diagnostics n1 = row_count;

  delete from wms_modulos where true;
  insert into wms_modulos (modulo, nombre_wms, seccion, bodega, zona, picking, con_producto, skus, lotes)
  select x.modulo, x.nombre_wms, x.seccion, x.bodega, x.zona, coalesce(x.picking, false), coalesce(x.con_producto, false),
         coalesce(x.skus, 0), coalesce(x.lotes, 0)
  from jsonb_to_recordset(coalesce(p_modulos, '[]'::jsonb)) as x(modulo text, nombre_wms text, seccion text, bodega text,
       zona text, picking boolean, con_producto boolean, skus int, lotes int)
  where coalesce(x.modulo, '') <> ''
  on conflict (modulo) do nothing;
  get diagnostics n2 = row_count;

  insert into sync_estado (id, ultima_sync, ultimo_movimiento, filas, modulos, por)
  values (1, coalesce((p_estado->>'ultima_sync')::timestamptz, now()), (p_estado->>'ultimo_movimiento')::timestamptz,
          (p_estado->>'filas')::int, (p_estado->>'modulos')::int, p_estado->>'por')
  on conflict (id) do update set ultima_sync = excluded.ultima_sync, ultimo_movimiento = excluded.ultimo_movimiento,
    filas = excluded.filas, modulos = excluded.modulos, por = excluded.por;

  return jsonb_build_object('filas', n1, 'modulos', n2);
end $$;

-- 2) Importación de una tabla desde las hojas.
--    p_vaciar = true borra la tabla antes (en turnos y conciliaciones también sus hijos).
--    Las columnas se toman de las claves del primer objeto (Apps Script manda siempre todas).
create or replace function public.sb_importar_tabla(p_tabla text, p_filas jsonb, p_vaciar boolean default false)
returns int
language plpgsql security definer set search_path = public as $$
declare cols text; n int;
begin
  if p_tabla not in ('sku','canales','capacidad_bodega','consumo','limbo','destinos','turnos','val_productos',
                     'val_registros','ent_items','ent_notas','conciliaciones','conc_items','preconciliacion') then
    raise exception 'Tabla no permitida: %', p_tabla;
  end if;
  if exists (select 1 from frecs_config where clave = 'importacion_cerrada' and valor = 'si') then
    raise exception 'La importación está cerrada: Frecs ya trabaja sobre Supabase.';
  end if;
  if p_vaciar then execute format('delete from public.%I where true', p_tabla); end if;
  if coalesce(jsonb_array_length(p_filas), 0) = 0 then return 0; end if;
  select string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position) into cols
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = p_tabla and c.is_identity = 'NO'
    and c.column_name in (select jsonb_object_keys(p_filas->0));
  execute format('insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1)',
                 p_tabla, cols, cols, p_tabla) using p_filas;
  get diagnostics n = row_count;
  return n;
end $$;

-- 3) Usuarios de la hoja Usuarios con su PIN actual (huella vieja; pasa a bcrypt al primer ingreso).
--    Si el usuario ya existe: actualiza rol y activo; su PIN solo si todavía no ingresó en Supabase.
create or replace function public.sb_importar_usuarios(p_sal text, p_usuarios jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare x record; nuevos int := 0; act int := 0; r text;
begin
  if coalesce(p_sal, '') <> '' then
    insert into frecs_config (clave, valor) values ('pin_sal_legado', p_sal)
    on conflict (clave) do update set valor = excluded.valor;
  end if;
  for x in select * from jsonb_to_recordset(coalesce(p_usuarios, '[]'::jsonb)) as u(nombre text, pin_legado text, rol text,
           activo boolean, creado timestamptz, creado_por text, ultimo_acceso timestamptz) loop
    continue when btrim(coalesce(x.nombre, '')) = '';
    r := case when lower(x.rol) in ('lector','validador','administrador') then lower(x.rol) else 'lector' end;
    update perfiles set rol = r, activo = coalesce(x.activo, true),
      pin_legado = case when pin_hash is null then x.pin_legado else pin_legado end
    where lower(btrim(nombre)) = lower(btrim(x.nombre));
    if found then act := act + 1;
    else
      insert into perfiles (nombre, pin_legado, rol, activo, creado, creado_por, ultimo_acceso)
      values (btrim(x.nombre), x.pin_legado, r, coalesce(x.activo, true), coalesce(x.creado, now()), x.creado_por, x.ultimo_acceso);
      nuevos := nuevos + 1;
    end if;
  end loop;
  return jsonb_build_object('nuevos', nuevos, 'actualizados', act);
end $$;

-- 4) Conteo de filas por tabla (para comparar con las hojas después de importar)
create or replace function public.sb_conteos()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare t text; n bigint; res jsonb := '{}'::jsonb;
begin
  foreach t in array array['perfiles','wms_base','wms_modulos','sku','canales','capacidad_bodega','consumo','limbo','destinos',
    'turnos','val_productos','val_registros','ent_items','ent_notas','conciliaciones','conc_items','preconciliacion'] loop
    execute format('select count(*) from public.%I', t) into n;
    res := res || jsonb_build_object(t, n);
  end loop;
  return res;
end $$;

-- Permisos: solo la clave secreta
revoke execute on function public.sb_reemplazar_wms(jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.sb_importar_tabla(text, jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.sb_importar_usuarios(text, jsonb) from public, anon, authenticated;
revoke execute on function public.sb_conteos() from public, anon, authenticated;
grant execute on function public.sb_reemplazar_wms(jsonb, jsonb, jsonb) to service_role;
grant execute on function public.sb_importar_tabla(text, jsonb, boolean) to service_role;
grant execute on function public.sb_importar_usuarios(text, jsonb) to service_role;
grant execute on function public.sb_conteos() to service_role;

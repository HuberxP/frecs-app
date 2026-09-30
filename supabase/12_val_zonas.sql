-- =====================================================================
-- FRECS! · Validación: cantidad inicial por zona y «por confirmar»
-- ---------------------------------------------------------------------
--   · val_productos.bodega / pk / ka: lo contado en cada zona (vacío = no se contó ahí);
--     la columna inicial sigue siendo el total (la suma).
--   · val_productos.por_confirmar: producto agregado sin saber aún la cantidad real.
--   · _datos_turnos y sb_turnos_hojas devuelven las 4 columnas al final de cada fila
--     (Val_Productos: H–K · Val_Hist_Productos: I–L). Se toma la función tal como está
--     en la base y solo se le agregan esas columnas.
-- =====================================================================

alter table public.val_productos add column if not exists bodega numeric;
alter table public.val_productos add column if not exists pk numeric;
alter table public.val_productos add column if not exists ka numeric;
alter table public.val_productos add column if not exists por_confirmar boolean not null default false;

do $$
declare
  f text; d text; par text[];
  cambios constant text[][] := array[
    array['coalesce(to_char(contado_en at time zone tz, ''YYYY-MM-DD HH24:MI:SS''), '''')) order by orden)',
          'coalesce(to_char(contado_en at time zone tz, ''YYYY-MM-DD HH24:MI:SS''), ''''), coalesce(to_jsonb(bodega), ''""''), coalesce(to_jsonb(pk), ''""''), coalesce(to_jsonb(ka), ''""''), por_confirmar) order by orden)'],
    array['coalesce(to_char(p.contado_en at time zone tz, ''YYYY-MM-DD HH24:MI:SS''), '''')) order by p.turno_id, p.orden)',
          'coalesce(to_char(p.contado_en at time zone tz, ''YYYY-MM-DD HH24:MI:SS''), ''''), coalesce(to_jsonb(p.bodega), ''""''), coalesce(to_jsonb(p.pk), ''""''), coalesce(to_jsonb(p.ka), ''""''), p.por_confirmar) order by p.turno_id, p.orden)']];
begin
  foreach f in array array['_datos_turnos', 'sb_turnos_hojas'] loop
    select pg_get_functiondef(p.oid) into d from pg_proc p where p.proname = f and p.pronamespace = 'public'::regnamespace;
    for k in 1 .. array_length(cambios, 1) loop
      if position(cambios[k][2] in d) > 0 then continue; end if;
      if (length(d) - length(replace(d, cambios[k][1], ''))) / length(cambios[k][1]) <> 1 then raise exception 'No se encontró la fila % en %', k, f; end if;
      d := replace(d, cambios[k][1], cambios[k][2]);
    end loop;
    execute d;
  end loop;
end $$;

-- El control de saldo (trigger de val_registros) deja pasar lo que esté «por confirmar cantidad»
do $$
declare d text;
  viejo constant text := 'select v.inicial, v.producto into ini, prod from public.val_productos v where v.turno_id = new.turno_id and v.sku = new.sku;
  if not found then raise exception ''El producto % no está en el turno.'', new.sku; end if;';
  nuevo constant text := 'select v.inicial, v.producto, v.por_confirmar into ini, prod, pc from public.val_productos v where v.turno_id = new.turno_id and v.sku = new.sku;
  if not found then raise exception ''El producto % no está en el turno.'', new.sku; end if;
  if pc then return null; end if;';
begin
  select pg_get_functiondef('public._val_saldo'::regproc) into d;
  if position('v.por_confirmar' in d) > 0 then return; end if;
  if position(viejo in d) = 0 then raise exception 'No se encontró la lectura del producto en _val_saldo'; end if;
  d := replace(replace(d, viejo, nuevo), 'declare claims jsonb; ini numeric;', 'declare pc boolean; claims jsonb; ini numeric;');
  execute d;
end $$;

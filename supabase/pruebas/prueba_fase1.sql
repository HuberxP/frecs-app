-- Pruebas de la fase 1 (se corren en una base de PRUEBA, nunca en la real: crean usuarios de ejemplo)
\set ON_ERROR_STOP 0
set role anon;
\echo '1) anon lee tabla (debe fallar):'
select count(*) from perfiles;
\echo '2) nombres sin usuarios:'
select ingreso_nombres();
\echo '3) crear admin:'
select (crear_admin_inicial('Huber','1234')->>'token') is not null as token_ok;
\echo '4) segundo admin (debe fallar):'
select crear_admin_inicial('Otro','1234');
\echo '5) PIN malo x5 y bloqueo:'
select ingresar('huber','0000')->>'error' from generate_series(1,5);
select ingresar('Huber','1234');
reset role;
update intentos_ingreso set bloqueado_hasta = now() - interval '1 second';
set role anon;
\echo '6) ingreso bueno + mi_sesion:'
select set_config('t.tk', ingresar('Huber','1234')->>'token', false) is not null as ok;
select mi_sesion(current_setting('t.tk'));
\echo '7) PIN heredado de la hoja:'
reset role;
insert into frecs_config values ('pin_sal_legado','SAL-123') on conflict (clave) do update set valor = excluded.valor;
insert into perfiles (nombre, pin_legado, rol) values ('Ana María', 'Ft2FbhSKgbeFpS4FmxIAvyMYpfUkJjQGuD4Nk1xv3sc=', 'lector');
set role anon;
select ingresar('Ana María','9999')->>'error' as malo;
select set_config('t.tl', ingresar('ana maría','4321')->>'token', false) is not null as legado_ok;
reset role;
select nombre, pin_hash is not null as bcrypt, pin_legado is null as legado_borrado from perfiles where nombre = 'Ana María';
set role anon;
\echo '8) permisos de rol:'
select usuarios_listar(current_setting('t.tl'));
select usuario_guardar(current_setting('t.tk'), '', 'Pedro', 'validador', '5678', true);
select jsonb_array_length(usuarios_listar(current_setting('t.tk'))) as usuarios;
select usuario_guardar(current_setting('t.tk'), 'Huber', 'Huber', 'lector', '', true);
select usuario_eliminar(current_setting('t.tk'), 'huber');
select cambiar_pin(current_setting('t.tl'), '4321', '1111');
select ingresar('Ana María','1111')->>'ok' as pin_nuevo;
\echo '9) funciones internas y tablas cerradas para anon:'
select _sesion(current_setting('t.tk'));
insert into turnos (id, estado) values ('X','ABIERTO');
select salir(current_setting('t.tk'));
select mi_sesion(current_setting('t.tk'));
reset role;
\echo '10) un solo turno abierto:'
insert into turnos (id, numero, estado) values ('T1', 1, 'ABIERTO');
insert into turnos (id, numero, estado) values ('T2', 2, 'ABIERTO');
\echo '11) desactivar cierra sesiones:'

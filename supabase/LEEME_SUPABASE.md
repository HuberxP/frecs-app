# Frecs! → Supabase · Paso a paso

Plan: la base de datos pasa de Google Sheets a **Supabase** (PostgreSQL). El dashboard nuevo irá en GitHub Pages y hablará directo con Supabase. Apps Script se queda solo con la sincronización del WMS y el bot de Telegram.

| Fase | Qué | Estado |
|---|---|---|
| 0 | Permiso de sistemas (los datos quedan en Supabase, fuera de Google Workspace) | Por confirmar |
| 1 | Cuenta, proyecto y tablas | ✅ Hecho (28/09) |
| **2** | **Apps Script escribe en Supabase: sincronización doble e importación de las hojas (incluidos usuarios con su PIN)** | **Este paso** |
| 3 | Dashboard nuevo en GitHub Pages: consultas (solo lectura) | |
| 4 | Turnos: validación, entrega, conciliación, pre-conciliación | |
| 5 | Bot y PDF leyendo de Supabase | |
| 6 | Retirar las hojas (quedan de respaldo) | |

Durante todo el proceso el Frecs actual sigue funcionando igual.

---

## Fase 1 · Paso 1: crear la cuenta

1. Entra a **https://supabase.com** → **Start your project**.
2. Regístrate con **GitHub** (recomendado, porque el dashboard nuevo irá en GitHub Pages) o con tu correo.
3. Si pide crear una **organización**: nombre `Frecs`, tipo *Personal*, plan **Free**.

## Fase 1 · Paso 2: crear el proyecto

1. **New project**.
2. Llena así:
   - **Name:** `frecs`
   - **Database password:** pulsa *Generate a password* y **guárdala** en un lugar seguro (gestor de contraseñas). No la vas a usar a diario, pero no se puede recuperar.
   - **Region:** **South America (São Paulo)**, la más cercana a Colombia.
   - Opciones de seguridad y de Data API: deja lo que viene por defecto (**Data API** activada y esquema **public**).
3. **Create new project** y espera 1 a 2 minutos a que termine.

## Fase 1 · Paso 3: crear las tablas

1. Menú izquierdo → **SQL Editor** → **New query**.
2. Abre el archivo `01_esquema.sql`, copia **todo** y pégalo.
3. **Run** (o Ctrl + Enter). Si Supabase avisa que la consulta tiene operaciones "destructivas" (por los `revoke`), confirma: solo quita permisos, no borra datos.
4. Al final debe salir: **`Frecs! fase 1 lista: 21 tablas`**.
5. Revisa en **Table Editor** que aparecen las tablas (`turnos`, `val_registros`, `wms_base`…). Todas dicen **RLS enabled** y no tienen políticas: está bien así (ver *Seguridad*).

El archivo se puede volver a correr sin dañar nada.

**No crees usuarios todavía.** En la fase 2 se importan los de la hoja `Usuarios` con el mismo PIN que tienen hoy.

## Fase 1 · Paso 4: anotar los datos de conexión

En **Project Settings → API Keys** (o el botón **Connect**, arriba):

| Dato | Dónde se usa | ¿Se puede ver en público? |
|---|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | Apps Script y dashboard | Sí |
| **Publishable key** (`sb_publishable_…`) o, si solo aparece la vieja, **anon key** | Dashboard (navegador) | Sí: con el candado de esta base no abre ninguna tabla |
| **Secret key** (`sb_secret_…`) o, si solo aparece la vieja, **service_role key** | **Solo** Propiedades del script de Apps Script | **NO.** Salta todas las reglas. No la pegues en el chat, en GitHub ni en el dashboard |

Si la página solo muestra las claves viejas (*Legacy API keys*: anon y service_role), sirven igual. Si quieres las nuevas: *Create new API keys*.

---

## Seguridad: cómo quedó

- **Las tablas no se pueden leer ni escribir desde el navegador**, ni siquiera con la clave pública: tienen RLS activado y ninguna política (quedan cerradas por defecto). Si algo se configura mal, queda cerrado, no abierto.
- **El dashboard entrará solo por funciones** (`rpc`) que revisan la sesión y el rol en cada llamada, como hoy hace `webAuth_`:
  - `ingreso_nombres`, `ingresar`, `salir`, `mi_sesion`, `cambiar_pin`, `crear_admin_inicial`
  - `usuarios_listar`, `usuario_guardar`, `usuario_eliminar` (solo administrador)
- **Ingreso con nombre + PIN, como hoy:**
  - El PIN se guarda cifrado con bcrypt. El token de sesión no se guarda, solo su huella.
  - 5 PIN errados seguidos bloquean ese nombre 10 minutos.
  - La sesión dura 7 días y se renueva con el uso. Desactivar a un usuario cierra sus sesiones.
- **Los PIN actuales siguen sirviendo:** se importa su huella vieja y, en el primer ingreso correcto, se cambia sola a bcrypt.
- **La base impide** dos turnos abiertos a la vez y dos conciliaciones abiertas a la vez, aunque falle el código.
- Las funciones nuevas quedan cerradas por defecto: cada fase abre solo las suyas.

## Plan gratis de Supabase: lo que hay que saber

- 500 MB de base de datos: sobra para años de turnos (con el botón *Archivar* aún más).
- **Si el proyecto pasa 7 días sin uso, se pausa.** Se reactiva desde el panel. Con uso diario no pasa.
- Copias de seguridad: el plan gratis no las trae automáticas. En la fase 6 dejamos una exportación periódica a Google Drive.

## Probado

El archivo `01_esquema.sql` se probó en PostgreSQL 16 con los mismos roles de Supabase (`anon`, `authenticated`, `service_role`). También se corrió dos veces seguidas para comprobar que se puede repetir sin daño.

Qué se revisó:

- El navegador (rol `anon`) no puede leer tablas, insertar ni llamar funciones internas.
- Crear el primer administrador, y que no deje crear un segundo.
- Bloqueo a los 5 PIN errados, y que tras el bloqueo vuelve a contar desde 1.
- Ingreso con un PIN heredado de la hoja: pasa a bcrypt.
- Roles: un lector no administra usuarios, y el administrador no puede quitarse su rol ni borrarse.
- Cambio de PIN y cierre de sesión.
- La base rechaza un segundo turno abierto.

Las pruebas están en `pruebas/prueba_fase1.sql`.

---

## Fase 2 · Apps Script escribe también en Supabase

Proyecto: **Frecs** (`wktznckezlxptocmhhze`, São Paulo). Las funciones de la base ya están creadas (migración `fase2_funciones_sync_importacion`; copia en `02_fase2_sync.sql`).

### Paso 1: código
En el proyecto de Apps Script:
- **Nuevo archivo:** `26_Supabase`.
- **Reemplazar:** `03_WMS_Sync` (la sincronización escribe también en Supabase) y `04_Inventario_Utils` (un campo más al leer Sku).

### Paso 2: propiedades del script
*Configuración del proyecto (⚙️) → Propiedades del script → Agregar*:

| Propiedad | Valor |
|---|---|
| `SUPABASE_URL` | `https://wktznckezlxptocmhhze.supabase.co` |
| `SUPABASE_SECRET` | Supabase → Project Settings → **API Keys** → la **Secret key** (`sb_secret_…`; si solo hay claves viejas, la **service_role**). Cópiala directo de Supabase a la propiedad: no pasa por el chat ni por ningún otro lado. |

Sin estas dos propiedades, Frecs sigue exactamente igual que antes.

### Paso 3: probar la conexión
En el editor, escoge la función **`sbProbarConexion`** → **Ejecutar**. En el registro debe salir `Conexión con Supabase OK` con los conteos. La primera vez Google pide autorizar la conexión externa.

### Paso 4: importar las hojas
Escoge **`sbImportarTodo`** → **Ejecutar** (tarda un minuto o menos). Copia a Supabase:

- **Usuarios**, con el mismo PIN de hoy.
- **Sku**, **Canales**, **Capacidad_Bodega**, **Consumo**, **Limbo** y **destinos**.
- **Turnos**, con toda su validación y su entrega. También lo que esté en *Frecs_Archivo*.
- **Conciliaciones** y **pre-conciliación**.
- **El inventario que ya está en WMS_Base.** No consulta el WMS.

Al final el registro muestra cuántas filas llegaron a cada tabla y, si alguna fila se saltó, por qué (por ejemplo, "turno inexistente").

- Se puede **repetir** cuantas veces quieras: cada vez deja Supabase igual a las hojas.
- Los usuarios que ya ingresaron en Supabase conservan su PIN.
- Cuando Frecs pase a trabajar sobre Supabase (fase 4), la importación se **cierra** para que no pise datos nuevos.

### Desde ahí
- Cada vez que alguien pulse ⟳ (o `/sincronizar`), el inventario queda en las hojas **y** en Supabase, con una sola consulta al WMS.
- Si Supabase falla, las hojas quedan bien igual. El error queda en el registro de ejecuciones.

### Probado
Con Apps Script simulado conectado a un PostgreSQL local con estas mismas funciones:

- **Sincronización doble:** 362 filas en la hoja y 362 en Supabase.
- **Clave mala:** las hojas se sincronizan igual y queda el aviso.
- **Importación:** turnos, validaciones, entrega, conciliación y maestros iguales a las hojas. Repetirla deja lo mismo.
- **PIN de la hoja:** entran con su PIN de siempre, incluido un nombre con tilde. El usuario inactivo no entra. Reimportar no daña los PIN ya migrados.
- **Navegador bloqueado:** no puede llamar a las funciones de importación.
- **Importación cerrada:** ya no se puede pisar Supabase.

La prueba es `test/supabase_prueba.js`.

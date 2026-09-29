# Frecs! · bodega

Bot de Telegram y dashboard para la bodega: inventario del WMS, consultas, turnos, validación, entrega, conciliación.

Migración en curso de **Google Sheets + Apps Script** a **Supabase + GitHub Pages** (ver `supabase/LEEME_SUPABASE.md`).

| Carpeta | Qué hay |
|---|---|
| `docs/` | **La versión web** publicada en GitHub Pages. Se genera: no editar a mano (salvo `config.js`). |
| `gas/` | Código de Apps Script (el Frecs actual): `*.gs`, `Dashboard*.html` y el JavaScript del dashboard en `gas/js/`. |
| `supabase/` | SQL de cada fase (ya aplicado en el proyecto `wktznckezlxptocmhhze`) y la guía. |
| `herramientas/` | `construir.py` arma `docs/` desde `gas/`, más las piezas de la versión web. |
| `pruebas/` | Pruebas de la versión web. |

## Cómo funciona la versión web

- **Ingreso con nombre + PIN**, validado por Supabase (funciones `ingresar`, `salir`).
- **Una sola llamada** (`datos_consulta`) trae el inventario, Sku, canales, capacidad, consumo, limbo y turnos.
- **La misma lógica del servidor de Apps Script** (`gas/*.gs`) corre en el navegador sobre esos datos (`docs/motor.js`). Así los cálculos son idénticos a los del Frecs actual: canales, vida útil, pocos, capacidad, consumo, slotting.
- **Sin conexión:** abre con la última copia guardada en el equipo.
- **App instalable (PWA):**
  - Android: menú ⋮ → *Instalar aplicación*.
  - iPhone: Compartir → *Agregar a pantalla de inicio*.
- **Escrituras:** la acción corre en el motor con las reglas del Frecs actual y solo las filas que cambiaron van a Supabase (`guardar_filas`, que revisa sesión y rol).
  - 4a: Limbo, Consumo, Sku y Canales (se copian a las hojas).
  - 4b: turnos, validación y entrega, **en modo prueba** (no pasan a las hojas ni al bot hasta el cambio definitivo).

## Bot de Telegram (función `frecs-bot` de Supabase)

- `supabase/functions/frecs-bot/`: la misma lógica del bot corriendo en Supabase, con PDF descargables armados en el servidor (`pdf.ts`).
- `motor.js` lo arma `construir.py`. Al publicar la función se importa desde jsDelivr fijado al commit (es muy grande para subirlo junto).
- Prueba local: `deno run -A pruebas/bot_prueba.ts`.
- Secreto en Supabase: `TELEGRAM_TOKEN`. El resto (grupo, chats, secretos compartidos) lo guarda Apps Script con `sbPasarBotASupabase()`.

## Publicar (una vez)

GitHub → *Settings → Pages* → *Build and deployment*: **Deploy from a branch**, rama `main`, carpeta **`/docs`** → *Save*. Queda en `https://huberxp.github.io/frecs-app/`.

## Después de cambiar algo en `gas/`

```
python3 herramientas/construir.py
```

## Seguridad

- La clave de `docs/config.js` es la **pública** de Supabase: con ella no se puede leer ninguna tabla. Solo sirve para llamar a las funciones, y esas piden nombre + PIN.
- La clave **secreta** vive solo en las Propiedades del script de Apps Script. Nunca va en este repositorio.

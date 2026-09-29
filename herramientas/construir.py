#!/usr/bin/env python3
"""Arma la versión web (carpeta docs/, publicada en GitHub Pages) a partir del
código de Apps Script (carpeta gas/). Correr después de cualquier cambio en gas/:

    python3 herramientas/construir.py

- docs/motor.js : la lógica del servidor (gas/*.gs) corriendo en el navegador.
- docs/app.js   : el dashboard (gas/js/*.js) con los ajustes de la versión web.
- docs/app.css  : estilos (gas/Dashboard_css.html + herramientas/web.css).
- docs/index.html
"""
import hashlib, os, re, glob, json

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAS, DOCS, HERR = (os.path.join(RAIZ, d) for d in ("gas", "docs", "herramientas"))
leer = lambda p: open(p, encoding="utf-8").read()

def escribir(nombre, texto):
    with open(os.path.join(DOCS, nombre), "w", encoding="utf-8") as f:
        f.write(texto)
    return hashlib.sha1(texto.encode()).hexdigest()[:8]

# ---------- motor.js ----------
gs = sorted(glob.glob(os.path.join(GAS, "*.gs")))
codigo = "\n;\n".join(f"// ===== {os.path.basename(p)} =====\n" + leer(p) for p in gs)
exportar = sorted(set(re.findall(r"^function (web[A-Z][A-Za-z]*)\s*\(", codigo, re.M)))
# El repositorio es público: se quitan del motor los datos internos que el navegador no necesita
# (dirección del WMS, centro de distribución, IDs de los archivos de Google).
ids = {}
codigo = re.sub(r'"(1[A-Za-z0-9_-]{40,})"', lambda m: '"' + ids.setdefault(m.group(1), f"LIBRO_{len(ids) + 1}") + '"', codigo)
codigo = re.sub(r"https://wms\.[A-Za-z0-9.-]+", "https://wms.invalid", codigo)
codigo = re.sub(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "00000000-0000-0000-0000-000000000000", codigo)
assert not re.search(r"https://wms\.(?!invalid)", codigo), "quedó un dato interno en el motor"
motor = ("// GENERADO por herramientas/construir.py: no editar a mano.\n"
         "const MOTOR = (() => {\n"
         + leer(os.path.join(HERR, "shim.js")) + "\n"
         + codigo + "\n;\n"
         + "const __EXPORTAR = {" + ", ".join(exportar) + "};\n"
         + leer(os.path.join(HERR, "motor_fin.js")) + "\n})();\n")
v_motor = escribir("motor.js", motor)

# ---------- app.js ----------
js = "\n".join(leer(p) for p in sorted(glob.glob(os.path.join(GAS, "js", "*.js"))))
marca = "(function inicio() {"
assert marca in js, "no se encontró el arranque de la página"
js = js.replace(marca, "// Ajustes de la versión web (Supabase)\nif (window.FRECS_WEB) FRECS_WEB.ajustar();\n\n" + marca, 1)
v_app = escribir("app.js", "// GENERADO por herramientas/construir.py: no editar a mano.\n" + js)

# ---------- app.css ----------
css = leer(os.path.join(GAS, "Dashboard_css.html"))
css = re.sub(r"^\s*<style>\s*|\s*</style>\s*$", "", css)
v_css = escribir("app.css", css + leer(os.path.join(HERR, "web.css")))

v_puente = escribir("puente.js", leer(os.path.join(HERR, "puente.js")))
v_cfg = hashlib.sha1(leer(os.path.join(DOCS, "config.js")).encode()).hexdigest()[:8]

# ---------- index.html ----------
html = leer(os.path.join(GAS, "Dashboard.html"))
html = html.replace('<base target="_top">\n', "")
cabeza = f'''<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="iconos/icon-192.png">
<link rel="apple-touch-icon" href="iconos/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Frecs!">
<link rel="stylesheet" href="app.css?v={v_css}">'''
html = html.replace('<?!= include("Dashboard_css"); ?>', cabeza)
scripts = (f'<script src="config.js?v={v_cfg}"></script>\n<script src="motor.js?v={v_motor}"></script>\n'
           f'<script src="puente.js?v={v_puente}"></script>\n<script src="app.js?v={v_app}"></script>\n'
           '<script>if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});</script>')
html = html.replace('<?!= include("Dashboard_js"); ?>', scripts)
assert "<?" not in html, "quedó una etiqueta de Apps Script en index.html"
escribir("index.html", html)

version = hashlib.sha1((v_motor + v_app + v_css + v_puente + v_cfg).encode()).hexdigest()[:8]
sw = leer(os.path.join(HERR, "sw.js")).replace("__VERSION__", version)
escribir("sw.js", sw)
print(f"Listo · versión {version} · {len(exportar)} funciones del servidor · motor {len(motor)//1024} KB · app {len(js)//1024} KB")

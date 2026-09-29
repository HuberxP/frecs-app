// Frecs! · service worker (GENERADO: la versión la pone herramientas/construir.py)
// Guarda la página para abrir rápido y sin conexión. Los datos NO se guardan aquí:
// los maneja la página (última copia en este equipo).
const VERSION = "frecs-709021b6";
const BASICOS = ["./", "index.html", "app.css", "app.js", "motor.js", "puente.js", "config.js", "manifest.webmanifest",
  "iconos/icon-192.png", "iconos/icon-512.png", "iconos/icon-maskable-512.png", "iconos/apple-touch-icon.png"];

self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return; // Supabase no se toca
  // Red primero (para recibir cambios); sin red, lo guardado
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});

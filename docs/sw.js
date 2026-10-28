// Frecs! · service worker (GENERADO: la versión la pone herramientas/construir.py)
// Guarda la página para abrir rápido y sin conexión. Los datos NO se guardan aquí:
// los maneja la página (última copia en este equipo).
const VERSION = "frecs-50babeb5";
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
  // La página (index.html) siempre se revisa con el servidor para no quedarse con una versión vieja
  const pagina = e.request.mode === "navigate" || /\/(index\.html)?$/.test(url.pathname);
  e.respondWith(fetch(e.request, pagina ? { cache: "no-cache" } : undefined).then(r => {
    if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});

// 🔔 Notificaciones (las manda Supabase): se muestran aunque la app esté cerrada
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { t: "Frecs!", b: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.t || "Frecs!", {
    body: d.b || "", icon: "iconos/icon-192.png", badge: "iconos/icon-192.png", tag: d.tag || undefined, renotify: !!d.tag,
    data: { u: d.u || "./" }, vibrate: [120, 60, 120]
  }));
});
// Al tocarla: si la app ya está abierta, va a esa sección; si no, la abre ahí
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const u = new URL((e.notification.data && e.notification.data.u) || "./", self.registration.scope);
  const ir = u.searchParams.get("ir") || "";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => x.url.startsWith(self.registration.scope));
    if (c) { if (ir) c.postMessage({ ir }); return c.focus(); }
    return self.clients.openWindow(u.href);
  }));
});

/* ArnonaCut minimal service worker — enables install + light offline shell */
const CACHE = "arnonacut-shell-v2";
const PRECACHE = ["/", "/assets/css/tailwind.css", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE) return caches.delete(k);
          return undefined;
        }),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok && (url.pathname.startsWith("/assets/") || url.pathname === "/" || url.pathname === "/manifest.webmanifest")) {
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          if (url.pathname.startsWith("/api")) {
            return new Response(JSON.stringify({ detail: "offline", offline: true }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            });
          }
          return caches.match("/");
        });
    }),
  );
});

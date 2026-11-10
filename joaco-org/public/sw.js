/* joaco.org — service worker: lets the site (and Bridge Maestro in particular) open without a connection.
   - Pages: network first, cached copy when offline.
   - /assets/* (hashed by the build, never change): cache first.
   - Other same-origin files: network first too, so a new deploy is never hidden by an old copy.
   - The 3D golf games and anything cross-origin are left to the network. */
const VERSION = "v1";
const CACHE = "joaco-" + VERSION;
const SKIP = [/^\/valdecanas\//, /^\/golf-madrid\//];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/favicon.svg"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("joaco-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || SKIP.some((re) => re.test(url.pathname))) return;
  const put = (res) => { if (res && res.ok && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(put).catch(() => caches.match(req).then((r) => r || caches.match("/"))));
    return;
  }
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then(put)));
    return;
  }
  e.respondWith(fetch(req).then(put).catch(() => caches.match(req)));
});

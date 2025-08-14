// sw.js — safe network-first for HTML, cache-first with background refresh for same-origin GET
const CACHE = 'mct-v7.2.5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) Documents: network-first (no store), fall back to cached index if offline
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const net = await fetch(req, { cache: 'no-store' });
        // Cache the document copy
        const cache = await caches.open(CACHE);
        cache.put(req, net.clone());
        return net;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Last-ditch: try the root index
        return caches.match('./index.html');
      }
    })());
    return;
  }

  // 2) Same-origin GET (icons, CSS, JS): cache-first, refresh in background
  if (req.method === 'GET' && url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const fetchAndStore = fetch(req)
        .then(resp => { cache.put(req, resp.clone()); return resp; })
        .catch(() => null);
      return cached || (await fetchAndStore) || Response.error();
    })());
    return;
  }
});

// Auto-refreshing service worker
const CACHE = 'mct-v7-auto';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(CORE.map(u => cache.add(new Request(u, { cache: 'reload' }))))
    )
  );
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => (k===CACHE?null:caches.delete(k))))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(resp => { caches.open(CACHE).then(c => c.put('./index.html', resp.clone())); return resp; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  if (req.method === 'GET' && url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const net = fetch(req)
          .then(resp => { caches.open(CACHE).then(c => c.put(req, resp.clone())); return resp; })
          .catch(() => cached);
        return cached || net;
      })
    );
    return;
  }
});

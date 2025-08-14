
const CACHE = 'mct-v7-0';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k===CACHE?null:caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        // Only cache GETs and same-origin
        try {
          const url = new URL(req.url);
          if (req.method === 'GET' && (url.origin === location.origin)) {
            const respClone = resp.clone();
            caches.open(CACHE).then(c => c.put(req, respClone));
          }
        } catch {}
        return resp;
      }).catch(() => {
        // Offline fallback to index for navigations
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});

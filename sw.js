// Auto-refreshing service worker
const CACHE = 'mct-v7-auto';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// Install: fetch latest bytes (bypass HTTP cache) and pre-cache core
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(
        CORE.map(u => cache.add(new Request(u, { cache: 'reload' })))
      )
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

// Fetch:
// 1) Navigations/HTML -> network-first, fall back to cache, then update cache
// 2) Same-origin GET -> cache-first, update in background (SWR)
// 3) Other -> just go to network
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // HTML / navigations
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put('./index.html', clone));
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  //


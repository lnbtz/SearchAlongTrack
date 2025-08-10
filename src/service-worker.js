const CACHE_VERSION = 'v2';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;
const urlsToCache = ["/"];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  // activate this SW immediately
  self.skipWaiting();
});

// Fetch event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for HTML and SW, cache-first for others
  const req = event.request;
  const isHTML = req.headers.get('accept')?.includes('text/html');
  if (isHTML || req.url.endsWith('service-worker.js')) {
    event.respondWith(fetch(req).catch(() => caches.match('/')));
    return;
  }
  event.respondWith(
    caches.match(req).then((res) => res || fetch(req))
  );
});
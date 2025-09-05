// Service Worker for SearchAlongTrack
const CACHE_VERSION = 'v3';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;
const APP_SHELL = [
  '/',
  '/app.css',
  '/favicon.png',
  '/manifest.json',
  '/icons/192.png',
  '/icons/512.png'
];

// Resource types we want to cache
const CACHEABLE_TYPES = [
  'font',
  'image',
  'style',
  'script',
  'document'
];

// Install event - cache the application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // Activate this SW immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Skip non-GET requests and those not from the same origin
  if (req.method !== 'GET' || 
      !req.url.startsWith(self.location.origin) ||
      req.url.includes('/api/')) {
    event.respondWith(fetch(req));
    return;
  }
  
  // Network-first for HTML and service worker
  const isHTML = req.headers.get('accept') && req.headers.get('accept').includes('text/html');
  if (isHTML || req.url.endsWith('service-worker.js')) {
    event.respondWith(
      fetch(req)
        .then(response => {
          // Cache successful responses
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(req).then(res => {
            return res || caches.match('/');
          });
        })
    );
    return;
  }
  
  // Cache-first for static assets that we know can be safely cached
  const resourceType = req.destination;
  
  if (CACHEABLE_TYPES.includes(resourceType)) {
    event.respondWith(
      caches.match(req).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response immediately
          return cachedResponse;
        }
        
        // Fetch from network and cache
        return fetch(req).then(response => {
          // Clone the response
          const responseClone = response.clone();
          
          // Open the cache and put the new response
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, responseClone);
          });
          
          return response;
        });
      })
    );
    return;
  }
  
  // For all other requests, try cache first but fall back to network
  event.respondWith(
    caches.match(req).then(cachedResponse => {
      return cachedResponse || fetch(req).then(response => {
        // Only cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, responseClone);
          });
        }
        return response;
      });
    })
  );
});
});
});

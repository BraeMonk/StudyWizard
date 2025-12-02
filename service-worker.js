// A slightly smarter cache-first service worker for Wizard's Cozy Tower

const CACHE_NAME = 'wizard-cozy-tower-v2'; // <-- bumped name
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  // Add icons or other static assets you want offline:
  // './icons/icon-192.png',
  // './icons/icon-512.png',
];

// Install: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );

  // Activate this SW immediately on install (no waiting state)
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  // Take control of all clients immediately
  return self.clients.claim();
});

// Fetch: cache-first, then network, with offline fallback to index.html
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          // Optionally, put fetched files into cache
          // (only if it's a basic, successful response)
          const clone = response.clone();
          if (
            clone &&
            clone.ok &&
            (clone.type === 'basic' || clone.type === 'cors')
          ) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => {
          // If offline and not cached, fall back to main page
          return caches.match('./index.html');
        });
    })
  );
});

// Service Worker for PWA offline support
const CACHE_NAME = 'actory-v1';
const RUNTIME_CACHE = 'actory-runtime';

const urlsToCache = [
  '/',
  '/dashboard',
  '/calendar',
  '/recordings',
  '/projects',
  '/settings',
  '/logo-square.png',
  '/logo-horizontal.png',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API routes and external requests
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('http://') || 
      event.request.url.includes('https://') && !event.request.url.includes(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page if available
            return caches.match('/');
          });
      })
  );
});

// Background sync for offline recordings
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-recordings') {
    event.waitUntil(syncRecordings());
  }
});

async function syncRecordings() {
  // Sync offline recordings when back online
  // This will be handled by the pwa-sync library
  console.log('Syncing recordings...');
}

// Service Worker for StudyNest PWA
// This is a simplified service worker that handles basic caching

const CACHE_NAME = 'studynest-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg',
  '/apple-touch-icon.svg'
];

// Install event - cache assets
self.addEventListener('install', event => {
  // Skip waiting forces the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  // Claim control immediately
  event.waitUntil(self.clients.claim());
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network with network-first strategy
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Network first, falling back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If the response is valid, clone it and store it in the cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network request fails, try to serve from cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If the request is for an HTML page, return the offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});
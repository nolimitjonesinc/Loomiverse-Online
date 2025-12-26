/**
 * Loomiverse Service Worker
 * Enables offline mode and caching for the PWA
 */

const CACHE_NAME = 'loomiverse-v1';
const STATIC_CACHE = 'loomiverse-static-v1';
const DYNAMIC_CACHE = 'loomiverse-dynamic-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/logos/icon-192.png',
  '/images/logos/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => {
          return key !== STATIC_CACHE && key !== DYNAMIC_CACHE;
        }).map((key) => {
          console.log('[SW] Removing old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls and external requests - they need network
  if (url.pathname.startsWith('/api/') ||
      url.hostname !== self.location.hostname ||
      url.protocol === 'chrome-extension:') {
    return;
  }

  // For navigation requests, try network first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cached version
          return caches.match(request)
            .then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // For static assets, try cache first, fallback to network
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          // Return cached version immediately
          // Also fetch fresh version in background
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, response);
              });
            }
          }).catch(() => {});

          return cached;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (!response.ok) {
              return response;
            }

            // Clone and cache
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clone);
            });

            return response;
          })
          .catch(() => {
            // Return offline fallback for images
            if (request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" fill="#666">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }

            // For other assets, return empty response
            return new Response('', { status: 503, statusText: 'Offline' });
          });
      })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});

// Background sync for offline story saves
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    console.log('[SW] Syncing stories...');
    // The app handles sync via cloudStorage
  }
});

console.log('[SW] Service worker loaded');

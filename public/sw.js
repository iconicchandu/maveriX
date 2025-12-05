// Service Worker for MaveriX PWA
const CACHE_NAME = 'maverix-v1';
const RUNTIME_CACHE = 'maverix-runtime-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/assets/maverixicon.png',
  '/assets/mobileicon.jpg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        // Use Promise.allSettled to prevent one failed asset from breaking the entire install
        return Promise.allSettled(
          PRECACHE_ASSETS.map((asset) => {
            return cache.add(asset).catch((error) => {
              console.warn(`[Service Worker] Failed to cache ${asset}:`, error);
              // Return null instead of throwing to allow other assets to cache
              return null;
            });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Install complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Install failed:', error);
        // Still skip waiting even if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.allSettled(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Removing old cache:', cacheName);
              return caches.delete(cacheName).catch((error) => {
                console.warn(`[Service Worker] Failed to delete cache ${cacheName}:`, error);
                return null;
              });
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activate complete');
        return self.clients.claim().catch((error) => {
          console.warn('[Service Worker] Failed to claim clients:', error);
          return null;
        });
      })
      .catch((error) => {
        console.error('[Service Worker] Activate failed:', error);
        // Still try to claim clients even if cleanup fails
        return self.clients.claim().catch(() => null);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests and external resources
  try {
    const url = new URL(event.request.url);
    if (
      url.pathname.startsWith('/api/') ||
      url.origin !== self.location.origin ||
      url.protocol === 'chrome-extension:'
    ) {
      return;
    }
  } catch (error) {
    // If URL parsing fails, skip this request
    console.warn('[Service Worker] Failed to parse URL:', error);
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
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response (don't wait for it to complete)
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache).catch((error) => {
                  console.warn('[Service Worker] Failed to cache response:', error);
                });
              })
              .catch((error) => {
                console.warn('[Service Worker] Failed to open cache:', error);
              });

            return response;
          })
          .catch((error) => {
            console.warn('[Service Worker] Fetch failed:', error);
            // Return offline page or fallback if available
            if (event.request.destination === 'document') {
              return caches.match('/').catch(() => {
                // If even the fallback fails, return a basic response
                return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
              });
            }
            // For non-document requests, return a basic error response
            return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
          });
      })
      .catch((error) => {
        console.error('[Service Worker] Cache match failed:', error);
        // Fallback to network fetch
        return fetch(event.request).catch(() => {
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Background sync (if needed in future)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      Promise.resolve()
    );
  }
});

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/assets/mobileicon.jpg',
      badge: '/assets/maverixicon.png',
      vibrate: [200, 100, 200],
      tag: 'maverix-notification',
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'MaveriX', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});


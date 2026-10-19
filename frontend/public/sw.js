/**
 * Service Worker: TicketVault PWA Offline Cache
 * Provides offline ticket viewing, QR code persistence, and asset caching.
 */

const CACHE_NAME = 'ticket-vault-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// 1. Install event: Cache core app shell and offline assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some static assets failed to precache:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. Activate event: Clean up previous cache versions and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch event: Stale-while-revalidate for pages, Cache-First for tickets & QR codes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and WebSocket/Socket.IO handshakes
  if (event.request.method !== 'GET' || url.pathname.startsWith('/socket.io/')) {
    return;
  }

  // Next.js static assets and chunks
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.includes('/images/')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          // Revalidate in background
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
            })
            .catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // For navigational requests (HTML pages), try network first, fallback to cached version
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(event.request);
          if (cached) return cached;
          const fallback = await cache.match('/');
          if (fallback) return fallback;
          return new Response(
            '<!DOCTYPE html><html><head><title>TicketVault Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#09090b;color:#f4f4f5;font-family:sans-serif;padding:2rem;text-align:center;"><h2>Offline Ticket View</h2><p>You are currently offline. Your saved tickets and QR codes are preserved in local storage.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

// 4. Message event: Cache ticket assets explicitly
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_TICKET_ASSETS') {
    const { urls } = event.data;
    if (Array.isArray(urls)) {
      caches.open(CACHE_NAME).then((cache) => {
        urls.forEach((url) => {
          fetch(url)
            .then((res) => {
              if (res.ok) cache.put(url, res);
            })
            .catch((err) => console.warn('[SW] Could not cache asset:', url, err));
        });
      });
    }
  }
});

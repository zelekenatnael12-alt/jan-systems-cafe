// apps/client/public/sw.js
// ─────────────────────────────────────────────────────────────────────────────
// Jan Systems Service Worker — Phase 3: Offline Resilience
//
// Strategy:
//   - Cache-first for static assets (JS, CSS, fonts, images)
//   - Network-first with cache fallback for API GET requests
//   - Background Sync for queued POST requests (orders, payments)
//   - Offline fallback page served when navigation fails
//
// Background Sync Tags:
//   - 'sync-pending-orders'   — fired when connectivity returns
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_NAME    = 'jan-systems-v2';
const API_CACHE     = 'jan-api-v1';
const OFFLINE_URL   = '/offline.html';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== API_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch Strategy ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET, WebSocket, and chrome-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  if (url.pathname.startsWith('/socket.io')) return;

  // 2. API requests — Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful GET API responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Offline: serve cached API response
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: 'Offline — cached data unavailable', offline: true }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // 3. Navigation requests — Network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 4. Static assets — Cache first, then network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// ─── Background Sync ──────────────────────────────────────────────────────────
// Fired by the browser when connectivity is restored after a failed request.
// The actual sync logic lives in offlineStore.js (client-side).
// The SW just notifies all open clients so they can trigger the flush.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-orders') {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_NOW', tag: 'sync-pending-orders' });
  });
}

// ─── Push Messages (for future notification support) ──────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CACHE_MENU') {
    // Pre-cache the menu data explicitly for offline ordering
    caches.open(API_CACHE).then(cache => {
      fetch('/api/menu').then(r => { if (r.ok) cache.put('/api/menu', r); });
      fetch('/api/tables').then(r => { if (r.ok) cache.put('/api/tables', r); });
      fetch('/api/config').then(r => { if (r.ok) cache.put('/api/config', r); });
    });
  }
});

// Dragons Élysées service worker.
//
// HF3 — update governance. The customer SW is registered at scope "/", so it also controls
// admin.html and the admin bundles even though the admin entry never registers one. The old
// v2 handler fell back to the cache on ANY network failure, which is how a stale admin shell
// could survive on a phone (P3-HF2: John's failing request never reached the server).
//
// Rules now:
//   • bump the cache name  → the stale v2 shell is purged on activate
//   • skipWaiting + clients.claim → a new version takes over immediately, no "close all tabs"
//   • the admin surface is NETWORK-ONLY → never read from, never written to the cache.
//     Admin is an operations tool: better slow (or a visible error) than silently stale.
//   • only cache GET + same-origin + res.ok responses (v2 cached 404/500 bodies too)
const CACHE_NAME = 'dragons-elysees-v3';
const PRECACHE = ['/', '/index.html', '/data/menu.json'];

// Admin document + admin-only chunks. Kept deliberately broad.
function isAdminRequest(url) {
  return url.pathname === '/admin.html'
    || url.pathname.startsWith('/admin')
    || /\/assets\/(admin|AdminPanel)[-.]/i.test(url.pathname);
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();               // new version installs → take over at once
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())   // control existing tabs without a reload
  );
});

// Let the page ask us to activate immediately (belt & braces alongside install-time skipWaiting).
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only GET is cacheable; everything else goes straight to the network.
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // API traffic is never touched by the SW (auth + always-fresh data).
  if (url.pathname.includes('/api/')) return;

  // Admin surface: network-only. No cache read, no cache write — a failure must surface
  // as a real error the operator can see and report, not as a stale screen.
  if (isAdminRequest(url)) {
    event.respondWith(fetch(req));
    return;
  }

  // Customer surface: network-first, cache only as an offline fallback.
  event.respondWith(
    fetch(req)
      .then(response => {
        if (response && response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('/index.html')))
  );
});

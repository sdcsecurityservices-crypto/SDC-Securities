// SDC Guard offline support. Bump VERSION when this file's strategy changes;
// hashed /_next/static assets are cached as they are requested.
const VERSION = 'sdc-guard-v2';
const SHELL = ['/attendance', '/attendance.webmanifest', '/brand/sdc-logo.png', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    // Pre-cache the scripts and styles the guard page needs to boot offline.
    try {
      const html = await (await fetch('/attendance', { credentials: 'include' })).text();
      const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]))];
      await cache.addAll(assets);
    } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  // Immutable build assets: cache first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  // The guard page: network first, cached copy when offline.
  if (req.mode === 'navigate' && url.pathname === '/attendance') {
    event.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('/attendance', copy)); }
      return res;
    }).catch(() => caches.match('/attendance')));
    return;
  }
  // Icons and brand images: stale while revalidate.
  if (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/brand/') || url.pathname === '/attendance.webmanifest') {
    event.respondWith(caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});

// Wake open guard pages to flush their outbox when connectivity returns.
self.addEventListener('sync', (event) => {
  if (event.tag !== 'sdc-outbox') return;
  event.waitUntil(self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
    for (const c of clients) c.postMessage({ type: 'sdc-sync' });
  }));
});

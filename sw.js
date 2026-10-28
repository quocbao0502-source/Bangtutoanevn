// Service Worker for EVN Hotline PWA
const CACHE_NAME = 'evn-hotline-pwa-v17';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Always fetch fresh network first
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

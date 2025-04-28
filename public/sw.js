// Service Worker for PayOol & TikTok Coins PWA
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('payool-tiktok-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/src/main.tsx',
        '/src/App.tsx',
        '/src/index.css',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

const CACHE_NAME = 'receipts-v2';
const SHELL_FILES = ['./index.html', './dashboard.html', './manifest.json'];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Always fetch receipts.json from network (fresh data)
    if (url.href.includes('gist.githubusercontent.com')) {
        e.respondWith(fetch(e.request));
        return;
    }

    // App shell: cache first, fallback to network
    e.respondWith(
        caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
});

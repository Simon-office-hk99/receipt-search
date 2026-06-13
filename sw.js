const CACHE_NAME = 'receipts-v4';
const SHELL_FILES = ['./index.html', './dashboard.html', './history.html', './manifest.json'];

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

    // Always fetch data from network
    if (url.href.includes('gist.githubusercontent.com')) {
        e.respondWith(fetch(e.request));
        return;
    }

    // HTML pages: network first, fallback to cache
    if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
        e.respondWith(
            fetch(e.request).then((resp) => {
                const clone = resp.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                return resp;
            }).catch(() => caches.match(e.request))
        );
        return;
    }

    // Other assets: cache first, fallback to network
    e.respondWith(
        caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
});

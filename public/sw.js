const CACHE_NAME = 'cuidame-v1';
const VIEWER_CACHE = 'cuidame-viewer-v1';

// Archivos del shell de la app
const SHELL_ASSETS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== VIEWER_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cachear páginas del viewer /l/ para acceso offline
  if (url.pathname.startsWith('/l/')) {
    event.respondWith(
      caches.open(VIEWER_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch {
          const cached = await cache.match(event.request);
          return cached || new Response('Sin conexión. Recarga cuando tengas internet.', { status: 503 });
        }
      })
    );
    return;
  }

  // Para el resto: network first, fallback a cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

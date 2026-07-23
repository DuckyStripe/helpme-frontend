const CACHE_NAME = 'cuidame-v1';

// Archivos del shell de la app
const SHELL_ASSETS = ['/'];

// Rutas con datos médicos/sensibles: nunca deben persistir en Cache Storage.
const NEVER_CACHE = [/^\/l\//];

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
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Páginas con datos médicos: siempre red, nunca cache. Si no hay red, error
  // explícito en vez de servir una copia local con datos potencialmente obsoletos.
  if (NEVER_CACHE.some((re) => re.test(url.pathname))) {
    event.respondWith(
      fetch(event.request).catch(
        () => new Response('Sin conexión. Recarga cuando tengas internet.', { status: 503 })
      )
    );
    return;
  }

  // Para el resto: network first, fallback a cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

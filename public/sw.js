const CACHE_NAME = 'gcse-planner-v1';

// Cache the app shell on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network-first strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never intercept Supabase API calls — auth and data must always be live
  if (url.hostname.includes('supabase.co')) return;

  // Never intercept Next.js internal routes
  if (url.pathname.startsWith('/_next/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful page navigations
        if (response.ok && event.request.mode === 'navigate') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: try the cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // If no cache for a navigation, return the root cached page
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

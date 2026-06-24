// Meu Trevo - Service Worker
// Handles: PWA install, offline caching, push notifications

const CACHE_NAME = 'meu-trevo-v1';
const RESULTS_CACHE = 'meu-trevo-results-v1';

// App shell files to cache
const APP_SHELL = [
  '/',
  '/megasena',
  '/lotofacil',
  '/quina',
  '/lotomania',
  '/diadesorte',
  '/timemania',
  '/terms',
  '/privacy',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {
        // Ignore individual failures
        console.log('[SW] Some app shell files failed to cache');
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RESULTS_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy: Network first for API, Cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.protocol.startsWith('http')) {
    return;
  }

  // API requests: network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    // Don't cache auth or mutation requests
    if (request.method !== 'GET' || url.pathname.includes('/auth/') || url.pathname.includes('/bets')) {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache lottery results
          if (url.pathname.startsWith('/api/loteria/') && response.ok) {
            const cloned = response.clone();
            caches.open(RESULTS_CACHE).then((cache) => {
              cache.put(request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets: cache first, network fallback
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/icons/') || url.pathname === '/favicon.ico') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cloned);
            });
          }
          return response;
        }).catch(() => {
          if (cached) {
            return cached;
          }
          return new Response(null, { status: 504, statusText: 'Gateway Timeout' });
        });
      })
    );
    return;
  }

  if (request.mode !== 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) {
            return cached;
          }
          return new Response(null, { status: 504, statusText: 'Gateway Timeout' });
        });
      })
    );
    return;
  }

  // Pages: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Meu Trevo', body: 'Novo resultado disponível!', url: '/' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    vibrate: [100, 50, 100],
    tag: data.tag || 'meu-trevo',
    renotify: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Abrir Meu Trevo' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window or open new one
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

const CACHE = 'elektrika-v6';

// Installation: nur Manifest und Icons cachen, HTML immer vom Netzwerk
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['/elektrika-app/manifest.json', '/elektrika-app/icon-192.png', '/elektrika-app/icon-512.png']))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

// Alle alten Caches loeschen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// IMMER vom Netzwerk laden (kein HTML-Cache)
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.method !== 'GET') return;

  // HTML: immer Netzwerk zuerst
  if (e.request.mode === 'navigate' || e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).catch(() =>
        caches.match(e.request).then(c => c || new Response('<h1>Offline</h1>', {headers:{'Content-Type':'text/html'}}))
      )
    );
    return;
  }

  // Icons/Assets: Cache zuerst
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200)
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        return resp;
      });
    })
  );
});

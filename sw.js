const CACHE = 'elektrika-v5';
const FILES = [
  '/elektrika-app.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation: alle Dateien cachen
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// Alte Caches loeschen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// HTML-Seiten: immer zuerst Netzwerk (damit Updates sofort kommen)
// Andere Dateien: Cache zuerst
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() =>
        caches.match(e.request).then(cached =>
          cached || new Response('<h1>Offline – bitte Internet prüfen</h1>', {headers:{'Content-Type':'text/html'}})
        )
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => caches.match('/'));
    })
  );
});

const CACHE_NAME = 'spesa-costi-v28';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './chart.min.js',
  './icon-192.png',
  './icon-512.png',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // IMPORTANTE: {cache:'reload'} forza lo scaricamento dalla rete, ignorando
      // la cache HTTP del browser. Senza questo, il service worker rischiava di
      // "aggiornarsi" installando comunque una copia vecchia di index.html
      // ancora presente nella cache HTTP, restando bloccato sulla versione precedente.
      // Promise.allSettled (non Promise.all): se un singolo file fallisce a scaricarsi
      // (es. connessione instabile su un file esterno) non blocca l'installazione
      // di tutti gli altri, che restano comunque disponibili offline.
      return Promise.allSettled(
        ASSETS.map(url => fetch(url, {cache:'reload'}).then(response => cache.put(url, response)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

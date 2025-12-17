const CACHE_NAME = 'serenity-ai-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with error catching to prevent installation failure if one asset fails
      return Promise.all(
        ASSETS.map(url => {
            return cache.add(url).catch(err => console.warn('Failed to cache:', url, err));
        })
      );
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Navigation request (e.g. reloading the page or opening PWA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        return cached || fetch(event.request).catch(() => {
           // Fallback to cache index.html if network fails
           return caches.match('/index.html');
        });
      })
    );
    return;
  }

  // General requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(e => {
         // Suppress errors for non-critical assets
         // console.warn('Fetch failed:', event.request.url);
      });
    })
  );
});
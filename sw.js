
const CACHE_NAME = 'swajan-v2';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: নতুন ফাইল Cache-এ রাখুন
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(
        APP_FILES.map(async file => {
          try {
            await cache.add(file);
          } catch (error) {
            console.log('Cache skipped:', file);
          }
        })
      );
    })
  );

  self.skipWaiting();
});

// Activate: পুরোনো Cache মুছে নতুন সংস্করণ চালু করুন
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      await Promise.all(
        keys
          .filter(key => key.startsWith('swajan-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })
  );
});

// Fetch: HTML সবসময় আগে Network থেকে নেওয়ার চেষ্টা করুন
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Supabase ও অন্যান্য বাইরের সাইটের Request Cache করবেন না
  if (url.origin !== self.location.origin) return;

  // পেজ খুললে আগে নতুন সংস্করণ আনুন
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put('./index.html', copy);
            });
          }
          return response;
        })
        .catch(async () => {
          return (
            await caches.match('./index.html')
          ) || Response.error();
        })
    );
    return;
  }

  // অন্যান্য ফাইলের জন্য Cache ব্যবহার করুন
  event.respondWith(
    caches.match(request).then(async cached => {
      if (cached) return cached;

      try {
        return await fetch(request);
      } catch (error) {
        return Response.error();
      }
    })
  );
});

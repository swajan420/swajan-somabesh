
const CACHE_NAME = 'swajan-v4-fix-login';
const ASSETS = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

// Fetch - ONLY handle same-origin requests, NEVER intercept Supabase or other APIs
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Skip Supabase, CDN, and any external API
  if (url.origin !== location.origin) return;
  // Skip non-GET
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        // Don't cache HTML API calls
        if (e.request.url.includes('/rest/') || e.request.url.includes('/auth/')) {
          return response;
        }
        return response;
      }).catch(() => {
        // Only return index.html for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

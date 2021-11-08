var CACHE_NAME = "my-site-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

var urlsToCache = [
  "/index.html",
  "/db.js",
  "/index.js",
  "/manifest.webmanifest",
  "/styles.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

self.addEventListener("install", function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(DATA_CACHE_NAME).then((cache) => cache.add("/api/transaction"))
  );
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILE_TO_CACHE))
  );

  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key != CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removed previous cache data", key);
            return caches.delete(key)
          }
        })
      );
    })
  );

  self.clients.claim();

});

self.addEventListener("fetch", function(event) {
  // cache all get requests to /api routes
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(event.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(event.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        return response || fetch(event.request);
      });
    })
      );
    });


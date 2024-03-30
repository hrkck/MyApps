const cacheName = "v1";

const cacheAssets = [
  "/",
  "/assets/*.js",
  "/assets/*.css",
  "/icons/icon-512x512.png",
  "/icons/icon-192x192.png",
  "/icons/maskable-icon-512x512.png",
  "index.html",
  "favicon.ico",
];

console.log("doing thisngs");

self.addEventListener("install", (event) => {
  console.log(`Service worker installed: ${event}`);

  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      console.log("Service Worker: Caching Files");
      cache.addAll(cacheAssets);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log(`Service worker activated: ${event}`);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          console.log("Service Worker: Clearing Old Cache");
          return caches.delete(cache);
        })
      );
    })
  );
});

// fetch
const putInCache = async (request, response) => {
  const cache = await caches.open("v1");
  await cache.put(request, response);
};

const cacheFirst = async (request) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }
  const responseFromNetwork = await fetch(request);
  putInCache(request, responseFromNetwork.clone());
  return responseFromNetwork;
};

self.addEventListener("fetch", (event) => {
  event.respondWith(cacheFirst(event.request));
});

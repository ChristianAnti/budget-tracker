console.log("checking status");

// resources to build application
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/db.js",
    "/styles.css",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

// Prevent caches from using outdated cache (react manages this automatically)
const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// what is the event install, is that referencing service-worker?
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Successfully pre-cached files");
            // installs all the initial resources/static assets and put it in cache
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    // tell the browser to activate this service worker immediately once it has finished installing
    self.skipWaiting();
});

// clears the cache and reactivates the application once it's done
// activate the service worker and remove old data from the cache.
// runs before the install, makes sure all the version numbers stay the same
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Old cache removed", key);
                        // removes old cache
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    // will not call the server if file is in that cache
    self.clients.claim();
});

// handles requests
self.addEventListener("fetch", function (event) {
    // checks if api request, and if so will cache a successful request
    if (event.request.url.includes("/api/")) {
        event.respondWith(
            caches
                .open(DATA_CACHE_NAME)
                .then((cache) => {
                    return fetch(event.request)
                        .then((response) => {
                            // checks if response was good, if it is, copies and caches request
                            if (response.status === 200) {
                                cache.put(event.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch((err) => {
                            // if error, tries to get it from cache
                            return cache.match(event.request);
                        });
                })
                .catch((err) => console.log(err))
        );
        return;
    }

    // if we are offline or if we need something from the api but are still offline
    // this is the catch event
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            // so if the request isn't in the response then it's fetched? does it get cached then?
            return cache.match(event.request).then((response) => {
                return response || fetch(event.request);
            });
        })
    );
});


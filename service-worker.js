'use strict';

/* global caches */

// Get a random cache key everytime this script starts
const cacheKey = Math.random().toString(36).substr(2, 8);

const files = [
  './lib/bopomofo_encoder.js',
  './lib/client.js',
  './lib/worker.js',
  './lib/jszhuyin.js',
  './lib/jszhuyin_data_pack.js',
  './lib/jszhuyin_server.js',
  './lib/storage.js',
  './lib/data_loader.js',
  './lib/web.js',
  './assets/index.js',
  './',
  './data/database.data',
  '//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css',
  '//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap-theme.min.css'
];

self.oninstall = evt => {
  // Attempt to install an entire app atomically when the service worker is
  // being installed.
  // addAll() is atomic by design and we will rely on it.
  evt.waitUntil(caches.open(cacheKey).then(cache => cache.addAll(files)));
};

function Deferred() {
  this.promise = new Promise((res, rej) => {
    this.resolve = res;
    this.reject = rej;
  });
}

// This deferred object will keep the service worker alive for the entire page
// load. Also, given the lifetime of one service worker invocation is governed
// here, we don't need to use async-waituntil-polyfill here.
var deferredCacheRefresh = new Deferred();
var requestsToRecache = new Set();

self.onfetch = evt => {
  evt.waitUntil(deferredCacheRefresh.promise);
  // We will be using cache-then-network strategy for better experience,
  // given the database takes time to download.
  let responsePromise = caches.match(evt.request)
    .then((cachedResponse) => {
      if (cachedResponse) {
        requestsToRecache.add(evt.request.url);
        startCacheRefresh();
        return cachedResponse;
      }

      // Unlisted file being requested.
      return fetch(evt.request);
    });
  evt.respondWith(responsePromise);
};

function startCacheRefresh() {
  // We will wait for the current cache to be used fully before the new caching
  // process.
  if (requestsToRecache.size !== files.length) {
    return;
  }

  requestsToRecache.clear();

  // Open a new named cache, have it fetched fully,
  // and remove the entries in the old cache.
  // Given that there isn't a defined versioning here, we can't detect
  // the actual file changes here. Thus, we will never ask user to reload to
  // get the new version.
  Promise.resolve()
    .then(() => caches.open(cacheKey))
    .then(cache => cache.addAll(files))
    .then(() => caches.keys())
    .then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheKey).map(key => caches.delete(key)));
    })
    .then(() => deferredCacheRefresh.resolve());
}

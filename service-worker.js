'use strict';

// Get a random cache key every time this script starts --
// cached files under this key gets updated every time after the page loads,
// and everytime service worker updates.
const backgroundUpdateCacheKey = Math.random().toString(36).substr(2, 8);

// Cached files saved under this key only gets re-installed everytime
// service worker updates.
const persistCacheKey = 'persist';

// List of assets to cache converts to full URLs.
// The fetch event for the last URL will invoke cache refresh.
const backgroundUpdateFiles = [
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
  './data/database.data'
].map(relativeURL => (new URL(relativeURL, self.location)).href);

// List of assets to persist in cache, converts to full URLs.
const persistFiles = [
  '//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css',
  '//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap-theme.min.css'
].map(relativeURL => (new URL(relativeURL, self.location)).href);

const allFiles = [].concat(persistFiles, backgroundUpdateFiles);

self.oninstall = evt => {
  // Attempt to install two caches atomically when the service worker is
  // being installed.
  // addAll() is atomic by design and we will rely on it.
  // We however cannot make sure the two caches are in sync given there isn't
  // an API for us to make sure of that.
  evt.waitUntil(
    self.caches.keys()
      .then(keys => Promise.all(keys.map(key => self.caches.delete(key))))
      .then(() => Promise.all([
        self.caches.open(backgroundUpdateCacheKey)
          .then(cache => cache.addAll(backgroundUpdateFiles)),
        self.caches.open(persistCacheKey)
          .then(cache => cache.addAll(persistFiles))])));
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
  if (allFiles.indexOf(evt.request.url) === -1) {
    // A unlisted file is being requested.
    return;
  }

  evt.waitUntil(deferredCacheRefresh.promise);

  // We will be using cache-then-network strategy for better experience,
  // given the database takes time to download.
  let responsePromise = self.caches.match(evt.request)
    .then((cachedResponse) => {
      if (cachedResponse) {
        if (backgroundUpdateFiles.indexOf(evt.request.url) !== -1) {
          requestsToRecache.add(evt.request.url);
          startCacheRefresh(evt.request.url);
        }
        return cachedResponse;
      }

      // Unlisted file being requested.
      return fetch(evt.request);
    });
  evt.respondWith(responsePromise);
};

function startCacheRefresh(url) {
  // We will wait for the current cache to be used fully before the new caching
  // process.
  if (requestsToRecache.size !== backgroundUpdateFiles.length &&
      url !== backgroundUpdateFiles[backgroundUpdateFiles.length - 1]) {
    return;
  }

  requestsToRecache.clear();

  // Open a new named cache, have it fetched fully,
  // and remove the entries in the old cache.
  // Given that there isn't a defined versioning here, we can't detect
  // the actual file changes here. Thus, we will never ask user to reload to
  // get the new version.
  Promise.resolve()
    .then(() => self.caches.open(backgroundUpdateCacheKey))
    .then(cache => cache.addAll(backgroundUpdateFiles))
    .then(() => self.caches.keys())
    .then(keys => Promise.all(
        keys
          .filter(key =>
            (key !== backgroundUpdateCacheKey) && (key !== persistCacheKey))
          .map(key => self.caches.delete(key))))
    .then(() => deferredCacheRefresh.resolve());
}

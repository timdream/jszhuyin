'use strict';

// This file implemented Storage objects, with somewhere simular API
// to access data. Data is loaded in chunks so user don't have to wait.
//
// -- JSONStorage pulls JSON files online and handle the query in-memory.
//
// -- IndexedDBStorage is more complex, which gets the results from disk; it
// would have to be populated externally.
//
// -- Finally, HybirdStorage attempts to abstract away complexity of getting
// data from JSON and populate IndexedDB by using the forementioned objects.

/**
 * Basic shape of the Storage objects
 */
var StorageBase = function StorageBase() { };
/**
 * Run when the loading is complete.
 * @type {function}
 */
StorageBase.prototype.onloadend = null;
/**
 * Run when loading is successful.
 * @type {function}
 */
StorageBase.prototype.onload = null;
/**
 * Run when error occours.
 * @type {function}
 */
StorageBase.prototype.onerror = null;
/**
 * Load the storage.
 */
StorageBase.prototype.load = function storage_load() {
  throw 'Not implemented';
};
/**
 * Unload the storage.
 */
StorageBase.prototype.unload = function storage_unload() {
  throw 'Not implemented';
};
/**
 * Get values from storage.
 * @param  {string}   key      string to query.
 * @param  {function} callback callback to send the result.
 */
StorageBase.prototype.get = function storage_get(key, callback) {
  throw 'Not implemented';
};
/**
 * Perform range search.
 * @param  {string}   key      string to query.
 * @param  {function} callback callback to send the result.
 */
StorageBase.prototype.getRange = function storage_getRange(key, callback) {
  throw 'Not implemented';
};

/**
 * JSONStorage will get JSON files from network and perform search in-memory.
 * @this {object} JSONStorage instance.
 */
var JSONStorage = function JSONStorage() {
  this.JSON_FILES = [];

  this.loaded = false;
  this.partlyLoaded = undefined;
  this.loading = false;

  this._jsonData = [];
};
JSONStorage.prototype = new StorageBase();
/**
 * Run when each of the file (a "chunk" of the storage) is loaded.
 * @type {function}
 */
JSONStorage.prototype.onchunkload = null;
/**
 * String to use as the URL path to the files.
 * @type {string}
 */
JSONStorage.prototype.JSON_URL = './';
/**
 * Start loading data from the network.
 */
JSONStorage.prototype.load = function json_load() {
  if (this.loading)
    throw 'JSONStorage: You cannot called load() twice.';

  if (this.loaded || this.partlyLoaded)
    this.unload();

  this.loading = true;
  this.partlyLoaded = false;

  var self = this;
  var files = [].concat(this.JSON_FILES);
  var loadJSON = function json_loadJSON() {
    var filename = files.shift();

    if (!filename) {
      // Everything is loaded
      if (self._jsonData.indexOf(null) === -1)
        self.loaded = true;

      self.loading = false;

      if (typeof self.onload === 'function')
        self.onload();
      if (typeof self.onloadend === 'function')
        self.onloadend();

      return;
    }

    // Load this part.
    var xhr = new XMLHttpRequest();
    xhr.open('GET', self.JSON_URL + filename);
    // We don't know if this browser supports responseType = 'json'
    // unless we try.
    try {
      xhr.responseType = 'json';
    } catch (e) { }
    xhr.overrideMimeType('application/json; charset=utf-8');
    xhr.onreadystatechange = function xhrReadystatechange() {
      if (xhr.readyState !== xhr.DONE)
        return;

      var data;
      if (xhr.responseType == 'json') {
        data = xhr.response;
      } else {
        try {
          data = JSON.parse(xhr.responseText);
        } catch (e) { }
      }

      if (!data) {
        self.loading = false;

        if (typeof self.onerror === 'function')
          self.onerror();
        if (typeof self.onloadend === 'function')
          self.onloadend();
        return;
      }

      var chunk = new JSONDataChunk(data, self);

      if (typeof self.onchunkload === 'function')
        self.onchunkload(chunk);

      loadJSON();
    };

    xhr.send();
  };

  loadJSON();
};
/**
 * Unload the storage and purge data from memory.
 */
JSONStorage.prototype.unload = function json_unload() {
  if (this.loading)
    throw 'JSONStorage: load() in progress.';

  this.loaded = false;
  this.partlyLoaded = false;

  this._jsonData = [];
};
/**
 * Get values from storage. The callback runs synchronizely.
 * @param  {string}   key      string to query.
 * @param  {function} callback callback to send the result.
 */
JSONStorage.prototype.get = function json_get(key, callback) {
  var self = this;
  var found = this._jsonData.some(function json_get_some(chunk) {
    if (!chunk)
      return;

    var values = chunk.get(key);
    if (values) {
      callback.call(self, values);

      return true;
    }
  });

  if (!found)
    callback.call(this, undefined);
};

/**
 * Helper object to represent a chunk of storage loaded from the network.
 * @param {object} data JSON data of this chunk.
 * @param {object} jdb  JSONStorage object associated to the chunk, optional.
 * @this  {object}      JSONDataChunk instance.
 */
var JSONDataChunk = function JSONDataChunk(data, jdb) {
  this.data = data;

  if (jdb) {
    this.jdb = jdb;
    this.index = jdb._jsonData.length;

    jdb._jsonData.push(this);
    jdb.partlyLoaded = true;
  }
};
/**
 * Unload this chunk from memory by remove it's reference in the JSONStorage.
 */
JSONDataChunk.prototype.unload = function jdc_unload() {
  if (!this.jdb)
    return;

  // Remove the reference of ourselve.
  this.jdb._jsonData[this.index] = null;

  this.jdb.loaded = false;
};
/**
 * Return the values for a given key, if available.
 * @param  {string} key string to query.
 * @return {object}     values.
 */
JSONDataChunk.prototype.get = function jdc_get(key) {
  if (!this.data)
    return undefined;

  return this.data[key];
};

/**
 * IndexedDBStorage abstracts IndexedDB interface available in the browser.
 * @this {object} IndexedDBStorage instance.
 */
var IndexedDBStorage = function IndexedDBStorage() {
  this.loaded = false;
  this.partlyPopulated = undefined;
  this.populated = undefined;
  this.loading = false;

  this.db = null;
};
IndexedDBStorage.prototype = new StorageBase();
/**
 * Name to use for the database.
 * @type {string}
 */
IndexedDBStorage.prototype.IDB_NAME = 'database';
/**
 * Version to use for the database.
 * @type {number}
 */
IndexedDBStorage.prototype.IDB_VERSION = 1;
/**
 * Name to use for the object store.
 * @type {string}
 */
IndexedDBStorage.prototype.IDB_OBJECTSTORE_NAME = 'store';
/**
 * Special key to use for marking the database is populated.
 * @type {string}
 */
IndexedDBStorage.prototype.IDB_LAST_ENTRY_KEY = '__last_entry__';
/**
 * Reference to IDBFactory, removing vendor prefix.
 * @type {object}
 */
IndexedDBStorage.prototype.IDB = self.indexedDB ||
  self.webkitIndexedDB || self.mozIndexedDB || self.msIndexedDB;
/**
 * Reference to IDBDatabase, removing vendor prefix.
 * @type {object}
 */
IndexedDBStorage.prototype.IDBDatabase = self.IDBDatabase ||
  self.webkitIDBDatabase || self.msIDBDatabase;
/**
 * Reference to IDBKeyRange, removing vendor prefix.
 * @type {object}
 */
IndexedDBStorage.prototype.IDBKeyRange = self.IDBKeyRange ||
  self.webkitIDBKeyRange || self.msIDBKeyRange;
/**
 * Reference to IDBIndex, removing vendor prefix.
 * @type {object}
 */
IndexedDBStorage.prototype.IDBIndex = self.IDBIndex ||
  self.webkitIDBIndex || self.msIDBIndex;
/**
 * Return false if this browser doesn't support IndexedDB.
 * @type {boolean}
 */
IndexedDBStorage.prototype.isSupported =
  (function idb_isSupported() {
    var proto = IndexedDBStorage.prototype;

    return !!(
      // IndexedDB exists
      proto.IDB &&
      // Not implemented the outdated specification
      !proto.IDBDatabase.prototype.setVersion);
  })();
/**
 * Load the storage. This simply establishes the storage and does not
 * populate the data. "loaded" does not imply there is data in the database.
 */
IndexedDBStorage.prototype.load = function idb_load() {
  if (!this.isSupported)
    return;

  if (this.loading)
    throw 'IndexedDBStorage: You cannot called load() twice.';

  if (this.loaded)
    this.unload();

  this.loading = true;

  var self = this;

  var req = this.IDB.open(this.IDB_NAME, this.IDB_VERSION);
  req.onupgradeneeded = function idb_open_onupgradeneeded() {
    var db = req.result;

    // delete the old ObjectStore if present
    if (db.objectStoreNames.length !== 0) {
      Array.prototype.forEach.call(
        db.objectStoreNames,
        function idb_deleteEachObjStore(name) {
          db.deleteObjectStore(name);
        });
    }

    // create ObjectStore
    var store = db.createObjectStore(
      self.IDB_OBJECTSTORE_NAME, { keyPath: 'key' });

    // onupgradeneeded will follow by onsuccess event
    return;
  };
  req.onsuccess = function idb_open_onsuccess() {
    var db = self.db = req.result;
    self.loaded = true;

    self.loading = false;

    if (typeof self.onload === 'function')
      self.onload();
    if (typeof self.onloadend === 'function')
      self.onloadend();
  };
  req.onerror = function idb_open_error() {
    self.loading = false;

    if (typeof self.onerror === 'function')
      self.onerror();
    if (typeof self.onloadend === 'function')
      self.onloadend();
  };
};
/**
 * Unload the storage. Browser usually have trouble allowing multiple
 * connections to the same database, so you would need to unload before
 * throwing away the storage.
 */
IndexedDBStorage.prototype.unload = function idb_unload() {
  if (this.loading)
    throw 'IndexedDBStorage: load() in progress.';

  this.loaded = false;
  this.partlyPopulated = undefined;
  this.populated = undefined;

  if (this.db)
    this.db.close();

  this.db = null;
};
/**
 * Delete the database permanently. Imply unload().
 * @param {function} callback Callback to call when finish.
 * @this  {object}   IndexedDBStorage.
 */
IndexedDBStorage.prototype.deleteDatabase =
  function idb_deleteDatabase(callback) {
    this.unload();

    var self = this;
    var req = this.IDB.deleteDatabase(this.IDB_NAME);
    req.onerror = req.onsuccess = function idb_dbdeleted(evt) {
      if (typeof callback === 'function')
        callback.call(self, (evt.type === 'success'));
    };
  };
/**
 * Get the transaction of IndexeDB. If you call many IndexedDBStorage functions
 * at the same function loop, you should manage the transaction on your own
 * to make sure the callback returns in sequence with efficiency.
 * @param  {boolean} readwrite Set to true if you need to write the database.
 * @return {object}            Transaction.
 */
IndexedDBStorage.prototype.getTxn = function getTxn(readwrite) {
  if (!this.db)
    throw 'getTxn(): No database?!';

  return this.db.transaction(this.IDB_OBJECTSTORE_NAME,
    readwrite ? 'readwrite' : 'readonly');
};
/**
 * A limit putChunk() to make it divide chunks into smaller chunks.
 * @type {number}
 */
IndexedDBStorage.prototype.MAX_ACTION_PER_TXN = 100;
/**
 * Put a chunk of data into IndexedDB.
 * @param {object}   chunk    A JSONDataChunk.
 * @param {function} callback Function to call when complete.
 */
IndexedDBStorage.prototype.putChunk = function idb_putChunk(chunk, callback) {
  var MAX = this.MAX_ACTION_PER_TXN;
  var data = chunk.data;
  var keys = Object.keys(data);
  var self = this;

  var putSmallChunk = function putSmallChunk() {
    var i = 0;
    var txn = self.getTxn(true);
    var store = txn.objectStore(self.IDB_OBJECTSTORE_NAME);
    txn.onerror = function idb_putchunk_error() {
      // XXX: handle gracefully?
      throw 'putChunk() failed.';
    };

    while (i < MAX && keys.length) {
      var key = keys.shift();
      store.put({ 'key': key, 'values': data[key] });
      i++;
    }

    if (!keys.length) {
      txn.oncomplete = function idb_putchunk_oncomplete() {
        callback.call(self);
      };
    } else {
      txn.oncomplete = function idb_putchunk_oncomplete() {
        putSmallChunk();
      };
    }
  };

  putSmallChunk();
};
/**
 * See if the IndexedDB is populated.
 * @param {function} callback Function to call when complete.
 * @param {object}   txn      Transaction (optional).
 */
IndexedDBStorage.prototype.checkPopulated =
  function idb_checkPopulated(callback, txn) {
    // Try to get the __last_entry__ to see if the database have already
    // been populated.
    var txn = txn || this.getTxn();
    var req = txn.objectStore(this.IDB_OBJECTSTORE_NAME)
      .get(this.IDB_LAST_ENTRY_KEY);

    var self = this;
    req.onsuccess = req.onerror = function idb_check_populated() {
      self.populated = self.partlyPopulated = !!req.result;

      if (typeof callback === 'function')
        callback.call(self, self.populated);
    };
  };
/**
 * Set the IndexedDB as populated.
 * @param {function} callback Function to call when complete.
 * @param {object}   txn      Transaction (optional).
 */
IndexedDBStorage.prototype.setPopulated =
  function idb_setPopulated(callback, txn) {
    var txn = txn || this.getTxn(true);
    var req = txn.objectStore(this.IDB_OBJECTSTORE_NAME)
      .put({ 'key': this.IDB_LAST_ENTRY_KEY });

    var self = this;
    req.onsuccess = function idb_set_populated() {
      self.populated = self.partlyPopulated = true;

      if (typeof callback === 'function')
        callback.call(self, true);
    };
    req.onerror = function idb_set_populated() {
      self.populated = self.partlyPopulated = false;

      if (typeof callback === 'function')
        callback.call(self, false);
    };
  };
/**
 * Get values from storage. The callback runs asynchronizely.
 * @param  {string}   key      string to query.
 * @param  {function} callback callback to send the result.
 * @param  {object}   txn      Transaction (optional).
 */
IndexedDBStorage.prototype.get = function idb_get(key, callback, txn) {
  var txn = txn || this.getTxn();
  var req = txn.objectStore(this.IDB_OBJECTSTORE_NAME).get(key);

  var self = this;
  req.onsuccess = req.onerror = function idb_get_result() {
    if (typeof callback === 'function')
      callback.call(self, req.result && req.result['values']);
  };
};

/**
 * HybirdStorage will use both in-memory and IndexedDB to store and return
 * the result.
 * @this {object} HybirdStorage instance.
 */
var HybirdStorage = function HybirdStorage() {
  this.JSON_FILES = [];

  this.idbStorage = null;
  this.jsonStorage = null;

  this.loaded = false;
  this.partlyLoaded = undefined;
  this.loading = false;

  this.status = {
    useIndexedDB: undefined,
    populatedCount: undefined,
    loadedCount: 0,
    totalCount: 0
  };
};
HybirdStorage.prototype = new StorageBase();
/**
 * Run when each of the file (a "chunk" of the storage) is loaded.
 * @type {function}
 */
HybirdStorage.prototype.onchunkload = null;
/**
 * Run when each of the file (a "chunk" of the storage) is inserted
 * into IndexedDB.
 * @type {function}
 */
HybirdStorage.prototype.onpopulated = null;
/**
 * Run once when the initial chunk of data is available.
 * @type {function}
 */
HybirdStorage.prototype.onpartlyloaded = null;
/**
 * Use IndexedDB when available.
 * @type {boolean}
 */
HybirdStorage.prototype.USE_IDB = true;
/**
 * String to use as the URL path to the files.
 * @type {string}
 */
HybirdStorage.prototype.JSON_URL = './';
/**
 * Name to use for the database.
 * @type {string}
 */
HybirdStorage.prototype.IDB_NAME = 'database';
/**
 * Version to use for the database.
 * @type {number}
 */
HybirdStorage.prototype.IDB_VERSION = 1;
/**
 * Name to use for the object store.
 * @type {string}
 */
HybirdStorage.prototype.IDB_OBJECTSTORE_NAME = 'store';
/**
 * Special key to use for marking the database is populated.
 * @type {string}
 */
HybirdStorage.prototype.IDB_LAST_ENTRY_KEY = '__last_entry__';
/**
 * Load the hybrid storage. It will first loads IndexedDB and see if
 * it is populated, if not, it will get the data from network (via JSONStorage),
 * and populate IndexedDB.
 * Finally, JSONStorage will be removed to free up the memory.
 */
HybirdStorage.prototype.load = function hs_load() {
  if (this.loading)
    throw 'HybirdStorage: You cannot called load() twice.';

  if (this.loaded || this.partlyLoaded)
    this.unload();

  this.loading = true;

  if (!this.USE_IDB || !IndexedDBStorage.prototype.isSupported) {
    this.loadJSONStorage(false);
    this.status.useIndexedDB = false;

    return;
  }

  this.status.useIndexedDB = true;

  // Let's first try to load IndexedDB and see if it's populated.
  var self = this;
  var idbStorage = this.idbStorage = new IndexedDBStorage();
  idbStorage.IDB_NAME = this.IDB_NAME;
  idbStorage.IDB_VERSION = this.IDB_VERSION;
  idbStorage.IDB_OBJECTSTORE_NAME = this.IDB_OBJECTSTORE_NAME;
  idbStorage.IDB_LAST_ENTRY_KEY = this.IDB_LAST_ENTRY_KEY;
  idbStorage.onerror = this.onerror;
  idbStorage.onloadend = function hs_idb_loadend() {
    idbStorage.checkPopulated(function hs_idb_populated(populated) {

      if (!populated) {
        self.loadJSONStorage(true);

        return;
      }

      self.loaded = self.partlyLoaded = true;
      self.loading = false;

      if (typeof self.onload === 'function')
        self.onload(self.status);
      if (typeof self.onloadend === 'function')
        self.onloadend(self.status);
    });
  };
  idbStorage.load();
};
/**
 * Load JSONStorage, used as an internal step for load()
 * @param {boolean} populateIdb Set to true to populate IndexedDB after loading
 *                              each chunk.
 */
HybirdStorage.prototype.loadJSONStorage =
  function hs_loadJSONStorage(populateIdb) {

    this.partlyLoaded = false;

    // Not populated. Load JSONStorage and feed it into IndexedDB.
    var jsonStorage = this.jsonStorage = new JSONStorage();
    jsonStorage.JSON_URL = this.JSON_URL;
    jsonStorage.JSON_FILES = this.JSON_FILES;

    this.status.loadedCount = 0;
    this.status.totalCount = this.JSON_FILES.length;

    var self = this;
    if (populateIdb) {
      this.status.populatedCount = 0;

      var i = this.JSON_FILES.length;
      jsonStorage.onerror = function hs_jdb_error() {
        self.loading = false;

        if (typeof self.onerror === 'function')
          self.onerror(self.status);
        if (typeof self.onloadend === 'function')
          self.onloadend(self.status);
      };

      var idbStorage = self.idbStorage;
      jsonStorage.onchunkload = function hs_jdb_chunkload(chunk) {
        self.status.loadedCount++;

        if (!self.partlyLoaded) {
          self.partlyLoaded = true;

          if (typeof self.onchunkload === 'function')
            self.onchunkload(self.status);

          if (typeof self.onpartlyloaded === 'function')
            self.onpartlyloaded(self.status);
        } else {
          if (typeof self.onchunkload === 'function')
            self.onchunkload(self.status);
        }

        self.idbStorage.putChunk(chunk, function hs_idb_put() {
          self.status.populatedCount++;

          // Remove this chunk from JSONStorage.
          chunk.unload();

          if (typeof self.onpopulated === 'function')
            self.onpopulated(self.status);

          i--;
          if (i) {
            return;
          }

          // All done! Remove the entire JSONStorage.
          jsonStorage.unload();
          self.jsonStorage = null;

          // Set IndexedDB populated
          self.idbStorage.setPopulated(function hs_idb_populated() {
            self.loaded = true;
            self.loading = false;

            if (typeof self.onload === 'function')
              self.onload(self.status);
            if (typeof self.onloadend === 'function')
              self.onloadend(self.status);
          });
        });
      };
    } else {
      jsonStorage.onerror = function() {
        self.loading = false;

        if (typeof self.onerror === 'function')
          self.onerror(self.status);
      };
      jsonStorage.onchunkload = function() {
        self.status.loadedCount++;

        if (!self.partlyLoaded) {
          self.partlyLoaded = true;

          if (typeof self.onchunkload === 'function')
            self.onchunkload(self.status);

          if (typeof self.onpartlyloaded === 'function')
            self.onpartlyloaded(self.status);
        } else {
          if (typeof self.onchunkload === 'function')
            self.onchunkload(self.status);
        }
      };
      jsonStorage.onloadend = function() {
        self.loaded = jsonStorage.loaded;
        self.loading = false;

        if (typeof self.onload === 'function')
          self.onload(self.status);
        if (typeof self.onloadend === 'function')
          self.onloadend(self.status);
      };
    }
    jsonStorage.load();
  };
/**
 * Unload the storage. Browser usually have trouble allowing multiple
 * connections to the same database, so you would need to unload before
 * throwing away the storage.
 */
HybirdStorage.prototype.unload = function hs_unload() {
  if (this.loading)
    throw 'HybirdStorage: load() in progress.';

  if (this.jsonStorage) {
    this.jsonStorage.unload();
    this.jsonStorage = null;
  }

  if (this.idbStorage) {
    this.idbStorage.unload();
    this.idbStorage = null;
  }

  this.loaded = false;
  this.partlyLoaded = undefined;
};
/**
 * Delete the IndexedDB database permanently. Imply unload().
 * @param {function} callback Callback to call when finish.
 * @this  {object}   IndexedDBStorage.
 */
HybirdStorage.prototype.deleteDatabase = function hs_deleteDatabase(callback) {
  var idbStorage = this.idbStorage;
  if (!idbStorage) {
    this.unload();

    if (typeof callback === 'function')
      callback.call(self);

    return;
  }

  var self = this;
  idbStorage.deleteDatabase(function hs_idb_deleted(success) {
    self.unload();
    if (typeof callback === 'function')
      callback.call(self, success);
  });
};
/**
 * Get the transaction of IndexeDB. If you call many IndexedDBStorage functions
 * at the same function loop, you should manage the transaction on your own
 * to make sure the callback returns in sequence with efficiency.
 * Return null if IndexedDB is not used.
 * @param  {boolean} readwrite Set to true if you need to write the database.
 * @return {object}            Transaction.
 */
HybirdStorage.prototype.getTxn = function hs_getTxn(readwrite) {
  if (this.idbStorage)
    return this.idbStorage.getTxn(readwrite);

  return null;
};
/**
 * Get values from storage.
 * The callback might run synchronizely or aynchronizely.
 * @param  {string}   key      string to query.
 * @param  {function} callback callback to send the result.
 * @param {object}   txn      Transaction (optional).
 */
HybirdStorage.prototype.get = function hs_get(key, callback, txn) {
  if (this.jsonStorage && this.idbStorage) {
    // We got sync callback from JSONStorage and async from IndexedDBStorage,
    // so it's safe to nest it.
    var self = this;
    this.jsonStorage.get(key, function hs_json_get(values) {
      if (values) {
        callback.call(self, values);
        return;
      }

      self.idbStorage.get(key, callback, txn);
    });

    return;
  }

  if (this.jsonStorage) {
    this.jsonStorage.get(key, callback);

    return;
  }

  if (this.idbStorage) {
    this.idbStorage.get(key, callback, txn);

    return;
  }

  callback.call(this, undefined);
};

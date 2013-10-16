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
 * Getting the transition object.
 * @return {object} transition object.
 */
StorageBase.prototype.getTxn = function storage_getTxn() {
  return null;
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
 * Look for all value begin with this key.
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
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('application/json; charset=utf-8');
    }
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
        self.onchunkload(chunk, filename);

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
      self.populated =
        (!req.result || !req.result['values']) ? [] : req.result['values'];

      if (typeof callback === 'function')
        callback.call(self, self.populated);
    };
  };
/**
 * Set the IndexedDB as populated.
 * @param {strong}   name     Name to mark populated.
 * @param {function} callback Function to call when complete.
 * @param {object}   txn      Transaction (optional).
 */
IndexedDBStorage.prototype.setPopulated =
  function idb_setPopulated(name, callback, txn) {
    var txn = txn || this.getTxn(true);
    this.populated = this.populated || [];
    this.populated.push(name);

    var req = txn.objectStore(this.IDB_OBJECTSTORE_NAME)
      .put({ 'key': this.IDB_LAST_ENTRY_KEY, 'values': this.populated });

    var self = this;
    req.onsuccess = function idb_set_populated() {
      if (typeof callback === 'function')
        callback.call(self, true);
    };
    req.onerror = function idb_set_populated() {
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
  req.onsuccess = req.onerror = function idb_get_result(evt) {
    if (typeof callback === 'function')
      callback.call(self, req.result && req.result['values']);

    // Prevent the err from throwing.
    evt.preventDefault();
  };
};
/**
 * Look for all value begin with this key.
 * @param  {string}   key      string to query.
 * @param  {function} callback callback to send the result.
 * @param  {object}   txn      Transaction (optional).
 */
IndexedDBStorage.prototype.getRange =
  function idb_getRange(key, callback, txn) {
    var txn = txn || this.getTxn();
    var upperBound = key.substr(0, key.length - 1) +
      String.fromCharCode(key.charCodeAt(key.length - 1) + 1);
    var range = IDBKeyRange.bound(key, upperBound, true, true);

    var self = this;
    var req;
    if (IDBIndex.prototype.mozGetAll) {
      // Mozilla IndexedDB extension
      req = txn.objectStore(this.IDB_OBJECTSTORE_NAME).mozGetAll(range);
      req.onsuccess = function idb_got_range(evt) {
        if (typeof callback === 'function')
          callback.call(self, req.result);
      };
    } else {
      req = txn.objectStore(this.IDB_OBJECTSTORE_NAME).openCursor(range);
      var result = [];
      req.onsuccess = function idb_got_cursor(evt) {
        var cursor = req.result;
        if (!cursor) {
          if (typeof callback === 'function')
            callback.call(self, result);

          return;
        }

        result.push(cursor.value);
        cursor.continue();
      };
    }
    req.onerror = function idb_error(evt) {
      if (typeof callback === 'function')
        callback.call(self, []);

      // Prevent the err from throwing.
      evt.preventDefault();
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
    useJSON: undefined,
    populatedCount: undefined,
    loadedCount: undefined,
    totalCount: undefined
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
 * Load JSON when needed.
 * @type {boolean}
 */
HybirdStorage.prototype.USE_JSON = true;
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

  // If there is no IDB, we should load JSON.
  if (!this.USE_IDB || !IndexedDBStorage.prototype.isSupported) {
    this.status.useIndexedDB = false;

    // If we are not allowed to load JSON, there is no choice
    // but to give up.
    if (!this.USE_JSON) {
      this.status.useJSON = false;
      this.loading = false;

      if (typeof self.onerror === 'function')
        self.onerror(self.status);
      if (typeof self.onloadend === 'function')
        self.onloadend(self.status);

      return;
    }

    this.loadJSON();
    return;
  }

  this.loadIndexedDB();
};
/**
 * Load IndexedDBStorage, used as an internal step for load().
 */
HybirdStorage.prototype.loadIndexedDB = function hs_loadIndexedDB() {
  this.status.useIndexedDB = true;

  var idbStorage = this.idbStorage = new IndexedDBStorage();
  idbStorage.IDB_NAME = this.IDB_NAME;
  idbStorage.IDB_VERSION = this.IDB_VERSION;
  idbStorage.IDB_OBJECTSTORE_NAME = this.IDB_OBJECTSTORE_NAME;
  idbStorage.IDB_LAST_ENTRY_KEY = this.IDB_LAST_ENTRY_KEY;
  idbStorage.onerror = this.onerror;

  var self = this;
  idbStorage.onloadend = function hs_idb_loadend() {
    if (!idbStorage.loaded) {
      self.loading = false;

      if (typeof self.onerror === 'function')
        self.onerror(self.status);
      if (typeof self.onloadend === 'function')
        self.onloadend(self.status);

      return;
    }

    if (!self.USE_JSON) {
      self.status.useJSON = false;
      self.loaded = self.partlyLoaded = true;
      self.loading = false;

      if (typeof self.onpartlyloaded === 'function')
        self.onpartlyloaded(self.status);
      if (typeof self.onload === 'function')
        self.onload(self.status);
      if (typeof self.onloadend === 'function')
        self.onloadend(self.status);

      return;
    }

    self.populatedIndexedDB();
  };
  idbStorage.load();
};
/**
 * Load IndexedDBStorage, used as an internal step for load().
 */
HybirdStorage.prototype.populatedIndexedDB = function hs_populatedIndexedDB() {
  var idbStorage = this.idbStorage;

  // We would need to know what's in the database first.
  if (!idbStorage.populated) {
    idbStorage.checkPopulated(this.populatedIndexedDB.bind(this));

    return;
  }

  var populated = idbStorage.populated;
  var filesToPopulate = [];
  this.JSON_FILES.forEach(function checkFile(name) {
    if (populated.indexOf(name) !== -1)
      return;

    filesToPopulate.push(name);
  });

  // We are good if there is nothing left to copy.
  if (filesToPopulate.length === 0) {
    this.loaded = this.partlyLoaded = true;
    this.status.loadedCount =
      this.status.populatedCount =
      this.status.totalCount = this.JSON_FILES.length;

    this.status.useJSON = false;
    this.loading = false;

    if (typeof this.onpartlyloaded === 'function')
      this.onpartlyloaded(this.status);
    if (typeof this.onload === 'function')
      this.onload(this.status);
    if (typeof this.onloadend === 'function')
      this.onloadend(this.status);

    return;
  }

  // No need to keep an array with identical content.
  if (filesToPopulate.length === this.JSON_FILES)
    filesToPopulate = this.JSON_FILES;

  // Populate IndexedDB by loading JSONStorage
  this.partlyLoaded = !!populated.length;
  this.status.useJSON = true;
  var jsonStorage = this.jsonStorage = new JSONStorage();
  jsonStorage.JSON_URL = this.JSON_URL;
  jsonStorage.JSON_FILES = filesToPopulate;

  this.status.loadedCount = this.status.populatedCount = populated.length;
  this.status.totalCount = this.JSON_FILES.length;

  if (this.partlyLoaded) {
    if (typeof this.onpartlyloaded === 'function')
      this.onpartlyloaded(this.status);
  }

  var self = this;
  jsonStorage.onerror = function hs_jdb_error() {
    self.loading = false;

    if (typeof self.onerror === 'function')
      self.onerror(self.status);
    if (typeof self.onloadend === 'function')
      self.onloadend(self.status);
  };

  var i = 0;
  jsonStorage.onchunkload = function hs_jdb_chunkload(chunk, name) {
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

      self.idbStorage.setPopulated(name, function hs_idb_populated() {
        i++;
        if (i < jsonStorage.JSON_FILES.length)
          return;

        // All done! Remove the entire JSONStorage.
        jsonStorage.unload();
        self.jsonStorage = null;

        self.loaded = true;
        self.loading = false;

        if (typeof self.onload === 'function')
          self.onload(self.status);
        if (typeof self.onloadend === 'function')
          self.onloadend(self.status);
      });
    });
  };
  jsonStorage.load();
};
/**
 * Load JSONStorage, used as an internal step for load().
 */
HybirdStorage.prototype.loadJSON = function hs_loadJSON() {
    this.partlyLoaded = false;
    this.status.useJSON = true;

    // Not populated. Load JSONStorage and feed it into IndexedDB.
    var idbStorage = this.idbStorage;
    var jsonStorage = this.jsonStorage = new JSONStorage();
    jsonStorage.JSON_URL = this.JSON_URL;
    jsonStorage.JSON_FILES = this.JSON_FILES;

    this.status.loadedCount = 0;
    this.status.totalCount = this.JSON_FILES.length;

    var self = this;
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

  this.status = {
    useIndexedDB: undefined,
    useJSON: undefined,
    populatedCount: undefined,
    loadedCount: undefined,
    totalCount: undefined
  };
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
/**
 * Look for all value begin with this key.
 * @param  {string}   key      string to query.
 * @param  {function} callback callback to send the result.
 * @param  {object}   txn      Transaction (optional).
 */
HybirdStorage.prototype.getRange = function hs_getRange(key, callback, txn) {
  if (!this.idbStorage) {
    callback([]);

    return;
  }

  this.idbStorage.getRange(key, callback, txn);
};

/**
 * BinStorage rely on a big chunk of encoded ArrayBuffer to do the lookup.
 * @constructor
 */
var BinStorage = function BinStorage() {
  this.loaded = false;
  this.loading = false;
  this._bin = undefined;
};
BinStorage.prototype = new StorageBase();
/**
 * Database file to load
 * @type {String}
 */
BinStorage.prototype.DATA_URL = './database.data';
/**
 * Load the database.
 * @this {object} BinStorage instance.
 */
BinStorage.prototype.load = function bs_load() {
  if (this.loading)
    throw 'BinStorage: You cannot called load() twice.';

  if (this.loaded)
    this.unload();

  var xhr = new XMLHttpRequest();
  xhr.open('GET', this.DATA_URL);
  xhr.responseType = 'arraybuffer';

  var self = this;
  xhr.onreadystatechange = function xhrReadystatechange() {
    if (xhr.readyState !== xhr.DONE)
      return;

    var data = xhr.response;
    if (!data) {
      self.loading = false;

      if (typeof self.onerror === 'function')
        self.onerror();
      if (typeof self.onloadend === 'function')
        self.onloadend();
      return;
    }

    self._bin = data;

    self.loaded = true;
    self.loading = false;

    if (typeof self.onload === 'function')
      self.onload();
    if (typeof self.onloadend === 'function')
      self.onloadend();
  };
  xhr.send();
};
/**
 * Unoad the database.
 * @this {object} BinStorage instance.
 */
BinStorage.prototype.unload = function bs_unload() {
  if (this.loading)
    throw 'BinStorage: load() in progress.';

  this._bin = undefined;
  this.loaded = false;
};
/**
 * Get values from storage. The callback runs synchronizely.
 * @param  {string}   key      string to query.
 * @param  {function} callback callback to send the result.
 */
BinStorage.prototype.get = function bs_get(key, callback) {
  if (!this.loaded)
    throw 'BinStorage: not loaded.';

  var keyArray = key.split('').map(function str2CharCode(char) {
    return char.charCodeAt(0);
  });

  var code;
  var byteOffset = 0;
  while ((code = keyArray.shift()) !== undefined) {
    byteOffset = this._searchBlock(code, byteOffset);
    if (byteOffset === -1) {
      callback(undefined);

      return;
    }
  }
  callback(this._getBlockContent(byteOffset));
};
/**
 * Look for all value begin with this key.
 * @param  {string}   key      string to query.
 * @param  {function} callback callback to send the result.
 */
BinStorage.prototype.getRange = function bs_getRange(key, callback) {
  if (!this.loaded)
    throw 'BinStorage: not loaded.';

  var keyArray = key.split('').map(function str2CharCode(char) {
    return char.charCodeAt(0);
  });

  var code;
  var byteOffset = 0;
  while ((code = keyArray.shift()) !== undefined) {
    byteOffset = this._searchBlock(code, byteOffset);
    if (byteOffset === -1) {
      callback([]);

      return;
    }
  }

  var bin = this._bin;
  var self = this;
  var result = [];

  var getBlockContents = function bs_getBlockContents(byteOffset) {
    var header = new Uint16Array(bin, byteOffset, 2);

    if (!header[0])
      return;

    var addressBlockByteOffset = byteOffset +
        (2 + header[1] + header[0]) * Uint16Array.BYTES_PER_ELEMENT;

    // Consider the size of the padding.
    if (addressBlockByteOffset % Uint32Array.BYTES_PER_ELEMENT)
      addressBlockByteOffset += Uint16Array.BYTES_PER_ELEMENT;

    var addressBlock = new Uint32Array(bin, addressBlockByteOffset, header[0]);

    var i = addressBlock.length;
    while (i--) {
      var content = self._getBlockContent(addressBlock[i]);
      if (content) {
        result.push(content);
      }

      getBlockContents(addressBlock[i]);
    }
  };

  getBlockContents(byteOffset);
  callback(result);
};
/**
 * Internal method for search a given block for a single character.
 * @param  {number}   code        code of the character.
 * @param  {numbber}  byteOffset  Byte offset of the block.
 * @return {number}   byteOffset of the block found, or -1.
 */
BinStorage.prototype._searchBlock = function bs_searchBlock(code, byteOffset) {
  var bin = this._bin;
  var header = new Uint16Array(bin, byteOffset, 2);

  var keyBlockByteOffset = byteOffset +
      (2 + header[1]) * Uint16Array.BYTES_PER_ELEMENT;

  var addressBlockByteOffset = byteOffset +
      (2 + header[1] + header[0]) * Uint16Array.BYTES_PER_ELEMENT;

  // Consider the size of the padding.
  if (addressBlockByteOffset % Uint32Array.BYTES_PER_ELEMENT)
    addressBlockByteOffset += Uint16Array.BYTES_PER_ELEMENT;

  var keyBlock = new Uint16Array(bin, keyBlockByteOffset, header[0]);
  var addressBlock = new Uint32Array(bin, addressBlockByteOffset, header[0]);

  // Do a interpolation search
  var low = 0;
  var high = keyBlock.length - 1;
  var mid;

  while (keyBlock[low] <= code && keyBlock[high] >= code) {
    mid = low +
      (((code - keyBlock[low]) * (high - low)) /
        (keyBlock[high] - keyBlock[low])) | 0;

    if (keyBlock[mid] < code) {
      low = mid + 1;
    } else if (keyBlock[mid] > code) {
      high = mid - 1;
    } else {
      return addressBlock[mid];
    }
  }

  if (keyBlock[low] === code) {
    return addressBlock[low];
  } else {
    return -1;
  }
};
/**
 * Internal method for getting the content of the block.
 * @param  {numbber}  byteOffset  Byte offset of the block.
 * @return {string}   Content of the value.
 */
BinStorage.prototype._getBlockContent =
  function bs_getBlockContent(byteOffset) {
    var bin = this._bin;
    var header = new Uint16Array(bin, byteOffset, 2);

    if (header[1] === 0)
      return undefined;

    var contentBlock = new Uint16Array(bin,
                    byteOffset + 2 * Uint16Array.BYTES_PER_ELEMENT,
                    header[1]);

    return String.fromCharCode.apply(String, contentBlock);
  };

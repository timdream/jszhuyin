'use strict';

module('JSONStorage');

test('create instance', function() {
  var storage = new JSONStorage();
  ok(!storage.loaded, 'Passed!');
  ok(!storage.partlyLoaded, 'Passed!');
});

test('load()', function() {
  var storage = new JSONStorage();
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(10);
  var names = ['test1.json', 'test2.json'];
  storage.onchunkload = function(chunk, name) {
    ok(chunk instanceof JSONDataChunk, 'Passed!');
    ok(name, names.shift(), 'Passed!');
    ok(storage.partlyLoaded, 'Passed!');
  };
  storage.onload = function() {
    ok(storage.loaded, 'Passed!');
    ok(storage.partlyLoaded, 'Passed!');
  };
  storage.onloadend = function() {
    ok(storage.loaded, 'Passed!');
    equal(storage._jsonData.length, 2, 'Data exists');
    start();
  };

  stop();
  storage.load();
});

test('load() non-exist files', function() {
  var storage = new JSONStorage();
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['404.json'];
  expect(2);
  storage.onerror = function() {
    ok(true, 'Passed!');
  };
  storage.onloadend = function() {
    ok(!storage.loaded, 'Passed!');
    start();
  };

  stop();
  storage.load();
});

test('unload()', function() {
  var storage = new JSONStorage();
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json'];
  expect(4);
  storage.onloadend = function() {
    ok(storage.loaded, 'Passed!');
    equal(storage._jsonData.length, 1, 'Data exists');
    storage.unload();
    ok(!storage.loaded, 'Passed!');
    equal(storage._jsonData.length, 0, 'Data purged');
    start();
  };

  stop();
  storage.load();
});

test('get()', function() {
  var storage = new JSONStorage();
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json'];
  expect(1);
  storage.onloadend = function() {
    storage.get('Key1', function(values) {
      equal(values, 'value1value2', 'Passed!');
      start();
    });
  };

  stop();
  storage.load();
});

test('get() from multiple files', function() {
  var storage = new JSONStorage();
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(2);
  storage.onloadend = function() {
    storage.get('Key1', function(values) {
      deepEqual(values, 'value1value2', 'Passed!');
      storage.get('Key2', function(values) {
        deepEqual(values, 'value3value4', 'Passed!');
        start();
      });
    });
  };

  stop();
  storage.load();
});

module('JSONDataChunk');

test('create instance', function() {
  var jdbMock = {
    _jsonData: [],
    partlyLoaded: false,
    loaded: false
  };
  var chunk = new JSONDataChunk({ 'key': 'value1value2' }, jdbMock);
  ok(jdbMock.partlyLoaded, 'Passed!');
  equal(jdbMock._jsonData[0], chunk, 'Passed!');
});

test('unload()', function() {
  var jdbMock = {
    _jsonData: [],
    partlyLoaded: false,
    loaded: false
  };
  var chunk = new JSONDataChunk({ 'key': 'value1value2' }, jdbMock);
  jdbMock.loaded = true;
  chunk.unload();
  ok(!jdbMock.loaded, 'Passed!');
  equal(jdbMock._jsonData[0], null, 'Passed!');
});

test('get()', function() {
  var chunk = new JSONDataChunk({ 'key': 'value1value2' }, {
    _jsonData: []
  });
  deepEqual(chunk.get('key'), 'value1value2', 'Passed!');
});

module('IndexedDBStorage', {
  teardown: function() {
    var IDB = IndexedDBStorage.prototype.IDB;
    var req = IDB.deleteDatabase('TestDatabase');
    req.onerror = function() {
      throw 'Teardown error';
    };
  }
});

test('create instance', function() {
  var storage = new IndexedDBStorage();
  ok(!storage.loaded, 'Passed!');
});

test('load()', function() {
  var storage = new IndexedDBStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  expect(4);
  storage.onload = function() {
    ok(storage.loaded, 'Passed!');
    ok(!storage.partlyPopulated, 'Passed!');
    ok(!storage.populated, 'Passed!');
  };
  storage.onloadend = function() {
    ok(storage.loaded, 'Passed!');
    storage.unload();
    start();
  };

  stop();
  storage.load();
});

test('unload()', function() {
  var storage = new IndexedDBStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  expect(2);
  storage.onloadend = function() {
    ok(storage.loaded, 'Passed!');
    storage.unload();
    ok(!storage.loaded, 'Passed!');

    start();
  };

  stop();
  storage.load();
});

test('deleteDatabase()', function() {
  var storage = new IndexedDBStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  expect(4);
  var nativeDelDb = storage.IDB.deleteDatabase;
  var fakeIDBOpenDBRequest = {};
  storage.IDB.deleteDatabase = function mockDelDb(name) {
    equal(name, 'TestDatabase', 'Passed!');

    setTimeout(function() {
      fakeIDBOpenDBRequest.onsuccess({
        'type': 'success'
      });
    });
    return fakeIDBOpenDBRequest;
  };
  storage.onloadend = function() {
    ok(storage.loaded, 'Passed!');
    storage.deleteDatabase(function(result) {
      ok(result, 'Passed!');
      ok(!storage.loaded, 'Passed!');

      storage.IDB.deleteDatabase = nativeDelDb;
      start();
    });
  };

  stop();
  storage.load();
});

test('checkPopulated()', function() {
  var storage = new IndexedDBStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  expect(2);
  storage.onloadend = function() {
    storage.checkPopulated(function(populated) {
      deepEqual(populated, [], 'Passed!');
      deepEqual(storage.populated, [], 'Passed!');
      storage.unload();

      start();
    });
  };

  stop();
  storage.load();
});

test('setPopulated()', function() {
  var storage = new IndexedDBStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  expect(4);
  storage.onloadend = function() {
    storage.setPopulated('name', function(success) {
      ok(success, 'Passed!');
      ok(storage.populated, 'Passed!');
      storage.unload();
      storage = null;

      var storage2 = new IndexedDBStorage();
      storage2.IDB_NAME = 'TestDatabase';
      storage2.IDB_VERSION = 1;
      storage2.onloadend = function() {
        storage2.checkPopulated(function(populated) {
          deepEqual(populated, ['name'], 'Passed!');
          deepEqual(storage2.populated, ['name'], 'Passed!');
          storage2.unload();

          start();
        });
      };
      storage2.load();
    });
  };

  stop();
  storage.load();
});

test('putChunk() and get() single key', function() {
  var storage = new IndexedDBStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  expect(2);
  storage.onloadend = function() {
    ok(storage.loaded, 'Passed!');
    var chunk = new JSONDataChunk({ 'key': 'value1value2' });

    storage.putChunk(chunk, function() {
      storage.get('key', function(values) {
        deepEqual(values, 'value1value2', 'Passed');
        storage.unload();

        start();
      });
    });
  };

  stop();
  storage.load();
});

test('putChunk() and get() multiple keys in one transation', function() {
  var storage = new IndexedDBStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  expect(2);
  storage.onloadend = function() {
    var chunk = new JSONDataChunk({
      'key': 'value1value2',
      'key2': 'value3value4' });

    storage.putChunk(chunk, function() {
      var txn = storage.getTxn();
      storage.get('key', function(values) {
        deepEqual(values, 'value1value2', 'Passed');
      }, txn);
      storage.get('key2', function(values) {
        deepEqual(values, 'value3value4', 'Passed');

        storage.unload();
        start();
      }, txn);
    });
  };

  stop();
  storage.load();
});

module('HybirdStorage', {
  teardown: function() {
    var IDB = IndexedDBStorage.prototype.IDB;
    var req = IDB.deleteDatabase('TestDatabase');
    req.onerror = function() {
      throw 'Teardown error';
    };
  }
});

test('create instance', function() {
  var storage = new HybirdStorage();
  ok(!storage.loaded, 'Passed!');
  ok(!storage.partlyLoaded, 'Passed!');
});

test('load() and populated IndexedDB.', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(2 + 2 + 2 + 1 + 5);

  var chunkloadStatus = [
    {
      useIndexedDB: true,
      useJSON: true,
      populatedCount: undefined,
      loadedCount: 1,
      totalCount: 2
    },
    {
      useIndexedDB: true,
      useJSON: true,
      populatedCount: undefined,
      loadedCount: 2,
      totalCount: 2
    }
  ];
  storage.onchunkload = function(status) {
    var expectedStatus = chunkloadStatus.shift();
    expectedStatus.populatedCount = status.populatedCount;
    deepEqual(status, expectedStatus, 'Passed!');
  };

  storage.onpartlyloaded = function(status) {
    deepEqual(status, {
      useIndexedDB: true,
      useJSON: true,
      populatedCount: 0,
      loadedCount: 1,
      totalCount: 2 }, 'Passed!');
    ok(storage.partlyLoaded, 'Passed!');
  };

  var populatedStatus = [
    {
      useIndexedDB: true,
      useJSON: true,
      populatedCount: 1,
      loadedCount: undefined,
      totalCount: 2
    },
    {
      useIndexedDB: true,
      useJSON: true,
      populatedCount: 2,
      loadedCount: undefined,
      totalCount: 2
    }
  ];
  storage.onpopulated = function(status) {
    var expectedStatus = populatedStatus.shift();
    expectedStatus.loadedCount = status.loadedCount;

    deepEqual(status, expectedStatus, 'Passed!');
  };

  storage.onload = function(status) {
    deepEqual(status, {
      useIndexedDB: true,
      useJSON: true,
      populatedCount: 2,
      loadedCount: 2,
      totalCount: 2 }, 'Passed!');
  };
  storage.onloadend = function(status) {
    deepEqual(status, {
      useIndexedDB: true,
      useJSON: true,
      populatedCount: 2,
      loadedCount: 2,
      totalCount: 2 }, 'Passed!');
    ok(storage.loaded, 'Passed!');
    ok(storage.partlyLoaded, 'Passed!');
    ok(!storage.jsonStorage, 'Passed!');
    ok(storage.idbStorage, 'Passed!');
    storage.unload();
    start();
  };

  stop();
  storage.load();
});

test('load() without populated IndexedDB.', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  storage.USE_JSON = false;
  expect(0 + 2 + 0 + 1 + 5);

  storage.onchunkload = function(status) {
    ok(false, 'Passed!');
  };

  storage.onpartlyloaded = function(status) {
    deepEqual(status, {
      useIndexedDB: true,
      useJSON: false,
      populatedCount: undefined,
      loadedCount: undefined,
      totalCount: undefined }, 'Passed!');
    ok(storage.partlyLoaded, 'Passed!');
  };

  storage.onpopulated = function(status) {
    ok(false, 'Passed!');
  };

  storage.onload = function(status) {
    deepEqual(status, {
      useIndexedDB: true,
      useJSON: false,
      populatedCount: undefined,
      loadedCount: undefined,
      totalCount: undefined }, 'Passed!');
  };
  storage.onloadend = function(status) {
    deepEqual(status, {
      useIndexedDB: true,
      useJSON: false,
      populatedCount: undefined,
      loadedCount: undefined,
      totalCount: undefined }, 'Passed!');
    ok(storage.loaded, 'Passed!');
    ok(storage.partlyLoaded, 'Passed!');
    ok(!storage.jsonStorage, 'Passed!');
    ok(storage.idbStorage, 'Passed!');
    storage.unload();
    start();
  };

  stop();
  storage.load();
});

test('load() and resume populated IndexedDB.', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json'];

  storage.onloadend = function(status) {
    storage.unload();

    var storage2 = new HybirdStorage();
    storage2.IDB_NAME = 'TestDatabase';
    storage2.IDB_VERSION = 1;
    storage2.JSON_URL = './resources/';
    storage2.JSON_FILES = ['test1.json', 'test2.json'];
    expect(1 + 2 + 1 + 1 + 5);

    var chunkloadStatus = [
      {
        useIndexedDB: true,
        useJSON: true,
        populatedCount: 1,
        loadedCount: 2,
        totalCount: 2
      }
    ];
    storage2.onchunkload = function(status) {
      var expectedStatus = chunkloadStatus.shift();
      deepEqual(status, expectedStatus, 'Passed!');
    };

    storage2.onpartlyloaded = function(status) {
      deepEqual(status, {
        useIndexedDB: true,
        useJSON: true,
        populatedCount: 1,
        loadedCount: 1,
        totalCount: 2 }, 'Passed!');
      ok(storage2.partlyLoaded, 'Passed!');
    };

    var populatedStatus = [
      {
        useIndexedDB: true,
        useJSON: true,
        populatedCount: 2,
        loadedCount: 2,
        totalCount: 2
      }
    ];
    storage2.onpopulated = function(status) {
      var expectedStatus = populatedStatus.shift();

      deepEqual(status, expectedStatus, 'Passed!');
    };

    storage2.onload = function(status) {
      deepEqual(status, {
        useIndexedDB: true,
        useJSON: true,
        populatedCount: 2,
        loadedCount: 2,
        totalCount: 2 }, 'Passed!');
    };
    storage2.onloadend = function(status) {
      deepEqual(status, {
        useIndexedDB: true,
        useJSON: true,
        populatedCount: 2,
        loadedCount: 2,
        totalCount: 2 }, 'Passed!');
      ok(storage2.loaded, 'Passed!');
      ok(storage2.partlyLoaded, 'Passed!');
      ok(!storage2.jsonStorage, 'Passed!');
      ok(storage2.idbStorage, 'Passed!');
      storage2.unload();
      start();
    };
    storage2.load();
  };

  stop();
  storage.load();
});

test('load() with populated IndexedDB.', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];

  storage.onloadend = function(status) {
    storage.unload();

    var storage2 = new HybirdStorage();
    storage2.IDB_NAME = 'TestDatabase';
    storage2.IDB_VERSION = 1;
    storage2.JSON_URL = './resources/';
    storage2.JSON_FILES = ['test1.json', 'test2.json'];
    expect(0 + 2 + 0 + 1 + 5);

    storage2.onchunkload = function(status) {
      ok(false, 'Passed!');
    };

    storage2.onpartlyloaded = function(status) {
      deepEqual(status, {
        useIndexedDB: true,
        useJSON: false,
        populatedCount: 2,
        loadedCount: 2,
        totalCount: 2 }, 'Passed!');
      ok(storage2.partlyLoaded, 'Passed!');
    };

    storage2.onpopulated = function(status) {
      ok(false, 'Passed!');
    };

    storage2.onload = function(status) {
      deepEqual(status, {
        useIndexedDB: true,
        useJSON: false,
        populatedCount: 2,
        loadedCount: 2,
        totalCount: 2 }, 'Passed!');
    };
    storage2.onloadend = function(status) {
      deepEqual(status, {
        useIndexedDB: true,
        useJSON: false,
        populatedCount: 2,
        loadedCount: 2,
        totalCount: 2 }, 'Passed!');
      ok(storage2.loaded, 'Passed!');
      ok(storage2.partlyLoaded, 'Passed!');
      ok(!storage2.jsonStorage, 'Passed!');
      ok(storage2.idbStorage, 'Passed!');
      storage2.unload();
      start();
    };
    storage2.load();
  };

  stop();
  storage.load();
});

test('load() non-exist files', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['404.json'];
  expect(2);
  storage.onerror = function() {
    ok(true, 'Passed!');
  };
  storage.onloadend = function() {
    ok(!storage.loaded, 'Passed!');
    storage.unload();
    start();
  };

  stop();
  storage.load();
});

test('unload()', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(4);
  storage.onloadend = function() {
    storage.unload();
    ok(!storage.loaded, 'Passed!');
    ok(!storage.partlyLoaded, 'Passed!');
    ok(!storage.jsonStorage, 'Passed!');
    ok(!storage.idbStorage, 'Passed!');
    start();
  };

  stop();
  storage.load();
});

test('deleteDatabase()', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(4);
  var nativeDelDb = IndexedDBStorage.prototype.IDB.deleteDatabase;
  var fakeIDBOpenDBRequest = {};
  IndexedDBStorage.prototype.IDB.deleteDatabase = function mockDelDb(name) {
    equal(name, 'TestDatabase', 'Passed!');

    setTimeout(function() {
      fakeIDBOpenDBRequest.onsuccess({
        'type': 'success'
      });
    });
    return fakeIDBOpenDBRequest;
  };
  storage.onloadend = function() {
    ok(storage.loaded, 'Passed!');
    storage.deleteDatabase(function(result) {
      ok(result, 'Passed!');
      ok(!storage.loaded, 'Passed!');

      IndexedDBStorage.prototype.IDB.deleteDatabase = nativeDelDb;
      start();
    });
  };

  stop();
  storage.load();
});

test('get()', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json'];
  expect(1);
  storage.onloadend = function() {
    storage.get('Key1', function(values) {

      deepEqual(values, 'value1value2', 'Passed!');
      storage.unload();
      start();
    });
  };

  stop();
  storage.load();
});

test('get() from multiple files', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(2);
  storage.onloadend = function() {
    storage.get('Key1', function(values) {
      deepEqual(values, 'value1value2', 'Passed!');
      storage.get('Key2', function(values) {
        deepEqual(values, 'value3value4', 'Passed!');
        storage.unload();
        start();
      });
    });
  };

  stop();
  storage.load();
});

test('get() while only partly loaded', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json'];
  expect(1);

  storage.onpartlyloaded = function() {
    storage.get('Key1', function(values) {
      deepEqual(values, 'value1value2', 'Passed!');
    });
  };
  storage.onloadend = function() {
    storage.unload();
    start();
  };

  stop();
  storage.load();
});

module('HybirdStorage (IndexedDBStorage off)');

test('create instance', function() {
  var storage = new HybirdStorage();
  storage.USE_IDB = false;
  ok(!storage.loaded, 'Passed!');
  ok(!storage.partlyLoaded, 'Passed!');
});

test('load()', function() {
  var storage = new HybirdStorage();
  storage.USE_IDB = false;
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(2 + 2 + 0 + 1 + 5);
  var chunkloadStatus = [
    {
      useIndexedDB: false,
      useJSON: true,
      populatedCount: undefined,
      loadedCount: 1,
      totalCount: 2
    },
    {
      useIndexedDB: false,
      useJSON: true,
      populatedCount: undefined,
      loadedCount: 2,
      totalCount: 2
    }
  ];
  storage.onchunkload = function(status) {
    var expectedStatus = chunkloadStatus.shift();
    deepEqual(status, expectedStatus, 'Passed!');
  };

  storage.onpartlyloaded = function(status) {
    deepEqual(status, {
      useIndexedDB: false,
      useJSON: true,
      populatedCount: undefined,
      loadedCount: 1,
      totalCount: 2 }, 'Passed!');
    ok(storage.partlyLoaded, 'Passed!');
  };

  storage.onpopulated = function(status) {
    ok(false, 'Passed!');
  };

  storage.onload = function(status) {
    deepEqual(status, {
      useIndexedDB: false,
      useJSON: true,
      populatedCount: undefined,
      loadedCount: 2,
      totalCount: 2 }, 'Passed!');
  };
  storage.onloadend = function(status) {
    deepEqual(status, {
      useIndexedDB: false,
      useJSON: true,
      populatedCount: undefined,
      loadedCount: 2,
      totalCount: 2 }, 'Passed!');
    ok(storage.loaded, 'Passed!');
    ok(storage.partlyLoaded, 'Passed!');
    ok(storage.jsonStorage, 'Passed!');
    ok(!storage.idbStorage, 'Passed!');
    storage.unload();
    start();
  };

  stop();
  storage.load();
});

test('load() non-exist files', function() {
  var storage = new HybirdStorage();
  storage.USE_IDB = false;
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['404.json'];
  expect(2);
  storage.onerror = function() {
    ok(true, 'Passed!');
  };
  storage.onloadend = function() {
    ok(!storage.loaded, 'Passed!');
    storage.unload();
    start();
  };

  stop();
  storage.load();
});

test('unload()', function() {
  var storage = new HybirdStorage();
  storage.USE_IDB = false;
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(4);
  storage.onloadend = function() {
    storage.unload();
    ok(!storage.loaded, 'Passed!');
    ok(!storage.partlyLoaded, 'Passed!');
    ok(!storage.jsonStorage, 'Passed!');
    ok(!storage.idbStorage, 'Passed!');
    start();
  };

  stop();
  storage.load();
});

test('deleteDatabase()', function() {
  var storage = new HybirdStorage();
  storage.USE_IDB = false;
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(3);
  var nativeDelDb = IndexedDBStorage.prototype.IDB.deleteDatabase;
  var fakeIDBOpenDBRequest = {};
  IndexedDBStorage.prototype.IDB.deleteDatabase = function mockDelDb(name) {
    ok(false, 'Passed!');

    setTimeout(function() {
      fakeIDBOpenDBRequest.onsuccess({
        'type': 'success'
      });
    });
    return fakeIDBOpenDBRequest;
  };
  storage.onloadend = function() {
    ok(storage.loaded, 'Passed!');
    storage.deleteDatabase(function(result) {
      equal(result, undefined, 'Passed!');
      ok(!storage.loaded, 'Passed!');

      IndexedDBStorage.prototype.IDB.deleteDatabase = nativeDelDb;
      start();
    });
  };

  stop();
  storage.load();
});

test('get()', function() {
  var storage = new HybirdStorage();
  storage.USE_IDB = false;
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json'];
  expect(1);
  storage.onloadend = function() {
    storage.get('Key1', function(values) {

      deepEqual(values, 'value1value2', 'Passed!');
      storage.unload();
      start();
    });
  };

  stop();
  storage.load();
});

test('get() from multiple files', function() {
  var storage = new HybirdStorage();
  storage.USE_IDB = false;
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(2);
  storage.onloadend = function() {
    storage.get('Key1', function(values) {
      deepEqual(values, 'value1value2', 'Passed!');
      storage.get('Key2', function(values) {
        deepEqual(values, 'value3value4', 'Passed!');
        storage.unload();
        start();
      });
    });
  };

  stop();
  storage.load();
});

test('get() while only partly loaded', function() {
  var storage = new HybirdStorage();
  storage.USE_IDB = false;
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json'];
  expect(1);

  storage.onpartlyloaded = function() {
    storage.get('Key1', function(values) {
      deepEqual(values, 'value1value2', 'Passed!');
    });
  };
  storage.onloadend = function() {
    storage.unload();
    start();
  };

  stop();
  storage.load();
});

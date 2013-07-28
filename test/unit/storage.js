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
  expect(8);
  storage.onchunkload = function(chunk) {
    ok(chunk instanceof JSONDataChunk, 'Passed!');
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
      deepEqual(values, ['value1', 'value2'], 'Passed!');
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
      deepEqual(values, ['value1', 'value2'], 'Passed!');
      storage.get('Key2', function(values) {
        deepEqual(values, ['value3', 'value4'], 'Passed!');
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
  var chunk = new JSONDataChunk({ 'key': ['value1', 'value2'] }, jdbMock);
  ok(jdbMock.partlyLoaded, 'Passed!');
  equal(jdbMock._jsonData[0], chunk, 'Passed!');
});

test('unload()', function() {
  var jdbMock = {
    _jsonData: [],
    partlyLoaded: false,
    loaded: false
  };
  var chunk = new JSONDataChunk({ 'key': ['value1', 'value2'] }, jdbMock);
  jdbMock.loaded = true;
  chunk.unload();
  ok(!jdbMock.loaded, 'Passed!');
  equal(jdbMock._jsonData[0], null, 'Passed!');
});

test('get()', function() {
  var chunk = new JSONDataChunk({ 'key': ['value1', 'value2'] }, {
    _jsonData: []
  });
  deepEqual(chunk.get('key'), ['value1', 'value2'], 'Passed!');
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
      ok(!populated, 'Passed!');
      ok(!storage.populated, 'Passed!');
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
  expect(5);
  storage.onloadend = function() {
    storage.setPopulated(function(success) {
      ok(success, 'Passed!');
      ok(storage.partlyPopulated, 'Passed!');
      ok(storage.populated, 'Passed!');
      storage.unload();
      storage = null;

      var storage2 = new IndexedDBStorage();
      storage2.IDB_NAME = 'TestDatabase';
      storage2.IDB_VERSION = 1;
      storage2.onloadend = function() {
        storage2.checkPopulated(function(populated) {
          ok(populated, 'Passed!');
          ok(storage2.populated, 'Passed!');
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
    var chunk = new JSONDataChunk({ 'key': ['value1', 'value2'] });

    storage.putChunk(chunk, function() {
      storage.get('key', function(values) {
        deepEqual(values, ['value1', 'value2'], 'Passed');
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
      'key': ['value1', 'value2'],
      'key2': ['value3', 'value4'] });

    storage.putChunk(chunk, function() {
      var txn = storage.getTxn();
      storage.get('key', function(values) {
        deepEqual(values, ['value1', 'value2'], 'Passed');
      }, txn);
      storage.get('key2', function(values) {
        deepEqual(values, ['value3', 'value4'], 'Passed');

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

test('load()', function() {
  var storage = new HybirdStorage();
  storage.IDB_NAME = 'TestDatabase';
  storage.IDB_VERSION = 1;
  storage.JSON_URL = './resources/';
  storage.JSON_FILES = ['test1.json', 'test2.json'];
  expect(4);
  storage.onloadend = function() {
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

      deepEqual(values, ['value1', 'value2'], 'Passed!');
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
      deepEqual(values, ['value1', 'value2'], 'Passed!');
      storage.get('Key2', function(values) {
        deepEqual(values, ['value3', 'value4'], 'Passed!');
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
      deepEqual(values, ['value1', 'value2'], 'Passed!');
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
  expect(4);
  storage.onloadend = function() {
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

      deepEqual(values, ['value1', 'value2'], 'Passed!');
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
      deepEqual(values, ['value1', 'value2'], 'Passed!');
      storage.get('Key2', function(values) {
        deepEqual(values, ['value3', 'value4'], 'Passed!');
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
      deepEqual(values, ['value1', 'value2'], 'Passed!');
    });
  };
  storage.onloadend = function() {
    storage.unload();
    start();
  };

  stop();
  storage.load();
});

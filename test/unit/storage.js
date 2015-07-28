'use strict';

/* global BinStorage, CacheStore, JSZhuyinDataPackStorage,
          arrayBufferToStringArray, numberArrayToStringArray,
          arrayToUint16LEArrayBuffer, BopomofoEncoder */

var binStorageResArray = [
  0x0001, 0x0000, // Table0 header
  0x0041,         // Table0 key table
  0x0000,         // pad
  0x000c, 0x0000, // Table0 ptr table, ptr to table1 (32bit LE)

  0x0001, 0x0000, // Table1 header
  0x0042,         // Table1 key table
  0x0000,         // pad
  0x0018, 0x0000, // Table1 ptr table, ptr to table2 (32bit LE)

  0x0001, 0x0005, // Table2 header
  0x1111, 0x2222, 0x3333, 0x4444, 0x5555, // Table2 content
  0x0043,         // Table2 key table
  0x002c, 0x0000, // Table2 ptr table, ptr to table3 (32bit LE)

  0x0000, 0x0004, // Table3 header
  0x6666, 0x7777, 0x8888, 0x9999 // Table3 content
];

var binStorageData = arrayToUint16LEArrayBuffer(binStorageResArray);

module('BinStorage');

test('create instance', function() {
  var storage = new BinStorage();
  ok(!storage.loaded, 'Passed!');
});

var binStorageResStringArray = numberArrayToStringArray(binStorageResArray);

test('create instance', function() {
  var storage = new BinStorage();
  ok(!storage.loaded, 'Passed!');
});

test('unload()', function() {
  var storage = new BinStorage();

  storage.load(binStorageData);
  storage.unload();
  ok(!storage.loaded, 'Passed!');
  equal(storage._bin, undefined, 'Data purged');
});

test('get()', function() {
  var storage = new BinStorage();
  storage.load(binStorageData);

  var value = storage.get(String.fromCharCode(0x41, 0x42, 0x43));
  deepEqual(arrayBufferToStringArray(value[0]), binStorageResStringArray);
  equal(value[1], 0x2c + 4 /* start address of Table3 content */);
  equal(value[2], 4 /* length of Table3 content */, 'Passed!');
});

test('get() (not found)', function() {
  var storage = new BinStorage();
  storage.load(binStorageData);

  var value = storage.get(String.fromCharCode(0x41, 0x42, 0x45));
  equal(value, undefined, 'Passed!');
});

test('getRange()', function() {
  var storage = new BinStorage();
  storage.load(binStorageData);

  var value = storage.getRange(String.fromCharCode(0x41, 0x42));
  equal(value.length, 1, 'Passed!');
  deepEqual(arrayBufferToStringArray(value[0][0]), binStorageResStringArray);
  equal(value[0][1], 0x2c + 4 /* start address of Table3 content */);
  equal(value[0][2], 4 /* length of Table3 content */, 'Passed!');
});

test('getRange() (not found)', function() {
  var storage = new BinStorage();
  storage.load(binStorageData);

  var value = storage.getRange(String.fromCharCode(0x41, 0x42, 0x45));
  deepEqual(value, [], 'Passed!');
});

module('CacheStore');

test('add()', function() {
  var store = new CacheStore();
  store.add('Key1', ['value1', 'value2']);
  deepEqual(store.data.Key1, ['value1', 'value2'], 'Passed!');
});

test('get()', function() {
  var store = new CacheStore();
  store.add('Key1', ['value1', 'value2']);
  deepEqual(store.get('Key1'), ['value1', 'value2'], 'Passed!');
});

test('cleanup()', function() {
  var store = new CacheStore();
  store.add('Key1', ['value1', 'value2']);
  store.add('Key2', ['value3', 'value4']);
  store.add('Key3', ['value5', 'value6']);

  store.cleanup('Key1Key3');

  deepEqual(store.get('Key1'), ['value1', 'value2'], 'Passed!');
  deepEqual(store.get('Key2'), undefined, 'Passed!');
  deepEqual(store.get('Key3'), ['value5', 'value6'], 'Passed!');
});

// This the simply the number representation of testdata.data
var testdataResArray = [
  0x0003, 0x0000, 0x0233, 0x0c2a, 0x2204, 0x0000, 0x0018, 0x0000,
  0x0024, 0x0000, 0x0088, 0x0000, 0x0000, 0x0004, 0xc846, 0xc054,
  0x0041, 0x5317, 0x0001, 0x0014, 0x8c8b, 0xc03c, 0x0041, 0x53f0,
  0x81fa, 0x62ac, 0x98b1, 0x6aaf, 0x82d4, 0x8dc6, 0x90b0, 0x9b90,
  0x65f2, 0x70b1, 0x5b2f, 0x5113, 0x85b9, 0x99d8, 0x7c49, 0x79ee,
  0x0233, 0x0000, 0x0058, 0x0000, 0x0001, 0x0006, 0x67d1, 0xc051,
  0x0042, 0x53f0, 0x5317, 0x0000, 0x2204, 0x0000, 0x0070, 0x0000,
  0x0000, 0x000a, 0x204d, 0xc055, 0x0043, 0x53f0, 0x5317, 0x5e02,
  0x81fa, 0x5317, 0x5e02, 0x0000, 0x0000, 0x003e, 0x287e, 0xc00e,
  0x0041, 0x662f, 0x4e8b, 0x5e02, 0x5f0f, 0x793a, 0x8996, 0x4e16,
  0x58eb, 0x8b58, 0x8a66, 0x52e2, 0x9069, 0x5ba4, 0x91cb, 0x98fe,
  0x6c0f, 0x901d, 0x8a93, 0x4ed5, 0x4f8d, 0x55dc, 0x62ed, 0x566c,
  0x67ff, 0x6043, 0x7b6e, 0x8210, 0x8efe, 0x5f12, 0x5a9e, 0x8de9,
  0x87ab, 0x4f7f, 0x596d, 0x8c49, 0x9bf7, 0x8cb0, 0x6220, 0x623a,
  0x8a4d, 0x907e, 0x5d3c, 0x7c2d, 0x896b, 0x70d2, 0x8b1a, 0x5511,
  0x8adf, 0x63d3, 0x9230, 0x8ae1, 0x92b4, 0x884b, 0x5fa5, 0x927d,
  0x8906, 0x7fe8, 0x9f5b, 0x6fa8];

var testdataData = arrayToUint16LEArrayBuffer(testdataResArray);

module('JSZhuyinDataPackStorage');

test('create instance', function() {
  var storage = new JSZhuyinDataPackStorage();
  ok(!storage.loaded, 'Passed!');
});

test('create instance', function() {
  var storage = new JSZhuyinDataPackStorage();
  ok(!storage.loaded, 'Passed!');
});

test('unload()', function() {
  var storage = new JSZhuyinDataPackStorage();

  storage.load(testdataData);
  storage.unload();
  ok(!storage.loaded, 'Passed!');
  equal(storage._bin, undefined, 'Data purged');
});

test('get()', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.get(BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇ'));
  deepEqual(value.getResults(), [ {
    'score': -3.2719614505767822,
    'str': '台北' } ]);
});

test('get() should utilize cache', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.get(BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇ'));
  deepEqual(value.getResults(), [ {
    'score': -3.2719614505767822,
    'str': '台北' } ]);

  var realGet = BinStorage.prototype.get;
  BinStorage.prototype.get = function() {
    ok(false, 'Should not reach BinStorage#get() again.');
  };

  var value2 = storage.get(BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇ'));
  deepEqual(value2.getResults(), [ {
    'score': -3.2719614505767822,
    'str': '台北' } ]);

  BinStorage.prototype.get = realGet;
});

test('get() (not found)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.get(BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇㄅㄟˇ'));
  equal(value, undefined, 'Passed!');
});

test('getRange()', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.getRange(BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇ'));
  equal(value.length, 1, 'Passed!');
  deepEqual(value[0].getResults(), [
    { 'score': -3.330096483230591, 'str': '台北市' },
    { 'str': '臺北市' } ]);
});

test('getRange() (not found)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.getRange(BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇㄅㄟˇ'));
  deepEqual(value, [], 'Passed!');
});

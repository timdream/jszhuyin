'use strict';

/* global BinStorage, arrayBufferToStringArray, numberArrayToStringArray,
          arrayToUint16LEArrayBuffer */

module('BinStorage');

test('create instance', function() {
  var storage = new BinStorage();
  ok(!storage.loaded, 'Passed!');
});

var resArray = [
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

var binStorageData = arrayToUint16LEArrayBuffer(resArray);
var resStringArray = numberArrayToStringArray(resArray);

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
  deepEqual(arrayBufferToStringArray(value[0]), resStringArray);
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
  deepEqual(arrayBufferToStringArray(value[0][0]), resStringArray);
  equal(value[0][1], 0x2c + 4 /* start address of Table3 content */);
  equal(value[0][2], 4 /* length of Table3 content */, 'Passed!');
});

test('getRange() (not found)', function() {
  var storage = new BinStorage();
  storage.load(binStorageData);

  var value = storage.getRange(String.fromCharCode(0x41, 0x42, 0x45));
  deepEqual(value, [], 'Passed!');
});

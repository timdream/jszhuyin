'use strict';

module('BinStorage');

test('create instance', function() {
  var storage = new BinStorage();
  ok(!storage.loaded, 'Passed!');
});

test('load()', function() {
  var storage = new BinStorage();
  storage.DATA_URL = './resources/test.data';
  expect(3);
  storage.onload = function() {
    ok(storage.loaded, 'Passed!');
  };
  storage.onloadend = function() {
    ok(storage.loaded, 'Passed!');
    deepEqual(arrayBufferToArray(storage._bin),
      arrayBufferToArray((new Uint16Array([
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
      ])).buffer), 'Passed!');
    start();
  };

  stop();
  storage.load();
});

test('load() non-exist files', function() {
  var storage = new BinStorage();
  storage.DATA_URL = './resources/404.data';
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
  var storage = new BinStorage();
  storage.DATA_URL = './resources/test.data';
  expect(4);
  storage.onloadend = function() {
    ok(storage.loaded, 'Passed!');
    deepEqual(arrayBufferToArray(storage._bin),
      arrayBufferToArray((new Uint16Array([
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
      ])).buffer), 'Passed!');
    storage.unload();
    ok(!storage.loaded, 'Passed!');
    equal(storage._bin, undefined, 'Data purged');
    start();
  };

  stop();
  storage.load();
});

test('get()', function() {
  var storage = new BinStorage();
  storage.DATA_URL = './resources/test.data';
  expect(1);
  var resArray = arrayBufferToArray(
    (new Uint16Array([0x6666, 0x7777, 0x8888, 0x9999])).buffer);
  storage.onloadend = function() {
    var value = storage.get(String.fromCharCode(0x41, 0x42, 0x43));
    deepEqual(arrayBufferToArray(value), resArray, 'Passed!');
    start();
  };

  stop();
  storage.load();
});

test('getRange()', function() {
  var storage = new BinStorage();
  storage.DATA_URL = './resources/test.data';
  expect(2);
  var resArray0 = arrayBufferToArray(
      (new Uint16Array([0x6666, 0x7777, 0x8888, 0x9999])).buffer);
  storage.onloadend = function() {
    var value = storage.getRange(String.fromCharCode(0x41, 0x42));
    equal(value.length, 1, 'Passed!');
    deepEqual(arrayBufferToArray(value[0]), resArray0, 'Passed!');
    start();
  };

  stop();
  storage.load();
});

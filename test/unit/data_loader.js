'use strict';

/* global DataLoader, arrayBufferToStringArray, numberArrayToStringArray */

module('DataLoader');

test('create instance', function() {
  var loader = new DataLoader();
  ok(!loader.loaded, 'Passed!');
});

var resStringArray = numberArrayToStringArray([
  0x0001, 0x0000, // Table0 header
  0x0041,         // Table0 key table
  0x000a, 0x0000, // Table0 ptr table, ptr to table1 (32bit LE)

  0x0001, 0x0000, // Table1 header
  0x0042,         // Table1 key table
  0x0014, 0x0000, // Table1 ptr table, ptr to table2 (32bit LE)

  0x0001, 0x0005, // Table2 header
  0x1111, 0x2222, 0x3333, 0x4444, 0x5555, // Table2 content
  0x0043,         // Table2 key table
  0x0028, 0x0000, // Table2 ptr table, ptr to table3 (32bit LE)

  0x0000, 0x0004, // Table3 header
  0x6666, 0x7777, 0x8888, 0x9999 // Table3 content
]);

test('load()', function(assert) {
  var loader = new DataLoader();
  loader.DATA_URL = '/base/test/resources/test.data';

  var done = assert.async();
  expect(3);
  loader.onload = function() {
    ok(loader.loaded, 'Passed!');
  };
  loader.onloadend = function() {
    ok(loader.loaded, 'Passed!');
    deepEqual(arrayBufferToStringArray(loader.data), resStringArray);
    done();
  };

  loader.load();
});

test('load() non-exist files', function(assert) {
  var loader = new DataLoader();
  loader.DATA_URL = '/base/test/resources/404.data';
  var done = assert.async();
  expect(2);
  loader.onerror = function() {
    ok(true, 'Passed!');
  };
  loader.onloadend = function() {
    ok(!loader.loaded, 'Passed!');
    done();
  };

  loader.load();
});

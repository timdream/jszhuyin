'use strict';

var assert = require('assert');
var utils = require('../util.js');

var DatabaseBuilder = require('../../build/database_builder.js');

suite('DatabaseBuilder');

test('put()', function() {
  var buf1 = (new Uint16Array([0x1111, 0x2222, 0x3333, 0x4444, 0x5555])).buffer;
  var buf2 = (new Uint16Array([0x6666, 0x7777, 0x8888, 0x9999, 0xaaaa])).buffer;
  var res = [];
  res[0x41] = [];
  res[0x41][0x42] = [buf1];
  res[0x41][0x42][0x43] = [buf2];

  var db = new DatabaseBuilder();
  db.put(String.fromCharCode(0x41, 0x42), buf1);
  db.put(String.fromCharCode(0x41, 0x42, 0x43), buf2);

  assert.deepEqual(db.data, res, 'Pass!');
});

test('get()', function() {
  var buf1 = (new Uint16Array([0x1111, 0x2222, 0x3333, 0x4444, 0x5555])).buffer;
  var buf2 = (new Uint16Array([0x6666, 0x7777, 0x8888, 0x9999, 0xaaaa])).buffer;
  var res = [];
  res[0x41] = [];
  res[0x41][0x42] = [buf1];
  res[0x41][0x42][0x43] = [buf2];

  var db = new DatabaseBuilder();
  db.data = res;

  assert.deepEqual(db.get(String.fromCharCode(0x41, 0x42)), buf1, 'Pass!');
  assert.deepEqual(db.get(String.fromCharCode(0x41, 0x42, 0x43)), buf2, 'Pass!');
});

test('getBlob()', function() {
  var buf1 = (new Uint16Array([0x1111, 0x2222, 0x3333, 0x4444, 0x5555])).buffer;
  var buf2 = (new Uint16Array([0x6666, 0x7777, 0x8888, 0x9999])).buffer;
  var res = [];
  res[0x41] = [];
  res[0x41][0x42] = [buf1];
  res[0x41][0x42][0x43] = [buf2];

  var resArray = utils.arrayBufferToArray((new Uint16Array([
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
  ])).buffer);

  var db = new DatabaseBuilder();
  db.put(String.fromCharCode(0x41, 0x42), buf1);
  db.put(String.fromCharCode(0x41, 0x42, 0x43), buf2);

  var buffer = db.getBlob();

  assert.deepEqual(utils.bufferToArray(buffer), resArray, 'Pass!');
});

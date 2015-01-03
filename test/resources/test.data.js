'use strict';

var fs = require('fs');
var BlobStoreBuilder = require('../../build/database_builder.js');

var db = new BlobStoreBuilder();

var buf1 =
  (new Uint16Array([0x1111, 0x2222, 0x3333, 0x4444, 0x5555, 0x0])).buffer;
var buf2 = (new Uint16Array([0x6666, 0x7777, 0x8888, 0x9999])).buffer;
db.put(String.fromCharCode(0x41, 0x42), buf1);
db.put(String.fromCharCode(0x41, 0x42, 0x43), buf2);

var blob = db.getBlob();

fs.writeFile(__dirname + '/test.data', blob,
  function written(err) {
    if (err) {
      throw err;
    }
  }
);

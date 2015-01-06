'use strict';

var fs = require('fs');
var utils = require('../util.js');
var BlobStoreBuilder = require('../../build/database_builder.js');

var buf1 =
  utils.arrayToUint16LEArrayBuffer([0x1111, 0x2222, 0x3333, 0x4444, 0x5555]);
var buf2 =
  utils.arrayToUint16LEArrayBuffer([0x6666, 0x7777, 0x8888, 0x9999]);
var db = new BlobStoreBuilder();
db.put(String.fromCharCode(0x41, 0x42), buf1);
db.put(String.fromCharCode(0x41, 0x42, 0x43), buf2);

var buffer = db.getBlob();

fs.writeFileSync(__dirname + '/test.data', buffer);

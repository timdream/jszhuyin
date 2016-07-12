'use strict';

const fs = require('fs');

var mainExports = require('./jszhuyin.js');
mainExports.JSZhuyin.prototype.DATA_ARRAY_BUFFER =
  fs.readFileSync(__dirname + '/../data/database.data').buffer;

module.exports = mainExports;

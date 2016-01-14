#!/usr/bin/env node

'use strict';

const fs = require('fs');
const JSZhuyin = require('./jszhuyin.js').JSZhuyin;
const data = fs.readFileSync(__dirname + '/../data/database.data');
const Readable = require('stream').Readable;

var jszhuyin = new JSZhuyin();
jszhuyin.load(data.buffer);

var inputStream;
if (process.argv[2] === '-' || !process.argv[2]) {
  inputStream = process.stdin;
} else {
  inputStream = new Readable();
  inputStream._read = function() {
    this.push(process.argv[2]);
    this.push(null);
  };
}

inputStream.setEncoding('utf8');
inputStream.on('data', function(inputChunk) {
  jszhuyin.symbols += inputChunk.trim();
});
inputStream.on('end', function() {
  jszhuyin.query();
});
jszhuyin.oncandidateschange = function(res) {
  var chunk = res.map(function(c) {
    return c[0] + '\n';
  }).join('');
  process.stdout.write(chunk);
};
jszhuyin.queue.done = function() {
  process.exit(0);
};

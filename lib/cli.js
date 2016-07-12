#!/usr/bin/env node

'use strict';

const JSZhuyin = require('./main').JSZhuyin;
const Readable = require('stream').Readable;

var jszhuyin = new JSZhuyin();
jszhuyin.load();

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

var str = '';

inputStream.setEncoding('utf8');
inputStream.on('data', function(inputChunk) {
  str += inputChunk.trim();
});
inputStream.on('end', function() {
  var handled = jszhuyin.handleKey(str);
  if (!handled) {
    console.error('Error: Inputs are not Bopomofo symbols.');
  }
});
jszhuyin.oncandidateschange = function(res) {
  var chunk = res.map(function(c) {
    return c[0] + '\n';
  }).join('');
  process.stdout.write(chunk);
};

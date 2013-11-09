'use strict';

var arrayBufferToArray = function arrayBufferToArray(buf) {
  if (typeof buf === 'undefined' ||
      buf.constructor !== ArrayBuffer)
    return buf;

  if (buf.byteLength % Uint16Array.BYTES_PER_ELEMENT)
    throw 'byteLength (' + buf.byteLength + ') is not dividable by 2.';

  return Array.prototype.concat.apply([], new Uint16Array(buf))
    .map(function(n) {
      return '0x' + n.toString(16)
    });
};

// Buffer is an object available in NodeJS
var bufferToArray = function bufferToArray(buf) {
  if (typeof buf === 'undefined' ||
      buf.constructor !== Buffer)
    return buf;

  var arr = [];
  var i = 0;
  while (i < buf.length) {
    arr.push(buf.readUInt16LE(i));
    i += 2;
  }

  return arr;
};

var arrayBufferToString = function arrayBufferToArray(buf) {
  if (typeof buf === 'undefined' ||
      buf.constructor !== ArrayBuffer)
    return buf;

  if (buf.byteLength % Uint16Array.BYTES_PER_ELEMENT)
    throw 'byteLength (' + buf.byteLength + ') is not dividable by 2.';

  return String.fromCharCode.apply(String, new Uint16Array(buf))
    .replace('\u0000', '\u2400');
};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module['exports']) {
  module['exports'] = {
    arrayBufferToArray: arrayBufferToArray,
    bufferToArray: bufferToArray,
    arrayBufferToString: arrayBufferToString
  };
}

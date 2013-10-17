'use strict';

var arrayBufferToArray = function arrayBufferToArray(buf) {
  return Array.prototype.concat.apply([], new Uint16Array(buf))
    .map(function(n) {
      return '0x' + n.toString(16)
    });
};

var arrayBufferToString = function arrayBufferToArray(buf) {
  return String.fromCharCode.apply(String, new Uint16Array(buf));
};

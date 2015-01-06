'use strict';

var arrayToUint16LEArrayBuffer = function arrayToUint16LEArrayBuffer(arr) {
  var view = new DataView(new ArrayBuffer(arr.length << 1));

  arr.forEach(function(num, i) {
    view.setUint16(i << 1, num, true);
  });

  return view.buffer;
};

var arrayBufferToNumberArray = function arrayBufferToNumberArray(buf) {
  if (typeof buf === 'undefined' ||
      buf.constructor !== ArrayBuffer) {
    return buf;
  }

  if (buf.byteLength % 2) {
    throw 'byteLength (' + buf.byteLength + ') is not dividable by 2.';
  }

  var arr = [];
  var view = new DataView(buf);
  var i = 0;
  while (i < view.byteLength) {
    arr.push(view.getUint16(i, true));

    i += 2;
  }

  return arr;
};

var numberArrayToStringArray = function numberArrayToStringArray(arr) {
  return arr.map(function(num) {
    return '0x' + num.toString(16);
  });
};

var arrayBufferToStringArray = function arrayBufferToStringArray(buf) {
  return numberArrayToStringArray(arrayBufferToNumberArray(buf));
};

// Buffer is an object available in NodeJS
var bufferToNumberArray = function bufferToNumberArray(buf) {
  if (typeof buf === 'undefined' ||
      buf.constructor !== Buffer) {
    return buf;
  }

  var arr = [];
  var i = 0;
  while (i < buf.length) {
    arr.push(buf.readUInt16LE(i));
    i += 2;
  }

  return arr;
};

var bufferToStringArray = function bufferToStringArray(buf) {
  return numberArrayToStringArray(bufferToNumberArray(buf));
};

var arrayBufferToString = function arrayBufferToStringArray(buf) {
  return String.fromCharCode.apply(String, arrayBufferToNumberArray(buf))
    .replace('\0', '\u2400');
};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module.exports) {
  module.exports = {
    arrayToUint16LEArrayBuffer: arrayToUint16LEArrayBuffer,
    arrayBufferToNumberArray: arrayBufferToNumberArray,
    arrayBufferToString: arrayBufferToString,
    arrayBufferToStringArray: arrayBufferToStringArray,

    bufferToNumberArray: bufferToNumberArray,
    bufferToStringArray: bufferToStringArray,

    numberArrayToStringArray: numberArrayToStringArray
  };
}

'use strict';

// This implements a packer/unpacker of the data strings we get from JSON
// or IndexedDB. We would like to keep structured data in the JS world as
// few as possible to conserve memory and GC time.

/**
 * Float32Encoder encodes a given float number to a binary string,
 * and vise versa.
 * @type {Object}
 */
var Float32Encoder = {
  isSupported: (typeof ArrayBuffer === 'function'),
  BUFFER_BYTE_LENGTH: 4,
  encode: function encodeFloat32Number(number, type) {
    type = type || 'arraybuffer';

    switch (type) {
      case 'arraybuffer':
        return this.encodeArrayBuffer(number);

      default:
        throw 'Unsupported encode to type.';
    }
  },
  encodeArrayBuffer: function Float32NumberToArrayBuffer(number) {
    if (typeof number !== 'number')
      throw 'Float32Encoder.encode(): Argument received is not a number.';

    return (new Float32Array([number])).buffer;
  },
  decode: function decodeFloat32Number(data) {
    switch (data.constructor) {
      case ArrayBuffer:
        return this.decodeArrayBuffer(data);

      default:
        throw 'Unsupported data type.';
    }
  },
  decodeArrayBuffer: function ArrayBufferToFloat32Number(buffer) {
    return (new Float32Array(buffer))[0];
  }
};

/**
 * JSZhuyinDataPack instance is the representation of the data in the database.
 * @param  {string|array} imeData  String of the packed data, or an array of
 *                                 the structured data.
 * @constructor
 */
var JSZhuyinDataPack = function(imeData) {
  if (typeof imeData === 'string') {
    this.packed = imeData;
    this.unpacked = undefined;
  } else if (Array.isArray(imeData)) {
    this.packed = undefined;
    this.unpacked = imeData;
  } else {
    this.packed = undefined;
    this.unpacked = undefined;
  }
};
/**
 * Get the score of the first item.
 * The string will not be unpacked.
 * @return {number} Score.
 */
JSZhuyinDataPack.prototype.getFirstResultScore = function() {
  if (this.unpacked)
    return this.unpacked[0].score;

  return Float32Encoder.decode(
    this.packed.substr(0, Float32Encoder.STRING_LENGTH));
};
/**
 * Get the first item.
 * The string will not be unpacked.
 * @return {object} The first item.
 */
JSZhuyinDataPack.prototype.getFirstResult = function() {
  if (this.unpacked)
    return this.unpacked[0];

  var ctl = this.packed.charCodeAt(Float32Encoder.STRING_LENGTH);
  var symbols = !!(ctl & 0x20);
  var length = ctl & 0x0f;

  var result = {
    'str':
      this.packed.substr(Float32Encoder.STRING_LENGTH + 1, length)
        .replace('#', ''),
    'score': this.getFirstResultScore()
  };

  if (symbols) {
    result['symbols'] =
      this.packed.substr(Float32Encoder.STRING_LENGTH + 1 + length, length)
        .replace('~', '')
  }

  return result;
};
/**
 * Get all items in an array. The string will be unpacked automatically.
 * @return {array} The unpacked result.
 */
JSZhuyinDataPack.prototype.getResults = function() {
  this.unpack();

  return this.unpacked;
};
/**
 * Get the packed string. The data will be packed automatically.
 * @return {string} The packed string.
 */
JSZhuyinDataPack.prototype.toJSON =
JSZhuyinDataPack.prototype.getPackedString = function() {
  this.pack();

  return this.packed;
};
/**
 * Unpack the string and remove it.
 */
JSZhuyinDataPack.prototype.unpack = function() {
  if (this.unpacked)
    return;

  if (typeof this.packed === 'undefined')
    throw 'No packed IME data string.';

  var unpacked = [];
  var ctl = this.packed.charCodeAt(Float32Encoder.STRING_LENGTH);

  var symbols = !!(ctl & 0x20);
  var length = ctl & 0x0f;

  unpacked.push(this.getFirstResult());

  var i = Float32Encoder.STRING_LENGTH + 1 + length;
  if (symbols) i += length;

  while (i < this.packed.length) {
    var result = {
      'str': this.packed.substr(i, length).replace('#', '')
    };
    i += length;

    if (symbols) {
      result['symbols'] = this.packed.substr(i, length).replace('~', '')
      i += length;
    }

    unpacked.push(result);
  }

  this.unpacked = unpacked;
  this.packed = undefined;
};
/**
 * Pack the string and remove the structured data object.
 */
JSZhuyinDataPack.prototype.pack = function() {
  if (this.packed)
    return;

  if (typeof this.unpacked === 'undefined')
    throw 'No unpacked IME data.';

  var length = 0;
  this.unpacked.forEach(function(result, i) {
    if (result['str'].length > length)
      length = result['str'].length;
  });

  if (length > 0xf)
    throw 'Longest string length is longer than expected.';

  var firstResult = this.getFirstResult();
  var symbols = !!(firstResult['symbols']);

  var packed = [
    Float32Encoder.encode(firstResult['score']),
    String.fromCharCode(0x40 ^ (symbols ? 0x20 : 0) ^ length)];

  this.unpacked.forEach(function(result) {
    var str = result['str'];

    while (str.length < length) {
      str += '#';
    }

    packed.push(str);

    if (symbols) {
      var sym = result['symbols'];
      while (sym.length < length) {
        sym += '~';
      }
      packed.push(sym);
    }
  });
  this.packed = packed.join('');
};
/**
 * Overwrite the native toString() method.
 * @return {string} String representation of the JSZhuyinDataPack instance.
 */
JSZhuyinDataPack.prototype.toString = function() {
  if (this.unpacked)
    return this.unpacked.toString();

  if (this.packed)
    return this.packed;

  return '[object JSZhuyinDataPack]';
};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module['exports']) {
  module['exports'] = JSZhuyinDataPack;
}

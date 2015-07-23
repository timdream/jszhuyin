'use strict';

// This implements a packer/unpacker of the arraybuffer we get from storage.
// We would like to keep structured data in the JS world as few as possible to
// conserve memory and GC time.

/**
 * Float32Encoder encodes a given float number to an arraybuffer,
 * and vise versa.
 * @type {Object}
 */
var Float32Encoder = {
  isSupported: (typeof DataView !== 'undefined'),
  BUFFER_BYTE_LENGTH: 4,
  encode: function encodeFloat32Number(number, type) {
    type = type || 'arraybuffer';

    switch (type) {
      case 'arraybuffer':
        return this.encodeArrayBuffer(number);

      default:
        throw new Error('Unsupported encode to type.');
    }
  },
  encodeArrayBuffer: function Float32NumberToArrayBuffer(number) {
    if (typeof number !== 'number') {
      throw new Error('Argument received is not a number.');
    }

    var buf = new ArrayBuffer(4);
    new DataView(buf).setFloat32(0, number, true);

    return buf;
  },
  decode: function decodeFloat32Number(data) {
    switch (data.constructor) {
      case ArrayBuffer:
        return this.decodeArrayBuffer(data);

      default:
        throw new Error('Unsupported data type.');
    }
  },
  decodeArrayBuffer: function ArrayBufferToFloat32Number(buffer, byteOffset) {
    return (new DataView(buffer)).getFloat32(byteOffset, true);
  }
};

/**
 * JSZhuyinDataPack instance is the representation of the data in the database.
 * @param  {arraybuffer|array} imeData  arraybuffer the packed data, or an
 *                                      array of the structured data.
 * @constructor
 */
var JSZhuyinDataPack = function(imeData, byteOffset, length) {
  if (imeData.constructor === ArrayBuffer) {
    this.packed = imeData;
    this.byteOffset = byteOffset || 0;
    this.length = length || (imeData.byteLength >> 1);
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
 * The arraybuffer will not be unpacked.
 * @return {number} Score.
 */
JSZhuyinDataPack.prototype.getFirstResultScore = function() {
  if (this.unpacked) {
    return this.unpacked[0].score;
  }

  return Float32Encoder.decodeArrayBuffer(this.packed, this.byteOffset);
};
/**
 * Get the first item.
 * The arraybuffer will not be unpacked.
 * @return {object} The first item.
 */
JSZhuyinDataPack.prototype.getFirstResult = function() {
  if (this.unpacked) {
    return this.unpacked[0];
  }

  var view = new DataView(this.packed, this.byteOffset, this.length << 1);
  var HEADER_LENGTH = 2;

  var controlByte = view.getUint16(HEADER_LENGTH << 1, true);
  var symbols = !!(controlByte & 0x20);
  var length = controlByte & 0x0f;

  var result = {
    'str': this._getStringFromDataView(view, (HEADER_LENGTH + 1) << 1, length),
    'score': this.getFirstResultScore()
  };

  if (symbols) {
    result.symbols = this._getStringFromDataView(
      view, (HEADER_LENGTH + 1 + length) << 1, length);
  }

  return result;
};
/**
 * Get all items in an array. The arraybuffer will be unpacked automatically.
 * @return {array} The unpacked result.
 */
JSZhuyinDataPack.prototype.getResults = function() {
  this.unpack();

  return this.unpacked;
};
/**
 * Get the packed array buffer. The data will be packed automatically.
 * The byteLength is always dividable by 4.
 * @return {arraybuffer} The packed arraybuffer.
 */
JSZhuyinDataPack.prototype.getPacked = function() {
  this.pack();

  return this.packed;
};
/**
 * Unpack the arraybuffer and remove it.
 */
JSZhuyinDataPack.prototype.unpack = function() {
  if (this.unpacked) {
    return;
  }

  if (typeof this.packed === 'undefined') {
    throw new Error('No packed IME data.');
  }

  var unpacked = [this.getFirstResult()];
  var view = new DataView(this.packed, this.byteOffset, this.length << 1);
  var HEADER_LENGTH = 2;

  var controlByte = view.getUint16(HEADER_LENGTH << 1, true);

  var symbols = !!(controlByte & 0x20);
  var length = controlByte & 0x0f;

  var i = (HEADER_LENGTH + 1 + length) << 1;
  if (symbols) {
    i += length << 1;
  }

  while (i < view.byteLength) {
    if (!view.getUint16(i, true)) {
      break;
    }

    var result = {
      'str': this._getStringFromDataView(view, i, length).replace('\u0000', '')
    };
    i += length << 1;

    if (symbols) {
      result.symbols =
        this._getStringFromDataView(view, i, length).replace('\u0000', '');
      i += length << 1;
    }

    unpacked.push(result);
  }

  this.unpacked = unpacked;
  this.packed = undefined;
};
/**
 * Pack the arraybuffer and remove the structured data object.
 */
JSZhuyinDataPack.prototype.pack = function() {
  if (this.packed) {
    return;
  }

  if (typeof this.unpacked === 'undefined') {
    throw new Error('No unpacked IME data.');
  }

  var length = 0;
  this.unpacked.forEach(function(result, i) {
    if (result.str.length > length) {
      length = result.str.length;
    }
    if (result.symbols && result.symbols.length > length) {
      length = result.symbols.length;
    }
  });

  if (length > 0xf) {
    throw new Error('Longest string length is longer than expected.');
  }

  var firstResult = this.getFirstResult();
  var symbols = !!(firstResult.symbols);

  var HEADER_LENGTH = 2;
  var arrayLength = HEADER_LENGTH + 1 +
    (length + ((symbols) ? length : 0)) * this.unpacked.length;

  if (arrayLength % HEADER_LENGTH) {
    arrayLength++;
  }

  var packedView = new DataView(new ArrayBuffer(arrayLength << 1));
  packedView.setFloat32(0, firstResult.score, true);
  packedView.setUint16(
    HEADER_LENGTH << 1, (0x40 ^ (symbols ? 0x20 : 0) ^ length), true);

  var byteOffset = (HEADER_LENGTH + 1) << 1;
  this.unpacked.forEach(function(result, i) {
    this._setStringToDataView(packedView, byteOffset, result.str);
    byteOffset += (length << 1);

    if (symbols) {
      this._setStringToDataView(packedView, byteOffset, result.symbols);
      byteOffset += (length << 1);
    }
  }, this);

  this.packed = packedView.buffer;
  this.byteOffset = 0;
  this.length = arrayLength;
};
/**
 * Overwrite the native toString() method.
 * @return {string} String representation of the JSZhuyinDataPack instance.
 */
JSZhuyinDataPack.prototype.toString = function() {
  if (this.unpacked) {
    return this.unpacked.toString();
  }

  if (this.packed) {
    return this.packed.toString();
  }

  return '[object JSZhuyinDataPack]';
};
/**
 * Get the string from given DataView instance.
 */
JSZhuyinDataPack.prototype._getStringFromDataView =
function(view, byteOffset, length) {
  var charCodes = [], charCode;
  for (var i = 0; i < length; i++) {
    charCode = view.getUint16(byteOffset + (i << 1), true);
    if (charCode) {
      charCodes.push(charCode);
    }
  }

  return String.fromCharCode.apply(String, charCodes);
};
/**
 * Set the string to given DataView instance.
 */
JSZhuyinDataPack.prototype._setStringToDataView =
function(view, byteOffset, str) {
  var i = 0;
  while (i < str.length) {
    view.setUint16(byteOffset + (i << 1), str.charCodeAt(i), true);
    i++;
  }
};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module.exports) {
  module.exports = JSZhuyinDataPack;
}

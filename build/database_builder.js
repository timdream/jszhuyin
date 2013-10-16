'use strict';

// This file builds an in-memory key-value storage blob/buffer used
// by BinStorage.

var DatabaseBuilder = function DatabaseBuilder() {
  // The array that holds the structured data.
  // Itself is the table0.
  this.data = [];
};
DatabaseBuilder.prototype.put = function bsb_put(key, value) {
  var table = this.data;
  for (var i = 0; i < key.length; i++) {
    var code = key.charCodeAt(i);

    if (!table[code])
      table[code] = [];

    table = table[code];
  }

  table[0] = value;
};
DatabaseBuilder.prototype.get = function bsb_get(key) {
  var table = this.data;
  for (var i = 0; i < key.length; i++) {
    var code = key.charCodeAt(i);

    if (!table[code])
      return undefined;

    table = table[code];
  }

  return table[0];
};
DatabaseBuilder.prototype.getBlob = function bsb_getBlob() {
  /*
   * The binary data structure are as follows:
   * Each table gets 4 blocks in the resulting file and a header.
   * BLOCK0: Header. Fixed length at 4 bytes.
   *         0-1 byte: Uint16, element length of BLOCK2 and BLOCK3.
   *         2-3 byte: Uint16, element length of BLOCK1.
   * BLOCK1: Content of this table (JszhuyinDataPack string) with each character
   *         stored as Uint16.
   * BLOCK2: Keys of sub-tables. Each key is in Uint16.
   * BLOCK3: Address to other tables. Each address is in Uint32.
   */

  var blobParts = [];
  var blobLength = 0;

  var appendTableToBlob = function appendTableToBlob(table) {
    var keyTable = [];
    var ptrTable = [];

    for (var i = 1; i < table.length; i++) {
      if (!table[i])
        continue;

      keyTable.push(i);
      ptrTable.push(table[i]);
    };

    var content = table[0] || '';

    var blockIndex = blobLength;

    var header = new Uint16Array([].concat(
      [keyTable.length, content.length],
      content.split('').map(function str2CharCode(char) {
        return char.charCodeAt(0);
      })));
    blobParts.push(header);
    blobLength += header.length * header.BYTES_PER_ELEMENT;

    var keyArr = new Uint16Array(keyTable);
    blobParts.push(keyArr);
    blobLength += keyArr.length * keyArr.BYTES_PER_ELEMENT;

    if (blobLength % Uint32Array.BYTES_PER_ELEMENT) {
      var padArr = new Uint16Array(1);
      blobParts.push(padArr);
      blobLength += 1 * keyArr.BYTES_PER_ELEMENT;
    }

    var ptrArr = new Uint32Array(ptrTable.length);
    blobParts.push(ptrArr);
    blobLength += ptrArr.length * ptrArr.BYTES_PER_ELEMENT;

    for (var i = 0; i < ptrTable.length; i++) {
      var ptr = appendTableToBlob(ptrTable[i]);
      if (ptr > 0xffffffff)
        throw 'Table pointer address exceeds maximum.';

      ptrArr[i] = ptr;
    };

    return blockIndex;
  };

  appendTableToBlob(this.data);

  if (typeof Blob === 'function') {
    // Blob in browsers
    return new Blob(blobParts,
      { type: 'application/octet-stream', ending: 'transparent' });
  } else if (typeof Buffer === 'function') {
    var buf = new Buffer(blobLength);
    var i = 0;
    for (var j = 0; j < blobParts.length; j++) {
      var view = new Uint8Array(blobParts[j].buffer);
      for (var k = 0; k < view.length; k++) {
        buf[i] = view[k];
        i++;
      }
    };
    return buf;
  } else {
    throw 'No binary constructor available on this platform.';
  }

};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module['exports']) {
  module['exports'] = DatabaseBuilder;
}

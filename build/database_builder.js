'use strict';

// This file builds an in-memory key-value storage blob/buffer used
// by BinStorage.

var DatabaseBuilder = function DatabaseBuilder() {
  // The array that holds the structured data.
  // Itself is the table0.
  this.data = [];
};
DatabaseBuilder.prototype.onprogress = null;
DatabaseBuilder.prototype.put = function bsb_put(key, value) {
  var table = this.data;
  for (var i = 0; i < key.length; i++) {
    var code = key.charCodeAt(i);

    if (!table[code]) {
      table[code] = [];
    }

    table = table[code];
  }

  table[0] = value;
};
DatabaseBuilder.prototype.get = function bsb_get(key) {
  var table = this.data;
  for (var i = 0; i < key.length; i++) {
    var code = key.charCodeAt(i);

    if (!table[code]) {
      return undefined;
    }

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
   * BLOCK1: Content of this table (JSZhuyinDataPack arraybuffer).
   * BLOCK2: Keys of sub-tables. Each key is in Uint16.
   * BLOCK3: Address to other tables. Each address is in Uint32.
   */

  var blobParts = [];
  var blobLength = 0;

  var self = this;

  var appendTableToBlob = function appendTableToBlob(table) {
    if (typeof self.onprogress === 'function') {
      self.onprogress();
    }

    var keyTable = [];
    var ptrTable = [];

    var i;
    for (i = 1; i < table.length; i++) {
      if (!table[i]) {
        continue;
      }

      keyTable.push(i);
      ptrTable.push(table[i]);
    }

    var contentBuf = table[0];

    var blockIndex = blobLength;

    // Create a buffer, containing two Uint16 numbers.
    var headerView = new DataView(new ArrayBuffer(4));
    // The first number would always the # of items of the keyTable.
    headerView.setUint16(0, keyTable.length, true);
    // The second number would be the # of items of the contentBuf.
    if (contentBuf) {
      headerView.setUint16(2, contentBuf.byteLength >> 1, true);
    }
    blobParts.push(headerView);
    blobLength += headerView.byteLength;

    if (contentBuf) {
      blobParts.push(contentBuf);
      blobLength += contentBuf.byteLength;
    }

    if (keyTable.length) {
      var keyView = new DataView(new ArrayBuffer(keyTable.length << 1));
      keyTable.forEach(function(key, i) {
        keyView.setUint16(i << 1, key, true);
      });
      blobParts.push(keyView);
      blobLength += keyView.byteLength;
    }

    // TODO: DataView does not require the data to align.
    // Should we remove the padding here?
    if (blobLength % 4) {
      var padBuf = new ArrayBuffer(2);
      blobParts.push(padBuf);
      blobLength += padBuf.byteLength;
    }

    if (ptrTable.length) {
      var ptrView = new DataView(new ArrayBuffer(ptrTable.length << 2));
      blobParts.push(ptrView);
      blobLength += ptrView.byteLength;

      ptrTable.forEach(function(table, i) {
        var ptr = appendTableToBlob(table);
        if (ptr > 0xffffffff) {
          throw 'Table pointer address exceeds maximum.';
        }

        ptrView.setUint32(i << 2, ptr, true);
      });
    }

    return blockIndex;
  };

  appendTableToBlob(this.data);

  var supportsBlobConstructor = (function(){
    var blob;
    try {
      blob = new Blob([]);
    } catch (e) {
      return false;
    }
    return !!blob;
  })();

  if (supportsBlobConstructor) {
    // Blob in browsers
    return new Blob(blobParts,
      { type: 'application/octet-stream', ending: 'transparent' });
  } else if (typeof Buffer === 'function') {
    var buf = new Buffer(blobLength);
    var i = 0;
    for (var j = 0; j < blobParts.length; j++) {
      var view = new Uint8Array(
        (blobParts[j].constructor === ArrayBuffer) ?
        blobParts[j] : blobParts[j].buffer);

      var bufPart = new Buffer(view);
      bufPart.copy(buf, i);
      i += bufPart.length;
    }

    return buf;
  } else {
    throw 'No binary constructor available on this platform.';
  }

};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module.exports) {
  module.exports = DatabaseBuilder;
}

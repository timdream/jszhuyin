'use strict';

// This file implemented BinStorage, an in-memory key-value storage (for now).

/**
 * BinStorage rely on a big chunk of encoded ArrayBuffer to do the lookup.
 * @constructor
 */
var BinStorage = function BinStorage() {
  this.loaded = false;
  this.loading = false;
  this._bin = undefined;
};
/**
 * Database file to load.
 * @type {String}
 */
BinStorage.prototype.DATA_URL = '';
/**
 * Load the database.
 * @this {object} BinStorage instance.
 */
BinStorage.prototype.load = function bs_load() {
  if (this.loading) {
    throw 'BinStorage: You cannot called load() twice.';
  }

  if (this.loaded) {
    this.unload();
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', this.DATA_URL);
  xhr.responseType = 'arraybuffer';

  xhr.onreadystatechange = function xhrReadystatechange() {
    if (xhr.readyState !== xhr.DONE) {
      return;
    }

    var data = xhr.response;
    if (!data || (xhr.status && xhr.status !== 200)) {
      this.loading = false;

      if (typeof this.onerror === 'function') {
        this.onerror();
      }
      if (typeof this.onloadend === 'function') {
        this.onloadend();
      }
      return;
    }

    this._bin = data;

    this.loaded = true;
    this.loading = false;

    if (typeof this.onload === 'function') {
      this.onload();
    }
    if (typeof this.onloadend === 'function') {
      this.onloadend();
    }
  }.bind(this);
  xhr.send();
};
/**
 * Unoad the database.
 * @this {object} BinStorage instance.
 */
BinStorage.prototype.unload = function bs_unload() {
  if (this.loading) {
    throw 'BinStorage: load() in progress.';
  }

  this._bin = undefined;
  this.loaded = false;
};
/**
 * Get values from storage.
 * @param  {string}       key          string to query.
 * @return {arraybuffer}               the result.
 */
BinStorage.prototype.get = function bs_get(key) {
  if (!this.loaded) {
    throw 'BinStorage: not loaded.';
  }

  var keyArray = key.split('').map(function str2CharCode(char) {
    return char.charCodeAt(0);
  });

  var code;
  var byteOffset = 0;
  while ((code = keyArray.shift()) !== undefined) {
    byteOffset = this._searchBlock(code, byteOffset);
    if (byteOffset === -1) {
      return undefined;
    }
  }
  return this._getBlockContent(byteOffset);
};
/**
 * Look for all value begin with this key.
 * @param  {string}              key      string to query.
 * @return {array(arraybuffer)}           the results.
 */
BinStorage.prototype.getRange = function bs_getRange(key) {
  if (!this.loaded) {
    throw 'BinStorage: not loaded.';
  }

  var keyArray = key.split('').map(function str2CharCode(char) {
    return char.charCodeAt(0);
  });

  var code;
  var byteOffset = 0;
  while ((code = keyArray.shift()) !== undefined) {
    byteOffset = this._searchBlock(code, byteOffset);
    if (byteOffset === -1) {
      return [];
    }
  }

  var bin = this._bin;
  var result = [];

  var getBlockContents = function bs_getBlockContents(byteOffset) {
    var view = new DataView(bin, byteOffset);
    var length = view.getUint16(0, true);
    var contentLength = view.getUint16(2, true);

    if (length === 0) {
      return;
    }

    var addressBlockByteOffset =
      byteOffset + ((2 + contentLength + length) << 1);

    // Consider the size of the padding.
    if (addressBlockByteOffset % 4) {
      addressBlockByteOffset += 2;
    }

    var addressBlockView =
      new DataView(bin, addressBlockByteOffset, length << 2);

    var i = length;
    while (i--) {
      var blockAddress = addressBlockView.getUint32(i << 2, true);
      var content = this._getBlockContent(blockAddress);
      if (content) {
        result.push(content);
      }

      getBlockContents(blockAddress);
    }
  }.bind(this);

  getBlockContents(byteOffset);
  return result;
};
/**
 * Internal method for search a given block for a single character.
 * @param  {number}   code        code of the character.
 * @param  {numbber}  byteOffset  Byte offset of the block.
 * @return {number}   byteOffset of the block found, or -1.
 */
BinStorage.prototype._searchBlock = function bs_searchBlock(code, byteOffset) {
  var bin = this._bin;
  var view = new DataView(bin, byteOffset);
  var length = view.getUint16(0, true);
  var contentLength = view.getUint16(2, true);

  var keyBlockByteOffset =
    byteOffset + ((2 + contentLength) << 1);

  var addressBlockByteOffset =
    byteOffset + ((2 + contentLength + length) << 1);

  // Consider the size of the padding.
  if (addressBlockByteOffset % 4) {
    addressBlockByteOffset += 2;
  }

  var keyBlockView = new DataView(bin, keyBlockByteOffset, length << 1);
  var addressBlockView = new DataView(bin, addressBlockByteOffset, length << 2);

  // Do a interpolation search
  var low = 0;
  var high = length - 1;
  var mid;

  var lowCode, highCode, midCode;

  while (low < length &&
        (lowCode = keyBlockView.getUint16(low << 1, true)) <= code &&
        (highCode = keyBlockView.getUint16(high << 1, true)) >= code) {
    mid = low + (((code - lowCode) * (high - low)) / (highCode - lowCode)) | 0;

    midCode = keyBlockView.getUint16(mid << 1, true);

    if (midCode < code) {
      low = mid + 1;
    } else if (midCode > code) {
      high = mid - 1;
    } else {
      return addressBlockView.getUint32(mid << 2, true);
    }
  }

  if (lowCode === code) {
    return addressBlockView.getUint32(low << 2, true);
  } else {
    return -1;
  }
};
/**
 * Internal method for getting the content of the block.
 * @param  {numbber}  byteOffset  Byte offset of the block.
 * @return {array} array contain 3 elements
 *   - First element is the reference to the arrayBuffer
 *   - Second element is the byteOffset the content begins.
 *   - Third element is the length of the content.
 */
BinStorage.prototype._getBlockContent =
  function bs_getBlockContent(byteOffset) {
    var bin = this._bin;
    var view = new DataView(bin, byteOffset);
    var contentLength = view.getUint16(2, true);

    if (contentLength === 0) {
      return undefined;
    }

    return [bin, byteOffset + (2 << 1), contentLength];
  };

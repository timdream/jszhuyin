'use strict';

// This file implements encoding system documented by libtabe,
// inspired by the ETen Chinese System.
// See ./libtabe/doc/BoPoMoFo.shtml
// Get libtabe at http://sourceforge.net/projects/libtabe/

//               1st Group  2nd Group  3rd Group  Tone Symbols
// # of Symbols  21         3          13         5
// # of Bits     6          2          4          3

// TODO: Maybe support Extended Bopomofo in the future?

var BopomofoEncoder = {
  // Unicode range of each of the Bopomofo symbol groups
  // See https://en.wikipedia.org/wiki/Bopomofo_(script)#Unicode
  BOPOMOFO_START_GROUP_1: 0x3105,
  BOPOMOFO_END_GROUP_1: 0x3119,
  BOPOMOFO_START_GROUP_2: 0x3127,
  BOPOMOFO_END_GROUP_2: 0x3129,
  BOPOMOFO_START_GROUP_3: 0x311A,
  BOPOMOFO_END_GROUP_3: 0x3126,

  // Number substract or add the pad value when transforming symbols into bits
  BOPOMOFO_GROUP_1_PAD: 0x3104,
  BOPOMOFO_GROUP_2_PAD: 0x3126,
  BOPOMOFO_GROUP_3_PAD: 0x3119,

  // Tone symbols are placed in Spacing Modifier Letters Unicode block
  BOPOMOFO_TONE_1: 0x0020,
  BOPOMOFO_TONE_2: 0x02ca,
  BOPOMOFO_TONE_3: 0x02c7,
  BOPOMOFO_TONE_4: 0x02cb,
  BOPOMOFO_TONE_5: 0x02c9,

  /**
   * Convert symbols (represents one syllable) into a 15bit number.
   * @param  {string} symbols Bopomofo symbols.
   * @return {number}         A 15bit number representing the syllable.
   * @this   {object}         BopomofoEncoder
   */
  encodeSymbolsToCode: function be_encodeSyllableToCode(symbols) {
    var symbolsCode = 0;
    var filled_1 = false;
    var filled_2 = false;
    var filled_3 = false;
    var filled_4 = false;

    for (var j = 0; j < symbols.length; j++) {
      var symbolCode = symbols.charCodeAt(j);

      if (symbolCode >= this.BOPOMOFO_START_GROUP_1 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_1) {
        if (filled_1 || filled_2 || filled_3 || filled_4)
          throw 'Malform symbols: duplicated or misplaced 1st group symbol.';

        filled_1 = true;

        symbolsCode |= (symbolCode - this.BOPOMOFO_GROUP_1_PAD) << 9;
        continue;
      }

      if (symbolCode >= this.BOPOMOFO_START_GROUP_2 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_2) {
        if (filled_2 || filled_4)
          throw 'Malform symbols: duplicated or misplaced 2nd group symbol.';

        filled_2 = true;
        symbolsCode |= (symbolCode - this.BOPOMOFO_GROUP_2_PAD) << 7;
        continue;
      }

      if (symbolCode >= this.BOPOMOFO_START_GROUP_3 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_3) {
        if (filled_3 || filled_4)
          throw 'Malform symbols: duplicated or misplaced 3nd group symbol.';

        filled_3 = true;
        symbolsCode |= (symbolCode - this.BOPOMOFO_GROUP_3_PAD) << 3;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_1) {
        if (filled_4)
          throw 'Malform symbols: duplicated tone symbol.';

        filled_4 = true;
        symbolsCode |= 0x1;
        break;
      }

      if (symbolCode == this.BOPOMOFO_TONE_2) {
        if (filled_4)
          throw 'Malform symbols: duplicated tone symbol.';

        filled_4 = true;
        symbolsCode |= 0x2;
        break;
      }

      if (symbolCode == this.BOPOMOFO_TONE_3) {
        if (filled_4)
          throw 'Malform symbols: duplicated tone symbol.';

        filled_4 = true;
        symbolsCode |= 0x3;
        break;
      }

      if (symbolCode == this.BOPOMOFO_TONE_4) {
        if (filled_4)
          throw 'Malform symbols: duplicated tone symbol.';

        filled_4 = true;
        symbolsCode |= 0x4;
        break;
      }

      if (symbolCode == this.BOPOMOFO_TONE_5) {
        if (filled_4)
          throw 'Malform symbols: duplicated tone symbol.';

        filled_4 = true;
        symbolsCode |= 0x5;
        break;
      }

      throw 'Unknown symbol at position ' + j + ': ' + symbols[j];
    }

    return symbolsCode;
  },

  /**
   * Encode symbols (represents one syllable) into a character.
   * @param  {string} symbols Bopomofo symbols.
   * @return {string}         A character (16bit long internally)
   *                          representing the syllable.
   * @this   {object}         BopomofoEncoder
   */
  encodeSymbols: function be_encodeSymbols(symbols) {
    var code = this.encodeSymbolsToCode(symbols);
    return String.fromCharCode(code);
  },

  /**
   * Encode symbols array (each item represents one syllable) into a string.
   * @param  {array[string]} symbolsArr Bopomofo symbols array.
   * @return {string}                   String representing the syllables.
   * @this   {object}                   BopomofoEncoder
   */
  encodeSymbolsFromArray: function be_encodeSymbolsFromArray(symbolsArr) {
    var encodedStr = '';

    for (var i = 0; i < symbolsArr.length; i++) {
      var symbols = symbolsArr[i];
      encodedStr += this.encodeSymbols(symbols);
    }

    return encodedStr;
  },

  /**
   * Convert the 15bit number (represents one syllable) into Bopomofo symbols.
   * @param  {number} symbolsCode A 15bit number representing the syllable.
   * @return {string}             Bopomofo symbols.
   * @this   {object}             BopomofoEncoder
   */
  decodeSymbolsFromCode: function be_decodeSymbolsFromCode(symbolsCode) {
    var symbols = '';
    var group_1_code = (symbolsCode & ((1 << 6) - 1) << 9) >> 9;
    var group_2_code = (symbolsCode & ((1 << 2) - 1) << 7) >> 7;
    var group_3_code = (symbolsCode & ((1 << 4) - 1) << 3) >> 3;
    var toneCode = symbolsCode & (1 << 3) - 1;

    if (group_1_code) {
      symbols += String.fromCharCode(this.BOPOMOFO_GROUP_1_PAD + group_1_code);
    }

    if (group_2_code) {
      symbols += String.fromCharCode(this.BOPOMOFO_GROUP_2_PAD + group_2_code);
    }

    if (group_3_code) {
      symbols += String.fromCharCode(this.BOPOMOFO_GROUP_3_PAD + group_3_code);
    }

    switch (toneCode) {
      case 1:
        symbols += String.fromCharCode(this.BOPOMOFO_TONE_1);
        break;

      case 2:
        symbols += String.fromCharCode(this.BOPOMOFO_TONE_2);
        break;

      case 3:
        symbols += String.fromCharCode(this.BOPOMOFO_TONE_3);
        break;

      case 4:
        symbols += String.fromCharCode(this.BOPOMOFO_TONE_4);
        break;

      case 5:
        symbols += String.fromCharCode(this.BOPOMOFO_TONE_5);
        break;
    }

    return symbols;
  },

  /**
   * Decode a character (represents one syllable) into Bopomofo symbols.
   * @param  {string} char A character (16bit long internally)
   *                       representing the syllable.
   * @return {string}      Bopomofo symbols.
   * @this   {object}      BopomofoEncoder
   */
  decodeSymbols: function be_decodeSymbols(char) {
    return this.decodeSymbolsFromCode(char.charCodeAt(0));
  },

  /**
   * Decode an encoded string into symbols array (each item represents
   * one syllable).
   * @param  {string}                   String representing the syllables.
   * @return {array[string]} encodedStr Bopomofo symbols array.
   * @this   {object}                   BopomofoEncoder
   */
  decodeSymbolsToArray: function be_decodeSymbolsToArray(encodedStr) {
    var symbolsArr = [];
    for (var i = 0; i < encodedStr.length; i++) {
      symbolsArr.push(this.decodeSymbols(encodedStr.charAt(i)));
    }
    return symbolsArr;
  },

  /**
   * Split Bopomofo symbols in a string into an array
   * @param  {string}        str String containing Bopomofo symbols.
   * @return {array[string]}     Bopomofo symbols array.
   * @this   {object}            BopomofoEncoder
   */
  splitSymbolsArray: function be_splitSymbolsArray(str) {
    var symbolsArr = [];

    var symbols = '';
    var filled_1 = false;
    var filled_2 = false;
    var filled_3 = false;
    var filled_4 = false;

    var next = function next() {
      symbolsArr.push(symbols);

      symbols = '';
      filled_1 = filled_2 = filled_3 = filled_4 = false;
    };

    for (var j = 0; j < str.length; j++) {
      var symbol = str[j];
      var symbolCode = str.charCodeAt(j);

      if (symbolCode >= this.BOPOMOFO_START_GROUP_1 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_1) {
        if (filled_1 || filled_2 || filled_3 || filled_4)
          next();

        filled_1 = true;

        symbols += symbol;
        continue;
      }

      if (symbolCode >= this.BOPOMOFO_START_GROUP_2 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_2) {
        if (filled_2 || filled_4)
          next();

        filled_2 = true;

        symbols += symbol;
        continue;
      }

      if (symbolCode >= this.BOPOMOFO_START_GROUP_3 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_3) {
        if (filled_3 || filled_4)
          next();

        filled_3 = true;

        symbols += symbol;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_1 ||
          symbolCode == this.BOPOMOFO_TONE_2 ||
          symbolCode == this.BOPOMOFO_TONE_3 ||
          symbolCode == this.BOPOMOFO_TONE_4 ||
          symbolCode == this.BOPOMOFO_TONE_5) {
        if (filled_4)
          next();

        filled_4 = true;

        symbols += symbol;
        continue;
      }

      throw 'Unknown symbol at position ' + j + ': ' + symbol;
    }

    next();
    return symbolsArr;
  }
};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module.exports) {
  module.exports = BopomofoEncoder;
}

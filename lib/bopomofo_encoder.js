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
  BOPOMOFO_TONE_1: 0x02c9,
  BOPOMOFO_TONE_2: 0x02ca,
  BOPOMOFO_TONE_3: 0x02c7,
  BOPOMOFO_TONE_4: 0x02cb,
  BOPOMOFO_TONE_5: 0x02d9,

  // Bitmask for each group
  BOPOMOFO_GROUP_1_BITMASK: 0x7e00,
  BOPOMOFO_GROUP_2_BITMASK: 0x0180,
  BOPOMOFO_GROUP_3_BITMASK: 0x0078,
  BOPOMOFO_TONE_BITMASK: 0x0007,

  /**
   * Encode a Bopomofo symbols string into encoded sounds.
   * into encoded string.
   * @param  {string} symbols      Symbols string.
   * @param  {object} options      Options.
   *                               - reorder: true for reorder.
   * @return {string}              encoded sounds string.
   * @this   BopomofoEncoder
   */
  encode: function be_encode(symbols, options) {
    options = options || {};

    var encodedSoundsArr = [];

    var symbolsCode = 0;
    var filled1 = false;
    var filled2 = false;
    var filled3 = false;
    var filled4 = false;

    var reorder = options.reorder;

    var next = function next() {
      encodedSoundsArr.push(symbolsCode);

      symbolsCode = 0;
      filled1 = filled2 = filled3 = filled4 = false;
    };

    for (var j = 0; j < symbols.length; j++) {
      var symbolCode = symbols.charCodeAt(j);

      if (symbolCode >= this.BOPOMOFO_START_GROUP_1 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_1) {
        if (!reorder && (filled1 || filled2 || filled3 || filled4)) {
          next();
        }
        if (reorder && (filled1 || filled4)) {
          next();
        }

        filled1 = true;

        symbolsCode |= (symbolCode - this.BOPOMOFO_GROUP_1_PAD) << 9;
        continue;
      }

      if (symbolCode >= this.BOPOMOFO_START_GROUP_2 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_2) {
        if (!reorder && (filled2 || filled3 || filled4)) {
          next();
        }
        if (reorder && (filled2 || filled4)) {
          next();
        }

        filled2 = true;

        symbolsCode |= (symbolCode - this.BOPOMOFO_GROUP_2_PAD) << 7;
        continue;
      }

      if (symbolCode >= this.BOPOMOFO_START_GROUP_3 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_3) {
        if (filled3 || filled4) {
          next();
        }

        filled3 = true;

        symbolsCode |= (symbolCode - this.BOPOMOFO_GROUP_3_PAD) << 3;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_1) {
        if (filled4) {
          next();
        }

        filled4 = true;
        symbolsCode |= 0x1;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_2) {
        if (filled4) {
          next();
        }

        filled4 = true;
        symbolsCode |= 0x2;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_3) {
        if (filled4) {
          next();
        }

        filled4 = true;
        symbolsCode |= 0x3;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_4) {
        if (filled4) {
          next();
        }

        filled4 = true;
        symbolsCode |= 0x4;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_5) {
        if (filled4) {
          next();
        }

        filled4 = true;
        symbolsCode |= 0x5;
        continue;
      }

      throw 'Unknown symbol at position ' + j + ': ' + symbols[j];
    }

    next();
    return String.fromCharCode.apply(String, encodedSoundsArr);
  },

  /**
   * Decode an encoded sounds string into Bopomofo symbols.
   * @param  {string} encodedStr encoded sounds string.
   * @return {string}            symbols string.
   * @this   BopomofoEncoder
   */
  decode: function be_decode(encodedStr) {
    var symbols = '';
    for (var i = 0; i < encodedStr.length; i++) {
      var symbolsCode = encodedStr.charCodeAt(i);
      var group1Code = (symbolsCode & this.BOPOMOFO_GROUP_1_BITMASK) >> 9;
      var group2Code = (symbolsCode & this.BOPOMOFO_GROUP_2_BITMASK) >> 7;
      var group3Code = (symbolsCode & this.BOPOMOFO_GROUP_3_BITMASK) >> 3;
      var toneCode = symbolsCode & this.BOPOMOFO_TONE_BITMASK;

      if (group1Code) {
        symbols +=
          String.fromCharCode(this.BOPOMOFO_GROUP_1_PAD + group1Code);
      }

      if (group2Code) {
        symbols +=
          String.fromCharCode(this.BOPOMOFO_GROUP_2_PAD + group2Code);
      }

      if (group3Code) {
        symbols +=
          String.fromCharCode(this.BOPOMOFO_GROUP_3_PAD + group3Code);
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
    }

    return symbols;
  },

  /**
   * Return true if the character or charCode given represents
   * an accepted Bopomofo symbol.
   * @param  {string|number} chr String or a charCode.
   * @return {boolean}           Return true if the character or charCode given
   *                             represents an accepted Bopomofo symbol.
   * @this   BopomofoEncoder
   */
  isBopomofoSymbol: function be_isBopomofoSymbol(chr) {
    var code = (typeof chr === 'string') ? chr.charCodeAt(0) : chr;

    if (code >= this.BOPOMOFO_START_GROUP_1 &&
        code <= this.BOPOMOFO_END_GROUP_1) {
      return true;
    }

    if (code >= this.BOPOMOFO_START_GROUP_2 &&
        code <= this.BOPOMOFO_END_GROUP_2) {
      return true;
    }

    if (code >= this.BOPOMOFO_START_GROUP_3 &&
        code <= this.BOPOMOFO_END_GROUP_3) {
      return true;
    }

    if (code === this.BOPOMOFO_TONE_1 ||
        code === this.BOPOMOFO_TONE_2 ||
        code === this.BOPOMOFO_TONE_3 ||
        code === this.BOPOMOFO_TONE_4 ||
        code === this.BOPOMOFO_TONE_5) {
      return true;
    }

    return false;
  },

  APPEND_MODE_NONE: 0,
  APPEND_MODE_REORDER: 1,

  appendToSymbols: function(symbols, symbolToAttach, mode) {
    mode = mode || this.APPEND_MODE_NONE;

    if (!this.isBopomofoSymbol(symbolToAttach)) {
      throw new Error('BopomofoEncoder: ' +
        'Symbol to attach is not a Bopomofo symbol.');
    }

    switch (mode) {
      case this.APPEND_MODE_NONE:
        return symbols + symbolToAttach;
      case this.APPEND_MODE_REORDER:
        // TODO: FIX THIS.
        return this.decode(this.encode(symbols + symbolToAttach, {
          reorder: true
        }));
    }
  },

  isIncompletionOf: function(code, codeToMatch) {
    var group1Code = (code & this.BOPOMOFO_GROUP_1_BITMASK) >> 9;
    var group2Code = (code & this.BOPOMOFO_GROUP_2_BITMASK) >> 7;
    var group3Code = (code & this.BOPOMOFO_GROUP_3_BITMASK) >> 3;
    var toneCode = code & this.BOPOMOFO_TONE_BITMASK;

    var group1CodeToMatch = (codeToMatch & this.BOPOMOFO_GROUP_1_BITMASK) >> 9;
    var group2CodeToMatch = (codeToMatch & this.BOPOMOFO_GROUP_2_BITMASK) >> 7;
    var group3CodeToMatch = (codeToMatch & this.BOPOMOFO_GROUP_3_BITMASK) >> 3;
    var toneCodeToMatch = codeToMatch & this.BOPOMOFO_TONE_BITMASK;

    // This is fairly complex because not only we have to consider mis-match
    // of symbols at the same place, but also evaluate to false when there is
    // a following up symbol but the previous one is missing.
    // To future self: The best way to understand this is by reading test cases.
    return (
      !(group1CodeToMatch && !group1Code &&
        (group2Code || group3Code || toneCode)) &&
      !(group1Code && group1CodeToMatch !== group1Code) &&
      !(group2CodeToMatch && !group2Code &&
        (group3Code || toneCode)) &&
      !(group2Code && group2CodeToMatch !== group2Code) &&
      !(group3CodeToMatch && !group3Code && toneCode) &&
      !(group3Code && group3CodeToMatch !== group3Code) &&
      !(toneCode && toneCodeToMatch !== toneCode) &&
      true);
  },

  isCompleted: function(code) {
    // Only phontics with tone is considered completed.
    return !!(code & this.BOPOMOFO_TONE_BITMASK);
  },

  replace: function(code, fromCode, toCode) {
    var match = false;
    if (fromCode & this.BOPOMOFO_GROUP_1_BITMASK) {
      match = ((code & this.BOPOMOFO_GROUP_1_BITMASK) ===
        (fromCode & this.BOPOMOFO_GROUP_1_BITMASK));
    }
    if (fromCode & this.BOPOMOFO_GROUP_2_BITMASK) {
      match = ((code & this.BOPOMOFO_GROUP_2_BITMASK) ===
        (fromCode & this.BOPOMOFO_GROUP_2_BITMASK));
    }
    if (fromCode & this.BOPOMOFO_GROUP_3_BITMASK) {
      match = ((code & this.BOPOMOFO_GROUP_3_BITMASK) ===
        (fromCode & this.BOPOMOFO_GROUP_3_BITMASK));
    }
    if (fromCode & this.BOPOMOFO_TONE_BITMASK) {
      match = ((code & this.BOPOMOFO_TONE_BITMASK) ===
        (fromCode & this.BOPOMOFO_TONE_BITMASK));
    }

    if (!match) {
      return code;
    }

    return code & ~fromCode | toCode;
  },

  split: function(code) {
    // Completed symbol should not be split.
    if (this.isCompleted(code)) {
      return [[code]];
    }

    var comp = [];
    if (code & this.BOPOMOFO_GROUP_1_BITMASK) {
      comp.push(code & this.BOPOMOFO_GROUP_1_BITMASK);
    }
    if (code & this.BOPOMOFO_GROUP_2_BITMASK) {
      comp.push(code & this.BOPOMOFO_GROUP_2_BITMASK);
    }
    if (code & this.BOPOMOFO_GROUP_3_BITMASK) {
      comp.push(code & this.BOPOMOFO_GROUP_3_BITMASK);
    }

    // Get all posibility compositions of a given natural number.
    // There will be 2^(n-1) items in the array.
    var res = [];
    var n = comp.length;
    var x, a, j;
    x = 1 << n - 1;
    while (x--) {
      j = 0;
      a = [comp[j]];
      while (n - 1 > j) {
        if (x & (1 << j)) {
          a[a.length - 1] |= comp[++j];
        } else {
          a.push(comp[++j]);
        }
      }
      res.push(a);
    }

    return res;
  }
};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module.exports) {
  module.exports = BopomofoEncoder;
}

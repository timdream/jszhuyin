'use strict';

(function(factory) {
  if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else if (typeof self === 'object') {
    // Window or WorkerGlobalScope
    self.BopomofoEncoder = factory();
  }
}(function() {

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
   * @return {array(number)}       Encoded sounds array.
   * @this   BopomofoEncoder
   */
  encode: function be_encode(symbols, options) {
    options = options || {};

    var encodedSoundsArr = [];

    var currentEncodeSymbolsCode = 0;
    var filled1 = false;
    var filled2 = false;
    var filled3 = false;
    var filled4 = false;

    var reorder = options.reorder;

    var next = function next() {
      encodedSoundsArr.push(currentEncodeSymbolsCode);

      currentEncodeSymbolsCode = 0;
      filled1 = filled2 = filled3 = filled4 = false;
    };

    for (var j = 0; j < symbols.length; j++) {
      var encodedSymbolCode = this.encodeOne(symbols[j]);

      if (encodedSymbolCode & this.BOPOMOFO_GROUP_1_BITMASK) {
        if (!reorder && (filled1 || filled2 || filled3 || filled4)) {
          next();
        }
        if (reorder && (filled1 || filled4)) {
          next();
        }

        filled1 = true;
        currentEncodeSymbolsCode |= encodedSymbolCode;

        continue;
      }

      if (encodedSymbolCode & this.BOPOMOFO_GROUP_2_BITMASK) {
        if (!reorder && (filled2 || filled3 || filled4)) {
          next();
        }
        if (reorder && (filled2 || filled4)) {
          next();
        }

        filled2 = true;
        currentEncodeSymbolsCode |= encodedSymbolCode;

        continue;
      }

      if (encodedSymbolCode & this.BOPOMOFO_GROUP_3_BITMASK) {
        if (filled3 || filled4) {
          next();
        }

        filled3 = true;
        currentEncodeSymbolsCode |= encodedSymbolCode;

        continue;
      }

      if (encodedSymbolCode & this.BOPOMOFO_TONE_BITMASK) {
        filled4 = true;
        currentEncodeSymbolsCode |= encodedSymbolCode;

        continue;
      }

      throw new Error('Should not reach here.');
    }

    next();
    return encodedSoundsArr;
  },

  /**
   * Encode exactly one Bopomofo symbol
   * @param  {string} symbol Bopomofo symbol
   * @return {number}        Encoded code representing the symbol.
   */
  encodeOne: function be_encodeOne(symbol) {
    var symbolCode = symbol.charCodeAt(0);

    if (symbolCode >= this.BOPOMOFO_START_GROUP_1 &&
        symbolCode <= this.BOPOMOFO_END_GROUP_1) {
      return (symbolCode - this.BOPOMOFO_START_GROUP_1 + 1) << 9;
    }

    if (symbolCode >= this.BOPOMOFO_START_GROUP_2 &&
        symbolCode <= this.BOPOMOFO_END_GROUP_2) {
      return (symbolCode - this.BOPOMOFO_START_GROUP_2 + 1) << 7;
    }

    if (symbolCode >= this.BOPOMOFO_START_GROUP_3 &&
        symbolCode <= this.BOPOMOFO_END_GROUP_3) {
      return (symbolCode - this.BOPOMOFO_START_GROUP_3 + 1) << 3;
    }

    if (symbolCode == this.BOPOMOFO_TONE_1) {
      return 0x1;
    }

    if (symbolCode == this.BOPOMOFO_TONE_2) {
      return 0x2;
    }

    if (symbolCode == this.BOPOMOFO_TONE_3) {
      return 0x3;
    }

    if (symbolCode == this.BOPOMOFO_TONE_4) {
      return 0x4;
    }

    if (symbolCode == this.BOPOMOFO_TONE_5) {
      return 0x5;
    }

    throw new Error('Unknown symbol: ' + symbol);
  },

  /**
   * Decode an encoded sounds string into Bopomofo symbols.
   * @param  {array(number)} encodedArr Encoded sounds string or array.
   * @return {string}                   Symbols string.
   * @this   BopomofoEncoder
   */
  decode: function be_decode(encodedArr) {
    var symbols = '';
    for (var i = 0; i < encodedArr.length; i++) {
      var symbolsCode = encodedArr[i];
      var group1Code = (symbolsCode & this.BOPOMOFO_GROUP_1_BITMASK) >> 9;
      var group2Code = (symbolsCode & this.BOPOMOFO_GROUP_2_BITMASK) >> 7;
      var group3Code = (symbolsCode & this.BOPOMOFO_GROUP_3_BITMASK) >> 3;
      var toneCode = symbolsCode & this.BOPOMOFO_TONE_BITMASK;

      if (group1Code) {
        symbols +=
          String.fromCharCode(this.BOPOMOFO_START_GROUP_1 - 1 + group1Code);
      }

      if (group2Code) {
        symbols +=
          String.fromCharCode(this.BOPOMOFO_START_GROUP_2 - 1 + group2Code);
      }

      if (group3Code) {
        symbols +=
          String.fromCharCode(this.BOPOMOFO_START_GROUP_3 - 1 + group3Code);
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

  /**
   * Construct and encoded sounds array that have all non-completed sounds
   * expended as seperate symbols.
   * Useful for getSymbolsCompositions() and also to decide the minimal # of
   * composing elements of the symbols string.
   *
   * @param {string}           symbols   String of Bopomofo symbols.
   * @returns {array(number)}            Array consist of code of the
   *                                     encoded sounds.
   */
  encodeExpended: function(symbols) {
    var encodedSoundsReversedArr = [0];
    var i = symbols.length;
    var pos = 0;
    var placeIntoCurrentSound = false;
    var filled1, filled2, filled3;

    var encodedSymbolCode;
    while (i--) {
      encodedSymbolCode = this.encodeOne(symbols[i]);
      if (this.isCompleted(encodedSymbolCode)) {
        placeIntoCurrentSound = true;
        filled1 = filled2 = filled3 = false;
        encodedSoundsReversedArr.push(encodedSymbolCode);
        pos++;
      } else {
        if (placeIntoCurrentSound) {
          if ((encodedSymbolCode & this.BOPOMOFO_GROUP_3_BITMASK) &&
              !filled3 && !filled2 && !filled1) {
            filled3 = true;
            encodedSoundsReversedArr[pos] |= encodedSymbolCode;
          } else if ((encodedSymbolCode & this.BOPOMOFO_GROUP_2_BITMASK) &&
            !filled2 && !filled1) {
            filled2 = true;
            encodedSoundsReversedArr[pos] |= encodedSymbolCode;
          } else if ((encodedSymbolCode & this.BOPOMOFO_GROUP_1_BITMASK) &&
            !filled1) {
            filled1 = true;
            encodedSoundsReversedArr[pos] |= encodedSymbolCode;
          } else {
            placeIntoCurrentSound = false;
            encodedSoundsReversedArr.push(encodedSymbolCode);
            pos++;
          }
        } else {
          encodedSoundsReversedArr.push(encodedSymbolCode);
          pos++;
        }
      }
    }

    if (encodedSoundsReversedArr[0] === 0) {
      encodedSoundsReversedArr.shift();
    }

    return encodedSoundsReversedArr.reverse();
  },
  /**
   * Trim symbols to remove the part that will only match more words specify by
   * length.
   * @param  {string|array(number)} symbols Symbols
   * @param  {number} length                Length to trim.
   * @return {string}                       Trimmed symbols.
   */
  trimToLength: function(symbols, length) {
    symbols = (typeof symbols === 'string') ? symbols : this.decode(symbols);

    // No need to trim.
    if (symbols.length <= length) {
      return symbols;
    }

    var encodedSounds;
    var i = symbols.length;
    // XXX: Improve this; instead of a loop we could introduce a cap in
    // the state machine in the encode() method.
    do {
      encodedSounds = this.encode(symbols.substr(0, i));
      if (encodedSounds.length <= length) {
        break;
      }
    } while (i--);

    return this.decode(encodedSounds);
  },
  /**
   * Trim symbols (from the end) to remove the part that will only match more
   * words specify by length.
   * @param  {string|array(number)} symbols Symbols
   * @param  {number} length                Length to trim.
   * @return {string}                       Trimmed symbols.
   */
  trimToLengthFromEnd: function(symbols, length) {
    symbols = (typeof symbols === 'string') ? symbols : this.decode(symbols);

    var encodedSounds;
    var totalLength = this.encode(symbols).length;
    var i = 0;
    // XXX: Improve this; instead of a loop we could introduce a cap in
    // the state machine in the encode() method.
    while (++i < symbols.length) {
      encodedSounds = this.encode(symbols.substr(0, i));
      if (encodedSounds.length + length > totalLength) {
        break;
      }
    }

    return symbols.substr(i - 1);
  },

  /**
   * Return all possible combinations of the given symbols string.
   * @param  {string|array(number)}     symbols       Symbol string or array
   *                                                  returned from
   *                                                  encodeExpended.
   * @param  {number}                   length        Maximum length.
   * @return {array(array(number))}                   All combinations of
   *                                                  the given symbols string.
   */
  getSymbolCombinations: function(symbols, length) {
    // Construct an encodeExpended encoded sounds array,
    // or use the input as such.
    var expendedEncodedSounds =
      (typeof symbols === 'string') ? this.encodeExpended(symbols) : symbols;

    if (typeof length !== 'number') {
      length = expendedEncodedSounds.length * 3;
    }

    // Don't bother try. No combination can possibly fit into the length.
    if (expendedEncodedSounds.length > length * 3) {
      return [];
    }

    var combinations = expendedEncodedSounds
      .reduce(function(currentCombinations, code, i) {
        if (i === 0) {
          currentCombinations.push([ code ]);
          return currentCombinations;
        }

        return currentCombinations
          .reduce(function(currentCombinations, combination) {
            if (combination === null) {
              return currentCombinations;
            }

            var k = combination.length - 1;
            // If the previous symbol is a complete one of this is a completed
            // one, they must not occupy the same place.
            if (this.isCompleted(combination[k]) || this.isCompleted(code)) {
              if (combination.length === length) {
                return currentCombinations;
              }
              combination.push(code);
              currentCombinations.push(combination);
              return currentCombinations;
            }

            var filled2 = !!(combination[k] & this.BOPOMOFO_GROUP_2_BITMASK);
            var filled3 = !!(combination[k] & this.BOPOMOFO_GROUP_3_BITMASK);

            // If the previous one contain the same or the lower place of
            // symbol, the new symbol must not occupy the same place.
            if ((code & this.BOPOMOFO_GROUP_1_BITMASK) ||
                (code & this.BOPOMOFO_GROUP_2_BITMASK &&
                  (filled2 || filled3)) ||
                (code & this.BOPOMOFO_GROUP_3_BITMASK && filled3)) {
              if (combination.length === length) {
                return currentCombinations;
              }
              combination.push(code);
              currentCombinations.push(combination);
              return currentCombinations;
            }

            if (combination.length < length) {
              // Create a copy of the composition, so that we could still
              // put the symbols into the new place.
              var newCombination = [].concat(combination);

              newCombination.push(code);
              currentCombinations.push(newCombination);
            }

            // Combine the current symbol into the previous symbol.
            combination[k] |= code;
            currentCombinations.push(combination);

            return currentCombinations;
          }.bind(this), /* currentCombinations */ []);
      }.bind(this), []);

    return combinations;
  },

  isIncompletionOf: function(code, codeToMatch) {
    return this.createCompletionComparisonFunction(code)(codeToMatch);
  },

  createCompletionComparisonFunction: function(code) {
    var group1Code = (code & this.BOPOMOFO_GROUP_1_BITMASK) >> 9;
    var group2Code = (code & this.BOPOMOFO_GROUP_2_BITMASK) >> 7;
    var group3Code = (code & this.BOPOMOFO_GROUP_3_BITMASK) >> 3;
    var toneCode = code & this.BOPOMOFO_TONE_BITMASK;

    return function createdIsIncompletionOf(codeToMatch) {
      var group1CodeToMatch =
        (codeToMatch & this.BOPOMOFO_GROUP_1_BITMASK) >> 9;
      var group2CodeToMatch =
        (codeToMatch & this.BOPOMOFO_GROUP_2_BITMASK) >> 7;
      var group3CodeToMatch =
        (codeToMatch & this.BOPOMOFO_GROUP_3_BITMASK) >> 3;
      var toneCodeToMatch = codeToMatch & this.BOPOMOFO_TONE_BITMASK;

      // This is fairly complex because not only we have to consider mis-match
      // of symbols at the same place, but also evaluate to false when there is
      // a following up symbol but the previous one is missing.
      // To future self: The best way to understand this is by
      // reading test cases.
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
    }.bind(this);
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
  getMatchedCompleteEncodedSounds: function(code) {
    var length = 1;
    if (0 === (code & this.BOPOMOFO_TONE_BITMASK)) {
      length *= 5;
      if (0 === (code & this.BOPOMOFO_GROUP_3_BITMASK)) {
        length *= 14;
        if (0 === (code & this.BOPOMOFO_GROUP_2_BITMASK)) {
          length *= 4;
          if (0 === (code & this.BOPOMOFO_GROUP_1_BITMASK)) {
            length *= 21;
          }
        }
      }
    }

    var codes = new Uint16Array(length);
    var pos = 0, c1, c2, c3;
    if (0 === (code & this.BOPOMOFO_TONE_BITMASK)) {
      for (var m = 1; m <= 5; m++) {
        c3 = code | m;
        if (0 === (code & this.BOPOMOFO_GROUP_3_BITMASK)) {
          for (var k = 0; k <= 13; k++) {
            c2 = c3 | (k << 3);
            if (0 === (code & this.BOPOMOFO_GROUP_2_BITMASK)) {
              for (var j = 0; j <= 3; j++) {
                c1 = c2 | (j << 7);
                if (0 === (code & this.BOPOMOFO_GROUP_1_BITMASK)) {
                  for (var i = 0; i <= 21; i++) {
                    codes[pos] = c1 | (i << 9);
                    pos++;
                  }
                } else {
                  codes[pos] = c1;
                  pos++;
                }
              }
            } else {
              codes[pos] = c2;
              pos++;
            }
          }
        } else {
          codes[pos] = c3;
          pos++;
        }
      }
    } else {
      codes[pos] = code;
      pos++;
    }
    return codes;
  }
};

return BopomofoEncoder;

}));

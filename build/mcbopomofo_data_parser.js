'use strict';

// Function to parse each line of data.txt from McBopomofo to sortable
// JS object.

var BopomofoEncoder = require('../lib/bopomofo_encoder.js');

var McBopomofoDataParser = {
  // This regexp adds the first tone to data given by McBopomofo.
  ADD_FIRST_TONE_REGEXP: new RegExp('([^' +
    String.fromCharCode(BopomofoEncoder.BOPOMOFO_TONE_2,
                        BopomofoEncoder.BOPOMOFO_TONE_3,
                        BopomofoEncoder.BOPOMOFO_TONE_4,
                        BopomofoEncoder.BOPOMOFO_TONE_5) +
    '])(\-|$)', 'g'),
  ADD_FIRST_TONE_REPLACESTR: '$1' +
    String.fromCharCode(BopomofoEncoder.BOPOMOFO_TONE_1) + '$2',
  parse: function mbdp_parse(line) {
    // Skip empty lines
    if (!line) {
      return undefined;
    }

    var row = line.split(' ');

    // Skip punctuations
    if (row[1].indexOf('_punctuation_') !== -1) {
      return undefined;
    }

    var symbols = row[1].replace(this.ADD_FIRST_TONE_REGEXP,
                                 this.ADD_FIRST_TONE_REPLACESTR);
    var encodedStr = BopomofoEncoder.encode(symbols.replace(/\-/g, ''));
    var shortcutEncodedStr = BopomofoEncoder.encode((function() {
      return symbols.split('-').map(function(str) {
        return str[0];
      }).join('');
    }()));

    return {
      'encodedStr': encodedStr,
      'shortcutEncodedStr': shortcutEncodedStr,
      'str': row[0],
      'score': parseFloat(row[2])
    }
  }
};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module['exports']) {
  module['exports'] = McBopomofoDataParser;
}

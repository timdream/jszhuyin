'use strict';

var BopomofoEncoder = require('../../lib/bopomofo_encoder.js');
var JSZhuyin = require('../../').JSZhuyin;

var TestSteps = function TestSteps(flags) {
  var jszhuyin = new JSZhuyin();
  jszhuyin.load();
  this.jszhuyin = jszhuyin;
  this.flags = flags || 0;
};

TestSteps.prototype.FLAG_CONFIRM_EVERY_PHRASE = 1;
TestSteps.prototype.FLAG_TYPE_MULTIPLE_SYMBOLS = 2;

TestSteps.prototype.getTestSteps = function(text, symbolsArr) {
  var steps = this.steps = [];
  var jszhuyin = this.jszhuyin;

  this.text = text;

  this.compositions = '';
  jszhuyin.oncompositionupdate = function(str) {
    this.compositions = str;
  }.bind(this);

  this.outputLength = 0;
  this.output = [];
  jszhuyin.oncompositionend = function(str) {
    this.output.push(str);
    this.outputLength += str.length;
  }.bind(this);

  this.candidates = [];
  jszhuyin.oncandidateschange = function(c) {
    this.candidates = c;
  }.bind(this);

  var shouldAlwaysConfirmCandidates =
    !!(this.flags & this.FLAG_CONFIRM_EVERY_PHRASE);

  // Start "typing". Depend on the flags,
  // We would generate differet steps.
  symbolsArr
    .forEach(function(phraseSymbols) {
      var isOneNonBopomofoSymbol =
        (phraseSymbols.length === 1 &&
          !BopomofoEncoder.isBopomofoSymbol(phraseSymbols));

      if (shouldAlwaysConfirmCandidates) {
        this._confirmCurrentCandidates();
      } else if (isOneNonBopomofoSymbol &&
        !this._isFirstCandidateDesired()) {
        // If we couldn't confirm directly,
        // start the loop that would exhaust pending compositions by
        // selecting the right candidates.
        this._confirmCurrentCandidates();
      }

      if (isOneNonBopomofoSymbol ||
          (this.flags & this.FLAG_TYPE_MULTIPLE_SYMBOLS)) {
        var arg = this._getHandleKeyArg(phraseSymbols);
        steps.push({ task: 'handleKey', 'arg': arg });
        var handled = this.jszhuyin.handleKey(arg);
        if (!handled) {
          this.output.push(phraseSymbols);
          this.outputLength += 1;
        }
      } else {
        phraseSymbols
          .split('')
          .forEach(function(symbol) {
            var arg = this._getHandleKeyArg(symbol);
            steps.push({ task: 'handleKey', 'arg': arg });
            var handled = this.jszhuyin.handleKey(arg);
            if (!handled) {
              this.output.push(symbol);
              this.outputLength += 1;
            }
          }.bind(this));
      }
    }.bind(this));

  // Flush out the remaining compositions
  if (shouldAlwaysConfirmCandidates ||
    !this._isFirstCandidateDesired()) {
    // Starting the loop that would find us the right characters
    this._confirmCurrentCandidates();
  } else {
    // Use Enter to confirm the last candidate.
    var symbol = 'Enter';
    steps.push({ task: 'handleKey', 'arg': symbol });
    var handled = jszhuyin.handleKey(symbol);
    if (!handled) {
      this.output.push(symbol);
      this.outputLength += 1;
    }
  }
  if (this.output.join('') !== text) {
    throw new Error('Something wrong, the output was not correct.');
  }

  jszhuyin.oncompositionupdate =
    jszhuyin.oncompositionend =
    jszhuyin.oncandidateschange = null;

  return steps;
};

TestSteps.prototype._getHandleKeyArg = function(key) {
  if (key === '\n') {
    return 'Enter';
  }
  return key;
};

TestSteps.prototype._isFirstCandidateDesired = function() {
  return (this.candidates.length &&
    this.candidates[0][0] ===
      this.text.substr(this.outputLength, this.candidates[0][0].length));
};

TestSteps.prototype._confirmCurrentCandidates = function() {
  while (this.compositions) {
    var j = this.candidates[0][0].length, strToFind, index;
    do {
      strToFind = this.text.substr(this.outputLength, j);
      index = this.candidates.findIndex(function(candidate) {
        return (candidate[0] === strToFind);
      });

      if (index !== -1) {
        this.steps.push(
          { task: 'selectCandidate', 'arg': this.candidates[index] });
        this.jszhuyin.selectCandidate(this.candidates[index]);
        break;
      }

      if (j === 1) {
        throw new Error(
          'This should not happen the symbols returned should' +
          ' always give us the right candidates: ' + strToFind);
      }
    } while (--j);
  }
};

var TestStepsGenerator =
module.exports.TestStepsGenerator = function TestStepsGenerator(text) {
  this.text = text;
  this.symbols = this._getSymbols(text);
};

TestStepsGenerator.prototype.FLAG_CONFIRM_EVERY_PHRASE = 1;
TestStepsGenerator.prototype.FLAG_TYPE_MULTIPLE_SYMBOLS = 2;

TestStepsGenerator.prototype.generateSteps = function(flag) {
  var testSteps = new TestSteps(flag);
  return testSteps.getTestSteps(this.text, this.symbols);
};

TestStepsGenerator.prototype._getSymbols = function(text) {
  var jszhuyin = new JSZhuyin();
  jszhuyin.load();

  var l = 0;
  var symbolsArr =
    jszhuyin.storage.reverseGet(text, jszhuyin.LONGEST_PHRASE_LENGTH, true)
    .map(function(codes, i) {
      var phraseSymbols = codes.map(function(code, j) {
        if (!code) {
          return text[l + j];
        }
        return BopomofoEncoder.decode([code]);
      }).join('');

      l += codes.length;
      return phraseSymbols;
    });

  return symbolsArr;
};

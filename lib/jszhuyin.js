'use strict';

/* global BopomofoEncoder, DataLoader, JSZhuyinDataPackStorage */

/**
 * A queue to run one action at a time.
 * @this   {object}   ActionQueue instance.
 */
var ActionQueue = function ActionQueue() {
  this.pendingActions = [];
  this.waiting = false;
};
/**
 * Function to call to run each action.
 * @type {function}
 */
ActionQueue.prototype.handle = null;
/**
 * Queue and action. The arguments will be kept.
 * @this   {object}   ActionQueue instance.
 */
ActionQueue.prototype.queue = function aq_queue() {
  if (this.waiting) {
    this.pendingActions.push(arguments);
    return;
  }

  this.waiting = true;
  this.handle.apply(this, arguments);
};
/**
 * handle() are suppose to call done() when it finishes.
 * @this   {object}   ActionQueue instance.
 */
ActionQueue.prototype.done = function aq_done() {
  if (!this.waiting) {
    throw 'Calling queue.done() when we are not waiting.';
  }

  var args = this.pendingActions.shift();
  if (!args) {
    this.waiting = false;
    return;
  }

  this.handle.apply(this, args);
};

var JSZhuyinCandidateMetadata = function() {
  this.dataMap = new Map();
  // Start with a number other than any obvious ones to remove the meaning of
  // this incremental ID.
  this.nextId = 42;
  this.NULL_DATA = [0, 0];
};
JSZhuyinCandidateMetadata.prototype.NULL_ID = 0;
JSZhuyinCandidateMetadata.prototype.saveData =
function jcm_saveData(encodedSoundsLength, index) {
  this.dataMap.set(this.nextId, [ encodedSoundsLength, index ]);
  return this.nextId++;
};
JSZhuyinCandidateMetadata.prototype.getData = function(id) {
  if (id === this.NULL_ID) {
    return this.NULL_DATA;
  }
  var data = this.dataMap.get(id);
  if (!data) {
    throw new Error('JSZhuyinCandidateMetadata: ' +
      'Inexistent or outdated candidate.');
  }
  return data;
};
JSZhuyinCandidateMetadata.prototype.clear = function() {
  this.dataMap.clear();
};
/**
 * The main IME logic.
 * @this   {object}   JSZhuyin instance.
 */
var JSZhuyin = function JSZhuyin() {
  this.storage = null;

  this.symbols = '';
  this.confirmedPartIndex = 0;
  this.confirmedCharacters = '';
  this.defaultCandidate = undefined;
  this.queue = null;
  this.candidateMetadata = null;
};
/**
 * Limit the length of the symbols in the compositions.
 * @type {number}
 */
JSZhuyin.prototype.MAX_SOUNDS_LENGTH = 8;
/**
 * Suggest phrases after confirming characters.
 * @type {boolean}
 */
JSZhuyin.prototype.SUGGEST_PHRASES = true;
/**
 * Allow re-order of symbol input.
 * Better error-handling for typing with hardware keyboard.
 */
JSZhuyin.prototype.REORDER_SYMBOLS = false;
/**
 * When searching for matching words/phrases, consider these pairs of symbols
 * are interchangables.
 * Must be a string representing 2n sounds in Bopomofo symbols.
 *
 * Example string: 'ㄣㄥㄌㄖㄨㄛㄡ', making ㄣ interchangable with ㄥ and
 * ㄌ interchangable with ㄖ, and ㄨㄛ with ㄡ.
 * @type {string}
 */
JSZhuyin.prototype.INTERCHANGABLE_PAIRS = '';
/**
 * Overwritten path of database file.
 * @type {string}
 */
JSZhuyin.prototype.dataURL = '';
/**
 * Run when the loading is complete.
 * @type {function}
 */
JSZhuyin.prototype.onloadend = null;
/**
 * Run when loading is successful.
 * @type {function}
 */
JSZhuyin.prototype.onload = null;
/**
 * Run when unload.
 * @type {function}
 */
JSZhuyin.prototype.onunload = null;
/**
 * Run when error occours.
 * @type {function}
 */
JSZhuyin.prototype.onerror = null;
/**
 * Run when an action is handled; receives reqId passed to the functions.
 * @type {function}
 */
JSZhuyin.prototype.onactionhandled = null;
/**
 * Callback to call when the composition updates.
 * @type {function}
 */
JSZhuyin.prototype.oncompositionupdate = null;
/**
 * Callback to call when the composition ends.
 * @type {function}
 */
JSZhuyin.prototype.oncompositionend = null;
/**
 * Callback to call when candidate menu updates.
 * @type {function}
 */
JSZhuyin.prototype.oncandidateschange = null;

/**
 * Handle a key with it's DOM UI Event Level 3 key value.
 * @param  {string} key   The key property of the key to handle,
 *                        should be the printable character or a registered
 *                        name in the spec.
 * @param  {any}   reqId  ID of the request.
 * @return {boolean}      Return true if the key will be handled async.
 * @this   {object}       JSZhuyin instance.
 */
JSZhuyin.prototype.handleKey = function jz_handleKey(key, reqId) {
  if (!this.queue) {
    throw 'JSZhuyin: You need to load() first.';
  }

  if (typeof key !== 'string') {
    throw 'JSZhuyin: key passed to handleKey must be a string.';
  }

  if (BopomofoEncoder.isBopomofoSymbol(key)) {
    // We must handle Bopomofo symbols.
    this.queue.queue('key', key, reqId);

    return true;
  }

  if (this.defaultCandidate || this.symbols) {
    // We must handle all the keys if there are pending symbols or candidates.
    this.queue.queue('key', key, reqId);

    return true;
  }

  return false;
};

/**
 * Handle a key event with it's keyCode or charCode. Deprecated.
 * @param  {number} code  charCode of the keyboard event.
 *                        If charCode is 0, you should pass keyCode instead.
 * @param  {any}   reqId  ID of the request.
 * @return {boolean}      Return true if the key will be handled async.
 * @this   {object}       JSZhuyin instance.
 */
JSZhuyin.prototype.handleKeyEvent = function jz_handleKeyEvent(code, reqId) {
  var key;
  switch (code) {
    case 0x08:
      key = 'Backspace';
      break;
    case 0x0d:
      key = 'Enter';
      break;
    case 0x1b:
      key = 'Escape';
      break;
    default:
      // XXX: We are considering everything reach here is a printable character.
      key = String.fromCharCode(code);
  }

  return this.handleKey(key, reqId);
};

/**
 * Select a candidate. Will be handled in the action queue.
 * @param  {object} candidate One of the candidate that was sent via
 *                            oncandidateschange callback.
 * @param  {any}    reqId     ID of the request.
 * @this   {object}           JSZhuyin instance.
 */
JSZhuyin.prototype.selectCandidate = function jz_selCandi(candidate, reqId) {
  if (!Array.isArray(candidate) ||
      typeof candidate[0] !== 'string' ||
      typeof candidate[1] !== 'number') {
    throw new Error('JSZhuyin: ' +
      'malformed candidate object in selectCandidate call.');
  }

  this.queue.queue('candidateSelection', candidate, reqId);
};
/**
 * Load JSZhuyin; loading the database and register callbacks, etc.
 * @this   {object}   JSZhuyin instance.
 */
JSZhuyin.prototype.load = function jz_load(data) {
  if (this.loaded) {
    throw 'Already loaded.';
  }
  this.loaded = true;

  this.storage = new JSZhuyinDataPackStorage();
  if (data instanceof ArrayBuffer) {
    this.storage.load(data);
    if (typeof this.onload === 'function') {
      this.onload();
    }
    if (typeof this.onloadend === 'function') {
      this.onloadend();
    }
  } else {
    this.dataLoader = new DataLoader();
    if (this.dataURL) {
      this.dataLoader.DATA_URL = this.dataURL;
    }
    this.dataLoader.onerror = function() {
      if (typeof this.onerror === 'function') {
        this.onerror();
      }
    }.bind(this);
    this.dataLoader.onload = function() {
      this.storage.load(this.dataLoader.data);
      if (typeof this.onload === 'function') {
        this.onload();
      }
    }.bind(this);
    this.dataLoader.onloadend = function() {
      if (typeof this.onloadend === 'function') {
        this.onloadend();
      }
    }.bind(this);
    this.dataLoader.load();
  }

  this.symbols = '';
  this.defaultCandidate = undefined;
  this.candidateMetadata = new JSZhuyinCandidateMetadata();
  this.queue = new ActionQueue();
  this.queue.handle = this.handle.bind(this);
};
/**
 * Set configurations.
 * @param {object}  config      Configuration to set on JSZhuyin.
 */
JSZhuyin.prototype.setConfig = function(config) {
  for (var key in config) {
    this[key] = config[key];
  }
};
/**
 * Unload JSZhuyin. Close the database connection and purge things
 * from memory.
 * @this   {object}   JSZhuyin instance.
 */
JSZhuyin.prototype.unload = function jz_unload() {
  if (!this.loaded) {
    throw 'Already unloaded.';
  }
  this.loaded = false;

  if (this.storage) {
    this.storage.unload();
    this.storage = null;
  }

  if (this.dataLoader) {
    this.dataLoader = null;
  }

  this.symbols = '';
  this.storage = null;
  this.defaultCandidate = undefined;
  this.queue.handle = null;
  this.queue = null;

  if (typeof this.onunload === 'function') {
    this.onunload();
  }
};
/**
 * Actual function to handle an action in the action queue.
 * You should not call this method directly.
 * @param  {string} type   A type keyword.
 * @param  {any}    data   Data to handle for the action.
 * @param  {any}    reqId  ID of the request.
 * @this   {object}        JSZhuyin instance.
 */
JSZhuyin.prototype.handle = function jz_handle(type, data, reqId) {
  switch (type) {
    case 'key':
      if (BopomofoEncoder.isBopomofoSymbol(data)) {
        var mode = this.REORDER_SYMBOLS ?
          BopomofoEncoder.APPEND_MODE_REORDER :
          BopomofoEncoder.APPEND_MODE_NONE;

        this.symbols =
          BopomofoEncoder.appendToSymbols(this.symbols, data, mode);
        this.updateComposition(reqId);
        this.query(reqId);

        break;
      }

      switch (data) {
        case 'Backspace':
          if (this.symbols.length === 0) {
            // Sliently discard the key here. Any meaningful response at
            // this stage would be throw the event back to the client,
            // which it would not be able to handle it either.
            this.sendActionHandled(reqId);
            this.queue.done();

            break;
          }

          this.symbols = this.symbols.substr(0, this.symbols.length - 1);
          this.updateComposition(reqId);
          this.query(reqId);

          break;

        case 'Enter':
          if (!this.defaultCandidate) {
            // Sliently discard the key here. Any meaningful response at
            // this stage would be throw the event back to the client,
            // which it would not be able to handle it either.
            this.sendActionHandled(reqId);
            this.queue.done();

            break;
          }

          this.confirmCandidate(this.defaultCandidate, reqId);

          break;

        case 'Escape':
          this.symbols = '';
          this.updateComposition(reqId);
          this.query(reqId);

          break;

        default:
          // All other keys.
          // XXX: We could only handle it as if it's a printable character here.
          this.confirmCandidate(
            [this.defaultCandidate[0] + data, this.defaultCandidate[1]], reqId);

          break;
      }

      break;

    case 'candidateSelection':
      this.confirmCandidate(data, reqId);

      break;

    default:
      throw 'Unknown action type: ' + type;
  }
};
/**
 * Run the query against the current symbols.
 * You should not call this method directly.
 * @param  {any}    reqId  ID of the request.
 * @this   {object}        JSZhuyin instance.
 */
JSZhuyin.prototype.query = function jz_query(reqId) {
  if (this.symbols.length === 0) {
    this.candidateMetadata.clear();
    this.updateCandidates([]);
    this.sendActionHandled(reqId);
    this.queue.done();

    return;
  }

  this.storage.setInterchangeablePairs(this.INTERCHANGABLE_PAIRS);

  var expendedEncodedSounds = BopomofoEncoder.encodeExpended(this.symbols);
  var compositions =
    BopomofoEncoder.getSymbolsCompositions(expendedEncodedSounds);

  if (expendedEncodedSounds.length > this.MAX_SOUNDS_LENGTH) {
    this.confirmCandidate(this.defaultCandidate, reqId);

    return;
  }

  // ==== START COMPOSING THE RESULT ====

  var results = [];
  var storage = this.storage;

  this.candidateMetadata.clear();

  // ==== PART I: PHRASES ====
  // List all the choices if the entire query happens to match to
  // phrases.
  compositions
    .filter(function(composition) {
      // Filter the compositions that will be processed in Part II.
      return (composition.length === 1);
    })
    .map(function(composition) {
      var symbolCodes = composition[0];
      return storage.getIncompleteMatched(symbolCodes);
    })
    .reduce(function(resultsArr, dataPack) {
      if (!dataPack) {
        return resultsArr;
      }

      return resultsArr.concat(dataPack.getResults());
    }, /* resultsArr */ [])
    .sort(function(a, b) {
      return b.score - a.score;
    })
    .forEach(function(result) {
      results.push([result.str,
        this.candidateMetadata.saveData(this.symbols.length, result.index)]);
    }.bind(this));

  // ==== PART II: COMPOSED RESULTS ====
  // Compose results with all the terms we could find.

  compositions
    .filter(function(composition) {
      // Filter the compositions that has been processed in Part I.
      return (composition.length > 1);
    })
    .map(function(composition) {
      var composedResultData = composition
        .map(function(symbolCodes) {
          return [storage.getIncompleteMatched(symbolCodes), symbolCodes];
        })
        .reduce(function(composedResultData, symbolCodesResultData) {
          // Don't do anything if the composedResultData passed is already null.
          if (!composedResultData) {
            return null;
          }

          if (!symbolCodesResultData[0]) { // No dataPack returned
            // Unless the symbolCodes here represents exactly one completed
            // sound, we would discard the entire composition here.
            if (symbolCodesResultData[1].length > 1 ||
              !BopomofoEncoder.isCompleted(symbolCodesResultData[1][0])) {
              return null;
            }

            // Don't discard the result so the user would find out the typo.
            composedResultData[0] +=
              BopomofoEncoder.decode(symbolCodesResultData[1]);
            composedResultData[1] += -Infinity;
            composedResultData[2] = 0;

            return composedResultData;
          }

          var firstResult = symbolCodesResultData[0].getFirstResult();
          composedResultData[0] += firstResult.str;
          composedResultData[1] += firstResult.score;
          composedResultData[2] = firstResult.index;

          return composedResultData;
        }, /* composedResultData */ [
            /* composedResult */ '',
            /* composedResultScore */ 0,
            /* lastPartIndex */ 0 ]);

      return composedResultData;
    })
    .filter(function(composedResultData) {
      return !!composedResultData;
    })
    .sort(function(a, b) {
      return b[1] - a[1];
    })
    .forEach(function(composedResultData) {
      var isDuplication = results.some(function(previousResult) {
          return (previousResult[0] === composedResultData[0]);
        });

      if (isDuplication) {
        return;
      }

      // XXX: suggest() not only needs the lastPartIndex but also the last part
      // of the confirmed characters to work.
      results.push([composedResultData[0],
        this.candidateMetadata.saveData(
          this.symbols.length, composedResultData[2])]);
    }.bind(this));

  // ==== PART II: PHRASES THAT MATCHES SYLLABLES PARTIALLY ====
  // List all the terms that exists where it matches the first i symbols.
  var arr, symbolLength;
  var i = expendedEncodedSounds.length;
  while (i--) {
    arr = expendedEncodedSounds.slice(0, i);
    symbolLength = BopomofoEncoder.decode(arr).length;
    if (!arr.length || !storage.getIncompleteMatched(arr)) {
      continue;
    }

    storage.getIncompleteMatched(arr).getResults()
      .forEach(function(result) {
        var isDuplication = results.some(function(previousResult) {
            return (previousResult[0] === result.str);
          });

        if (isDuplication) {
          return;
        }

        var res = [result.str,
          this.candidateMetadata.saveData(symbolLength, result.index)];
        results.push(res);
      }.bind(this));
  }

  // ==== PART III: UNFORTUNATE TYPO ====
  // Lastly, if the first sound doesn't made up a word,
  // show the symbols.
  if (BopomofoEncoder.isCompleted(expendedEncodedSounds[0]) &&
      !storage.getIncompleteMatched([expendedEncodedSounds[0]])) {
    var str = BopomofoEncoder.decode([expendedEncodedSounds[0]]);
    var res = [str, this.candidateMetadata.saveData(str.length, 0)];
    results.push(res);
  }

  this.updateCandidates(results);
  this.sendActionHandled(reqId);
  this.queue.done();

  // Flatten codes array of all compositions for cache cleanning.
  var supersetCodes =
    compositions.reduce(function(supersetCodes, composition) {
      var codes = composition.reduce(function(codes, c) {
        return codes.concat(c);
      }, /* codes */ []);
      return supersetCodes.concat(codes);
    }, /* supersetCodes */ []);

  storage.cleanupCache(supersetCodes);
};
/**
 * Suggest possible phrases after the user had enter a term.
 * @param  {any}    reqId  ID of the request.
 * @this   {object}        JSZhuyin instance.
 */
JSZhuyin.prototype.suggest = function jz_suggest(reqId) {
  this.candidateMetadata.clear();

  if (this.confirmedPartIndex === 0 ||
      !this.SUGGEST_PHRASES) {
    this.updateCandidates([]);
    this.sendActionHandled(reqId);
    this.queue.done();
    return;
  }

  var suggests = [];

  var confirmedCharactersLength = this.confirmedCharacters.length;
  var results = this.storage.getRangeFromContentIndex(this.confirmedPartIndex);
  results.forEach(function each_suggest(dataPack) {
    var dataPackResults =
      dataPack.getResultsBeginsWith(this.confirmedCharacters);
    dataPackResults.forEach(function each_result(dataPackResult) {
      // Don't push duplicate entries.
      var found = suggests.some(function finddup(suggest) {
        return (dataPackResult.str === suggest.str);
      });

      if (!found) {
        suggests.push(dataPackResult);
      }
    });
  }.bind(this));

  var candidates = [];
  suggests.sort(function sort_suggests(a, b) {
    return b.score - a.score;
  }).forEach(function each_suggests(suggests) {
    candidates.push([
      suggests.str.substr(confirmedCharactersLength),
      this.candidateMetadata.NULL_ID]);
  }, this);

  this.updateCandidates(candidates);
  this.sendActionHandled(reqId);
  this.queue.done();
};
/**
 * Update composition by call the oncompositionupdate callback.
 * You should not call this method directly.
 * @param  {any}    reqId  ID of the request.
 * @this   {object}        JSZhuyin instance.
 */
JSZhuyin.prototype.updateComposition = function jz_updateComposition(reqId) {
  if (typeof this.oncompositionupdate === 'function') {
    this.oncompositionupdate(this.symbols, reqId);
  }
};
/**
 * Update the candidate with query results.
 * You should not call this method directly.
 * @param  {array}  results  The result array.
 * @param  {any}    reqId    ID of the request.
 * @this   {object}          JSZhuyin instance.
 */
JSZhuyin.prototype.updateCandidates = function jz_updateCandidates(results,
                                                                      reqId) {
  this.defaultCandidate = results[0];

  if (typeof this.oncandidateschange === 'function') {
    this.oncandidateschange(results, reqId);
  }
};
/**
 * Confirm a selection by calling the compositionend callback and run
 * the query again.
 * You should not call this method directly.
 * @param  {object} candidate One of the candidate that was sent via
 *                            oncandidateschange callback.
 * @param  {any}    reqId     ID of the request.
 * @this   {object}           JSZhuyin instance.
 */
JSZhuyin.prototype.confirmCandidate = function jz_confirmCandidate(candidate,
                                                                   reqId) {
  if (typeof this.oncompositionend === 'function') {
    this.oncompositionend(candidate[0], reqId);
  }

  this.confirmedCharacters = candidate[0];

  var metadata = this.candidateMetadata.getData(candidate[1]);

  this.confirmedPartIndex = metadata[1];
  this.symbols = this.symbols.substr(metadata[0]);
  this.updateComposition(reqId);

  if (this.symbols.length !== 0) {
    this.query(reqId);
  } else {
    this.suggest(reqId);
  }
};
/**
 * Call the onactionhandled callback.
 * You should not call this method directly.
 * @param  {any}    reqId    ID of the request.
 * @this   {object}          JSZhuyin instance.
 */
JSZhuyin.prototype.sendActionHandled = function jz_sendActionHandled(reqId) {
  if (typeof this.onactionhandled === 'function') {
    this.onactionhandled(reqId);
  }
};

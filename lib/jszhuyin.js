'use strict';

/**
 * A simple key-value store wrapps with JavaScript object.
 * @this   {object}   CacheStore instance.
 */
var CacheStore = function CacheStore() {
  this.data = Object.create(null);
  this.waiting = false;
};
/**
 * set the value of a key.
 * @param  {string} key   Key.
 * @param  {any}    value Value.
 * @this   {object}       CacheStore instance.
 */
CacheStore.prototype.add = function cs_add(key, value) {
  this.data[key] = value;
};
/**
 * get the value of a key.
 * @param  {string} key Key.
 * @return {any}        Value of the key.
 * @this   {object}     CacheStore instance.
 */
CacheStore.prototype.get = function cs_add(key) {
  return this.data[key];
};
/**
 * Clean up the store. Any key that is not a substring of the superset
 * string will have their value removed.
 * @param  {string} supersetStr The superset string.
 * @this   {object}             CacheStore instance.
 */
CacheStore.prototype.cleanup = function cs_add(supersetStr) {
  for (var key in this.data) {
    if (supersetStr.indexOf(key) !== -1)
      continue;

    this.data[key] = undefined;
  }
};

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

/**
 * The main IME logic.
 * @this   {object}   JSZhuyin instance.
 */
var JSZhuyin = function JSZhuyin() {
  this.JSON_FILES = ['words.json', 'phrases.json'];
  this.storage = null;

  this.syllables = '';
  this.defaultCandidate = undefined;
  this.cache = null;
  this.queue = null;
};
/**
 * Limit the length of the syllables in the compositions.
 * @type {number}
 */
JSZhuyin.prototype.MAX_SYLLABLES_LENGTH = 8;
/**
 * String to use as the URL path to the files.
 * @type {string}
 */
JSZhuyin.prototype.JSON_URL = '../data/';
/**
 * Name to use for the database.
 * @type {string}
 */
JSZhuyin.prototype.IDB_NAME = 'JSZhuyin';
/**
 * Version to use for the database.
 * @type {number}
 */
JSZhuyin.prototype.IDB_VERSION = 4;
/**
 * Use IndexedDB when available.
 * @type {boolean}
 */
JSZhuyin.prototype.USE_IDB = true;
/**
 * Run once when the initial chunk of data is available.
 * @type {function}
 */
JSZhuyin.prototype.onpartlyloaded = null;
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
 * Handle a key event.
 * @param  {number} code  charCode of the keyboard event.
 *                        If charCode is 0, you should pass keyCode instead.
 * @param  {any}   reqId  ID of the request.
 * @return {boolean}      Return true if the key will be handled async.
 * @this   {object}       JSZhuyin instance.
 */
JSZhuyin.prototype.handleKeyEvent = function jz_handleKeyEvent(code, reqId) {
  if (!this.queue)
    throw 'JSZhuyin: You need to load() first.';

  if (BopomofoEncoder.isBopomofoSymbol(code)) {
    // We must handle Bopomofo symbols.
    this.queue.queue('keyEvent', code, reqId);

    return true;
  }

  if (this.defaultCandidate || this.syllables) {
    // We must handle all the keys if there are pending symbols or candidates.
    this.queue.queue('keyEvent', code, reqId);

    return true;
  }

  return false;
};

/**
 * Select a candatate. Will be handled in the action queue.
 * @param  {object} candidate One of the candatate that was sent via
 *                            oncandidateschange callback.
 * @param  {any}    reqId     ID of the request.
 * @this   {object}           JSZhuyin instance.
 */
JSZhuyin.prototype.selectCandidate = function jz_selCandi(candidate, reqId) {
  this.queue.queue('candidateSelection', candidate, reqId);
};
/**
 * Load JSZhuyin; loading the database and register callbacks, etc.
 * @this   {object}   JSZhuyin instance.
 */
JSZhuyin.prototype.load = function jz_load() {
  if (this.loaded)
    throw 'Already loaded.';
  this.loaded = true;

  var storage = this.storage = new HybirdStorage();
  storage.IDB_NAME = this.IDB_NAME;
  storage.IDB_VERSION = this.IDB_VERSION;
  storage.JSON_FILES = this.JSON_FILES;
  storage.JSON_URL = this.JSON_URL;
  storage.USE_IDB = this.USE_IDB;

  storage.onerror = this.onerror;
  storage.onload = this.onload;
  storage.onloadend = this.onloadend;
  storage.onpartlyloaded = this.onpartlyloaded;

  this.syllables = '';
  this.defaultCandidate = undefined;
  this.cache = new CacheStore();
  this.queue = new ActionQueue();
  this.queue.handle = this.handle.bind(this);

  storage.load();
};
/**
 * Unload JSZhuyin. Close the database connection and purge things
 * from memory.
 * @this   {object}   JSZhuyin instance.
 */
JSZhuyin.prototype.unload = function jz_unload() {
  if (!this.loaded)
    throw 'Already unloaded.';
  this.loaded = false;

  if (this.storage)
    this.storage.unload();

  this.syllables = '';
  this.storage = null;
  this.defaultCandidate = undefined;
  this.cache = null;
  this.queue.handle = null;
  this.queue = null;

  if (typeof this.onunload === 'function')
    this.onunload();
};
/**
 * Uninstall the database and unload.
 * @this   {object}   JSZhuyin instance.
 */
JSZhuyin.prototype.uninstall = function jz_uninstall() {
  if (!this.storage)
    this.unload();

  var self = this;
  this.storage.deleteDatabase(function jz_dbDeleted() {
    self.unload();
  });
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
  var BOPOMOFO_START = 0x3105;
  var BOPOMOFO_END = 0x3129;
  var BOPOMOFO_TONE_1 = 0x02c9;
  var BOPOMOFO_TONE_2 = 0x02ca;
  var BOPOMOFO_TONE_3 = 0x02c7;
  var BOPOMOFO_TONE_4 = 0x02cb;
  var BOPOMOFO_TONE_5 = 0x02d9;

  switch (type) {
    case 'keyEvent':
      if (BopomofoEncoder.isBopomofoSymbol(data)) {
        // This is a Bopomofo symbol
        this.syllables += String.fromCharCode(data);
        this.updateComposition(reqId);
        this.query(reqId);

        break;
      }

      switch (data) {
        case 0x08: // Backspace key
          if (this.syllables.length === 0) {
            throw 'Backspace key is in the action queue, ' +
            ' but there is no symbols in the compositions to be deleted.';
          }

          this.syllables = this.syllables.substr(0, this.syllables.length - 1);
          this.updateComposition(reqId);
          this.query(reqId);

          break;

        case 0x0d: // Enter key
          if (!this.defaultCandidate) {
            throw 'Return key is in the action queue, ' +
            ' but there is no candidate available to confirm.';
          }

          this.confirmCandidate(this.defaultCandidate, reqId);

          break;

        case 0x1b: // Escape key
          this.syllables = '';
          this.updateComposition(reqId);
          this.query(reqId);

          break;

        default:   // All other keys
          var str = this.defaultCandidate[0] + String.fromCharCode(data);
          var count = this.defaultCandidate[1];
          this.confirmCandidate([str, count], reqId);

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
 * Run the query against the current syllables.
 * You should not call this method directly.
 * @param  {any}    reqId  ID of the request.
 * @this   {object}        JSZhuyin instance.
 */
JSZhuyin.prototype.query = function jz_query(reqId) {
  if (this.syllables.length === 0) {
    this.updateCandidates([]);
    this.sendActionHandled(reqId);
    this.queue.done();

    return;
  }

  // Encode the string into Bopomofo encoded string where
  // one character represents a syllables.
  var encodedStr = BopomofoEncoder.encode(this.syllables);

  if (encodedStr.length > this.MAX_SYLLABLES_LENGTH) {
    this.confirmCandidate(this.firstMatchedPhrase, reqId);

    return;
  }

  // Get all posibility compositions of a given natural number.
  // There will be 2^(n-1) items in the compositions array.
  // See http://en.wikipedia.org/wiki/Composition_(number_theory)#Examples
  // also http://stackoverflow.com/questions/8375439
  var compositions = [];
  var x, a, j, n = encodedStr.length;
  x = 1 << n - 1;
  while (x--) {
    a = [1];
    j = 0;
    while (n - 1 > j) {
      if (x & (1 << j)) {
        a[a.length - 1]++;
      } else {
        a.push(1);
      }
      j++;
    }
    compositions.push(a);
  }

  // Figure out all the strings we need to query
  var keysToGet = [];
  for (var i = 0; i < compositions.length; i++) {
    var composition = compositions[i];
    var start = 0;
    for (var j = 0; j < composition.length; j++) {
      var n = composition[j];
      var str = encodedStr.substr(start, n);
      if (keysToGet.indexOf(str) === -1 && !this.cache.get(str))
        keysToGet.push(encodedStr.substr(start, n));

      start += n;
    }
  }

  // Get all the results in one transaction.
  // When of the results returns, pass them to
  // this.finishQuery() to compose a result.
  var count = keysToGet.length;
  if (count === 0) {
    // We have all the data in cache;
    this.cache.cleanup(encodedStr);
    this.finishQuery(encodedStr, compositions, reqId);

    return;
  }

  var txn = this.storage.getTxn();
  var self = this;
  keysToGet.forEach(function getTermFromStorage(key) {
    self.storage.get(key, function gotTerm(result) {
      self.cache.add(key, result);
      count--;

      if (count)
        return;

      self.cache.cleanup(encodedStr);
      self.finishQuery(encodedStr, compositions, reqId);
    }, txn);
  });
};
/**
 * Contiuning the query() call, after getting all the results
 * from storage to cache.
 * You should not call this method directly.
 * @param  {string} encodedStr   The encoded Bopomofo syllables.
 * @param  {array}  compositions The array representing all possible ways
 *                               to split the Bopomofo syllables.
 * @param  {any}    reqId        ID of the request.
 * @this   {object}              JSZhuyin instance.
 */
JSZhuyin.prototype.finishQuery = function jz_finishQuery(encodedStr,
                                                            compositions,
                                                            reqId) {
  var results = [];
  var firstMatchedPhrase;
  var cache = this.cache;

  // ==== PART I: PHRASES ====
  // List all the choices if the entire query happens to match to
  // phrases.
  if (cache.get(encodedStr)) {
    var terms = cache.get(encodedStr);
    var length = encodedStr.length;
    for (var i = 0; i < terms.length; i++) {
      var res = [terms[i][0], length];
      if (!firstMatchedPhrase) {
        firstMatchedPhrase = res;
      }
      results.push(res);
    }
  }

  // ==== PART II: COMPOSED RESULTS ====
  // Compose results with all the terms we could find.
  var composedResults = [];
  nextComposition: for (var i = 0; i < compositions.length; i++) {
    var composition = compositions[i];

    // The entire query has been processed by the previous step. Skip.
    if (composition.length === 1)
      continue nextComposition;

    // Compose a result (and it's score) for each of the compositions.
    var composedResult = '';
    var composedResultScore = 0;
    var start = 0;
    for (var j = 0; j < composition.length; j++) {
      var n = composition[j];
      var substr = encodedStr.substr(start, n);
      if (!cache.get(substr) && n > 1) {
        // Skip this compositions if there is no matching phrase.
        continue nextComposition;
      } else if (!cache.get(substr)) {
        // ... but, we don't skip non-matching compositions of
        // a single syllable to show the typo.
        composedResult += BopomofoEncoder.decode(substr);
        composedResultScore += -Infinity;
      } else {
        // concat the term and add the score to the composed result.
        composedResult += cache.get(substr)[0][0];
        composedResultScore += cache.get(substr)[0][1];
      }
      start += n;
    }

    // Avoid give out duplicated result here by checking the result array.
    var found = results.some(function finddup(result) {
      if (result[0] === composedResult)
        return true;
    });
    // ... and the composedResults array.
    if (!found) {
      found = composedResults.some(function finddup(result) {
        if (result[0] === composedResult)
          return true;
      });
    }
    // If nothing is found we are safe to push our own result.
    if (!found)
      composedResults.push([composedResult, composedResultScore]);
  }
  // Sort the results.
  composedResults = composedResults.sort(function sortComposedResults(a, b) {
    return b[1] - a[1];
  });
  // Push the result into the array.
  var length = encodedStr.length;
  for (var i = 0; i < composedResults.length; i++) {
    results.push([composedResults[i][0], length]);
  }
  // This is not really helpful for gc but we do this here to mark the end
  // of composition calculation.
  composedResults = undefined;

  // ==== PART III: PHRASES THAT MATCHES SYLLABLES PARTIALLY ====
  // List all the terms that exists where it matches the first i syllables.
  var i = encodedStr.length;
  while (i--) {
    var substr = encodedStr.substr(0, i);
    if (!cache.get(substr))
      continue;

    for (var j = 0; j < cache.get(substr).length; j++) {
      var res = [cache.get(substr)[j][0], i];
      if (!firstMatchedPhrase) {
        firstMatchedPhrase = res;
      }
      results.push(res);
    }
  }

  // ==== PART IV: UNFORTUNATE TYPO ====
  // Lastly, if the first syllable doesn't made up a word,
  // show the symbols.
  if (!cache.get(encodedStr[0])) {
    var res = [BopomofoEncoder.decode(encodedStr[0]), 1];
    if (!firstMatchedPhrase) {
      firstMatchedPhrase = res;
    }
    results.push(res);
  }

  this.firstMatchedPhrase = firstMatchedPhrase;
  this.updateCandidates(results);
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
  if (typeof this.oncompositionupdate === 'function')
    this.oncompositionupdate(this.syllables, reqId);
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

  if (typeof this.oncandidateschange === 'function')
    this.oncandidateschange(results, reqId);
};
/**
 * Confirm a selection by calling the compositionend callback and run
 * the query again.
 * You should not call this method directly.
 * @param  {object} candidate One of the candatate that was sent via
 *                            oncandidateschange callback.
 * @param  {any}    reqId     ID of the request.
 * @this   {object}           JSZhuyin instance.
 */
JSZhuyin.prototype.confirmCandidate = function jz_confirmCandidate(candidate,
                                                                   reqId) {
  if (typeof this.oncompositionend === 'function')
    this.oncompositionend(candidate[0], reqId);

  this.syllables = BopomofoEncoder.decode(
    BopomofoEncoder.encode(this.syllables).substr(candidate[1]));
  this.updateComposition(reqId);
  this.query(reqId);
};
/**
 * Call the onactionhandled callback.
 * You should not call this method directly.
 * @param  {any}    reqId    ID of the request.
 * @this   {object}          JSZhuyin instance.
 */
JSZhuyin.prototype.sendActionHandled = function jz_sendActionHandled(reqId) {
  if (typeof this.onactionhandled === 'function')
    this.onactionhandled(reqId);
};

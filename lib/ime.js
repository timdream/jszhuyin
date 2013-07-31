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
 * @this   {object}   JSZhuyinIME instance.
 */
var JSZhuyinIME = function JSZhuyinIME() {
  this.JSON_FILES = ['words.json', 'phrases.json'];
  this.storage = null;

  this.syllables = '';
  this.defaultCandidate = undefined;
  this.cache = null;
  this.queue = null;
};
/**
 * String to use as the URL path to the files.
 * @type {string}
 */
JSZhuyinIME.prototype.JSON_URL = '../data/';
/**
 * Name to use for the database.
 * @type {string}
 */
JSZhuyinIME.prototype.IDB_NAME = 'JSZhuyin';
/**
 * Version to use for the database.
 * @type {number}
 */
JSZhuyinIME.prototype.IDB_VERSION = 4;
/**
 * Use IndexedDB when available.
 * @type {boolean}
 */
JSZhuyinIME.prototype.USE_IDB = true;
/**
 * Run once when the initial chunk of data is available.
 * @type {function}
 */
JSZhuyinIME.prototype.onpartlyloaded = null;
/**
 * Run when the loading is complete.
 * @type {function}
 */
JSZhuyinIME.prototype.onloadend = null;
/**
 * Run when loading is successful.
 * @type {function}
 */
JSZhuyinIME.prototype.onload = null;
/**
 * Run when unload.
 * @type {function}
 */
JSZhuyinIME.prototype.onunload = null;
/**
 * Run when error occours.
 * @type {function}
 */
JSZhuyinIME.prototype.onerror = null;
/**
 * Run when an action is handled; receives reqId passed to the functions.
 * @type {function}
 */
JSZhuyinIME.prototype.onactionhandled = null;
/**
 * Callback to call when the composition updates.
 * @type {function}
 */
JSZhuyinIME.prototype.oncompositionupdate = null;
/**
 * Callback to call when the composition ends.
 * @type {function}
 */
JSZhuyinIME.prototype.oncompositionend = null;
/**
 * Callback to call when candidate menu updates.
 * @type {function}
 */
JSZhuyinIME.prototype.oncandidateupdate = null;
/**
 * Ask JSZhyinIME to handle a certain action.
 * @param  {emum}   type   One of the TYPE_* constant.
 * @param  {any}    data   Data to handle for the action.
 * @param  {any}    reqId  ID of the request.
 * @this   {object}        JSZhuyinIME instance.
 */
JSZhuyinIME.prototype.handleAction =
  function ji_handleAction(type, data, reqId) {
    if (!this.queue)
      throw 'JSZhuyinIME: You need to load() first.';

    this.queue.queue.apply(this.queue, arguments);
  };
/**
 * Add another Bopomofo symbol into the composition.
 * @type {Number}
 */
JSZhuyinIME.prototype.TYPE_INPUT_SYMBOL = 1;
/**
 * Do a special action.
 * The data passed to handleAction() should be one of the SPECIAL_* constant.
 * @type {Number}
 */
JSZhuyinIME.prototype.TYPE_INPUT_SPECIAL = 2;
/**
 * Respond to user selection of a candidate.
 * @type {Number}
 */
JSZhuyinIME.prototype.TYPE_CANDIDATE_SELECTION = 3;
/**
 * Remove the last symbol from the compositions.
 * @type {Number}
 */
JSZhuyinIME.prototype.SPECIAL_BACK_SPACE = 0x08;
/**
 * Respond to user pressing the 'enter' key.
 * @type {Number}
 */
JSZhuyinIME.prototype.SPECIAL_RETURN = 0x0d;
/**
 * Respond to user pressing the 'escape' key.
 * @type {Number}
 */
JSZhuyinIME.prototype.SPECIAL_ESCAPE = 0x1b;
/**
 * Uninstall ourselve and remove the presistent database.
 * @type {Number}
 */
JSZhuyinIME.prototype.SPECIAL_UNINSTALL = 0x2421;
/**
 * Actual function to handle the action.
 * Do not call this function directly; queue the action in
 * handleAction() instead.
 * @param  {emum}   type   One of the TYPE_* constant.
 * @param  {any}    data   Data to handle for the action.
 * @param  {any}    reqId  ID of the request.
 * @this   {object}        JSZhuyinIME instance.
 */
JSZhuyinIME.prototype.handle = function ji_handle(type, data, reqId) {
  switch (type) {
    case this.TYPE_INPUT_SYMBOL:
      this.syllables += data;
      this.updateComposition(reqId);
      this.query(reqId);

      break;

    case this.TYPE_INPUT_SPECIAL:
      switch (data) {
        case this.SPECIAL_ESCAPE:
          this.syllables = '';
          this.updateComposition(reqId);
          this.query(reqId);

          break;

        case this.SPECIAL_BACK_SPACE:
          if (this.syllables.length === 0) {
            throw 'Backspace key should not be sent to ' +
              'JSZhuyinIME at this point.';
          }

          this.syllables = this.syllables.substr(0, this.syllables.length - 1);
          this.updateComposition(reqId);
          this.query(reqId);

          break;

        case this.SPECIAL_RETURN:
          if (!this.defaultCandidate) {
            throw 'Return key should not be sent to JSZhuyinIME at this point.';
          }

          this.confirmSelection(this.defaultCandidate, reqId);

          break;

        case this.SPECIAL_UNINSTALL:
          if (this.storage) {
            var self = this;
            this.storage.deleteDatabase(function ji_dbDeleted() {
              self.unload();
              self.sendActionHandled(reqId);
            });
          }

          break;

        default:
          throw 'Unknown special input: ' + data;
      }

      break;

    case this.TYPE_CANDIDATE_SELECTION:
      this.confirmSelection(data, reqId);

      break;

    default:
      throw 'Unknown action type: ' + type;
  }
};
/**
 * Load JSZhuyinIME; loading the database and register callbacks, etc.
 * @this   {object}   JSZhuyinIME instance.
 */
JSZhuyinIME.prototype.load = function ji_load() {
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
 * Unload JSZhuyinIME. Close the database connection and purge things
 * from memory.
 * @this   {object}   JSZhuyinIME instance.
 */
JSZhuyinIME.prototype.unload = function ji_unload() {
  if (this.storage)
    this.storage.unload();

  this.syllables = '';
  this.storage = null;
  this.defaultCandidate = undefined;
  this.cache = null;
  this.queue = null;

  if (typeof this.onunload === 'function')
    this.onunload();
};
/**
 * Run the query against the current syllables.
 * @this   {object}   JSZhuyinIME instance.
 */
JSZhuyinIME.prototype.query = function ji_query(reqId) {
  if (this.syllables.length === 0) {
    this.updateSelections([]);
    this.sendActionHandled(reqId);
    this.queue.done();

    return;
  }

  // Encode the string into Bopomofo encoded string where
  // one character represents a syllables.
  var encodedStr = BopomofoEncoder.encode(this.syllables);

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
 * @param  {string} encodedStr   The encoded Bopomofo syllables.
 * @param  {array}  compositions The array representing all possible ways
 *                               to split the Bopomofo syllables.
 * @this   {object}              JSZhuyinIME instance.
 */
JSZhuyinIME.prototype.finishQuery = function ji_finishQuery(encodedStr,
                                                            compositions,
                                                            reqId) {
  var results = [];
  var cache = this.cache;

  // ==== PART I: PHRASES ====
  // List all the choices if the entire query happens to match to
  // phrases.
  if (cache.get(encodedStr)) {
    var terms = cache.get(encodedStr);
    var length = encodedStr.length;
    for (var i = 0; i < terms.length; i++) {
      results.push([terms[i][0], length]);
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
      results.push([cache.get(substr)[j][0], i]);
    }
  }

  // ==== PART IV: UNFORTUNATE TYPO ====
  // Lastly, if the first syllable doesn't made up a word,
  // show the symbols.
  if (!cache.get(encodedStr[0])) {
    results.push([BopomofoEncoder.decode(encodedStr[0]), 1]);
  }

  this.updateSelections(results);
  this.sendActionHandled(reqId);
  this.queue.done();
};
/**
 * Update composition by call the oncompositionupdate()
 * @this   {object}   JSZhuyinIME instance.
 */
JSZhuyinIME.prototype.updateComposition = function ji_updateComposition(reqId) {
  if (typeof this.oncompositionupdate === 'function')
    this.oncompositionupdate(this.syllables, reqId);
};
/**
 * Update the candidate with query results.
 * @param {array} results The result array.
 * @this   {object}   JSZhuyinIME instance.
 */
JSZhuyinIME.prototype.updateSelections = function ji_updateSelections(results,
                                                                      reqId) {
  this.defaultCandidate = results[0];

  if (typeof this.oncandidateupdate === 'function')
    this.oncandidateupdate(results, reqId);
};
/**
 * Confirm a selection by calling the compositionend callback and run
 * the query again.
 * @param  {array}  sel The selection array. Should be one of the element in
 *                      in the result array.
 * @this   {object}     JSZhuyinIME instance.
 */
JSZhuyinIME.prototype.confirmSelection = function ji_confirmSelection(sel,
                                                                      reqId) {
  if (typeof this.oncompositionend === 'function')
    this.oncompositionend(sel[0], reqId);

  this.syllables = BopomofoEncoder.decode(
    BopomofoEncoder.encode(this.syllables).substr(sel[1]));
  this.updateComposition(reqId);
  this.query(reqId);
};
JSZhuyinIME.prototype.sendActionHandled = function ji_sendActionHandled(reqId) {
  if (typeof this.onactionhandled === 'function')
    this.onactionhandled(reqId);
};

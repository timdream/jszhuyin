'use strict';

var CacheStore = function CacheStore() {
  this.data = {};
};
CacheStore.prototype = new CacheStore();
CacheStore.prototype.add = function cs_add(key, values) {
  this.data[key] = values;
};
CacheStore.prototype.get = function cs_add(key) {
  return this.data[key];
};
CacheStore.prototype.cleanup = function cs_add(supersetStr) {
  for (var key in this.data) {
    if (supersetStr.indexOf(key) !== -1)
      continue;

    this.data[key] = undefined;
  }
};

var ActionQueue = function ActionQueue() {
  this.pendingActions = [];
  this.waiting = false;
};
ActionQueue.prototype.handle = null;
ActionQueue.prototype.queue = function aq_queue() {
  if (this.waiting) {
    this.pendingActions.push(arguments);
    return;
  }

  this.waiting = true;
  this.handle.apply(this, arguments);
};
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

var JSZhuyinIME = function JSZhuyinIME() {
  this.JSON_FILES = ['words.json', 'phrases.json'];
  this.storage = null;

  this.syllables = '';
  this.defaultCandidate = undefined;
  this.cache = null;
  this.queue = null;
};
JSZhuyinIME.prototype.JSON_URL = './';
JSZhuyinIME.prototype.IDB_NAME = 'JSZhuyin';
JSZhuyinIME.prototype.IDB_VERSION = 4;
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
 * Run when error occours.
 * @type {function}
 */
JSZhuyinIME.prototype.onerror = null;

JSZhuyinIME.prototype.oncompositionupdate = null;
JSZhuyinIME.prototype.oncompositionend = null;
JSZhuyinIME.prototype.oncandidateupdate = null;
JSZhuyinIME.prototype.handleAction = function ji_handleAction() {
  if (!this.queue)
    throw 'JSZhiyinIME: You need to load() first.';

  this.queue.queue.apply(this, arguments);
};
JSZhuyinIME.prototype.INPUT_SYMBOL = 1;
JSZhuyinIME.prototype.INPUT_SPECIAL = 2;
JSZhuyinIME.prototype.CANDIDATE_SELECTION = 3;
JSZhuyinIME.prototype.SPECIAL_BACK_SPACE = 0x08;
JSZhuyinIME.prototype.SPECIAL_RETURN = 0x0d;
JSZhuyinIME.prototype.SPECIAL_ESCAPE = 0x1b;
JSZhuyinIME.prototype.SPECIAL_UNINSTALL = 0x2421;
JSZhuyinIME.prototype.handle = function ji_handle(type, data) {
  switch (type) {
    case this.INPUT_SYMBOL:
      this.syllables += data;
      this.query();

      break;

    case this.INPUT_SPECIAL:
      switch (data) {
        case this.SPECIAL_ESCAPE:
          this.syllables = '';
          this.query();

          break;

        case this.SPECIAL_BACK_SPACE:
          if (this.syllable.length === 0) {
            throw 'Backspace key should not be sent to ' +
              'JSZhuyinIME at this point.';
          }

          this.syllables = this.syllables.substr(0, this.syllables.length - 1);
          this.query();

          break;

        case this.SPECIAL_RETURN:
          if (!this.defaultCandidate) {
            throw 'Return key should not be sent to JSZhuyinIME at this point.';
          }

          this.confirmSelection(this.defaultCandidate);
          this.queue.done();

          break;

        case this.SPECIAL_UNINSTALL:
          if (this.storage) {
            this.storage.deleteDatabase();
          }

          break;

        default:
          throw 'Unknown special input: ' + data;
      }

      break;

    case this.CANDIDATE_SELECTION:
      this.confirmSelection(data);
      this.queue.done();

      break;

    default:
      throw 'Unknown action type: ' + type;
  }
};
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
JSZhuyinIME.prototype.unload = function ji_unload() {
  if (this.storage)
    this.storage.unload();

  this.syllables = '';
  this.storage = null;
  this.defaultCandidate = undefined;
  this.cache = null;
  this.queue = null;
};
JSZhuyinIME.prototype.query = function ji_query() {
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
  // this.returnResult() to compose a result.
  var count = keysToGet.length;
  var txn = this.storage.getTxn();
  var self = this;
  keysToGet.forEach(function getTermFromStorage(key) {
    self.storage.get(key, function gotTerm(result) {
      self.cache.add(key, result);
      count--;

      if (count)
        return;

      self.cache.cleanup(encodedStr);
      self.returnResult(encodedStr, compositions);
    }, txn);
  });
};

JSZhuyinIME.prototype.returnResult = function ji_returnResult(encodedStr,
                                                              compositions) {
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
  this.queue.done();
};
JSZhuyinIME.prototype.updateComposition = function ji_updateComposition() {
  if (typeof this.oncandidateupdate === 'function')
    this.oncandidateupdate(this.syllables);
};
JSZhuyinIME.prototype.updateSelections = function ji_updateSelections(results) {
  this.defaultCandidate = results[0];

  if (typeof this.oncandidateupdate === 'function')
    this.oncandidateupdate(results);
};
JSZhuyinIME.prototype.confirmSelection = function ji_confirmSelection(sel) {
  if (typeof this.oncompositionend === 'function')
    this.oncompositionend(sel[0]);

  this.syllables = BopomofoEncoder.decode(
    BopomofoEncoder.encode(this.syllables).substr(sel[1]));
  this.updateComposition();
  this.query();
};

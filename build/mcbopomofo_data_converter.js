'use strict';

var fs = require('fs');
var JSZhuyinDataPack = require('../lib/jszhuyin_data_pack.js');
var DatabaseBuilder = require('../build/database_builder.js');
var McBopomofoLineData = require('../build/mcbopomofo_line_data.js');

var McBopomofoDataConverter = function McBopomofoDataConverter() {
  this.stage = this.STAGE_IDLE;
};

McBopomofoDataConverter.prototype.onprogress = null;

McBopomofoDataConverter.prototype.SHORTCUT_ENTRY_LENGTH = 16;

McBopomofoDataConverter.prototype.STAGE_IDLE = 0;
McBopomofoDataConverter.prototype.STAGE_READING_FILE = 1;
McBopomofoDataConverter.prototype.STAGE_CATEGORIZING_ENTRIES = 2;
McBopomofoDataConverter.prototype.STAGE_SORTING_ENTRIES = 3;
McBopomofoDataConverter.prototype.STAGE_CREATING_BLOB = 4;
McBopomofoDataConverter.prototype.STAGE_WRITING_FILE = 5;

McBopomofoDataConverter.prototype.convert = function(inputPath, outputPath) {
  var lines = this._readFile(inputPath);
  var resultCategories = this._categorizeEntries(lines);
  lines = undefined;

  var db = this._sortingResultAndInsertIntoDB(resultCategories);
  resultCategories = undefined;

  var blob = this._getBlob(db);
  db = null;

  this._writeIntoDisk(outputPath, blob);

  this._reportProgress(this.STAGE_IDLE);
};

McBopomofoDataConverter.prototype._readFile = function(inputPath) {
  this._reportProgress(this.STAGE_READING_FILE);

  var data = fs.readFileSync(inputPath, { encoding: 'utf8' });
  return data.split('\n');
};

McBopomofoDataConverter.prototype._categorizeEntries = function(lines) {
  var length = lines.length;

  var results = {};
  var shortcutResults = {};

  for (var i = 0; i < length; i++) {
    var lineData = new McBopomofoLineData(lines[i]);

    if (!lineData.isValid) {
      continue;
    }

    if ((i % 1000) === 0) {
      this._reportProgress(this.STAGE_CATEGORIZING_ENTRIES, i, length);
    }

    if (!results[lineData.encodedStr]) {
      results[lineData.encodedStr] = [];
    }

    results[lineData.encodedStr].push({
      'str': lineData.str,
      'score': lineData.score
    });

    // We should not process shortcut that is unreachable
    // or identital to the original.
    // (unreachable, e.g. ㄓㄨ reaches 諸, not 中文)
    // XXX: How do we make these shortcuts reachable from UI?
    if (lineData.encodedStr !== lineData.shortcutEncodedStr &&
        lineData.encodedStr.length === lineData.shortcutEncodedStr.length) {
      if (!shortcutResults[lineData.shortcutEncodedStr]) {
        shortcutResults[lineData.shortcutEncodedStr] = [];
      }

      var found = shortcutResults[lineData.shortcutEncodedStr]
        .some(function(obj) {
          return (obj.str === lineData.str);
        });

      if (!found) {
        shortcutResults[lineData.shortcutEncodedStr].push({
          'str': lineData.str,
          'score': lineData.score,
          'symbols': lineData.encodedStr
        });
      }
    }
  }

  return {
    results: results,
    shortcutResults: shortcutResults
  };
};

McBopomofoDataConverter.prototype._sortingResultAndInsertIntoDB =
function _sortingResultAndInsertIntoDB(resultCategories) {
  var db = new DatabaseBuilder();

  var results = resultCategories.results;
  var shortcutResults = resultCategories.shortcutResults;

  this._reportProgress(this.STAGE_SORTING_ENTRIES);

  var encodedStr, result;

  for (encodedStr in results) {
    result = results[encodedStr].sort(
      function(a, b) {
        return (b.score - a.score);
      }
    );

    db.put(encodedStr, (new JSZhuyinDataPack(result)).getPacked());
  }

  for (encodedStr in shortcutResults) {
    result = shortcutResults[encodedStr].sort(
      function(a, b) {
        return (b.score - a.score);
      }
    );

    // Conserve disk space by only save the most frequent words for
    // a single symbol shortcut.
    result = result.slice(0, this.SHORTCUT_ENTRY_LENGTH);

    db.put(encodedStr, (new JSZhuyinDataPack(result)).getPacked());
  }

  return db;
};

McBopomofoDataConverter.prototype._getBlob = function(db) {
  this._reportProgress(this.STAGE_CREATING_BLOB);
  return db.getBlob();
};

McBopomofoDataConverter.prototype._writeIntoDisk = function(outputPath, blob) {
  this._reportProgress(this.STAGE_WRITING_FILE);

  fs.writeFileSync(outputPath, blob);
};

McBopomofoDataConverter.prototype._reportProgress = function(stage) {
  this.stage = stage;
  if (typeof this.onprogress === 'function') {
    this.onprogress.apply(this, arguments);
  }
};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module.exports) {
  module.exports = McBopomofoDataConverter;
}

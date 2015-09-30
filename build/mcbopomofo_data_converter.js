'use strict';

var fs = require('fs');
var JSZhuyinDataPack = require('../lib/jszhuyin_data_pack.js');
var DatabaseBuilder = require('../build/database_builder.js');
var McBopomofoLineData = require('../build/mcbopomofo_line_data.js');
var BopomofoEncoder = require('../lib/bopomofo_encoder.js');

var McBopomofoDataConverter = function McBopomofoDataConverter() {
  this.stage = this.STAGE_IDLE;
  this.longestPhraseLength = false;
};

McBopomofoDataConverter.prototype.onprogress = null;
McBopomofoDataConverter.prototype.onwarning = null;

McBopomofoDataConverter.prototype.SHORTCUT_ENTRY_LENGTH = 16;

McBopomofoDataConverter.prototype.STAGE_IDLE = 0;
McBopomofoDataConverter.prototype.STAGE_READING_FILE = 1;
McBopomofoDataConverter.prototype.STAGE_CATEGORIZING_ENTRIES = 2;
McBopomofoDataConverter.prototype.STAGE_SORTING_ENTRIES = 3;
McBopomofoDataConverter.prototype.STAGE_CREATING_BLOB = 4;
McBopomofoDataConverter.prototype.STAGE_WRITING_FILE = 5;

McBopomofoDataConverter.prototype.LONGEST_PHRASE_LENGTH = 6;

McBopomofoDataConverter.prototype.convert = function(inputPath, outputPath) {
  var lines = this._readFile(inputPath);
  var results = this._categorizeEntries(lines);
  lines = undefined;

  if (this.longestPhraseLength !== this.LONGEST_PHRASE_LENGTH) {
    throw new Error('McBopomofoDataConverter: Expect the longest phrase to ' +
      'be ' + this.LONGEST_PHRASE_LENGTH + ' characters, however ' +
      'it\'s ' + this.longestPhraseLength + ' in the current dataset.');
  }

  var db = this._sortingResultAndInsertIntoDB(results);
  results = undefined;

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

  for (var i = 0; i < length; i++) {
    var lineData = new McBopomofoLineData();
    lineData.onwarning = this.onwarning;
    lineData.parse(lines[i]);

    if (!lineData.isValid) {
      continue;
    }

    this._reportProgress(this.STAGE_CATEGORIZING_ENTRIES, i, length);

    var encodedStr = String.fromCharCode.apply(String, lineData.encodedSounds);
    if (!results[encodedStr]) {
      results[encodedStr] = [];
    }

    if (lineData.str.length > this.longestPhraseLength) {
      this.longestPhraseLength = lineData.str.length;
    }

    results[encodedStr].push({
      'str': lineData.str,
      'score': lineData.score
    });
  }

  return results;
};

McBopomofoDataConverter.prototype._sortingResultAndInsertIntoDB =
function _sortingResultAndInsertIntoDB(results) {
  var db = new DatabaseBuilder();

  var encodedStr, result;
  var i = 0;

  for (encodedStr in results) {
    var encodedSounds = Array.prototype.map.call(encodedStr, function(chr) {
      return chr.charCodeAt(0);
    });

    result = results[encodedStr].sort(function(a, b) {
      this._reportProgress(this.STAGE_SORTING_ENTRIES, i);
      i++;

      if (b.score > a.score) {
        return 1;
      }
      if (b.score < a.score) {
        return -1;
      }
      if (b.str > a.str) {
        return 1;
      }
      if (b.str < a.str) {
        return -1;
      }

      throw new Error('McBopomofoDataConverter: ' +
        'Duplicate entry found for "' +
        BopomofoEncoder.decode(encodedSounds) + '": "' + a.str + '".');
    }.bind(this));

    db.put(encodedSounds, (new JSZhuyinDataPack(result)).getPacked());
  }

  return db;
};

McBopomofoDataConverter.prototype._getBlob = function(db) {
  var i = 0;
  db.onprogress = function() {
    this._reportProgress(this.STAGE_CREATING_BLOB, i);
    i++;
  }.bind(this);
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

'use strict';

var SHORTCUT_ENTRY_LENGTH = 16;

var fs = require('fs');
var BopomofoEncoder = require('../lib/bopomofo_encoder.js');
var JSZhuyinDataPack = require('../lib/jszhuyin_data_pack.js');
var BlobStoreBuilder = require('../build/database_builder.js');
var McBopomofoDataParser = require('../build/mcbopomofo_data_parser.js');

module['exports'] = function convertData(filename, output, callback) {
  fs.readFile(filename, { encoding: 'utf8' }, function read(err, data) {
    if (err)
      throw err;

    var results = {};

    var shortcutResults = {};

    var lines = data.split('\n');
    data = undefined;
    console.log('Processing ' + lines.length + ' entries in the directory...');

    var db = new BlobStoreBuilder();

    var length = lines.length;
    for (var i = 0; i < length; i++) {
      var lineData = McBopomofoDataParser.parse(lines[i]);

      if (!lineData)
        continue;

      if (!(i % 1000)) {
        process.stdout.write(i + '... ');
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

        var found = shortcutResults[lineData.shortcutEncodedStr].some(function(obj) {
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
    lines = undefined;
    console.log('Done.');

    console.log('Sorting entries ...');

    for (var encodedStr in results) {
      var result = results[encodedStr].sort(
        function(a, b) {
          return (b.score - a.score);
        }
      );

      db.put(encodedStr, (new JSZhuyinDataPack(result)).getPacked());
    }

    for (var encodedStr in shortcutResults) {
      var result = shortcutResults[encodedStr].sort(
        function(a, b) {
          return (b.score - a.score);
        }
      );

      // Conserve disk space by only save the most frequent words for
      // a single symbol shortcut.
      result = result.slice(0, SHORTCUT_ENTRY_LENGTH);

      db.put(encodedStr, (new JSZhuyinDataPack(result)).getPacked());
    }

    console.log('Creating binary database file ...');
    var blob = db.getBlob();

    console.log('Writing file to disk ...');
    fs.writeFile(output, blob,
      function written(err) {
        if (err)
          throw err;

        console.log('Done!');
        if (callback)
          callback();
      }
    );
  });
};

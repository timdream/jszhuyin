'use strict';

var SHORTCUT_ENTRY_LENGTH = 16;

var fs = require('fs');
var BopomofoEncoder = require('../lib/bopomofo_encoder.js');
var JSZhuyinDataPack = require('../lib/jszhuyin_data_pack.js');

module['exports'] = function convertData(filename, outputDir, callback) {
  fs.readFile(filename, { encoding: 'utf8' }, function read(err, data) {
    if (err)
      throw err;

    // This regexp adds the first tone to data given by McBopomofo.
    var regexp = new RegExp('([^' +
      String.fromCharCode(BopomofoEncoder.BOPOMOFO_TONE_2,
                          BopomofoEncoder.BOPOMOFO_TONE_3,
                          BopomofoEncoder.BOPOMOFO_TONE_4,
                          BopomofoEncoder.BOPOMOFO_TONE_5) +
      '])(\-|$)', 'g');

    var replaceStr = '$1' +
      String.fromCharCode(BopomofoEncoder.BOPOMOFO_TONE_1) + '$2';

    var results = {
      'words': {},
      'phrases': {},
      'more': {},
      'shortcuts': {},
      'shortcuts-more': {}
    };

    var lines = data.split('\n');
    data = undefined;

    console.log('Processing ' + lines.length + ' entries in the directory...');

    var length = lines.length;
    for (var i = 0; i < length; i++) {
      if (!lines[i])
        continue;

      var row = lines[i].split(' ');

      if (!(i % 1000)) {
        process.stdout.write(i + '... ');
      }

      if (row[1].indexOf('_punctuation_') !== -1)
        continue;

      var symbols = row[1].replace(regexp, replaceStr);

      var encodedStr = BopomofoEncoder.encode(symbols.replace(/\-/g, ''));
      var shortcutEncodedStr = BopomofoEncoder.encode((function() {
        return symbols.split('-').map(function(str) {
          return str[0];
        }).join('');
      }()));

      var resultObj;
      var shortcutResultObj;
      switch (encodedStr.length) {
        case 1:
          resultObj = results['words'];
          shortcutResultObj = results['shortcuts'];
          break;

        case 2:
          resultObj = results['phrases'];
          shortcutResultObj = results['shortcuts'];
          break;

        default:
          resultObj = results['more'];
          shortcutResultObj = results['shortcuts-more'];
          break;
      }

      if (!resultObj[encodedStr]) {
        resultObj[encodedStr] = [];
      }

      resultObj[encodedStr].push(
        { 'str': row[0], 'score': parseFloat(row[2]) });

      // We should not process shortcut that is unreachable
      // or identital to the original.
      // (unreachable, e.g. ㄓㄨ reaches 諸, not 中文)
      // XXX: How do we make these shortcuts reachable from UI?
      if (encodedStr !== shortcutEncodedStr &&
          encodedStr.length === shortcutEncodedStr.length) {
        if (!shortcutResultObj[shortcutEncodedStr]) {
          shortcutResultObj[shortcutEncodedStr] = [];
        }

        var found = shortcutResultObj[shortcutEncodedStr].some(function(obj) {
          if (obj.str === row[0]) {
            return true;
          }
          return false;
        });

        if (!found) {
          shortcutResultObj[shortcutEncodedStr].push(
            { 'str': row[0], 'score': parseFloat(row[2]) });
        }
      }
    }

    console.log('Done.');
    lines = undefined;

    var outputFilename = Object.keys(results);

    var putResult = function putResult() {
      var filename = outputFilename.shift();

      if (!filename) {
        callback();

        return;
      }

      console.log('Sorting and saving entries (' + filename + ')...');

      var result = results[filename];
      for (encodedStr in result) {
        result[encodedStr] = result[encodedStr].sort(
          function(a, b) {
            return (b.score - a.score);
          }
        );

        // Conserve disk space by only save the most frequent words for
        // a single symbol shortcut.
        if (encodedStr.length === 1 && filename.substr(0, 9) === 'shortcuts') {
          result[encodedStr] =
            result[encodedStr].slice(0, SHORTCUT_ENTRY_LENGTH);
        }

        result[encodedStr] = new JSZhuyinDataPack(result[encodedStr]);
      }

      fs.writeFile(
        outputDir + '/' + filename + '.json',
        JSON.stringify(result, null, ' '),
        function written(err) {
          if (err)
            throw err;

          putResult();
        });
    };

    putResult();
  });
};

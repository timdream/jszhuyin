'use strict';

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

    var results = [undefined, {}, {}, {}];

    var lines = data.split('\n');
    data = undefined;

    console.log('Processing ' + lines.length + ' entries in the directory...');

    var length = lines.length;
    for(var i = 0; i < length; i++) {
      if (!lines[i])
        continue;

      var row = lines[i].split(' ');

      if (!(i % 1000)) {
        process.stdout.write(i + '... ');
      }

      if (row[1].indexOf('_punctuation_') !== -1)
        continue;

      var encodedStr = BopomofoEncoder.encode(
        row[1].replace(regexp, replaceStr).replace(/\-/g, ''));

      var resultObj;
      switch (encodedStr.length) {
        case 1:
          resultObj = results[1];
          break;

        case 2:
          resultObj = results[2];
          break;

        default:
          resultObj = results[3];
          break;
      }

      if (!resultObj[encodedStr]) {
        resultObj[encodedStr] = [];
      }

      resultObj[encodedStr].push(
        { 'str': row[0], 'score': parseFloat(row[2]) });
    }

    console.log('Done.');
    lines = undefined;

    var i = 0;
    results.shift();

    var names = [undefined, 'words', 'phrases', 'more'];

    var putResult = function putResult() {
      i++;
      var result = results.shift();

      if (!result && !results.length) {
        callback();

        return;
      }

      console.log('Sorting and saving entries (' + names[i] + ')...');

      for (encodedStr in result) {
        result[encodedStr] = result[encodedStr].sort(
          function(a, b) {
            return (b.score - a.score);
          }
        );
        result[encodedStr] = new JSZhuyinDataPack(result[encodedStr]);
      }

      fs.writeFile(
        outputDir + '/' + names[i] + '.json',
        JSON.stringify(result).replace(/,/g, ',\n'),
        function written(err) {
          if (err)
            throw err;

          putResult();
        });
    };

    putResult();
  });
};

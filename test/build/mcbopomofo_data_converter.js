'use strict';

var fs = require('fs');
var os = require('os');

var assert = require('assert');
var utils = require('../util.js');

var McBopomofoDataConverter =
  require('../../build/mcbopomofo_data_converter.js');

test('testdata.txt', function() {
  var outputPath =
    os.tmpdir() + '/' + Math.random().toString(32).substr(2) + '.data';

  var converter = new McBopomofoDataConverter();
  converter.convert(__dirname + '/../resources/testdata.txt',
    outputPath);

  var actualBuffer = fs.readFileSync(outputPath);
  var expectedBuffer =
    fs.readFileSync(__dirname + '/../resources/testdata.data');

  assert.deepEqual(
    utils.bufferToArray(actualBuffer),
    utils.bufferToArray(expectedBuffer));
});

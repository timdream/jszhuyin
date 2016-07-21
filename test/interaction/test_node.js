'use strict';

// This file should be loaded in Mocha, with QUnit UI

const fs = require('fs');
const manifest = require('./manifest.json');
const TaskRunner = require('../task_runner.js').TaskRunner;
const JSZhuyin = require('../../lib/jszhuyin.js').JSZhuyin;
const testdataBuffer =
  new Uint8Array(fs.readFileSync(__dirname + '/../resources/testdata.data'))
  .buffer;

suite('JSZhuyin interaction tests');

manifest.forEach(function(fileDesc) {
  var TaskTest = require('./tests/' + fileDesc.filename).TaskTest;

  test(TaskTest.NAME, function() {
    var taskTest = new TaskTest();

    var jszhuyin = new JSZhuyin();
    jszhuyin.DATA_ARRAY_BUFFER = testdataBuffer;
    for (var key in taskTest.config) {
      jszhuyin[key] = taskTest.config[key];
    }
    jszhuyin.load();
    var runner = new TaskRunner(jszhuyin);
    runner.run(taskTest);
  });
});

'use strict';

/* global JSZhuyin, JSZhuyinClient, JSZhuyinServerWorkerLoader,
          JSZhuyinServerIframeLoader,
          TaskRunner, arrayToUint16LEArrayBuffer, testdataResArray */

// This runs the interaction tests against QUnit 1.x
// Eventually we should be using Mocha and TDD UI.

(function() {

var WebTestsLoader = function() {
};

WebTestsLoader.prototype = {
  isDone: false,

  load: function() {
    this._getTestManifest();
  },

  _getTestManifest: function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', './interaction/manifest.json');
    xhr.send();
    xhr.onloadend = function() {
      this._loadAllTests(JSON.parse(xhr.responseText));
    }.bind(this);
  },

  _loadAllTests: function(manifest) {
    var taskTests = [];

    var loadNextTest = function() {
      var fileDesc = manifest.shift();
      if (!fileDesc) {
        this._setupTests(taskTests);
        return;
      }

      var el = document.createElement('script');
      el.src = './interaction/tests/' + fileDesc.filename;
      el.onload = function() {
        var TaskTest = window.TaskTest;
        window.TaskTest = null;
        taskTests.push(TaskTest);
        loadNextTest();
      };
      document.body.appendChild(el);

    }.bind(this);

    loadNextTest();
  },

  _setupTests: function(taskTests) {
    module('JSZhuyin interaction tests');

    var testdataBuffer = arrayToUint16LEArrayBuffer(testdataResArray);

    taskTests.forEach(function(TaskTest) {
      test(TaskTest.NAME, function() {
        stop();
        ok(true, TaskTest.NAME); // :'(

        var jszhuyin = new JSZhuyin();
        jszhuyin.DATA_ARRAY_BUFFER = testdataBuffer;
        jszhuyin.load();
        var runner = new TaskRunner(jszhuyin);
        runner.ondone = start;
        var taskTest = new TaskTest();
        runner.run(taskTest);
      });
    });

    module('JSZhuyinClient/WorkerLoader interaction tests');
    taskTests.forEach(function(TaskTest) {
      test(TaskTest.NAME, function() {
        stop();
        ok(true, TaskTest.NAME); // :'(

        var jszhuyin = new JSZhuyinClient();
        jszhuyin.onloadend = function() {
          var runner = new TaskRunner(jszhuyin);
          runner.ondone = start;
          var taskTest = new TaskTest();
          runner.run(taskTest);
        };
        jszhuyin.load(
          new JSZhuyinServerWorkerLoader('../lib/worker.js'),
          { dataURL: '../test/resources/testdata.data' });
      });
    });

    module('JSZhuyinClient/IframeLoader interaction tests');
    taskTests.forEach(function(TaskTest) {
      test(TaskTest.NAME, function() {
        stop();
        ok(true, TaskTest.NAME); // :'(

        var jszhuyin = new JSZhuyinClient();
        jszhuyin.onloadend = function() {
          var runner = new TaskRunner(jszhuyin);
          runner.ondone = start;
          var taskTest = new TaskTest();
          runner.run(taskTest);
        };
        jszhuyin.load(
          new JSZhuyinServerIframeLoader('../lib/frame.html'),
          { dataURL: '../test/resources/testdata.data' });
      });
    });

    this.isDone = true;
    if (typeof this.ondone === 'function') {
      this.ondone();
    }
  }
};

module('Test setup');

var loader = new WebTestsLoader();
loader.load();

test('Interaction test setup', function() {
  expect(0);
  if (loader.isDone) {
    return;
  }

  stop();
  loader.ondone = start;
});

})();

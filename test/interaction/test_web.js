'use strict';

/* global JSZhuyin, JSZhuyinClient, JSZhuyinServerWorkerLoader,
          JSZhuyinServerIframeLoader,
          TaskRunner, arrayToUint16LEArrayBuffer, testdataResArray,
          QUnit */

// This runs the interaction tests against QUnit 1.x
// Eventually we should be using Mocha and TDD UI.

(function() {

var WebTestsLoader = function() {
};

WebTestsLoader.prototype = {
  isDone: false,
  ondone: null,

  load: function() {
    this._getTestManifest();
  },

  _getTestManifest: function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/base/test/interaction/manifest.json');
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
      el.src = '/base/test/interaction/tests/' + fileDesc.filename;
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

        var taskTest = new TaskTest();

        var jszhuyin = new JSZhuyin();
        jszhuyin.DATA_ARRAY_BUFFER = testdataBuffer;
        for (var key in taskTest.config) {
          jszhuyin[key] = taskTest.config[key];
        }
        jszhuyin.load();
        var runner = new TaskRunner(jszhuyin);
        runner.ondone = function() {
          jszhuyin.unload();
          ok(true, TaskTest.NAME); // :'(
          start();
        };
        runner.run(taskTest);
      });
    });

    module('JSZhuyinClient/WorkerLoader interaction tests');
    taskTests.forEach(function(TaskTest) {
      test(TaskTest.NAME, function() {
        stop();

        var taskTest = new TaskTest();

        var jszhuyin = new JSZhuyinClient();
        jszhuyin.onloadend = function() {
          var runner = new TaskRunner(jszhuyin);
          runner.ondone = function() {
            jszhuyin.unload();
            ok(true, TaskTest.NAME); // :'(
            start();
          };
          runner.run(taskTest);
        };

        var config = { dataURL: '/base/test/resources/testdata.data' };
        for (var key in taskTest.config) {
          config[key] = taskTest.config[key];
        }

        jszhuyin.load(
          new JSZhuyinServerWorkerLoader('/base/lib/worker.js'), config);
      });
    });

    module('JSZhuyinClient/IframeLoader interaction tests');
    taskTests.forEach(function(TaskTest) {
      test(TaskTest.NAME, function() {
        stop();

        var taskTest = new TaskTest();

        var jszhuyin = new JSZhuyinClient();
        jszhuyin.onloadend = function() {
          var runner = new TaskRunner(jszhuyin);
          runner.ondone = function() {
            jszhuyin.unload();
            ok(true, TaskTest.NAME); // :'(
            start();
          };
          runner.run(taskTest);
        };

        var config = { dataURL: '/base/test/resources/testdata.data' };
        for (var key in taskTest.config) {
          config[key] = taskTest.config[key];
        }

        jszhuyin.load(
          new JSZhuyinServerIframeLoader('/base/lib/frame.html'), config);
      });
    });

    this.isDone = true;
    if (typeof this.ondone === 'function') {
      this.ondone();
    }
  }
};

QUnit.config.autostart = false;

var loader = new WebTestsLoader();
loader.load();
loader.ondone = QUnit.start.bind(QUnit);

// Prevent Karma from starting the test.
QUnit.start = function() {};

})();

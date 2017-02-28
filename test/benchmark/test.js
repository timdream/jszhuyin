'use strict';

/* global QUnit, test, ok, equal, stop, start, module,
          JSZhuyinClient, JSZhuyinServerWorkerLoader */

var BenchmarkTestsLoader = function() {
};
BenchmarkTestsLoader.prototype = {
  isDone: false,
  ondone: null,

  TEST_RUNS: 25,
  results: [],

  load: function() {
    this._getSteps();
  },

  _getSteps: function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/base/test/benchmark/steps.json');
    xhr.responseType = 'json';
    xhr.send();
    xhr.onloadend = function() {
      this.allSteps = xhr.response;
      this._getText();
    }.bind(this);
  },

  _getText: function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/base/test/benchmark/corpus.txt');
    xhr.responseType = 'text';
    xhr.send();
    xhr.onloadend = function() {
      this.text = xhr.response;
      this._setupTests();
    }.bind(this);
  },

  _setupTests: function() {
    module('JSZhuyin Benchmark');

    for (var i = 0; i < this.allSteps.length; i++) {
      this.results[i] = [];
      for (var j = 1; j <= this.TEST_RUNS; j++) {
        (function(i, j) {
          test('Steps #' + i + ' test run #' + j, function() {
            stop();
            var jszhuyin = new JSZhuyinClient();
            jszhuyin.load(
              new JSZhuyinServerWorkerLoader('/base/lib/worker.js'), {
                dataURL: '/base/data/database.data'
              });
            jszhuyin.onloadend = function() {
              ok(true, 'JSZhuyin loaded');
              var thisSteps = [].concat(this.allSteps[i]);
              var now = performance.now();
              var text = '';

              jszhuyin.oncompositionend = function(t) {
                text += t;
              };
              var next = jszhuyin.onactionhandled = function() {
                var obj = thisSteps.shift();
                if (obj) {
                  var handled = jszhuyin[obj.task](obj.arg);
                  if (handled === false) {
                    text += (obj.arg === 'Enter') ? '\n' : obj.arg;
                    next();
                  }
                  return;
                }
                this.results[i].push(performance.now() - now);
                equal(text, this.text, 'Output === text');
                start();
              }.bind(this);
              var obj = thisSteps.shift();
              var handled = jszhuyin[obj.task](obj.arg);
              if (handled === false) {
                text += (obj.arg === 'Enter') ? '\n' : obj.arg;
                next();
              }
            }.bind(this);
          }.bind(this));
        }.bind(this, i, j))();
      }
    }

    this._setupSummaryReport();
  },

  _setupSummaryReport: function() {
    test('Report', function() {
      for (var i = 0; i < this.allSteps.length; i++) {
        var avg = (this.results[i].reduce(function(v, r) {
            return (v + r); }, 0) / this.results[i].length);
        var reportStr =
          'Type #' + i + ' (' + this.allSteps[i].length + ' steps):' +
          ' Average: ' + avg.toFixed(4) + 'ms (' +
          (avg / this.allSteps[i].length).toFixed(4) + 'ms)' +
          ' Stddev: ' + this.stdev(this.results[i]).toFixed(4) + 'ms (' +
          (this.stdev(this.results[i]) /
            this.allSteps[i].length).toFixed(4) + 'ms)';
        console.log(reportStr);
        ok(true, reportStr);
      }
    }.bind(this));

    this.isDone = true;
    if (typeof this.ondone === 'function') {
      this.ondone();
    }
  },

  // https://github.com/compute-io/stdev/blob/master/LICENSE
  stdev: function stdev( arr ) {
    var len = arr.length;
    var N = 0;
    var mean = 0;
    var M2 = 0;
    var delta = 0;

    if ( len < 2 ) {
      return 0;
    }
    for ( var i = 0; i < len; i++ ) {
      N += 1;
      delta = arr[ i ] - mean;
      mean += delta / N;
      M2 += delta * ( arr[i] - mean );
    }
    return Math.sqrt( M2 / ( N-1 ) );
  }
};

QUnit.config.autostart = false;

var loader = new BenchmarkTestsLoader();
loader.load();
loader.ondone = QUnit.start.bind(QUnit);

// Prevent Karma from starting the test.
QUnit.start = function() {};

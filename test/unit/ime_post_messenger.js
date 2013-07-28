'use strict';

module('IMEPostMessager (iframe)');

var IMEPostMessagerIframeTest = function IMEPostMessagerIframeTest(callback) {
  var iframe = document.createElement('iframe');
  iframe.src = '../lib/frame.html';

  document.body.appendChild(iframe);
  iframe.onload = function test_iframe_loaded() {
    var contentWindow = iframe.contentWindow;
    contentWindow.postMessage({
      'type': JSZhuyin.prototype.MSG_TYPE_CONFIG,
      'data': {
        'IDB_NAME': 'TestDatabase',
        'IDB_VERSION': 1,
        'JSON_FILES': ['testdata.json'],
        'JSON_URL': '../test/resources/'
      }
    }, '*');
    contentWindow.postMessage({
      'type': JSZhuyin.prototype.MSG_TYPE_LOAD
    }, '*');
    callback(contentWindow, function teardown() {
      contentWindow.postMessage({
        'type': JSZhuyin.prototype.MSG_TYPE_INPUT_SPECIAL,
        'data': JSZhuyin.prototype.MSG_DATA_SPECIAL_UNINSTALL
      }, '*');
      window.onmessage = function(evt) {
        if (evt.source !== contentWindow)
          return;
        var msg = evt.data;
        if (msg['type'] !== 'unload')
          return;
        document.body.removeChild(iframe);

        window.onmessage = null;
        start();
      };
    });
  };
};

test('load the frame.', function() {
  IMEPostMessagerIframeTest(function(contentWindow, teardown) {
    window.onmessage = function(evt) {
      if (evt.source !== contentWindow)
        return;

      var msg = evt.data;
      if (msg['type'] !== 'loadend')
        return;

      ok(true, 'Passed!');
      window.onmessage = null;

      teardown();
    };
  });
  stop();
});

test('run a simple query.', function() {
  IMEPostMessagerIframeTest(function(contentWindow, teardown) {
    window.onmessage = function(evt) {
      if (evt.source !== contentWindow)
        return;

      var msg = evt.data;
      if (msg['type'] !== 'loadend')
        return;

      contentWindow.postMessage({
        'type': JSZhuyin.prototype.MSG_TYPE_INPUT_SYMBOL,
        'data': 'ㄊㄞˊ'
      }, '*');

      window.onmessage = function(evt) {
        if (evt.source !== contentWindow)
          return;

        var msg = evt.data;
        equal(msg.type, 'compositionupdate', 'Passed!');
        equal(msg.data, 'ㄊㄞˊ', 'Passed!');

        window.onmessage = function(evt) {
          if (evt.source !== contentWindow)
            return;

          var msg = evt.data;
          equal(msg.type, 'candidateupdate', 'Passed!');
          deepEqual(msg.data,
            [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
             ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
             ["儓",1],["駘",1],["籉",1]],
            'Passed!');

          window.onmessage = null;

          teardown();
        };
      };
    };
  });
  stop();
});

module('IMEPostMessager (worker)');

var IMEPostMessagerWorkerTest = function IMEPostMessagerWorkerTest(callback) {
  var worker = new Worker('../lib/worker.js');
  worker.postMessage({
    'type': JSZhuyin.prototype.MSG_TYPE_CONFIG,
    'data': {
      'IDB_NAME': 'TestDatabase',
      'IDB_VERSION': 1,
      'JSON_FILES': ['testdata.json'],
      'JSON_URL': '../test/resources/'
    }
  });
  worker.postMessage({
    'type': JSZhuyin.prototype.MSG_TYPE_LOAD
  });
  callback(worker, function teardown() {
    worker.postMessage({
      'type': JSZhuyin.prototype.MSG_TYPE_INPUT_SPECIAL,
      'data': JSZhuyin.prototype.MSG_DATA_SPECIAL_UNINSTALL
    });
    worker.onmessage = function(evt) {
      var msg = evt.data;
      if (msg['type'] !== 'unload')
        return;
      worker.onmessage = null;
      start();
    };
  });
};

test('load the worker.', function() {
  IMEPostMessagerWorkerTest(function(worker, teardown) {
    worker.onmessage = function(evt) {
      var msg = evt.data;
      if (msg['type'] !== 'loadend')
        return;

      ok(true, 'Passed!');
      worker.onmessage = null;

      teardown();
    };
  });
  stop();
});

test('run a simple query.', function() {
  IMEPostMessagerWorkerTest(function(worker, teardown) {
    worker.onmessage = function(evt) {
      var msg = evt.data;
      if (msg['type'] !== 'loadend')
        return;

      worker.postMessage({
        'type': JSZhuyin.prototype.MSG_TYPE_INPUT_SYMBOL,
        'data': 'ㄊㄞˊ'
      });

      worker.onmessage = function(evt) {
        var msg = evt.data;
        equal(msg.type, 'compositionupdate', 'Passed!');
        equal(msg.data, 'ㄊㄞˊ', 'Passed!');

        worker.onmessage = function(evt) {
          var msg = evt.data;
          equal(msg.type, 'candidateupdate', 'Passed!');
          deepEqual(msg.data,
            [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
             ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
             ["儓",1],["駘",1],["籉",1]],
            'Passed!');

          worker.onmessage = null;

          teardown();
        };
      };
    };
  });
  stop();
});

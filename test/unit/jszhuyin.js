'use strict';

module('JSZhuyinIframeLoader');

test('load', function() {
  var loader = new JSZhuyinIframeLoader('./resources/frame.html');
  expect(2);
  loader.onload = function() {
    ok(true, 'Passed!');
    loader.sendMessage({ 'hello': 'world!' });
  };
  loader.onmessage = function(msg) {
    deepEqual(msg, { 'hello': 'world!' }, 'Passed!');
    loader.unload();
    start();
  };
  stop();
  loader.load();
});

module('JSZhuyinWorkerLoader');

test('load', function() {
  var loader = new JSZhuyinWorkerLoader('./resources/post_messenger.js');
  expect(2);
  loader.onload = function() {
    ok(true, 'Passed!');
    loader.sendMessage({ 'hello': 'world!' });
  };
  loader.onmessage = function(msg) {
    deepEqual(msg, { 'hello': 'world!' }, 'Passed!');
    loader.unload();
    start();
  };
  stop();
  loader.load();
});

module('JSZhuyin (iframe)');

var JSZhuyinIframeTest = function JSZhuyinIframeTest(callback) {
  var config = {
    'IDB_NAME': 'TestDatabase',
    'IDB_VERSION': 1,
    'JSON_FILES': ['testdata.json'],
    'JSON_URL': '../test/resources/'
  };
  var ime = new JSZhuyin(config,
    new JSZhuyinIframeLoader('../lib/frame.html'));

  callback(ime, function teardown() {
    ime.uninstall();
    ime.onunload = function() {
      ime.onunload = null;
      start();
    };
  });
};

test('load.', function() {
  JSZhuyinIframeTest(function(ime, teardown) {
    ime.onloadend = function() {
      ok(true, 'Passed!');
      teardown();
    };
  });
  stop();
});

test('run a simple interactive query.', function() {
  JSZhuyinIframeTest(function(ime, teardown) {
    expect(9);
    ime.onloadend = function() {
      var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ'];
      ime.oncompositionupdate = function(composition) {
        equal(composition, expectedCompositions.shift(), 'Passed!');
      };

      var expectedCandidates = [
        [["ㄊ", 1]],
        [["ㄊㄞ", 1]],
        [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]]];
      ime.oncandidateupdate = function(candidates) {
        deepEqual(candidates, expectedCandidates.shift(), 'Passed!');
      };

      var nextActions = [
        function() {
          ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Passed!');
        }
      ];
      ime.onactionhandled = function() {
        if (!nextActions.length) {
          teardown();

          return;
        }

        (nextActions.shift())();
      };
      (nextActions.shift())();
    };
  });
  stop();
});


test('Confirm text with Enter key.', function() {
  JSZhuyinIframeTest(function(ime, teardown) {
    expect(13);
    ime.onloadend = function() {
      ime.oncompositionend = function(str) {
        equal(str, '台', 'Passed!');
      };

      var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
      ime.oncompositionupdate = function(composition) {
        equal(composition, expectedCompositions.shift(), 'Passed!');
      };

      var expectedCandidates = [
        [["ㄊ", 1]],
        [["ㄊㄞ", 1]],
        [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        []];
      ime.oncandidateupdate = function(candidates) {
        deepEqual(candidates, expectedCandidates.shift(), 'Passed!');
      };

      var nextActions = [
        function() {
          ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent(
            JSZhuyin.prototype.MSG_DATA_SPECIAL_RETURN), 'Passed!');
        }
      ];
      ime.onactionhandled = function() {
        if (!nextActions.length) {
          teardown();

          return;
        }

        (nextActions.shift())();
      };
      (nextActions.shift())();
    };
  });
  stop();
});

test('Don\'t handle Enter key if there is no candidates.', function() {
  JSZhuyinIframeTest(function(ime, teardown) {
    expect(1);
    ime.onloadend = function() {
      ok(!ime.handleKeyEvent(
        JSZhuyin.prototype.MSG_DATA_SPECIAL_RETURN), 'Passed!');
      teardown();
    };
  });
  stop();
});

test('Confirm text with candidate selection.', function() {
  JSZhuyinIframeTest(function(ime, teardown) {
    expect(12);
    ime.onloadend = function() {
      ime.oncompositionend = function(str) {
        equal(str, '颱', 'Passed!');
      };

      var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
      ime.oncompositionupdate = function(composition) {
        equal(composition, expectedCompositions.shift(), 'Passed!');
      };

      var expectedCandidates = [
        [["ㄊ", 1]],
        [["ㄊㄞ", 1]],
        [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        []];
      ime.oncandidateupdate = function(candidates) {
        deepEqual(candidates, expectedCandidates.shift(), 'Passed!');
      };

      var nextActions = [
        function() {
          ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ime.confirmSelection(["颱",1]);
        }
      ];
      ime.onactionhandled = function() {
        if (!nextActions.length) {
          teardown();

          return;
        }

        (nextActions.shift())();
      };
      (nextActions.shift())();
    };
  });
  stop();
});


test('Backspace key cancels the last symbol.', function() {
  JSZhuyinIframeTest(function(ime, teardown) {
    expect(15);
    ime.onloadend = function() {
      var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', 'ㄊㄞˊˊ', 'ㄊㄞˊ'];
      ime.oncompositionupdate = function(composition) {
        equal(composition, expectedCompositions.shift(), 'Passed!');
      };

      var expectedCandidates = [
        [["ㄊ", 1]],
        [["ㄊㄞ", 1]],
        [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        [["台ˊ",2], ["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]]];
      ime.oncandidateupdate = function(candidates) {
        deepEqual(candidates, expectedCandidates.shift(), 'Passed!');
      };

      var nextActions = [
        function() {
          ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Passed!');
        },
        function() {
          ok(ime.handleKeyEvent(
            JSZhuyin.prototype.MSG_DATA_SPECIAL_BACK_SPACE), 'Passed!');
        }
      ];
      ime.onactionhandled = function() {
        if (!nextActions.length) {
          teardown();

          return;
        }

        (nextActions.shift())();
      };
      (nextActions.shift())();
    };
  });
  stop();
});

test('Don\'t handle Backspace key if there is no compositions.', function() {
  JSZhuyinIframeTest(function(ime, teardown) {
    expect(1);
    ime.onloadend = function() {
      ok(!ime.handleKeyEvent(
        JSZhuyin.prototype.MSG_DATA_SPECIAL_BACK_SPACE), 'Passed!');
      teardown();
    };
  });
  stop();
});

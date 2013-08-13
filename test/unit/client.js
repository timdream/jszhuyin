'use strict';

module('JSZhuyinServerIframeLoader');

test('load()', function() {
  var loader = new JSZhuyinServerIframeLoader('./resources/frame.html');
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

module('JSZhuyinServerWorkerLoader');

test('load()', function() {
  var loader = new JSZhuyinServerWorkerLoader('./resources/post_messenger.js');
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


module('JSZhuyinClient (iframe)', {
  teardown: function() {
    var IDB = IndexedDBStorage.prototype.IDB;
    var req = IDB.deleteDatabase('TestDatabase');
    req.onerror = function() {
      throw 'Teardown error';
    };
  }
});

test('Run a simple interactive query.', function() {
  var ime = new JSZhuyinClient();
  expect(9);

  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), '3Passed!');
    };

    var expectedCandidates = [
      [["ㄊ", 1]],
      [["ㄊㄞ", 1]],
      [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
       ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
       ["儓",1],["駘",1],["籉",1]]];
    ime.oncandidateschange = function(candidates) {
      deepEqual(candidates, expectedCandidates.shift(), '2Passed!');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), '1Passed!');
      },
      function() {
        ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), '1Passed!');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), '1Passed!');
      }
    ];
    ime.onactionhandled = function() {
      if (!nextActions.length) {
        setTimeout(function() {
          ime.unload();
          start();
        });

        return;
      }

      (nextActions.shift())();
    };
    (nextActions.shift())();
  };

  stop();
  ime.load(new JSZhuyinServerIframeLoader('../lib/frame.html'), {
    IDB_NAME: 'TestDatabase',
    IDB_VERSION: 1,
    JSON_URL: '../test/resources/',
    JSON_FILES: ['testdata.json']
  });
});

test('Confirm text with Enter key.', function() {
  var ime = new JSZhuyinClient();
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
    ime.oncandidateschange = function(candidates) {
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
        ok(ime.handleKeyEvent(0x0d), 'Passed!');
      }
    ];
    ime.onactionhandled = function() {
      if (!nextActions.length) {
        setTimeout(function() {
          ime.unload();
          start();
        });

        return;
      }

      (nextActions.shift())();
    };
    (nextActions.shift())();
  };

  stop();
  ime.load(new JSZhuyinServerIframeLoader('../lib/frame.html'), {
    IDB_NAME: 'TestDatabase',
    IDB_VERSION: 1,
    JSON_URL: '../test/resources/',
    JSON_FILES: ['testdata.json']
  });
});

test('Confirm text with a non-Bopomofo key.', function() {
  var ime = new JSZhuyinClient();
  expect(13);

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台。', 'Passed!');
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
    ime.oncandidateschange = function(candidates) {
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
        ok(ime.handleKeyEvent('。'.charCodeAt(0)), 'Passed!');
      }
    ];
    ime.onactionhandled = function() {
      if (!nextActions.length) {
        setTimeout(function() {
          ime.unload();
          start();
        });

        return;
      }

      (nextActions.shift())();
    };
    (nextActions.shift())();
  };

  stop();
  ime.load(new JSZhuyinServerIframeLoader('../lib/frame.html'), {
    IDB_NAME: 'TestDatabase',
    IDB_VERSION: 1,
    JSON_URL: '../test/resources/',
    JSON_FILES: ['testdata.json']
  });
});

test('Don\'t handle Enter key if there is no candidates.', function() {
  var ime = new JSZhuyinClient();
  expect(1);

  ime.onloadend = function() {
    ok(!ime.handleKeyEvent(0x13), 'Passed!');
    setTimeout(function() {
      ime.unload();
      start();
    });
  };

  stop();
  ime.load(new JSZhuyinServerIframeLoader('../lib/frame.html'), {
    IDB_NAME: 'TestDatabase',
    IDB_VERSION: 1,
    JSON_URL: '../test/resources/',
    JSON_FILES: ['testdata.json']
  });
});

test('Confirm text with candidate selection.', function() {
  var ime = new JSZhuyinClient();
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
    ime.oncandidateschange = function(candidates) {
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
        ime.selectCandidate(["颱",1]);
      }
    ];
    ime.onactionhandled = function() {
      if (!nextActions.length) {
        setTimeout(function() {
          ime.unload();
          start();
        });

        return;
      }

      (nextActions.shift())();
    };
    (nextActions.shift())();
  };

  stop();
  ime.load(new JSZhuyinServerIframeLoader('../lib/frame.html'), {
    IDB_NAME: 'TestDatabase',
    IDB_VERSION: 1,
    JSON_URL: '../test/resources/',
    JSON_FILES: ['testdata.json']
  });
});

test('Backspace key cancels the last symbol.', function() {
  var ime = new JSZhuyinClient();

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
    ime.oncandidateschange = function(candidates) {
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
        ok(ime.handleKeyEvent(0x08), 'Passed!');
      }
    ];
    ime.onactionhandled = function() {
      if (!nextActions.length) {
        setTimeout(function() {
          ime.unload();
          start();
        });

        return;
      }

      (nextActions.shift())();
    };
    (nextActions.shift())();
  };

  stop();
  ime.load(new JSZhuyinServerIframeLoader('../lib/frame.html'), {
    IDB_NAME: 'TestDatabase',
    IDB_VERSION: 1,
    JSON_URL: '../test/resources/',
    JSON_FILES: ['testdata.json']
  });
});

test('Don\'t handle Backspace key if there is no compositions.', function() {
  var ime = new JSZhuyinClient();

  expect(1);
  ime.onloadend = function() {
    ok(!ime.handleKeyEvent(0x08), 'Passed!');
    setTimeout(function() {
      ime.unload();
      start();
    });
  };

  stop();
  ime.load(new JSZhuyinServerIframeLoader('../lib/frame.html'), {
    IDB_NAME: 'TestDatabase',
    IDB_VERSION: 1,
    JSON_URL: '../test/resources/',
    JSON_FILES: ['testdata.json']
  });
});

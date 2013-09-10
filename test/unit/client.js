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

test('load()', function() {
  var ime = new JSZhuyinClient();
  expect(5);
  ime.onchunkload =
  ime.onpartlyloaded =
  ime.onpopulated =
  ime.onload = function(status) {
    equal(status, ime.status, 'Passed!');
  };
  ime.onloadend = function(status) {
    equal(status, ime.status, 'Passed!');
    ime.unload();

    start();
  };

  stop();
  ime.load(new JSZhuyinServerIframeLoader('../lib/frame.html'), {
    IDB_NAME: 'TestDatabase',
    IDB_VERSION: 1,
    JSON_URL: '../test/resources/',
    JSON_FILES: ['testdata.json']
  });
});

test('load() non-exist files', function() {
  var ime = new JSZhuyinClient();
  expect(2);
  ime.onchunkload =
  ime.onpartlyloaded =
  ime.onpopulated =
  ime.onload = function(status) {
    ok(false, 'Passed!');
  };
  ime.onerror = function(status) {
    equal(status, ime.status, 'Passed!');
  };
  ime.onloadend = function(status) {
    equal(status, ime.status, 'Passed!');
    ime.unload();

    start();
  };

  stop();
  ime.load(new JSZhuyinServerIframeLoader('../lib/frame.html'), {
    IDB_NAME: 'TestDatabase',
    IDB_VERSION: 1,
    JSON_URL: '../test/resources/',
    JSON_FILES: ['404.json']
  });
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
      [["ㄊ", "ఀ"]],
      [["ㄊㄞ", "఩"]],
      [["台","ప"],["臺","ప"],["抬","ప"],["颱","ప"],["檯","ప"],["苔","ప"],
       ["跆","ప"],["邰","ప"],["鮐","ప"],["薹","ప"],["嬯","ప"],["秮","ప"],
       ["旲","ప"],["炱","ప"],["儓","ప"],["駘","ప"],["籉","ప"]]];
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
  expect(14);

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      [["ㄊ", "ఀ"]],
      [["ㄊㄞ", "఩"]],
      [["台","ప"],["臺","ప"],["抬","ప"],["颱","ప"],["檯","ప"],["苔","ప"],
       ["跆","ప"],["邰","ప"],["鮐","ప"],["薹","ప"],["嬯","ప"],["秮","ప"],
       ["旲","ప"],["炱","ప"],["儓","ప"],["駘","ప"],["籉","ప"]],
      [], // Confirm
      [["北",""],["北市",""]]]; // Suggestions
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
  expect(14);

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台。', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      [["ㄊ", "ఀ"]],
      [["ㄊㄞ", "఩"]],
      [["台","ప"],["臺","ప"],["抬","ప"],["颱","ప"],["檯","ప"],["苔","ప"],
       ["跆","ప"],["邰","ప"],["鮐","ప"],["薹","ప"],["嬯","ప"],["秮","ప"],
       ["旲","ప"],["炱","ప"],["儓","ప"],["駘","ప"],["籉","ప"]],
      [], // Confirm
      []]; // Suggestions
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
  expect(13);

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '颱', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      [["ㄊ", "ఀ"]],
      [["ㄊㄞ", "఩"]],
      [["台","ప"],["臺","ప"],["抬","ప"],["颱","ప"],["檯","ప"],["苔","ప"],
       ["跆","ప"],["邰","ప"],["鮐","ప"],["薹","ప"],["嬯","ప"],["秮","ప"],
       ["旲","ప"],["炱","ప"],["儓","ప"],["駘","ప"],["籉","ప"]],
      [], // Confirm
      []]; // Suggestions
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
        ime.selectCandidate(["颱","ప"]);
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
      [["ㄊ", "ఀ"]],
      [["ㄊㄞ", "఩"]],
      [["台","ప"],["臺","ప"],["抬","ప"],["颱","ప"],["檯","ప"],["苔","ప"],
       ["跆","ప"],["邰","ప"],["鮐","ప"],["薹","ప"],["嬯","ప"],["秮","ప"],
       ["旲","ప"],["炱","ప"],["儓","ప"],["駘","ప"],["籉","ప"]],
      [["台ˊ","ప"],
       ["台","ప"],["臺","ప"],["抬","ప"],["颱","ప"],["檯","ప"],["苔","ప"],
       ["跆","ప"],["邰","ప"],["鮐","ప"],["薹","ప"],["嬯","ప"],["秮","ప"],
       ["旲","ప"],["炱","ప"],["儓","ప"],["駘","ప"],["籉","ప"]],
      [["台","ప"],["臺","ప"],["抬","ప"],["颱","ప"],["檯","ప"],["苔","ప"],
       ["跆","ప"],["邰","ప"],["鮐","ప"],["薹","ప"],["嬯","ప"],["秮","ప"],
       ["旲","ప"],["炱","ప"],["儓","ప"],["駘","ప"],["籉","ప"]]];
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

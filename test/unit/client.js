'use strict';

/* global JSZhuyinServerIframeLoader, JSZhuyinServerWorkerLoader,
          JSZhuyinClient, DataLoader */

module('JSZhuyinServerIframeLoader');

test('load()', function() {
  var loader = new JSZhuyinServerIframeLoader('../test/resources/frame.html');
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
  var loader =
    new JSZhuyinServerWorkerLoader('../test/resources/post_messenger.js');
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

module('JSZhuyinClient (iframe; preload data)');

test('load()', function() {
  var ime = new JSZhuyinClient();
  expect(2);
  ime.onload = function() {
    ok(ime.loaded, 'Passed!');
  };
  ime.onloadend = function() {
    ok(ime.loaded, 'Passed!');
    ime.unload();

    start();
  };

  stop();

  var loader = new DataLoader();
  loader.DATA_URL = '../test/resources/testdata.data';
  loader.onload = function() {
    var serverLoader = new JSZhuyinServerIframeLoader('../lib/frame.html');
    ime.load(serverLoader, {}, loader.data);
  };
  loader.load();
});

module('JSZhuyinClient (iframe)');

test('load()', function() {
  var ime = new JSZhuyinClient();
  expect(2);
  ime.onload = function() {
    ok(ime.loaded, 'Passed!');
  };
  ime.onloadend = function() {
    ok(ime.loaded, 'Passed!');
    ime.unload();

    start();
  };

  stop();
  ime.load(new JSZhuyinServerIframeLoader('../lib/frame.html'), {
    dataURL: '../test/resources/testdata.data',
    SPLIT_SOUND_TO_MATCH_PHRASES: false
  });
});

module('JSZhuyinClient (worker; preload data)');

test('load()', function() {
  var ime = new JSZhuyinClient();
  expect(2);
  ime.onload = function() {
    ok(ime.loaded, 'Passed!');
  };
  ime.onloadend = function() {
    ok(ime.loaded, 'Passed!');
    ime.unload();

    start();
  };

  stop();

  var loader = new DataLoader();
  loader.DATA_URL = '../test/resources/testdata.data';
  loader.onload = function() {
    var serverLoader = new JSZhuyinServerWorkerLoader('../lib/worker.js');
    ime.load(serverLoader, {}, loader.data);
  };
  loader.load();
});

module('JSZhuyinClient (worker)');

test('load()', function() {
  var ime = new JSZhuyinClient();
  expect(2);
  ime.onload = function() {
    ok(ime.loaded, 'Passed!');
  };
  ime.onloadend = function() {
    ok(ime.loaded, 'Passed!');
    ime.unload();

    start();
  };

  stop();
  ime.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'), {
    dataURL: '../test/resources/testdata.data',
    SPLIT_SOUND_TO_MATCH_PHRASES: false
  });
});

test('load() non-exist files', function() {
  var ime = new JSZhuyinClient();
  expect(2);
  ime.onchunkload =
  ime.onpartlyloaded =
  ime.onpopulated =
  ime.onload = function() {
    ok(false, 'Passed!');
  };
  ime.onerror = function() {
    ok(true, 'Passed!');
  };
  ime.onloadend = function() {
    ok(ime.loaded, 'Passed!');
    ime.unload();

    start();
  };

  stop();
  ime.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'), {
    dataURL: '../test/resources/404.data'
  });
});

module('JSZhuyinClient (worker; interactive/integration)');

test('Run a simple interactive query.', function() {
  var ime = new JSZhuyinClient();
  expect(9);
  var candidateId = 42;

  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞˊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]]];
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
  ime.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'), {
    dataURL: '../test/resources/testdata.data',
    SPLIT_SOUND_TO_MATCH_PHRASES: false
  });
});

test('Confirm text with Enter key.', function() {
  var ime = new JSZhuyinClient();
  expect(13);
  var candidateId = 42;

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞˊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* Suggestions */
      [['北', 0],['北市', 0]]];
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
  ime.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'), {
    dataURL: '../test/resources/testdata.data',
    SPLIT_SOUND_TO_MATCH_PHRASES: false
  });
});

test('Confirm text with Enter key (SUGGEST_PHRASES = false).', function() {
  var ime = new JSZhuyinClient();
  expect(13);
  var candidateId = 42;

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞˊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* Confirm */
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
  ime.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'), {
    dataURL: '../test/resources/testdata.data',
    SPLIT_SOUND_TO_MATCH_PHRASES: false,
    SUGGEST_PHRASES: false
  });
});

test('Confirm text with a non-Bopomofo key.', function() {
  var ime = new JSZhuyinClient();
  expect(13);
  var candidateId = 42;

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台。', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞˊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* Confirm */
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
  ime.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'), {
    dataURL: '../test/resources/testdata.data',
    SPLIT_SOUND_TO_MATCH_PHRASES: false
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
  ime.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'), {
    dataURL: '../test/resources/testdata.data',
    SPLIT_SOUND_TO_MATCH_PHRASES: false
  });
});

test('Confirm text with candidate selection.', function() {
  var ime = new JSZhuyinClient();
  expect(12);
  var candidateId = 42;

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '颱', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞˊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* Suggestions */
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
        ime.selectCandidate(['颱',79]);
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
  ime.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'), {
    dataURL: '../test/resources/testdata.data',
    SPLIT_SOUND_TO_MATCH_PHRASES: false
  });
});

test('Backspace key removes the last symbol.', function() {
  var ime = new JSZhuyinClient();

  expect(15);
  var candidateId = 42;
  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', 'ㄊㄞˊˊ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞˊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞˊˊ' */
      [['台ˊ', candidateId++],
       ['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]],
      /* 'ㄊㄞˊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]]];
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
  ime.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'), {
    dataURL: '../test/resources/testdata.data',
    SPLIT_SOUND_TO_MATCH_PHRASES: false
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
  ime.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'), {
    dataURL: '../test/resources/testdata.data',
    SPLIT_SOUND_TO_MATCH_PHRASES: false
  });
});

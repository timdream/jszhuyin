'use strict';

/* global JSZhuyinServerIframeLoader, JSZhuyinServerWorkerLoader,
          JSZhuyinClient */

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
    DATA_URL: '../test/resources/testdata.data'
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
    DATA_URL: '../test/resources/404.data'
  });
});


test('Run a simple interactive query.', function() {
  var ime = new JSZhuyinClient();
  expect(9);

  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' (shortcut) */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప']],
      /* 'ㄊㄞ' */
      [['ㄊㄞ', '఩']],
      /* 'ㄊㄞˊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']]];
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
    DATA_URL: '../test/resources/testdata.data'
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
      /* 'ㄊ' (shortcut) */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప']],
      /* 'ㄊㄞ' */
      [['ㄊㄞ', '఩']],
      /* 'ㄊㄞˊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* Confirm */
      [],
      /* Suggestions */
      [['北',''],['北市','']]];
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
    DATA_URL: '../test/resources/testdata.data'
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
      /* 'ㄊ' (shortcut) */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప']],
      /* 'ㄊㄞ' */
      [['ㄊㄞ', '఩']],
      /* 'ㄊㄞˊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* Confirm */
      [],
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
    DATA_URL: '../test/resources/testdata.data'
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
    DATA_URL: '../test/resources/testdata.data'
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
      /* 'ㄊ' (shortcut) */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప']],
      /* 'ㄊㄞ' */
      [['ㄊㄞ', '఩']],
      /* 'ㄊㄞˊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* Confirm */
      [],
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
        ime.selectCandidate(['颱','ప']);
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
    DATA_URL: '../test/resources/testdata.data'
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
      /* 'ㄊ' (shortcut) */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప']],
      /* 'ㄊㄞ' */
      [['ㄊㄞ', '఩']],
      /* 'ㄊㄞˊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* 'ㄊㄞˊˊ' */
      [['台ˊ','ప\u0002'],
       ['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* 'ㄊㄞˊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']]];
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
    DATA_URL: '../test/resources/testdata.data'
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
    DATA_URL: '../test/resources/testdata.data'
  });
});

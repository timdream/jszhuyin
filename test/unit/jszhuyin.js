'use strict';

/* global ActionQueue, JSZhuyin */

module('ActionQueue');

test('queue()', function() {
  var queue = new ActionQueue();
  queue.handle = function(a, b, c) {
    equal(a, 'a', 'Passed!');
    equal(b, 'b', 'Passed!');
    equal(c, 'c', 'Passed!');
    queue.done();
  };
  queue.queue('a', 'b', 'c');
});

test('queue() two actions.', function() {
  var queue = new ActionQueue();
  expect(6);
  queue.handle = function(a, b, c) {
    equal(a, 'a', 'Passed!');
    equal(b, 'b', 'Passed!');
    equal(c, 'c', 'Passed!');
    queue.done();
  };
  queue.queue('a', 'b', 'c');
  queue.queue('a', 'b', 'c');
});

test('queue() 3 async actions.', function() {
  var queue = new ActionQueue();
  expect(9);
  queue.handle = function(a, b, c) {
    queue.handle = function(c, d, e) {
      queue.handle = function(f, g, i) {
        equal(f, 'f', 'Passed!');
        equal(g, 'g', 'Passed!');
        equal(i, 'i', 'Passed!');

        setTimeout(function() {
          queue.done();
          start();
        });
      };
      equal(c, 'c', 'Passed!');
      equal(d, 'd', 'Passed!');
      equal(e, 'e', 'Passed!');

      queue.queue('f', 'g', 'i');

      setTimeout(function() {
        queue.done();
      });
    };

    equal(a, 'a', 'Passed!');
    equal(b, 'b', 'Passed!');
    equal(c, 'c', 'Passed!');

    setTimeout(function() {
      queue.done();
    });
  };
  stop();
  queue.queue('a', 'b', 'c');
  queue.queue('c', 'd', 'e');
});

module('JSZhuyin');

test('create instance', function() {
  var ime = new JSZhuyin();
  ok(!!ime, 'Passed!');
});

test('load()', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  expect(2);
  ime.onloadend = function(status) {
    ok(ime.loaded, 'Passed!');
    ok(ime.storage.loaded, 'Passed!');
    ime.unload();

    start();
  };

  stop();
  ime.load();
});

test('load() non-exist files', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/404.data';
  expect(2);
  ime.onerror = function() {
    ok(true, 'Passed!');
  };
  ime.onloadend = function() {
    ok(true, 'Passed!');
    ime.unload();

    start();
  };

  stop();
  ime.load();
});


test('query() a word', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊ';
    expect(1);
    var candidateId = 42;
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
         ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
         ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
         ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
         ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
         ['籉', candidateId++],['秮', candidateId++]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() a two-word phrase', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇ';
    expect(1);
    var candidateId = 42;
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['台北', candidateId++],
         ['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
         ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
         ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
         ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
         ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
         ['籉', candidateId++],['秮', candidateId++]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() a three-word phrase', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇㄕˋ';
    expect(1);
    var candidateId = 42;
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['台北市', candidateId++],['臺北市', candidateId++],
         ['台北是', candidateId++],
         ['台北', candidateId++],
         ['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
         ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
         ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
         ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
         ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
         ['籉', candidateId++],['秮', candidateId++]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() with symbols exceeds MAX_ENCODED_SOUNDS_LENGTH.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  ime.MAX_ENCODED_SOUNDS_LENGTH = 3;
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇ';
    expect(4);
    var candidateId = 42;
    ime.updateComposition = function() {
      equal(ime.symbols, 'ㄊㄞˊㄕˋ', 'Passed!');
    };
    ime.oncompositionend = function(composition) {
      equal(composition, '台北', 'Passed!');
    };
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['台北', candidateId++],
         ['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
         ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
         ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
         ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
         ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
         ['籉', candidateId++],['秮', candidateId++]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.symbols = 'ㄊㄞˊㄅㄟˇㄊㄞˊㄕˋ';
      ime.updateCandidates = function(results) {
        deepEqual(results,
          [['台是', candidateId++],
           ['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
           ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
           ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
           ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
           ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
           ['籉', candidateId++],['秮', candidateId++]],
          'Passed!');
      };
      ime.queue.done = function() {
        ime.unload();

        start();
      };
      ime.query();
    };
    ime.query();
  };

  stop();
  ime.load();
});


test('query() two words which don\'t made up a phrase', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  ime.onloadend = function() {
    ime.symbols = 'ㄅㄟˇㄕˋ';
    expect(1);
    var candidateId = 42;
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['北是', candidateId++],['北', candidateId++]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() non-exist word', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄅㄟˊ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['ㄅㄟˊ', 42]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() non-exist phrase', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˊ';
    expect(1);
    var candidateId = 42;
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['台ㄅㄟˊ', candidateId++],
         ['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
         ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
         ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
         ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
         ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
         ['籉', candidateId++],['秮', candidateId++]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('updateComposition()', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  expect(1);
  ime.oncompositionupdate = function(composition) {
    equal(composition, 'ㄊㄞˊㄅㄟˇ', 'Passed!');
    ime.unload();
    start();
  };
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇ';
    ime.updateComposition();
  };

  stop();
  ime.load();
});

module('JSZhuyin (interactive/integration)');

test('Simple interactive query (send all keys in one action).', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  expect(9);
  var candidateId = 42;

  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Composition updates.');
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
      deepEqual(candidates, expectedCandidates.shift(),
        'Candidates equals to expected list.');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Handles ㄊ');
        ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Handles ㄞ');
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
      },
      function() { },
      function() { }
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
  ime.load();
});

test('Run a simple interactive query.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  expect(9);
  var candidateId = 42;

  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Composition updates.');
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
      deepEqual(candidates, expectedCandidates.shift(),
        'Candidates equals to expected list.');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Handles ㄊ');
      },
      function() {
        ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Handles ㄞ');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
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
  ime.load();
});

test('Run a simple interactive query (set ㄞ and ㄚ interchangable).',
function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  expect(9);
  var candidateId = 42;

  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄚ', 'ㄊㄚˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Composition updates.');
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
      deepEqual(candidates, expectedCandidates.shift(),
        'Candidates equals to expected list.');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Handles ㄊ');
      },
      function() {
        ok(ime.handleKeyEvent('ㄚ'.charCodeAt(0)), 'Handles ㄚ');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
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

    ime.setConfig({ INTERCHANGABLE_PAIRS: 'ㄚㄞ' });
    (nextActions.shift())();
  };

  stop();
  ime.load();
});

test('Run a simple interactive query (set SPLIT_SOUND_TO_MATCH_PHRASES=true).',
function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = true;
  expect(9);
  var candidateId = 42;

  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Composition updates.');
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
       ['颱', candidateId++],['檯', candidateId++],['疼愛', candidateId++],
       ['苔', candidateId++],['跆', candidateId++],['邰', candidateId++],
       ['抬愛', candidateId++],['鮐', candidateId++],['旲', candidateId++],
       ['炱', candidateId++],['嬯', candidateId++],['儓', candidateId++],
       ['薹', candidateId++],['駘', candidateId++],['籉', candidateId++],
       ['秮', candidateId++]],
      /* 'ㄊㄞˊ' */
      [['台', candidateId++],['臺', candidateId++],['抬', candidateId++],
       ['颱', candidateId++],['檯', candidateId++],['苔', candidateId++],
       ['跆', candidateId++],['邰', candidateId++],['鮐', candidateId++],
       ['旲', candidateId++],['炱', candidateId++],['嬯', candidateId++],
       ['儓', candidateId++],['薹', candidateId++],['駘', candidateId++],
       ['籉', candidateId++],['秮', candidateId++]]];
    ime.oncandidateschange = function(candidates) {
      deepEqual(candidates, expectedCandidates.shift(),
        'Candidates equals to expected list.');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Handles ㄊ');
      },
      function() {
        ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Handles ㄞ');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
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
  ime.load();
});

test('Confirm text with Enter key.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  expect(13);
  var candidateId = 42;

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Composition updates.');
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
      deepEqual(candidates, expectedCandidates.shift(),
        'Candidates equals to expected list.');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Handles ㄊ');
      },
      function() {
        ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Handles ㄞ');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
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
  ime.load();
});

test('Confirm text with Enter key (SUGGEST_PHRASES = false).', function() {
  var ime = new JSZhuyin();
  ime.SUGGEST_PHRASES = false;
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  expect(13);
  var candidateId = 42;

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Composition updates.');
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
      deepEqual(candidates, expectedCandidates.shift(),
        'Candidates equals to expected list.');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Handles ㄊ');
      },
      function() {
        ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Handles ㄞ');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
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
  ime.load();
});

test('Confirm text with Enter key (set ㄞ and ㄚ interchangable).', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  expect(13);
  var candidateId = 42;

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄚ', 'ㄊㄚˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Composition updates.');
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
      deepEqual(candidates, expectedCandidates.shift(),
        'Candidates equals to expected list.');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Handles ㄊ');
      },
      function() {
        ok(ime.handleKeyEvent('ㄚ'.charCodeAt(0)), 'Handles ㄚ');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
      },
      function() {
        ok(ime.handleKeyEvent(0x0d), 'Handles Enter');
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
    ime.setConfig({ INTERCHANGABLE_PAIRS: 'ㄚㄞ' });
    (nextActions.shift())();
  };

  stop();
  ime.load();
});

test('Confirm text with a non-Bopomofo key.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  expect(13);
  var candidateId = 42;

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台。', 'Composition ends with expected string.');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Composition updates.');
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
      deepEqual(candidates, expectedCandidates.shift(),
        'Candidates equals to expected list.');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Handles ㄊ');
      },
      function() {
        ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Handles ㄞ');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
      },
      function() {
        ok(ime.handleKeyEvent('。'.charCodeAt(0)), 'Handles 。');
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
  ime.load();
});

test('Don\'t handle Enter key if there is no candidates.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;
  expect(1);

  ime.onloadend = function() {
    ok(!ime.handleKeyEvent(0x13), 'Not handling enter.');
    setTimeout(function() {
      ime.unload();
      start();
    });
  };

  stop();
  ime.load();
});

test('Confirm text with candidate selection.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;

  expect(12);
  var candidateId = 42;

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '颱', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Composition updates.');
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
      deepEqual(candidates, expectedCandidates.shift(),
        'Candidates equals to expected list.');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Handles ㄊ');
      },
      function() {
        ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Handles ㄞ');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
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
  ime.load();
});

test('Backspace key removes the last symbol.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;

  expect(15);
  var candidateId = 42;
  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', 'ㄊㄞˊˊ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Composition updates.');
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
      deepEqual(candidates, expectedCandidates.shift(),
        'Candidates equals to expected list.');
    };

    var nextActions = [
      function() {
        ok(ime.handleKeyEvent('ㄊ'.charCodeAt(0)), 'Handles ㄊ');
      },
      function() {
        ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Handles ㄞ');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
      },
      function() {
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Handles ˊ');
      },
      function() {
        ok(ime.handleKeyEvent(0x08), 'Handles Backspace');
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
  ime.load();
});

test('Don\'t handle Backspace key if there is no compositions.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.SPLIT_SOUND_TO_MATCH_PHRASES = false;

  expect(1);
  ime.onloadend = function() {
    ok(!ime.handleKeyEvent(0x08), 'Not handling backspace');
    setTimeout(function() {
      ime.unload();
      start();
    });
  };

  stop();
  ime.load();
});

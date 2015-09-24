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

test('query() a word with a completed sound', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
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

test('query() a two-word phrase with completed sounds', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
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

test('query() a three-word phrase with completed sounds', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇㄕˋ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
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

test('query() a three-word phrase with completed sounds, ' +
  'but set LONGEST_PHRASE_LENGTH to 2', function() {
  var ime = new JSZhuyin();
  ime.LONGEST_PHRASE_LENGTH = 2;
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇㄕˋ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['台北是', candidateId++],
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

test('query() with symbols exceeds MAX_SOUNDS_LENGTH' +
    ' (overflow candidate in phrases result)',
function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.MAX_SOUNDS_LENGTH = 2;
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇ';
    expect(4);
    var candidateId = 42;
    ime.updateComposition = function() {
      equal(ime.symbols, 'ㄊㄞˊㄅㄟˇ', 'Passed!');
    };
    ime.oncompositionend = function(composition) {
      ok(false, 'Should not be called.');
    };
    ime.oncandidateschange = function(results) {
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
      ime.symbols = 'ㄊㄞˊㄅㄟˇㄊㄞˊ';
      ime.updateComposition = function() {
        equal(ime.symbols, 'ㄊㄞˊ', 'Passed!');
      };
      ime.oncompositionend = function(composition) {
        equal(composition, '台北', 'Passed!');
      };
      ime.oncandidateschange = function(results) {
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
    ime.query();
  };

  stop();
  ime.load();
});

test('query() with symbols exceeds MAX_SOUNDS_LENGTH' +
    ' (overflow candidate in composed results)',
function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.MAX_SOUNDS_LENGTH = 5;
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇㄊㄞˊㄅㄟˇ';
    expect(4);
    var candidateId = 42;
    ime.updateComposition = function() {
      equal(ime.symbols, 'ㄊㄞˊㄅㄟˇㄊㄞˊㄕˋ', 'Passed!');
    };
    ime.oncompositionend = function(composition) {
      ok(false, 'Should not be called.');
    };
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['台北台北', candidateId++],
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
      ime.symbols = 'ㄊㄞˊㄅㄟˇㄊㄞˊㄊㄞˊㄊㄞˊㄕˋ';
      ime.updateComposition = function() {
        equal(ime.symbols, 'ㄊㄞˊㄊㄞˊㄊㄞˊㄕˋ', 'Passed!');
      };
      ime.oncompositionend = function(composition) {
        equal(composition, '台北', 'Passed!');
      };
      ime.oncandidateschange = function(results) {
        deepEqual(results,
          [['台台台是', candidateId++],
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

test('query() with symbols exceeds MAX_SOUNDS_LENGTH' +
    ' (overflow candidate in partial results)', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.MAX_SOUNDS_LENGTH = 5;
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇㄅㄟˊㄅㄟˊ';
    expect(4);
    var candidateId = 42;
    ime.updateComposition = function() {
      equal(ime.symbols, 'ㄊㄞˊㄅㄟˇㄅㄟˊㄅㄟˊ', 'Passed!');
    };
    ime.oncompositionend = function(composition) {
      ok(false, 'Should not be called.');
    };
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['台北ㄅㄟˊㄅㄟˊ', candidateId++],
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
      ime.symbols = 'ㄊㄞˊㄅㄟˇㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊ';
      ime.updateComposition = function() {
        equal(ime.symbols, 'ㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊ', 'Passed!');
      };
      ime.oncompositionend = function(composition) {
        equal(composition, '台北', 'Passed!');
      };
      ime.oncandidateschange = function(results) {
        deepEqual(results,
          [['ㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊ', candidateId++],
           ['ㄅㄟˊ', candidateId++]],
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

test('query() with symbols exceeds MAX_SOUNDS_LENGTH' +
    ' (overflow candidate in typo results)', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.MAX_SOUNDS_LENGTH = 5;
  ime.onloadend = function() {
    ime.symbols = 'ㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊ';
    expect(4);
    var candidateId = 42;
    ime.updateComposition = function() {
      equal(ime.symbols, 'ㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊ', 'Passed!');
    };
    ime.oncompositionend = function(composition) {
      ok(false, 'Should not be called.');
    };
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['ㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊ', candidateId++],
         ['ㄅㄟˊ', candidateId++]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.symbols = 'ㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊㄌㄨˊㄌㄨˊ';
      ime.updateComposition = function() {
        equal(ime.symbols, 'ㄅㄟˊㄅㄟˊㄅㄟˊㄌㄨˊㄌㄨˊ', 'Passed!');
      };
      ime.oncompositionend = function(composition) {
        equal(composition, 'ㄅㄟˊ', 'Passed!');
      };
      ime.oncandidateschange = function(results) {
        deepEqual(results,
          [['ㄅㄟˊㄅㄟˊㄅㄟˊㄌㄨˊㄌㄨˊ', candidateId++],
           ['ㄅㄟˊ', candidateId++]],
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
  ime.onloadend = function() {
    ime.symbols = 'ㄅㄟˇㄕˋ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
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

test('query() non-exist word with completed sounds', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄅㄟˊ';
    expect(1);
    ime.oncandidateschange = function(results) {
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

test('query() non-exist phrase with completed sounds at 0th place', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄅㄟˊㄊㄞˊ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['ㄅㄟˊ台', candidateId++],
         ['ㄅㄟˊ', candidateId++]],
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

test('query() non-exist phrase with completed sounds at 1st place', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˊ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
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

test('query() non-exist phrase with completed sounds', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄅㄟˊㄅㄟˊ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['ㄅㄟˊㄅㄟˊ', candidateId++],
         ['ㄅㄟˊ', candidateId++]],
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

test('query() non-exist phrase with completed sound at 0th & incomplete at 1st',
function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄅㄟˊㄌㄨ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['ㄅㄟˊㄌㄨ', candidateId++],
         ['ㄅㄟˊ', candidateId++]],
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

test('query() non-exist phrase with completed sound at 1th & incomplete at 0st',
function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄌㄨㄅㄟˊ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['ㄌㄨㄅㄟˊ', candidateId++]],
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

test('query() a word with one symbol', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄊ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
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

test('query() with one symbol that matches nothing', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄟ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['ㄟ', candidateId++]],
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

test('query() with two symbols that matches nothing', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄟㄟ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['ㄟㄟ', candidateId++]],
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

test('query() a phrase compose of symbols that could split differently',
function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇㄕㄨ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['台北市ㄨ', candidateId++],
         ['台北市', candidateId++],
         ['臺北市', candidateId++],
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

test('query() a phrase compose of symbols that could split differently' +
  ' (don\'t split a completed sound)',
function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.onloadend = function() {
    ime.symbols = 'ㄊㄞˊㄅㄟˇㄕㄨˇ';
    expect(1);
    var candidateId = 42;
    ime.oncandidateschange = function(results) {
      deepEqual(results,
        [['台北ㄕㄨˇ', candidateId++],
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

test('updateComposition()', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
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

test('Run a simple interactive query (set ㄞ and ㄚ interchangable).',
function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
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

test('Confirm text with Enter key.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
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

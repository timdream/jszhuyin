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
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
         ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
         ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
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
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['台北','పȳ'],
         ['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
         ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
         ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
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
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇㄕˋ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['台北市','పȳ∄'],['臺北市','పȳ∄'],['台北是','పȳ∄'],
         ['台北','పȳ'],
         ['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
         ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
         ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
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

test('query() with syllables exceeds MAX_SYLLABLES_LENGTH.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  ime.MAX_SYLLABLES_LENGTH = 3;
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇ';
    expect(4);
    ime.updateComposition = function() {
      equal(ime.syllables, 'ㄊㄞˊㄕˋ', 'Passed!');
    };
    ime.oncompositionend = function(composition) {
      equal(composition, '台北', 'Passed!');
    };
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['台北','పȳ'],
         ['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
         ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
         ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.syllables = 'ㄊㄞˊㄅㄟˇㄊㄞˊㄕˋ';
      ime.updateCandidates = function(results) {
        deepEqual(results,
          [['台是','ప∄'],
           ['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
           ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
           ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
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
    ime.syllables = 'ㄅㄟˇㄕˋ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['北是','ȳ∄'],['北','ȳ']],
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
    ime.syllables = 'ㄅㄟˊ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['ㄅㄟˊ','Ȳ']],
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
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˊ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [['台ㄅㄟˊ','పȲ'],
         ['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
         ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
         ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
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
    ime.syllables = 'ㄊㄞˊㄅㄟˇ';
    ime.updateComposition();
  };

  stop();
  ime.load();
});

test('updateCandidates()', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  expect(2);
  ime.oncandidateschange = function(results) {
    deepEqual(results,
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['薹','ప'],['嬯','ప'],['旲','ప'],
       ['炱','ప'],['儓','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      'Passed!');
    deepEqual(ime.defaultCandidate, ['台','ప'], 'Passed!');

    ime.unload();
    start();
  };
  ime.onloadend = function() {
    ime.updateCandidates([
       ['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['薹','ప'],['嬯','ప'],['旲','ప'],
       ['炱','ప'],['儓','ప'],['駘','ప'],['籉','ప'],['秮','ప']]);
  };

  stop();
  ime.load();
});

test('confirmCandidate()', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  expect(3);
  ime.oncompositionend = function(string) {
    equal(string, '台', 'Passed!');
  };
  ime.oncompositionupdate = function(composition) {
    equal(composition, 'ㄅㄟˇ', 'Passed!');
  };
  ime.query = function() {
    ok(true, 'Passed!');
    ime.unload();
    start();
  };
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇ';
    ime.confirmCandidate(['台','ప']);
  };

  stop();
  ime.load();
});

test('sendActionHandled()', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  expect(1);

  ime.onactionhandled = function(reqId) {
    equal(reqId, 1337, 'Passed!');
    ime.unload();

    start();
  };

  ime.onloadend = function() {
    ime.sendActionHandled(1337);
  };

  stop();
  ime.load();
});

test('Simple interactive query (send all keys in one action).', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  expect(9);

  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* 'ㄊㄞ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
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
        ok(ime.handleKeyEvent('ㄞ'.charCodeAt(0)), 'Passed!');
        ok(ime.handleKeyEvent('ˊ'.charCodeAt(0)), 'Passed!');
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

  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* 'ㄊㄞ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
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

  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄚ', 'ㄊㄚˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* 'ㄊㄞ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
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
        ok(ime.handleKeyEvent('ㄚ'.charCodeAt(0)), 'Passed!');
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

    ime.setConfig({ INTERCHANGABLE_PAIRS: 'ㄚㄞ' });
    (nextActions.shift())();
  };

  stop();
  ime.load();
});

test('Confirm text with Enter key.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
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
      /* 'ㄊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* 'ㄊㄞ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
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
  ime.load();
});

test('Confirm text with Enter key (set ㄞ and ㄚ interchangable).', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  expect(14);

  ime.onloadend = function() {
    ime.oncompositionend = function(str) {
      equal(str, '台', 'Passed!');
    };

    var expectedCompositions = ['ㄊ', 'ㄊㄚ', 'ㄊㄚˊ', ''];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* 'ㄊㄞ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
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
        ok(ime.handleKeyEvent('ㄚ'.charCodeAt(0)), 'Passed!');
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
    ime.setConfig({ INTERCHANGABLE_PAIRS: 'ㄚㄞ' });
    (nextActions.shift())();
  };

  stop();
  ime.load();
});

test('Confirm text with a non-Bopomofo key.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
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
      /* 'ㄊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* 'ㄊㄞ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
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
  ime.load();
});

test('Don\'t handle Enter key if there is no candidates.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';
  expect(1);

  ime.onloadend = function() {
    ok(!ime.handleKeyEvent(0x13), 'Passed!');
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
      /* 'ㄊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* 'ㄊㄞ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
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
  ime.load();
});

test('Backspace key cancels the last symbol.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';

  expect(15);
  ime.onloadend = function() {
    var expectedCompositions = ['ㄊ', 'ㄊㄞ', 'ㄊㄞˊ', 'ㄊㄞˊˊ', 'ㄊㄞˊ'];
    ime.oncompositionupdate = function(composition) {
      equal(composition, expectedCompositions.shift(), 'Passed!');
    };

    var expectedCandidates = [
      /* 'ㄊ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
      /* 'ㄊㄞ' */
      [['台','ప'],['臺','ప'],['抬','ప'],['颱','ప'],['檯','ప'],['苔','ప'],
       ['跆','ప'],['邰','ప'],['鮐','ప'],['旲','ప'],['炱','ప'],['嬯','ప'],
       ['儓','ప'],['薹','ప'],['駘','ప'],['籉','ప'],['秮','ప']],
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
  ime.load();
});

test('Don\'t handle Backspace key if there is no compositions.', function() {
  var ime = new JSZhuyin();
  ime.dataURL = './resources/testdata.data';

  expect(1);
  ime.onloadend = function() {
    ok(!ime.handleKeyEvent(0x08), 'Passed!');
    setTimeout(function() {
      ime.unload();
      start();
    });
  };

  stop();
  ime.load();
});

'use strict';


module('CacheStore');

test('add()', function() {
  var store = new CacheStore();
  store.add('Key1', ['value1', 'value2']);
  deepEqual(store.data['Key1'], ['value1', 'value2'], 'Passed!');
});

test('get()', function() {
  var store = new CacheStore();
  store.add('Key1', ['value1', 'value2']);
  deepEqual(store.get('Key1'), ['value1', 'value2'], 'Passed!');
});

test('cleanup()', function() {
  var store = new CacheStore();
  store.add('Key1', ['value1', 'value2']);
  store.add('Key2', ['value3', 'value4']);
  store.add('Key3', ['value5', 'value6']);

  store.cleanup('Key1Key3');

  deepEqual(store.get('Key1'), ['value1', 'value2'], 'Passed!');
  deepEqual(store.get('Key2'), undefined, 'Passed!');
  deepEqual(store.get('Key3'), ['value5', 'value6'], 'Passed!');
});

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

module('JSZhuyin', {
  teardown: function() {
    var IDB = IndexedDBStorage.prototype.IDB;
    var req = IDB.deleteDatabase('TestDatabase');
    req.onerror = function() {
      throw 'Teardown error';
    };
  }
});

test('create instance', function() {
  var ime = new JSZhuyin();
  ok(true, 'Passed!');
});

test('load()', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  expect(4);
  ime.onchunkload = ime.onpartlyloaded = ime.onload = function(status) {
    equal(status, ime.status, 'Passed!');
  };
  ime.onloadend = function(status) {
    equal(status, ime.status, 'Passed!');
    ime.unload();

    start();
  };

  stop();
  ime.load();
});

test('load() non-exist files', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['404.json'];
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
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
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

test('query() the same word twice', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊ';
    expect(4);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        'Passed!');
    };
    ime.cache.cleanup = function mockCleanup(supersetKey) {
      equal(supersetKey,
        BopomofoEncoder.encode('ㄊㄞˊ'), 'Passed!');
    };
    ime.queue.done = function() {
      var originalGet = ime.storage.get;
      ime.storage.get = function mockGet() {
        ok(false, 'storage.get() was called twice.');

        originalGet.apply(this, arguments);
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

test('query() a two-word phrase', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [["台北",2],
         ["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
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
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇㄕˋ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [["台北市",3],["臺北市",3],["台北是",3],
         ["台北",2],
         ["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
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
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
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
        [["台北",2],
         ["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.syllables = 'ㄊㄞˊㄅㄟˇㄊㄞˊㄕˋ';
      ime.updateCandidates = function(results) {
        deepEqual(results,
          [["台是",2],
           ["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
           ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
           ["儓",1],["駘",1],["籉",1]],
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
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄅㄟˇㄕˋ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [["北是",2],["北",1]],
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
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄅㄟˊ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [["ㄅㄟˊ",1]],
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
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˊ';
    expect(1);
    ime.updateCandidates = function(results) {
      deepEqual(results,
        [["台ㄅㄟˊ",2],
         ["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
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
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  expect(1);
  ime.oncompositionupdate = function(composition) {
    equal(composition, 'ㄊㄞˊㄅㄟˇ', 'Passed!');
    ime.unload();
    start();
  }
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇ';
    ime.updateComposition();
  };

  stop();
  ime.load();
});

test('updateCandidates()', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  expect(2);
  ime.oncandidateschange = function(results) {
    deepEqual(results,
      [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
       ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
       ["儓",1],["駘",1],["籉",1]],
      'Passed!');
    deepEqual(ime.defaultCandidate, ["台",1], 'Passed!');

    ime.unload();
    start();
  }
  ime.onloadend = function() {
    ime.updateCandidates([["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
     ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
     ["儓",1],["駘",1],["籉",1]]);
  };

  stop();
  ime.load();
});

test('confirmCandidate()', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
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
    ime.confirmCandidate(["台",1]);
  };

  stop();
  ime.load();
});

test('sendActionHandled()', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
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

test('Run a simple interactive query.', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
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
  ime.load();
});

test('Confirm text with Enter key.', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
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
  ime.load();
});

test('Confirm text with a non-Bopomofo key.', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
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
  ime.load();
});

test('Don\'t handle Enter key if there is no candidates.', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
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
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];

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
  ime.load();
});

test('Backspace key cancels the last symbol.', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];

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
  ime.load();
});

test('Don\'t handle Backspace key if there is no compositions.', function() {
  var ime = new JSZhuyin();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];

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

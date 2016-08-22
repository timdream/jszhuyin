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
  ime.dataURL = '/base/test/resources/testdata.data';
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
  ime.dataURL = '/base/test/resources/404.data';
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

test('updateComposition()', function() {
  var ime = new JSZhuyin();
  ime.dataURL = '/base/test/resources/testdata.data';
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

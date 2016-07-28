'use strict';

(function(factory) {
  if (typeof module === 'object' && module.exports) {
    // CommonJS
    factory(module.exports, {
      chai: require('chai')
    });
  } else if (typeof self === 'object') {
    // Window or WorkerGlobalScope
    if (typeof self.chai === 'undefined') {
        throw new Error('Dependency not found.');
      }
    factory(self, self);
  }
}(function(exports, required) {
  var assert = required.chai.assert;

  var TaskTest = exports.TaskTest = function() {
    this.candidateId = 42;
  };
  TaskTest.NAME = 'Type ㄊ,ㄞ,ˊ,Enter,Enter';
  TaskTest.prototype = {
    tasks: [
      {
        fn: 'handleKey',
        args: ['ㄊ'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: ['compositionupdate', 'candidateschange'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, 'ㄊ');
          assert.deepEqual(values.candidateschange,
            [['台', this.candidateId++], ['臺', this.candidateId++],
             ['抬', this.candidateId++], ['颱', this.candidateId++],
             ['檯', this.candidateId++], ['苔', this.candidateId++],
             ['跆', this.candidateId++], ['邰', this.candidateId++],
             ['鮐', this.candidateId++], ['駘', this.candidateId++],
             ['薹', this.candidateId++], ['籉', this.candidateId++],
             ['秮', this.candidateId++], ['炱', this.candidateId++],
             ['旲', this.candidateId++], ['嬯', this.candidateId++],
             ['儓', this.candidateId++]]);
        }
      },
      {
        fn: 'handleKey',
        args: ['ㄞ'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: ['compositionupdate', 'candidateschange'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, 'ㄊㄞ');
          assert.deepEqual(values.candidateschange,
            [['台', this.candidateId++], ['臺', this.candidateId++],
             ['抬', this.candidateId++], ['颱', this.candidateId++],
             ['檯', this.candidateId++], ['疼愛', this.candidateId++],
             ['苔', this.candidateId++], ['跆', this.candidateId++],
             ['邰', this.candidateId++], ['抬愛', this.candidateId++],
             ['鮐', this.candidateId++], ['駘', this.candidateId++],
             ['薹', this.candidateId++], ['籉', this.candidateId++],
             ['秮', this.candidateId++], ['炱', this.candidateId++],
             ['旲', this.candidateId++], ['嬯', this.candidateId++],
             ['儓', this.candidateId++]]);
        }
      },
      {
        fn: 'handleKey',
        args: ['ˊ'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: ['compositionupdate', 'candidateschange'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, 'ㄊㄞˊ');
          assert.deepEqual(values.candidateschange,
            [['台', this.candidateId++], ['臺', this.candidateId++],
             ['抬', this.candidateId++], ['颱', this.candidateId++],
             ['檯', this.candidateId++], ['苔', this.candidateId++],
             ['跆', this.candidateId++], ['邰', this.candidateId++],
             ['鮐', this.candidateId++], ['駘', this.candidateId++],
             ['薹', this.candidateId++], ['籉', this.candidateId++],
             ['秮', this.candidateId++], ['炱', this.candidateId++],
             ['旲', this.candidateId++], ['嬯', this.candidateId++],
             ['儓', this.candidateId++]]);
        }
      },
      {
        fn: 'handleKey',
        args: ['Enter'],
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: [
          'compositionupdate', 'candidateschange', 'compositionend'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, '');
          assert.deepEqual(values.candidateschange,
            [['北', 0],['北市', 0]]);
          assert.strictEqual(values.compositionend, '台');
        }
      },
      {
        fn: 'handleKey',
        args: ['Enter'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          // We are calling handleKey('Enter') twice in the same function
          // loop. This doesn't really happen in the real world for keys
          // triggered by keystrokes as we are protected by run-to completion
          // in the main thread.
          //
          // However, for JSZhuyinClient instances, this can triggered by the
          // user easily, because the state on the client can be out of sync
          // with the state of the server, so the key ended up handled but
          // later discarded.
          //
          // For JSZhuyin instances, this test is entirely artificial.
          // TaskRunner run this task on the onactionhandled callback
          // of the first handleKey('ˊ') task; the previous task has just
          // been queued and not even being processed!
          assert(returnedValue, 'Expected handled and discarded.');
        }
      }
    ]
  };
}));

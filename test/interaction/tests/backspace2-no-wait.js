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
  TaskTest.NAME = 'Type ˊ,Backspace,Backspace without waiting';
  TaskTest.prototype = {
    tasks: [
      {
        fn: 'handleKey',
        args: ['ˊ'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: ['compositionupdate', 'candidateschange'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, 'ˊ');
          assert.deepEqual(values.candidateschange,
            [['ˊ', this.candidateId++]]);
        }
      },
      {
        fn: 'handleKey',
        args: ['Backspace'],
        checkReturnedValue: function(returnedValue, jszhuyin) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: ['compositionupdate', 'candidateschange'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, '');
          assert.deepEqual(values.candidateschange,
            []);
        }
      },
      {
        fn: 'handleKey',
        args: ['Backspace'],
        wait: true,
        checkReturnedValue: function(returnedValue, jszhuyin) {
          // We are calling handleKey('Backspace') twice in the same function
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

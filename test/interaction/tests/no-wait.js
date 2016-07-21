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
  TaskTest.NAME = 'Type ㄊ,ㄞ,ˊ,Enter, without waiting';
  TaskTest.prototype = {
    tasks: [
      {
        fn: 'handleKey',
        args: ['ㄊ'],
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        }
      },
      {
        fn: 'handleKey',
        args: ['ㄞ'],
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        }
      },
      {
        fn: 'handleKey',
        args: ['ˊ'],
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        }
      },
      {
        fn: 'handleKey',
        args: ['Enter'],
        wait: true,
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
      }
    ]
  };
}));

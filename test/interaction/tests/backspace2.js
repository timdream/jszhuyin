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
  TaskTest.NAME = 'Type ˊ,Backspace,Backspace';
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
        wait: true,
        checkReturnedValue: function(returnedValue) {
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
        checkReturnedValue: function(returnedValue) {
          assert(!returnedValue, 'Expected unhandled.');
        }
      }
    ]
  };
}));

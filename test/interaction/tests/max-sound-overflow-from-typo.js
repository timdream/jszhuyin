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
  TaskTest.NAME =
    'Type ㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊ,ㄊ, with MAX_SOUNDS_LENGTH=4, ' +
    'overflows one phrase from the composed typo result.';
  TaskTest.prototype = {
    config: {
      MAX_SOUNDS_LENGTH: 4
    },
    tasks: [
      {
        fn: 'handleKey',
        args: ['ㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊ'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: ['compositionupdate', 'candidateschange'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, 'ㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊ');
          assert.deepEqual(values.candidateschange,
            [['ㄅㄟˊㄅㄟˊㄅㄟˊㄅㄟˊ', this.candidateId++],
             ['ㄅㄟˊ', this.candidateId++]]);
        }
      },
      {
        fn: 'handleKey',
        args: ['ㄊ'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks:
          ['compositionupdate', 'candidateschange', 'compositionend'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionend, 'ㄅㄟˊ');
          assert.strictEqual(values.compositionupdate, 'ㄅㄟˊㄅㄟˊㄅㄟˊㄊ');
          assert.deepEqual(values.candidateschange,
            [['ㄅㄟˊㄅㄟˊㄅㄟˊ台', this.candidateId++],
             ['ㄅㄟˊ', this.candidateId++]]);
        }
      }
    ]
  };
}));

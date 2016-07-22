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
  TaskTest.NAME = 'Type ㄅㄟˊㄊㄞˊ, first sound matches nothing';
  TaskTest.prototype = {
    tasks: [
      {
        fn: 'handleKey',
        args: ['ㄅㄟˊㄊㄞˊ'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: ['compositionupdate', 'candidateschange'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, 'ㄅㄟˊㄊㄞˊ');
          assert.deepEqual(values.candidateschange,
            [['ㄅㄟˊ台', this.candidateId++],
             ['ㄅㄟˊ', this.candidateId++]]);
        }
      }
    ]
  };
}));

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
  TaskTest.NAME = 'Type ㄅㄟˊㄌㄨ, matches nothing';
  TaskTest.prototype = {
    tasks: [
      {
        fn: 'handleKey',
        args: ['ㄅㄟˊㄌㄨ'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: ['compositionupdate', 'candidateschange'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, 'ㄅㄟˊㄌㄨ');
          assert.deepEqual(values.candidateschange,
            [['ㄅㄟˊㄌㄨ', this.candidateId++],
             ['ㄅㄟˊ', this.candidateId++]]);
        }
      }
    ]
  };
}));

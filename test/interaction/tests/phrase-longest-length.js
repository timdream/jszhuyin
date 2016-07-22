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
  TaskTest.NAME = 'Type ㄊㄞˊㄅㄟˇㄕˋ, with LONGEST_PHRASE_LENGTH=2';
  TaskTest.prototype = {
    config: {
      LONGEST_PHRASE_LENGTH: 2
    },
    tasks: [
      {
        fn: 'handleKey',
        args: ['ㄊㄞˊㄅㄟˇㄕˋ'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: ['compositionupdate', 'candidateschange'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, 'ㄊㄞˊㄅㄟˇㄕˋ');
          assert.deepEqual(values.candidateschange,
            [['台北是', this.candidateId++],
             ['台北', this.candidateId++],
             ['台', this.candidateId++], ['臺', this.candidateId++],
             ['抬', this.candidateId++], ['颱', this.candidateId++],
             ['檯', this.candidateId++], ['苔', this.candidateId++],
             ['跆', this.candidateId++], ['邰', this.candidateId++],
             ['鮐', this.candidateId++], ['駘', this.candidateId++],
             ['薹', this.candidateId++], ['籉', this.candidateId++],
             ['秮', this.candidateId++], ['炱', this.candidateId++],
             ['旲', this.candidateId++], ['嬯', this.candidateId++],
             ['儓', this.candidateId++]]);
        }
      }
    ]
  };
}));

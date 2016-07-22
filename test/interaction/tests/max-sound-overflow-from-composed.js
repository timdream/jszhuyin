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
    'Type ㄊㄞˊㄅㄟˇㄊㄞˊㄅㄟˇ,ㄊ, with MAX_SOUNDS_LENGTH=4, ' +
    'overflows one phrase from the composed result.';
  TaskTest.prototype = {
    config: {
      MAX_SOUNDS_LENGTH: 4
    },
    tasks: [
      {
        fn: 'handleKey',
        args: ['ㄊㄞˊㄅㄟˇㄊㄞˊㄅㄟˇ'],
        wait: true,
        checkReturnedValue: function(returnedValue) {
          assert(returnedValue, 'Expected handled.');
        },
        expectCallbacks: ['compositionupdate', 'candidateschange'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, 'ㄊㄞˊㄅㄟˇㄊㄞˊㄅㄟˇ');
          assert.deepEqual(values.candidateschange,
            [['台北台北', this.candidateId++],
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
          assert.strictEqual(values.compositionend, '台北');
          assert.strictEqual(values.compositionupdate, 'ㄊㄞˊㄅㄟˇㄊ');
          assert.deepEqual(values.candidateschange,
            [['台北台', this.candidateId++],
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

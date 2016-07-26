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
  TaskTest.NAME = 'Type ㄊㄞˊㄅㄟˇㄕˋ, select the phrase candidate.';
  TaskTest.prototype = {
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
            [['台北市', this.candidateId++],['臺北市', this.candidateId++],
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
        fn: 'selectCandidate',
        args: [['台北', 44]],
        wait: true,
        expectCallbacks: [
          'compositionupdate', 'candidateschange', 'compositionend'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, 'ㄕˋ');
          assert.deepEqual(values.candidateschange,
            [['是', this.candidateId++], ['事', this.candidateId++],
             ['市', this.candidateId++], ['式', this.candidateId++],
             ['示', this.candidateId++], ['視', this.candidateId++],
             ['世', this.candidateId++], ['士', this.candidateId++],
             ['識', this.candidateId++], ['試', this.candidateId++],
             ['勢', this.candidateId++], ['適', this.candidateId++],
             ['室', this.candidateId++], ['釋', this.candidateId++],
             ['飾', this.candidateId++], ['氏', this.candidateId++],
             ['逝', this.candidateId++], ['誓', this.candidateId++],
             ['仕', this.candidateId++], ['侍', this.candidateId++],
             ['嗜', this.candidateId++], ['拭', this.candidateId++],
             ['噬', this.candidateId++], ['柿', this.candidateId++],
             ['恃', this.candidateId++], ['筮', this.candidateId++],
             ['舐', this.candidateId++], ['軾', this.candidateId++],
             ['弒', this.candidateId++], ['媞', this.candidateId++],
             ['跩', this.candidateId++], ['螫', this.candidateId++],
             ['使', this.candidateId++], ['奭', this.candidateId++],
             ['豉', this.candidateId++], ['鯷', this.candidateId++],
             ['貰', this.candidateId++], ['齛', this.candidateId++],
             ['銴', this.candidateId++], ['鉽', this.candidateId++],
             ['鈰', this.candidateId++], ['遾', this.candidateId++],
             ['謚', this.candidateId++], ['諡', this.candidateId++],
             ['諟', this.candidateId++], ['詍', this.candidateId++],
             ['襫', this.candidateId++], ['褆', this.candidateId++],
             ['衋', this.candidateId++], ['翨', this.candidateId++],
             ['簭', this.candidateId++], ['烒', this.candidateId++],
             ['澨', this.candidateId++], ['揓', this.candidateId++],
             ['戺', this.candidateId++], ['戠', this.candidateId++],
             ['徥', this.candidateId++], ['崼', this.candidateId++],
             ['唑', this.candidateId++]]);
          assert.strictEqual(values.compositionend, '台北');
        }
      },
      {
        fn: 'selectCandidate',
        args: [['士', 69]],
        wait: true,
        expectCallbacks: [
          'compositionupdate', 'candidateschange', 'compositionend'],
        checkCallbackValues: function(values) {
          assert.strictEqual(values.compositionupdate, '');
          assert.deepEqual(values.candidateschange, []);
          assert.strictEqual(values.compositionend, '士');
        }
      }
    ]
  };
}));

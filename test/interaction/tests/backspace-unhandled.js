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
  };
  TaskTest.NAME = 'Type Backspace';
  TaskTest.prototype = {
    tasks: [
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

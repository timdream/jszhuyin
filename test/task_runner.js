'use strict';

(function(factory) {
  if (typeof module === 'object' && module.exports) {
    // CommonJS
    factory(module.exports, {
    });
  } else if (typeof self === 'object') {
    // Window or WorkerGlobalScope
    factory(self, self);
  }
}(function(exports, required) {

var TaskRunner =
exports.TaskRunner =
function TaskRunner(jszhuyin) {
  this.jszhuyin = jszhuyin;
};

TaskRunner.prototype = {
  run: function(taskTask) {
    if (this.tasks && this.tasks.length) {
      throw new Error('Task is running.');
    }

    this.taskTask = taskTask;
    this.tasks = taskTask.tasks;
    this._runTask();
  },

  _throwOnExec: function() {
    throw new Error('Should not execute again.');
  },

  _runTask: function() {
    var task = this.tasks.shift();
    if (!task) {
      this.taskTask = null;
      this.tasks = null;
      if (typeof this.ondone === 'function') {
        this.ondone();
      }
      return;
    }

    if (task.fn) {
      var wait = task.wait;
      var callbackValues;
      if (wait) {
        this.jszhuyin.onactionhandled = function() {
          this.jszhuyin.onactionhandled = null;
          if (callbackValues) {
            task.expectCallbacks.forEach(function(cbName) {
              this.jszhuyin['on' + cbName] = null;
            }.bind(this));
            task.checkCallbackValues
              .call(this.taskTask, callbackValues, this.jszhuyin);
          }
          this._runTask();
        }.bind(this);

        if (task.expectCallbacks) {
          callbackValues = {};
          task.expectCallbacks.forEach(function(cbName) {
            this.jszhuyin['on' + cbName] = function(val) {
              this.jszhuyin['on' + cbName] = this._throwOnExec.bind(this);
              callbackValues[cbName] = val;
            }.bind(this);
          }.bind(this));
        }
      }

      var returnValue =
        this.jszhuyin[task.fn].apply(this.jszhuyin, task.args);

      if (task.checkReturnedValue) {
        task.checkReturnedValue
          .call(this.taskTask, returnValue, this.jszhuyin);
      }

      if (wait) {
        return;
      }
    } else if (task.exec) {
      task.exec(this.jszhuyin);
    } else {
      throw new Error('Unknown task description.');
    }
    this._runTask();
  }
};

}));

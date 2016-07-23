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
  DETECT_CALLBACKS: [
    'compositionupdate', 'candidateschange', 'compositionend'],

  run: function(taskTest) {
    if (this.tasks && this.tasks.length) {
      throw new Error('Task is running.');
    }

    this.taskTest = taskTest;
    this.tasks = [].concat(taskTest.tasks);
    this._runTask();
  },

  _throwOnExec: function(cbName) {
    throw new Error(cbName + ' callback should not execute.');
  },

  _runTask: function() {
    var task = this.tasks.shift();
    if (!task) {
      this.taskTest = null;
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
            this.DETECT_CALLBACKS.forEach(function(cbName) {
              this.jszhuyin['on' + cbName] = null;
            }.bind(this));
            task.checkCallbackValues
              .call(this.taskTest, callbackValues, this.jszhuyin);
          }
          this._runTask();
        }.bind(this);

        if (task.expectCallbacks) {
          callbackValues = {};
          task.expectCallbacks.forEach(function(cbName) {
            if (this.DETECT_CALLBACKS.indexOf(cbName) === -1) {
              throw new Error('You cannot detect ' + cbName +
                ' in the task runner steps.');
            }

            this.jszhuyin['on' + cbName] = function(val) {
              this.jszhuyin['on' + cbName] =
                this._throwOnExec.bind(this, cbName);
              callbackValues[cbName] = val;
            }.bind(this);
          }.bind(this));

          this.DETECT_CALLBACKS
            .filter(function(cbName) {
              return (task.expectCallbacks.indexOf(cbName) === -1);
            }.bind(this))
            .forEach(function(cbName) {
              this.jszhuyin['on' + cbName] =
                this._throwOnExec.bind(this, cbName);
            }.bind(this));
        }
      }

      var returnValue =
        this.jszhuyin[task.fn].apply(this.jszhuyin, task.args);

      if (task.checkReturnedValue) {
        task.checkReturnedValue
          .call(this.taskTest, returnValue, this.jszhuyin);
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

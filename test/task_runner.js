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
    this.numWaitActionHandled = 0;
    this.reqIds = [];
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

      if (this.reqIds.length) {
        throw new Error('TaskRunner: Task finished but with pending actions.');
      }

      if (typeof this.ondone === 'function') {
        this.ondone();
      }
      return;
    }

    var taskReqId = Math.random().toString(32).substr(2);
    this.reqIds.push(taskReqId);

    if (task.fn) {
      var wait = task.wait;
      var waitCount = (typeof wait === 'number') ? wait : 1;

      var callbackValues;
      if (wait) {
        waitCount -= this.numWaitActionHandled;
        this.numWaitActionHandled = 0;

        this.jszhuyin.onactionhandled = function(returnedReqId) {
          var expectedReqId = this.reqIds.shift();
          if (returnedReqId !== expectedReqId) {
            throw new Error('TaskRunner: unexpected reqId.');
          }
          waitCount--;
          if (waitCount) {
            return;
          }
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

            this.jszhuyin['on' + cbName] = function(val, returnedReqId) {
              if (waitCount !== 1) {
                return;
              }

              if (returnedReqId !== taskReqId) {
                throw new Error('TaskRunner: unexpected reqId.');
              }

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
      } else {
        this.jszhuyin.onactionhandled = function(returnedReqId) {
          var expectedReqId = this.reqIds.shift();
          if (returnedReqId !== expectedReqId) {
            throw new Error('TaskRunner: unexpected reqId.');
          }
          this.jszhuyin.onactionhandled = null;
          this.numWaitActionHandled++;
        }.bind(this);
      }

      var args = [].concat(task.args, taskReqId);

      var returnValue =
        this.jszhuyin[task.fn].apply(this.jszhuyin, args);

      if (returnValue === false) {
        var poppedReqId = this.reqIds.pop();
        if (poppedReqId !== taskReqId) {
          throw new Error('TaskRunner: function ' + task.fn +
            ' report unhandled but action was handled.');
        }
      }

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

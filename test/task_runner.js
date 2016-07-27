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
    this.taskDataArr = [];

    this.DETECT_CALLBACKS
      .forEach(function(cbName) {
        this.jszhuyin['on' + cbName] = function(val, reqId) {
          var taskData = this.taskDataArr[0];
          if (!taskData || taskData.reqId !== reqId) {
            throw new Error(
              'TaskRunner: Unknown or misordered reqId: ' + reqId);
          }
          if (!taskData.task.expectCallbacks ||
              taskData.task.expectCallbacks.indexOf(cbName) === -1) {
            throw new Error('TaskRunner: ' + cbName + ' should not call.');
          }

          if (cbName in taskData.callbackValues) {
            throw new Error('TaskRunner: ' + cbName + ' called twice.');
          }

          taskData.callbackValues[cbName] = val;
        }.bind(this);
      }.bind(this));

    this.jszhuyin.onactionhandled = function(returnedReqId) {
      var taskData = this.taskDataArr.shift();
      if (!taskData || returnedReqId !== taskData.reqId) {
        throw new Error('TaskRunner: unexpected reqId.');
      }
      if (taskData.callbackValues) {
        taskData.task.checkCallbackValues
          .call(this.taskTest, taskData.callbackValues, this.jszhuyin);
      }
      if (taskData.task.wait) {
        this._runTask();
      }
    }.bind(this);

    this._runTask();
  },

  _runTask: function() {
    var task = this.tasks.shift();
    if (!task) {
      this.taskTest = null;
      this.tasks = null;

      if (this.taskDataArr.length) {
        throw new Error('TaskRunner: Task finished but with pending actions.');
      }

      this.jszhuyin.onactionhandled = null;
      this.DETECT_CALLBACKS
        .forEach(function(cbName) {
          this.jszhuyin['on' + cbName] = null;
        }.bind(this));

      if (typeof this.ondone === 'function') {
        this.ondone();
      }
      return;
    }

    var taskReqId = Math.random().toString(32).substr(2);
    var taskData = { task: task, callbackValues: {}, reqId: taskReqId };
    this.taskDataArr.push(taskData);

    if (task.fn) {
      var args = [].concat(task.args, taskReqId);

      var returnValue =
        this.jszhuyin[task.fn].apply(this.jszhuyin, args);

      if (returnValue === false) {
        var poppedTaskData = this.taskDataArr.pop();
        if (poppedTaskData !== taskData) {
          throw new Error('TaskRunner: function ' + task.fn +
            ' report unhandled but action was handled.');
        }
      }

      if (task.checkReturnedValue) {
        task.checkReturnedValue
          .call(this.taskTest, returnValue, this.jszhuyin);
      }

      if (task.wait) {
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

'use strict';

/* global JSZhuyin */

// JSZhuyinServer provides a postMessage interface to communicate
// with JSZhuyin.
var JSZhuyinServer = {
  engine: null,
  messageTarget: self.opener || self.parent || self,
  load: function w_load() {
    self.addEventListener('message', this);

    // The warning is here so that people hotlink to GitHub can see it.
    if (typeof window === 'object') {
      console.warn('[JSZhuyin] 不建議使用 iframe 方式載入 JS 注音，請改用 worker。');
    }

    var engine = this.engine = new JSZhuyin();
    // Everything that reached the server must be handled,
    // even if it's discarded.
    engine.MUST_HANDLE_ALL_KEYS = true;
    (['loadend',
      'load',
      'error',
      'unload',
      'downloadprogress',
      'compositionupdate',
      'compositionend',
      'candidateschange',
      'actionhandled']).forEach((function attachCallback(type) {
        engine['on' + type] = this.getSender(type);
      }).bind(this));
  },
  getSender: function w_getSender(type) {
    return this.sendMessage.bind(this, type);
  },
  handleEvent: function w_handleEvent(evt) {
    var msg = evt.data;
    if (msg.sender === 'worker') {
      return;
    }

    if (typeof this.engine[msg.type] !== 'function') {
      throw new Error('Unknown message type: ' + msg.type);
    }

    this.engine[msg.type](msg.data, msg.requestId);
  },
  sendMessage: function w_sendMessage(type, data, reqId) {
    if (typeof Error !== 'undefined' && data instanceof Error) {
      data = {
        name: data.name,
        message: data.message,
        stack: data.stack,
        fileName: data.fileName,
        lineNumber: data.lineNumber
      };
    }

    if (typeof window === 'object') {
      this.messageTarget.postMessage(
        { 'type': type, 'data': data,
          'requestId': reqId, 'sender': 'worker' }, '*');
    } else {
      this.messageTarget.postMessage(
        { 'type': type, 'data': data, 'requestId': reqId });
    }
  }
};

JSZhuyinServer.load();

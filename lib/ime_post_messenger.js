'use strict';

// IMEPostMessager provides a postMessage interface to communicate
// with JSZhuyinIME.
var IMEPostMessager = {
  ALLOW_EXTERNAL_CONFIG:
    ['IDB_NAME', 'IDB_VERSION', 'JSON_FILES', 'JSON_URL', 'USE_IDB'],
  engine: null,
  messageTarget: self.opener || self.parent || self,
  TYPE_LOAD: 0x4,
  TYPE_CONFIG: 0x5,
  TYPE_UNLOAD: 0x6,
  load: function w_load() {
    self.addEventListener('message', this);

    var engine = this.engine = new JSZhuyinIME();
    engine.onpartlyloaded = this.getSender('partlyloaded');
    engine.onloadend = this.getSender('loadend');
    engine.onload = this.getSender('load');
    engine.onerror = this.getSender('error');
    engine.onunload = this.getSender('unload');
    engine.oncompositionupdate = this.getSender('compositionupdate');
    engine.oncompositionend = this.getSender('compositionend');
    engine.oncandidateupdate = this.getSender('candidateupdate');
    engine.onactionhandled = this.getSender('actionhandled');
  },
  getSender: function w_getSender(type) {
    var self = this;
    return function w_sender(data, reqId) {
      self.sendMessage(type, data, reqId);
    };
  },
  handleEvent: function w_handleEvent(evt) {
    var msg = evt.data;
    if (msg['sender'] === 'worker')
      return;

    switch (msg['type']) {
      case this.TYPE_LOAD:
        this.engine.load();

        break;

      case this.TYPE_CONFIG:
        var data = msg['data'];
        for (var key in msg['data']) {
          if (this.ALLOW_EXTERNAL_CONFIG.indexOf(key) === -1)
            continue;

          this.engine[key] = data[key];
        }

        break;

      case this.TYPE_UNLOAD:
        this.engine.unload();

        break;

      default:
        this.engine.handleAction(msg['type'], msg['data'], msg['requestId']);

        break;
    }
  },
  sendMessage: function w_sendMessage(type, data, reqId) {
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

IMEPostMessager.load();

'use strict';

// This script implements the user-facing JSZhuyin API.
// It loads the scripts for you (via iframe or worker).

/**
 * JSZhuyinLoader is the base prototype of the loaders.
 */
var JSZhuyinLoader = function JSZhuyinLoader() { };

/**
 * Load JSZhuyinIME in a iframe.
 * @param {string} url URL to iframe.
 */
var JSZhuyinIframeLoader = function JSZhuyinIframeLoader(url) {
  if (url)
    this.IFRAME_URL = url;
};
JSZhuyinIframeLoader.prototype = new JSZhuyinLoader();
/**
 * Run when the frame is loaded.
 * @type {function}
 */
JSZhuyinIframeLoader.prototype.onload = null;
JSZhuyinIframeLoader.prototype.onmessage = null;
JSZhuyinIframeLoader.prototype.IFRAME_URL = './lib/frame.html';
JSZhuyinIframeLoader.prototype.load = function jif_load(iframe) {
  iframe = this.iframe = iframe || document.createElement('iframe');
  iframe.src = this.IFRAME_URL;

  iframe.addEventListener('load', this);
  iframe.addEventListener('error', this);
  window.addEventListener('message', this);

  document.body.appendChild(iframe);
};
JSZhuyinIframeLoader.prototype.unload = function jif_unload() {
  document.body.removeChild(this.iframe);

  var iframe = this.iframe;
  this.iframe = undefined;
  iframe.removeEventListener('load', this);
  iframe.removeEventListener('error', this);
  window.removeEventListener('message', this);
};
JSZhuyinIframeLoader.prototype.sendMessage = function jif_sendMessage(message) {
  var contentWindow = this.iframe.contentWindow;
  if (!contentWindow) {
    throw 'Loader not ready yet.';
  }

  contentWindow.postMessage(message, '*');
};
JSZhuyinIframeLoader.prototype.handleEvent = function jif_handleEvent(evt) {
  var iframe = this.iframe;
  switch (evt.type) {
    case 'load':
      iframe.removeEventListener('load', this);

      if (typeof this.onload === 'function')
        this.onload();

      break;

    case 'error':
      throw 'JSZhuyinIframeLoader: Iframe loading error. Network failure?';

      break;

    case 'message':
      if (!this.iframe || evt.source !== this.iframe.contentWindow)
        break;

      if (typeof this.onmessage === 'function')
        this.onmessage(evt.data);

      break;
  }
};

/**
 * Load JSZhuyinIME in a worker.
 * @param {string} url URL to iframe.
 */
var JSZhuyinWorkerLoader = function JSZhuyinWorkerLoader(url) {
  if (url)
    this.WORKER_URL = url;
};
/**
 * Run when the frame is loaded.
 * @type {function}
 */
JSZhuyinWorkerLoader.prototype = new JSZhuyinLoader();
JSZhuyinWorkerLoader.prototype.onload = null;
JSZhuyinWorkerLoader.prototype.onmessage = null;
JSZhuyinWorkerLoader.prototype.WORKER_URL = './lib/worker.js';
JSZhuyinWorkerLoader.prototype.load = function jiw_load(worker) {
  worker = this.worker = worker || new Worker(this.WORKER_URL);
  worker.addEventListener('error', this);
  worker.addEventListener('message', this);

  if (typeof this.onload === 'function')
    this.onload();
};
JSZhuyinWorkerLoader.prototype.unload = function jiw_unload() {
  var worker = this.worker;
  this.worker = undefined;
  worker.removeEventListener('error', this);
  worker.removeEventListener('message', this);
};
JSZhuyinWorkerLoader.prototype.sendMessage = function jiw_sendMessage(message) {
  if (!this.worker) {
    throw 'Loader not ready yet.';
  }

  this.worker.postMessage(message);
};
JSZhuyinWorkerLoader.prototype.handleEvent = function jiw_handleEvent(evt) {
  switch (evt.type) {
    case 'error':
      throw 'JSZhuyinWorkerLoader: Worker loading error. Network failure?';

      break;

    case 'message':
      if (typeof this.onmessage === 'function')
        this.onmessage(evt.data);

      break;
  }
};

/**
 * Start-up a new JSZhuyin instance.
 * @param {object}  config      Configuration to send to JSZhuyinIME.
 * @param {object}  loader      A JSZhuyinLoader instance, should be either
 *                              a JSZhuyinIframeLoader instance or
 *                              a JSZhuyinWorkerLoader instance.
 * @this  {object}              JSZhuyin instance.
 */
var JSZhuyin = function JSZhuyin(config, loader) {
  if (!(loader instanceof JSZhuyinLoader))
    throw 'No JSZhuyinLoader specified.';

  this.loader = loader;
  loader.onmessage = this.handleMessage.bind(this);
  loader.onload = this.loadIME.bind(this, config);
  loader.load();

  this.loaded = true;

  // Ideally we should be able to block keyboard input while
  // a key is being handled, but it's not possible to do so in
  // the browser along.
  // We do the next best thing here: track the state of composition and
  // candidate and block Return and Backspace keys.
  this.requestId = 0;
  this.handledRequestId = 0;

  this.compositionCount = 0;
  this.hasCandidates = false;
};
/**
 * Run once when the initial chunk of data is available.
 * @type {function}
 */
JSZhuyin.prototype.onpartlyloaded = null;
/**
 * Run when the loading is complete.
 * @type {function}
 */
JSZhuyin.prototype.onloadend = null;
/**
 * Run when loading is successful.
 * @type {function}
 */
JSZhuyin.prototype.onload = null;
/**
 * Run when unload.
 * @type {function}
 */
JSZhuyin.prototype.onunload = null;
/**
 * Run when error occours.
 * @type {function}
 */
JSZhuyin.prototype.onerror = null;
/**
 * Callback to call when the composition updates.
 * @type {function}
 */
JSZhuyin.prototype.oncompositionupdate = null;
/**
 * Callback to call when the composition ends.
 * @type {function}
 */
JSZhuyin.prototype.oncompositionend = null;
/**
 * Callback to call when candidate menu updates.
 * @type {function}
 */
JSZhuyin.prototype.oncandidateupdate = null;
/**
 * Callback to call when an async handleKeyEvent() finally finshes.
 * @type {function}
 */
JSZhuyin.prototype.onactionhandled = null;
/**
 * Unload JSZhuyin.
 */
JSZhuyin.prototype.unload = function jsz_unload() {
  this.unloadIME();
  this.loaded = false;
};
/**
 * Uninstall JSZhuyinIME.
 */
JSZhuyin.prototype.uninstall = function jsz_uninstall() {
  // This message implies UNLOAD.
  this.sendMessage(
    this.MSG_TYPE_INPUT_SPECIAL, this.MSG_DATA_SPECIAL_UNINSTALL);

  this.loaded = false;
};
JSZhuyin.prototype.sendMessage = function jsz_sendMessage(type, data, reqId) {
  this.loader.sendMessage({ 'type': type, 'data': data, 'requestId': reqId });
};
JSZhuyin.prototype.handleKeyEvent = function jsz_handleKeyEvent(keyCode) {
  var BOPOMOFO_START = 0x3105;
  var BOPOMOFO_END = 0x3129;
  var BOPOMOFO_TONE_1 = 0x0020;
  var BOPOMOFO_TONE_2 = 0x02ca;
  var BOPOMOFO_TONE_3 = 0x02c7;
  var BOPOMOFO_TONE_4 = 0x02cb;
  var BOPOMOFO_TONE_5 = 0x02d9;

  if (keyCode >= BOPOMOFO_START && keyCode <= BOPOMOFO_END) {
    this.compositionCount++;
    this.sendMessage(this.MSG_TYPE_INPUT_SYMBOL,
      String.fromCharCode(keyCode), ++this.requestId);
    return true;
  }

  switch (keyCode) {
    case BOPOMOFO_TONE_1:
    case BOPOMOFO_TONE_2:
    case BOPOMOFO_TONE_3:
    case BOPOMOFO_TONE_4:
    case BOPOMOFO_TONE_5:
      this.compositionCount++;
      this.sendMessage(this.MSG_TYPE_INPUT_SYMBOL,
        String.fromCharCode(keyCode), ++this.requestId);

      return true;

    case this.MSG_DATA_SPECIAL_BACK_SPACE:
      if (!this.compositionCount)
        return false;

      if (this.requestId !== this.handledRequestId)
        return true; // Block the Backspace key.

      this.compositionCount--;
      this.sendMessage(
        this.MSG_TYPE_INPUT_SPECIAL, keyCode, ++this.requestId);
      return true;

    case this.MSG_DATA_SPECIAL_RETURN:
      if (!this.hasCandidates)
        return false;

      if (this.requestId !== this.handledRequestId)
        return true; // Block the Enter key.

      this.hasCandidates = false;
      this.sendMessage(this.MSG_TYPE_INPUT_SPECIAL,
        keyCode, ++this.requestId);
      return true;

    case this.MSG_DATA_SPECIAL_ESCAPE:
      if (this.hasCandidates || this.compositionCount)
        return false;

      if (this.requestId !== this.handledRequestId)
        return true; // Block the Escape key.

      this.compositionCount = 0;
      this.hasCandidates = false;
      this.sendMessage(this.MSG_TYPE_INPUT_SPECIAL,
        keyCode, ++this.requestId);

    default:
      return false;
  }
};
JSZhuyin.prototype.handleMessage = function jsz_handleMessage(msg) {
  switch (msg['type']) {
    case 'actionhandled':
      this.handledRequestId = msg['data'];

      break;

    case 'candidateupdate':
      this.hasCandidates = !!msg['data'].length;

      break;

    case 'compositionupdate':
      this.compositionCount = msg['data'].length;

      break;

    case 'unload':
      if (!this.loaded) {
        this.loader.unload();
      }

      break;

    case 'partlyloaded':
    case 'loadend':
    case 'load':
    case 'error':
    case 'compositionend':
      break;

    default:
      throw 'JSZhuyin: Receive unknown message ' + msg['type'] + ' from frame.';
  }

  if (typeof this['on' + msg['type']] === 'function')
    this['on' + msg['type']](msg['data']);
};
JSZhuyin.prototype.confirmSelection = function jsz_confirmSelection(sel) {
  this.sendMessage(this.MSG_TYPE_CANDIDATE_SELECTION, sel);
};
/**
 * Load JSZhuyinIME with given config.
 * @param  {object} config The config object.
 */
JSZhuyin.prototype.loadIME = function jsz_loadIME(config) {
  this.sendMessage(this.MSG_TYPE_CONFIG, config);
  this.sendMessage(this.MSG_TYPE_LOAD);
};
/**
 * Unload JSZhuyinIME.
 */
JSZhuyin.prototype.unloadIME = function jsz_unload() {
  this.sendMessage(this.MSG_TYPE_UNLOAD);
};
/**
 * Add another Bopomofo symbol into the composition.
 * @type {Number}
 */
JSZhuyin.prototype.MSG_TYPE_INPUT_SYMBOL = 0x1;
/**
 * Do a special action.
 * The data passed to handleAction() should be one of
 * the MSG_DATA_SPECIAL_* constant.
 * @type {Number}
 */
JSZhuyin.prototype.MSG_TYPE_INPUT_SPECIAL = 0x2;
/**
 * Respond to user selection of a candidate.
 * @type {Number}
 */
JSZhuyin.prototype.MSG_TYPE_CANDIDATE_SELECTION = 0x3;
/**
 * Remove the last symbol from the compositions.
 * @type {Number}
 */
JSZhuyin.prototype.MSG_TYPE_LOAD = 0x4;
JSZhuyin.prototype.MSG_TYPE_CONFIG = 0x5;
JSZhuyin.prototype.MSG_TYPE_UNLOAD = 0x6;
JSZhuyin.prototype.MSG_DATA_SPECIAL_BACK_SPACE = 0x08;
/**
 * Respond to user pressing the 'enter' key.
 * @type {Number}
 */
JSZhuyin.prototype.MSG_DATA_SPECIAL_RETURN = 0x0d;
/**
 * Respond to user pressing the 'escape' key.
 * @type {Number}
 */
JSZhuyin.prototype.MSG_DATA_SPECIAL_ESCAPE = 0x1b;
/**
 * Uninstall ourselve and remove the presistent database.
 * @type {Number}
 */
JSZhuyin.prototype.MSG_DATA_SPECIAL_UNINSTALL = 0x2421;

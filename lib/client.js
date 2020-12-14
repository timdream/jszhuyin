'use strict';

// This script implements the user-facing JSZhuyin API.
// It loads the scripts for you (via iframe or worker).

/**
 * JSZhuyinServerLoader is the base prototype of the loaders.
 */
var JSZhuyinServerLoader = function JSZhuyinServerLoader() { };

/**
 * Load JSZhuyin in a iframe.
 * @param {string} url URL to iframe.
 * @constructor
 */
var JSZhuyinServerIframeLoader = function JSZhuyinServerIframeLoader(url) {
  if (url) {
    this.IFRAME_URL = url;
  }
};
JSZhuyinServerIframeLoader.prototype = new JSZhuyinServerLoader();
/**
 * Run when the frame is loaded.
 * @type {function}
 */
JSZhuyinServerIframeLoader.prototype.onload = null;
/**
 * Run when the frame throw error.
 * @type {function}
 */
JSZhuyinServerIframeLoader.prototype.onerror = null;
/**
 * Run when the frame posts a message.
 * @type {function}
 */
JSZhuyinServerIframeLoader.prototype.onmessage = null;
/**
 * The class name for iframe we created.
 * @type {string}
 */
JSZhuyinServerIframeLoader.prototype.IFRAME_CLASSNAME = 'jszhuyin';
/**
 * URL of the frame.
 * @type {string}
 */
JSZhuyinServerIframeLoader.prototype.IFRAME_URL = './lib/frame.html';
/**
 * Load the iframe.
 * @param  {DOMIframeElement} iframe The iframe to use.
 * @this   {object}                  JSZhuyinServerIframeLoader instance.
 */
JSZhuyinServerIframeLoader.prototype.load = function jif_load(iframe) {
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.className = this.IFRAME_CLASSNAME;
  }
  this.iframe = iframe;
  iframe.src = this.IFRAME_URL;

  iframe.addEventListener('load', this);
  iframe.addEventListener('error', this);
  window.addEventListener('message', this);

  if (!iframe.parentNode) {
    document.body.appendChild(iframe);
  }
};
/**
 * Unload the iframe and ourselves.
 * @this   {object}  JSZhuyinServerIframeLoader instance.
 */
JSZhuyinServerIframeLoader.prototype.unload = function jif_unload() {
  document.body.removeChild(this.iframe);

  var iframe = this.iframe;
  this.iframe = undefined;
  iframe.removeEventListener('load', this);
  iframe.removeEventListener('error', this);
  window.removeEventListener('message', this);
};
/**
 * Post a message to the iframe.
 * @param  {any}    message  The message to send.
 * @this   {object}          JSZhuyinServerIframeLoader instance.
 */
JSZhuyinServerIframeLoader.prototype.sendMessage =
  function jif_sendMessage(message) {
    var contentWindow = this.iframe.contentWindow;
    if (!contentWindow) {
      throw new Error('Loader not ready yet.');
    }

    contentWindow.postMessage(message, '*');
  };
/**
 * Event handler function to be called by event handler interface.
 * @param  {DOMEvent} evt Event object.
 * @this   {object}       JSZhuyinServerIframeLoader instance.
 */
JSZhuyinServerIframeLoader.prototype.handleEvent =
  function jif_handleEvent(evt) {
    var iframe = this.iframe;
    switch (evt.type) {
      case 'load':
        iframe.removeEventListener('load', this);

        if (typeof this.onload === 'function') {
          this.onload();
        }

        break;

      case 'error':
        if (typeof this.onerror === 'function') {
          this.onerror(evt);
        }

        break;

      case 'message':
        if (!this.iframe || evt.source !== this.iframe.contentWindow) {
          break;
        }

        if (typeof this.onmessage === 'function') {
          this.onmessage(evt.data);
        }

        break;
    }
  };

/**
 * Load JSZhuyin in a worker.
 * @param  {string} url  URL to iframe.
 * @this   {object}      JSZhuyinServerIframeLoader instance.
 */
var JSZhuyinServerWorkerLoader = function JSZhuyinServerWorkerLoader(url) {
  if (url) {
    this.WORKER_URL = url;
  }
};
JSZhuyinServerWorkerLoader.prototype = new JSZhuyinServerLoader();
/**
 * Run when the worker is loaded.
 * @type {function}
 */
JSZhuyinServerWorkerLoader.prototype.onload = null;
/**
 * Run when the frame throw error.
 * @type {function}
 */
JSZhuyinServerWorkerLoader.prototype.onerror = null;
/**
 * Run when the worker posts a message.
 * @type {function}
 */
JSZhuyinServerWorkerLoader.prototype.onmessage = null;
/**
 * URL of the worker script.
 * @type {string}
 */
JSZhuyinServerWorkerLoader.prototype.WORKER_URL = './lib/worker.js';
/**
 * Load the worker.
 * @param  {Worker} worker The worker to use.
 * @this   {object}        JSZhuyinServerWorkerLoader instance.
 */
JSZhuyinServerWorkerLoader.prototype.load = function jiw_load(worker) {
  worker = this.worker = worker || new Worker(this.WORKER_URL);
  worker.addEventListener('error', this);
  worker.addEventListener('message', this);

  if (typeof this.onload === 'function') {
    this.onload();
  }
};
/**
 * Unload the worker and ourselves.
 * @this   {object}  JSZhuyinServerWorkerLoader instance.
 */
JSZhuyinServerWorkerLoader.prototype.unload = function jiw_unload() {
  var worker = this.worker;
  this.worker = undefined;
  worker.removeEventListener('error', this);
  worker.removeEventListener('message', this);
};
/**
 * Post a message to the worker.
 * @param  {any}    message  The message to send.
 * @this   {object}          JSZhuyinServerWorkerLoader instance.
 */
JSZhuyinServerWorkerLoader.prototype.sendMessage =
  function jiw_sendMessage(message, transferList) {
    if (!this.worker) {
      throw new Error('Loader not ready yet.');
    }

    this.worker.postMessage(message, transferList);
    };
/**
 * Event handler function to be called by event handler interface.
 * @param  {DOMEvent} evt Event object.
 * @this   {object}       JSZhuyinServerWorkerLoader instance.
 */
JSZhuyinServerWorkerLoader.prototype.handleEvent =
  function jiw_handleEvent(evt) {
    switch (evt.type) {
      case 'error':
        if (typeof this.onerror === 'function') {
          this.onerror(evt);
        }

        break;

      case 'message':
        if (typeof this.onmessage === 'function') {
          this.onmessage(evt.data);
        }

        break;
    }
  };
/**
 * Start-up a new JSZhuyinClient instance.
 * @this  {object}              JSZhuyinClient instance.
 */
var JSZhuyinClient = function JSZhuyinClient() {
  this.symbols = '';
  this.defaultCandidate = undefined;
  this.pendingActions = 0;

  this.loader = null;
};
/**
 * Default loader to load the server if an instance is not passed to load().
 * This is set to JSZhuyinServerIframeLoader for backwards compatibility;
 * users are advised to use JSZhuyinServerWorkerLoader instead.
 * @type {JSZhuyinServerLoader}
 */
JSZhuyinClient.prototype.DEFAULT_LOADER = JSZhuyinServerIframeLoader;
/**
 * Run when the loading is complete.
 * @type {function}
 */
JSZhuyinClient.prototype.onloadend = null;
/**
 * Run when loading is successful.
 * @type {function}
 */
JSZhuyinClient.prototype.onload = null;
/**
 * Run when unload.
 * @type {function}
 */
JSZhuyinClient.prototype.onunload = null;
/**
 * Run when database download progresses.
 * @type {function}
 */
JSZhuyinClient.prototype.ondownloadprogress = null;
/**
 * Run when error occours.
 * @type {function}
 */
JSZhuyinClient.prototype.onerror = null;
/**
 * Run when an action is handled; receives reqId passed to the functions.
 * @type {function}
 */
JSZhuyinClient.prototype.onactionhandled = null;
/**
 * Callback to call when the composition updates.
 * @type {function}
 */
JSZhuyinClient.prototype.oncompositionupdate = null;
/**
 * Callback to call when the composition ends.
 * @type {function}
 */
JSZhuyinClient.prototype.oncompositionend = null;
/**
 * Callback to call when candidate menu updates.
 * @type {function}
 */
JSZhuyinClient.prototype.oncandidateschange = null;
/**
 * Handle a key with it's DOM UI Event Level 3 key value.
 * @param  {string} key   The key property of the key to handle,
 *                        should be the printable character or a registered
 *                        name in the spec.
 * @param  {any}   reqId  ID of the request.
 * @return {boolean}      Return true if the key will be handled async.
 * @this   {object}       JSZhuyin instance.
 */
JSZhuyinClient.prototype.handleKey = function jzc_handleKey(key, reqId) {
  if (typeof key !== 'string') {
    throw new Error(
      'JSZhuyinClient: key passed to handleKey must be a string.');
  }

  if (this.defaultCandidate || this.symbols || this.pendingActions) {
    // We must handle all the keys if there are pending symbols or candidates.
    this.sendMessage('handleKey', key, reqId);
    this.pendingActions++;

    return true;
  }

  // Let's not use BopomofoEncoder.isBopomofoSymbol(key) here
  var BOPOMOFO_START = 0x3105;
  var BOPOMOFO_END = 0x3129;
  var BOPOMOFO_TONE_1 = 0x02c9;
  var BOPOMOFO_TONE_2 = 0x02ca;
  var BOPOMOFO_TONE_3 = 0x02c7;
  var BOPOMOFO_TONE_4 = 0x02cb;
  var BOPOMOFO_TONE_5 = 0x02d9;

  var isAllBopomofoSymbols =
    Array.prototype.every.call(key, function(chr) {
      var code = chr.charCodeAt(0);
      return (code >= BOPOMOFO_START && code <= BOPOMOFO_END ||
        code === BOPOMOFO_TONE_1 || code === BOPOMOFO_TONE_2 ||
        code === BOPOMOFO_TONE_3 || code === BOPOMOFO_TONE_4 ||
        code === BOPOMOFO_TONE_5);
    });

  if (isAllBopomofoSymbols) {
    // We must handle Bopomofo symbols.
    this.sendMessage('handleKey', key, reqId);
    this.pendingActions++;

    return true;
  }

  return false;
};
/**
 * Handle a key event with it's keyCode or charCode. Deprecated.
 * @param  {number} code  charCode of the keyboard event.
 *                        If charCode is 0, you should pass keyCode instead.
 * @param  {any}   reqId  ID of the request.
 * @return {boolean}      Return true if the key will be handled async.
 * @this   {object}       JSZhuyin instance.
 */
JSZhuyinClient.prototype.handleKeyEvent = function jzc_handleKeyEvent(code,
                                                                      reqId) {
  var key;
  switch (code) {
    case 0x08:
      key = 'Backspace';
      break;
    case 0x0d:
      key = 'Enter';
      break;
    case 0x1b:
      key = 'Escape';
      break;
    default:
      // XXX: We are considering everything reach here is a printable character.
      key = String.fromCharCode(code);
  }

  return this.handleKey(key, reqId);
};
/**
 * Select a candatate. Will be handled in the action queue.
 * @param  {object} candidate One of the candatate that was sent via
 *                            oncandidateschange callback.
 * @param  {any}    reqId     ID of the request.
 * @this   {object}           JSZhuyinClient instance.
 */
JSZhuyinClient.prototype.selectCandidate = function jz_selCandi(candidate,
                                                                reqId) {
  this.sendMessage('selectCandidate', candidate, reqId);
  this.pendingActions++;
};
/**
 * Load JSZhuyinClient; load the loader and the database,
 * register callbacks, etc.
 * @param {object}  loader      A JSZhuyinServerLoader instance, should be
 *                              either a JSZhuyinServerIframeLoader instance or
 *                              a JSZhuyinServerWorkerLoader instance.
 * @param {object}  config      Configuration to set on JSZhuyin *before*
 *                              loading.
 * @param {object}  data        ArrayBuffer representing JSZhuyin data.
 *                              Optional.
 * @this  {object}              JSZhuyin instance.
 */
JSZhuyinClient.prototype.load = function jz_load(loader, config, data) {
  if (!(loader instanceof JSZhuyinServerLoader)) {
    loader = new JSZhuyinClient.prototype.DEFAULT_LOADER();
  }

  if (this.loaded) {
    throw new Error('Already loaded.');
  }
  this.loaded = true;

  this.loader = loader;
  loader.onmessage = this.handleMessage.bind(this);
  loader.onerror = function jsz_onerror(err) {
    if (typeof this.onerror === 'function') {
      this.onerror(err);
    }
  }.bind(this);
  loader.onload = function jzc_loadIME() {
    this.sendMessage('setConfig', config);
    this.sendMessage('load', data);
  }.bind(this);
  loader.load();

  this.symbols = '';
  this.defaultCandidate = undefined;
};
/**
 * Set configurations.
 * @param {object}  config      Configuration to set on JSZhuyin.
 */
JSZhuyinClient.prototype.setConfig = function jzc_setConfig(config) {
  this.sendMessage('setConfig', config);
};
/**
 * Unload JSZhuyinClient. Close the database connection, unload the loader,
 * and purge things from memory.
 * @this   {object}   JSZhuyinClient instance.
 */
JSZhuyinClient.prototype.unload = function jzc_unload() {
  if (!this.loaded) {
    throw new Error('Already unloaded.');
  }

  this.sendMessage('unload');
};
/**
 * Handle message sent from the JSZhuyinServer.
 * @param  {obj}    msg  Message.
 * @this   {object}      JSZhuyinClient instance.
 */
JSZhuyinClient.prototype.handleMessage = function jzc_handleMessage(msg) {
  switch (msg.type) {
    case 'candidateschange':
      if (msg.data[0] && msg.data[0][1]) {
        this.defaultCandidate = msg.data[0];
      } else {
        this.defaultCandidate = undefined;
      }

      break;

    case 'compositionupdate':
      this.symbols = msg.data;

      break;

    case 'unload':
      if (!this.loaded) {
        return;
      }
      this.loaded = false;

      this.symbols = '';
      this.defaultCandidate = undefined;

      this.loader.unload();
      this.loader = null;

      break;

    case 'error':
      var err = new Error(msg.data.name);
      err.message = msg.data.message;
      err.stack = msg.data.stack;
      err.fileName = msg.data.fileName;
      err.lineNumber = msg.data.lineNumber;
      msg.data = err;

      break;

    case 'actionhandled':
      this.pendingActions--;
      if (this.pendingActions < 0) {
        throw new Error('JSZhuyinClient: Unexpected actionhandled message.');
      }

      break;

    case 'loadend':
    case 'load':
    case 'downloadprogress':
    case 'compositionend':
      break;

    default:
      throw new Error('JSZhuyinClient: Receive unknown message ' +
        msg.type + ' from frame.');
  }

  if (typeof this['on' + msg.type] === 'function') {
    this['on' + msg.type](msg.data, msg.requestId);
  }
};
/**
 * Send a message to JSZhuyinServer.
 * @param {string} type   Type of the message.
 * @param {object} data   Data of the message.
 * @param {any}    reqId  ID of the request.
 * @this  {object}        JSZhuyinClient instance.
 */
JSZhuyinClient.prototype.sendMessage =
  function jzc_sendMessage(type, data, reqId) {
    var transferList;
    if (data instanceof ArrayBuffer) {
      transferList = [data];
    }

    this.loader.sendMessage(
      { 'type': type, 'data': data, 'requestId': reqId }, transferList);
  };

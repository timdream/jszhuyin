'use strict';

var T = {
  LOADING: '載入中...',
  LOADING_WITH_PROGRESS: '載入中（%PROGRESS%）...',
  LOADED: '載入完成。',
  LOAD_ERROR: '資料檔案載入失敗，無法使用。',
  ERROR: '程式錯誤（%ERROR%）。'
};

function ConfigDialog() {
}
ConfigDialog.prototype.CLOSE_BTN_ID = 'config-dialog-close';
ConfigDialog.prototype.OPEN_BTN_ID = 'config-btn';
ConfigDialog.prototype.DIALOG_ID = 'config-dialog-dialog';
ConfigDialog.prototype.onopened = null;
ConfigDialog.prototype.start = function() {
  this.dialogEl = document.getElementById(this.DIALOG_ID);
  this.closeEl = document.getElementById(this.CLOSE_BTN_ID);
  this.openEl = document.getElementById(this.OPEN_BTN_ID);

  this.closeEl.addEventListener('click', this);
  this.openEl.addEventListener('click', this);
  this.openEl.classList.remove('disabled');
};
ConfigDialog.prototype.handleEvent = function(evt) {
  var target = evt.target;
  switch (target) {
    case this.openEl:
      this.dialogEl.classList.add('show');

      if (typeof this.onopened === 'function') {
        this.onopened();
      }

      break;
    case this.closeEl:
      this.dialogEl.classList.remove('show');
      break;
  }
};

function ConfigHandler() {
}
ConfigHandler.prototype.REORDER_SYMBOLS_ID = 'reorder-symbols';
ConfigHandler.prototype.INTERCHANGABLE_PAIRS_FORM_ID =
  'interchangable-pairs-config';
ConfigHandler.prototype.onconfigupdate = null;
ConfigHandler.prototype.start = function() {
  this.reorderEl = document.getElementById(this.REORDER_SYMBOLS_ID);
  this.reorderEl.addEventListener('click', this);

  this.interchangagblePairsEls =
    Array.prototype.slice.call(
      document.getElementById(this.INTERCHANGABLE_PAIRS_FORM_ID)
        .querySelectorAll('[data-pair]'));
  this.interchangagblePairsEls.forEach(function(el) {
    el.addEventListener('click', this);
  }, this);

  this.getConfigFromHash();
};
ConfigHandler.prototype.handleEvent = function(evt) {
  var target = evt.target;
  switch (target) {
    case this.reorderEl:
      this.reorderSymbols = target.checked;
      break;
    default:
      if (target.dataset.pair) {
        this.updateInterchangablePair();
      }

      break;
  }

  this.setConfigToHash();

  if (typeof this.onconfigupdate === 'function') {
    this.onconfigupdate();
  }
};
ConfigHandler.prototype.updateInterchangablePair = function() {
  var pairs = '';

  this.interchangagblePairsEls.forEach(function(el) {
    if (el.checked) {
      pairs += el.dataset.pair;
    }
  });

  this.interchangagblePairs = pairs;
};
ConfigHandler.prototype.getConfigFromHash = function() {
  var hash = window.location.hash;

  this.reorderEl.checked = this.reorderSymbols =
    (hash.indexOf('reorder=0') === -1);

  this.interchangagblePairs = '';
  var interchangagblePairs =
    decodeURIComponent((hash.match(/fuzzy=([^&]*)/) || ['',''])[1]);

  this.interchangagblePairsEls.forEach(function(el) {
    el.checked = (interchangagblePairs.indexOf(el.dataset.pair) !== -1);
    if (el.checked) {
      this.interchangagblePairs += el.dataset.pair;
    }
  }.bind(this));
};
ConfigHandler.prototype.setConfigToHash = function() {
  var hash = [];
  if (!this.reorderEl.checked) {
    hash.push('reorder=0');
  }

  if (this.interchangagblePairs) {
    hash.push('fuzzy=' + this.interchangagblePairs);
  }

  window.location.replace('#' + hash.join('&'));
};
ConfigHandler.prototype.getConfigObject = function() {
  return {
    'REORDER_SYMBOLS': this.reorderSymbols,
    'INTERCHANGABLE_PAIRS': this.interchangagblePairs
  };
};

function JSZhuyinApp() {
}

JSZhuyinApp.prototype.start = function() {
  this._startNav();
  this._startUI();
  this._startEngine();
};

JSZhuyinApp.prototype.handleEvent = function(evt) {
  switch (evt.type) {
    case 'mousemove':
    case 'blur':
      this.leaveDistractionFree();
      break;

    case 'resize':
      this.positionPanel();
      break;

    case 'compositionstart':
    case 'compositionupdate':
      this.showNativeIMEWarning();
      break;
  }
};

JSZhuyinApp.prototype._startNav = function() {
  var mobileNav = document.getElementById('mobile-nav');
  mobileNav.selectedIndex = 0;
  mobileNav.addEventListener('change', function(evt) {
    window.location.href = mobileNav.value;
  });
};

JSZhuyinApp.prototype._startUI = function() {
  this.statusEl = document.getElementById('status');
  this.statusEl.textContent = T.LOADING;

  var panel = this.panelEl = document.getElementById('panel');
  var inputarea = this.inputareaEl = document.getElementById('inputarea');

  this.compositionEl = document.getElementById('composition');
  this.candidatesListEl = document.getElementById('candidates');

  var configDialog = this.configDialog = new ConfigDialog();
  configDialog.onopened = this.leaveDistractionFree.bind(this);
  configDialog.start();

  var configHandler = this.configHandler = new ConfigHandler();
  configHandler.start();
  configHandler.onconfigupdate = function() {
    if (this.client.loaded) {
      this.client.setConfig(configHandler.getConfigObject());
    }
  }.bind(this);
};

JSZhuyinApp.prototype._startEngine = function() {
  var client = this.client = new JSZhuyinClient();
  client.load(new JSZhuyinServerWorkerLoader());
  client.ondownloadprogress = function(progressDict) {
    if (!progressDict.lengthComputable) {
      this.statusEl.textContent = T.LOADING_WITH_PROGRESS.replace(
        '%PROGRESS%', (progressDict.loaded / 1048576).toFixed(2) + ' MB');
    } else {
      this.statusEl.textContent = T.LOADING_WITH_PROGRESS.replace('%PROGRESS%',
        (progressDict.loaded / progressDict.total * 100).toFixed(2) + '%');
    }
  }.bind(this);
  client.onload = function() {
    this.inputareaEl.setAttribute('contenteditable', true);
    this.inputareaEl.focus();
    this.inputareaEl.addEventListener('compositionstart', this);
    this.inputareaEl.addEventListener('compositionupdate', this);

    this.client.setConfig(this.configHandler.getConfigObject());
    this.statusEl.textContent = T.LOADED;
  }.bind(this);
  client.onerror = function(err) {
    if (err.message.indexOf('DataLoader') !== -1) {
      this.statusEl.textContent = T.LOAD_ERROR;
    } else {
      this.leaveDistractionFree();
      this.statusEl.textContent = T.ERROR.replace('%ERROR%', err.message);
      console.error(err);
    }
  }.bind(this);

  var webIME = this.webIME = new JSZhuyinWebIME({
    composition: this.compositionEl,
    candidatesList: this.candidatesListEl
  }, client);

  // Overwrite the addCandidateItem() method because
  // we need an extra wrapped <span> for every item.
  webIME.candidatesList.addCandidateItem = function(candidate, index) {
    var element = this.element;
    var li = document.createElement('li');
    li.setAttribute('data-index', index);
    var span = document.createElement('span');
    span.textContent = candidate[0];
    span.setAttribute('data-index', index);
    li.appendChild(span);
    element.appendChild(li);
  };

  webIME.oncompositionend =
  webIME.oncompositionupdate =
  webIME.oncandidateschange = this.updatePanelStyle.bind(this);
};

JSZhuyinApp.prototype.updatePanelStyle = function(data) {
  this.statusEl.textContent = '';

  var hasData = (typeof data === 'string' && data) ||
    (typeof data === 'object' && data.length);
  if (hasData) {
    this.hideNativeIMEWarning();
    this.enterDistractionFree();
  }

  if (!this.candidatesListEl.children.length &&
      !this.compositionEl.textContent.length) {
    this.panelEl.setAttribute('hidden', 'true');
    window.removeEventListener('resize', this);
  } else {
    this.panelEl.removeAttribute('hidden');
    window.addEventListener('resize', this);
    this.positionPanel();
  }
};

JSZhuyinApp.prototype.showNativeIMEWarning = function() {
  this.leaveDistractionFree();

  var nativeIMEWarning = this._nativeIMEWarning =
    this._nativeIMEWarning || new JSZhuyinAppNativeIMEWarning();

  nativeIMEWarning.start();
  this.inputareaEl.parentNode
    .insertBefore(nativeIMEWarning.element, this.inputareaEl);
  nativeIMEWarning.show();

  // Discard the current compositions and candidates.
  // XXX: Implement and move this to cancelComposition()
  this.webIME.handleKey('Escape');
};

JSZhuyinApp.prototype.hideNativeIMEWarning = function() {
  if (this._nativeIMEWarning) {
    this._nativeIMEWarning.hide();
  }
};

JSZhuyinApp.prototype.positionPanel = function() {
  var sel = window.getSelection();
  // XXX sync reflow, improve this.

  var isFloating =
    window.getComputedStyle(this.panelEl)
    .getPropertyValue('position') === 'absolute';
  if (!isFloating) {
    // No need to calculate the position, goodbye!
    return;
  }

  var rect;
  rect = sel.getRangeAt(0).getBoundingClientRect();
  if (rect.width === 0 && rect.left === 0 && rect.right === 0) {
    // Empty rect?! Maybe because the caret is not placed in a text node,
    // We need to get a rect by considering the node (probably <br>)
    // before the caret.
    var el = sel.focusNode.childNodes[sel.focusOffset];
    if (el) {
      rect = el.getBoundingClientRect();
    } else {
      // This only happens if inputarea is emptied, or if use have
      // pasted empty element into our inputarea.
      rect = sel.focusNode.getBoundingClientRect();
    }
  }

  if (rect.width === 0 && rect.left === 0 && rect.right === 0) {
    // Still empty rect?! Let's use the safe fallback.
    rect = inputareaEl.getBoundingClientRect();
  }

  this.panelEl.style.top = (
    document.documentElement.scrollTop +
    document.body.scrollTop +
    rect.top +
    rect.height).toFixed(2) + 'px';

  var panelRect = this.panelEl.getBoundingClientRect();
  if (rect.left + panelRect.width <
    document.body.getBoundingClientRect().width) {
    this.panelEl.style.left = rect.left.toFixed(2) + 'px';
    this.panelEl.style.right = '';
  } else {
    this.panelEl.style.left = '';
    this.panelEl.style.right = '0';
  }

  if (document.documentElement.clientHeight <
      (panelRect.top + panelRect.height)) {
    this.panelEl.scrollIntoView();
  }
};

JSZhuyinApp.prototype.enterDistractionFree = function() {
  window.addEventListener('mousemove', this);
  this.inputareaEl.addEventListener('blur', this);
  document.body.className = 'distraction-free';
};

JSZhuyinApp.prototype.leaveDistractionFree = function() {
  window.removeEventListener('mousemove', this);
  this.inputareaEl.removeEventListener('blur', this);
  document.body.className = '';
};

window.app = new JSZhuyinApp();
window.onload = function() {
  window.onload = null;
  window.app.start();
};

function JSZhuyinAppNativeIMEWarning() {
}

JSZhuyinAppNativeIMEWarning.prototype.start = function() {
  if (this.element) {
    return;
  }

  var element = this.element = document.createElement('div');
  element.className = 'alert alert-danger';
  element.textContent = '關閉系統的輸入法以使用此網站上的注音輸入。';
};

JSZhuyinAppNativeIMEWarning.prototype.show = function() {
  this.element.hidden = false;
};

JSZhuyinAppNativeIMEWarning.prototype.hide = function() {
  this.element.hidden = true;
};

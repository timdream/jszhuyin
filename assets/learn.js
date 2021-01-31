'use strict';

/* global JSZhuyinClient, JSZhuyinWebIME, JSZhuyinServerWorkerLoader */

var T = {
  LOADING: 'Loading program...',
  LOADING_WITH_PROGRESS: 'Loading dictionary (%PROGRESS%)...',
  LOADED: 'Done.',
  LOAD_ERROR: 'Unable to load database. Reload to try again.',
  ERROR: 'Error (%ERROR%)'
};

function BasicTutorialStep(app) {
  this.app = app;
}
BasicTutorialStep.prototype.start = function() {
  this.app.inputareaEl.setAttribute('hidden', true);
};
BasicTutorialStep.prototype.stop = function() {
  this.app.inputareaEl.removeAttribute('hidden');
};

function IntroTutorialStep(app) {
  this.app = app;
}
IntroTutorialStep.prototype.KEYS = 'ㄋㄧㄣˊㄏㄠˇ，ㄕˋㄐㄧㄝˋ！';

IntroTutorialStep.prototype.start = function() {
  this.index = 0;
  // XXX created the text node here.
  this.app.inputareaEl.innerHTML = '&nbsp;';
  this.simulateType();
};
IntroTutorialStep.prototype.simulateType = function() {
  if (this.KEYS.length === this.index) {
    this.app.inputareaEl.innerHTML = '&nbsp;';
    this.index = 0;
  }

  var key = this.KEYS[this.index];

  // XXX
  this.app.webIME.elements.input = this.app.inputareaEl;
  this.app.webIME.isContentEditable = true;
  var range = document.createRange();
  range.setStart(this.app.inputareaEl.firstChild,
    this.app.inputareaEl.textContent.length);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  this.app.webIME.handleKey(key);

  this.index++;
  this.timer = window.setTimeout(this.simulateType.bind(this), 500);
};
IntroTutorialStep.prototype.stop = function() {
  window.clearTimeout(this.timer);
  this.app.webIME.handleKey('Escape');
  this.app.inputareaEl.innerHTML = '<br>';
};

function RandomCharactersStep(app) {
  this.app = app;
}
RandomCharactersStep.prototype.start = function() {
  this.timer = window.setInterval(this.showRandomChars.bind(this), 1000);
  this.showRandomChars();
};
RandomCharactersStep.prototype.showRandomChars = function() {
  var str = '';
  for (var i = 0; i < 100; i++) {
    str += String.fromCharCode(
      0x4e00 + ((Math.random() * (0x9fcf - 0x4e00)) | 0));
  }

  this.app.inputareaEl.textContent = str;
};
RandomCharactersStep.prototype.stop = function() {
  window.clearTimeout(this.timer);
  this.app.inputareaEl.innerHTML = '<br>';
};

function LayoutIntroTutorialStep(app) {
  this.app = app;
}
LayoutIntroTutorialStep.prototype.start = function() {
  this.app.inputareaEl.setAttribute('contenteditable', true);
  this.app.inputareaEl.addEventListener('focus', this);
};
LayoutIntroTutorialStep.prototype.handleEvent = function() {
  this.app.gotoTutorial(this.app.stepIndex + 1);
};
LayoutIntroTutorialStep.prototype.stop = function() {
  this.app.inputareaEl.setAttribute('contenteditable', false);
  this.app.inputareaEl.removeEventListener('focus', this);
};

function TypingTutorialStep(app) {
  this.app = app;
}
TypingTutorialStep.prototype.start = function() {
  this.app.inputareaEl.setAttribute('contenteditable', true);
  this.app.inputareaEl.focus();
};
TypingTutorialStep.prototype.stop = function() {
  this.app.inputareaEl.setAttribute('contenteditable', false);
};

function HelloTypingTutorialStep(app) {
  this.app = app;
}
HelloTypingTutorialStep.prototype = new TypingTutorialStep();
HelloTypingTutorialStep.prototype.handle = function(name, arg) {
  if (name === 'oncompositionupdate' && arg === 'ㄋㄧㄣˊㄏㄠˇ') {
    this.app.gotoTutorial(this.app.stepIndex + 1);
  }
  if (name === 'oncompositionend' && arg === '您好') {
    this.app.gotoTutorial(this.app.stepIndex + 2);
  }
};

function HelloConfirmTypingTutorialStep(app) {
  this.app = app;
}
HelloConfirmTypingTutorialStep.prototype = new TypingTutorialStep();
HelloConfirmTypingTutorialStep.prototype.handle = function(name, arg) {
  if (name === 'oncompositionend' && arg === '您好') {
    this.app.gotoTutorial(this.app.stepIndex + 1);
  }
};

function CommaTypingTutorialStep(app) {
  this.app = app;
}
CommaTypingTutorialStep.prototype = new TypingTutorialStep();
CommaTypingTutorialStep.prototype.handle = function(name, arg) {
  if (name === 'oncompositionend' && arg === '，') {
    this.app.gotoTutorial(this.app.stepIndex + 1);
  }
};

function WorldConfirmTypingTutorialStep(app) {
  this.app = app;
}
WorldConfirmTypingTutorialStep.prototype = new TypingTutorialStep();
WorldConfirmTypingTutorialStep.prototype.handle = function(name, arg) {
  if (name === 'oncompositionend' && arg === '世界') {
    this.app.gotoTutorial(this.app.stepIndex + 1);
  }
};

function ExclamationMarkTypingTutorialStep(app) {
  this.app = app;
}
ExclamationMarkTypingTutorialStep.prototype = new TypingTutorialStep();
ExclamationMarkTypingTutorialStep.prototype.handle = function(name, arg) {
  if (name === 'oncompositionend' && arg === '！') {
    this.app.gotoTutorial(this.app.stepIndex + 1);
  }
};

function JSZhuyinLearningApp() {
}

JSZhuyinLearningApp.prototype.steps = [
  BasicTutorialStep,
  IntroTutorialStep,
  RandomCharactersStep,
  LayoutIntroTutorialStep,
  HelloTypingTutorialStep,
  HelloConfirmTypingTutorialStep,
  CommaTypingTutorialStep,
  WorldConfirmTypingTutorialStep,
  ExclamationMarkTypingTutorialStep,
  TypingTutorialStep
];

JSZhuyinLearningApp.prototype.start = function() {
  this._startUI();
  this._startEngine();

  this.stepIndex = -1;
  this.gotoTutorial(0);
};

JSZhuyinLearningApp.prototype.gotoTutorial = function(index) {
  if (this.currentStep) {
    this.currentStep.stop();
  }

  this.stepIndex = index;

  this.currentStep = new this.steps[this.stepIndex](this);
  this.currentStep.start();

  Array.prototype.forEach.call(
    document.querySelectorAll(
      '.tutorial-step:not(.step' + this.stepIndex + ')'),
    function(el) { el.setAttribute('hidden', 'true'); });
  document.querySelector('.step' + this.stepIndex).removeAttribute('hidden');

  this.prevBtn.disabled = (this.stepIndex <= 1);
  this.nextBtn.disabled = this.stepIndex < 1 ||
    this.stepIndex === (this.steps.length - 1);

  window._paq && window._paq.push(
    ['trackEvent', 'Learn', 'gotoTutorial', '', index]);
};

JSZhuyinLearningApp.prototype.handleEvent = function(evt) {
  switch (evt.type) {
    case 'resize':
      this.positionPanel();
      break;

    case 'click':
      switch (evt.target) {
        case this.prevBtn:
          this.gotoTutorial(this.stepIndex - 1);
          break;

        case this.nextBtn:
          this.gotoTutorial(this.stepIndex + 1);
          break;

        default:
          if (evt.target.nodeName === 'IMG') {
            alert('Oops! Please type on the actual keyboard, not the image.');
            this.inputareaEl.focus();
          }
      }
      break;
  }
};

JSZhuyinLearningApp.prototype._startUI = function() {
  this.statusEl = document.getElementById('status');
  this.statusEl.textContent = T.LOADING;

  this.panelEl = document.getElementById('panel');
  this.inputareaEl = document.getElementById('inputarea');

  this.compositionEl = document.getElementById('composition');
  this.candidatesListEl = document.getElementById('candidates');

  document.addEventListener('click', this);
  this.prevBtn = document.getElementById('step-btn-prev');
  this.nextBtn = document.getElementById('step-btn-next');
};

JSZhuyinLearningApp.prototype._startEngine = function() {
  var client = this.client = new JSZhuyinClient();
  client.load(new JSZhuyinServerWorkerLoader('../lib/worker.js'));
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
    this.gotoTutorial(1);

    this.client.setConfig(
      { 'REORDER_SYMBOLS': true,'SUGGEST_PHRASES': false });
    this.statusEl.textContent = T.LOADED;
  }.bind(this);
  client.onerror = function(err) {
    console.error(err);
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
    this.getNotifyTutorialStepFactory('oncompositionend');
  webIME.oncompositionupdate =
    this.getNotifyTutorialStepFactory('oncompositionupdate');
  webIME.oncandidateschange = this.updatePanelStyle.bind(this);
};

JSZhuyinLearningApp.prototype.getNotifyTutorialStepFactory =  function(name) {
  return (function(arg) {
    if (this.currentStep && typeof this.currentStep.handle === 'function') {
      this.currentStep.handle(name, arg);
    }
    this.updatePanelStyle();
  }).bind(this);
};

JSZhuyinLearningApp.prototype.updatePanelStyle = function(data) {
  this.statusEl.textContent = '';

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

JSZhuyinLearningApp.prototype.positionPanel = function() {
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
    rect = this.inputareaEl.getBoundingClientRect();
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

window.app = new JSZhuyinLearningApp();
window.onload = function() {
  window.onload = null;
  window.app.start();
};

'use strict';

// This file is used to run JSZhuyin within a desktop browser,
// interacting with the user with an US Keyboard.

// Map the characters on the standard keyboard to Bopomofo layout.
var JSZhuyinLayoutMapper = {
  // Keys on US Qwerty Keyboard (with and without caps)
  keys: '~!@#$%^&*()_+' +
        '`1234567890-=' +
        'QWERTYUIOP{}' +
        'qwertyuiop[]' +
        'ASDFGHJKL:"' +
        'asdfghjkl;\'' +
        'ZXCVBNM<>?' +
        'zxcvbnm,./' +
        ' ',
  // ... map to 'general' Zhuyin layout
  map:  '～！＠＃＄％︿＆＊（）—＋' +
        '⋯ㄅㄉˇˋㄓˊ˙ㄚㄞㄢㄦ＝' +
        'qwertyuiop『』' +
        'ㄆㄊㄍㄐㄔㄗㄧㄛㄟㄣ「」' +
        'asdfghjkl：；' +
        'ㄇㄋㄎㄑㄕㄘㄨㄜㄠㄤ、' +
        'zxcvbnm，。？' +
        'ㄈㄌㄏㄒㄖㄙㄩㄝㄡㄥ' +
        'ˉ',
  // keys for select candidate (with shift key)
  selectionKeys: '!@#$%^&*(',

  getSymbolCodeFromCode: function(code) {
    var index = this.keys.indexOf(String.fromCharCode(code));
    if (index === -1)
      return code;

    return this.map.charCodeAt(index);
  },
  getSelectionIndex: function(code) {
    return this.selectionKeys.indexOf(String.fromCharCode(code));
  }
};

var JSZhuyinWebIME = function JSZhuyinWebIME(jszhuyin, elements) {
  this.elements = elements;
  elements.input.addEventListener('keydown', this, true);
  elements.input.addEventListener('keypress', this, true);

  this.isContentEditable = !('value' in elements.input);

  this.jszhuyin = jszhuyin;
  jszhuyin.oncompositionupdate = this.updateComposition.bind(this);
  jszhuyin.oncompositionend = this.endComposition.bind(this);
  jszhuyin.onactionhandled = this.updateHandledId.bind(this);
  jszhuyin.oncandidateschange = this.setCandidates.bind(this);

  var candidatesList = this.candidatesList =
    new JSZhuyinWebIME.CandidatesList(elements.candidatesList);

  candidatesList.oncandidateselect = this.selectCandidate.bind(this);

  this.isCompositionStarted = false;
  this.requestId = 0;
  this.handledId = 0;
};
JSZhuyinWebIME.prototype.oncandidateschange = null;
JSZhuyinWebIME.prototype.oncompositionupdate = null;
JSZhuyinWebIME.prototype.oncompositionend = null;
JSZhuyinWebIME.prototype.unload = function() {
  this.jszhuyin.unload();
  this.candidatesList.unload();
  this.elements.input.removeEventListener('keydown', this, true);
  this.elements.input.removeEventListener('keypress', this, true);
};
JSZhuyinWebIME.prototype.setCandidates = function(candidates) {
  this.candidatesList.setCandidates(candidates);

  if (typeof this.oncandidateschange === 'function')
    this.oncandidateschange(candidates);
};
JSZhuyinWebIME.prototype.selectCandidate = function(candidate) {
  this.jszhuyin.selectCandidate(candidate, ++this.requestId);
};
JSZhuyinWebIME.prototype.updateHandledId = function(id) {
  this.handledId = id;
};
JSZhuyinWebIME.prototype.updateComposition = function(composition) {
  if (!this.isCompositionStarted && composition.length) {
    this.isCompositionStarted = true;
    this.sendCompositionEvent('compositionstart');
  }

  this.sendCompositionEvent('compositionupdate', composition);
  this.elements.composition.textContent = composition;

  if (typeof this.oncompositionupdate === 'function')
    this.oncompositionupdate(composition);
};
JSZhuyinWebIME.prototype.endComposition = function(composition) {
  if (!this.isCompositionStarted) {
    this.isCompositionStarted = true;
    this.sendCompositionEvent('compositionstart');
  }

  this.sendCompositionEvent('compositionend', composition);
  this.isCompositionStarted = false;

  // Commit the text to cursor position, poor man's way.

  if (!this.isContentEditable) {
    var input = this.elements.input;
    // <input> / <textarea>
    var selStart = input.selectionStart;
    input.value = input.value.substr(0, selStart) + composition +
    input.value.substr(input.selectionEnd, input.value.length);
    input.selectionStart = input.selectionEnd = selStart + composition.length;

    if (typeof this.oncompositionend === 'function')
      this.oncompositionend(composition);

    return;
  }

  // contenteditable
  var sel = window.getSelection();

  // Remove the selection if there is any.
  if (!sel.isCollapsed) {
    sel.deleteFromDocument();
  }

  // Get the current focused node.
  var node = sel.focusNode;

  if (node.nodeName === '#text') {
    // Easy. We could simply update the node content and the cursor position.
    var offset = sel.focusOffset;

    // Update the content of the node.
    node.textContent = node.textContent.substr(0, offset) + composition +
    node.textContent.substr(offset, node.textContent.length);

    // Move it's cursor position.
    var range = document.createRange();
    range.setStart(
      (node.nodeName === '#text') ? node : node.firstChild,
      offset + composition.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    if (typeof this.oncompositionend === 'function')
      this.oncompositionend(composition);

    return;
  }

  // The current focusNode is an element.

  var textNode = document.createTextNode(composition);

  // Insert the text by insert the text node.
  var currentRange = sel.getRangeAt(0);
  currentRange.insertNode(textNode);

  // Move the cursor position to the text node.
  var range = document.createRange();
  range.setStart(textNode, composition.length);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);

  if (typeof this.oncompositionend === 'function')
    this.oncompositionend(composition);
};
JSZhuyinWebIME.prototype.sendCompositionEvent = function() {
  // XXX
};
JSZhuyinWebIME.prototype.handleEvent = function(evt) {
  if (evt.metaKey || evt.ctrlKey || evt.altKey)
    return;

  var Keys = {
    BACKSPACE: 0x08,
    ENTER: 0x0d,
    ESCAPE: 0x1b,
    SPACE: 0x20,
    LEFT_ARROW: 0x25,
    RIGHT_ARROW: 0x27
  };

  // XXX Special quirks handling for Blink/WebKit:
  // For some keys, we must handle it in the keydown event because no
  // keypress event will be dispatched.
  // For other keys, we should handle keypress so we will know
  // the real charCode.
  if (evt.type === 'keydown') {
    var specialKeys = ([Keys.BACKSPACE,
                        Keys.ESCAPE,
                        Keys.ENTER,
                        Keys.LEFT_ARROW,
                        Keys.RIGHT_ARROW].indexOf(evt.keyCode) !== -1);
    if (!specialKeys)
      return; // Don't handle keydown event of any key other than these keys.

    // The code to handle should be the keyCode.
    code = evt.keyCode;
  } else { // keypress
    // We must not handle non-printable keys (charCode = 0 in Firefox).
    if (!evt.charCode)
      return;

    // WebKit/Blink does not send keypress event for all the keys we handles
    // except the ENTER key.
    if (evt.keyCode === Keys.ENTER)
      return;

    // The code to handle should be the charCode.
    code = evt.charCode;
  }

  var code = evt.charCode || evt.keyCode;
  var shiftKey = evt.shiftKey;

  // number keys: candidate selection
  var selectionIndex = JSZhuyinLayoutMapper.getSelectionIndex(code);
  if (evt.type === 'keypress' && shiftKey && selectionIndex !== -1) {
    var handled = this.candidatesList.selectCandidate(selectionIndex);

    if (handled) {
      evt.preventDefault();

      return;
    }
  }

  // right arrow
  if (evt.type === 'keydown' && code == Keys.RIGHT_ARROW) {
    if (!shiftKey)
      return;

    this.candidatesList.goForwardPage();

    evt.preventDefault();
    return;
  }

  // left arrow
  if (evt.type === 'keydown' && code == Keys.LEFT_ARROW) {
    if (!shiftKey)
      return;

    this.candidatesList.goBackPage();

    evt.preventDefault();
    return;
  }

  // Make sure we don't send any non-handled controls keys to JSZhuyin.
  if (code < 0x1f &&
      code !== Keys.ENTER &&
      code !== Keys.BACKSPACE &&
      code !== Keys.ESCAPE) {

    // Block these keys ourselves if they are compositions.
    if (this.isCompositionStarted) {
      evt.preventDefault();
    }
    return;
  }

  // For Enter and Backspace keys, ignore them if we have not handled the
  // previous action. This is poor man's way to defense against race condition.
  if (this.requestId !== this.handledId &&
      code === Keys.BACKSPACE &&
      code === Keys.ENTER) {
    evt.preventDefault();
    return;
  }

  var symbolCode =
    JSZhuyinLayoutMapper.getSymbolCodeFromCode(code, shiftKey);

  var handled = this.jszhuyin.handleKeyEvent(symbolCode, ++this.requestId);
  if (handled) {
    evt.preventDefault();
  } else {
    if (symbolCode !== code) {
      this.endComposition(String.fromCharCode(symbolCode));
      evt.preventDefault();
    }
    this.handledId = this.requestId;
  }
};

JSZhuyinWebIME.CandidatesList = function CandidatesList(element) {
  this.element = element;
  this.page = 0;
  this.element.addEventListener('mousedown', this);

  this.candidates = [];
};
JSZhuyinWebIME.CandidatesList.prototype.unload = function() {
  this.element.removeEventListener('mousedown', this);
};
JSZhuyinWebIME.CandidatesList.prototype.oncandidateselect = null;
JSZhuyinWebIME.CandidatesList.prototype.CANDIDATES_PER_PAGE = 9;
JSZhuyinWebIME.CandidatesList.prototype.setCandidates = function(candidates) {
  this.candidates = candidates;
  this.page = 0;
  this.showCandidates();
};
JSZhuyinWebIME.CandidatesList.prototype.goForwardPage = function() {
  if ((this.page + 1) * this.CANDIDATES_PER_PAGE >= this.candidates.length)
    return;

  this.page += 1;
  this.showCandidates();
};
JSZhuyinWebIME.CandidatesList.prototype.goBackPage = function() {
  if (this.page === 0)
    return;

  this.page -= 1;
  this.showCandidates();
};
JSZhuyinWebIME.CandidatesList.prototype.showCandidates = function(candidates) {
  var element = this.element;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
  var CPP = this.CANDIDATES_PER_PAGE;
  var pageBegin = this.page * CPP;
  this.candidates.slice(pageBegin, this.page * CPP + CPP)
    .forEach((function(candidate, i) {
      this.addCandidateItem(candidate, i, pageBegin + i);
    }).bind(this)
  );

  if (pageBegin === 0) {
    this.element.classList.remove('can-go-left');
  } else {
    this.element.classList.add('can-go-left');
  }

  if ((this.page * CPP + CPP) >= this.candidates.length) {
    this.element.classList.remove('can-go-right');
  } else {
    this.element.classList.add('can-go-right');
  }
};
JSZhuyinWebIME.CandidatesList.prototype.addCandidateItem =
  function(candidate, i, index) {
    var element = this.element;
    var li = document.createElement('li');
    li.textContent = candidate[0];
    li.setAttribute('data-index', index);
    element.appendChild(li);
  };
JSZhuyinWebIME.CandidatesList.prototype.selectCandidate =
  function(indexOnList) {
    var index = this.page * this.CANDIDATES_PER_PAGE + indexOnList;
    if (!this.candidates[index])
      return false;

    if (typeof this.oncandidateselect === 'function')
      this.oncandidateselect(this.candidates[index]);

    return true;
  };
JSZhuyinWebIME.CandidatesList.prototype.handleEvent = function(evt) {
  var el = evt.target;
  var index = parseInt(el.getAttribute('data-index'));

  evt.preventDefault();

  if (isNaN(index))
    return;

  if (typeof this.oncandidateselect === 'function')
    this.oncandidateselect(this.candidates[index]);
};

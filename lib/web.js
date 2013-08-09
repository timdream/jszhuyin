'use strict';

// This file is used to run JSZhuyin within a desktop browser,
// interacting with the user with an US Keyboard.

// The key of the objects represents keyCode
// (virtual key codes commonly found in the web browser w/o a spec, see
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Virtual_key_codes)
// and the value is the character.
var JSZhuyinLayoutMapper = {
  // Mapping of the keys when the user press with shift key.
  shiftMapping: {
    '\u00ba':'：',
    '\u00bc':'，',
    '\u00be':'。',
    '\u00bf':'？',
    '\u00de':'；'
  },
  // Mapping of the 'general' Zhuyin layout v.s. US Keyboard.
  zhuyinMapping: {
    '\u0020':'ˉ',
    '\u00de':'、',
    '\u00bc':'ㄝ',
    '\u00bd':'ㄦ',
    '\u00be':'ㄡ',
    '\u00bf':'ㄥ',
    '0':'ㄢ',
    '1':'ㄅ',
    '2':'ㄉ',
    '3':'ˇ',
    '4':'ˋ',
    '5':'ㄓ',
    '6':'ˊ',
    '7':'˙',
    '8':'ㄚ',
    '9':'ㄞ',
    '\u00ba':'ㄤ',
    ';':'ㄤ',
    'A':'ㄇ',
    'B':'ㄖ',
    'C':'ㄏ',
    'D':'ㄎ',
    'E':'ㄍ',
    'F':'ㄑ',
    'G':'ㄕ',
    'H':'ㄘ',
    'I':'ㄛ',
    'J':'ㄨ',
    'K':'ㄜ',
    'L':'ㄠ',
    'M':'ㄩ',
    'N':'ㄙ',
    'O':'ㄟ',
    'P':'ㄣ',
    'Q':'ㄆ',
    'R':'ㄐ',
    'S':'ㄋ',
    'T':'ㄔ',
    'U':'ㄧ',
    'V':'ㄒ',
    'W':'ㄊ',
    'X':'ㄌ',
    'Y':'ㄗ',
    'Z':'ㄈ'
  },

  getSymbolCodeFromCode: function (code, shiftKey) {
    var chr = String.fromCharCode(code);

    if (shiftKey) {
      if (this.shiftMapping[chr]) {
        return this.shiftMapping[chr].charCodeAt(0);
      } else {
        return chr.toLowerCase().charCodeAt(0);
      }
    }

    if (this.zhuyinMapping[chr]) {
      return this.zhuyinMapping[chr].charCodeAt(0);
    } else {
      return code;
    }
  }
};

var JSZhuyinWebIME = function JSZhuyinWebIME(jszhuyin, elements) {
  this.elements = elements;
  elements.input.addEventListener('keydown', this, true);

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
    input.value = input.value.substr(0, selStart) + composition +
    input.value.substr(input.selectionEnd, input.value.length);
    var selStart = input.selectionStart;
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

  var code = evt.keyCode;

  if (code === 40 &&
      !this.candidatesList.expanded &&
      this.candidatesList.candidates.length) {
    // Expand the candidate list
    evt.preventDefault();
    this.candidatesList.setExpanded(true);

    return;
  }

  if (this.candidatesList.expanded) {
    // Control the candidate list.
    evt.preventDefault();

    // number keys: select selection
    if (code >= 49 && code <= 57) {
      var n = code - 49;
      this.candidatesList.selectCandidate(n);
    }

    // right arrow
    if (evt.keyCode == 39) {
      this.candidatesList.goForwardPage();
    }

    // left arrow
    if (evt.keyCode == 37) {
      this.candidatesList.goBackPage();
    }

    // up arrow
    if (evt.keyCode == 38) {
      this.candidatesList.setExpanded(false);
    }

    return;
  }

  // Make sure we don't send any non-handled controls keys to JSZhuyin.
  if (code < 0x2e &&
      code !== 0x20 && // Space
      code !== 0x08 && // Enter
      code !== 0x0d && // Backspace
      code !== 0x1b) { // Esc

    // Block these keys ourselves if they are compositions.
    if (this.isCompositionStarted) {
      evt.preventDefault();
    }
    return;
  }

  // For Enter and Backspace keys, ignore them if we have not handled the
  // previous action. This is poor man's way to defense against race condition.
  if (this.requestId !== this.handledId && code === 0x08 && code === 0x0d) {
    evt.preventDefault();
    return;
  }


  // This is tricky. We we cannot get the charCode in keydown event,
  // but
  var symbolCode =
    JSZhuyinLayoutMapper.getSymbolCodeFromCode(code, evt.shiftKey);

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
  this.expanded = false;
  this.element.addEventListener('mousedown', this);
};
JSZhuyinWebIME.CandidatesList.prototype.unload = function() {
  this.element.removeEventListener('mousedown', this);
};
JSZhuyinWebIME.CandidatesList.prototype.oncandidateselect = null;
JSZhuyinWebIME.CandidatesList.prototype.EXPANDED_CLASSNAME = 'expanded';
JSZhuyinWebIME.CandidatesList.prototype.CANDIDATES_PER_PAGE = 9;
JSZhuyinWebIME.CandidatesList.prototype.setCandidates = function(candidates) {
  this.candidates = candidates;
  this.page = 0;
  this.showCandidates();
  if (!candidates.length) {
    this.setExpanded(false);
  }
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
JSZhuyinWebIME.CandidatesList.prototype.setExpanded = function(expanded) {
  this.expanded = expanded;
  if (expanded) {
    this.element.classList.add(this.EXPANDED_CLASSNAME);
  } else {
    this.element.classList.remove(this.EXPANDED_CLASSNAME);
    this.page = 0;
    this.showCandidates();
  }
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
      return;

    if (typeof this.oncandidateselect === 'function')
      this.oncandidateselect(this.candidates[index]);
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

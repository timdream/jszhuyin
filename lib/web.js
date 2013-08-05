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

  this.jszhuyin = jszhuyin;
  jszhuyin.oncompositionupdate = this.updateComposition.bind(this);
  jszhuyin.oncompositionend = this.endComposition.bind(this);
  jszhuyin.onactionhandled = this.updateHandledId.bind(this);

  var candidatesList = this.candidatesList =
    new JSZhuyinWebIME.CandidatesList(elements.candidatesList);

  candidatesList.oncandidateselect = this.selectCandidate.bind(this);
  jszhuyin.oncandidateschange =
    candidatesList.setCandidates.bind(candidatesList);

  this.isCompositionStarted = false;
  this.requestId = 0;
  this.handledId = 0;
};
JSZhuyinWebIME.prototype.unload = function() {
  this.jszhuyin.unload();
  this.candidatesList.unload();
  elements.input.removeEventListener('keydown', this, true);
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
};
JSZhuyinWebIME.prototype.endComposition = function(composition) {
  if (!this.isCompositionStarted) {
    this.isCompositionStarted = true;
    this.sendCompositionEvent('compositionstart');
  }

  this.sendCompositionEvent('compositionend', composition);
  this.isCompositionStarted = false;

  // Commit the text to cursor position, poor man's way.
  var input = this.elements.input;
  var selStart = input.selectionStart;

  input.value = input.value.substr(0, selStart) + composition +
    input.value.substr(input.selectionEnd, input.value.length);
  input.selectionStart = input.selectionEnd = selStart + composition.length;
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
  this.element.addEventListener('click', this);
};
JSZhuyinWebIME.CandidatesList.prototype.unload = function() {
  this.element.removeEventListener('click', this);
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
    .forEach(function(candidate, i) {
      var li = document.createElement('li');
      li.textContent = candidate[0];
      li.setAttribute('data-index', pageBegin + i);
      element.appendChild(li);
    }
  );
};
JSZhuyinWebIME.CandidatesList.prototype.selectCandidate =
  function(indexOnList) {
    var index = this.page * this.CANDIDATES_PER_PAGE + indexOnList;
    if (typeof this.oncandidateselect === 'function')
      this.oncandidateselect(this.candidates[index]);
  };
JSZhuyinWebIME.CandidatesList.prototype.handleEvent = function(evt) {
  var el = evt.target;
  var index = parseInt(el.getAttribute('data-index'));

  if (isNaN(index))
    return;

  if (typeof this.oncandidateselect === 'function')
    this.oncandidateselect(this.candidates[index]);
};

'use strict';

// This file is used to run JSZhuyin with a desktop browser,
// interacting with the user with an US Keyboard.

var JSZhuyinKeyMapper = {
  // Mapping of the keys when the user press with shift key.
  shiftMapping: {
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

var WebJSZhuyinIME = function WebJSZhuyinIME(jszhuyin, elements) {
  this.elements = elements;
  elements.input.addEventListener('keydown', this);

  this.jszhuyin = jszhuyin;
  jszhuyin.oncompositionupdate = this.updateComposition.bind(this);
  jszhuyin.oncompositionend = this.endComposition.bind(this);

  var candidatesList = this.candidatesList =
    new WebJSZhuyinIME.CandidatesList(elements.candidatesList);

  candidatesList.oncandidateselect =
    jszhuyin.confirmSelection.bind(jszhuyin);
  jszhuyin.oncandidateupdate =
    candidatesList.setCandidates.bind(candidatesList);

  this.isCompositionStarted = false;
};
WebJSZhuyinIME.prototype.updateComposition = function(composition) {
  if (!this.isCompositionStarted) {
    this.isCompositionStarted = true;
    this.sendCompositionEvent('compositionstart');
  }

  this.sendCompositionEvent('compositionupdate', composition);
  this.elements.composition.textContent = composition;
};
WebJSZhuyinIME.prototype.endComposition = function(composition) {
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
WebJSZhuyinIME.prototype.sendCompositionEvent = function() {
  // XXX
};
WebJSZhuyinIME.prototype.handleEvent = function(evt) {
  if (evt.metaKey || evt.ctrlKey || evt.altKey)
    return;

  var code = evt.keyCode;

console.log(code);

  if (code === 40 &&
      !this.candidatesList.expanded &&
      this.candidatesList.candidates.length) {
    this.candidatesList.setExpanded(true);
  }

  if (this.candidatesList.expanded) {
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

  var symbolCode =
    JSZhuyinKeyMapper.getSymbolCodeFromCode(code, evt.shiftKey);

  var handled = this.jszhuyin.handleKeyEvent(symbolCode);
  if (handled) {
    evt.preventDefault();
  }
};

WebJSZhuyinIME.CandidatesList = function CandidatesList(element) {
  this.element = element;
  this.page = 0;
  this.expanded = false;
  this.element.addEventListener('click', this);
};
WebJSZhuyinIME.CandidatesList.prototype.oncandidateselect = null;
WebJSZhuyinIME.CandidatesList.prototype.EXPANDED_CLASSNAME = 'expanded';
WebJSZhuyinIME.CandidatesList.prototype.CANDIDATES_PER_PAGE = 9;
WebJSZhuyinIME.CandidatesList.prototype.setCandidates = function(candidates) {
  this.candidates = candidates;
  this.page = 0;
  this.showCandidates();
  if (!candidates.length) {
    this.setExpanded(false);
  }
};
WebJSZhuyinIME.CandidatesList.prototype.goForwardPage = function() {
  if ((this.page + 1) * this.CANDIDATES_PER_PAGE >= this.candidates.length)
    return;

  this.page += 1;
  this.showCandidates();
};
WebJSZhuyinIME.CandidatesList.prototype.goBackPage = function() {
  if (this.page === 0)
    return;

  this.page -= 1;
  this.showCandidates();
};
WebJSZhuyinIME.CandidatesList.prototype.setExpanded = function(expanded) {
  this.expanded = expanded;
  if (expanded) {
    this.element.classList.add(this.EXPANDED_CLASSNAME);
  } else {
    this.element.classList.remove(this.EXPANDED_CLASSNAME);
    this.page = 0;
    this.showCandidates();
  }
};
WebJSZhuyinIME.CandidatesList.prototype.showCandidates = function(candidates) {
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
WebJSZhuyinIME.CandidatesList.prototype.selectCandidate =
  function(indexOnList) {
    var index = this.page * this.CANDIDATES_PER_PAGE + indexOnList;
    if (typeof this.oncandidateselect === 'function')
      this.oncandidateselect(this.candidates[index]);
  };
WebJSZhuyinIME.CandidatesList.prototype.handleEvent = function(evt) {
  var el = evt.target;
  var index = parseInt(el.getAttribute('data-index'));
  if (!index)
    return;

  if (typeof this.oncandidateselect === 'function')
    this.oncandidateselect(this.candidates[index]);
};

'use strict';

module('JSZhuyinLayoutMapper');

test('getSymbolCodeFromCode()', function() {
  var code = JSZhuyinLayoutMapper.getSymbolCodeFromCode(('!').charCodeAt(0));
  equal(code, ('！').charCodeAt(0), 'Passed!');
});

test('getSelectionIndex()', function() {
  var index = JSZhuyinLayoutMapper.getSelectionIndex(('!').charCodeAt(0));
  equal(index, 0, 'Passed!');
});

module('JSZhuyinWebIME');

test('endComposition(input)', function() {
  var mockJSZhuyin = {
    unload: function() {}
  };

  var input = document.createElement('input');
  document.body.appendChild(input);
  input.focus();
  input.value = 'test123';
  input.selectionStart = input.selectionEnd = 4;

  var elements = {
    input: input,
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  webIME.endComposition('ing');
  equal(input.value, 'testing123', 'Passed!');
  equal(input.selectionStart, 7, 'Passed!');
  equal(input.selectionEnd, 7, 'Passed!');
  document.body.removeChild(input);
  webIME.unload();
});

test('endComposition(contenteditable)', function() {
  var mockJSZhuyin = {
    unload: function() {}
  };

  var input = document.createElement('p');
  input.setAttribute('contenteditable', true);
  document.body.appendChild(input);
  input.focus();
  input.textContent = 'test123';

  var sel = window.getSelection();
  var range = document.createRange();
  range.setStart(input.firstChild, 4);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);

  var elements = {
    input: input,
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  webIME.isContentEditable = true;
  webIME.endComposition('ing');
  equal(input.textContent, 'testing123', 'Passed!');

  var sel = window.getSelection();

  equal(sel.anchorNode, input.firstChild, 'Passed!');
  equal(sel.anchorOffset, 7, 'Passed!');
  equal(sel.focusNode, input.firstChild, 'Passed!');
  equal(sel.focusOffset, 7, 'Passed!');
  document.body.removeChild(input);
  webIME.unload();
});

test('endComposition(empty contenteditable)', function() {
  var mockJSZhuyin = {
    unload: function() {}
  };

  var input = document.createElement('p');
  input.setAttribute('contenteditable', true);
  document.body.appendChild(input);
  input.focus();

  // Force selection range to the focused element.
  // (needed for SlimerJS)
  var sel = window.getSelection();
  var range = document.createRange();
  range.setStart(input, 0);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);

  var elements = {
    input: input,
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  webIME.isContentEditable = true;
  webIME.endComposition('testing123');
  equal(input.textContent, 'testing123', 'Passed!');

  var sel = window.getSelection();

  equal(sel.anchorNode, input.firstChild, 'Passed!');
  equal(sel.anchorOffset, 10, 'Passed!');
  equal(sel.focusNode, input.firstChild, 'Passed!');
  equal(sel.focusOffset, 10, 'Passed!');
  document.body.removeChild(input);
  webIME.unload();
});

var getMockKeyEvent =
  function(type, keyCode, charCode, expectCancel, input, obj) {
    obj = obj || {};
    obj.type = type;
    obj.keyCode = keyCode;
    obj.charCode = charCode;
    obj.target = input;
    obj.preventDefault = function() {
      ok(expectCancel, '2Passed!');
    };
    return obj;
  };

test('handleEvent(Backspace)', function() {
  expect(4);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      equal(code, 0x08, '1Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  [ // WebKit/Blink (keydown event only)
    getMockKeyEvent('keydown', 0x08, 0, true, input),
    // Firefox
    getMockKeyEvent('keydown', 0x08, 0, true, input),
    getMockKeyEvent('keypress', 0x08, 0, false, input)
  ].forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(Backspace) (unhandled)', function() {
  expect(2);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      equal(code, 0x08, 'Passed!');
      return false;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  [ // WebKit/Blink (keydown event only)
    getMockKeyEvent('keydown', 0x08, 0, false, input),
    // Firefox
    getMockKeyEvent('keydown', 0x08, 0, false, input),
    getMockKeyEvent('keypress', 0x08, 0, false, input)
  ].forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(Enter)', function() {
  expect(4);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      equal(code, 0x0d, 'Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  [ // WebKit/Blink
    getMockKeyEvent('keydown', 0x0d, 0, true, input),
    getMockKeyEvent('keypress', 0x0d, 0x0d, false, input),
    // Firefox
    getMockKeyEvent('keydown', 0x0d, 0, true, input),
    getMockKeyEvent('keypress', 0x0d, 0, false, input)
  ].forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(Enter) (unhandled)', function() {
  expect(2);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      equal(code, 0x0d, 'Passed!');
      return false;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  [ // WebKit/Blink
    getMockKeyEvent('keydown', 0x0d, 0, false, input),
    getMockKeyEvent('keypress', 0x0d, 0x0d, false, input),
    // Firefox
    getMockKeyEvent('keydown', 0x0d, 0, false, input),
    getMockKeyEvent('keypress', 0x0d, 0, false, input)
  ].forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(Escape)', function() {
  expect(4);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      equal(code, 0x1b, 'Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  [ // WebKit/Blink
    getMockKeyEvent('keydown', 0x1b, 0, true, input),
    // Firefox
    getMockKeyEvent('keydown', 0x1b, 0, true, input),
    getMockKeyEvent('keypress', 0x1b, 0, true, input)
  ].forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(Shift + left arrow)', function() {
  expect(4);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      ok(false, 'Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  webIME.candidatesList.goBackPage = function() {
    ok(true, 'Passed!');
  };
  [ // WebKit/Blink
    getMockKeyEvent('keydown', 0x25, 0, true, input, { shiftKey: true }),
    // Firefox
    getMockKeyEvent('keydown', 0x25, 0, true, input, { shiftKey: true }),
    getMockKeyEvent('keypress', 0x25, 0, false, input, { shiftKey: true })
  ].forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(Shift + right arrow)', function() {
  expect(4);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      ok(false, 'Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  webIME.candidatesList.goForwardPage = function() {
    ok(true, 'Passed!');
  };
  [ // WebKit/Blink
    getMockKeyEvent('keydown', 0x27, 0, true, input, { shiftKey: true }),
    // Firefox
    getMockKeyEvent('keydown', 0x27, 0, true, input, { shiftKey: true }),
    getMockKeyEvent('keypress', 0x27, 0, false, input, { shiftKey: true })
  ].forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(left arrow)', function() {
  expect(0);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      ok(false, 'Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  webIME.candidatesList.goBackPage = function() {
    ok(false, 'Passed!');
  };
  [ // WebKit/Blink
    getMockKeyEvent('keydown', 0x25, 0, false, input),
    // Firefox
    getMockKeyEvent('keydown', 0x25, 0, false, input),
    getMockKeyEvent('keypress', 0x25, 0, false, input)
  ].forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(right arrow)', function() {
  expect(0);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      ok(false, 'Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  webIME.candidatesList.goForwardPage = function() {
    ok(false, 'Passed!');
  };
  [ // WebKit/Blink
    getMockKeyEvent('keydown', 0x27, 0, false, input),
    // Firefox
    getMockKeyEvent('keydown', 0x27, 0, false, input),
    getMockKeyEvent('keypress', 0x27, 0, false, input)
  ].forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(Shift + selection keys)', function() {
  expect(4 * 9);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      ok(false, 'Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  webIME.candidatesList.selectCandidate = function(index) {
    ok(true, 'Passed!');
    return true;
  };
  var events = [];
  JSZhuyinLayoutMapper.selectionKeys.split('').forEach(function(key, i) {
    var charCode = key.charCodeAt(0);
    var keyCode = 49 + i; // keyCode of number keys on US keyboard

    // WebKit/Blink
    events.push(
      getMockKeyEvent('keydown', keyCode, 0, false, input, { shiftKey: true }));
    events.push(
      getMockKeyEvent('keypress', charCode, charCode, true, input,
                      { shiftKey: true }));

    // Firefox
    events.push(
      getMockKeyEvent('keydown', keyCode, 0, false, input,
                      { shiftKey: true }));
    events.push(
      getMockKeyEvent('keypress', 0, charCode, true, input,
                      { shiftKey: true }));
  });

  events.forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(Shift + selection keys) (unhandled by candidate list)', function() {
  expect(6 * 9);
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      ok(true, 'Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  webIME.candidatesList.selectCandidate = function(index) {
    ok(true, 'Passed!');
    return false;
  };
  var events = [];
  JSZhuyinLayoutMapper.selectionKeys.split('').forEach(function(key, i) {
    var charCode = key.charCodeAt(0);
    var keyCode = 49 + i; // keyCode of number keys on US keyboard

    // WebKit/Blink
    events.push(
      getMockKeyEvent('keydown', keyCode, 0, false, input, { shiftKey: true }));
    events.push(
      getMockKeyEvent(
        'keypress', charCode, charCode, true, input, { shiftKey: true }));

    // Firefox
    events.push(
      getMockKeyEvent('keydown', keyCode, 0, false, input, { shiftKey: true }));
    events.push(
      getMockKeyEvent('keypress', 0, charCode, true, input,
                      { shiftKey: true }));
  });

  events.forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(keys)', function() {
  expect(4 * (26 + 11 + 10));
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      ok(true, 'Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  var events = [];

  var chars = (function getLowerCaseAtoZ() {
    var chars = '';
    for (var i = 0; i < 26; i++) {
      chars += String.fromCharCode(97 + i);
    }
    return chars;
  })() +
  '-=[]\\;\',./`' +
  '1234567890';

  var keys = (function getUpperCaseAtoZ() {
    var chars = '';
    for (var i = 0; i < 26; i++) {
      chars += String.fromCharCode(65 + i);
    }
    return chars;
  })() +
  String.fromCharCode(45, 61, 91, 93, 92, 59, 39, 44, 46, 47, 96) +
  '1234567890';

  keys.split('').forEach(function(keyCode, i) {
    var charCode = chars.charCodeAt(i);

    // WebKit/Blink
    events.push(
      getMockKeyEvent('keydown', keyCode, 0, false, input));
    events.push(
      getMockKeyEvent(
        'keypress', charCode, charCode, true, input));

    // Firefox
    events.push(
      getMockKeyEvent('keydown', keyCode, 0, false, input));
    events.push(
      getMockKeyEvent('keypress', 0, charCode, true, input));
  });

  events.forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

test('handleEvent(Shift + keys)', function() {
  expect(4 * (26 + 11 + 10));
  var mockJSZhuyin = {
    unload: function() {},
    handleKeyEvent: function(code) {
      ok(true, 'Passed!');
      return true;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  webIME.candidatesList.selectCandidate = function(index) {
    return false;
  };
  var events = [];

  var chars = (function getUpperCaseAtoZ() {
    var chars = '';
    for (var i = 0; i < 26; i++) {
      chars += String.fromCharCode(65 + i);
    }
    return chars;
  })() +
  '_+{}|:"<>?~' +
  '!@#$%^&*()';

  var keys = (function getUpperCaseAtoZ() {
    var chars = '';
    for (var i = 0; i < 26; i++) {
      chars += String.fromCharCode(65 + i);
    }
    return chars;
  })() +
  String.fromCharCode(45, 61, 91, 93, 92, 59, 39, 44, 46, 47, 96) +
  '1234567890';

  keys.split('').forEach(function(keyCode, i) {
    var charCode = chars.charCodeAt(i);

    // WebKit/Blink
    events.push(
      getMockKeyEvent('keydown', keyCode, 0, false, input, { shiftKey: true }));
    events.push(
      getMockKeyEvent(
        'keypress', charCode, charCode, true, input, { shiftKey: true }));

    // Firefox
    events.push(
      getMockKeyEvent('keydown', keyCode, 0, false, input, { shiftKey: true }));
    events.push(
      getMockKeyEvent('keypress', 0, charCode, true, input,
                      { shiftKey: true }));
  });

  events.forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

module('JSZhuyinWebIME.CandidatesList');

// TODO

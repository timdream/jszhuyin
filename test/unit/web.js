'use strict';

/* global D3EKeyboardEventHelper, JSZhuyinLayoutMapper, JSZhuyinWebIME */

module('D3EKeyboardEventHelper');

test('Backspace', function() {
  var events = [
    { key: 'Backspace', code: 'Backspace' },
    { keyIdentifier: 'U+0008' },
    { keyCode: 0x8, charCode: 0 }
  ];

  events.forEach(function(evt) {
    equal(D3EKeyboardEventHelper.getCodePropFromEvent(evt), 'Backspace');
    equal(D3EKeyboardEventHelper.getKeyPropFromEvent(evt), 'Backspace');
  });
});

test('Enter', function() {
  var events = [
    { key: 'Enter', code: 'Enter' },
    { keyIdentifier: 'Enter' },
    { keyCode: 0x0d, charCode: 0x0d },
    { keyCode: 0x0d, charCode: 0 }
  ];

  events.forEach(function(evt) {
    equal(D3EKeyboardEventHelper.getCodePropFromEvent(evt), 'Enter');
    equal(D3EKeyboardEventHelper.getKeyPropFromEvent(evt), 'Enter');
  });
});

test('Escape', function() {
  var events = [
    { key: 'Escape', code: 'Escape' },
    { keyIdentifier: 'U+001B' },
    { keyCode: 0x1b, charCode: 0x1b },
    { keyCode: 0x1b, charCode: 0 }
  ];

  events.forEach(function(evt) {
    equal(D3EKeyboardEventHelper.getCodePropFromEvent(evt), 'Escape');
    equal(D3EKeyboardEventHelper.getKeyPropFromEvent(evt), 'Escape');
  });
});

test('Space', function() {
  var events = [
    { key: 'Space', code: 'Space' },
    { keyIdentifier: 'U+0020' },
    { keyCode: 0x20, charCode: 0x20 },
    { keyCode: 0x20, charCode: 0 }
  ];

  events.forEach(function(evt) {
    equal(D3EKeyboardEventHelper.getCodePropFromEvent(evt), 'Space');
    equal(D3EKeyboardEventHelper.getKeyPropFromEvent(evt), 'Space');
  });
});

test('ArrowLeft', function() {
  var events = [
    { key: 'ArrowLeft', code: 'ArrowLeft' },
    { keyIdentifier: 'Left' },
    { keyCode: 0x25, charCode: 0 }
  ];

  events.forEach(function(evt) {
    equal(D3EKeyboardEventHelper.getCodePropFromEvent(evt), 'ArrowLeft');
    equal(D3EKeyboardEventHelper.getKeyPropFromEvent(evt), 'ArrowLeft');
  });
});

test('ArrowRight', function() {
  var events = [
    { key: 'ArrowRight', code: 'ArrowRight' },
    { keyIdentifier: 'Right' },
    { keyCode: 0x27, charCode: 0 }
  ];

  events.forEach(function(evt) {
    equal(D3EKeyboardEventHelper.getCodePropFromEvent(evt), 'ArrowRight');
    equal(D3EKeyboardEventHelper.getKeyPropFromEvent(evt), 'ArrowRight');
  });
});

(function() {
    // key, code, shiftKey, keyCode
  var testData = [
    ['~', 'Backquote', true, 0xc0 ],
    ['`', 'Backquote', false, 0xc0 ],
    ['_', 'Minus', true, 0xbd ],
    ['-', 'Minus', false, 0xbd ],
    ['_', 'Minus', true, 0xbd ],
    ['-', 'Minus', false, 0xbd ],
    ['+', 'Equal', true, 0xbb ],
    ['=', 'Equal', false, 0xbb ],
    ['{', 'BracketLeft', true, 0xdb ],
    ['[', 'BracketLeft', false, 0xdb ],
    ['}', 'BracketRight', true, 0xdd ],
    [']', 'BracketRight', false, 0xdd ],
    [':', 'Semicolon', true, 0xba ],
    [';', 'Semicolon', false, 0xba ],
    ['"', 'Quote', true, 0xde ],
    ['\'', 'Quote', false, 0xde ],
    ['<', 'Comma', true, 0xbc ],
    [',', 'Comma', false, 0xbc ],
    ['>', 'Period', true, 0xbe ],
    ['.', 'Period', false, 0xbe ],
    ['?', 'Slash', true, 0xbf ],
    ['/', 'Slash', false, 0xbf ],

    ['!', 'Digit1', true, 0x31 ],
    ['@', 'Digit2', true, 0x32 ],
    ['#', 'Digit3', true, 0x33 ],
    ['$', 'Digit4', true, 0x34 ],
    ['%', 'Digit5', true, 0x35 ],
    ['^', 'Digit6', true, 0x36 ],
    ['&', 'Digit7', true, 0x37 ],
    ['*', 'Digit8', true, 0x38 ],
    ['(', 'Digit9', true, 0x39 ],
    [')', 'Digit0', true, 0x30 ]
  ];

  var i, chr;
  for (i = 0; i < 10; i++) {
    chr = String.fromCharCode(0x30 + i);
    testData.push([chr, 'Digit' + chr, false, 0x30 + i ]);
  }

  for (i = 0; i < 26; i++) {
    chr = String.fromCharCode(0x41 + i);
    testData.push([chr, 'Key' + chr, true, 0x41 + i ]);
    testData.push([chr.toLowerCase(), 'Key' + chr, false, 0x41 + i ]);
  }

  testData.forEach(function(data) {
    test(data[0] + ' (' + data[1] + ')', function() {
      var codepoint = data[0].charCodeAt(0).toString(16).toUpperCase();
      while (codepoint.length < 4) {
        codepoint = '0' + codepoint;
      }

      var events = [
        // Old events: Firefox
        { type: 'keydown', keyCode: data[3], codeCode: 0, shiftKey: data[2] },
        { type: 'keypress', keyCode: 0,
          charCode: data[0].charCodeAt(0), shiftKey: data[2] },

        // Old events: WebKit/Chrome
        { type: 'keydown', keyCode: data[3], codeCode: 0, shiftKey: data[2] },
        { type: 'keypress', keyCode: data[0].charCodeAt(0),
          charCode: data[0].charCodeAt(0), shiftKey: data[2] },

        // Old DOM3
        { type: 'keydown', keyCode: data[3], codeCode: 0, shiftKey: data[2],
          keyIdentifier: 'U+' + codepoint },
        { type: 'keypress', keyCode: data[0].charCodeAt(0),
          charCode: data[0].charCodeAt(0), shiftKey: data[2],
          keyIdentifier: 'U+' + codepoint },

        // DOM3
        { type: 'keydown', keyCode: data[3], codeCode: 0, shiftKey: data[2],
          key: data[0], code: data[1] },
        { type: 'keypress', keyCode: 0,
          charCode: data[0].charCodeAt(0), shiftKey: data[2],
          key: data[0], code: data[1] }
      ];

      events.forEach(function(evt) {
        equal(D3EKeyboardEventHelper.getCodePropFromEvent(evt), data[1],
          'Code for ' + JSON.stringify(evt));
        equal(D3EKeyboardEventHelper.getKeyPropFromEvent(evt), data[0],
          'Key for ' + JSON.stringify(evt));
      });
    });
  });
})();

module('JSZhuyinLayoutMapper');

JSZhuyinLayoutMapper.codes.forEach(function(code, i) {
  test('getSymbolFromDOM3Code(' + code + ')', function() {
    equal(JSZhuyinLayoutMapper.getSymbolFromDOM3Code(code, false),
      JSZhuyinLayoutMapper.map.charAt(i),
      'getSymbolFromDOM3Code(' + code + ', false)');
    equal(JSZhuyinLayoutMapper.getSymbolFromDOM3Code(code, true),
      JSZhuyinLayoutMapper.shiftMap.charAt(i),
      'getSymbolFromDOM3Code(' + code + ', true)');
  });
});

test('getSymbolFromDOM3Code(Tab)', function() {
  equal(JSZhuyinLayoutMapper.getSymbolFromDOM3Code('Tab', false),
    undefined,
    'getSymbolFromDOM3Code(Tab, false)');
  equal(JSZhuyinLayoutMapper.getSymbolFromDOM3Code('Tab', true),
    undefined,
    'getSymbolFromDOM3Code(Tab, true)');
});

JSZhuyinLayoutMapper.selectionCodes.forEach(function(code, i) {
  test('getSelectionIndexFromDOM3Code(' + code + ')', function() {
    equal(JSZhuyinLayoutMapper.getSelectionIndexFromDOM3Code(code),
      i, 'getSymbolFromDOM3Code(' + code + ')');
  });
});

test('getSelectionIndexFromDOM3Code(KeyA)', function() {
  equal(JSZhuyinLayoutMapper.getSelectionIndexFromDOM3Code('KeyA'),
    -1, 'getSymbolFromDOM3Code(KeyA)');
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

  var sel2 = window.getSelection();

  equal(sel2.anchorNode, input.firstChild, 'Passed!');
  equal(sel2.anchorOffset, 7, 'Passed!');
  equal(sel2.focusNode, input.firstChild, 'Passed!');
  equal(sel2.focusOffset, 7, 'Passed!');
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

  var sel2 = window.getSelection();

  equal(sel2.anchorNode, input.firstChild, 'Passed!');
  equal(sel2.anchorOffset, 10, 'Passed!');
  equal(sel2.focusNode, input.firstChild, 'Passed!');
  equal(sel2.focusOffset, 10, 'Passed!');
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
      ok(expectCancel, 'evt.preventDefault() called.');
    };
    return obj;
  };

test('handleEvent(Backspace)', function() {
  expect(4);
  var mockJSZhuyin = {
    unload: function() {},
    handleKey: function(code) {
      equal(code, 'Backspace', '1Passed!');
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
    handleKey: function(code) {
      equal(code, 'Backspace', '1Passed!');
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
    handleKey: function(code) {
      equal(code, 'Enter', '1Passed!');
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
    handleKey: function(code) {
      equal(code, 'Enter', '1Passed!');
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
    handleKey: function(code) {
      equal(code, 'Escape', '1Passed!');
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

test('handleEvent(Shift + ArrowLeft)', function() {
  expect(4);
  var mockJSZhuyin = {
    unload: function() {},
    handleKey: function(code) {
      equal(code, 'Escape', '1Passed!');
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

test('handleEvent(Shift + ArrowRight)', function() {
  expect(4);
  var mockJSZhuyin = {
    unload: function() {},
    handleKey: function(code) {
      ok(false, 'handleKey called.');
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

test('handleEvent(ArrowLeft)', function() {
  expect(0);
  var mockJSZhuyin = {
    unload: function() {},
    handleKey: function(code) {
      ok(false, 'handleKey called.');
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

test('handleEvent(ArrowRight)', function() {
  expect(0);
  var mockJSZhuyin = {
    unload: function() {},
    handleKey: function(code) {
      ok(false, 'handleKey called.');
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

'!@#$%^&*('.split('').forEach(function(key, i) {
  var charCode = key.charCodeAt(0);
  var keyCode = 49 + i; // keyCode of number keys on US keyboard

  test('handleEvent(Shift + ' + i + ')', function() {
    expect(4);
    var mockJSZhuyin = {
      unload: function() {},
      handleKey: function(code) {
        ok(false, 'handleKey called.');
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

    events.forEach(function(mockKeyEvent) {
      webIME.handleEvent(mockKeyEvent);
    });
    webIME.unload();
  });
});

'!@#$%^&*('.split('').forEach(function(key, i) {
  var charCode = key.charCodeAt(0);
  var keyCode = 49 + i; // keyCode of number keys on US keyboard

  test('handleEvent(Shift + ' + i + ') (unhandled by candidate list)',
  function() {
    expect(6);
    var mockJSZhuyin = {
      unload: function() {},
      handleKey: function(key) {
        equal(key,
          JSZhuyinLayoutMapper.getSymbolFromDOM3Code('Digit' + (i + 1), true),
          'handleKey called.');
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

    events.forEach(function(mockKeyEvent) {
      webIME.handleEvent(mockKeyEvent);
    });
    webIME.unload();
  });
});

(function() {
  var keyCodeChars = (function getUpperCaseAtoZ() {
    var chars = '';
    for (var i = 0; i < 26; i++) {
      chars += String.fromCharCode(65 + i);
    }
    return chars;
  })() +
  String.fromCharCode(
    0xc0, 0xbd, 0xbb, 0xdb, 0xdd, 0xdc,
    0xba, 0xde, 0xbc, 0xbe, 0xbf) +
  '1234567890';

  var chars = (function getLowerCaseAtoZ() {
    var chars = '';
    for (var i = 0; i < 26; i++) {
      chars += String.fromCharCode(97 + i);
    }
    return chars;
  })() +
  '`-=[]\\;\',./' +
  '1234567890';

  var upperCaseChars = (function getUpperCaseAtoZ() {
    var chars = '';
    for (var i = 0; i < 26; i++) {
      chars += String.fromCharCode(65 + i);
    }
    return chars;
  })() +
  '~_+{}|:"<>?' +
  '!@#$%^&*()';

  keyCodeChars.split('').map(function(keyCodeChar) {
    return keyCodeChar.charCodeAt(0);
  }).forEach(function(keyCode, i) {
    test('handleEvent(' + chars.charAt(i) + ')', function() {
      expect(4);
      var charCode = chars.charCodeAt(i);

      var mockJSZhuyin = {
        unload: function() {},
        handleKey: function(key) {
          var expectedCode = D3EKeyboardEventHelper.getCodePropFromEvent({
            charCode: charCode
          });
          var expectedKey =
            JSZhuyinLayoutMapper.getSymbolFromDOM3Code(expectedCode) ||
            chars.charAt(i);
          equal(key, expectedKey, 'handleKey called.');
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

      events.forEach(function(mockKeyEvent) {
        webIME.handleEvent(mockKeyEvent);
      });
      webIME.unload();
    });

    test('handleEvent(Shift + ' + upperCaseChars.charAt(i) + ')', function() {
      expect(4);

      var charCode = upperCaseChars.charCodeAt(i);

      var mockJSZhuyin = {
        unload: function() {},
        handleKey: function(key) {
          var expectedCode = D3EKeyboardEventHelper.getCodePropFromEvent({
            charCode: charCode,
            shiftKey: true
          });
          var expectedKey =
            JSZhuyinLayoutMapper.getSymbolFromDOM3Code(expectedCode, true) ||
            chars.charAt(i);
          equal(key, expectedKey, 'handleKey called.');
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

      // WebKit/Blink
      events.push(
        getMockKeyEvent('keydown', keyCode, 0, false, input,
                        { shiftKey: true }));
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

      events.forEach(function(mockKeyEvent) {
        webIME.handleEvent(mockKeyEvent);
      });
      webIME.unload();
    });
  });
}());

test('handleEvent(Tab)', function() {
  expect(0);

  var mockJSZhuyin = {
    unload: function() {},
    handleKey: function(key) {
      ok(false, 'handleKey called.');
      return false;
    }
  };
  var input =  document.createElement('input');
  var elements = {
    composition: document.createElement('p'),
    candidatesList: document.createElement('ul')
  };
  var webIME = new JSZhuyinWebIME(elements, mockJSZhuyin);
  var events = [];

  events.push(
    getMockKeyEvent('keydown', 0x9, 0, false, input));

  events.push({
    type: 'keydown',
    keyCode: 0x9, charCode: 0,
    key: 'Tab', code: 'Tab',
    target: input
  });

  events.forEach(function(mockKeyEvent) {
    webIME.handleEvent(mockKeyEvent);
  });
  webIME.unload();
});

module('JSZhuyinWebIME.CandidatesList');

// TODO

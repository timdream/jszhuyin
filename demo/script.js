'use strict';

// minimal AMD define callback
window.define = function (moduleName, requiredModule, getter) {
  if (moduleName !== 'jszhuyin') {
    console.error('define() is only for jszhuyin in this project.');
    return;
  }
  // start up IMEFrontend after dom ready
  $(function () {

    window.IMEngine = getter();

    IMEFrontend.init(window.IMEngine);
  });
};

window.define.amd = true;

// Replace native XMLHttpRequest with one that comes with a progress event listener
window._XMLHttpRequest = window.XMLHttpRequest;
window.XMLHttpRequest = function XMLHttpRequest() {
  var xhr = new window._XMLHttpRequest();
  xhr.addEventListener('progress',
    function (ev) {
      $('#progress')
        .toggleClass('loading', ev.loaded !== ev.total)
        .find('span').text(Math.floor(ev.loaded/ev.total*1000)/10 + '%');
    }
  );
  return xhr;
};

var IMEFrontend = {
  init: function (engine) {
    var self = this;
    var $t = this.$t = $('#textarea');
    var $c = this.$c = $('#candidates');
    this.$s = $('#pending-symbols');

    this.sendCandidates([]);

    engine.init(
      {
        path: '../gaia/apps/keyboard/js/imes/jszhuyin/',
        sendPendingSymbols: function (symbols) {
          self.sendPendingSymbols(symbols);
        },
        sendCandidates: function (candidates) {
          self.sendCandidates(candidates);
        },
        sendKey: function (keyCode) {
          self.sendKey(keyCode);
        },
        sendString: function (str) {
          self.sendString(str);
        }
      }
    );
    engine.empty();

    window.onunload = function () {
      engine.uninit();
    };

    $t.on(
      'keypress',
      function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.altKey)
          return;

        var code = ev.keyCode || ev.charCode;

        // Entering candidate selection mode with down arrow
        if (!self.candidateSelectionMode
          && self.candidates.length
          && ev.keyCode == 40) {
          ev.preventDefault();
          self.$c.addClass('expanded');
          self.candidateSelectionMode = true;
          return;
        }

        if (self.candidateSelectionMode) {
          ev.preventDefault();

          // number keys: select selection
          if (code >= 49 && code <= 57) {
            var n = code - 49;
            self.$c.find(':eq(' + n + ')').click();
          }

          // right arrow
          if (ev.keyCode == 39) {
            if ((self.candidatePage + 1) * 9 < self.candidates.length) {
              self.candidatePage += 1;
              self.showCandidates();
            }
          }

          // left arrow
          if (ev.keyCode == 37) {
            if (self.candidatePage !== 0) {
              self.candidatePage -= 1;
              self.showCandidates();
            }
          }

          // up arrow
          if (ev.keyCode == 38) {
            self.candidatePage = 0;
            self.showCandidates();
            self.candidateSelectionMode = false;
            self.$c.removeClass('expanded');
          }

          return;
        }

        // Arrow keys and home/end/pgup/pgdn
        if (ev.keyCode >= 33 && ev.keyCode <= 40)
          return;

        var symbolCode = self.getSymbolCodeFromCode(code, ev.shiftKey);

        ev.preventDefault();
        engine.click(symbolCode);
      }
    ).focus();

    $c.on(
      'click',
      function (ev) {
        var $li = $(ev.target);
        engine.select($li.text(), $li.data('type'));
        $t.focus();
      }
    );
  },

  sendPendingSymbols: function (symbols) {
    this.$s.text(symbols);
  },

  sendCandidates: function (candidates) {
    this.candidates = candidates;
    this.candidatePage = 0;
    this.showCandidates();
    if (!candidates.length) {
      this.candidateSelectionMode = false;
      this.$c.removeClass('expanded');
    }
  },

  showCandidates: function () {
    var $c = this.$c;
    $c.empty();
    this.candidates.slice(
      this.candidatePage * 9, this.candidatePage * 9 + 9
    ).forEach(
      function (candidate) {
        var $li = $('<li />').text(candidate[0]).data('type', candidate[1]);
        $c.append($li);
      }
    );
  },

  sendKey: function (code) {
    switch (code) {
      case 8:
        this.textAreaBackspace();
        break;
      default:
        this.textAreaInsertString(String.fromCharCode(code));
        break;
    }
  },

  sendString: function (str) {
    this.textAreaInsertString(str);
  },

  textAreaBackspace: function () {
    var $t = this.$t;
    var t = $t[0];

    var selStart = t.selectionStart;

    if (selStart === t.selectionEnd) {
      // remove one char before selStart
      t.value = t.value.substr(0, selStart - 1)
        + t.value.substr(selStart, t.value.length);
      t.selectionStart = t.selectionEnd = selStart - 1;
    } else {
      // remove selected substr
      t.value = t.value.substr(0, selStart)
        + t.value.substr(t.selectionEnd, t.value.length);
      t.selectionStart = t.selectionEnd = selStart;
    }
  },

  textAreaInsertString: function (str) {
    var $t = this.$t;
    var t = $t[0];

    var selStart = t.selectionStart;

    t.value = t.value.substr(0, selStart) + str + t.value.substr(t.selectionEnd, t.value.length);
    t.selectionStart = t.selectionEnd = selStart + str.length;
  },

  shiftMapping: {
    '<':'，',
    '>':'。',
    '?':'？',
    '"':'、'
  },

  zhuyinMapping: {
    ',':'ㄝ',
    '-':'ㄦ',
    '.':'ㄡ',
    '/':'ㄥ',
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
    'a':'ㄇ',
    'b':'ㄖ',
    'c':'ㄏ',
    'd':'ㄎ',
    'e':'ㄍ',
    'f':'ㄑ',
    'g':'ㄕ',
    'h':'ㄘ',
    'i':'ㄛ',
    'j':'ㄨ',
    'k':'ㄜ',
    'l':'ㄠ',
    'm':'ㄩ',
    'n':'ㄙ',
    'o':'ㄟ',
    'p':'ㄣ',
    'q':'ㄆ',
    'r':'ㄐ',
    's':'ㄋ',
    't':'ㄔ',
    'u':'ㄧ',
    'v':'ㄒ',
    'w':'ㄊ',
    'x':'ㄌ',
    'y':'ㄗ',
    'z':'ㄈ'
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
  },
};

var tests = [
  ['ㄊㄞˊㄅㄟˇㄊㄞˊㄅㄟˇ', '台北台北', 'sentence'],
  ['ㄊㄅㄟˇ', '台北', 'incomplete syllable'],
  ['ㄊㄞˊㄅ', '台北', 'autocomplete syllable'],
  ['ㄊㄅ', '台北', 'autocomplete syllable + incomplete syllable'],
  ['ㄙㄧ', '所以', 'intelligent symbol spliting'],
  ['ㄊㄨ␈ㄅ', '台北', 'backspace then a new syllable'],
  ['ㄊㄨ␈ㄞˊㄅ', '台北', 'backspace then complete the syllable'],
  ['ㄓ␈ㄊㄅ', '台北', 'backspace to beginning'],
  ['ㄓㄨㄥ ␈␈␈␈ㄊㄅ', '台北','4 backspace to beginning'],
  ['ㄓㄨˋㄧㄣ ㄕㄨ ㄖㄨˋㄈㄚˇㄔㄠ ㄍㄨㄛˋㄔㄤˊㄉㄨˋ',
    '輸入法超過長度', 'force output on buffer limit'],
  ['ㄊㄞˊㄅㄟˇ␍', '市', 'suggestions'],
  ['ㄊㄞˊㄅㄟˇ␍␈', '', 'remove suggestion list'],
  ['ㄊㄞˊㄅㄟˇ！', '', 'remove suggestion list']
];

function runtests() {
  var currentTest = 0;
  var textarea = $('#textarea')[0];
  textarea.value = '';
  var $c = $('#candidates');

  var test = function () {
    IMEngine.empty();
    if (tests.length <= currentTest)
      return;

    IMEngine.empty();

    tests[currentTest][0].split('').forEach(
      function (key) {
        switch (key) {
          case '␈':
            IMEngine.click(8);
            break;
          case '␍':
            IMEngine.click(13);
            break;
          default:
            IMEngine.click(key.charCodeAt(0));
            break;
        }
      }
    );

    var d = Date.now();
    var timer = setInterval(function () {
      if ($('ol').find(':first').text() === tests[currentTest][1]) {
        textarea.value += 'Test ' + currentTest + ' succeed (' + tests[currentTest][2] + ')\n';
        clearTimeout(timer);
        currentTest++;
        setTimeout(test, 0);
      }
      if (Date.now() - d > 5000) {
        textarea.value += 'Test ' + currentTest + ' TIMEOUT ('
          + tests[currentTest][2] +
          ', input: ' + tests[currentTest][0] +
          ', expect: ' + tests[currentTest][1] +
          ', actual: ' + $('ol').find(':first').text() + ')\n';
        clearTimeout(timer);
        currentTest++;
        setTimeout(test, 0);
      }
    }, 50);
  };
  test();
}

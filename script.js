'use strict';

// minimal AMD define callback
window.define = function (moduleName, requiredModule, getter) {
  if (moduleName !== 'jszhuyin') {
    console.error('define() is only for jszhuyin in this project.');
    return;
  }
  // start up IMEDemo after dom ready
  $(function () {
    IMEDemo.init(getter());
  });
};

window.define.amd = true;

var IMEDemo = {
  init: function (engine) {
    var self = this;
    var $t = this.$t = $('#textarea');
    var $c = this.$c = $('#candidates');

    engine.init(
      {
        path: '../gaia/apps/homescreen/imes/jszhuyin/',
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

    $t.on(
      'keypress',
      function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.altKey)
          return;

        var code = ev.keyCode || ev.charCode;

        if (ev.keyCode >= 33 && ev.keyCode <= 40) {
          // Arrow keys and home/end/pgup/pgdn
          return;
        }

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

  sendCandidates: function (candidates) {
    var $c = this.$c;
    $c.empty();
    candidates.forEach(
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

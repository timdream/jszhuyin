'use strict';

var assert = require('chai').assert;

var BopomofoEncoder = require('../../lib/bopomofo_encoder.js');
var McBopomofoLineData = require('../../build/mcbopomofo_line_data.js');

suite('McBopomofoLineData');

test('empty data', function() {
  var lineData = new McBopomofoLineData();
  lineData.parse('');
  assert.equal(lineData.isValid, false);
});

test('㎞ _punctuation_list 0.0', function() {
  var lineData = new McBopomofoLineData();
  lineData.parse('㎞ _punctuation_list 0.0');
  assert.equal(lineData.isValid, false);
});

// TODO: This should be valid
test('✈ ㄈㄟ-ㄐㄧ 0.0', function() {
  var lineData = new McBopomofoLineData();
  lineData.parse('✈ ㄈㄟ-ㄐㄧ 0.0');
  assert.equal(lineData.isValid, false);
});

// TODO: This should be valid
test('𡻈 ㄓㄣ 0.0 (CJK Ext. B)', function() {
  var lineData = new McBopomofoLineData();
  lineData.parse('✈ ㄈㄟ-ㄐㄧ 0.0');
  assert.equal(lineData.isValid, false);
});

test('自食其力 ㄗˋ-ㄕˊ-ㄑㄧˊ-ㄌㄧˋ -5.41649390', function() {
  var lineData =
    new McBopomofoLineData();
  lineData.parse('自食其力 ㄗˋ-ㄕˊ-ㄑㄧˊ-ㄌㄧˋ -5.41649390');
  assert.equal(lineData.isValid, true);
  assert.equal(lineData.str, '自食其力');
  assert.equal(BopomofoEncoder.decode(lineData.encodedStr),
    'ㄗˋㄕˊㄑㄧˊㄌㄧˋ');
  assert.equal(BopomofoEncoder.decode(lineData.shortcutEncodedStr),
    'ㄗㄕㄑㄌ');
  assert.equal(lineData.score, -5.41649390);
});

test('花開花落 ㄏㄨㄚ-ㄎㄞ-ㄏㄨㄚ-ㄌㄨㄛˋ -6.56262194', function() {
  var lineData =
    new McBopomofoLineData();
  lineData.parse('花開花落 ㄏㄨㄚ-ㄎㄞ-ㄏㄨㄚ-ㄌㄨㄛˋ -6.56262194');
  assert.equal(lineData.isValid, true);
  assert.equal(lineData.str, '花開花落');
  assert.equal(BopomofoEncoder.decode(lineData.encodedStr),
    'ㄏㄨㄚ\u02c9ㄎㄞ\u02c9ㄏㄨㄚ\u02c9ㄌㄨㄛˋ',
    'First tone is inserted here.');
  assert.equal(BopomofoEncoder.decode(lineData.shortcutEncodedStr),
    'ㄏㄎㄏㄌ');
  assert.equal(lineData.score, -6.56262194);
});

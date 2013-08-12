'use strict';

module('BopomofoEncoder');

test('encode() should follow the original spec.', function() {
  var str = BopomofoEncoder.encode('ㄉㄧㄢˋ');

  equal(str, String.fromCharCode(2764), 'Passed!');
});

test('encode() should encode multiple symbols.', function() {
  var syllablesStr = 'ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ';
  var str = BopomofoEncoder.encode(syllablesStr);

  equal(str, 'ἄÑ⌁┄ࠋ', 'Passed!');
});

test('encode() should encode multiple partial symbols.', function() {
  var syllablesStr = 'ㄓㄨˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(syllablesStr);

  equal(str, 'ἄÐ∀␀ࠀ', 'Passed!');
});

test('encode() should encode multiple partial symbols with \'tone\' set to \'all\'.', function() {
  var syllablesStr = 'ㄓㄨˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(syllablesStr, { tone: 'all' });

  equal(str, 'ἄÑ∁␁ࠁ', 'Passed!');
});

test('encode() should encode multiple partial symbols with \'tone\' set to \'more-than-one-symbol\'.', function() {
  var syllablesStr = 'ㄓㄨˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(syllablesStr, { tone: 'more-than-one-symbol' });

  equal(str, 'ἄÑ∀␀ࠀ', 'Passed!');
});

test('encode() should throw if syllablesStr contains illegal symbol.', function() {
  var syllablesStr = 'Hello world!';
  try {
    var str = BopomofoEncoder.encode(syllablesStr);
  } catch (e) {
    ok(true, 'Passed!');
    return;
  }
  ok(false, 'Passed!');
});

test('decode() should follow the original spec.', function() {
  var str = BopomofoEncoder.decode(String.fromCharCode(2764));

  equal(str, 'ㄉㄧㄢˋ', 'Passed!');
});

test('decode() should decode multiple symbols.', function() {
  var encodedStr = 'ἄÑ⌁┄ࠋ';
  var str = BopomofoEncoder.decode(encodedStr);

  equal(str, 'ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ', 'Passed!');
});

test('decode() should decode multiple partial symbols.', function() {
  var encodedStr = 'ἄÐ∀␀ࠀ';
  var str = BopomofoEncoder.decode(encodedStr);

  equal(str, 'ㄓㄨˋㄧㄣㄕㄖㄈ', 'Passed!');
});

test('isBopomofoSymbol() should work with Bopomofo symbol string.', function() {
  var flag = BopomofoEncoder.isBopomofoSymbol('ㄉ');

  equal(flag, true, 'Passed!');
});

test('isBopomofoSymbol() should work with Bopomofo symbol code.', function() {
  var flag = BopomofoEncoder.isBopomofoSymbol(('ㄉ').charCodeAt(0));

  equal(flag, true, 'Passed!');
});

test('isBopomofoSymbol() should work with Bopomofo symbol string.', function() {
  var flag = BopomofoEncoder.isBopomofoSymbol('x');

  equal(flag, false, 'Passed!');
});

test('isBopomofoSymbol() should work with non-Bopomofo symbol code.', function() {
  var flag = BopomofoEncoder.isBopomofoSymbol(('x').charCodeAt(0));

  equal(flag, false, 'Passed!');
});

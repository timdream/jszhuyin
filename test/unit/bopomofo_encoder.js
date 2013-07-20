'use strict';

module('BopomofoEncoder');

test('encode() should follow the original spec.', function() {
  var str = BopomofoEncoder.encode('ㄉㄧㄢˋ');

  equal(str, String.fromCharCode(2764), 'Passed!');
});

test('encode() should encode multiple symbols.', function() {
  var syllablesStr = 'ㄓㄨˋㄧㄣ ㄕㄨ ㄖㄨˋㄈㄚˇ';
  var str = BopomofoEncoder.encode(syllablesStr);

  equal(str, 'ἄÑ⌁┄ࠋ', 'Passed!');
});

test('encode() should encode multiple partial symbols.', function() {
  var syllablesStr = 'ㄓㄨˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(syllablesStr);

  equal(str, 'ἄÐ∀␀ࠀ', 'Passed!');
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

  equal(str, 'ㄓㄨˋㄧㄣ ㄕㄨ ㄖㄨˋㄈㄚˇ', 'Passed!');
});

test('decode() should decode multiple partial symbols.', function() {
  var encodedStr = 'ἄÐ∀␀ࠀ';
  var str = BopomofoEncoder.decode(encodedStr);

  equal(str, 'ㄓㄨˋㄧㄣㄕㄖㄈ', 'Passed!');
});

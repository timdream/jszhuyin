'use strict';

/* global BopomofoEncoder */

module('BopomofoEncoder');

test('encode() should follow the original spec.', function() {
  var str = BopomofoEncoder.encode('ㄉㄧㄢˋ');

  equal(str, String.fromCharCode(2764), 'Passed!');
});

test('encode() should encode multiple symbols.', function() {
  var syllablesStr = 'ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ';
  var str = BopomofoEncoder.encode(syllablesStr);

  // ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ
  equal(str, 'ἄÑ⌁┄ࠋ', 'Passed!');
});

test('encode() should encode multiple partial symbols.', function() {
  var syllablesStr = 'ㄓㄨˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(syllablesStr);

  // ㄓㄨˋㄧㄣㄕㄖㄈ
  equal(str, 'ἄÐ∀␀ࠀ', 'Passed!');
});

test('encode() should encode multiple partial symbols ' +
    'with \'tone\' set to \'all\'.', function() {
  var syllablesStr = 'ㄓㄨˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(syllablesStr, { tone: 'all' });

  // ㄓㄨˋㄧㄣˉㄕˉㄖˉㄈˉ
  equal(str, 'ἄÑ∁␁ࠁ', 'Passed!');
});

test('encode() should encode multiple partial symbols ' +
    'with \'tone\' set to \'more-than-one-symbol\'.', function() {
  var syllablesStr = 'ㄓㄨˋㄧㄣㄕㄖㄈ';
  var str =
    BopomofoEncoder.encode(syllablesStr, { tone: 'more-than-one-symbol' });

  // ㄓㄨˋㄧㄣˉㄕㄖㄈ
  equal(str, 'ἄÑ∀␀ࠀ', 'Passed!');
});


test('encode() should encode multiple partial symbols ' +
    'with correct order if \'reorder\' is set to \'true\'.', function() {
  var syllablesStr = 'ㄨㄓˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(syllablesStr, { reorder: true });

  // ㄓㄨˋㄕㄧㄣㄖㄈ
  equal(str, 'ἄ⋐␀ࠀ', 'Passed!');
});

test('encode() should throw if syllablesStr contains illegal symbol.',
function() {
  var syllablesStr = 'Hello world!';
  try {
    BopomofoEncoder.encode(syllablesStr);
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

test('isBopomofoSymbol() should work with non-Bopomofo symbol code.',
function() {
  var flag = BopomofoEncoder.isBopomofoSymbol(('x').charCodeAt(0));

  equal(flag, false, 'Passed!');
});

test('isIncompletionOf() should compare ㄉ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄉ').charCodeAt(0),
    BopomofoEncoder.encode('ㄉㄧㄢˋ').charCodeAt(0)
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄉ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄉ').charCodeAt(0),
    BopomofoEncoder.encode('ㄉㄧㄢˋ').charCodeAt(0)
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄉㄧ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄉㄧ').charCodeAt(0),
    BopomofoEncoder.encode('ㄉㄧㄢˋ').charCodeAt(0)
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄉㄧㄢ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄉㄧㄢ').charCodeAt(0),
    BopomofoEncoder.encode('ㄉㄧㄢˋ').charCodeAt(0)
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄓ with ㄓㄨˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄓ').charCodeAt(0),
    BopomofoEncoder.encode('ㄓㄨˋ').charCodeAt(0)
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄓㄨ with ㄓㄨˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄓㄨ').charCodeAt(0),
    BopomofoEncoder.encode('ㄓㄨˋ').charCodeAt(0)
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄓㄨˋ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄓㄨˋ').charCodeAt(0),
    BopomofoEncoder.encode('ㄉㄧㄢˋ').charCodeAt(0)
  );

  equal(flag, false, 'Passed!');
});

test('isIncompletionOf() should compare ㄧㄢˋ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄧㄢˋ').charCodeAt(0),
    BopomofoEncoder.encode('ㄉㄧㄢˋ').charCodeAt(0)
  );

  equal(flag, false, 'Passed!');
});

test('isIncompletionOf() should compare ㄉㄢ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄉㄢ').charCodeAt(0),
    BopomofoEncoder.encode('ㄉㄧㄢˋ').charCodeAt(0)
  );

  equal(flag, false, 'Passed!');
});

test('isIncompletionOf() should compare ㄢˋ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄢˋ').charCodeAt(0),
    BopomofoEncoder.encode('ㄉㄧㄢˋ').charCodeAt(0)
  );

  equal(flag, false, 'Passed!');
});

test('isIncompletionOf() should compare ㄨ with ㄓㄨˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄨ').charCodeAt(0),
    BopomofoEncoder.encode('ㄓㄨˋ').charCodeAt(0)
  );

  equal(flag, false, 'Passed!');
});

test('isCompleted(ㄓㄨˋ)', function() {
  var flag = BopomofoEncoder.isCompleted(
    BopomofoEncoder.encode('ㄓㄨˋ').charCodeAt(0));

  equal(flag, true, 'Passed!');
});

test('isCompleted(ㄨ)', function() {
  var flag = BopomofoEncoder.isCompleted(
    BopomofoEncoder.encode('ㄨ').charCodeAt(0));

  equal(flag, false, 'Passed!');
});

test('replace(ㄖㄤˊ,ㄤ,ㄢ)', function() {
  var code = BopomofoEncoder.replace(
      BopomofoEncoder.encode('ㄖㄤˊ').charCodeAt(0),
      BopomofoEncoder.encode('ㄤ').charCodeAt(0),
      BopomofoEncoder.encode('ㄢ').charCodeAt(0)
    );
  equal(code, BopomofoEncoder.encode('ㄖㄢˊ').charCodeAt(0), 'Passed!');
});

test('replace(ㄖㄣˊ,ㄤ,ㄢ)', function() {
  var code = BopomofoEncoder.replace(
      BopomofoEncoder.encode('ㄖㄣˊ').charCodeAt(0),
      BopomofoEncoder.encode('ㄤ').charCodeAt(0),
      BopomofoEncoder.encode('ㄢ').charCodeAt(0)
    );
  equal(code, BopomofoEncoder.encode('ㄖㄣˊ').charCodeAt(0), 'Passed!');
});

test('replace(ㄏㄡˇ,ㄡ,ㄨㄛ)', function() {
  var code = BopomofoEncoder.replace(
      BopomofoEncoder.encode('ㄏㄡˇ').charCodeAt(0),
      BopomofoEncoder.encode('ㄡ').charCodeAt(0),
      BopomofoEncoder.encode('ㄨㄛ').charCodeAt(0)
    );
  equal(code, BopomofoEncoder.encode('ㄏㄨㄛˇ').charCodeAt(0), 'Passed!');
});

test('replace(ㄏㄨㄛˇ,ㄨㄛ,ㄡ)', function() {
  var code = BopomofoEncoder.replace(
      BopomofoEncoder.encode('ㄏㄨㄛˇ').charCodeAt(0),
      BopomofoEncoder.encode('ㄨㄛ').charCodeAt(0),
      BopomofoEncoder.encode('ㄡ').charCodeAt(0)
    );
  equal(code, BopomofoEncoder.encode('ㄏㄡˇ').charCodeAt(0), 'Passed!');
});

test('replace(ㄏㄨˇ,ㄨㄛ,ㄡ)', function() {
  var code = BopomofoEncoder.replace(
      BopomofoEncoder.encode('ㄏㄨˇ').charCodeAt(0),
      BopomofoEncoder.encode('ㄨㄛ').charCodeAt(0),
      BopomofoEncoder.encode('ㄡ').charCodeAt(0)
    );
  equal(code, BopomofoEncoder.encode('ㄏㄨˇ').charCodeAt(0), 'Passed!');
});

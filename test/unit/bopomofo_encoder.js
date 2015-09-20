'use strict';

/* global BopomofoEncoder */

module('BopomofoEncoder');

test('encode() should follow the original spec.', function() {
  var str = BopomofoEncoder.encode('ㄉㄧㄢˋ');

  equal(str, String.fromCharCode(2764), 'Passed!');
});

test('encode() should encode multiple symbols.', function() {
  var symbols = 'ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ';
  var str = BopomofoEncoder.encode(symbols);

  // ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ
  equal(str, 'ἄÑ⌁┄ࠋ', 'Passed!');
});

test('encode() should encode multiple partial symbols.', function() {
  var symbols = 'ㄓㄨˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(symbols);

  // ㄓㄨˋㄧㄣㄕㄖㄈ
  equal(str, 'ἄÐ∀␀ࠀ', 'Passed!');
});

test('encode() should encode multiple partial symbols ' +
    'with correct order if \'reorder\' is set to \'true\'.', function() {
  var symbols = 'ㄨㄓˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(symbols, { reorder: true });

  // ㄓㄨˋㄕㄧㄣㄖㄈ
  equal(str, 'ἄ⋐␀ࠀ', 'Passed!');
});

test('encode() should throw if symbols contains illegal symbol.',
function() {
  var symbols = 'Hello world!';
  try {
    BopomofoEncoder.encode(symbols);
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

test('appendToSymbols()', function() {
  var symbols =
    BopomofoEncoder.appendToSymbols('ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈ', 'ㄚ');

  equal(symbols, 'ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚ', 'Passed!');
});

test('appendToSymbols() with APPEND_MODE_REORDER', function() {
  var symbols =
    BopomofoEncoder.appendToSymbols('ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄚ', 'ㄈ',
      BopomofoEncoder.APPEND_MODE_REORDER);

  equal(symbols, 'ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚ', 'Passed!');
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

test('split(ㄏㄨㄛˇ)', function() {
  var codes = BopomofoEncoder.split(
    BopomofoEncoder.encode('ㄏㄨㄛˇ').charCodeAt(0));
  deepEqual(codes, [
    [ BopomofoEncoder.encode('ㄏㄨㄛˇ').charCodeAt(0) ]
  ], 'Don\'t split completed code.');
});

test('split(ㄏㄨㄛ)', function() {
  var codes = BopomofoEncoder.split(
    BopomofoEncoder.encode('ㄏㄨㄛ').charCodeAt(0));
  deepEqual(codes, [
    [ BopomofoEncoder.encode('ㄏㄨㄛ').charCodeAt(0) ],
    [ BopomofoEncoder.encode('ㄏ').charCodeAt(0),
      BopomofoEncoder.encode('ㄨㄛ').charCodeAt(0) ],
    [ BopomofoEncoder.encode('ㄏㄨ').charCodeAt(0),
      BopomofoEncoder.encode('ㄛ').charCodeAt(0) ],
    [ BopomofoEncoder.encode('ㄏ').charCodeAt(0),
      BopomofoEncoder.encode('ㄨ').charCodeAt(0),
      BopomofoEncoder.encode('ㄛ').charCodeAt(0) ] ], 'Split 3-symbol code.');
});

test('split(ㄏㄨ)', function() {
  var codes = BopomofoEncoder.split(
    BopomofoEncoder.encode('ㄏㄨ').charCodeAt(0));
  deepEqual(codes, [
    [ BopomofoEncoder.encode('ㄏㄨ').charCodeAt(0) ],
    [ BopomofoEncoder.encode('ㄏ').charCodeAt(0),
      BopomofoEncoder.encode('ㄨ').charCodeAt(0) ] ], 'Split 2-symbol code.');
});

test('split(ㄨㄛ)', function() {
  var codes = BopomofoEncoder.split(
    BopomofoEncoder.encode('ㄨㄛ').charCodeAt(0));
  deepEqual(codes, [
    [ BopomofoEncoder.encode('ㄨㄛ').charCodeAt(0) ],
    [ BopomofoEncoder.encode('ㄨ').charCodeAt(0),
      BopomofoEncoder.encode('ㄛ').charCodeAt(0) ] ], 'Split 2-symbol code.');
});

test('split(ㄏ)', function() {
  var codes = BopomofoEncoder.split(
    BopomofoEncoder.encode('ㄏ').charCodeAt(0));
  deepEqual(codes, [
    [ BopomofoEncoder.encode('ㄏ').charCodeAt(0) ] ], 'Split 1-symbol code.');
});

test('split(ㄨ)', function() {
  var codes = BopomofoEncoder.split(
    BopomofoEncoder.encode('ㄨ').charCodeAt(0));
  deepEqual(codes, [
    [ BopomofoEncoder.encode('ㄨ').charCodeAt(0) ] ], 'Split 1-symbol code.');
});

test('split(ㄛ)', function() {
  var codes = BopomofoEncoder.split(
    BopomofoEncoder.encode('ㄛ').charCodeAt(0));
  deepEqual(codes, [
    [ BopomofoEncoder.encode('ㄛ').charCodeAt(0) ] ], 'Split 1-symbol code.');
});

'use strict';

/* global BopomofoEncoder */

module('BopomofoEncoder');

test('encode() should follow the original spec.', function() {
  var str = BopomofoEncoder.encode('ㄉㄧㄢˋ');

  deepEqual(str, [2764], 'Passed!');
});

test('encode() should encode multiple symbols.', function() {
  var symbols = 'ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ';
  var str = BopomofoEncoder.encode(symbols);

  // ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ
  deepEqual(str, [7940, 209, 8961, 9476, 2059], 'Passed!');
});

test('encode() should encode multiple partial symbols.', function() {
  var symbols = 'ㄓㄨˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(symbols);

  // ㄓㄨˋㄧㄣㄕㄖㄈ
  deepEqual(str, [7940, 208, 8704, 9216, 2048], 'Passed!');
});

test('encode() should encode multiple partial symbols ' +
    'with correct order if \'reorder\' is set to \'true\'.', function() {
  var symbols = 'ㄨㄓˋㄧㄣㄕㄖㄈ';
  var str = BopomofoEncoder.encode(symbols, { reorder: true });

  // ㄓㄨˋㄕㄧㄣㄖㄈ
  deepEqual(str, [7940, 8912, 9216, 2048], 'Passed!');
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
  var str = BopomofoEncoder.decode([2764]);

  equal(str, 'ㄉㄧㄢˋ', 'Passed!');
});

test('decode() should decode multiple symbols.', function() {
  var encodedStr = [7940, 209, 8961, 9476, 2059];
  var str = BopomofoEncoder.decode(encodedStr);

  equal(str, 'ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ', 'Passed!');
});

test('decode() should decode multiple partial symbols.', function() {
  var encodedStr = [7940, 208, 8704, 9216, 2048];
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
    BopomofoEncoder.encode('ㄉ')[0],
    BopomofoEncoder.encode('ㄉㄧㄢˋ')[0]
  );

  equal(flag, true, 'Passed!');
});

test('encodeExpended() (completed sounds)', function() {
  var arr =
    BopomofoEncoder.encodeExpended('ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ');

  // ㄓㄨˋㄧㄣˉㄕㄨˉㄖㄨˋㄈㄚˇ
  var expectedArr = [7940, 209, 8961, 9476, 2059];

  deepEqual(arr, expectedArr, 'Passed!');
});

test('encodeExpended() (incompleted sounds)', function() {
  var arr =
    BopomofoEncoder.encodeExpended('ㄓㄨㄧㄣㄕㄨㄖㄨㄈㄚ');

  var expectedArr = [7680, 256, 128, 80, 8704, 256, 9216, 256, 2048, 8];

  deepEqual(arr, expectedArr, 'Passed!');
});

test('encodeExpended() (mix completed and incompleted sounds)',
function() {
  var tests = [
    [ 'ㄓㄨㄧㄣㄕㄨˉㄖㄨㄈㄚ', [7680, 256, 128, 80, 8961, 9216, 256, 2048, 8]],
    [ 'ㄓㄧㄕㄖㄈㄚˇ', [7680, 128, 8704, 9216, 2059]],
    [ 'ㄓㄨˋㄧㄕㄖㄈ', [7940, 128, 8704, 9216, 2048]],
    [ 'ˉˇ', [1, 3]]
  ];

  tests.forEach(function(test) {
    deepEqual(BopomofoEncoder.encodeExpended(test[0]), test[1], test[0]);
  });
});

test('trimToLength()', function() {
  var tests = [
    [ 'ㄓㄓㄓ', 'ㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓ', 'ㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓㄉ', 'ㄓㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓㄨㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓㄓㄨ' ],
    [ 'ㄓㄓㄓㄓㄓㄉㄧㄢㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓㄉㄧㄢ' ],
    [ 'ㄓㄓㄓㄓㄓㄉㄧㄢˋㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓㄉㄧㄢˋ' ]
  ];

  tests.forEach(function(test) {
    var expendedEncodedSounds = BopomofoEncoder.encodeExpended(test[0]);
    equal(
      BopomofoEncoder.trimToLength(expendedEncodedSounds, 6), test[1], test[0]);
    equal(BopomofoEncoder.trimToLength(test[0], 6), test[1], test[0]);
  });
});

test('trimToLengthFromEnd()', function() {
  var tests = [
    [ 'ㄓㄓㄓ', 'ㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓ', 'ㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓㄓ' ],
    [ 'ㄉㄓㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓ', 'ㄓㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄨㄓㄓㄓㄓㄓ', 'ㄓㄨㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄉㄧㄢㄓㄓㄓㄓㄓ', 'ㄉㄧㄢㄓㄓㄓㄓㄓ' ],
    [ 'ㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓㄉㄧㄢˋㄓㄓㄓㄓㄓ', 'ㄉㄧㄢˋㄓㄓㄓㄓㄓ' ]
  ];

  tests.forEach(function(test) {
    var expendedEncodedSounds = BopomofoEncoder.encodeExpended(test[0]);
    equal(
      BopomofoEncoder.trimToLengthFromEnd(expendedEncodedSounds, 6),
      test[1], test[0]);
    equal(BopomofoEncoder.trimToLengthFromEnd(test[0], 6),
      test[1], test[0]);
  });
});

test('getSymbolCombinations()', function() {
  var tests = [
    [ 'ㄓㄨ',
      [ [7936],
        [7680, 256] ] ],
    [ 'ㄉㄧㄢˋ',
      [ [ 2764 ] ] ],
    [ 'ㄉㄧㄢˋㄉㄧㄢˋ',
      [ [ 2764,2764 ] ] ],
    [ 'ㄉㄧㄢ',
      [ [2760],
        [2560, 200],
        [2688, 72],
        [2560, 128, 72] ] ],
    [ 'ㄓㄓㄓㄓㄓㄓㄓㄓㄓㄓ',
      [ [7680, 7680, 7680, 7680, 7680, 7680, 7680, 7680, 7680, 7680] ] ],
    [ 'ㄓㄓㄓㄓㄓㄓㄓㄨㄓㄓ',
      [ [7680, 7680, 7680, 7680, 7680, 7680, 7936, 7680, 7680],
        [7680, 7680, 7680, 7680, 7680, 7680, 7680, 256, 7680, 7680] ] ],
    [ 'ㄉㄧㄢˋㄓㄓㄓㄓㄓㄓ',
      [ [ 2764, 7680, 7680, 7680, 7680, 7680, 7680 ] ] ]
  ];

  tests.forEach(function(test) {
    var expendedEncodedSounds = BopomofoEncoder.encodeExpended(test[0]);
    deepEqual(BopomofoEncoder.getSymbolCombinations(expendedEncodedSounds),
      test[1], test[0]);

    deepEqual(BopomofoEncoder.getSymbolCombinations(test[0]),
      test[1], test[0]);
  });
});

test('isIncompletionOf() should compare ㄉ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄉ')[0],
    BopomofoEncoder.encode('ㄉㄧㄢˋ')[0]
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄉㄧ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄉㄧ')[0],
    BopomofoEncoder.encode('ㄉㄧㄢˋ')[0]
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄉㄧㄢ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄉㄧㄢ')[0],
    BopomofoEncoder.encode('ㄉㄧㄢˋ')[0]
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄓ with ㄓㄨˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄓ')[0],
    BopomofoEncoder.encode('ㄓㄨˋ')[0]
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄓㄨ with ㄓㄨˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄓㄨ')[0],
    BopomofoEncoder.encode('ㄓㄨˋ')[0]
  );

  equal(flag, true, 'Passed!');
});

test('isIncompletionOf() should compare ㄓㄨˋ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄓㄨˋ')[0],
    BopomofoEncoder.encode('ㄉㄧㄢˋ')[0]
  );

  equal(flag, false, 'Passed!');
});

test('isIncompletionOf() should compare ㄧㄢˋ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄧㄢˋ')[0],
    BopomofoEncoder.encode('ㄉㄧㄢˋ')[0]
  );

  equal(flag, false, 'Passed!');
});

test('isIncompletionOf() should compare ㄉㄢ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄉㄢ')[0],
    BopomofoEncoder.encode('ㄉㄧㄢˋ')[0]
  );

  equal(flag, false, 'Passed!');
});

test('isIncompletionOf() should compare ㄢˋ with ㄉㄧㄢˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄢˋ')[0],
    BopomofoEncoder.encode('ㄉㄧㄢˋ')[0]
  );

  equal(flag, false, 'Passed!');
});

test('isIncompletionOf() should compare ㄨ with ㄓㄨˋ.',
function() {
  var flag = BopomofoEncoder.isIncompletionOf(
    BopomofoEncoder.encode('ㄨ')[0],
    BopomofoEncoder.encode('ㄓㄨˋ')[0]
  );

  equal(flag, false, 'Passed!');
});

test('isCompleted(ㄓㄨˋ)', function() {
  var flag = BopomofoEncoder.isCompleted(
    BopomofoEncoder.encode('ㄓㄨˋ')[0]);

  equal(flag, true, 'Passed!');
});

test('isCompleted(ㄨ)', function() {
  var flag = BopomofoEncoder.isCompleted(
    BopomofoEncoder.encode('ㄨ')[0]);

  equal(flag, false, 'Passed!');
});

test('replace(ㄖㄤˊ,ㄤ,ㄢ)', function() {
  var code = BopomofoEncoder.replace(
      BopomofoEncoder.encode('ㄖㄤˊ')[0],
      BopomofoEncoder.encode('ㄤ')[0],
      BopomofoEncoder.encode('ㄢ')[0]
    );
  equal(code, BopomofoEncoder.encode('ㄖㄢˊ')[0], 'Passed!');
});

test('replace(ㄖㄣˊ,ㄤ,ㄢ)', function() {
  var code = BopomofoEncoder.replace(
      BopomofoEncoder.encode('ㄖㄣˊ')[0],
      BopomofoEncoder.encode('ㄤ')[0],
      BopomofoEncoder.encode('ㄢ')[0]
    );
  equal(code, BopomofoEncoder.encode('ㄖㄣˊ')[0], 'Passed!');
});

test('replace(ㄏㄡˇ,ㄡ,ㄨㄛ)', function() {
  var code = BopomofoEncoder.replace(
      BopomofoEncoder.encode('ㄏㄡˇ')[0],
      BopomofoEncoder.encode('ㄡ')[0],
      BopomofoEncoder.encode('ㄨㄛ')[0]
    );
  equal(code, BopomofoEncoder.encode('ㄏㄨㄛˇ')[0], 'Passed!');
});

test('replace(ㄏㄨㄛˇ,ㄨㄛ,ㄡ)', function() {
  var code = BopomofoEncoder.replace(
      BopomofoEncoder.encode('ㄏㄨㄛˇ')[0],
      BopomofoEncoder.encode('ㄨㄛ')[0],
      BopomofoEncoder.encode('ㄡ')[0]
    );
  equal(code, BopomofoEncoder.encode('ㄏㄡˇ')[0], 'Passed!');
});

test('replace(ㄏㄨˇ,ㄨㄛ,ㄡ)', function() {
  var code = BopomofoEncoder.replace(
      BopomofoEncoder.encode('ㄏㄨˇ')[0],
      BopomofoEncoder.encode('ㄨㄛ')[0],
      BopomofoEncoder.encode('ㄡ')[0]
    );
  equal(code, BopomofoEncoder.encode('ㄏㄨˇ')[0], 'Passed!');
});

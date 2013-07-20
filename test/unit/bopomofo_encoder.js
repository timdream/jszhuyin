'use strict';

module('BopomofoEncoder');

test('encodeSymbolsToCode() should follow the original spec.', function() {
  var code = BopomofoEncoder.encodeSymbolsToCode('ㄉㄧㄢˋ');

  equal(code, 2764, 'Passed!');
});

test('encodeSymbolsToCode() should encode various symbols.', function() {
  var code1 = BopomofoEncoder.encodeSymbolsToCode('ㄓㄨㄥ ');
  var code2 = BopomofoEncoder.encodeSymbolsToCode('ㄨㄣˊ');
  var code3 = BopomofoEncoder.encodeSymbolsToCode('ㄓ');
  var code4 = BopomofoEncoder.encodeSymbolsToCode('ㄨ');

  equal(code1, 0x1f61, 'Encodes example #1');
  equal(code2, 0x0152, 'Encodes example #2');
  equal(code3, 0x1e00, 'Encodes example #3');
  equal(code4, 0x0100, 'Encodes example #4');
});

test('encodeSymbols() should encode various symbols.', function() {
  var str1 = BopomofoEncoder.encodeSymbols('ㄓㄨㄥ ');
  var str2 = BopomofoEncoder.encodeSymbols('ㄨㄣˊ');
  var str3 = BopomofoEncoder.encodeSymbols('ㄓ');
  var str4 = BopomofoEncoder.encodeSymbols('ㄨ');

  equal(str1, String.fromCharCode(0x1f61), 'Encodes example #1');
  equal(str2, String.fromCharCode(0x0152), 'Encodes example #2');
  equal(str3, String.fromCharCode(0x1e00), 'Encodes example #3');
  equal(str4, String.fromCharCode(0x0100), 'Encodes example #4');
});

test('encodeSymbolsFromArray() should encode various symbols.', function() {
  var arr = ['ㄓㄨˋ', 'ㄧㄣ ', 'ㄕㄨ ', 'ㄖㄨˋ', 'ㄈㄚˇ'];
  var str = BopomofoEncoder.encodeSymbolsFromArray(arr);

  equal(str, 'ἄÑ⌁┄ࠋ', 'Passed!');
});

test('decodeSymbolsFromCode() should decode various code.', function() {
  var symbols1 = BopomofoEncoder.decodeSymbolsFromCode(0x1f61);
  var symbols2 = BopomofoEncoder.decodeSymbolsFromCode(0x0152);
  var symbols3 = BopomofoEncoder.decodeSymbolsFromCode(0x1e00);
  var symbols4 = BopomofoEncoder.decodeSymbolsFromCode(0x0100);

  equal(symbols1, 'ㄓㄨㄥ ', 'Decodes example #1');
  equal(symbols2, 'ㄨㄣˊ', 'Decodes example #2');
  equal(symbols3, 'ㄓ', 'Decodes example #3');
  equal(symbols4, 'ㄨ', 'Decodes example #4');
});

test('decodeSymbols() should decode various code.', function() {
  var symbols1 = BopomofoEncoder.decodeSymbols(String.fromCharCode(0x1f61));
  var symbols2 = BopomofoEncoder.decodeSymbols(String.fromCharCode(0x0152));
  var symbols3 = BopomofoEncoder.decodeSymbols(String.fromCharCode(0x1e00));
  var symbols4 = BopomofoEncoder.decodeSymbols(String.fromCharCode(0x0100));

  equal(symbols1, 'ㄓㄨㄥ ', 'Decodes example #1');
  equal(symbols2, 'ㄨㄣˊ', 'Decodes example #2');
  equal(symbols3, 'ㄓ', 'Decodes example #3');
  equal(symbols4, 'ㄨ', 'Decodes example #4');
});

test('decodeSymbolsToArray() should decode a encoded string.', function() {
  var arr = BopomofoEncoder.decodeSymbolsToArray('ἄÑ⌁┄ࠋ');

  deepEqual(arr, ['ㄓㄨˋ', 'ㄧㄣ ', 'ㄕㄨ ', 'ㄖㄨˋ', 'ㄈㄚˇ'], 'Passed!');
});

test('splitSymbolsArray() should split full syllables.', function() {
  var arr = BopomofoEncoder.splitSymbolsArray('ㄓㄨˋㄧㄣ ㄕㄨ ㄖㄨˋㄈㄚˇ');
  deepEqual(arr, ['ㄓㄨˋ', 'ㄧㄣ ', 'ㄕㄨ ', 'ㄖㄨˋ', 'ㄈㄚˇ'], 'Passed!');
});

test('splitSymbolsArray() should split partial syllables.', function() {
  var arr = BopomofoEncoder.splitSymbolsArray('ㄓㄨˋㄧㄕㄨㄨˋㄈ');
  deepEqual(arr, ['ㄓㄨˋ', 'ㄧ', 'ㄕㄨ', 'ㄨˋ', 'ㄈ'], 'Passed!');
});


'use strict';

module('Float32Encoder');

test('isSupported', function() {
  ok(Float32Encoder.isSupported, 'Passed!');
});

test('encodeString()', function() {
  equal(Float32Encoder.encodeString(3.1415927410125732), 'ÛI@', 'Passed!');
  equal(Float32Encoder.encodeString(-3.1415927410125732), 'ÛIÀ', 'Passed!');
});

test('decodeString()', function() {
  equal(Float32Encoder.decodeString('ÛI@'), 3.1415927410125732, 'Passed!');
  equal(Float32Encoder.decodeString('ÛIÀ'), -3.1415927410125732, 'Passed!');
});

module('JSZhuyinDataPack');

test('construct with packed string.', function() {
  var data = new JSZhuyinDataPack('ÛIÀB台北台#台灣');
  equal(data.packed, 'ÛIÀB台北台#台灣', 'Passed!');
});

test('construct with structured data.', function() {
  var data = new JSZhuyinDataPack([
    { str: '台北', score: 3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ]);

  deepEqual(data.unpacked, [
    { str: '台北', score: 3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ], 'Passed!');
});

test('unpack()', function() {
  var data = new JSZhuyinDataPack('ÛIÀB台北台#台灣');
  data.unpack();

  deepEqual(data.unpacked, [
    { str: '台北', score: -3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ], 'Passed!');
});

test('unpack() with symbols', function() {
  var data = new JSZhuyinDataPack('ÛIÀb台北పȳ台#ప~台灣పŉ');
  data.unpack();

  deepEqual(data.unpacked, [
    { str: '台北',
      symbols: 'పȳ',
      score: -3.1415927410125732 },
    { str: '台', symbols: 'ప' },
    { str: '台灣', symbols: 'పŉ' }
  ], 'Passed!');
});

test('pack()', function() {
  var data = new JSZhuyinDataPack([
    { str: '台北', score: -3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ]);
  data.pack();

  equal(data.packed, 'ÛIÀB台北台#台灣', 'Passed!');
});

test('pack() with symbols', function() {
  var data = new JSZhuyinDataPack([
    { str: '台北',
      symbols: 'పȳ',
      score: -3.1415927410125732 },
    { str: '台', symbols: 'ప' },
    { str: '台灣', symbols: 'పŉ' }
  ]);
  data.pack();

  equal(data.packed, 'ÛIÀb台北పȳ台#ప~台灣పŉ', 'Passed!');
});


test('getResults()', function() {
  var data = new JSZhuyinDataPack('ÛIÀB台北台#台灣');
  deepEqual(data.getResults(), [
    { str: '台北', score: -3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ], 'Passed!');
});

test('getPackedString()', function() {
  var data = new JSZhuyinDataPack([
    { str: '台北', score: -3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ]);
  equal(data.getPackedString(), 'ÛIÀB台北台#台灣', 'Passed!');
});

test('getFirstResult()', function() {
  var data = new JSZhuyinDataPack('ÛIÀB台北台#台灣');
  deepEqual(data.getFirstResult(),
    { str: '台北', score: -3.1415927410125732 },
    'Passed!');
});

test('getFirstResult() with symbols', function() {
  var data = new JSZhuyinDataPack('ÛIÀb台北పȳ台#ప~台灣పŉ');
  deepEqual(data.getFirstResult(),
    { str: '台北',
      symbols: 'పȳ',
      score: -3.1415927410125732 },
    'Passed!');
});

test('getFirstResultScore()', function() {
  var data = new JSZhuyinDataPack('ÛIÀB台北台#台灣');
  equal(data.getFirstResultScore(),
    -3.1415927410125732, 'Passed!');
});

'use strict';

/* global JSZhuyinDataPack, Float32Encoder,
          arrayBufferToString, arrayToUint16LEArrayBuffer */

module('Float32Encoder');

test('isSupported', function() {
  ok(Float32Encoder.isSupported, 'Passed!');
});

var posPIBuffer = new ArrayBuffer(4);
new DataView(posPIBuffer).setFloat32(0, 3.1415927410125732, true);
var negPIBuffer = new ArrayBuffer(4);
new DataView(negPIBuffer).setFloat32(0, -3.1415927410125732, true);

test('encodeArrayBuffer()', function() {
  deepEqual(
    arrayBufferToString(Float32Encoder.encodeArrayBuffer(3.1415927410125732)),
    arrayBufferToString(posPIBuffer));
  deepEqual(
    arrayBufferToString(Float32Encoder.encodeArrayBuffer(-3.1415927410125732)),
    arrayBufferToString(negPIBuffer));
});

test('decodeArrayBuffer()', function() {
  equal(Float32Encoder.decodeArrayBuffer(posPIBuffer), 3.1415927410125732);
  equal(Float32Encoder.decodeArrayBuffer(negPIBuffer), -3.1415927410125732);
});

module('JSZhuyinDataPack');

test('construct with packed array buffer.', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x42 /* B */,
       0x53f0, 0x5317, 0x53f0, 0x0, 0x53f0, 0x7063, /* 台北台NUL台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf);
  deepEqual(
    arrayBufferToString(data.packed), arrayBufferToString(buf), 'Passed!');
  equal(data.byteOffset, 0, 'Passed!');
  equal(data.length, 10, 'Passed!');
});

test('construct with packed array buffer (byteOffset !== 0).', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x9999, 0x9999, 0x9999, 0x9999,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x42 /* B */,
       0x53f0, 0x5317, 0x53f0, 0x0, 0x53f0, 0x7063, /* 台北台NUL台灣 */
       0x0,
       0x9999, 0x9999, 0x9999, 0x9999 /* pad */]);
  var data = new JSZhuyinDataPack(buf, 8, 10);
  deepEqual(
    arrayBufferToString(data.packed), arrayBufferToString(buf), 'Passed!');
  equal(data.byteOffset, 8, 'Passed!');
  equal(data.length, 10, 'Passed!');
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
  var buf = arrayToUint16LEArrayBuffer(
      [0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x42 /* B */,
       0x53f0, 0x5317, 0x53f0, 0x0, 0x53f0, 0x7063, /* 台北台NUL台灣 */
       0x0 /* pad */]);

  var data = new JSZhuyinDataPack(buf);
  data.unpack();

  deepEqual(data.unpacked, [
    { str: '台北', score: -3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ], 'Passed!');
});

test('unpack() (byteOffset !== 0)', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x9999, 0x9999, 0x9999, 0x9999,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x42 /* B */,
       0x53f0, 0x5317, 0x53f0, 0x0, 0x53f0, 0x7063, /* 台北台NUL台灣 */
       0x0,
       0x9999, 0x9999, 0x9999, 0x9999 /* pad */]);

  var data = new JSZhuyinDataPack(buf, 8, 10);
  data.unpack();

  deepEqual(data.unpacked, [
    { str: '台北', score: -3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ], 'Passed!');
});

test('unpack() with symbols', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x62 /* b */,
       0x53f0, 0x5317, 0xc2a, 0x233, 0x53f0, 0x0, 0xc2a, 0x0,
       0x53f0, 0x7063, 0xc2a, 0x149,  /* 台北పȳ台NULపNUL台灣పŉ */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf);
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
  var buf = arrayToUint16LEArrayBuffer(
      [0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x42 /* B */,
       0x53f0, 0x5317, 0x53f0, 0x0, 0x53f0, 0x7063, /* 台北台NUL台灣 */
       0x0 /* pad */]);

  var data = new JSZhuyinDataPack([
    { str: '台北', score: -3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ]);
  data.pack();

  deepEqual(
    arrayBufferToString(data.packed), arrayBufferToString(buf), 'Passed!');
  equal(data.byteOffset, 0, 'Passed!');
  equal(data.length, 10, 'Passed!');
});

test('pack() with symbols', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x62 /* b */,
       0x53f0, 0x5317, 0xc2a, 0x233, 0x53f0, 0x0, 0xc2a, 0x0,
       0x53f0, 0x7063, 0xc2a, 0x149,  /* 台北పȳ台NULపNUL台灣పŉ */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack([
    { str: '台北',
      symbols: 'పȳ',
      score: -3.1415927410125732 },
    { str: '台', symbols: 'ప' },
    { str: '台灣', symbols: 'పŉ' }
  ]);
  data.pack();

  deepEqual(
    arrayBufferToString(data.packed), arrayBufferToString(buf), 'Passed!');
});


test('getResults()', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x42 /* B */,
       0x53f0, 0x5317, 0x53f0, 0x0, 0x53f0, 0x7063, /* 台北台NUL台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf);
  deepEqual(data.getResults(), [
    { str: '台北', score: -3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ], 'Passed!');
});

test('getPacked()', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x42 /* B */,
       0x53f0, 0x5317, 0x53f0, 0x0, 0x53f0, 0x7063, /* 台北台NUL台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack([
    { str: '台北', score: -3.1415927410125732 },
    { str: '台' },
    { str: '台灣' }
  ]);
  deepEqual(data.getPacked(), buf, 'Passed!');
});

test('getFirstResult()', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x42 /* B */,
       0x53f0, 0x5317, 0x53f0, 0x0, 0x53f0, 0x7063, /* 台北台NUL台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf);
  deepEqual(data.getFirstResult(),
    { str: '台北', score: -3.1415927410125732 },
    'Passed!');
});

test('getFirstResult() with symbols', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x62 /* b */,
       0x53f0, 0x5317, 0xc2a, 0x233, 0x53f0, 0x0, 0xc2a, 0x0,
       0x53f0, 0x7063, 0xc2a, 0x149,  /* 台北పȳ台NULపNUL台灣పŉ */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf);
  deepEqual(data.getFirstResult(),
    { str: '台北',
      symbols: 'పȳ',
      score: -3.1415927410125732 },
    'Passed!');
});

test('getFirstResultScore()', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x42 /* B */,
       0x53f0, 0x5317, 0x53f0, 0x0, 0x53f0, 0x7063, /* 台北台NUL台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf);
  equal(data.getFirstResultScore(),
    -3.1415927410125732, 'Passed!');
});

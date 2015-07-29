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
      [0x42 /* B */,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x5317, /* 台北 */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x0000, /* 台NUL */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x7063, /* 台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf, undefined, undefined, 'పȳ');
  deepEqual(
    arrayBufferToString(data.packed), arrayBufferToString(buf), 'Passed!');
  equal(data.byteOffset, 0, 'Passed!');
  equal(data.length, 14, 'Passed!');
  equal(data.symbols, 'పȳ', 'Passed!');
});

test('construct with packed array buffer (byteOffset !== 0).', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x9999, 0x9999, 0x9999, 0x9999,
       0x42 /* B */,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x5317, /* 台北 */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x0000, /* 台NUL */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x7063, /* 台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf, 8, 14, 'పȳ');
  deepEqual(
    arrayBufferToString(data.packed), arrayBufferToString(buf), 'Passed!');
  equal(data.byteOffset, 8, 'Passed!');
  equal(data.length, 14, 'Passed!');
  equal(data.symbols, 'పȳ', 'Passed!');
});

test('construct with structured data.', function() {
  var data = new JSZhuyinDataPack([
    { str: '台北', score: 3.1415927410125732 },
    { str: '台', score: 3.1415927410125732 },
    { str: '台灣', score: 3.1415927410125732 }
  ]);

  deepEqual(data.unpacked, [
    { str: '台北', score: 3.1415927410125732 },
    { str: '台', score: 3.1415927410125732 },
    { str: '台灣', score: 3.1415927410125732 }
  ], 'Passed!');
});

test('unpack()', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x42 /* B */,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x5317, /* 台北 */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x0000, /* 台NUL */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x7063, /* 台灣 */
       0x0 /* pad */]);

  var data = new JSZhuyinDataPack(buf);
  data.unpack();

  deepEqual(data.unpacked, [
    { str: '台北', score: -3.1415927410125732 },
    { str: '台', score: -3.1415927410125732 },
    { str: '台灣', score: -3.1415927410125732 }
  ], 'Passed!');
});

test('unpack() (byteOffset !== 0)', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x9999, 0x9999, 0x9999, 0x9999,
       0x42 /* B */,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x5317, /* 台北 */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x0000, /* 台NUL */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x7063, /* 台灣 */
       0x0 /* pad */]);

  var data = new JSZhuyinDataPack(buf, 8, 14);
  data.unpack();

  deepEqual(data.unpacked, [
    { str: '台北', score: -3.1415927410125732 },
    { str: '台', score: -3.1415927410125732 },
    { str: '台灣', score: -3.1415927410125732 }
  ], 'Passed!');
});

test('pack()', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x42 /* B */,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x5317, /* 台北 */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x0000, /* 台NUL */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x7063, /* 台灣 */
       0x0 /* pad */]);

  var data = new JSZhuyinDataPack([
    { str: '台北', score: -3.1415927410125732 },
    { str: '台', score: -3.1415927410125732 },
    { str: '台灣', score: -3.1415927410125732 }
  ]);
  data.pack();

  deepEqual(
    arrayBufferToString(data.packed), arrayBufferToString(buf), 'Passed!');
  equal(data.byteOffset, 0, 'Passed!');
  equal(data.length, 14, 'Passed!');
});

test('getResults()', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x42 /* B */,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x5317, /* 台北 */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x0000, /* 台NUL */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x7063, /* 台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf);
  deepEqual(data.getResults(), [
    { str: '台北', score: -3.1415927410125732 },
    { str: '台', score: -3.1415927410125732 },
    { str: '台灣', score: -3.1415927410125732 }
  ], 'Passed!');
});

test('getPacked()', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x42 /* B */,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x5317, /* 台北 */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x0000, /* 台NUL */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x7063, /* 台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack([
    { str: '台北', score: -3.1415927410125732 },
    { str: '台', score: -3.1415927410125732 },
    { str: '台灣', score: -3.1415927410125732 }
  ]);
  deepEqual(data.getPacked(), buf, 'Passed!');
});

test('getFirstResult()', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x42 /* B */,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x5317, /* 台北 */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x0000, /* 台NUL */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x7063, /* 台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf);
  deepEqual(data.getFirstResult(),
    { str: '台北', score: -3.1415927410125732 },
    'Passed!');
});

test('getFirstResultScore()', function() {
  var buf = arrayToUint16LEArrayBuffer(
      [0x42 /* B */,
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x5317, /* 台北 */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x0000, /* 台NUL */
       0x0fdb, 0xc049 /* (new Float32Array([-3.1415927410125732])) */,
       0x53f0, 0x7063, /* 台灣 */
       0x0 /* pad */]);
  var data = new JSZhuyinDataPack(buf);
  equal(data.getFirstResultScore(),
    -3.1415927410125732, 'Passed!');
});

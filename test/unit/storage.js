'use strict';

/* global BinStorage, CacheStore, JSZhuyinDataPackStorage,
          arrayBufferToStringArray, numberArrayToStringArray,
          arrayToUint16LEArrayBuffer, BopomofoEncoder, testdataResArray */

var binStorageResArray = [
  0x0001, 0x0000, // Table0 header
  0x0041,         // Table0 key table
  0x000a, 0x0000, // Table0 ptr table, ptr to table1 (32bit LE)

  0x0001, 0x0000, // Table1 header
  0x0042,         // Table1 key table
  0x0014, 0x0000, // Table1 ptr table, ptr to table2 (32bit LE)

  0x0001, 0x0005, // Table2 header
  0x1111, 0x2222, 0x3333, 0x4444, 0x5555, // Table2 content
  0x0043,         // Table2 key table
  0x0028, 0x0000, // Table2 ptr table, ptr to table3 (32bit LE)

  0x0000, 0x0004, // Table3 header
  0x6666, 0x7777, 0x8888, 0x9999 // Table3 content
];

var binStorageData = arrayToUint16LEArrayBuffer(binStorageResArray);

module('BinStorage');

test('create instance', function() {
  var storage = new BinStorage();
  ok(!storage.loaded, 'Passed!');
});

var binStorageResStringArray = numberArrayToStringArray(binStorageResArray);

test('create instance', function() {
  var storage = new BinStorage();
  ok(!storage.loaded, 'Passed!');
});

test('unload()', function() {
  var storage = new BinStorage();

  storage.load(binStorageData);
  storage.unload();
  ok(!storage.loaded, 'Passed!');
  equal(storage._bin, undefined, 'Data purged');
});

test('get()', function() {
  var storage = new BinStorage();
  storage.load(binStorageData);

  var value = storage.get([0x41, 0x42, 0x43]);
  deepEqual(arrayBufferToStringArray(value[0]), binStorageResStringArray);
  equal(value[1], 0x28 + 4 /* start address of Table3 content */);
  equal(value[2], 4 /* length of Table3 content */, 'Passed!');
});

test('get() (not found)', function() {
  var storage = new BinStorage();
  storage.load(binStorageData);

  var value = storage.get([0x41, 0x42, 0x45]);
  equal(value, undefined, 'Passed!');
});

test('getRange()', function() {
  var storage = new BinStorage();
  storage.load(binStorageData);

  var value = storage.getRange([0x41, 0x42]);
  equal(value.length, 1, 'Passed!');
  deepEqual(arrayBufferToStringArray(value[0][0]), binStorageResStringArray);
  equal(value[0][1], 0x28 + 4 /* start address of Table3 content */);
  equal(value[0][2], 4 /* length of Table3 content */, 'Passed!');
});

test('getRange() (not found)', function() {
  var storage = new BinStorage();
  storage.load(binStorageData);

  var value = storage.getRange([0x41, 0x42, 0x45]);
  deepEqual(value, [], 'Passed!');
});

module('CacheStore');

test('add() and get()', function() {
  var store = new CacheStore();
  var val = {};
  store.add([0x41, 0x42], val);
  equal(store.dataMap.get('\u0041\u0042'), val, 'Passed!');
});

test('get()', function() {
  var store = new CacheStore();
  var val = {};
  store.add([0x41, 0x42], val);
  deepEqual(store.get([0x41, 0x42]), val, 'Passed!');
});

test('cleanup() w/ supersetCodes', function() {
  var store = new CacheStore();
  var val = {};
  var val2 = {};
  var val3 = {};
  store.add([0x41, 0x42], val);
  store.add([0x41, 0x43], val2);
  store.add([0x41, 0x44], val3);

  store.cleanup([0x41, 0x44, 0x41, 0x42]);

  equal(store.get([0x41, 0x42]), val, 'Passed!');
  equal(store.get([0x41, 0x43]), undefined, 'Passed!');
  equal(store.get([0x41, 0x44]), val3, 'Passed!');
});

test('cleanup()', function() {
  var store = new CacheStore();
  var val = {};
  var val2 = {};
  var val3 = {};
  store.add([0x41, 0x42], val);
  store.add([0x41, 0x43], val2);
  store.add([0x41, 0x44], val3);

  store.cleanup();

  equal(store.get([0x41, 0x42]), undefined, 'Passed!');
  equal(store.get([0x41, 0x43]), undefined, 'Passed!');
  equal(store.get([0x41, 0x44]), undefined, 'Passed!');
});

var testdataData = arrayToUint16LEArrayBuffer(testdataResArray);

module('JSZhuyinDataPackStorage');

test('create instance', function() {
  var storage = new JSZhuyinDataPackStorage();
  ok(!storage.loaded, 'Passed!');
});

test('create instance', function() {
  var storage = new JSZhuyinDataPackStorage();
  ok(!storage.loaded, 'Passed!');
});

test('unload()', function() {
  var storage = new JSZhuyinDataPackStorage();

  storage.load(testdataData);
  storage.unload();
  ok(!storage.loaded, 'Passed!');
  equal(storage._bin, undefined, 'Data purged');
});

test('get()', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.get(BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇ'));
  deepEqual(value.getResults(), [ {
    score: -3.2719614505767822,
    str: '台北',
    index: 174 } ]);
});

test('get() should utilize cache', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var codes = BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇ');

  var value = storage.get(codes);
  deepEqual(value.getResults(), [ {
    score: -3.2719614505767822,
    str: '台北',
    index: 174 } ]);

  var value2 = storage.get(codes);

  ok(value === value2, 'Same JSZhuyinDataPack');
});

test('get() (not found)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.get(BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇㄅㄟˇ'));
  equal(value, undefined, 'Passed!');
});

test('getRange()', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.getRange(BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇ'));
  equal(value.length, 1, 'Passed!');
  deepEqual(value[0].getResults(), [
    { score: -3.330096483230591, str: '台北市', index: 194 },
    { score: -3.6398773193359375, str: '臺北市', index: 194 } ]);
});

test('getRange() (not found)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.getRange(BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇㄅㄟˇ'));
  deepEqual(value, [], 'Passed!');
});

test('getIncompleteMatched(ㄊㄞˊㄅ)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.getIncompleteMatched(BopomofoEncoder.encode('ㄊㄞˊㄅ'));
  deepEqual(value.getResults(), [
    { score: -3.2719614505767822, str: '台北', index: 174 } ]);
});

test('getIncompleteMatched(ㄊㄞˊㄅ) should utilize cache', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var codes = BopomofoEncoder.encode('ㄊㄞˊㄅ');

  var value = storage.getIncompleteMatched(codes);
  deepEqual(value.getResults(), [
    { score: -3.2719614505767822, str: '台北', index: 174 } ]);

  // Recreate the codes array.
  codes = [].concat(codes);
  var value2 = storage.getIncompleteMatched(codes);

  ok(value === value2, 'Same JSZhuyinDataPackCollection');
});

test('getIncompleteMatched(ㄊㄅㄕ)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.getIncompleteMatched(BopomofoEncoder.encode('ㄊㄅㄕ'));
  deepEqual(value.getResults(), [
    { score: -3.330096483230591, str: '台北市', index: 194 },
    { score: -3.6398773193359375, str: '臺北市', index: 194 } ]);
});

test('getIncompleteMatched(ㄌ) (not found)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.getIncompleteMatched(BopomofoEncoder.encode('ㄌ'));
  equal(value, undefined, 'Passed!');
});

test('getIncompleteMatched(ㄊㄞˊㄌ) (not found)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.getIncompleteMatched(BopomofoEncoder.encode('ㄊㄞˊㄌ'));
  equal(value, undefined, 'Passed!');
});

test('getIncompleteMatched(ㄌㄟˇㄌㄟˇ) (not found)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value =
    storage.getIncompleteMatched(BopomofoEncoder.encode('ㄌㄟˇㄌㄟˇ'));
  equal(value, undefined, 'Passed!');
});

test('getIncompleteMatched(ㄊㄞ)',
function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.getIncompleteMatched(BopomofoEncoder.encode('ㄊㄞ'));
  deepEqual(value.getResults(), [
    { index: 40, score: -2.946078062057495, str: '台' },
    { index: 40, score: -3.5012617111206055, str: '臺' },
    { index: 40, score: -4.771779537200928, str: '抬' },
    { index: 40, score: -4.80982780456543, str: '颱' },
    { index: 40, score: -5.267881393432617, str: '檯' },
    { index: 40, score: -5.749503135681152, str: '苔' },
    { index: 40, score: -6.093285083770752, str: '跆' },
    { index: 40, score: -6.300410747528076, str: '邰' },
    { index: 40, score: -7.555683135986328, str: '鮐' },
    { index: 40, score: -7.85671329498291, str: '旲' },
    { index: 40, score: -7.85671329498291, str: '炱' },
    { index: 40, score: -7.85671329498291, str: '嬯' },
    { index: 40, score: -7.85671329498291, str: '儓' },
    { index: 40, score: -7.85671329498291, str: '薹' },
    { index: 40, score: -7.85671329498291, str: '駘' },
    { index: 40, score: -7.85671329498291, str: '籉' },
    { index: 40, score: -7.85671329498291, str: '秮' } ]);
});

test('getIncompleteMatched(ㄊ,ㄞ)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.getIncompleteMatched(
    BopomofoEncoder.encodeExpended('ㄊㄞ'));
  deepEqual(value.getResults(), [
    { index: 230, score: -5.541846752166748, str: '疼愛' },
    { index: 160, score: -6.655789852142334, str: '抬愛' } ]);
});

test('reverseGet(台北)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.reverseGet('台北');
  deepEqual(value, BopomofoEncoder.encode('ㄊㄞˊㄅㄟˇ'), 'Passed!');
});

test('reverseGet(高雄)', function() {
  var storage = new JSZhuyinDataPackStorage();
  storage.load(testdataData);

  var value = storage.reverseGet('高雄');
  deepEqual(value, [], 'Passed!');
});

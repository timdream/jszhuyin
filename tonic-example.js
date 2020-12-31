const { JSZhuyin } = require('jszhuyin');
var jszhuyin = new JSZhuyin();
jszhuyin.load();

var candidates = [];
jszhuyin.oncandidateschange = function(c) {
  candidates = c;
};
jszhuyin.handleKey('ㄐㄊㄌㄞˊㄒㄧㄝˇㄓㄨˋㄧㄣㄕㄖㄈ');

console.log(candidates[0][0]);

const Encoding = require("encoding-japanese");

const unicodeArray = Encoding.urlEncode("レゴ"); // Convert string to code array
const sjisArray = Encoding.convert(unicodeArray, {
  to: "SJIS",
  from: "UTF8",
});
console.log(unicodeArray);

//https://buyee.jp/mercari/search?keyword=%E3%83%AC%E3%82%B4&translationType=1

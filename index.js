// https://buyee.jp/mercari/search?keyword=shrimps&page=11
const https = require("https");
const headers = require("./headers");
var HTMLParser = require("node-html-parser");
const translate = require("translate-google");
// const { st } = require("translate-google/languages");

const queries = [
  //   "lego 4411",
  //   "lego X-Tracker",
  "lego watch",
  //   "lego little robots",
  //   "レゴ ウォッチ",
  //   "レゴリトルロボット",
];

function toEnglish(str, price) {
  translate(str, { to: "en", except: ["a"] })
    .then((res) => {
      console.log(res + " " + price);
    })
    .catch((err) => {
      console.error(err);
    });
}
function format(str) {
  return str.replaceAll(" ", "%20");
}

async function doSearch(keyword, page) {
  return new Promise((resolve, reject) => {
    // let debug =
    try {
      const options = {
        host: `buyee.jp`,
        path: `/mercari/search?keyword=${format(keyword)}&page=${page}`,
        headers: {
          "User-Agent": generateHeader(),
        },
      };

      https
        .get(
          options,

          (resp) => {
            console.log(resp.statusCode);
            if (resp.statusCode == 200) {
              let data = "";
              resp.on("data", (chunk) => {
                data += chunk;
              });
              resp.on("end", () => {
                if (data === "") {
                  throw "empty string";
                }

                var root = HTMLParser.parse(data);
                let arrOfNodes = root.querySelectorAll(".name");
                let arrOfPrices = root.querySelectorAll(".price-fx");
                let arrOfImgs = root.querySelectorAll(".thumbnail");
                // console.log(data);
                let i = 0;
                for (let item of arrOfNodes) {
                  // toEnglish(item.textContent, arrOfPrices[i].textContent);
                  console.log(arrOfImgs[i].getAttribute("data-bind"));

                  i++;
                }
                resolve();
              });
            }
          }
        )
        // <div class="thumbnail-area  ">
        // <img class="thumbnail"
        // alt="LEGO レゴ 7446 littlerobots レア"
        // src="https://cdn.buyee.jp/mercari/images/common/loading-spinner.gif"
        // data-bind="lazyload: {
        //   imagePath: '//static.mercdn.net/c!/w=240/thumb/photos/m75045434016_1.jpg?1658688723',
        //   onError: 'https://cdn.buyee.jp/mercari/images/common/noimage.jpg'
        // }">
        //          </div>
        .on("error", (err) => {
          console.log(err);
          reject("Error: " + err.message);
        });
    } catch (err) {
      console.log("oops", err);
      console.log(keyword);
      reject("Somethings Wrong...");
    }
  });
}
function generateHeader() {
  return headers.heads[Math.round(Math.random() * (headers.heads.length - 1))];
}
async function start() {
  for (let q of queries) {
    await doSearch(q, 1);
  }
}
start();
// doSearch("lego 4411", 1);

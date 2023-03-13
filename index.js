// https://buyee.jp/mercari/search?keyword=shrimps&page=11
const https = require("https");
const headers = require("./headers");
var HTMLParser = require("node-html-parser");
const translate = require("translate-google");
const fs = require("fs");
// const { st } = require("translate-google/languages");

let cachedInventory = {};
const queries = [
  //   "lego 4411",
  // "lego X-Tracker",
  "lego watch",
  //   "lego little robots",
  //   "レゴ ウォッチ",
  //   "レゴリトルロボット",
];

function toEnglish(str, price) {
  translate(str, { to: "en", except: ["a"] })
    .then((res) => {
      return res + " " + price;
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
            let id = "";
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
                  let imageURL = "https:";
                  // console.log(item)
                  // toEnglish(item.textContent, arrOfPrices[i].textContent);

                  imageURL += arrOfImgs[i]
                    .getAttribute("data-bind")
                    .substring(
                      arrOfImgs[i].getAttribute("data-bind").indexOf("//s"),
                      arrOfImgs[i].getAttribute("data-bind").indexOf("',")
                    );

                  let id = imageURL.substring(48, 60);
                  toEnglish(item.textContent, arrOfPrices[i].textContent).then(
                    (name) => {
                      checkId(id, {
                        id,
                        name,
                        imageURL,
                      });
                    }
                  );
                  // console.log(id);
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

function checkForSave() {
  try {
    return fs.existsSync("save.json");
  } catch (e) {
    console.log(e);
  }
}
function load() {
  if (checkForSave()) {
    try {
      let rawdata = fs.readFileSync("save.json");
      let localInfo = JSON.parse(rawdata);
      cachedInventory = localInfo;
    } catch (e) {
      console.log(e);
    } finally {
      start();
    }
  } else {
    save().then(() => start());
  }
}
async function save() {
  let data = JSON.stringify(cachedInventory);
  try {
    await fs.writeFileSync("save.json", data);
  } catch (e) {
    console.log(e);
  }
}

load();

function checkId(partInfo) {
  // console.log(`checkid ${partNo} ${partCol}`)
  console.log(partInfo.id, partInfo.name, partInfo.imageURL);
  let thisRef = null;
  let message = ``;
  let output = [];
  if (cachedInventory[mercariId] == undefined) {
    cachedInventory[mercariId] = [];
  }
  for (let cached of cachedInventory[mercariId]) {
    if (cached == partInfo.id) {
      thisRef = cached;
    }
  }
  if (thisRef == null) {
    cachedInventory[mercariId].push(partInfo.id);
    thisRef = cachedInventory[mercariId][cachedInventory[mercariId].length - 1];
    output.push(partInfo.id);
  }
  // console.log(arr)
  // for (let listing of arr) {
  //   if (!thisRef.cachedIds.includes()) {
  //     console.log(
  //       `New ${partCol} ${partName} listed! Seller's note: ${
  //         listing.strDesc && "None"
  //       } `
  //     );
  //     message += `New ${partCol} ${partName} listed!\n'${
  //       listing.strStorename
  //     }' note: ${listing.strDesc && "None"} \n${listing.n4Qty} for ${
  //       listing.mDisplaySalePrice
  //     }\n`;
  //     output.push(listing);
  //     thisRef.cachedIds.push(listing.idInv);
  //   }
  // }
  // if (output.length >= 1) {
  //   // if (canEmail) {
  //   //   sendEmail(message, partInfo[mercariId].num, partCol);
  //   // }
  // }
  save();
}

// doSearch("lego 4411", 1);

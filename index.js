// https://buyee.jp/mercari/search?keyword=shrimps&page=11
const https = require("https");
const headers = require("./headers");
var HTMLParser = require("node-html-parser");
const translate = require("translate-google");
const fs = require("fs");
const Encoding = require("encoding-japanese");

let cachedInventory = {};
const queries = [
  { str: "olo bricks", lang: "en" },
  { str: "lego 4679", lang: "en" },
  { str: "lego 4411", lang: "en" },
  { str: "lego X-Tracker", lang: "en" },
  { str: "lego watch", lang: "en" },
  { str: "lego little robots", lang: "en" },
  { str: "レゴ ウォッチ", lang: "jp" },
  { str: "レゴリトルロボット", lang: "jp" },
  { str: "オロブロック", lang: "jp" },
];
const contraband = ["overwatch"];
//https://buyee.jp/mercari/search?keyword=%E3%83%AC%E3%82%B4&translationType=1
async function toEnglish(str, price) {
  return new Promise((resolve, reject) => {
    translate(str, { to: "en", except: ["a"] })
      .then((res) => {
        resolve(res + " " + price);
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}
function format(obj) {
  if (obj.lang == "jp") {
    const utf8 = Encoding.urlEncode(obj.str);

    return utf8;
  }
  return obj.str.replaceAll(" ", "%20");
}
let out = [];
async function doSearch(keyword, page) {
  return new Promise((resolve, reject) => {
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

                Promise.all(
                  arrOfNodes.map((item) => {
                    return new Promise((itemResovle, _itemReject) => {
                      var itemOut = [];
                      let imageURL = "https:";
                      //migght need try{}
                      imageURL += arrOfImgs[i]
                        .getAttribute("data-bind")
                        .substring(
                          arrOfImgs[i].getAttribute("data-bind").indexOf("//s"),
                          arrOfImgs[i].getAttribute("data-bind").indexOf("',")
                        );

                      let id = imageURL.substring(48, 60);
                      toEnglish(
                        item.textContent,
                        arrOfPrices[i].textContent
                      ).then((name) => {
                        checkId({
                          id,
                          name,
                          imageURL,
                        }).then((available) => {
                          if (available.length > 0) {
                            for (let a of available) {
                              console.log(a);
                              itemOut.push(a);
                            }
                            itemResovle(itemOut);
                          }
                        });
                      });
                      i++;
                    });
                  })
                ).then((res) => {
                  let temp = [];

                  res.forEach((itemRes) => {
                    temp = [...temp, ...itemRes];
                  });

                  resolve(temp);
                });
              });
            } else {
              resolve([]);
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
        // </div>
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

function handleFoundListings(listings) {
  console.log("done");
  console.log(listings);
  for (let listing of listings) {
    console.log(listing.name);
  }
}
function generateHeader() {
  return headers.heads[Math.round(Math.random() * (headers.heads.length - 1))];
}
function start() {
  Promise.all(queries.map((query) => doSearch(query, 1))).then((res) => {
    console.log(res);
  });
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
  return new Promise((resolve, reject) => {
    let thisRef = null;
    let message = ``;
    let output = [];
    if (cachedInventory.mercariId == undefined) {
      cachedInventory.mercariId = [];
    }

    for (let cached of cachedInventory.mercariId) {
      if (cached == partInfo.id) {
        thisRef = cached;
      }
    }
    if (thisRef == null) {
      cachedInventory.mercariId.push(partInfo.id);
      thisRef = cachedInventory.mercariId[cachedInventory.mercariId.length - 1];
      let shouldadd = true;
      for (let badword of contraband) {
        if (partInfo.name.toLowerCase().includes(badword.toLowerCase())) {
          // resolve(output);
          shouldadd = false;
        }
      }
      if (shouldadd) {
        output.push(partInfo);
      }
    }
    // if (output.length > 0) {
    //   console.log("new listings found.");
    //   for (let listing of output) {
    //     console.log(listing.name);
    //   }
    // }

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
    resolve(output);
  });
}

// doSearch("lego 4411", 1);

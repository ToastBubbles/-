// https://buyee.jp/mercari/search?keyword=shrimps&page=11
const https = require("https");
const headers = require("./headers");
var HTMLParser = require("node-html-parser");

async function doSearch(keyword, page) {
  return new Promise((resolve, reject) => {
    try {
      const options = {
        host: `buyee.jp`,
        path: `/mercari/search?keyword=${keyword}&page=${page}`,
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
                // console.log(JSON.parse(data));
                // filterComments(JSON.parse(data), partId);
                // resolve(JSON.parse(data));

                var root = HTMLParser.parse(data);
                let thisss = root.querySelectorAll(".name");
                for (let item of thisss) {
                  console.log(item.textContent);
                }
                // console.log(root.querySelectorAll(".name"));
                // console.log(data);
              });
              // }
            }
          }
        )
        .on("error", (err) => {
          console.log(err);
          reject("Error: " + err.message);
        });
    } catch (err) {
      console.log("oops", err);
      reject("Somethings Wrong...");
    }
  });
}
function generateHeader() {
  return headers.heads[Math.round(Math.random() * (headers.heads.length - 1))];
}

doSearch("lego", 1);

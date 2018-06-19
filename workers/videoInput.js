var child_process = require("child_process");
var fs = require("fs");
var jpeg = require("jpeg-js");
var path = require("path");

var t = require("tesseract.js");
var Tesseract = t.create({
  //workerPath: path.join(__dirname, '../tesseract/src/node/worker.js'),
  langPath: path.join(__dirname, "./")
  //corePath: path.join(__dirname, '../tesseract/src/index.js')
});

let channels = 3;
let width = 1280;
let height = 720;
var max = width * height * channels;
var ffmpeg = child_process.spawn("ffmpeg", [
  "-i",
  "rtsp://user:user2121@10.157.182.27:554/Streaming/channels/1/rtpvideo1.sdp",
  "-c:v",
  "rawvideo",
  "-video_size",
  "" + width + "x" + height,
  "-pix_fmt",
  "rgb24",
  "-framerate",
  "1",
  "-blocksize",
  "" + max,
  "-f",
  "rawvideo",
  "-"
]);

var events = [];

var out = "";
var buffer = new Buffer(0);
var debug = true;
var iter = 0;

ffmpeg.stdout.on("data", data => {
  out = [];

  if (buffer.length < max) {
    buffer = Buffer.concat([buffer, data]);
  }

  if (buffer.length >= max) {
    var img;
    iter++;
    if (debug) {
      if (iter % 30 === 0 || iter === 1) {
        for (let y = 0; y !== height; y++) {
          for (let x = 0; x !== width; x++) {
            out.push(buffer[y * width * channels + x * channels]);
            out.push(buffer[y * width * channels + x * channels + 1]);
            out.push(buffer[y * width * channels + x * channels + 2]);
            out.push(255);
          }
        }
        img = jpeg.encode(
          {
            data: out,
            width: width,
            height: height
          },
          50
        ).data;

        fs.writeFileSync("./out/output" + iter + ".jpg", img);
      }
    }

    if (iter % 300 === 0 || iter === 1) {
      Tesseract.recognize(
        { data: out, width, height },
        {
          lang: "eng"
        }
      )
        .progress(function(p) {
          console.log("progress", p);
        })
        .then(function(result) {
          console.log("", result.text, result.lines, result.words);
          fs.writeFileSync("./index.html", result.html);
          //console.log("result", Object.keys(result));
        });
    }
    events.forEach(func => {
      func(buffer);
    });
    if (buffer.length > max) {
      buffer = buffer.slice(max);
    } else {
      buffer = new Buffer(0);
    }
  }
});

module.exports.on = (event, func) => {
  events.push(func);
};
module.exports.on("update", () => {
  //console.log("update", iter);
});

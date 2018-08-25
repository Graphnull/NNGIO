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
let width = 64;
let height = 36;
var max = width * height * channels;
var ffmpeg = child_process.spawn("ffmpeg", [
  "-i",
  "",
  "-c:v",
  "rawvideo",
  "-vf",
  "scale=" + width + "x" + height + ":flags=lanczos",
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
var buffer = new Buffer(max);
var buffetlength = 0;
var debug = true;
var iter = 0;

function onData(data) {
  out = [];

  if (buffetlength < max) {
    data.copy(buffer, buffetlength, 0, data.length);
    //buffer = Buffer.concat([buffer, data]);
    buffetlength = buffetlength + data.length;
  }

  if (buffetlength >= max) {
    var img;
    iter++;
    //if (debug) {
    /*
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
*/
    //}

    /*if (iter % 300 === 0 || iter === 1) {
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
    }*/

    events.forEach(func => {
      func(buffer);
    });
    if (buffetlength > max) {
      if (data.length - buffetlength - max < 0) {
        buffetlength = 0;
        onData(data.slice(max));
      } else {
        data.copy(buffer, 0, data.length - buffetlength - max, data.length > max ? max : data.length);
        buffetlength = max - buffetlength;
      }
      //buffer = buffer.slice(max);
    } else {
      buffetlength = 0;
      //buffer = new Buffer(0);
    }
  }
}
ffmpeg.stdout.on("data", onData);

module.exports.on = (event, func) => {
  events.push(func);
};
module.exports.on("update", () => {
  //console.log("update", iter);
});

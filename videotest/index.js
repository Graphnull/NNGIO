const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
var ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
var child_process = require("child_process");

var ffmpeg = child_process
  .spawn("ffmpeg", [
    "-i",
    "rtsp://user:user2121@10.157.182.27:554/Streaming/channels/1/rtpvideo1.sdp",
    "-c:v",
    "rawvideo",
    "-pix_fmt",
    "monow",
    "-blocksize",
    "115200",
    "-f",
    "rawvideo",
    "-"
  ])
  .stdout.on("data", data => {
    console.log(data.length);
  });

var fs = require("fs");
var io = require("socket.io-client");
var socket = io("http://localhost:3080/");

fs.readdirSync("./../../training").forEach(dir => {
  socket.emit(
    "dataset/add",
    "mnist",
    fs.readdirSync("./../../training/" + dir).map(imagePath => {
      return {
        type: "image/png",
        datasetName: "mnist",
        data: {
          width: 28,
          height: 28,
          depth: 1,
          bit: 8,
          image: fs.readFileSync("./../../training/" + dir + "/" + imagePath)
        }
      };
    }),
    err => {
      if (err) {
        console.log(err);
      }
    }
  );
});

//image/png

const nodencl = require("nodencl");

var { Memory } = require("./layers/memory");
var { Input } = require("./layers/input");
var { FCLayer } = require("./layers/fclayer");
var { Cluster } = require("./layers/cluster");

//var { DataSet } = require("./../db");
var sharp = require("sharp");
var { io } = require("./../socket");
var fs = require("fs");
let socket;

io.on("connection", function(s) {
  socket = s;
  global.socket = s;
});
io.on("disconnect", function(s) {
  socket = null;
});
//let platforms = nodencl.getPlatformInfo();
nodencl
  .createContext()
  .then(context => {
    return Promise.all([
      //getImages().then(images => {
      //  return prepareImages(images);
      //})
      getImages(),
      generateNet(context)
    ]);
  })
  .then(arr => {
    let dataset = arr[0];
    let net = arr[1].net;
    let activate = arr[1].activate;
    let i = 0;
    let ii = 0;
    let start = Date.now();
    let count = 0;
    socket.on("input", index => {
      activate(dataset[index]);
    });

    function next() {
      activate(dataset[i]).then(info => {
        count += info.totalTime;

        i++;
        if (i % Math.floor(dataset.length / 10) === 0) {
          if (socket) {
            socket.emit("monitor", { id: "input" }, net[4].getBuffers());
            socket.emit("monitor", { id: "input1" }, net[3].getBuffers());
          }
        }
        if (dataset[i]) {
          next();
        } else {
          if (ii < 0) {
            i = 0;
            ii++;
            next();
          } else {
            console.log("", Date.now() - start, count);
            //process.exit(0);
          }
        }
      });
    }
    next();
  })

  .catch(err => {
    console.log("err", err);
  });

/*
var example = {
  a: {
    type: "input",
    width: 28,
    height: 28,
    to: ["b"]
  },

  b: {
    type: "fclayer",
    width: 28,
    height: 28,
    to: ["c"]
  },
  c: {
    type: "fclayer",
    width: 28,
    height: 28,
    to: ["c1"],
    error: { a: { type: "compare", from: "a" } }
  },
  c1: {
    type: "fclayer",
    width: 28,
    height: 28,
    to: ["c2"],
    error: { a: { type: "compare", from: "a" } }
  },
  c2: {
    type: "fclayer",
    width: 28,
    height: 28,
    to: ["c3"],
    error: { a: { type: "compare", from: "a" } }
  },
  c3: {
    type: "fclayer",
    width: 28,
    height: 28,
    to: ["c4"],
    error: { a: { type: "compare", from: "a" } }
  },
  c4: {
    type: "fclayer",
    width: 28,
    height: 28,
    error: { a: { type: "compare", from: "a" } }
  }
};*/

/*
var input = new Memory(cq, 28, 28);
var output0 = new FCLayer(cq, 28, 28);
var output1 = new FCLayer(cq, 28, 28);

output0.bind(input);
output1.bind(output0);

output0.setRandomWeight(input);
output1.setRandomWeight(output0);
*/
var errs = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
function generateNet(context) {
  return new Promise(res => {
    var mem = new Memory(context, 28, 28);

    var input = new Input(context, 28, 28);
    var fclayer = new FCLayer(context, 16, 1);
    var fclayer1 = new FCLayer(context, 28, 28);
    var cluster = new Cluster(context, 8, 8, 28, 28);
    var cluster1 = new Cluster(context, 4, 4, 16, 16);

    var output = new Memory(context, 28, 28);
    Promise.all([mem.init(), input.init(), fclayer.init(), fclayer1.init(), cluster.init(), cluster1.init(), output.init()]).then(() => {
      fclayer
        .bind(input)
        .then(() => {
          return fclayer1.bind(fclayer);
        })
        .then(() => {
          fclayer.setRandomWeight(input);
          fclayer1.setRandomWeight(fclayer);
          res({
            activate: dataset => {
              let count = { totalTime: 0 };
              input.setInput(dataset.image);
              return (
                input
                  .activate()
                  .then(info => {
                    count.totalTime += info.totalTime;
                    return cluster.learn(input);
                  })
                  //.then(info => {
                  // count.totalTime += info.totalTime;
                  //return cluster.activate(input);
                  //})
                  //.then(info => {
                  // count.totalTime += info.totalTime;
                  //return cluster1.learn(cluster);
                  //})
                  //.then(info => {
                  // count.totalTime += info.totalTime;
                  //return cluster1.activate(cluster);
                  //})
                  //.then(info => {
                  // count.totalTime += info.totalTime;
                  //return cluster1.unactivate(cluster);
                  //})
                  .then(info => {
                    count.totalTime += info.totalTime;
                    return cluster.unactivate(input, output);
                  })
                  .then(info => {
                    var err = 0.0;
                    let m1 = input.getActivate();
                    let m2 = output.getActivate();
                    //if (socket && Math.random() > 0.99) {
                    //socket.emit("monitor", { id: "output1" }, m1);
                    socket.emit("monitor", { id: "output0" }, m1);

                    //socket.emit("monitor", { id: "input" }, net[3].getError());
                    //}

                    for (var i = 0; i != 28 * 28; i++) {
                      err += Math.abs(m1.readFloatLE(4 * i) - m2.readFloatLE(4 * i)) / 4;
                    }
                    errs[dataset.value] += err;
                    if (Math.random() > 0.99) {
                      console.log(errs);
                    }
                    return info;
                  })
                  /*
                .then(info => {
                  count.totalTime += info.totalTime;
                  return fclayer.multiple(input);
                })
                .then(info => {
                  count.totalTime += info.totalTime;
                  return fclayer.RELUactivate();
                })
                .then(info => {
                  count.totalTime += info.totalTime;
                  return fclayer1.multiple(fclayer);
                })
                .then(info => {
                  count.totalTime += info.totalTime;
                  return fclayer1.RELUactivate();
                })
                .then(info => {
                  count.totalTime += info.totalTime;
                  return fclayer1.getErrorFromCompare(input);
                })*/
                  .then(info => {
                    count.totalTime += info.totalTime;
                    return new Promise(res => {
                      return res(count);
                    });
                  })
              );
            },
            net: [fclayer, input, mem, cluster, cluster1, output]
          });
        });
    });
  });
}

function getImages() {
  return new Promise(res => {
    /*DataSet.findOne({ name: "mnist" })
      .populate({ path: "array", options: { limit: 180 } })
      .then(dataset => {
        res(dataset);
      });*/

    let dataset = [];
    fs.readdirSync("./../../training").forEach(dir => {
      dataset = dataset.concat(
        fs
          .readdirSync("./../../training/" + dir)
          .slice(0, 500)
          .map(imagePath => {
            return {
              value: parseInt(dir),
              image: sharp("./../../training/" + dir + "/" + imagePath)
                .greyscale()
                .raw()
                .toBuffer()
            };
          })
      );
    });
    let time = Date.now();
    Promise.all(dataset.map(d => d.image)).then(data => {
      console.log("read complete", data.length, Date.now() - time);
      data.forEach((d, i) => {
        dataset[i].image = d;
      });
      res(dataset);
    });
  });
}

function prepareImages(dataset) {
  return new Promise(res => {
    var start = Date.now();
    console.log("dataset", dataset);
    Promise.all(
      dataset.array.map(image => {
        return sharp(image.data.image.buffer)
          .greyscale()
          .raw()
          .toBuffer();
      })
    )
      .then(images => {
        res(images);
      })
      .catch(err => {
        console.log(err);
      });
  });
}

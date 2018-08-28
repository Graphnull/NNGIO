const nodencl = require("nodencl");

var { Memory } = require("./layers/memory");
var { Input } = require("./layers/input");
var { FCLayer } = require("./layers/fclayer");

var { DataSet } = require("./../db");
var sharp = require("sharp");
var { io } = require("./../socket");
let socket;

io.on("connection", function(s) {
  socket = s;
});
io.on("disconnect", function(s) {
  socket = null;
});
//let platforms = nodencl.getPlatformInfo();
nodencl
  .createContext()
  .then(context => {
    return Promise.all([
      getImages().then(images => {
        return prepareImages(images);
      }),

      generateNet(context)
    ]);
  })
  .then(arr => {
    let images = arr[0];
    let net = arr[1].net;
    let activate = arr[1].activate;
    let i = 0;
    let start = Date.now();
    let count = 0;
    function next() {
      activate(images[i]).then(info => {
        count += info.totalTime;

        i++;
        if (i % Math.floor(images.length / 10) === 0) {
          if (socket) {
            socket.emit("monitor", { id: "input" }, net[0].getActivate());
          }
        }
        if (images[i]) {
          next();
        } else {
          console.log("", Date.now() - start, count);
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
function generateNet(context) {
  return new Promise(res => {
    var mem = new Memory(context, 28, 28);

    var input = new Input(context, 28, 28);
    var fclayer = new FCLayer(context, 16, 1);
    var fclayer1 = new FCLayer(context, 28, 28);

    Promise.all([mem.init(), input.init(), fclayer.init(), fclayer1.init()]).then(() => {
      fclayer
        .bind(input)
        .then(() => {
          return fclayer1.bind(fclayer);
        })
        .then(() => {
          fclayer.setRandomWeight(input);
          fclayer1.setRandomWeight(fclayer);
          res({
            activate: image => {
              let count = { totalTime: 0 };
              input.setInput(image);
              return input
                .activate()
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
                  return new Promise(res => {
                    return res(count);
                  });
                });
            },
            net: [fclayer, input, mem]
          });
        });
    });
  });
}

function getImages() {
  return new Promise(res => {
    DataSet.findOne({ name: "mnist" })
      .populate({ path: "array", options: { limit: 180 } })
      .then(dataset => {
        res(dataset);
      });
  });
}

function prepareImages(dataset) {
  return new Promise(res => {
    var start = Date.now();
    Promise.all(
      dataset.array.map(image => {
        //console.log("image.data.image.buffer", image.data.image.buffer);
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

function neuralLearning(buffers) {
  var start = Date.now();

  var i = 0;
  function tick() {
    //without mask 0.5 seconds
    example.a.source = buffers[i];
    activate.forEach(func => func());

    /*
    output0.clearActivate();
    output1.clearActivate();

    input.setActivate(buffers[i]);
    output0.multiple(input);
    output0.RELUactivate();
    output1.multiple(output0);
    output1.RELUactivate();
    output1.getErrorFromCompare(input);
    output1.mutateWeight(output0);
    output1.clearActivate();
    output1.multiple(output0);
    output1.RELUactivate();*/
    //output1.checkMutateWeight(input, output0);

    //output1.multiple(output0);
    //output1.RELUactivate();

    //output1.getErrorFromCompare(input);
    i++;
    if (i === 1800) {
      console.log("complete", (Date.now() - start) / 1000, "second");
      end = true;
      neuralLearning(buffers);
      return null;
    }
    if (i % 900 === 0) {
      console.log(i);
      if (socket) {
        socket.emit("monitor", { id: "input" }, input.getActivate());
        socket.emit("monitor", { id: "output0" }, output0.getError());
      }
      //socket.emit("monitor", { id: "output1" }, output1.getActivate());
      setTimeout(() => {
        tick();
      }, 1);
    } else {
      tick();
    }
  }
  tick();
}

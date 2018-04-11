var cl = require("./../../node-opencl-master/lib/opencl"); //TODO
var { ctx, device } = require("./openCLHelper");
var { Memory } = require("./openClNeuralNet/memory");
var { FCLayer } = require("./openClNeuralNet/fclayer");
var { loadingKernels, getKernel } = require("./openCLHelper/kernels");
var { DataSet } = require("./../db");
var sharp = require("sharp");
var { io } = require("./../socket");
var { convertSchema } = require("./openClNeuralNet/schema");
var end = true;
loadingKernels(device);
var socket;
var cq;
if (cl.createCommandQueueWithProperties !== undefined) {
  cq = cl.createCommandQueueWithProperties(ctx, device, []); // OpenCL 2
} else {
  cq = cl.createCommandQueue(ctx, device, null); // OpenCL 1.x
}
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
};
/*
var input = new Memory(cq, 28, 28);
var output0 = new FCLayer(cq, 28, 28);
var output1 = new FCLayer(cq, 28, 28);

output0.bind(input);
output1.bind(output0);

output0.setRandomWeight(input);
output1.setRandomWeight(output0);
*/
var activate;
var start = Date.now();

DataSet.findOne({ name: "mnist" })
  .populate({ path: "array", options: { limit: 1800 } })
  .then(dataset => {
    console.log("get from db complete", (Date.now() - start) / 1000, "second");
    prepareImages(dataset);
  });

function prepareImages(dataset) {
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
      console.log("image convert complete", (Date.now() - start) / 1000, "second");

      activate = convertSchema(example).activate;
      neuralLearning(images);
      io.on("connection", function(s) {
        socket = s;
        if (end) {
          end = false;
          neuralLearning(images);
        }
      });
    })
    .catch(err => {
      console.log(err);
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
process.on("data", data => {
  console.log(data);
});

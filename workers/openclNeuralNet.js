var cl = require("./../../node-opencl-master/lib/opencl"); //TODO
var { ctx, device } = require("./openCLHelper");
var { Memory } = require("./openClNeuralNet/memory");
var { FCLayer } = require("./openClNeuralNet/fclayer");
var { loadingKernels, getKernel } = require("./openCLHelper/kernels");
var { DataSet } = require("./../db");
var sharp = require("sharp");
var { io } = require("./../socket");
var end = true;
loadingKernels(device);
var socket;
var cq;
if (cl.createCommandQueueWithProperties !== undefined) {
  cq = cl.createCommandQueueWithProperties(ctx, device, []); // OpenCL 2
} else {
  cq = cl.createCommandQueue(ctx, device, null); // OpenCL 1.x
}

var input = new Memory(cq, 28, 28);
var output0 = new FCLayer(cq, 28, 28);
//var output1 = new FCLayer(cq, 28, 28);

output0.bind(input);
//output1.bind(output0);

output0.setRandomWeight(input);
//output1.setRandomWeight(output0);
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
    output0.clearActivate();
    input.setActivate(buffers[i]);
    output0.multiple(input);
    output0.RELUactivate();
    output0.getErrorFromCompare(input);
    output0.mutateWeight(input);
    output0.clearActivate();
    output0.multiple(input);
    output0.RELUactivate();
    output0.checkMutateWeight(input, input);
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
    if (i % 100 === 0) {
      console.log(i);
      socket.emit("monitor", { id: "input" }, input.getActivate());
      socket.emit("monitor", { id: "output0" }, output0.getActivate());
      //socket.emit("monitor", { id: "output1" }, output1.getActivate());
      setTimeout(() => {
        tick();
      }, 10);
    } else {
      tick();
    }
  }
  tick();
}
process.on("data", data => {
  console.log(data);
});

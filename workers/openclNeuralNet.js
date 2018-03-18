var cl = require("./../../node-opencl-master/lib/opencl"); //TODO
var { ctx, device } = require("./openCLHelper");
var { Memory } = require("./openClNeuralNet/memory");
var { FCLayer } = require("./openClNeuralNet/fclayer");
var { loadingKernels, getKernel } = require("./openCLHelper/kernels");
var { DataSet } = require("./../db");
var sharp = require("sharp");
var { io } = require("./../socket");

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
var output1 = new FCLayer(cq, 64, 64);

output0.bind(input);
output1.bind(output0);

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
        neuralLearning(images);
      });
    })
    .catch(err => {
      console.log(err);
    });
}
function neuralLearning(buffers) {
  var start = Date.now();
  buffers.forEach((image, index) => {
    if (index % 100 === 0) {
      console.log(index);
      socket.emit("monitor", output1.getActivate());
    }

    input.setActivate(image);
    output0.multiple(input);
    output0.RELUactivate();
    output1.multiple(output0);
    output1.RELUactivate();
  });

  console.log("complete", (Date.now() - start) / 1000, "second");
}
process.on("data", data => {
  console.log(data);
});

var cl = require("./../node-opencl-master/lib/opencl"); //TODO
var { ctx, device } = require("./openCLHelper");
var { Memory } = require("./openClNeuralNet/memory");
var { FCLayer } = require("./openClNeuralNet/fclayer");
var { loadingKernels, getKernel } = require("./openCLHelper/kernels");
var { DataSet } = require("./db");
var sharp = require("sharp");
loadingKernels(device);

var cq;
if (cl.createCommandQueueWithProperties !== undefined) {
  cq = cl.createCommandQueueWithProperties(ctx, device, []); // OpenCL 2
} else {
  cq = cl.createCommandQueue(ctx, device, null); // OpenCL 1.x
}

var input = new Memory(cq, 28, 28);
var output0 = new FCLayer(cq, 28, 28);
var output1 = new FCLayer(cq, 28, 28);
var output2 = new FCLayer(cq, 28, 28);
var output3 = new FCLayer(cq, 128, 128);
output0.bind(input);
output1.bind(output0);
output2.bind(output1);
output3.bind(output2);

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

      neuralLearning(images);
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
    }

    input.setActivate(image);
    output0.multiple(input);
    output0.RELUactivate();
    output1.multiple(output0);
    output1.RELUactivate();
    output2.multiple(output1);
    output2.RELUactivate();
    output3.multiple(output2);
    output3.RELUactivate();
  });

  console.log("complete", (Date.now() - start) / 1000, "second");
}
process.on("data", data => {
  console.log(data);
});

var cl = require("./../../node-opencl-master/lib/opencl"); //TODO
var { ctx, device } = require("./openCLHelper");
var { Memory } = require("./openClNeuralNet/memory");
var { FCLayer } = require("./openClNeuralNet/fclayer");
var { loadingKernels, getKernel } = require("./openCLHelper/kernels");
var video = require("./videoInput");
var jpeg = require("jpeg-js");
var path = require("path");
var fs = require("fs");
//var { convertSchema } = require("./openClNeuralNet/schema");
var cq;
if (cl.createCommandQueueWithProperties !== undefined) {
  cq = cl.createCommandQueueWithProperties(ctx, device, []); // OpenCL 2
} else {
  cq = cl.createCommandQueue(ctx, device, null); // OpenCL 1.x
}
loadingKernels(device);

var width = 64;
var height = 36;
var channels = 3;
var input = new Memory(cq, width, height);
var output0 = new FCLayer(cq, width, height);
var output1 = new FCLayer(cq, width, height);

output0.bind(input);
output1.bind(output0);
output1.bind(input);

output0.setBackError(output1);

output0.setRandomWeight(input);
output1.setRandomWeight(output0);

var iter = 0;
console.log("update");
video.on("update", data => {
  var time = Date.now();

  for (var tii = 0; tii != 10; tii++) {
    /*
    input.setActivate(data);

    output0.clearActivate();
    output0.multiple(input);
    output0.RELUactivate();

    output0.getErrorFromCompare(input);
    output0.mutateWeight(input);
    output0.clearActivate();
    output0.multiple(input);
    output0.RELUactivate();
    output0.checkMutateWeight(input, input);
*/

    output0.clearActivate();
    output1.clearActivate();
    input.setActivate(data);

    output0.multiple(input);
    output0.RELUactivate();
    output1.multiple(output0);
    output1.RELUactivate();

    output1.getErrorFromCompare(input);
    output1.mutateWeight(output0);
    output1.clearActivate();
    output1.multiple(output0);
    output1.RELUactivate();
    output1.checkMutateWeight(input, output0);

    output1.clearActivate();
    output1.multiple(output0);
    output1.RELUactivate();
    output1.getErrorFromCompare(input);
    //передать ошибки к output0
    output0.backError(output1);
    // мутировать связь

    output1.clearActivate();
    output1.multiple(output0);
    output1.RELUactivate();
    output1.getErrorFromCompare(input);

    // сравнить текущую ошибку у output0 с предыдущей
  }

  iter++;
  if (iter % 30 === 0 || iter === 1) {
    var out = new Uint8Array(width * height * 4);
    var buffer = output1.getActivate();

    for (let y = 0; y !== height; y++) {
      for (let x = 0; x !== width; x++) {
        //console.log("buffer[y * width * channels + x * channels]", buffer[y * width * channels + x * channels]);
        var value = (buffer.readFloatLE(y * width * 4 + x * 4) * 254) << 0;
        out[y * width * 4 + x * 4] = value;

        out[y * width * 4 + x * 4 + 1] = value;

        out[y * width * 4 + x * 4 + 2] = value;

        out[y * width * 4 + x * 4 + 3] = value;
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

  //output1.multiple(output0);
  //output1.RELUactivate();

  //output1.getErrorFromCompare(input);
  console.log("", Date.now() - time);
});

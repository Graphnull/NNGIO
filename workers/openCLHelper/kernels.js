var cl = require("./../../../node-opencl-master/lib/opencl");
var { ctx, device } = require("./index");
var path = require("path");
var fs = require("fs");

var kernels = {};

function importCL(pathCL) {
  return fs.readFileSync(path.resolve(__dirname, "./../openCLNeuralNet/CLPrograms/" + pathCL), "utf-8");
}

module.exports.loadingKernels = function(device) {
  process.stdout.write("Loading kernels: ");
  var start = Date.now();
  var files = fs.readdirSync(path.resolve(__dirname, "./../openCLNeuralNet/CLPrograms/"));
  var count = files.length;
  files.forEach((file, index) => {
    var programmName = file
      .split(".")
      .slice(0, -1)
      .join(".");
    var prog = cl.createProgramWithSource(ctx, importCL(file));

    try {
      var state = cl.buildProgram(prog);
      if (state) {
        new Error(state);
      }
    } catch (err) {
      console.log(cl.getProgramBuildInfo(prog, device, cl.PROGRAM_BUILD_LOG));
      process.exit(1);
    }

    kernels[programmName] = cl.createKernel(prog, programmName);
    process.stdout.cursorTo(17);
    process.stdout.write("" + ((index + 1) / count * 100).toFixed(1) + "%");
  });
  console.log(". Loading complete", (Date.now() - start) / 1000, "second");
};
module.exports.getKernel = function getKernel(kernelName) {
  if (kernels.hasOwnProperty(kernelName)) {
    return kernels[kernelName];
  } else {
    new Error("kernel not found");
  }
};

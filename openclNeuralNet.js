var cl = require("./../node-opencl-master/lib/opencl"); //TODO
var { ctx, device } = require("./openCLHelper");
var { Memory } = require("./openClNeuralNet/memory");
var { FCLayer } = require("./openClNeuralNet/fclayer");
var { loadingKernels } = require("./openCLHelper/kernels");
loadingKernels(device);
var squareString = `
__kernel void square(
  __global uint* input,
 __global uint* output,
 unsigned int count)
{
  unsigned int i = get_global_id(0);
  if (i < count)
      output[i] = input[i] * input[i];
}`;

Square();
function Square() {
  console.log("Using Buffer");

  var NVALUES = 100;
  var BYTES_PER_ELEMENT = Uint32Array.BYTES_PER_ELEMENT;

  var inputs = Buffer(NVALUES * BYTES_PER_ELEMENT); // *4 because uint is 4 bytes.
  var outputs = Buffer(NVALUES * BYTES_PER_ELEMENT);
  outputs.fill(0);

  // Note: using little endian for Intel-based machines, GPU follows same convention
  // as CPU typically but it should be detected with clGetDeviceInfo(CL_DEVICE_ENDIAN_LITTLE)

  for (var i = 0; i < NVALUES; ++i) {
    inputs.writeUInt32LE(i, i * BYTES_PER_ELEMENT); // inputs[offset]=i with offset=i*4 since each uint32 value takes 4 bytes
  }

  var source = squareString;

  var prog = cl.createProgramWithSource(ctx, source);

  cl.buildProgram(prog);

  var kern = cl.createKernel(prog, "square");

  var inputsMem = cl.createBuffer(ctx, cl.MEM_READ_ONLY | cl.MEM_COPY_HOST_PTR, NVALUES * BYTES_PER_ELEMENT, inputs);
  var outputsMem = cl.createBuffer(ctx, cl.MEM_WRITE_ONLY | cl.MEM_COPY_HOST_PTR, NVALUES * BYTES_PER_ELEMENT, outputs);

  cl.setKernelArg(kern, 0, "uint*", inputsMem);
  cl.setKernelArg(kern, 1, "uint*", outputsMem);
  cl.setKernelArg(kern, 2, "uint", NVALUES);

  var cq;
  if (cl.createCommandQueueWithProperties !== undefined) {
    cq = cl.createCommandQueueWithProperties(ctx, device, []); // OpenCL 2
  } else {
    cq = cl.createCommandQueue(ctx, device, null); // OpenCL 1.x
  }
  //console.log(ctx);
  var mem = new FCLayer(cq, 10, 10);

  mem.RELUactivate(cq, kern, NVALUES);
  cl.enqueueNDRangeKernel(cq, kern, 1, null, [NVALUES], null);

  cl.enqueueReadBuffer(cq, outputsMem, true, 0, NVALUES * BYTES_PER_ELEMENT, outputs); // should contains i^2 for i=0,...,10000-1

  cl.finish(cq);

  console.log("#elems in outputs: " + outputs.length);
  var last_value = outputs.readUInt32LE(BYTES_PER_ELEMENT * (NVALUES - 1));
  console.log("Last value is : " + last_value + " should be " + (NVALUES - 1) * (NVALUES - 1));
}

var cl = require("./../../../node-opencl-master/lib/opencl");
var { ctx, device, importCL } = require("./../openCLHelper");
var { FLOATSIZE, INTSIZE } = require("./../openCLHelper/variables");
var { Memory } = require("./memory");
var { getKernel } = require("./../openCLHelper/kernels");

class Weight {
  constructor() {
    this.buffer = null;
    this.bufferTemp = null;
    this.width = null;
    this.height = null;
    this.type = "default";
  }

  clear() {}
  resize() {}
  save() {}
  load() {}
}

module.exports.FCLayer = class FCLayer extends Memory {
  constructor(...params) {
    super(...params);
    this.connect = {};
    this.errorMap = cl.createBuffer(ctx, cl.MEM_READ_WRITE, FLOATSIZE * this.width * this.height, null);
    this.clearError();
  }
  clearError() {
    cl.enqueueFillBuffer(this.cq, this.errorMap, FLOATSIZE, 0, 0, new Uint32Array([FLOATSIZE * this.width * this.height], 0, 1));
  }
  RELUactivate(cq, kern, NVALUES) {
    //long int start_s=GetTickCount();//test
    var err;

    var RELUactivate = getKernel("RELUActivate");
    cl.setKernelArg(RELUactivate, 0, "int16*", this.activateMap);

    cl.finish(this.cq);

    err = cl.enqueueNDRangeKernel(this.cq, RELUactivate, 1, [0], [this.width * this.height / 16], null);
    if (err) {
      console.log(err);
    }
    cl.finish(this.cq);

    //printf("activate %i \n",GetTickCount()-start_s);
  }
  softMaxActivate() {
    /*
    //long int start_s=GetTickCount();//test

    kernelActivate.setArg(0, this.activateMap);
    queueMain.enqueueNDRangeKernel(kernelActivate, cl.NullRange, cl.NDRange(this.width * this.height / 16), cl.NullRange);
    queueMain.finish();
*/
    //printf("activate %i \n",GetTickCount()-start_s);
  }
  getErrorFromCompare(layer) {
    if (layer.width != this.width || layer.height != this.height) {
      throw Error("layer.width != this.width || layer.height != this.height");
    } else {
      var KernelGetError = getKernel("getError");
      cl.setKernelArg(KernelGetError, 0, "float16*", this.activateMap);

      cl.setKernelArg(KernelGetError, 1, "float16*", layer.activateMap);

      cl.setKernelArg(KernelGetError, 2, "float16*", this.errorMap);
      cl.enqueueNDRangeKernel(this.cq, KernelGetError, 1, [0], [this.width * this.height / 16], null);
      cl.finish(this.cq);
    }
  }
  mutateWeight(layer) {
    var KernelMutateWeight = getKernel("mutateWeight");
    this.tempy = Math.floor((Math.random() - 0.5) * 100);
    this.tempx = Math.floor(Math.random() * 1000000);

    var buffer_layerInfo = cl.createBuffer(ctx, cl.MEM_READ_WRITE, INTSIZE * 3, null);

    var param = new Buffer(INTSIZE * 3);
    param.writeInt32LE(layer.width * layer.height, 0);
    param.writeInt32LE(this.tempx, INTSIZE * 1);
    param.writeInt32LE(this.tempy, INTSIZE * 2);

    var t1 = cl.setKernelArg(KernelMutateWeight, 0, "float*", this.connect[layer.id].bufferTemp);
    var t2 = cl.setKernelArg(KernelMutateWeight, 1, "float*", this.connect[layer.id].buffer);
    var t3 = cl.setKernelArg(KernelMutateWeight, 2, "int*", buffer_layerInfo);
    console.log(t1, t2, t3);
    var event = cl.enqueueWriteBuffer(this.cq, buffer_layerInfo, true, 0, INTSIZE * 3, param, null, true);
    var kernelEvent = cl.enqueueNDRangeKernel(this.cq, KernelMutateWeight, new Uint32Array([1]), [0], [this.width * this.height], null, [event], true);
    cl.waitForEvents([kernelEvent]);
    cl.finish(this.cq);
  }

  checkMutateWeight(layer, layerChange) {
    var KernelCheckMutateWeight = getKernel("checkMutateWeight");
    var param = new Buffer(INTSIZE * 3);
    param.writeInt32LE(layerChange.width * layerChange.height, 0);
    param.writeInt32LE(this.tempx, INTSIZE * 1);
    param.writeInt32LE(this.tempy, INTSIZE * 2);
    var buffer_layerInfo = cl.createBuffer(ctx, cl.MEM_READ_WRITE, INTSIZE * 3, null);

    cl.setKernelArg(KernelCheckMutateWeight, 0, "float*", layer.activateMap);
    cl.setKernelArg(KernelCheckMutateWeight, 1, "float*", this.activateMap);
    cl.setKernelArg(KernelCheckMutateWeight, 2, "float*", this.errorMap);
    cl.setKernelArg(KernelCheckMutateWeight, 3, "float*", this.connect[layer.id].bufferTemp);
    cl.setKernelArg(KernelCheckMutateWeight, 4, "float*", this.connect[layer.id].buffer);
    cl.setKernelArg(KernelCheckMutateWeight, 5, "int*", buffer_layerInfo);
    var event = cl.enqueueWriteBuffer(this.cq, buffer_layerInfo, true, 0, INTSIZE * 3, param, null, true);
    var kernelEvent = cl.enqueueNDRangeKernel(this.cq, KernelCheckMutateWeight, 1, [0], [this.width * this.height], null, [event], true);

    cl.waitForEvents([kernelEvent]);
    cl.finish(this.cq);
  }
  bind(layer) {
    if (!this.connect.hasOwnProperty(layer.id)) {
      var weight = new Weight();
      weight.width = this.width * layer.width;
      weight.height = this.height * layer.height;
      weight.type = "fullConnectedWeight";
      weight.buffer = cl.createBuffer(ctx, cl.MEM_READ_WRITE, FLOATSIZE * weight.width * weight.height, null);
      weight.bufferTemp = cl.createBuffer(ctx, cl.MEM_READ_WRITE, FLOATSIZE * weight.width * weight.height, null);
      cl.enqueueFillBuffer(this.cq, weight.buffer, FLOATSIZE, 0, weight.width * weight.height, null, null);
      this.connect[layer.id] = weight;
    }
  }

  setRandomWeight(layer) {
    var layerWeight = this.connect[layer.id];
    var temp = new Buffer(layerWeight.height * layerWeight.width * FLOATSIZE);
    for (var i = 0; i !== layerWeight.height * layerWeight.width; i++) {
      temp.writeFloatLE(Math.random() - 0.5, i * FLOATSIZE);
    }

    cl.enqueueWriteBuffer(this.cq, layerWeight.buffer, true, 0, FLOATSIZE * layerWeight.height * layerWeight.width, temp);
    cl.finish(this.cq);
  }
  multiple(layer) {
    var err;

    var KernelMultiple = getKernel("multiple");
    var buffer = cl.createBuffer(ctx, cl.MEM_READ_WRITE, INTSIZE * 1, null);
    var t1 = cl.setKernelArg(KernelMultiple, 0, "float*", layer.activateMap);

    var t2 = cl.setKernelArg(KernelMultiple, 1, "float*", this.activateMap);

    var t3 = cl.setKernelArg(KernelMultiple, 2, "float*", this.connect[layer.id].buffer);

    var param = new Buffer(INTSIZE);
    param.writeUInt32LE(layer.width * layer.height, 0);

    var t4 = cl.setKernelArg(KernelMultiple, 3, "int*", buffer);
    console.log(t1, t2, t3, t4);
    var event = cl.enqueueWriteBuffer(this.cq, buffer, true, 0, INTSIZE * 1, param, null, true);

    var kernelEvent = cl.enqueueNDRangeKernel(this.cq, KernelMultiple, 1, [0], [this.width * this.height], null, [event], true);
    cl.waitForEvents([kernelEvent]);
    cl.finish(this.cq);
  }
};
function get_event_exec_time(event) {
  // times are 64-bit values in naniseconds. They are returned as [hi,lo] a 2-integer array
  // here we use the lo parts since this example is unlikely to go beyond 2^31 nanseconds per event.
  var start_time = cl.getEventProfilingInfo(event, cl.PROFILING_COMMAND_START);
  var end_time = cl.getEventProfilingInfo(event, cl.PROFILING_COMMAND_END);

  return (end_time[1] - start_time[1]) * 1e-6; // report in millisecond (from nanoseconds)
}

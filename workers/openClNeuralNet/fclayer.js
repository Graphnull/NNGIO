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
  }

  RELUactivate(cq, kern, NVALUES) {
    //long int start_s=GetTickCount();//test
    var err;

    var RELUactivate = getKernel("RELUActivate");
    err = cl.setKernelArg(RELUactivate, 0, "int16*", this.activateMap);
    if (err) {
      console.log(err);
    }
    err = cl.finish(this.cq);
    if (err) {
      console.log(err);
    }
    err = cl.enqueueNDRangeKernel(this.cq, RELUactivate, 1, [0], [this.width * this.height / 16], null);
    if (err) {
      console.log(err);
    }
    err = cl.finish(this.cq);
    if (err) {
      console.log(err);
    }
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

  multiple(layer) {
    var err;
    try {
      var KernelMultiple = getKernel("multiple");
      cl.setKernelArg(KernelMultiple, 0, "float*", layer.activateMap);

      cl.setKernelArg(KernelMultiple, 1, "float*", this.activateMap);

      cl.setKernelArg(KernelMultiple, 2, "float*", this.connect[layer.id].buffer);

      var param = new Buffer(INTSIZE);
      param.writeUInt32LE(layer.width * layer.height, 0);
      cl.setKernelArg(KernelMultiple, 3, "int*", cl.createBuffer(ctx, cl.MEM_READ_ONLY | cl.MEM_COPY_HOST_PTR, INTSIZE * 1, param));

      err = cl.finish(this.cq);
      if (err) {
        console.log(err);
      }

      cl.enqueueNDRangeKernel(this.cq, KernelMultiple, 1, [0], [this.width * this.height], null);

      cl.finish(this.cq);
    } catch (e) {
      console.log(e, this.width, this.height);
    }
  }
};

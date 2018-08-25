//var cl = require("./../../../node-opencl-master/lib/opencl");
//var { ctx, device } = require("./../openCLHelper");
//var { FLOATSIZE, INTSIZE } = require("./../openCLHelper/variables");

const shortid = require("shortid");

shortid.characters("ÇüéâäàåçêëèïîbcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
module.exports.Memory = class Memory {
  constructor(context, width, height) {
    this.id = shortid.generate();
    this.waveleted = false;
    this.width = width;
    this.height = height;
    this.context = context;
    this.init = this.memoryinit;
  }
  memoryinit() {
    return new Promise(res => {
      this.context.createBuffer(Float32Array.BYTES_PER_ELEMENT * this.width * this.height, "readwrite").then(buffer => {
        this.activateMap = buffer;
        this.clearActivate();

        res();
      });
    });
  }

  wavelet() {
    /*
    //Вельвет преобразование на изображение
    if (!this.waveleted) {
      var layerinfo = [1, 0, 1, 0, this.width];
      var consts = new Buffer(INTSIZE * 5);
      layerinfo.forEach((number, i) => consts.writeUInt32LE(number, i * INTSIZE));
      var buffer_layerInfo = cl.createBuffer(ctx, cl.MEM_READ_ONLY | cl.MEM_COPY_HOST_PTR, INTSIZE * 5, consts);

      var kernel_wavelet = getKernel("wavelet");
      cl.setKernelArg(kernel_wavelet, 0, "float*", this.activateMap);
      cl.setKernelArg(kernel_wavelet, 1, "int*", buffer_layerInfo);
      while (layerinfo[0] != this.width && layerinfo[2] != this.height * 2) {
        layerinfo[0] = layerinfo[0] * 2;

        console.log("layerinfo[0]", layerinfo[0], this.width, layerinfo[2], this.height);
        consts.writeUInt32LE(layerinfo[0], 0 * INTSIZE);
        layerinfo[1] = layerinfo[0] / 2;
        consts.writeUInt32LE(layerinfo[1], 1 * INTSIZE);
        layerinfo[3] = 0;
        consts.writeUInt32LE(layerinfo[3], 3 * INTSIZE);

        var event = cl.enqueueWriteBuffer(this.cq, buffer_layerInfo, true, 0, INTSIZE * 5, consts, null, true);

        var kernelEvent = cl.enqueueNDRangeKernel(this.cq, kernel_wavelet, 2, [0, 0], [this.width / layerinfo[0], this.height / layerinfo[2]], null, [event], true);
        cl.waitForEvents([kernelEvent]);
        cl.finish(this.cq);
        layerinfo[2] = layerinfo[2] * 2;
        consts.writeUInt32LE(layerinfo[2], 2 * INTSIZE);
        layerinfo[1] = 0;
        consts.writeUInt32LE(layerinfo[1], 1 * INTSIZE);
        layerinfo[3] = layerinfo[2] / 2;
        consts.writeUInt32LE(layerinfo[3], 3 * INTSIZE);

        var event = cl.enqueueWriteBuffer(this.cq, buffer_layerInfo, true, 0, INTSIZE * 5, consts, null, true);
        var kernelEvent = cl.enqueueNDRangeKernel(this.cq, kernel_wavelet, 2, [0, 0], [this.width / layerinfo[0], this.height / layerinfo[2]], null, [event], true);
        cl.waitForEvents([kernelEvent]);
        cl.finish(this.cq);
      }
      this.waveleted = true;
    }*/
  }
  unwavelet() {
    /*
    if (this.waveleted) {
      //вельвет преобразование в изображение
      var layerinfo = [this.width, 0, this.height * 2, 0, this.width];
      var consts = new Buffer(INTSIZE * 5);
      layerinfo.forEach((number, i) => consts.writeUInt32LE(number, i * INTSIZE));
      var buffer_layerInfo = cl.createBuffer(ctx, cl.MEM_READ_ONLY | cl.MEM_COPY_HOST_PTR, INTSIZE * 5, consts);

      var kernel_unwavelet = getKernel("unwavelet");
      cl.setKernelArg(kernel_unwavelet, 0, "float*", this.activateMap);
      cl.setKernelArg(kernel_unwavelet, 1, "int*", buffer_layerInfo);
      while (layerinfo[0] != 1 && layerinfo[2] != 1) {
        layerinfo[1] = 0;
        consts.writeUInt32LE(layerinfo[1], 1 * INTSIZE);
        layerinfo[3] = layerinfo[2] / 2;
        consts.writeUInt32LE(layerinfo[3], 3 * INTSIZE);

        var event = cl.enqueueWriteBuffer(this.cq, buffer_layerInfo, true, 0, INTSIZE * 5, consts, null, true);
        var kernelEvent = cl.enqueueNDRangeKernel(this.cq, kernel_unwavelet, 2, [0, 0], [this.width / layerinfo[0], this.height / layerinfo[2]], null, [event], true);
        cl.waitForEvents([kernelEvent]);
        cl.finish(this.cq);

        layerinfo[2] = layerinfo[2] / 2;
        consts.writeUInt32LE(layerinfo[2], 2 * INTSIZE);
        layerinfo[1] = layerinfo[0] / 2;
        consts.writeUInt32LE(layerinfo[1], 1 * INTSIZE);
        layerinfo[3] = 0;
        consts.writeUInt32LE(layerinfo[3], 3 * INTSIZE);

        var event = cl.enqueueWriteBuffer(this.cq, buffer_layerInfo, true, 0, INTSIZE * 5, consts, null, true);
        var kernelEvent = cl.enqueueNDRangeKernel(this.cq, kernel_unwavelet, 2, [0, 0], [this.width / layerinfo[0], this.height / layerinfo[2]], null, [event], true);
        cl.waitForEvents([kernelEvent]);
        cl.finish(this.cq);
        layerinfo[0] = layerinfo[0] / 2;
        consts.writeUInt32LE(layerinfo[0], 0 * INTSIZE);
      }
      this.waveleted = false;
    }*/
  }

  setActivate(buffer) {
    if (buffer.length === this.width * this.height) {
      buffer.copy(this.activateMap, 0, 0, this.width * this.height * Float32Array.BYTES_PER_ELEMENT);
    } else {
      new Error(`${buffer.length} != this.width*this.height=${this.width * this.height}`);
    }
  }
  clearActivate() {
    this.activateMap.fill(0);
  }
  getActivate() {
    return this.activateMap;
  }
};

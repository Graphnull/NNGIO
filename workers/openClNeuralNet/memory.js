var cl = require("./../../../node-opencl-master/lib/opencl");
var { ctx, device } = require("./../openCLHelper");
var { FLOATSIZE, INTSIZE } = require("./../openCLHelper/variables");
const uuidv1 = require("uuid/v1");
var { getKernel } = require("./../openCLHelper/kernels");

module.exports.Memory = class Memory {
  constructor(cq, width, height) {
    this.id = uuidv1();
    this.wavelet = false;
    this.width = width;
    this.height = height;
    this.cq = cq;
    this.activateMap = cl.createBuffer(ctx, cl.MEM_READ_WRITE, FLOATSIZE * this.width * this.height, null);
    this.clearActivate();
  }
  wavelet() {
    //Вельвет преобразование на изображение
    if (!this.wavelet) {
      var layerinfo = [1, 0, 1, 0, this.width];
      var consts = new Buffer(INTSIZE * 5);
      layerinfo.forEach((number, i) => consts.writeUInt32LE(number, i * INTSIZE));
      var buffer_layerInfo = cl.createBuffer(ctx, cl.MEM_READ_ONLY | cl.MEM_COPY_HOST_PTR, INTSIZE * 5, consts);

      var kernel_wavelet = getKernel("wavelet");
      cl.setKernelArg(kernel_wavelet, 0, "float*", this.activateMap);
      cl.setKernelArg(kernel_wavelet, 1, "int*", buffer_layerInfo);
      while (layerinfo[0] != this.width && layerinfo[2] != this.height * 2) {
        layerinfo[0] = layerinfo[0] * 2;
        consts.writeUInt32LE(layerinfo[0], 0 * INTSIZE);
        layerinfo[1] = layerinfo[0] / 2;
        consts.writeUInt32LE(layerinfo[1], 1 * INTSIZE);
        layerinfo[3] = 0;
        consts.writeUInt32LE(layerinfo[3], 3 * INTSIZE);

        cl.enqueueWriteBuffer(this.cq, buffer_layerInfo, true, 0, INTSIZE * 5, consts);

        cl.enqueueNDRangeKernel(this.cq, kernel_wavelet, 2, [0, 0], [this.width / layerinfo[0], this.height / layerinfo[2]], null);

        cl.finish(this.cq);
        layerinfo[2] = layerinfo[2] * 2;
        consts.writeUInt32LE(layerinfo[2], 2 * INTSIZE);
        layerinfo[1] = 0;
        consts.writeUInt32LE(layerinfo[1], 1 * INTSIZE);
        layerinfo[3] = layerinfo[2] / 2;
        consts.writeUInt32LE(layerinfo[3], 3 * INTSIZE);

        cl.enqueueWriteBuffer(this.cq, buffer_layerInfo, true, 0, INTSIZE * 5, consts);
        cl.enqueueNDRangeKernel(this.cq, kernel_wavelet, 2, [0, 0], [this.width / layerinfo[0], this.height / layerinfo[2]], null);
        cl.finish(this.cq);
      }
      this.wavelet = true;
    }
  }
  unwavelet() {
    if (this.wavelet) {
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

        cl.enqueueWriteBuffer(this.cq, buffer_layerInfo, true, 0, INTSIZE * 5, consts);
        cl.enqueueNDRangeKernel(this.cq, kernel_unwavelet, 2, [0, 0], [this.width / layerinfo[0], this.height / layerinfo[2]], null);
        cl.finish(this.cq);

        layerinfo[2] = layerinfo[2] / 2;
        consts.writeUInt32LE(layerinfo[2], 2 * INTSIZE);
        layerinfo[1] = layerinfo[0] / 2;
        consts.writeUInt32LE(layerinfo[1], 1 * INTSIZE);
        layerinfo[3] = 0;
        consts.writeUInt32LE(layerinfo[3], 3 * INTSIZE);

        cl.enqueueWriteBuffer(this.cq, buffer_layerInfo, true, 0, INTSIZE * 5, consts);
        cl.enqueueNDRangeKernel(this.cq, kernel_unwavelet, 2, [0, 0], [this.width / layerinfo[0], this.height / layerinfo[2]], null);
        cl.finish(this.cq);
        layerinfo[0] = layerinfo[0] / 2;
        consts.writeUInt32LE(layerinfo[0], 0 * INTSIZE);
      }
      this.wavelet = false;
    }
  }

  setActivate(buffer) {
    var err;

    var input = cl.createBuffer(ctx, cl.MEM_READ_ONLY | cl.MEM_COPY_HOST_PTR, 1 * this.width * this.height, buffer);
    err = cl.finish(this.cq);
    if (err) {
      console.log("", err);
    }
    var convertToFloat = getKernel("convertToFloat");
    err = cl.setKernelArg(convertToFloat, 0, "float*", this.activateMap);
    if (err) {
      console.log("", err);
    }
    err = cl.setKernelArg(convertToFloat, 1, "unsigned char*", input);
    if (err) {
      console.log("", err);
    }
    err = cl.finish(this.cq);
    if (err) {
      console.log(err);
    }
    err = cl.enqueueNDRangeKernel(this.cq, convertToFloat, 1, [0], [this.width * this.height], null);
    if (err) {
      console.log(err);
    }
    err = cl.finish(this.cq);
    if (err) {
      console.log("", err);
    }
  }
  clearActivate() {
    cl.enqueueFillBuffer(this.cq, this.activateMap, FLOATSIZE, 0, 0, new Uint32Array([FLOATSIZE * this.width * this.height], 0, 1));
  }
  getActivate() {
    var output = Buffer(FLOATSIZE * this.width * this.height);
    cl.enqueueReadBuffer(this.cq, this.activateMap, true, 0, FLOATSIZE * this.width * this.height, output);
    return output;
  }
  copyActivateFrom(layer) {
    if (layer.activateMap && layer.width * layer.height === this.width * this.height) {
      cl.enqueueCopyBuffer(this.cq, this.activateMap, layer.activateMap, 0, 0, FLOATSIZE * this.width * this.height);
    } else {
      new Error(`layer.width*layer.height=${layer.width * layer.height} != this.width*this.height=${this.width * this.height}`);
    }
  }
};

var { Memory } = require("./memory");

class Weight {
  constructor() {
    this.buffer = null;
    this.bufferTemp = null;
    this.width = null;
    this.height = null;
    this.type = "default";
  }

  clear() {
    this.buffer.fill(0);
  }
  resize() {}
  save() {}
  load() {}
}

module.exports.FCLayer = class FCLayer extends Memory {
  constructor(...params) {
    super(...params);

    this.init = () => {
      return this.memoryinit().then(() => {
        return this.FCLayerInit();
      });
    };
  }
  FCLayerInit() {
    return new Promise(res => {
      this.connect = {};
      //activate
      var code = `__kernel void kernel ${"activate" + this.id}( __global float* bufferA){
      bufferA[get_global_id(0)]=fabs(bufferA[get_global_id(0)]);
      };`;
      Promise.all([
        this.context.createBuffer(Float32Array.BYTES_PER_ELEMENT * this.width * this.height, "readwrite"),
        this.context.createProgram(code, {
          name: "activate" + this.id,
          globalWorkItems: this.width * this.height,
          workItemsPerGroup: 16
        })
      ]).then(arr => {
        this.errorMap = arr[0];
        this.clearError();
        this.activateKernel = arr[1];
        res();
      });
    });
  }
  clearError() {
    this.errorMap.fill(0);
  }
  RELUactivate() {
    return this.activateKernel.run({ bufferA: this.activateMap });
  }
  bind(layer) {
    return new Promise(res => {
      if (!this.connect.hasOwnProperty(layer.id)) {
        var weight = new Weight();
        weight.width = this.width * layer.width;
        weight.height = this.height * layer.height;
        weight.type = "fullConnectedWeight";
        //multiple compile
        var codeMultiple = `__kernel void kernel ${"multiple" + this.id}(  __global float* bufferIn,  __global float* bufferOut , __global float* bufferW){
        
          float out=0.0;
          for(size_t x=0;x!=(${layer.width * layer.height}); x++){
                  
                  out+=bufferIn[x]*bufferW[get_global_id(0)*${layer.width * layer.height}+x];
          
          }
          bufferOut[get_global_id(0)]=out;
          
          };`;
        //getErrorFromCompare
        var codeGetError = `__kernel void kernel ${"getError" + this.id}( __global float16* bufferIn, __global float16* bufferOut, __global float16* bufferError){
  
          bufferError[get_global_id(0)]=fabs(bufferIn[get_global_id(0)]-bufferOut[get_global_id(0)])*fabs(bufferIn[get_global_id(0)]-bufferOut[get_global_id(0)]);
          
          };`;
        //Mutate Weight
        var codeMutateWeight = `
        __kernel void kernel ${"mutateWeight" + this.id}( __global float* bufferTemp,__global float* bufferW,  __global int* layerInfo){
  
           int x=get_global_id(0)* ${layer.width * layer.height}+fmod((get_global_id(0) *43758.5453+layerInfo[1]),${layer.width * layer.height}.0);
            if(layerInfo[2]>0){
            bufferW[x]+= 0.01;
            } else{
              bufferW[x]-= 0.01;
            }
          }
          `;
        // CheckMutateWeight
        var codeCheckMutateWeight = `
          __kernel void kernel ${"checkMutateWeight" +
            this.id}( __global float* bufferIn,__global float* bufferOut, __global float* bufferError,__global float* bufferTemp,__global float* bufferW,  __global int* layerInfo){
            float err=fabs(bufferIn[get_global_id(0)]-bufferOut[get_global_id(0)])*fabs(bufferIn[get_global_id(0)]-bufferOut[get_global_id(0)]);
             int bufferWidth=layerInfo[0];
           int x=get_global_id(0)* bufferWidth+fmod((get_global_id(0) *43758.5453+layerInfo[1]),bufferWidth*1.0);
           if((err)<bufferError[get_global_id(0)] ){
                 if(layerInfo[2]>0){
                 bufferW[x]=bufferW[x]-0.01+fabs(err)*0.11;
                 }else{
                 bufferW[x]=bufferW[x]+0.01-fabs(err)*0.11;
                 }
                 
           }else{
                 if(layerInfo[2]>0){
                 bufferW[x]=bufferW[x]-0.01;
                  }else{
                 bufferW[x]=bufferW[x]+0.01;
                 }
               if(err==bufferError[get_global_id(0)]){
               }
           }}`;
        Promise.all([
          this.context.createBuffer(Float32Array.BYTES_PER_ELEMENT * weight.width * weight.height, "readwrite"),
          this.context.createBuffer(Float32Array.BYTES_PER_ELEMENT * weight.width * weight.height, "readwrite"),
          this.context.createProgram(codeMultiple, {
            name: "multiple" + this.id,
            globalWorkItems: this.width * this.height,
            workItemsPerGroup: 16
          }),
          this.context.createProgram(codeGetError, {
            name: "getError" + this.id,
            globalWorkItems: this.width * this.height,
            workItemsPerGroup: 16
          }),
          this.context.createProgram(codeMutateWeight, {
            name: "mutateWeight" + this.id,
            globalWorkItems: this.width * this.height,
            workItemsPerGroup: 16
          }),
          this.context.createBuffer(Int32Array.BYTES_PER_ELEMENT * 3, "readwrite"),
          this.context.createProgram(codeCheckMutateWeight, {
            name: "checkMutateWeight" + this.id,
            globalWorkItems: this.width * this.height,
            workItemsPerGroup: 16
          }),
          this.context.createBuffer(Int32Array.BYTES_PER_ELEMENT * 3, "readwrite")
        ]).then(arr => {
          weight.buffer = arr[0];
          weight.bufferTemp = arr[1];
          weight.clear();
          this.connect[layer.id] = weight;
          this["multilpeKernel" + layer.id] = arr[2];
          this["getErrorKernel" + layer.id] = arr[3];
          this["mutateWeightKernel" + layer.id] = arr[4];
          this["mutateWeightBuffer" + layer.id] = arr[5];
          this["checkMutateWeightKernel" + layer.id] = arr[6];
          this["checkMutateWeightBuffer" + layer.id] = arr[7];
          res();
        });
      } else {
        res();
      }
    });
  }
  getError() {
    return this.errorMap;
  }
  setRandomWeight(layer) {
    var layerWeight = this.connect[layer.id];
    for (var i = 0; i !== layerWeight.height * layerWeight.width; i++) {
      layerWeight.buffer.writeFloatLE((Math.random() - 0.5) * 0.1, i * Float32Array.BYTES_PER_ELEMENT);
    }
  }
  multiple(layer) {
    return this["multilpeKernel" + layer.id].run({ bufferIn: layer.activateMap, bufferOut: this.activateMap, bufferW: this.connect[layer.id].buffer });
  }
  getErrorFromCompare(layer) {
    return this["getErrorKernel" + layer.id].run({ bufferIn: this.activateMap, bufferOut: layer.activateMap, bufferError: this.errorMap });
  }
  mutateWeight(layer) {
    this.tempy = Math.floor((Math.random() - 0.5) * 100);
    this.tempx = Math.floor(Math.random() * 1000000);
    var param = this["mutateWeightBuffer" + layer.id];
    param.writeInt32LE(0, 0);
    param.writeInt32LE(this.tempx, Int32Array.BYTES_PER_ELEMENT * 1);
    param.writeInt32LE(this.tempy, Int32Array.BYTES_PER_ELEMENT * 2);
    let weight = this.connect[layer.id];
    return this["mutateWeightKernel" + layer.id].run({ bufferTemp: weight.bufferTemp, bufferW: weight.buffer, layerInfo: param });
  }
  checkMutateWeight(layer, layerChange) {
    var param = this["checkMutateWeightBuffer" + layer.id];
    param.writeInt32LE(layerChange.width * layerChange.height, 0);
    param.writeInt32LE(this.tempx, Int32Array.BYTES_PER_ELEMENT * 1);
    param.writeInt32LE(this.tempy, Int32Array.BYTES_PER_ELEMENT * 2);
    let weight = this.connect[layer.id];
    return this["mutateWeightKernel" + layer.id].run({
      bufferIn: layer.activateMap,
      bufferOut: this.activateMap,
      bufferError: this.errorMap,
      bufferTemp: weight.bufferTemp,
      bufferW: weight.buffer,
      layerInfo: param
    });
  }

  setBackError(layer) {
    return new Promise(res => {
      //backError
      var codeBackError = `
    __kernel void kernel  ${"backError" + layer.id}( __global float* errorMap,__global float* bufferWL,  __global float* errorL){
      errorMap[get_global_id(0)]=0.0;
        for(size_t x=0;x!=${layer.width}; x++){
          errorMap[get_global_id(0)]+=fabs(errorL[x]*bufferWL[get_global_id(0)+x*${this.width}]);
        }
      }
`;
      //backErrorWithMutate
      var codeBackErrorWithMutate = `
  __kernel void kernel  ${"backErrorWithMutate" + layer.id}( __global float* errorMap,__global float* bufferWL,  __global float* errorL){
    float err=0.0;
      for(size_t x=0;x!=${layer.width}; x++){
       err+=fabs(errorL[x]*bufferWL[get_global_id(0)+x*${this.width}]);
      }

      int x=get_global_id(0)* ${layer.width * this.width}+fmod((get_global_id(0) *43758.5453+layerInfo[1]),${layer.width * this.width}*1.0);
      if((err)<errorMap[get_global_id(0)] ){
            if(layerInfo[2]>0){
            bufferW[x]=bufferW[x]-0.01+fabs(err)*0.11;
            }else{
            bufferW[x]=bufferW[x]+0.01-fabs(err)*0.11;
            }
            
      }else{
            if(layerInfo[2]>0){
            bufferW[x]=bufferW[x]-0.01;
             }else{
            bufferW[x]=bufferW[x]+0.01;
            }

    }
`;
      Promise.all([
        this.context.createProgram(codeMultiple, {
          name: "backError" + layer.id,
          globalWorkItems: this.width * this.height,
          workItemsPerGroup: 16
        }),
        this.context.createProgram(codeGetError, {
          name: "backErrorWithMutate" + layer.id,
          globalWorkItems: this.width * this.height,
          workItemsPerGroup: 16
        })
      ]).then(arr => {
        this["backErrorKernel" + layer.id] = arr[0];
        this["backErrorWithMutateKernel" + layer.id] = arr[1];
        res();
      });
    });
  }
  backError(layer) {
    return this["backErrorKernel" + layer.id].run({ errorMap: this.errorMap, bufferWL: layer.connect[this.id].buffer, errorL: layer.errorMap });
  }
  backErrorWithMutate(layer) {
    return this["backErrorWithMutateKernel" + layer.id].run({ errorMap: this.errorMap, bufferWL: layer.connect[this.id].buffer, errorL: layer.errorMap });
  }
};

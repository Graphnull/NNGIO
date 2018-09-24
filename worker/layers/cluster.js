var { Memory } = require("./memory");
let uniqueid = 0;
module.exports.Cluster = class Cluster extends Memory {
  constructor(...props) {
    super(...props);

    this.bufferWidth = props[3];
    this.bufferHeight = props[4];

    this.init = () => {
      return this.memoryinit().then(() => {
        return this.ClusterInit();
      });
    };
  }
  ClusterInit() {
    return new Promise(res => {
      var code = `__kernel void kernel ${"activate" + this.id}( __global float* input, __global float* output,__global float* buffers){
        
        output[get_global_id(0)]=0.0f;
        for(int i=0;i!=${this.bufferWidth * this.bufferHeight};i++){
          output[get_global_id(0)]+=native_powr(fabs(input[i]-buffers[i+get_global_id(0)*${this.bufferWidth * this.bufferHeight}]), 2.0f);
        }
        output[get_global_id(0)]=output[get_global_id(0)]/${this.bufferWidth * this.bufferHeight}.0f;
        };`;

      var codeMix = `__kernel void kernel ${"mix" + this.id}( __global float* input, __global float* params,__global float* buffers){
       
        buffers[get_global_id(0)+(int)params[0]*${this.bufferWidth * this.bufferHeight}]=input[get_global_id(0)]*(1.0f/(params[1]+1.0))+buffers[get_global_id(0)+(int)params[0]*${this.bufferWidth *
        this.bufferHeight}]*(params[1]/(params[1]+1.0));

          };`;
      var codeUnactivate = `__kernel void kernel ${"unactivate" + this.id}( __global float* input, __global float* output, __global float* buffers){
       
        float data=0.0;

        for(int i =1;i!=${this.width * this.height};i++){
          
          data+=buffers[get_global_id(0)+i*${this.bufferWidth * this.bufferHeight}]+(input[i]*(buffers[get_global_id(0)]-buffers[get_global_id(0)+i*${this.bufferWidth * this.bufferHeight}]));

        }
       
        output[get_global_id(0)]=data/${this.width * this.height - 1}.0f;
     
    
        };
          
          `;

      Promise.all([
        this.context.createBuffer(Float32Array.BYTES_PER_ELEMENT * this.width * this.height * this.bufferWidth * this.bufferHeight, "readwrite"),

        this.context.createProgram(code, {
          name: "activate" + this.id,
          globalWorkItems: this.width * this.height,
          workItemsPerGroup: 16
        }),
        this.context.createBuffer(Float32Array.BYTES_PER_ELEMENT * 2, "readwrite"),

        this.context.createProgram(codeMix, {
          name: "mix" + this.id,
          globalWorkItems: this.bufferWidth * this.bufferHeight,
          workItemsPerGroup: 16
        }),
        this.context.createProgram(codeUnactivate, {
          name: "unactivate" + this.id,
          globalWorkItems: this.bufferWidth * this.bufferHeight,
          workItemsPerGroup: 16
        }),
        this.context.createBuffer(Float32Array.BYTES_PER_ELEMENT * this.width * this.height, "readwrite"),
        this.context.createBuffer(Float32Array.BYTES_PER_ELEMENT * this.bufferWidth * this.bufferHeight, "readwrite"),
        this.context.createBuffer(Float32Array.BYTES_PER_ELEMENT * this.width * this.height * this.width * this.height, "readwrite")
      ]).then(arr => {
        this.initBuffers = false;
        this.buffers = arr[0];
        this.buffersInfo = [];
        for (let i = 0; i !== this.width * this.height; i++) {
          this.buffersInfo[i] = { count: 0 };
        }
        this.activateKernel = arr[1];

        this.mixParams = arr[2];
        this.mixKernel = arr[3];
        this.unactivateKernel = arr[4];
        this.temp = arr[5];
        this.tempb = arr[6];
        this.rels = arr[7];
        res();
      });
    });
  }
  unactivate(inpl, layer) {
    return this.activateKernel.run({ input: inpl.activateMap, buffers: this.buffers, output: this.activateMap }).then(info => {
      var acts = [];
      for (var i = 0; i !== this.width * this.height; i++) {
        acts.push([i, this.activateMap.readFloatLE(Float32Array.BYTES_PER_ELEMENT * i)]);
      }

      acts.sort((l, r) => {
        return l[1] - r[1];
      });
      //кладем самый близкий в буфер как отправная точка
      this.buffers.copy(
        layer.activateMap,
        0,
        Float32Array.BYTES_PER_ELEMENT * acts[0][0] * this.bufferWidth * this.bufferHeight,
        Float32Array.BYTES_PER_ELEMENT * (acts[0][0] + 1) * this.bufferWidth * this.bufferHeight
      );
      let R = acts[0][1];

      let l = this.rels.readFloatLE(Float32Array.BYTES_PER_ELEMENT * acts[0][0] + Float32Array.BYTES_PER_ELEMENT * acts[1][0] * this.width * this.height);

      for (var i = 1; i !== this.width * this.height; i++) {
        let r = acts[i][1];
        let k = (l + -(l * l + r * r - R * R) / (2 * l)) / l;

        for (let j = 0; j !== this.bufferWidth * this.bufferHeight; j++) {
          let t = layer.activateMap.readFloatLE(Float32Array.BYTES_PER_ELEMENT * j);
          let b = this.buffers.readFloatLE(Float32Array.BYTES_PER_ELEMENT * acts[0][0] * this.bufferWidth * this.bufferHeight + Float32Array.BYTES_PER_ELEMENT * j);
          let y = this.buffers.readFloatLE(Float32Array.BYTES_PER_ELEMENT * acts[i][0] * this.bufferWidth * this.bufferHeight + Float32Array.BYTES_PER_ELEMENT * j);
          t = t + (y - b) * k;

          layer.activateMap.writeFloatLE(t, Float32Array.BYTES_PER_ELEMENT * j);
        }
        uniqueid++;
        if (uniqueid % 50 === 0) {
          global.socket.emit("monitor", { id: "output1" }, layer.activateMap);
          global.socket.emit(
            "monitor",
            { id: "output2" },
            this.buffers.slice(
              Float32Array.BYTES_PER_ELEMENT * acts[0][0] * this.bufferWidth * this.bufferHeight,
              Float32Array.BYTES_PER_ELEMENT * (acts[0][0] + 1) * this.bufferWidth * this.bufferHeight
            )
          );
        }
        if(i+1!==this.width * this.height){
        R = Math.sqrt(Math.pow(R, 2) - Math.pow(k, 2));
        let n = l - k;
        l = Math.sqrt((Math.pow(l, 2) * -n + l * Math.pow(n, 2) + l * Math.pow(r, 2) - n * Math.pow(r, 2) + n * Math.pow(
          this.rels.readFloatLE(Float32Array.BYTES_PER_ELEMENT * acts[0][0] + Float32Array.BYTES_PER_ELEMENT * acts[i+1][0] * this.width * this.height)//R
          , 2)) / l);
        }
      }
      return info;
    });
  }
  setRandomBuffers() {
    for (var i = 0; i !== this.width * this.height * this.bufferWidth * this.bufferHeight; i++) {
      this.buffers.writeFloatLE((Math.random() - 0.5) * 0.1, i * Float32Array.BYTES_PER_ELEMENT);
    }
  }
  activate(layer) {
    return this.activateKernel.run({ input: layer.activateMap, output: this.activateMap, buffers: this.buffers });
  }
  mix(layer, i) {
    this.mixParams.writeFloatLE(i, 0);
    this.mixParams.writeFloatLE(this.buffersInfo[i].count, Float32Array.BYTES_PER_ELEMENT * 1);
    return this.mixKernel
      .run({ input: layer.activateMap, buffers: this.buffers, params: this.mixParams })
      .then(() => {
        this.buffers.copy(this.tempb, 0, Float32Array.BYTES_PER_ELEMENT * i * this.bufferWidth * this.bufferHeight, Float32Array.BYTES_PER_ELEMENT * (i + 1) * this.bufferWidth * this.bufferHeight);
        return this.activateKernel.run({ input: this.tempb, output: this.activateMap, buffers: this.buffers });
      })
      .then(info => {
        this.activateMap.copy(this.rels, Float32Array.BYTES_PER_ELEMENT * i * this.width * this.height, 0, Float32Array.BYTES_PER_ELEMENT * this.width * this.height);
        for (var index = 0; index !== this.width * this.height; index++) {
          this.activateMap.copy(
            this.rels,
            Float32Array.BYTES_PER_ELEMENT * i + Float32Array.BYTES_PER_ELEMENT * index * this.width * this.height,
            Float32Array.BYTES_PER_ELEMENT * index,
            Float32Array.BYTES_PER_ELEMENT * (index + 1)
          );
        }
        return info;
      });
  }
  getBuffers() {
    //for (let i = 0; i !== this.width * this.height; i++) {
    //console.log(this.activateMap.readFloatLE(Float32Array.BYTES_PER_ELEMENT * i));
    //}
    return this.buffers;
  }
  learn(layer) {
    if (this.initBuffers) {
      return this.activate(layer).then(info => {
        return new Promise(res => {
          let index = 0;
          let indexval = 999999999;
          for (let i = 0; i !== this.width * this.height; i++) {
            let val = this.activateMap.readFloatLE(Float32Array.BYTES_PER_ELEMENT * i) * this.buffersInfo[i].count;
            if (val < indexval) {
              indexval = val;
              index = i;
            }
          }

          this.mix(layer, index).then(inf => {
            info.totalTime += inf.totalTime;
            this.buffersInfo[index].count++;

            res(info);
          });
        });
      });
    } else {
      return new Promise(res => {
        let time = Date.now();
        this.setRandomBuffers();
        /*
        for (let i = 0; i !== this.width * this.height; i++) {
          layer.activateMap.copy(this.buffers, 0, this.width * this.height, i * this.width * this.height);
          this.buffersInfo[i].count++;
        }*/
        this.initBuffers = true;

        res({ totalTime: (Date.now() - time) * 1000 });
      });
    }
  }
};

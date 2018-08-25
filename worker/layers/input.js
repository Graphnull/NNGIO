var { Memory } = require("./memory");

module.exports.Input = class Input extends Memory {
  constructor(context, width, height) {
    super(context, width, height);

    this.init = () => {
      return this.memoryinit().then(() => {
        return this.inputInit();
      });
    };
  }

  inputInit() {
    //generate code
    return new Promise(res => {
      var code = `__kernel void kernel ${"input" + this.id}(__global float* activateMap, __global unsigned char* input){
			activateMap[get_global_id(0)] =input[get_global_id(0)]/256.0;// (input[get_global_id(0)*3]+input[get_global_id(0)*3+1]+input[get_global_id(0)*3+2])/768.0;
      };`;

      Promise.all([
        this.context.createBuffer(this.width * this.height, "readwrite"),
        this.context.createProgram(code, {
          name: "input" + this.id,
          globalWorkItems: this.width * this.height,
          workItemsPerGroup: 16
        })
      ]).then(arr => {
        this.input = arr[0];
        this.inputKernel = arr[1];
        res();
      });
    });
  }
  setInput(buffer) {
    buffer.copy(this.input, 0, 0, this.width * this.height);
  }
  activate() {
    return this.inputKernel.run({ activateMap: this.activateMap, input: this.input });
  }
};

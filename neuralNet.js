var { nets } = require("./server");
var { stringifyError } = require("./helper");
var brain = require("brain.js");
var { Net, NeuralNet } = require("./db");

function createNew(nets, opt, cb) {
  if (opt.name && opt.hidden) {
    try {
      var bnet = new brain.NeuralNetwork({
        input: 20,
        output: 10,
        hiddenLayers: opt.hidden,
        activation: "leaky-relu"
      });
      var net = Net({
        date: Date.now(),
        type: "",
        error: 1,
        options: {
          iterations: opt.iterations || 10000,
          errorThresh: opt.errorThresh || 0.0000000005,
          logPeriod: opt.logPeriod || 1000,
          learningRate: opt.learningRate || 0.3,
          momentum: opt.momentum || 0.1,
          log: true,
          callbackPeriod: 100,
          callback: null,
          timeout: Infinity
        },
        layers: [
          opt.hidden.map(s => {
            return { width: s, type: "hidden" };
          })
        ],

        maps: []
      });
    } catch (e) {
      return cb(JSON.parse(stringifyError(e)));
    }
    net
      .save()
      .then(netSaved => {
        var nNet = NeuralNet({
          name: opt.name,
          type: "brain.js",
          last: netSaved._id,
          versions: [netSaved._id]
        });
        nNet
          .save()
          .then(() => {
            bnet.model = net;
            nets[opt.name] = bnet;
            cb(null);
          })
          .catch(cb);
      })
      .catch(cb);
  } else {
    cb({ message: "Неверный тип данных" });
  }
}

module.exports.createNew = createNew;

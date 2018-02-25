var { nets } = require("./server");
var { stringifyError } = require("./helper");
var brain = require("brain.js");
var { Net, NeuralNet } = require("./db");

const callback = (e, net) => {
  if (net && net.model) {
    net.model.error = e.error;
  }
  console.log("Итерация:", e.iterations, "Ошибка:", e.error);
};

function changeOptions(net, options, cb) {
  net.model.options = { ...net.model.options, ...options };

  cb();
}
module.exports.changeOptions = changeOptions;

function loadNets(nets) {
  NeuralNet.find()
    .populate({
      path: "last"
    })
    .then(networks => {
      networks.forEach(net => {
        switch (net.type) {
          case "brain.js":
            var last = net.last;

            temp = new brain.NeuralNetwork({
              hiddenLayers: last.layers.map(i => i.width),
              activation: "leaky-relu"
            });
            if (Array.isArray(last.maps) && last.maps[0]) {
              nets[net.name] = temp.fromJSON(JSON.parse(last.maps[0].toString("utf8")));
            } else {
              nets[net.name] = temp;
            }
            nets[net.name].model = last;
            nets[net.name].model.options.callback = e => {
              callback(e, nets[net.name]);
            };
            break;
          default:
            break;
        }

        //net.versions
      });
    })
    .catch(e => {
      console.error(e);
    });
}
module.exports.loadNets = loadNets;
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
          learningRate: opt.learningRate || 0.3,
          momentum: opt.momentum || 0.1,
          log: false,
          callbackPeriod: opt.callbackPeriod || 1000,
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
            bnet.model.options.callback = e => {
              callback(e, bnet);
            };
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

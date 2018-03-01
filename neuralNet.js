var { nets } = require("./server");
var { stringifyError } = require("./helper");
var brain = require("brain.js");
var synaptic = require("synaptic"); // this line is not needed in the browser
var Neuron = synaptic.Neuron,
  Layer = synaptic.Layer,
  Network = synaptic.Network,
  Trainer = synaptic.Trainer,
  Architect = synaptic.Architect;

var { Net, NeuralNet, Layer } = require("./db");

const callback = (e, net) => {
  if (net && net.model) {
    net.model.error = e.error;
  }
  if (e.error) {
    console.log("Итерация:", e.iterations, "Ошибка:", e.error);
  } else {
    console.log(e);
  }
};

function changeOptions(net, options, cb) {
  net.model.options = { ...net.model.options, ...options };

  cb();
}
module.exports.changeOptions = changeOptions;

function loadNets(nets, cb) {
  NeuralNet.find()
    .populate({
      path: "last"
    })
    .then(networks => {
      networks.forEach(net => {
        switch (net.type) {
          case "brain.js":
            var last = net.last;
            var temp = new brain.NeuralNetwork({
              input: last.layers.find(i => i.type === "input").width,
              output: last.layers.find(i => i.type === "output").width,
              hiddenLayers: last.layers.filter(i => i.type === "hidden").map(i => i.width),
              activation: "leaky-relu"
            });
            if (Array.isArray(last.maps) && last.maps[0]) {
              nets[net.name] = temp.fromJSON(JSON.parse(last.maps[0].toString("utf8")));
            } else {
              nets[net.name] = temp;
            }
            nets[net.name].model = last;
            nets[net.name].model.options.interval = nets[net.name].model.options.interval || 2000;
            nets[net.name].model.options.callback = e => {
              callback(e, nets[net.name]);
            };
            break;
          case "synaptic":
            var last = net.last;
            var temp = new Architect.Perceptron(
              last.layers.find(i => i.type === "input").width,
              last.layers.filter(i => i.type === "hidden").map(i => i.width),
              last.layers.find(i => i.type === "output").width
            );
            console.log("dsfsdfdddd");
            if (Array.isArray(last.maps) && last.maps[0]) {
              nets[net.name] = Network.fromJSON(JSON.parse(last.maps[0].toString("utf8")));
            } else {
              nets[net.name] = temp;
            }
            nets[net.name].model = last;
            nets[net.name].model.options.interval = nets[net.name].model.options.interval || 2000;
            nets[net.name].model.options.callback = e => {
              callback(e, nets[net.name]);
            };
            break;

          default:
            break;
        }

        //net.versions
      });
      if (cb) {
        cb();
      }
    })
    .catch(e => {
      console.error(e);
    });
}
module.exports.loadNets = loadNets;
function createNew(nets, opt, cb) {
  if (opt.name && opt.hidden && opt.input && opt.output && opt.type) {
    try {
      switch (opt.type) {
        case "brain.js":
          var bnet = new brain.NeuralNetwork({
            input: opt.input,
            output: opt.output,
            hiddenLayers: opt.hidden,
            activation: opt.activation
          });

          var net = Net({
            date: Date.now(),
            type: opt.type,
            error: 1,
            options: {
              interval: opt.interval,
              iterations: 10000,
              errorThresh: 0.0000000005,
              learningRate: 0.3,
              momentum: 0.1,
              log: false,
              callbackPeriod: 1000,
              timeout: Infinity
            },
            layers: [{ width: opt.input, type: "input" }]
              .concat(
                opt.hidden.map(s => {
                  return { width: s, type: "hidden" };
                })
              )
              .concat([{ width: opt.output, type: "output" }]),
            maps: []
          });
          break;
        case "synaptic":
          var bnet = new Architect.Perceptron(opt.input, opt.hidden, opt.output);

          var net = Net({
            date: Date.now(),
            type: opt.type,
            error: 1,
            options: {
              interval: opt.interval,
              iterations: 10000,
              errorThresh: 0.0000000005,
              learningRate: 0.3,
              momentum: 0.1,
              log: false,
              callbackPeriod: 1000,
              timeout: Infinity
            },
            layers: [{ width: opt.input, type: "input" }]
              .concat(
                opt.hidden.map(s => {
                  return { width: s, type: "hidden" };
                })
              )
              .concat([{ width: opt.output, type: "output" }]),
            maps: []
          });
          break;
        default:
          break;
      }
    } catch (e) {
      return cb(JSON.parse(stringifyError(e)));
    }
    net
      .save()
      .then(netSaved => {
        var nNet = NeuralNet({
          name: opt.name,
          type: opt.type,
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

function infTrain(nets, dataset) {
  var promises = [];

  if (nets)
    Object.keys(nets).forEach(net => {
      if (dataset.hasOwnProperty(net)) {
        if (nets[net].model.options.status) {
          promises.push(
            new Promise((resolve, reject) => {
              switch (nets[net].model.type) {
                case "brain.js":
                  nets[net].train(dataset[net], nets[net].model.options);
                  break;
                case "synaptic":
                  var trainer = new Trainer(nets[net]);

                  trainer.train(dataset[net], {
                    ...nets[net].model.options,
                    ...{ error: nets[net].model.options.errorThresh, schedule: { every: nets[net].model.options.callbackPeriod, do: nets[net].model.options.callback }, cost: Trainer.cost.MSE }
                  });

                default:
                  break;
              }

              resolve();
            })
          );
        }
      }
    });

  if (promises.length) {
    Promise.all(promises)
      .then(values => {
        setTimeout(() => infTrain(nets, dataset), 100);
      })
      .catch(err => {
        console.log(err);
      });
  } else {
    setTimeout(() => infTrain(nets, dataset), 1000);
  }
}
module.exports.infTrain = infTrain;

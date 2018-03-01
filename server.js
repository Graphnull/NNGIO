var brain = require("brain.js");
var { io } = require("./socket");
var WebSocket = require("socket.io-client");
var moment = require("moment");
var fetch = require("isomorphic-fetch");
var { Net, NeuralNet, Data, DataSet } = require("./db");
var { stringifyError } = require("./helper");
var { createNew, loadNets, changeOptions, infTrain } = require("./neuralNet");
var mongoose = require("mongoose");

/*
var csocket=WebSocket.connect('wss://streamer.cryptocompare.com')

csocket.emit('SubAdd', { subs: ['0~Poloniex~BTC~USD'] } ); 

csocket.on('connect',()=>{console.log('connect')})

csocket.on('m',(data)=>{
    //var tradeField = data.substr(0, data.indexOf("~"))
    console.log(data)
})*/

setInterval(() => {
  Object.keys(nets).forEach(net => {
    NeuralNet.findOne({ name: net })
      .populate({
        path: "last"
      })
      .then(origN => {
        if (origN && origN.last.error !== nets[net].model.error) {
          var newNet = new Net(nets[net].model.toObject());
          newNet.date = Date.now();
          newNet.maps = [Buffer.from(JSON.stringify(nets[net].toJSON()), "utf8")];
          newNet._id = undefined;
          newNet
            .save()
            .then(nNet => {
              origN.last = nNet._id;
              origN.versions = origN.versions.concat([nNet._id]);

              origN
                .save()
                .then(() => {
                  nets[net].model = nNet;
                })
                .catch(e => {
                  console.error(e);
                });
            })
            .catch(err => {
              console.error(err);
            });
        }
      })
      .catch(e => {
        console.log(e);
      });
  });
}, 10000);
var nets = {};
var data = {};

var dataset = {};
infTrain(nets, dataset);

loadNets(nets, () => {
  DataSet.find({})
    .populate({
      path: "array"
    })
    .then(dss => {
      if (dss) {
        dss.forEach(ds => {
          if (!dataset.hasOwnProperty(ds.name)) {
            dataset[ds.name] = [];
          }

          if ((Array.isArray(ds.array), nets[ds.name])) {
            ds.array.forEach(arr => {
              if (!data.hasOwnProperty(ds.name)) {
                data[ds.name] = [];
              }

              data[ds.name].push(arr.data);

              var temp = getArr(data[ds.name][data[ds.name].length - 1].date - nets[ds.name].model.options.interval / 2, data[ds.name], nets[ds.name].model);

              if (temp && temp.filter(t => isNaN(t)).length < 1) {
                if (!dataset.hasOwnProperty(ds.name)) {
                  dataset[ds.name] = [];
                }
                dataset[ds.name].push({
                  input: temp.slice(0, nets[ds.name].model.layers.find(i => i.type === "input").width),
                  output: temp.slice(-nets[ds.name].model.layers.find(i => i.type === "output").width)
                });
              } else {
                console.log("неподходящие данные");
              }
            });
          } else {
            console.log("Не массив");
          }
        });
      } else {
        console.log("Нет данных");
      }
    })
    .catch(e => {
      console.log(e);
    });
});

var lastValue = null;

var normalize = 10000;
function getArr(time, data, netModel) {
  if (
    data &&
    data[0].date < Date.now() - netModel.options.interval * (netModel.layers.find(i => i.type === "input").width + netModel.layers.find(i => i.type === "output").width) - netModel.options.interval * 3
  ) {
    let arr = [];
    for (
      var i = time - netModel.options.interval / 2;
      i > time - (netModel.layers.find(i => i.type === "input").width + netModel.layers.find(i => i.type === "output").width) * netModel.options.interval;
      i -= netModel.options.interval
    ) {
      var maxP;
      var maxPt;
      var minP;
      var minPt;
      for (var ind = data.length - 1; ind > 0; ind--) {
        //console.log(data[ind].value, data[ind].timestamp);
        if (data[ind].date > i) {
          maxP = data[ind].value;

          maxPt = data[ind].date;
        } else {
          minP = data[ind].value;
          minPt = data[ind].date;
          break;
        }
      }

      var v = minP * (1.0 - (i - minPt) / (i - minPt + maxPt - i)) + maxP * (1.0 - (maxPt - i) / (i - minPt + maxPt - i));
      arr.push((v - 5000) / normalize);
    }
    return arr.reverse();
  } else {
    return null;
  }
}

setTimeout(() => {
  setInterval(() => {
    fetch("https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC&tsyms=USD")
      .then(res => {
        return res.json();
      })
      .then(d => {
        if (lastValue !== d.BTC.USD) {
          if (!data.hasOwnProperty("BTC")) {
            data["BTC"] = [];
          }
          data["BTC"].push({ value: d.BTC.USD, date: Date.now() });
          var newData = Data({ data: { value: d.BTC.USD, date: Date.now() } });
          newData
            .save()
            .then(nde => {
              DataSet.findOne({ name: "BTC" }).then(e => {
                if (e) {
                  e.array.push(nde._id);
                  e
                    .save()
                    .then(() => {})
                    .catch(e => {
                      console.log(e);
                    });
                } else {
                  console.error("No");
                }
              });
            })
            .catch(e => {
              console.log(e);
            });

          var temp = getArr(data["BTC"][data["BTC"].length - 1].date - nets["BTC"].model.options.interval / 2, data["BTC"], nets["BTC"].model);

          if (temp && temp.filter(t => isNaN(t)).length < 1) {
            if (!dataset.hasOwnProperty("BTC")) {
              dataset["BTC"] = [];
            }
            dataset["BTC"].push({
              input: temp.slice(0, nets["BTC"].model.layers.find(i => i.type === "input").width),
              output: temp.slice(-nets["BTC"].model.layers.find(i => i.type === "output").width)
            });
          } else {
            console.log("неподходящие данные");
          }
        }
        lastValue = d.BTC.USD;
      })
      .catch(err => {
        console.error(err);
      });
  }, 2000);
}, 20000);

io.on("connection", function(socket) {
  socket.on("netsInfo", cb => {
    if (typeof cb !== "function") {
      return null;
    }
    var temp = Object.keys(nets).map(nName => {
      var temp = nets[nName].model.toObject();
      delete temp.maps;
      temp.name = nName;
      return temp;
    });
    cb(null, temp);
  });
  socket.on("dataSetsInfo", cb => {
    if (typeof cb !== "function") {
      return null;
    }

    DataSet.find({})
      .then(e => {
        cb(null, e);
      })
      .catch(e => {
        cb(e);
        console.log(e);
      });
  });
  socket.on("netHistory", (name, cb) => {
    if (typeof cb !== "function") {
      return null;
    }

    NeuralNet.findOne({ name: name })
      .populate({
        path: "versions",
        select: { maps: 0 }
      })

      .then(e => {
        cb(null, e);
      })
      .catch(e => {
        cb(e);
        console.log(e);
      });
  });

  socket.on("save", (name, options, cb) => {
    if (typeof cb !== "function") {
      return null;
    }
    if (nets.hasOwnProperty(name)) {
      changeOptions(nets[name], options, cb);
    } else {
      cb({ message: "Такая сеть не найдена" });
    }
  });

  socket.on("activate", (opt, cb) => {
    if (typeof cb !== "function") {
      return null;
    }
    try {
      var input = getArr(data[opt.name][data[opt.name].length - 1].date - nets[opt.name].model.options.interval / 2, data[opt.name], nets[opt.name].model);

      if (input) {
        if (nets[opt.name]) {
          var temprun;

          switch (nets[opt.name].model.type) {
            case "brain.js":
              temprun = nets[opt.name].run(input.slice(-nets[opt.name].model.layers.find(i => i.type === "input").width));
              break;
            case "synaptic":
              temprun = nets[opt.name].activate(input.slice(-nets[opt.name].model.layers.find(i => i.type === "input").width));
              break;
            default:
              break;
          }

          var temp = temprun.reverse().map((item, i) => {
            return {
              name: "prog",
              date: data[opt.name][data[opt.name].length - 1].date + i * nets[opt.name].model.options.interval,
              value: item
            };
          });
          temp = temp.concat(
            data[opt.name].map(item => {
              return { name: opt.name, date: item.date, value: item.value };
            })
          );
          cb(null, temp);
        } else {
          cb({ message: "Такой сети не найдено" });
        }
      } else {
        cb({ message: "Датасет слишком маленький" });
      }
    } catch (e) {
      console.error(e);
      cb(e);
    }
  });
  socket.on("createNew", (opt, cb) => {
    if (typeof cb !== "function") {
      return null;
    }
    createNew(nets, opt, cb);
  });
  socket.on("dataset", (opt, cb) => {
    if (!Array.isArray(dataset[opt.net])) {
      dataset[opt.net] = [];
    }
    dataset[opt.net].push({ input: opt.input, output: opt.output });
    if (cb) {
      cb(null);
    }
  });
});

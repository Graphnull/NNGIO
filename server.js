var brain = require("brain.js");
var { io } = require("./socket");
var WebSocket = require("socket.io-client");
var moment = require("moment");
var fetch = require("isomorphic-fetch");
var { Net, NeuralNet } = require("./db");
var { stringifyError } = require("./helper");
var { createNew, loadNets, changeOptions } = require("./neuralNet");
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
        if (origN.last.error !== nets[net].model.error) {
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
                  console.log(`Сеть ${net} успешно сохранена`);
                })
                .catch(e => {
                  console.error(e);
                });
            })
            .catch(err => {
              console.error(err);
            });
        }
      });
  });
}, 10000);
var nets = {};
loadNets(nets);
var data = [];
var dataset = {};
var lastValue = null;
var timeInterval = 200;
var iters = 10000;
var inputSize = 10;
var outputSize = 20;
var normalize = 10000;
function getArr(time, data) {
  if (data && data[0].date < Date.now() - timeInterval * (inputSize + outputSize) - timeInterval * 3) {
    let arr = [];
    for (var i = time - timeInterval / 2; i > time - (inputSize + outputSize) * timeInterval; i -= timeInterval) {
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

setInterval(() => {
  fetch("https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC&tsyms=USD")
    .then(res => {
      return res.json();
    })
    .then(d => {
      if (lastValue !== d.BTC.USD) {
        data.push({ value: d.BTC.USD, date: Date.now() });
        //console.log(d)

        var temp = getArr(data[data.length - 1].date - timeInterval / 2, data);

        if (temp && temp.filter(t => isNaN(t)).length < 1) {
          if (!dataset.hasOwnProperty("test")) {
            dataset["test"] = [];
          }
          dataset["test"].push({ input: temp.slice(0, inputSize), output: temp.slice(-outputSize) });
        } else {
          console.log("неподходящие данные");
        }
        //console.log(data)

        console.log(data && Date.now() - timeInterval * (inputSize + outputSize) - data[0].date);
      }
      lastValue = d.BTC.USD;
    })
    .catch(err => {
      console.error(err);
    });
}, 2000);

var learnRate = 0.3;

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
      var input = getArr(data[data.length - 1].date - timeInterval / 2, data);
      if (input) {
        if (nets[opt.name]) {
          var temprun = nets[opt.name].run(input.slice(-inputSize));
          var temp = temprun.reverse().map((item, i) => {
            return {
              name: "prog",
              date: data[data.length - 1].date + i * timeInterval,
              value: item
            };
          });
          temp = temp.concat(
            data.map(item => {
              return { name: "BTC USD", date: item.date, value: item.value };
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

function infTrain() {
  var promises = [];

  Object.keys(nets).forEach(net => {
    if (dataset.hasOwnProperty(net)) {
      if (nets[net].model.options.status) {
        promises.push(
          new Promise((resolve, reject) => {
            nets[net].train(dataset[net], nets[net].model.options);
            resolve();
          })
        );
      }
    }
  });

  if (promises.length) {
    Promise.all(promises)
      .then(values => {
        setTimeout(infTrain, 10);
      })
      .catch(err => {
        console.log(err);
      });
  } else {
    setTimeout(infTrain, 1000);
  }
}
infTrain();

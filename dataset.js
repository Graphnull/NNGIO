var { io } = require("./socket");
var moment = require("moment");
var { Net, NeuralNet, Data, DataSet } = require("./db");
var { createNew, loadNets, changeOptions, infTrain } = require("./neuralNet");
var mongoose = require("mongoose");
var bson = require("bson");
var i = 0;
var startTime = null;
io.on("connection", function(socket) {
  socket.on("dataset/add", (datasetName, array, cb) => {
    console.log("add", datasetName);
    startTime = Date.now();
    var access = true;
    var goodData = array.map(opt => {
      return { type: opt.type, data: { width: opt.data.width, height: opt.data.height, depth: opt.data.depth, bit: opt.data.bit, image: opt.data.image } };
    });
    if (!access) {
      return cb({ message: "Неправильные данные" });
    }
    delete array;
    Data.create(goodData)
      .then(ndatas => {
        DataSet.updateOne({ name: datasetName }, { $push: { array: { $each: ndatas.map(i => i._id) } } })
          .then(e => {
            delete ndatas;
            console.log(e, i++, Date.now() - startTime);
            if (cb) {
              cb(null);
            }
          })
          .catch(e => {
            if (cb) {
              cb(e);
            }
            console.log(e);
          });
      })
      .catch(e => {
        if (cb) {
          cb(e);
        }
        console.log(e);
      });
  });
  socket.on("dataset/createNew", (options, cb) => {
    console.log(options);
    if (typeof cb !== "function") {
      return null;
    }

    DataSet({ ...options })
      .save()
      .then(e => {
        cb(null, e);
      })
      .catch(e => {
        cb(e);
        console.log(e);
      });
  });

  socket.on("dataset/info", cb => {
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
});

var mongoose = require("mongoose");
var io = require("./socket");

mongoose.connect("mongodb://localhost:27017/nngio");
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

var ErrorLogSchema = new mongoose.Schema({
  text: String,
  createdAt: Number
});

var ErrorLog = mongoose.model("ErrorLog", ErrorLogSchema);
function stringifyError(err) {
  var plainObject = {};
  Object.getOwnPropertyNames(err).forEach(function(key) {
    plainObject[key] = err[key];
  });
  return JSON.stringify(plainObject);
}

global.errLog = function errLog(err) {
  console.error(err);
  var plainObject = [];
  var temp = stringifyError(err);

  io
    .in("admin")
    .emit("admin", {
      type: "error",
      body: { text: temp, createdAt: Date.now() }
    });

  ErrorLog({
    text: JSON.stringify({ body: temp }),
    createdAt: Date.now()
  }).save(err => {
    if (err) console.error(err);
  });
};


const Data = mongoose.model("Data", {
    data:mongoose.SchemaTypes.Mixed,

  });

const DataSet = mongoose.model("DataSet", {
    name: String,
    normalise: mongoose.SchemaTypes.Mixed,
    array:[{ type: mongoose.Schema.Types.ObjectId, ref: "Data" }],
  });

const Net = mongoose.model("Net", {
  date: Date,
  name: String,
  type: String,
  error: Number,
  chema: [
    {
      type: String,
      width: Number,
      height: Number,
      size: Number,
      bind: [
        {
          mapIndex: Number,
          chemaIndex: Number
        }
      ]
    }
  ],
  maps: [Buffer]
});

const NeuralNet = mongoose.model("NeuralNet", {
  name: { type: String, required: true },
  versions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Net" }],
  type: String
});

module.exports= {Net,NeuralNet,Data,DataSet};

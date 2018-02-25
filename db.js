var mongoose = require("mongoose");
var io = require("./socket");
var { stringifyError } = require("./helper");
mongoose.connect("mongodb://localhost:27017/nngio");
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

var ErrorLogSchema = new mongoose.Schema({
  text: String,
  createdAt: Number
});

var ErrorLog = mongoose.model("ErrorLog", ErrorLogSchema);

global.errLog = function errLog(err) {
  console.error(err);
  var plainObject = [];
  var temp = stringifyError(err);

  io.in("admin").emit("admin", {
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
  data: mongoose.SchemaTypes.Mixed
});

const DataSet = mongoose.model("DataSet", {
  name: String,
  normalise: mongoose.SchemaTypes.Mixed,
  array: [{ type: mongoose.Schema.Types.ObjectId, ref: "Data" }]
});

var layer = new mongoose.Schema({
  type: String,
  width: Number,
  height: Number,
  size: Number,
  bind: [
    {
      mapIndex: Number,
      layerIndex: Number
    }
  ]
});

const Net = mongoose.model("Net", {
  date: Date,
  type: String,
  error: Number,
  options: {
    iterations: Number,
    errorThresh: Number,
    logPeriod: Number,
    learningRate: Number,
    momentum: Number
  },
  layers: [layer],
  maps: [Buffer]
});

const NeuralNet = mongoose.model("NeuralNet", {
  name: { type: String, required: true, unique: true },
  last: { type: mongoose.Schema.Types.ObjectId, ref: "Net" },
  versions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Net" }],
  type: String
});

module.exports = { Net, NeuralNet, Data, DataSet };

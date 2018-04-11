var cl = require("./../../../node-opencl-master/lib/opencl"); //TODO
var { ctx, device } = require("./../openCLHelper");
var { Memory } = require("./memory");
var { FCLayer } = require("./fclayer");

var _ = require("lodash");
var cq;
if (cl.createCommandQueueWithProperties !== undefined) {
  cq = cl.createCommandQueueWithProperties(ctx, device, []); // OpenCL 2
} else {
  cq = cl.createCommandQueue(ctx, device, null); // OpenCL 1.x
}

module.exports.convertSchema = function convertSchema(schema) {
  var time = Date.now();
  var layers = {};
  var activate = [];
  var learn = [];
  var copy = [];

  var errors = [];

  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  var cloneCheckCircle = _.cloneDeep(schema);
  var inputCount = Object.keys(cloneCheckCircle).filter(id => cloneCheckCircle[id].type === "input").length;
  Object.keys(cloneCheckCircle).forEach(id => {
    if (cloneCheckCircle[id].type === "input") {
      checkCircle(cloneCheckCircle[id], cloneCheckCircle, inputCount);
    }
  });
  Object.keys(cloneCheckCircle).forEach(id => {
    if (!cloneCheckCircle[id].hasOwnProperty("check")) {
      delete schema[id];
      console.log("Найден неиспользуемый узел");
    }
  });

  //формируем слои
  Object.keys(schema).forEach(id => {
    var layer = schema[id];
    switch (layer.type) {
      case "input":
        if (typeof layer.width !== "number" || typeof layer.height !== "number") {
          errors.push("Неправильный тип данных");
          break;
        }

        layers[id] = new Memory(cq, layer.width, layer.height);

        break;
      case "memory":
        if (typeof layer.width !== "number" || typeof layer.height !== "number") {
          errors.push("Неправильный тип данных");
          break;
        }

        layers[id] = new Memory(cq, layer.width, layer.height);

        break;
      case "fclayer":
        if (typeof layer.width !== "number" || typeof layer.height !== "number") {
          errors.push("Неправильный тип данных");
          break;
        }
        layers[id] = new FCLayer(cq, layer.width, layer.height);

        break;
      default:
        errors.push("Неизвестный тип слоя");
        break;
    }
  });
  //формируем обратную связь
  var back = {};
  Object.keys(schema).forEach(id => {
    var layer = schema[id];
    if (layer.to) {
      layer.to.forEach(iid => {
        if (back[iid]) {
          back[iid].push(id);
        } else {
          back[iid] = [id];
        }
      });
    }
  });

  //формируем связи
  Object.keys(back).forEach(id => {
    var layersBack = back[id];
    switch (schema[id].type) {
      case "fclayer":
        layersBack.forEach(lbid => {
          layers[id].bind(layers[lbid]);
          layers[id].setRandomWeight(layers[lbid]);
        });
        break;
    }
  });

  //формируем простую активацию
  while (!checkAllActivate(schema)) {
    Object.keys(schema).forEach(id => {
      var layer = schema[id];

      switch (layer.type) {
        case "input":
          activate.push(() => {
            layers[id].setActivate(layer.source);
          });
          layer.checkActivate = true;
          break;
        case "memory":
          var ch = true;
          back[id].forEach(bid => {
            if (schema[bid].checkActivate) {
            } else {
              ch = false;
            }
          });
          if (ch) {
            layer.checkActivate = true;
          }
          break;
        case "fclayer":
          var ch = true;
          back[id].forEach(bid => {
            if (schema[bid].checkActivate) {
            } else {
              ch = false;
            }
          });
          /*
          var err = true;
          if (layer.error) {
            Object.keys(layer.error).forEach(eid => {
              var error = layer.error[eid];
              switch (error.type) {
                case "compare":
                  schema[error.from];
                  if (schema[error.from].checkLearn) {
                  } else {
                    err = false;
                  }
                  break;
              }
            });
          }*/
          //Все активированны
          if (ch) {
            if (layer.checkActivate) {
            } else {
              activate.push(() => {
                layers[id].clearActivate();
              });

              back[id].forEach(bid => {
                activate.push(() => {
                  layers[id].multiple(layers[bid]);
                });
              });
              activate.push(() => {
                layers[id].RELUactivate();
              });
              layer.checkActivate = true;
            }
          }

          break;
      }
    });
  }
  /*
              //слой активирован. нужно проверить 
            if (layer.checkPreLearn) {

            } else {
              if (err) {
                activate.push(() => {
                  layers[id].RELUactivate();
                });
                layer.checkPreLearn = true;
                setFalseActivate(id, schema);
              }
            }
             */

  //формируем копирование
  Object.keys(back).forEach(id => {
    var layersBack = back[id];
    switch (schema[id].type) {
      case "memory":
        layersBack.forEach(lbid => {
          copy.push(() => {
            layers[id].copyActivateFrom(layers[lbid]);
          });
        });

        break;
    }
  });
  console.log("time ms", Date.now() - time);
  return { activate };
};
function setFalseActivate(id, obj) {
  obj[id].checkActivate = false;
  if (obj[id].to) {
    obj[id].to.forEach(toid => {
      setFalseActivate(toid, obj);
    });
  }
}
function checkAllActivate(obj) {
  var t = true;
  Object.keys(obj).forEach(id => {
    if (obj[id].checkActivate) {
    } else {
      t = false;
    }
  });
  var l = true;
  Object.keys(obj).forEach(id => {
    if (obj[id].checkLearn) {
    } else {
      l = false;
    }
  });
  return t && l;
}

function checkCircle(el, obj, max) {
  if (el.check) {
    el.check++;
  } else {
    el.check = 1;
  }

  if (el.check > max) {
    throw new Error("Найдена циркуляция");
  }
  if (el.to) {
    el.to.forEach(e => {
      checkCircle(obj[e], obj, max);
    });
  }
}

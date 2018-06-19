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
var example = {
  a: {
    type: "input",
    width: 28,
    height: 28,
  },
  a2: {
    type: "input",
    width: 28,
    height: 28,
  },
  b: {
    type: "fclayer",
    width: 28,
    height: 28,
    from: ["a","a2"]
  },
  c: {
    type: "fclayer",
    width: 28,
    height: 28,
    from: ["b"],
    error: {
      a: {
        type: "compare",
        from: "a"
      }
    }
  },
  c1: {
    type: "fclayer",
    width: 28,
    height: 28,
    from: ["c"],
    error: {
      a: {
        type: "compare",
        from: "a"
      }
    }
  },
  c2: {
    type: "fclayer",
    width: 28,
    height: 28,
    from: ["c1"],
    error: {
      a: {
        type: "compare",
        from: "a"
      }
    }
  },
  c3: {
    type: "fclayer",
    width: 28,
    height: 28,
    from: ["c2"],
    error: {
      a: {
        type: "compare",
        from: "a"
      }
    }
  },
  c4: {
    type: "fclayer",
    width: 28,
    height: 28,
    from:["c3"],
    error: {
      a: {
        type: "compare",
        from: "a"
      }
    }
  }
};

function convertSchema(s) {
  let schema = _.cloneDeep(s);

  function checkTree(inp, branch, b) {
    let keys = Object.keys(branch);

    for (let i = 0; i !== keys.length; i++) {
      if (keys[i] === inp) {
        b.id = keys[i];
        b.check = true;
        break;
      } else {
        checkTree(inp, branch[keys[i]], b);
      }
    }
  }
  function addToTree(branch, id, tree) {
    if (schema[id].from) {
      schema[id].to.forEach(b => {
        let bc = { check: false };
        checkTree(id, tree, bc);

        if (bc.check) {
          throw new Error("Найдена циркуляция " + id);
        } else {
        }
      });
    }

    branch[id] = {};

    if (schema[id].to) {
      schema[id].to.forEach(b => {
        addToTree(branch[id], b, tree);
      });
    }
  }
  function viz(branch) {
    Object.keys(branch).forEach((b, i, arr) => {
      process.stdout.write(" " + b);
      if (arr.length - 1 === i) {
        process.stdout.write("\n");
      }
      viz(branch[b]);
    });
  }

  var trees=[]
  Object.keys(schema)
    .filter(i => schema[i].type === "input")
    .forEach(i => {
      const tree = {};
      addToTree(tree, i, tree);
      trees.push(tree)
    });

    //слияние деревьев
    var maintree={}
    function concat(tree,main){


    }
    trees.forEach(t=>{

    })

}

function convertSchema2(schema) {
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
          console.log(lbid);
        });
        break;
    }
  });
  console.log(back);

  //формируем простую активацию
  while (!checkAllActivate(schema)) {
    Object.keys(schema).forEach(id => {
      var layer = schema[id];

      switch (layer.type) {
        case "input":
          activate.push(() => layers[id].setActivate(layer.source));
          activate[activate.length - 1].id = id;
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
              activate.push(() => layers[id].clearActivate());
              activate[activate.length - 1].id = id;
              back[id].forEach(bid => {
                activate.push(() => layers[id].multiple(layers[bid]));
                activate[activate.length - 1].id = id;
              });
              activate.push(() => layers[id].RELUactivate());
              activate[activate.length - 1].id = id;
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
  activate.forEach(f => {
    console.log(f.id, f.toString());
  });
  console.log("time ms", Date.now() - time);
  return {
    activate
  };
}

convertSchema(example);
module.exports.convertSchema = convertSchema;

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
  return t;
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

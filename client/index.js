import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { DatePicker, Button, Slider } from "antd";
import socket from "./socket";

import MenuN from "./menu";
import Spin from "./spiner";
import moment from "moment";
import "moment/locale/ru";
import img from "./grid.png";
import img2 from "./grid2.png";
import img3 from "./grid3.png";
moment.locale("ru");

class App extends Component {
  state = {
    data: [],
    hidden: 4,
    loading: false
  };
  changeLoading = () => {
    this.setState({ loading: !this.state.loading });
  };
  update = () => {
    this.setState({ loading: true });
    socket.emit("netsInfo", (err, info) => {
      if (err) {
        message.error(err.message);
        this.setState({ loading: false });
      } else {
        this.setState({ data: info, loading: false });
      }
    });
  };
  componentDidMount() {
    this.update();
    var ctx = this.refs.canvas.getContext("2d");
    socket.on("connect", () => {
      this.update();
    });

    socket.on("monitor", data => {
      //console.log(data);
      var Fldata = new Float32Array(data);
      var int8 = ctx.createImageData(64, 64);

      for (var x = 0; x !== int8.width; x++) {
        for (var y = 0; y !== int8.height; y++) {
          int8.data[(x + y * int8.width) * 4] = Fldata[x + y * int8.width] / 943652261888;
          if (Fldata[x + y * int8.width] / 943652261888 > 255) {
            int8.data[(x + y * int8.width) * 4] = Fldata[x + y * int8.width] / (943652261888 * 100);
          } else {
            int8.data[(x + y * int8.width) * 4] = Fldata[x + y * int8.width] / (943652261888 / 255);
          }
          int8.data[(x + y * int8.width) * 4 + 3] = 255;
        }
      }

      ctx.putImageData(int8, 0, 0);
    });
  }

  render() {
    return (
      <div>
        <canvas ref="canvas" width="64" height="64" />
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "fixed",
            zIndex: "-1",
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundImage: "url(" + img + ")"
          }}
        />
        <div
          className="animate-area"
          style={{
            backgroundImage: "url(" + img2 + ")"
          }}
        />
        <div
          className="animate-area2"
          style={{
            backgroundImage: "url(" + img3 + ")"
          }}
        />

        <div style={{ position: "absolute", width: "100%", height: "100%" }}>
          {this.state.loading && <Spin text={"Идет соединение с сервером..."} />}
          <MenuN
            update={this.update}
            neuralList={this.state.data.map(item => {
              return { ...item.options, name: item.name, info: item };
            })}
          />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));

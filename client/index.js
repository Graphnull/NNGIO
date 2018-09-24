import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { DatePicker, Button, Slider } from "antd";
import socket from "./socket";

import MenuN from "./menu";
import Spin from "./spiner";
import ShowMap from "./tools/showMap";
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

    socket.on("connect", () => {
      this.update();
    });
  }

  render() {
    return (
      <div>
        <ShowMap mapWidth={16} mapHeight={16 * 16} id="input" />
        <ShowMap mapWidth={28} mapHeight={28 * 64} id="input1" />
        <ShowMap mapWidth={28} mapHeight={28} id="output0" />
        <ShowMap mapWidth={28} mapHeight={28} id="output1" />
        <ShowMap mapWidth={28} mapHeight={28} id="output2" />
        <ShowMap mapWidth={28} mapHeight={28} id="output3" />
        <Button
          onClick={() => {
            socket.emit("input", Math.floor(Math.random() * 900));
          }}
        >
          Отправить
        </Button>
        {/*
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
          */}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));

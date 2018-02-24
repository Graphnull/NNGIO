import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { DatePicker, Button, Slider } from "antd";
import socket from "./socket";
import { Chart, Axis, Tooltip, Geom } from "bizcharts";
import MenuN from "./menu";
import Spin from "./spiner";

class App extends Component {
  state = {
    data: [],
    hidden: 4,
    loading: false
  };
  componentDidMount() {
    this.setState({ loading: true });
    socket.emit("netsInfo", (err, info) => {
      if (err) {
        message.error(err.message);
      } else {
        this.setState({ data: info, loading: false });
      }
    });
  }
  render() {
    return (
      <div style={{ margin: 100 }}>
        {this.state.loading && <Spin />}
        <MenuN
          neuralList={this.state.data.map(item => {
            return { name: item.name, ...item.options };
          })}
        />

        <Slider
          onAfterChange={v => {
            socket.emit("learnRate", v / 100);
            console.log(v / 100);
          }}
        />
        <Slider
          onChange={v => {
            this.setState({ hidden: v });
            console.log(v);
          }}
        />
        <Slider
          onAfterChange={v => {
            socket.emit("iters", v);
            console.log(v);
          }}
        />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));

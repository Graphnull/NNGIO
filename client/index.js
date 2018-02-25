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

  update = () => {
    this.setState({ loading: true });
    socket.emit("netsInfo", (err, info) => {
      if (err) {
        message.error(err.message);
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
      <div style={{ margin: 20 }}>
        {this.state.loading && <Spin />}
        <MenuN
          update={this.update}
          neuralList={this.state.data.map(item => {
            return { ...item.options, name: item.name };
          })}
        />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));

import React, { Component } from "react";
import { Slider } from "antd";

export default class ShowMap extends Component {
  state = {
    multiple: 0.1,
    center: 0.0
  };
  componentDidMount() {
    socket.on("monitor", data => {
      //console.log(data);
      this.floatData = new Float32Array(data);
    });
  }

  render() {
    if (this.floatData) {
      var ctx = this.refs.canvas.getContext("2d");
      var int8 = ctx.createImageData(this.props.mapWidth, this.props.mapHeight);

      for (var x = 0; x !== int8.width; x++) {
        for (var y = 0; y !== int8.height; y++) {
          int8.data[(x + y * int8.width) * 4] = (this.floatData[x + y * int8.width] + this.state.center) * this.state.multiple;
          int8.data[(x + y * int8.width) * 4 + 1] = int8.data[(x + y * int8.width) * 4];
          int8.data[(x + y * int8.width) * 4 + 2] = int8.data[(x + y * int8.width) * 4];
          int8.data[(x + y * int8.width) * 4 + 3] = 255;
        }
      }

      ctx.putImageData(int8, 0, 0);
    }

    return (
      <div>
        <canvas ref="canvas" width={this.props.mapWidth} height={this.props.mapHeight} />
        <h4>
          Центр:
          <Slider
            value={this.state.center}
            step={0.1}
            onChange={e => {
              this.setState({ center: e });
            }}
          />
          Яркость:
          <Slider
            value={this.state.multiple}
            step={0.1}
            onChange={e => {
              this.setState({ multiple: e });
            }}
          />
        </h4>
      </div>
    );
  }
}

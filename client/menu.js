import React, { Component } from "react";
import ReactDOM from "react-dom";

import { DatePicker, Input, Button, Card, InputNumber, Row, Col } from "antd";
import socket from "./socket";
import { Chart, Axis, Tooltip, Geom } from "bizcharts";

const NeuralCard = info => {
  return (
    <div>
      <Row>
        <span>Итерации</span>
        <InputNumber min={1} step={1} value={info.iterations} />
      </Row>
      <Row>
        <span>Минимальное количество ошибок</span>
        <InputNumber
          min={0}
          max={1}
          step={0.000000000000001}
          value={info.errorThresh}
        />
      </Row>
      <Row>
        <span>Частота лога</span>
        <InputNumber min={1} step={1} value={info.logPeriod} />
      </Row>
      <Row>
        <span>Частота обучения</span>
        <InputNumber
          min={0}
          max={1}
          step={0.0000000001}
          value={info.learningRate}
        />
      </Row>
      <Row>
        <span>Момент</span>
        <InputNumber
          min={0}
          max={1}
          step={0.0000000001}
          value={info.momentum}
        />
      </Row>
    </div>
  );
};
export default class MenuN extends Component {
  state = {
    neuralList: [
      {
        name: "test",
        hidden: [55],
        iterations: 10000,
        errorThresh: 0.0000000005,
        logPeriod: 1000,
        learningRate: 0.3,
        momentum: 0.1
      }
    ]
  };

  list = () => {
    return this.state.neuralList.map(neural => {
      return (
        <Card title={neural.name} style={{ width: 300 }}>
          <NeuralCard {...neural} />
        </Card>
      );
    });
  };
  render() {
    return this.list();
  }
}

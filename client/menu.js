import React, { Component } from "react";
import ReactDOM from "react-dom";

import { DatePicker, Input, Button, Card, InputNumber, Row, Col, message, Divider } from "antd";
import socket from "./socket";
import Spin from "./spiner";

import TabsMenu from "./tabs";
class NeuralCard extends Component {
  state = {
    name: "",
    hidden: [55],
    data: [],
    loading: false
  };
  render() {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "stretch"
        }}
      >
        {this.state.loading && <Spin />}
        <div>
          <Row gutter={8}>
            <Col span={12}>
              {this.props.new ? (
                <Input
                  value={this.state.name}
                  onChange={e => {
                    this.setState({ name: e.target.value });
                  }}
                />
              ) : (
                <span>{this.props.name || this.state.name}</span>
              )}
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <span>Итерации</span>
            </Col>
            <Col span={12}>
              <InputNumber min={1} step={1} value={this.props.iterations} />
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <span>Мин. ошибок</span>
            </Col>
            <Col span={12}>
              <InputNumber min={0} max={1} step={0.000000000000001} value={this.props.errorThresh} />
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <span>Частота лога</span>
            </Col>
            <Col span={12}>
              <InputNumber min={1} step={1} value={this.props.logPeriod} />
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <span>Частота обучения</span>
            </Col>
            <Col span={12}>
              <InputNumber min={0} max={1} step={0.0000000001} value={this.props.learningRate} />
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <span>Момент</span>
            </Col>
            <Col span={12}>
              <InputNumber min={0} max={1} step={0.0000000001} value={this.props.momentum} />
            </Col>
          </Row>
          {this.props.new ? (
            <Button
              onClick={() => {
                this.setState({ loading: true });
                socket.emit("createNew", this.state, err => {
                  if (err) {
                    message.error(err.message || err.errmsg);
                  } else {
                    console.log("created");
                  }
                  this.setState({ loading: false });
                });
              }}
            >
              Создать новую
            </Button>
          ) : (
            <Button>Изменить</Button>
          )}
        </div>

        <Divider />
        <TabsMenu name={this.props.name} />
      </div>
    );
  }
}
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
    console.log(this.props.neuralList);
    return this.props.neuralList
      .map((neural, i) => {
        return (
          <Card key={i} style={{ width: "100%" }}>
            <NeuralCard {...neural} />
          </Card>
        );
      })
      .concat([
        <Card key={"new"} style={{ width: "100%" }}>
          <NeuralCard new={true} />
        </Card>
      ]);
  };
  render() {
    return this.list();
  }
}

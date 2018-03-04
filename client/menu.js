import React, { Component } from "react";
import ReactDOM from "react-dom";

import { Input, Button, Form, Checkbox, Card, InputNumber, Row, Col, message, Divider } from "antd";
import socket from "./socket";
import Spin from "./spiner";
import moment from "moment";
import { rowStyle, formItemLayout } from "./helper";
import TabsMenu from "./tabs";
import CreateNew from "./createNew";
import LearnInfo from "./learnInfo";
import { Chart, Axis, Tooltip, Geom } from "bizcharts";
const FormItem = Form.Item;

const NetInfo = props => {
  return (
    <Form>
      <FormItem {...formItemLayout}>
        <h2 style={{ width: "100%", textAlign: "center" }}>Текущее состояние</h2>
      </FormItem>
      <FormItem {...formItemLayout} label="Обучение" style={{ marginBottom: "0px" }}>
        <div>{props.options.status ? "Включено" : "Выключенно"}</div>
      </FormItem>
      <FormItem {...formItemLayout} label="Последнее сохранение" style={{ marginBottom: "0px" }}>
        <div>{moment(props.date).fromNow()}</div>
      </FormItem>
      <FormItem {...formItemLayout} label="Ошибок при текущем датасете" style={{ marginBottom: "0px" }}>
        <div>{props.error * 100}%</div>
      </FormItem>
      <FormItem {...formItemLayout} label="Слои" style={{ marginBottom: "0px", display: "flex" }}>
        <div>
          {props.layers.map((l, i) => (
            <div key={i} style={{ display: "flex" }}>
              <div>{l.type}:</div>
              <div>{l.width}</div>
            </div>
          ))}
        </div>
      </FormItem>
    </Form>
  );
};

class DataSets extends Component {
  state = { list: [] };
  componentDidMount() {
    socket.emit("dataSetsInfo", (err, data) => {
      if (err) {
        message.error(err);
      } else {
        this.setState({ list: data });
      }
    });
  }

  render() {
    return (
      <div>
        {this.state.list.map((i, index) => {
          return (
            <div key={index}>
              <h2>{i.name}</h2>
              <div>Тип:{i.type}</div>
              <div>Обновление:{moment(i.updatedAt).fromNow()}</div>
              <div>Количество:{i.array.length}</div>
              <Divider />
            </div>
          );
        })}
      </div>
    );
  }
}

export default class MenuN extends Component {
  list = () => {
    return this.props.neuralList.map((neural, i) => {
      return (
        <div key={i} style={{ width: "100%" }}>
          <h1>{neural.name}</h1>

          <NetInfo {...neural.info} />
          <Divider />
          <LearnInfo name={neural.name} {...neural} />

          <Divider />
          <TabsMenu name={neural.name} />
          <Divider />
        </div>
      );
    });
  };
  render() {
    return (
      <div>
        {this.list()}
        <DataSets />
        <CreateNew />
      </div>
    );
  }
}

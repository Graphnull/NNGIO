import React, { Component } from "react";
import ReactDOM from "react-dom";

import { Input, Button, Form, Checkbox, Card, InputNumber, message, Divider } from "antd";
import { rowStyle, formItemLayout } from "./helper";
import Spin from "./spiner";
const FormItem = Form.Item;
export default class LearnInfo extends Component {
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
          <Form
            layout="inline"
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "stretch"
            }}
          >
            <FormItem {...formItemLayout}>
              <h2 style={{ width: "100%", textAlign: "center" }}>Параметры обучения</h2>
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="Состояние"
              help={typeof this.state.status === "boolean" && this.state.status !== this.props.status ? "Изменен" : ""}
              validateStatus={typeof this.state.status === "boolean" && "warning"}
            >
              <Checkbox
                checked={typeof this.state.status === "boolean" ? this.state.status : this.props.status}
                onChange={e => {
                  this.setState({ status: e.target.checked });
                }}
              />
            </FormItem>
            <FormItem {...formItemLayout} label="Итерации" validateStatus={this.state.iterations && "warning"}>
              <InputNumber
                style={rowStyle}
                min={1}
                step={1}
                value={this.state.iterations || this.props.iterations}
                onChange={e => {
                  this.setState({ iterations: e });
                }}
              />
            </FormItem>
            <FormItem {...formItemLayout} label="Мин. ошибок" validateStatus={this.state.errorThresh && "warning"}>
              <InputNumber
                style={rowStyle}
                min={0}
                max={1}
                step={0.000000000000001}
                value={this.state.errorThresh || this.props.errorThresh}
                onChange={e => {
                  this.setState({ errorThresh: e });
                }}
              />
            </FormItem>
            <FormItem {...formItemLayout} label="Частота лога" validateStatus={this.state.callbackPeriod && "warning"}>
              <InputNumber
                style={rowStyle}
                min={1}
                step={1}
                value={this.state.callbackPeriod || this.props.callbackPeriod}
                onChange={e => {
                  this.setState({ callbackPeriod: e });
                }}
              />
            </FormItem>
            <FormItem {...formItemLayout} label="Частота обучения" validateStatus={this.state.learningRate && "warning"}>
              <InputNumber
                style={rowStyle}
                min={0}
                max={1}
                step={0.0000000001}
                value={this.state.learningRate || this.props.learningRate}
                onChange={e => {
                  this.setState({ learningRate: e });
                }}
              />
            </FormItem>
            <FormItem {...formItemLayout} label="Момент" validateStatus={this.state.momentum && "warning"}>
              <InputNumber
                style={rowStyle}
                min={0}
                max={1}
                step={0.0000000001}
                value={this.state.momentum || this.props.momentum}
                onChange={e => {
                  this.setState({ momentum: e });
                }}
              />
            </FormItem>
            <FormItem {...formItemLayout} label=":">
              <Button
                style={rowStyle}
                icon="edit"
                type="primary"
                onClick={() => {
                  this.setState({ loading: true });
                  var keys = { ...this.state, name: undefined, data: undefined, loading: undefined, hidden: undefined };
                  socket.emit("save", this.props.name, keys, err => {
                    if (err) {
                      message.error(err.message);
                      this.setState({ loading: false });
                    } else {
                      message.success("Сохранено");
                      var clearState = {};
                      Object.keys(keys).forEach(key => {
                        if (keys[key] !== undefined) {
                          clearState[key] = undefined;
                        }
                      });

                      this.setState({ loading: false, ...clearState }, this.props.update);
                    }
                  });
                }}
              >
                Изменить
              </Button>
            </FormItem>
          </Form>
        </div>
      </div>
    );
  }
}

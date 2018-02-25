import React, { Component } from "react";
import { rowStyle, formItemLayout } from "./helper";
import { Input, Button, Form, Checkbox, Card, InputNumber, Select, message, Tag, Icon } from "antd";
import Spin from "./spiner";
const FormItem = Form.Item;
const Option = Select.Option;
export default class CreateNew extends Component {
  state = {
    name: "",
    type: "brain.js",
    activation: "leaky-relu",
    input: 3,
    output: 3,
    hidden: [3],
    interval: 20,
    inputValue: 3,
    inputVisible: false
  };
  handleInputConfirm = () => {
    const state = this.state;
    const inputValue = state.inputValue;
    let hidden = state.hidden;
    if (inputValue) {
      hidden = [...hidden, inputValue];

      this.setState({
        hidden,
        inputVisible: false,
        inputValue: ""
      });
    }
  };
  render() {
    return (
      <div>
        <Form>
          <FormItem {...formItemLayout}>
            <h2 style={{ width: "100%", textAlign: "center" }}>Создание новой сети</h2>
          </FormItem>
          <FormItem {...formItemLayout} label="Имя">
            <Input
              style={rowStyle}
              value={this.state.name}
              onChange={e => {
                this.setState({ name: e.target.value });
              }}
            />
          </FormItem>
          <FormItem {...formItemLayout} label="Тип">
            <Select
              defaultValue="brain.js"
              style={rowStyle}
              onChange={e => {
                this.setState({ type: e });
              }}
            >
              <Option value="brain.js">Стандартный</Option>
              <Option value="video" disabled>
                video (experimental)
              </Option>
            </Select>
          </FormItem>
          <FormItem {...formItemLayout} label="Тип">
            <Select
              defaultValue="leaky-relu"
              style={rowStyle}
              onChange={e => {
                this.setState({ activation: e });
              }}
            >
              <Option value="leaky-relu">leaky-relu</Option>
              <Option value="sigmoid"> sigmoid </Option>
              <Option value="relu"> relu </Option>
              <Option value="tanh"> tanh </Option>
            </Select>
          </FormItem>

          <FormItem {...formItemLayout} label="Входов">
            <InputNumber
              style={rowStyle}
              min={3}
              step={1}
              value={this.state.input}
              onChange={e => {
                this.setState({ input: e });
              }}
            />
          </FormItem>
          <FormItem {...formItemLayout} label="Скрытые слои">
            {this.state.hidden.map((tag, index) => {
              const isLongTag = tag.length > 20;
              return (
                <Tag
                  closable
                  key={index}
                  afterClose={() => {
                    this.state.hidden.splice(index, 1);
                    this.forceUpdate();
                  }}
                >
                  {tag}
                </Tag>
              );
            })}
            {this.state.inputVisible && (
              <div>
                <InputNumber
                  min={3}
                  step={1}
                  style={{ width: 78 }}
                  value={this.state.inputValue}
                  onChange={e => {
                    this.setState({ inputValue: e });
                  }}
                  onPressEnter={this.handleInputConfirm}
                />
                <Button icon="save" onClick={this.handleInputConfirm} />
              </div>
            )}

            <Tag
              onClick={() => {
                this.setState({ inputVisible: true });
              }}
              style={{ borderStyle: "dashed" }}
            >
              <Icon type="plus" /> Добавить слой
            </Tag>
          </FormItem>
          <FormItem {...formItemLayout} label="Выходов">
            <InputNumber
              style={rowStyle}
              min={3}
              step={1}
              value={this.state.output}
              onChange={e => {
                this.setState({ output: e });
              }}
            />
          </FormItem>
          <FormItem {...formItemLayout} label="Интервал входов и выходов, сек.">
            <InputNumber
              style={rowStyle}
              min={3}
              step={1}
              value={this.state.interval}
              onChange={e => {
                this.setState({ interval: e });
              }}
            />
          </FormItem>

          <FormItem {...formItemLayout} label=":">
            <Button
              type="primary"
              icon="plus"
              style={rowStyle}
              onClick={() => {
                this.setState({ loading: true });
                socket.emit(
                  "createNew",
                  {
                    ...this.state,
                    inputVisible: undefined,
                    inputValue: undefined
                  },
                  err => {
                    if (err) {
                      message.error(err.message || err.errmsg);
                    } else {
                      message.success("Сеть успешно создана");
                    }
                    this.setState({ loading: false });
                  }
                );
              }}
            >
              Создать новую
            </Button>
          </FormItem>
        </Form>
      </div>
    );
  }
}

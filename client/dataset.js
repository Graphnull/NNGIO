import React, { Component } from "react";
import { rowStyle, formItemLayout } from "./helper";
import { Input, Button, Form, Checkbox, Card, InputNumber, Select, message, Tag, Icon } from "antd";
import Spin from "./spiner";
const FormItem = Form.Item;
const Option = Select.Option;
export default class CreateNew extends Component {
  state = {
    name: "",
    type: "image"
  };
  render() {
    return (
      <div>
        <Form>
          <FormItem {...formItemLayout}>
            <h2 style={{ width: "100%", textAlign: "center" }}>Создание нового датасета</h2>
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
              defaultValue="image"
              style={rowStyle}
              onChange={e => {
                this.setState({ type: e });
              }}
            >
              <Option value="image">Независимые друг от друга изображения</Option>
              <Option value="line">Временная последовательность данных</Option>
            </Select>
          </FormItem>
          <FormItem {...formItemLayout} label=":">
            <Button
              type="primary"
              icon="plus"
              style={rowStyle}
              onClick={() => {
                this.setState({ loading: true });
                socket.emit(
                  "dataset/createNew",
                  {
                    ...this.state,
                    loading: undefined
                  },
                  err => {
                    if (err) {
                      message.error(err.message || err.errmsg);
                    } else {
                      message.success("Датасет успешно создан");
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

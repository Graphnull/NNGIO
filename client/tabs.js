import React, { Component } from "react";
import ReactDOM from "react-dom";
import { DatePicker, Input, Button, Card, InputNumber, Row, Col, message, Divider, Tabs } from "antd";
import socket from "./socket";
import { Chart, Axis, Tooltip, Geom } from "bizcharts";
const TabPane = Tabs.TabPane;

export default class TabsMenu extends Component {
  state = {
    data: [],
    loading: false
  };
  render() {
    return (
      <Tabs type="card">
        <TabPane tab="Tab Title 1" key="1">
          <div>
            <Button
              onClick={() => {
                this.setState({ loading: true });
                var temp = socket.emit("activate", { name: this.props.name }, (err, data) => {
                  if (err) {
                    message.error(err.message);
                    this.setState({ loading: false });
                  } else {
                    this.setState({
                      data: data.map(item => {
                        if (item.name === "prog") {
                          item.value = item.value * 10000 + 5000;
                          return item;
                        } else {
                          return item;
                        }
                      }), //.filter((i)=>i.date>(Date.now()-500000))
                      loading: false
                    });
                  }
                });
                console.log(temp);
              }}
            >
              Активировать
            </Button>
          </div>
          <div>
            <Chart height={400} data={this.state.data} style={{ width: "100%" }} forceFit>
              <Axis name="date" />
              <Axis name="value" />
              <Tooltip crosshairs={{ type: "y" }} />
              <Geom type="line" position="date*value" size={2} color={"name"} />
              <Geom type="point" position="date*value" size={4} color={"name"} />
            </Chart>
          </div>
        </TabPane>
      </Tabs>
    );
  }
}

import React, { Component } from "react";
import ReactDOM from "react-dom";
import { DatePicker, Input, Button, Card, InputNumber, Row, Col, message, Divider, Tabs, Slider } from "antd";
import socket from "./socket";
import { Chart, Axis, Tooltip, Geom } from "bizcharts";
import moment from "moment";
import Spin from "./spiner";
const TabPane = Tabs.TabPane;

export default class TabsMenu extends Component {
  state = {
    data: [],
    startValue: 0,
    endValue: Date.now() + 1000 * 60 * 120,
    loading: false
  };
  min = Date.now();
  changeLoading = () => {
    this.setState({ loading: !this.state.loading });
  };

  render() {
    return (
      <div style={{ position: "relative" }}>
        {this.state.loading && <Spin delete={this.changeLoading} />}
        <Tabs type="card">
          <TabPane tab="Датасет" key="1">
            <div>
              <Button
                type="primary"
                icon="play-circle"
                onClick={() => {
                  this.setState({ loading: true });
                  var temp = socket.emit("activate", { name: this.props.name }, (err, data) => {
                    if (err) {
                      message.error(err.message);
                      this.setState({ loading: false });
                    } else {
                      this.setState({
                        data: data.map(item => {
                          if (item.name !== "BTC") {
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
                }}
              >
                Активировать
              </Button>
            </div>
            {this.state.data.length && (
              <Card>
                <Chart
                  height={400}
                  data={this.state.data.filter(i => {
                    if (i.date < this.min) {
                      this.min = i.date;
                    }

                    return i.date > this.state.startValue && i.date < this.state.endValue;
                  })}
                  style={{ width: "100%" }}
                  forceFit
                >
                  <Axis label={{ textStyle: { fill: "#ff7f77" }, formatter: e => moment(parseInt(e, 10)).fromNow() }} name="date" />
                  <Axis label={{ textStyle: { fill: "#ff7f77" } }} name="value" />
                  <Tooltip crosshairs={{ type: "y" }} />
                  <Geom type="line" position="date*value" size={2} color={"name"} />
                </Chart>
                {this.state.data[0].date}
                <Slider
                  range
                  min={this.min}
                  max={Date.now() + 1000 * 60 * 120}
                  value={[this.state.startValue, this.state.endValue]}
                  onChange={e => {
                    this.setState({ startValue: e[0], endValue: e[1] });
                  }}
                />
              </Card>
            )}
          </TabPane>
        </Tabs>
      </div>
    );
  }
}

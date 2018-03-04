import React, { Component } from "react";
import { Button, Spin } from "antd";
import bgload from "./bgload.png";

class Spiner extends Component {
  state = { afterTimeout: false };
  componentDidMount() {
    setTimeout(() => {
      this.setState({ afterTimeout: true });
    }, 5000);
  }
  render() {
    return (
      <div
        className="spin"
        style={{
          position: "absolute",
          backgroundPosition: "center",
          backgroundImage: "url(" + bgload + ")",
          width: "100%",
          height: "100%",
          zIndex: "9900",

          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {this.props.text && <h1>{this.props.text}</h1>}
        {this.state.afterTimeout && this.props.delete && <Button onClick={this.props.delete}>Закрыть</Button>}
        <Spin />
      </div>
    );
  }
}
export default Spiner;

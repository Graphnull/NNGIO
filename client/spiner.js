import React, { Component } from "react";
import { Spin } from "antd";

const Spiner = () => {
  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: "9900", background: "#fff8", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <Spin />
    </div>
  );
};
export default Spiner;

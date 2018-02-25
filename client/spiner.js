import React, { Component } from "react";
import { Spin } from "antd";
import bgload from './bgload.png'

const Spiner = () => {
  return (
    <div 
    className="spin"
    style={{ position: "absolute",
    backgroundPosition: "center", 
    backgroundImage: "url(" + bgload + ")" ,
    width: "100%", 
    height: "100%", 
    zIndex: "9900", 

    display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <Spin  />
    </div>
  );
};
export default Spiner;

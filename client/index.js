import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { DatePicker,Button ,Slider} from 'antd';
import socket from './socket'
import {Chart, Axis, Tooltip, Geom} from "bizcharts";
import MenuN from './menu'


class App extends Component{

  state={
    data:[],
    hidden:4,
  }
  render(){
    return (
    <div style={{ margin: 100 }}>
      <MenuN/>
      <Button onClick={()=>{socket.emit('activate',{},(err,data)=>{
        this.setState({data:data.map((item)=>{
          if(item.name==='prog'){
            item.value=item.value*10000+5000
            return item
          }else{
            return item
          }
          
        })//.filter((i)=>i.date>(Date.now()-500000))
      });
      })}}>Активировать</Button>
      <Slider onAfterChange={(v)=>{
          socket.emit('learnRate',v/100)
          console.log(v/100)
      }}/>
      <Slider onChange={(v)=>{
        this.setState({hidden:v});
          console.log(v)
      }}/>
    <Slider onAfterChange={(v)=>{
          socket.emit('iters',v)
        console.log(v)
      }}/>
      
      <Chart height={400} data={this.state.data} forceFit>
        <Axis name="date" />
        <Axis name="value" />
        <Tooltip crosshairs={{type : "y"}} />
        <Geom type="line" position="date*value" size={2} color={'name'} />
        <Geom type='point' position="date*value" size={4} color={'name'} />
      </Chart>
      <Button onClick={()=>{
        socket.emit('createNew',{hidden:this.state.hidden},()=>{
  console.log('created')
})
}}>Создать новую</Button>
    </div>
  );
}
}

ReactDOM.render(<App />, document.getElementById('root'));

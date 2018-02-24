var brain =require('brain.js');
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var mongoose = require('mongoose');
var WebSocket = require('socket.io-client');
var moment =require('moment')
var fetch = require('isomorphic-fetch')

/*
var csocket=WebSocket.connect('wss://streamer.cryptocompare.com')

csocket.emit('SubAdd', { subs: ['0~Poloniex~BTC~USD'] } ); 

csocket.on('connect',()=>{console.log('connect')})

csocket.on('m',(data)=>{
    //var tradeField = data.substr(0, data.indexOf("~"))
    console.log(data)
})*/


mongoose.connect('mongodb://localhost:27017');

const Net = mongoose.model('net', { 
    name: String,
    type:String,
    data:Buffer,
    createdAt:Date,
});





function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
  
      res.writeHead(200);
      res.end(data);
    });
  }
  
app.listen(3080);

setInterval(()=>{

    Object.keys(nets).forEach((net)=>{
try{
    var newNet=Net({name:net,
        data:Buffer.from(JSON.stringify(nets[net].toJSON()),'utf8'),
    createdAt:Date.now()})
   
    newNet.save().then(()=>{console.log(`Сеть ${net} успешно сохранена`)}).catch(err=>{console.error(err)})
 }catch(e){
        console.error(e)
    }
    })
    

},60000)
var nets={}
var data=[]
var dataset={}
var lastValue=null
var timeInterval=8000;
var iters=10000;
var inputSize=10;
var outputSize=20;
var normalize=10000
function getArr(time,data) {
    if(data&&data[0].date<Date.now()-timeInterval*(inputSize+outputSize)-timeInterval*3){
    let arr = [];
    for (var i = time - timeInterval / 2; i > time - (inputSize + outputSize) * timeInterval; i -= timeInterval) {
      var maxP;
      var maxPt;
      var minP;
      var minPt;
      for (var ind = data.length - 1; ind > 0; ind--) {
          //console.log(data[ind].value, data[ind].timestamp);
          if (data[ind].date > i) {
            maxP = data[ind].value;

            maxPt = data[ind].date;
          } else {
            minP = data[ind].value;
            minPt = data[ind].date;
            break;
          }
        
      }

      var v = minP * (1.0 - (i - minPt) / (i - minPt + maxPt - i)) + maxP * (1.0 - (maxPt - i) / (i - minPt + maxPt - i));
      arr.push( (v-5000)/normalize );
    }
    return arr.reverse();
}else{
    return null
}
  }

setInterval(()=>{
    fetch('https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC&tsyms=USD').then((res)=>{
    return res.json()
    }).then((d)=>{
        if(lastValue!==d.BTC.USD){
        data.push({value:d.BTC.USD,date:Date.now()})
        //console.log(d)
        
            var temp =getArr(data[data.length-1].date-timeInterval/2,data)

            if(temp&&temp.filter(t=>isNaN(t)).length<1){
                if(!dataset.hasOwnProperty('test')){
                    dataset['test']=[]
                }
                dataset['test'].push({input:temp.slice(0,inputSize),output:temp.slice(-outputSize)})
            }else{
                console.log("неподходящие данные")
            }
            //console.log(data)
        
        console.log(data&&Date.now()-timeInterval*(inputSize+outputSize)-data[0].date)
        }
        lastValue=d.BTC.USD
    }).catch(err=>{
        console.error(err)
    })
    },2000)

    var learnRate=0.3;
    
io.on('connection', function (socket) {
    socket.on('learnRate',(rate)=>{
        learnRate=rate

    })
    socket.on('iters',(int)=>{
        iters=int*100

    })
    socket.on('activate',(opt,cb)=>{
        try{
        var input=getArr(data[data.length-1].date-timeInterval/2,data)
         console.log(input)
        if(input&& nets['test']){
            

            var temprun=nets['test'].run(input.slice(-inputSize))
            var temp=temprun.reverse().map((item,i)=>{return{name:'prog',
            date:data[data.length-1].date+(i*timeInterval),
            value:item
        }})
        temp=temp.concat(data.map((item)=>{return{name:'BTC USD',date:item.date,value:item.value}}))
        cb(null,temp)
        }
    }catch(e){
        console.error(e)

    }

        
    })
    socket.on('createNew',(opt,cb)=>{
        var net = new brain.NeuralNetwork({
            activation: 'sigmoid',
            hiddenLayers: [opt.hidden],
            learningRate: 0.6});
            nets['test']=net


        if(cb){
            cb(null)
        }
    })
    socket.on('dataset',(opt,cb)=>{
        
        if(!Array.isArray(dataset[opt.net])){
            dataset[opt.net]=[];
        }
        dataset[opt.net].push({input:opt.input,output:opt.output})
        if(cb){
            cb(null)
        }
    })




  });

  function infTrain(){
  var promises=[]
  
  Object.keys(nets).forEach((net)=>{
    
    if(dataset.hasOwnProperty(net)){
        
    promises.push(new Promise((resolve, reject)=>{
        nets[net].train(dataset[net],{
        iterations:iters,
        errorThresh: 0.0000000005, 
      log: true,           
      logPeriod: 1000,        
      learningRate: learnRate,    
      momentum: 0.1,        
      callback: null,       
      callbackPeriod: 10,   
      timeout: Infinity 
    })
    resolve()
}))
    }

  })
 

  if(promises.length){
  Promise
    .all(promises)
    .then(values => {

      //console.log('promises.length',promises.length);

      setTimeout(infTrain,10)

    })
    .catch((err)=>{
        console.log(err)
    });
    
}else{
    setTimeout(infTrain,1000)
}
  }
  infTrain()


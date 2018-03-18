__kernel void kernel multiple(  __global float* bufferIn,  __global float* bufferOut , __global float* bufferW, __constant int* layerInfo){
 
 int idx = get_global_id(0);


//substract for float
/*
float out=bufferOut[idx];
for(size_t x=0;x!=(layerInfo[0]); x++){
        
        out+=distance(bufferIn[x],bufferW[idx*layerInfo[0]+x]);

}
bufferOut[idx]=out;
*/
//multiple for float

float out=0.0;
for(size_t x=0;x!=(layerInfo[0]); x++){
        
        out+=bufferIn[x]*bufferW[idx*layerInfo[0]+x];

}
bufferOut[idx]=out;


//multiple
/*
        float16 out=bufferOut[idx];
        for(size_t x=0;x!=(layerInfo[0]); x++){
                
                out+=(float16)(bufferIn[x])*(float16)(
                bufferW[x+(idx*16)*(layerInfo[0])],
                bufferW[x+(idx*16+1)*(layerInfo[0])],
                bufferW[x+(idx*16+2)*(layerInfo[0])],
                bufferW[x+(idx*16+3)*(layerInfo[0])],
                bufferW[x+(idx*16+4)*(layerInfo[0])],
                bufferW[x+(idx*16+5)*(layerInfo[0])],
                bufferW[x+(idx*16+6)*(layerInfo[0])],
                bufferW[x+(idx*16+7)*(layerInfo[0])],
                bufferW[x+(idx*16+8)*(layerInfo[0])],
                bufferW[x+(idx*16+9)*(layerInfo[0])],
                bufferW[x+(idx*16+10)*(layerInfo[0])],
                bufferW[x+(idx*16+11)*(layerInfo[0])],
                bufferW[x+(idx*16+12)*(layerInfo[0])],
                bufferW[x+(idx*16+13)*(layerInfo[0])],
                bufferW[x+(idx*16+14)*(layerInfo[0])],
                bufferW[x+(idx*16+15)*(layerInfo[0])]
                
                );
        }
        bufferOut[idx]=out;
*/
}


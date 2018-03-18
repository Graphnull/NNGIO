__kernel void kernel activateClassification( __global float* bufferIn,  __global float* bufferW,__global float* bufferOut , __global int* layerInfo){

 int idx = get_global_id(0);
int layerWidth=layerInfo[0];

//substract for float
double out=0;
for(size_t x=0;x!=layerWidth; x++){
        
        out+=fabs(bufferIn[x]-bufferW[idx*layerWidth+x]);
        //printf(" %f %f   __-",bufferIn[x],bufferW[idx*layerWidth+x]);
}

bufferOut[idx]=(float)(out/layerWidth);


}


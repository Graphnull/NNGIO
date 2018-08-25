__kernel void kernel backError( __global float* errorMap,__global float* bufferWL,  __global float* errorL, __global int* layerInfo){




int selfWidth=layerInfo[1];
int layerWidth=layerInfo[0];


errorMap[get_global_id(0)]=0.0;


  for(size_t x=0;x!=layerWidth; x++){

    errorMap[get_global_id(0)]+=fabs(errorL[x]*bufferWL[get_global_id(0)+x*selfWidth]);

  }




// if(get_global_id(0)==0)
// printf("=%f %f \n", bufferV[get_global_id(0)],bufferW[get_global_id(0)] );
}

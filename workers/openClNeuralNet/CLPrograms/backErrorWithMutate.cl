__kernel void kernel backErrorWithMutate( __global float* errorMap,__global float* bufferW, __global float* bufferChange, __global float* errorL, __global int* layerInfo){

//printf("hi");

int bufferWidth=layerInfo[0];


float err=0.0;
int selfwidth=layerInfo[4];
int layerWidth=layerInfo[3];
//printf("hh");
  for(size_t x=0;x!=layerWidth; x++){

    err+=fabs(errorL[x]*bufferW[get_global_id(0)+x*selfwidth]);

  }

  //printf("%f %f \n",err,errorMap[get_global_id(0)]);
  //printf("%f ",bufferWidth*1.0);
int x=get_global_id(0)* bufferWidth+fmod((get_global_id(0) *43758.5453+layerInfo[1]),bufferWidth*1.0);


  if((err)<errorMap[get_global_id(0)] ){
  
      if(layerInfo[2]>0){

      bufferChange[x]=bufferChange[x]-0.001+fabs(err)*0.0101;
      }else{

      bufferChange[x]=bufferChange[x]+0.001-fabs(err)*0.0101;
      }

  }else{
    if(layerInfo[2]>0){

      bufferChange[x]=bufferChange[x]-0.001;
    }else{

      bufferChange[x]=bufferChange[x]+0.001;
    }
    if(err==errorMap[get_global_id(0)]){
    //bufferChange[x]+=fmod((get_global_id(0) *43758.5453+layerInfo[1]),0.0002)-0.0001;
    }

  }

// if(get_global_id(0)==0)
// printf("=%f %f \n", bufferV[get_global_id(0)],bufferW[get_global_id(0)] );
}

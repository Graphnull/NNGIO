__kernel void kernel mutateWithValue( __global float* bufferIn,__global float* bufferOut, __global float* bufferError,__global float* bufferTemp,__global float* bufferW,  __global int* layerInfo){

//setErrorValue в module.cc
 float err=fabs(bufferIn[0]-bufferOut[get_global_id(0)])*0.10;

  int bufferWidth=layerInfo[0];

//modf(get_global_id(0) * 43758.5453+layerInfo[1]),bufferWidth)
//printf("%f %i _",floor(fabs(sin(get_global_id(0) *43758.5453)*bufferWidth)),bufferWidth);
int x=get_global_id(0)* bufferWidth+fmod((get_global_id(0) *43758.5453+layerInfo[1]),bufferWidth*1.0);


if((err)<bufferError[get_global_id(0)] ){
      //printf("%f ", bufferW[x]-0.0001+fabs(err)*0.1);
      //printf(" !%f ",err);

      if(layerInfo[2]>0){

      bufferW[x]=bufferW[x]-0.001+fabs(err)*0.0101;
      }else{

      bufferW[x]=bufferW[x]+0.001-fabs(err)*0.0101;
      }

}else{

//printf(" _%f ",err);
      if(layerInfo[2]>0){

      bufferW[x]=bufferW[x]-0.001;
      }else{

      bufferW[x]=bufferW[x]+0.001;
      }
    if(err==bufferError[get_global_id(0)]){
    bufferW[x]+=fmod((get_global_id(0) *43758.5453+layerInfo[1]),0.0002)-0.0001;
    }
}

}

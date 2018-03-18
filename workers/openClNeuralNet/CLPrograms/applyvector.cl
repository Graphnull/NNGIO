__kernel void kernel applyvector( __global float* bufferTemp,__global float* bufferW,  __global int* layerInfo){

//size_t bufferWidth=layerInfo[6];
//if( bufferA[get_global_id(0)]<0.0){
//const size_t pos=get_global_id(0)+get_global_id(1)*bufferWidth;

//printf("_%f ", bufferW[get_global_id(0)]);
  int bufferWidth=layerInfo[0];
  //printf("%f ",fmod((get_global_id(0) *43758.5453+layerInfo[1]),get_global_size(0)*1.0));

  int x=get_global_id(0)* bufferWidth+fmod((get_global_id(0) *43758.5453+layerInfo[1]),bufferWidth*1.0);
//bufferTemp[x]=bufferW[x];
if(layerInfo[2]>0){
 bufferW[x]+= 0.001;
} else{
  bufferW[x]-= 0.001;
}
// if(get_global_id(0)==0)
// printf("=%f %f \n", bufferV[get_global_id(0)],bufferW[get_global_id(0)] );
}

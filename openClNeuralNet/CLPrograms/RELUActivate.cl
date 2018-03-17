__kernel void kernel RELUActivate( __global float* bufferA){


  //RELU
  if(bufferA[get_global_id(0)]<0.0){
  bufferA[get_global_id(0)]=-bufferA[get_global_id(0)];//(exp(bufferA[get_global_id(0)])-1.0)*0.8;
  
  }
  /*
  for(int i=0;i!=16;i++){
  if(bufferA[get_global_id(0)][i]<0.0){
  bufferA[get_global_id(0)][i]=0.0;
  }
  }*/
  
   //bufferA[get_global_id(0)]= bufferA[get_global_id(0)]/(1.0f+(fabs(bufferA[get_global_id(0)])));
  }
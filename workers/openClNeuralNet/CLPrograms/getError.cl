__kernel void kernel getError( __global float16* bufferIn, __global float16* bufferOut, __global float16* bufferError){

bufferError[get_global_id(0)]=fabs(bufferIn[get_global_id(0)]-bufferOut[get_global_id(0)])*fabs(bufferIn[get_global_id(0)]-bufferOut[get_global_id(0)]);


}

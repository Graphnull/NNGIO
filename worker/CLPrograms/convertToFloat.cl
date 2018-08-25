
__kernel void kernel convertToFloat(__global float* bufferA, __global unsigned char* bufferInput){

	
bufferA[get_global_id(0)]=bufferInput[get_global_id(0)]/256.0;//(((bufferInput[get_global_id(0)*3]+bufferInput[get_global_id(0)*3+1]+bufferInput[get_global_id(0)*3+2])/768.0));

}

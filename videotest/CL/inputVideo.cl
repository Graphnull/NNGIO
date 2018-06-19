
__kernel void kernel inputVideo(__global float* bufferA, __global unsigned char* buffer_videoInput){

	
bufferA[get_global_id(0)]=(((buffer_videoInput[get_global_id(0)*3]+buffer_videoInput[get_global_id(0)*3+1]+buffer_videoInput[get_global_id(0)*3+2])/768.0));

}

__kernel void kernel transf(__global float* bufferA, __global int* layerInfo){

size_t sx=layerInfo[0];
size_t tx=layerInfo[1];
size_t sy=layerInfo[2];
size_t ty=layerInfo[3];
size_t bufferWidth=layerInfo[4];
//printf("hi");

bufferA[get_global_id(0)*sx+get_global_id(1)*sy*bufferWidth]=(bufferA[get_global_id(0)*sx+get_global_id(1)*sy*bufferWidth]+bufferA[get_global_id(0)*sx+tx+(get_global_id(1)*sy+ty)*bufferWidth])/2.0;
bufferA[get_global_id(0)*sx+tx+(get_global_id(1)*sy+ty)*bufferWidth]=bufferA[get_global_id(0)*sx+get_global_id(1)*sy*bufferWidth]-bufferA[get_global_id(0)*sx+tx+(get_global_id(1)*sy+ty)*bufferWidth];

}
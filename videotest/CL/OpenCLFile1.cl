
__kernel void kernel simple_add(__global const unsigned char* A, __global unsigned char* background, __global unsigned char* C,__global float* weight, __global float* weight2){
	const int inp=8;
	const int inp2=32*18;
	const int inps=32*18*3;
	float aa=(A[get_global_id(0)*3]+A[get_global_id(0)*3+1]+A[get_global_id(0)*3+2])/768.0;
	float tempW = 0.0;
	float first=0.0;
	const float learrate=0.000001;
	float temp=0.0;
	float p=0.0;

	for (int i = 0; i < inp; i++) {
		temp = weight[get_global_id(0)*inp + i];
		tempW=0.0;
		for (int jb = 0; jb < inp; jb++) {
			tempW += A[get_global_id(0)+jb]/255.0 * weight[get_global_id(0)*inp + jb]+0.1 ;	
		}
		
		if(tempW<0.0) tempW=0.0;
		first = tempW;

		weight[get_global_id(0)*inp + i]+=learrate*fabs(first-aa);
		tempW=0.0;
		for (int jb = 0; jb < inp; jb++) {
			//p=A[jb]/255.0;
			tempW += A[get_global_id(0)+jb]/255.0 * weight[get_global_id(0)*inp + jb] ;
		}
		if(tempW<0.0) tempW=0.0;
							
		if (fabs(first - aa) <fabs(tempW - aa)) {
			weight[get_global_id(0)*inp + i] = temp - learrate*fabs(first - aa);
		}
	}



tempW=0.0;
for (int jb = 0; jb < inp; jb++) {
			
			tempW += A[get_global_id(0)+jb]/255.0 * weight[get_global_id(0)*inp + jb] ;
		}
if(tempW<0.0) tempW=0.0;

	//C[get_global_id(0)]=weight[get_global_id(0)]*255.0;
	C[get_global_id(0)]=weight[get_global_id(0)]*255.0;
}


__kernel void kernel input(__global unsigned char* A, __global unsigned char* C, __global float* B){
	//printf("%i \n", A[get_global_id(0)] );


			//C[get_global_id(0)] = fabs(B[get_global_id(0)]- ((A[get_global_id(0)*3]+A[get_global_id(0)*3+1]+A[get_global_id(0)*3+2])/3.0));
			C[get_global_id(0)] = fabs( ((A[get_global_id(0)*3]+A[get_global_id(0)*3+1]+A[get_global_id(0)*3+2])/3.0))+255.0;
			B[get_global_id(0)] = (A[get_global_id(0) * 3] + A[get_global_id(0) * 3 + 1] + A[get_global_id(0) * 3 + 2]) / 3.0+255.0;


}

import axios, { type AxiosInstance } from 'axios';

interface CreateJobResponse {
  jobId: string;
  hash: `0x${string}`;
  ethAddress: string;
}

export class LPClient {
  private axiosInstance: AxiosInstance;

  constructor(baseUrl: string) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createJob(params: { fuelAddress: string }): Promise<CreateJobResponse> {
    try {
      const response = await this.axiosInstance.post('/create_job', {
        fuelAddress: params.fuelAddress,
      });

      if (!response.data.jobId || !response.data.hash || !response.data.ethAddress) {
        throw new Error('Invalid response from LP client');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async queryJob(jobId: string) {
    try {
      const response = await this.axiosInstance.get(`/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error querying job:', error);
      throw error;
    }
  }

  async submitEthLock(jobId: string, ethLockHash: `0x${string}`) {
    try {
      const response = await this.axiosInstance.post(`/submit_eth_lock/${jobId}`, {
        ethLockHash,
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting ETH lock:', error);
      throw error;
    }
  }
}

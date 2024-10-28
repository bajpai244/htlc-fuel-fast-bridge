import axios, { type AxiosInstance } from 'axios';

interface CreateJobResponse {
  jobId: string;
  hash: `0x${string}`;
  ethAddress: string;
}

interface CreateJobParams {
  fuelAddress: string;
  ethereumExpiryBlockNumber: string;
}

interface SignatureData {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
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

  async createJob(params: CreateJobParams): Promise<CreateJobResponse> {
    try {
      const response = await this.axiosInstance.post('/create_job', {
        fuelAddress: params.fuelAddress,
        ethereumExpiryBlockNumber: params.ethereumExpiryBlockNumber,
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

  async revealHash(jobId: string, signature: SignatureData) {
    try {
      const response = await this.axiosInstance.post(`/revealHash/${jobId}`, {
        signature,
      });
      return response.data;
    } catch (error) {
      console.error('Error revealing hash:', error);
      throw error;
    }
  }
}

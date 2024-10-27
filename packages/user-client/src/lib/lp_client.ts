import axios, { type AxiosInstance } from 'axios';
import type { JobData } from '../../../lp-client/src/database';

export class LPClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000, // 10 seconds timeout
    });
  }

  async createJob(arg: { fuelAddress: string }) {
    const { fuelAddress } = arg;

    try {
      const response = await this.axiosInstance.post<{
        jobId: string;
        hash: string;
        ethAddress: string;
      }>('/create_job', {
        fuelAddress,
      });

      console.log('Job created:', response.data);
      return response.data;
    } catch (error) {
      this.handleError('Error creating job:', error);
      throw error;
    }
  }

  async queryJob(jobId: string): Promise<JobData> {
    try {
      const response = await this.axiosInstance.get<JobData>(`/job/${jobId}`);
      console.log('Job details:', response.data);
      return response.data;
    } catch (error) {
      this.handleError('Error querying job:', error);
      throw error;
    }
  }

  // Add more methods for other endpoints here
  // For example:
  // async updateJob(jobId: string, data: Partial<JobData>): Promise<JobData> { ... }
  // async deleteJob(jobId: string): Promise<void> { ... }

  private handleError(message: string, error: unknown): void {
    if (axios.isAxiosError(error)) {
      console.error(message, error.response?.data || error.message);
    } else {
      console.error(message, error);
    }
  }
}

type JobStatus = 'inProgress' | 'done';

export interface JobData {
  status: JobStatus;
  ethereum_lock_hash: string;
  fuel_lock_hash: string;
  expiry_block_ethereum: string;
  expiry_block_fuel: string;
  ethereum_transaction_hash: string;
  fuel_transaction_hash: string;
  hash: `0x${string}`;
  digest: Buffer;
  ethSenderAddress: string;
  ethDestinationAddress: string;
  fuelSenderAddress: string;
  fuelDestinationAddress: string;
}

export class InMemoryDatabase {
  private jobs: Map<string, JobData>;

  constructor() {
    this.jobs = new Map();
  }

  async insertJob(jobId: string, jobData: JobData): Promise<void> {
    this.jobs.set(jobId, jobData);
  }

  async getJob(jobId: string): Promise<JobData | null> {
    return this.jobs.get(jobId) || null;
  }

  async updateJob(jobId: string, updatedData: Partial<JobData>): Promise<void> {
    const existingJob = this.jobs.get(jobId);
    if (existingJob) {
      this.jobs.set(jobId, { ...existingJob, ...updatedData });
    }
  }

  async deleteJob(jobId: string): Promise<boolean> {
    return this.jobs.delete(jobId);
  }

  async getAllJobs(): Promise<Map<string, JobData>> {
    return new Map(this.jobs);
  }
}

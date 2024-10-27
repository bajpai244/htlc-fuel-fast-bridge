import { expect, test, describe, beforeEach } from 'bun:test';
import { InMemoryDatabase, type JobData } from '../src/database';

describe('InMemoryDatabase', () => {
  let db: InMemoryDatabase;
  const testJobId = 'test-job-id';
  const testJobData: JobData = {
    status: 'inProgress',
    ethereum_lock_hash: 'eth_hash',
    fuel_lock_hash: 'fuel_hash',
    expiry_block_ethereum: 'eth_expiry',
    expiry_block_fuel: 'fuel_expiry',
    ethereum_transaction_hash: 'eth_tx',
    fuel_transaction_hash: 'fuel_tx',
    hash: 'test_hash',
    digest: Buffer.from('test_digest'),
    // New fields
    ethSenderAddress: 'eth_sender',
    ethDestinationAddress: 'eth_destination',
    fuelSenderAddress: 'fuel_sender',
    fuelDestinationAddress: 'fuel_destination',
  };

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  test('insertJob should add a new job', async () => {
    await db.insertJob(testJobId, testJobData);
    const job = await db.getJob(testJobId);
    expect(job).toEqual(testJobData);
  });

  test('getJob should return null for non-existent job', async () => {
    const job = await db.getJob('non-existent-job');
    expect(job).toBeNull();
  });

  test('updateJob should modify an existing job', async () => {
    await db.insertJob(testJobId, testJobData);
    const updatedData: Partial<JobData> = {
      status: 'done',
      ethereum_transaction_hash: 'new_eth_tx',
      ethSenderAddress: 'new_eth_sender',
    };
    await db.updateJob(testJobId, updatedData);
    const job = await db.getJob(testJobId);
    expect(job).toEqual({ ...testJobData, ...updatedData });
  });

  test('deleteJob should remove a job', async () => {
    await db.insertJob(testJobId, testJobData);
    const deleted = await db.deleteJob(testJobId);
    expect(deleted).toBe(true);
    const job = await db.getJob(testJobId);
    expect(job).toBeNull();
  });

  test('getAllJobs should return all jobs', async () => {
    const jobId1 = 'job1';
    const jobId2 = 'job2';
    await db.insertJob(jobId1, testJobData);
    await db.insertJob(jobId2, { ...testJobData, status: 'done' });
    const allJobs = await db.getAllJobs();
    expect(allJobs.size).toBe(2);
    expect(allJobs.get(jobId1)).toEqual(testJobData);
    expect(allJobs.get(jobId2)).toEqual({ ...testJobData, status: 'done' });
  });
});

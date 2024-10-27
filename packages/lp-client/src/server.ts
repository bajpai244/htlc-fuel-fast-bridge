import express from 'express';
import dotenv from 'dotenv';
import { generateRandom32Bytes, generateRandom32BytesHex, sha256 } from './utils';
import { InMemoryDatabase, type JobData } from './database';
import { Wallet } from 'ethers';
import { ethWallet } from '../../user-client/src/config';
import { HTCLAbi } from '../../user-client/src/const';
import {
  ethereum as ethereumContractAddress,
  fuel as fuelContractAddress,
} from '../../deployer/deployments.json';
import { decodeFunctionResult, encodeFunctionData, encodeFunctionResult } from 'viem';

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

export const db = new InMemoryDatabase();

app.use(express.json());

app.get('/heartbeat', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/create_job', async (req, res) => {
  try {
    const { fuelAddress } = req.body;

    // Validate fuel address
    if (!fuelAddress || typeof fuelAddress !== 'string' || fuelAddress.trim() === '') {
      return res.status(400).json({ error: 'Valid fuel address is required' });
    }

    // Generate random Ethereum address
    const randomWallet = Wallet.createRandom();
    const ethAddress = randomWallet.address;

    const jobId = generateRandom32BytesHex();
    const digest = generateRandom32Bytes();
    const hash = sha256(digest);

    const initialJobData: JobData = {
      status: 'inProgress',
      ethereum_lock_hash: '',
      fuel_lock_hash: '',
      expiry_block_ethereum: '',
      expiry_block_fuel: '',
      ethereum_transaction_hash: '',
      fuel_transaction_hash: '',
      hash,
      digest,
      ethSenderAddress: '',
      ethDestinationAddress: ethAddress,
      fuelSenderAddress: '',
      fuelDestinationAddress: fuelAddress,
    };

    await db.insertJob(jobId, initialJobData);

    res.json({
      jobId,
      hash,
      ethAddress,
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/job/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await db.getJob(jobId);
    if (job) {
      // Exclude the digest field when sending the response
      const { digest, ...publicJobData } = job;
      res.json(publicJobData);
    } else {
      res.status(404).json({ error: 'Job not found' });
    }
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/submit_eth_lock/:jobId', async (req, res) => {
  const jobId = req.params.jobId;

  const job = await db.getJob(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Check if req.body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body is empty' });
  }

  const { ethLockHash } = req.body;

  if (!ethLockHash) {
    return res.status(400).json({ error: 'ethLockHash is required in request body' });
  }

  if (typeof ethLockHash !== 'string') {
    return res.status(400).json({ error: 'ethLockHash must be a string' });
  }

  if (!ethLockHash.startsWith('0x')) {
    return res.status(400).json({ error: 'ethLockHash must start with 0x' });
  }

  // check if lock exists
  const functionData = encodeFunctionData({
    abi: HTCLAbi,
    functionName: 'locks',
    args: [ethLockHash as `0x${string}`],
  });

  const getLockHashResult = (await ethWallet.call({
    to: ethereumContractAddress,
    data: functionData,
  })) as `0x${string}`;

  const lockHashExists = decodeFunctionResult({
    abi: HTCLAbi,
    functionName: 'locks',
    data: getLockHashResult,
  });

  if (lockHashExists !== 1) {
    return res.status(400).json({ error: 'Lock does not exist or is not in locked state' });
  }

  console.log('Lock hash:', ethLockHash, 'found');

  // Update job with ethereum lock hash
  await db.updateJob(jobId, {
    ethereum_lock_hash: ethLockHash,
  });

  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

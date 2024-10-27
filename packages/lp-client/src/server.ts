import express from 'express';
import dotenv from 'dotenv';
import { generateRandom32Bytes, generateRandom32BytesHex, sha256 } from './utils';
import { InMemoryDatabase, type JobData } from './database';
import { Wallet } from 'ethers';

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
      fuelSenderAddress: fuelAddress,
      fuelDestinationAddress: '',
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
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

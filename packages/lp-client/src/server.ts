import express from 'express';
import dotenv from 'dotenv';
import { generateRandom32Bytes, generateRandom32BytesHex, sha256 } from './utils';
import { InMemoryDatabase, type JobData } from './database';
import { Wallet } from 'ethers';
import { ethWallet, fuelContract, fuelWallet } from '../../user-client/src/config';
import { balance, fee, gasLimit, HTCLAbi } from '../../user-client/src/const';
import {
  ethereum as ethereumContractAddress,
  fuel as fuelContractAddress,
} from '../../deployer/deployments.json';
import { decodeFunctionResult, encodeFunctionData, encodeFunctionResult } from 'viem';
import type { LockInput } from '../../fuel/out/contracts/Contracts';
import { bn } from 'fuels';
import { BN } from '@fuel-ts/math';
import { Address } from 'fuels';

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
      fuelDestinationAddress: Address.fromString(fuelAddress).toB256(),
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

  // number of blocks for 1 hour of time to pass
  const ONE_HOUR = 1 * 60 * 60;

  // seet to 1 hour here
  const expiryTimeSeconds = (await fuelContract.provider.getBlockNumber()).add(ONE_HOUR);

  // lock for destination address on Fuel

  const fuelLock: LockInput = {
    token: { bits: fuelContract.provider.getBaseAssetId() },
    sender: {
      bits: fuelWallet.address.toB256(),
    },
    destination: {
      bits: job.fuelDestinationAddress,
    },
    hash: job.hash,
    expiryTimeSeconds,
    balance: bn(10),
    // balance: bn(balance.toString()).sub(bn(fee.toString())),
    fee: bn(0),
  };

  console.log('fuelLock', fuelLock);

  const { value: fuelLockHash } = await fuelContract.functions.compute_lock_hash(fuelLock).get();
  console.log('fuelLockHash:', fuelLockHash);

  // create the lock on the fuel side

  const { value, transactionResult } = await (
    await fuelContract.functions
      .time_lock(fuelLock)
      .callParams({
        forward: [fuelLock.balance, fuelLock.token.bits],
      })
      .txParams({
        gasLimit: gasLimit,
      })
      .call()
  ).waitForResult();

  console.log('result of doing the lock on fuel', value);

  const { value: fuelLockStatus } = await fuelContract.functions
    .get_lock_status(fuelLockHash)
    .get();
  console.log('fuel lock status', fuelLockStatus);

  if (fuelLockStatus !== 1) {
    throw new Error(`Invalid fuel lock status: ${fuelLockStatus}`);
  }

  // Update job with ethereum lock hash
  await db.updateJob(jobId, {
    ethereum_lock_hash: ethLockHash,
    fuel_lock_hash: fuelLockHash,
  });

  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

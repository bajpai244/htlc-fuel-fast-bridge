import express from 'express';
import dotenv from 'dotenv';
import { generateRandom32Bytes, generateRandom32BytesHex, getLpConfig, sha256 } from './utils';
import { InMemoryDatabase, type JobData } from './database';
import { Wallet, ZeroAddress } from 'ethers';
import { ethContract, ethWallet, fuelContract, fuelWallet } from '../../user-client/src/config';
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
import type { HTLC } from '../../ethereum/types';

import { envSchema } from './zod/index';

dotenv.config();

const { data: env, error: envSchemaParseError } = envSchema.safeParse(process.env);
if (envSchemaParseError) {
  console.error('❌: failed parsing environment scheme on process.env');
  console.error(envSchemaParseError);
  process.exit(1);
}

const lpConfig = getLpConfig();

const app = express();
app.use(express.json());

const port = env.PORT;

export const db = new InMemoryDatabase();

app.use(express.json());

app.get('/heartbeat', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/metadata', (req, res) => {});

app.post('/create_job', async (req, res) => {
  try {
    const { fuelAddress, ethereumExpiryBlockNumber } = req.body;

    // Validate fuel address
    if (!fuelAddress || typeof fuelAddress !== 'string' || fuelAddress.trim() === '') {
      return res.status(400).json({ error: 'Valid fuel address is required' });
    }

    // Validate ethereum expiry block number
    if (!ethereumExpiryBlockNumber) {
      return res.status(400).json({ error: 'Ethereum expiry block number is required' });
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
      expiry_block_ethereum: ethereumExpiryBlockNumber,
      expiry_block_fuel: '',
      ethereum_transaction_hash: '',
      fuel_transaction_hash: '',
      hash,
      digest,
      // TODO: this should come as apart of this API call
      ethSenderAddress: ethWallet.address,
      ethDestinationAddress: ethAddress,
      fuelSenderAddress: fuelWallet.address.toB256(),
      fuelDestinationAddress: Address.fromString(fuelAddress).toB256(),
    };

    await db.insertJob(jobId, initialJobData);

    console.log('ethereum LP destination address:', randomWallet.address, '\n\n');

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
  console.log('request to submit the ethereum lock from the user ...', '\n\n');

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

  console.log('Lock hash:', ethLockHash, 'found', '\n\n');

  // number of blocks for 1 hour of time to pass
  const ONE_HOUR = 1 * 60 * 60;

  // seet to 1 hour here
  const expiryTimeSeconds = (await fuelContract.provider.getBlockNumber()).add(ONE_HOUR);

  // lock for destination address on Fuel

  const fuelLock: LockInput = {
    token: { bits: fuelContract.provider.getBaseAssetId() },
    sender: {
      bits: job.fuelSenderAddress,
    },
    destination: {
      bits: job.fuelDestinationAddress,
    },
    hash: job.hash,
    expiryTimeSeconds,
    balance: bn((balance - fee).toString()).div(bn(10).pow(9)),
    // balance: bn(balance.toString()).sub(bn(fee.toString())),
    fee: bn(0),
  };

  console.log('locking the funds on Fuel ...', '\n\n');
  const { value: fuelLockHash } = await fuelContract.functions.compute_lock_hash(fuelLock).get();
  console.log('fuelLockHash:', fuelLockHash, '\n\n');

  // create the lock on the fuel side

  const fuelBalance = bn(fuelLock.balance).div(bn(10).pow(9));
  console.log('fuelBalance:', fuelBalance);

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

  console.log('funds locked on fuel ...', '\n\n');

  const { value: fuelLockStatus } = await fuelContract.functions
    .get_lock_status(fuelLockHash)
    .get();
  console.log('fuel lock status', fuelLockStatus, '\n\n');

  if (fuelLockStatus !== 1) {
    throw new Error(`Invalid fuel lock status: ${fuelLockStatus}`);
  }

  // Update job with ethereum lock hash
  await db.updateJob(jobId, {
    ethereum_lock_hash: ethLockHash,
    fuel_lock_hash: fuelLockHash,
    expiry_block_fuel: expiryTimeSeconds.toString(),
  });

  res.json({ success: true });
});

app.post('/revealHash/:jobId', async (req, res) => {
  console.log('user requested to reveal hash ...', '\n\n');
  const jobId = req.params.jobId;

  // Check if req.body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body is empty' });
  }

  // Validate required signature components
  const { signature } = req.body;

  if (!signature || !signature.v || !signature.r || !signature.s) {
    return res.status(400).json({
      error:
        'Missing required signature components. Please provide signature object with v, r and s values.',
    });
  }

  console.log('signature provided for the lock intent:', signature, '\n\n');

  const job = await db.getJob(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const { ethSenderAddress, ethDestinationAddress, hash, expiry_block_ethereum, digest } = job;

  const ethereumLockArg = {
    token: ZeroAddress as `0x${string}`,
    sender: ethSenderAddress as `0x${string}`,
    destination: ethDestinationAddress as `0x${string}`,
    hash,
    balance,
    fee,
    expiryTimeSeconds: BigInt(expiry_block_ethereum),
  };

  // Convert Buffer to hex string with 0x prefix
  const digestHex = `0x${digest.toString('hex')}` as `0x${string}`;

  const functionData = encodeFunctionData({
    abi: HTCLAbi,
    functionName: 'unlock',
    args: [ethereumLockArg, digestHex, signature],
  });

  console.log(
    'balance of eth destination before',
    await ethWallet.provider?.getBalance(ethDestinationAddress),
    '\n\n',
  );

  console.log('unlocking funds on Ethereum ....', '\n\n');

  const result = await (
    await ethWallet.sendTransaction({
      to: ethereumContractAddress,
      data: functionData,
    })
  ).wait();

  if (!result) {
    throw new Error('Transaction receipt is null');
  }

  if (result.status !== 1) {
    throw new Error('Transaction failed');
  }

  console.log('unlock complete', '\n\n');
  console.log('transaction id for ethereum unlocking:', result.hash);

  console.log(
    'balance of eth destination after',
    await ethWallet.provider?.getBalance(ethDestinationAddress),
    '\n\n',
  );

  res.send({
    success: true,
    digest: digest,
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`, '\n\n');
});

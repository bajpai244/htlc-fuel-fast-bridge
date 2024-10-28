import dotenv from 'dotenv';
import { Contract, ZeroAddress, ZeroHash } from 'ethers';

import { LPClient } from './lib/lp_client';

import { encodeFunctionData } from 'viem';
import { abi } from '../../ethereum/out/htcl.sol/HTLC.json';

import { fuelWallet, ethWallet, config, ethContract, fuelContract, ethProvider } from './config';
import { Wallet } from 'fuels';
import { parseEther } from 'ethers';
import type { HTLC } from '../../ethereum/types';
import { HTCLAbi, balance, fee } from './const';

const LP_CLIENT_URL = 'http://localhost:3000'; // Adjust this if your lp-client is running on a different port

dotenv.config();

async function main() {
  const lpClient = new LPClient(LP_CLIENT_URL);

  const fuelDestinationWallet = Wallet.generate();

  try {
    console.log('Fuel address:', fuelWallet.address.toString());
    console.log('Ethereum address:', await ethWallet.getAddress());

    const currentBlock = await ethProvider.getBlockNumber();
    const expiryTimeSecondsEthereum = BigInt(currentBlock + 1000);

    console.log('Creating a new job...');
    const { jobId, hash, ethAddress } = await lpClient.createJob({
      fuelAddress: fuelDestinationWallet.address.toAddress(),
      ethereumExpiryBlockNumber: expiryTimeSecondsEthereum.toString(),
    });

    console.log('Querying the created job...');
    const jobData = await lpClient.queryJob(jobId);

    console.log('Job data:', jobData);

    const ethLockArg = {
      token: ZeroAddress as `0x${string}`,
      destination: ethAddress as `0x${string}`,
      sender: ethWallet.address as `0x${string}`,
      hash: jobData.hash,
      balance,
      fee,
      expiryTimeSeconds: expiryTimeSecondsEthereum,
    };

    const functionData = encodeFunctionData({
      abi: HTCLAbi,
      functionName: 'timelock',
      args: [ethLockArg],
    });

    const result = await ethWallet.sendTransaction({
      to: await ethContract.getAddress(),
      data: functionData,
      value: balance,
    });

    const transactionReceipt = await result.wait();
    if (!transactionReceipt) {
      throw new Error('Transaction receipt is null');
    }

    if (transactionReceipt.status === 0) {
      throw new Error('Transaction failed');
    }

    const { status, hash: ethereumTransactionHash } = transactionReceipt;
    if (status !== 1) {
      throw new Error('Transaction status is not successful');
    }

    console.log('Transaction status:', status);
    console.log('Transaction hash:', ethereumTransactionHash);

    const computeLockHashFunctionData = encodeFunctionData({
      abi: HTCLAbi,
      functionName: 'computeLockHash',
      args: [ethLockArg],
    });

    const ethLockHash = (await ethWallet.call({
      to: await ethContract.getAddress(),
      data: computeLockHashFunctionData,
    })) as `0x${string}`;

    console.log('ethLockHash', ethLockHash);

    // make call to submit the lock hash

    const submitEthLockResult = await lpClient.submitEthLock(jobId, ethLockHash);
    console.log('submitEthLockResult', submitEthLockResult);

    const { v, r, s } = ethWallet.signingKey.sign(ethLockHash);

    // make a call to get the digest
    await lpClient.revealHash(jobId, { v, r, s });

    console.log('ethereum lock arg', ethLockArg);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();

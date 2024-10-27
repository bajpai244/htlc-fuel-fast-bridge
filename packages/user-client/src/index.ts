import dotenv from 'dotenv';
import { Contract, ZeroAddress, ZeroHash } from 'ethers';

import { LPClient } from './lib/lp_client';

import { encodeFunctionData } from 'viem';
import { abi } from '../../ethereum/out/htcl.sol/HTLC.json';

import { fuelWallet, ethWallet, config, ethContract, fuelContract, ethProvider } from './config';
import { Wallet } from 'ethers';
import { parseEther } from 'ethers';
import type { HTLC } from '../../ethereum/types';
import { HTCLAbi } from './const';

const LP_CLIENT_URL = 'http://localhost:3000'; // Adjust this if your lp-client is running on a different port

dotenv.config();

async function main() {
  const lpClient = new LPClient(LP_CLIENT_URL);

  const destination = Wallet.createRandom();

  try {
    console.log('Fuel address:', fuelWallet.address.toString());
    console.log('Ethereum address:', await ethWallet.getAddress());

    console.log('Creating a new job...');
    const { jobId, hash, ethAddress } = await lpClient.createJob({
      fuelAddress: destination.address,
    });

    console.log('Querying the created job...');
    const jobData = await lpClient.queryJob(jobId);

    console.log('Job data:', jobData);

    const lock: HTLC.LockStruct = {
      token: ZeroAddress,
      sender: ethWallet.address,
      destination,
      hash: jobData.hash,
      balance: parseEther('0.000001'),
      expiryTimeSeconds: BigInt(10),
      fee: parseEther('0.0000000001'),
    };

    const currentBlock = await ethProvider.getBlockNumber();

    const balance = parseEther('0.00001');
    const fee = parseEther('0.000001');

    const functionData = encodeFunctionData({
      abi: HTCLAbi,
      functionName: 'timelock',
      args: [
        {
          token: ZeroAddress as `0x${string}`,
          destination: destination.address as `0x${string}`,
          sender: ethWallet.address as `0x${string}`,
          hash: jobData.hash,
          balance,
          fee,
          expiryTimeSeconds: BigInt(currentBlock + 1000),
        },
      ],
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

    console.log('result:', transactionReceipt);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();

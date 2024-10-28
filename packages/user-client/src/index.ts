import dotenv from 'dotenv';
import { Contract, ZeroAddress, ZeroHash } from 'ethers';

import { LPClient } from './lib/lp_client';

import { encodeFunctionData } from 'viem';
import { abi } from '../../ethereum/out/htcl.sol/HTLC.json';

import { fuelWallet, ethWallet, config, ethContract, fuelContract, ethProvider } from './config';
import { bn, Wallet } from 'fuels';
import { parseEther } from 'ethers';
import type { HTLC } from '../../ethereum/types';
import { HTCLAbi, balance, fee, gasLimit } from './const';
import type { LockInput } from '../../fuel/out/contracts/Contracts';
import type { JobData } from '../../lp-client/src/database';

const LP_CLIENT_URL = 'http://localhost:3000'; // Adjust this if your lp-client is running on a different port

dotenv.config();

async function main() {
  const lpClient = new LPClient(LP_CLIENT_URL);

  const fuelDestinationWallet = Wallet.generate();

  try {
    console.log(
      'fuel address, where funds need to be sent:',
      fuelDestinationWallet.address.toString(),
      '\n\n',
    );

    const currentBlock = await ethProvider.getBlockNumber();
    const expiryTimeSecondsEthereum = BigInt(currentBlock + 1000);

    console.log('Creating a new job...', '\n\n');
    const { jobId, hash, ethAddress } = await lpClient.createJob({
      fuelAddress: fuelDestinationWallet.address.toAddress(),
      ethereumExpiryBlockNumber: expiryTimeSecondsEthereum.toString(),
    });

    console.log('Querying the created job...', '\n\n');
    const jobData = await lpClient.queryJob(jobId);

    console.log('Job data:', jobData, '\n\n');

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

    console.log('locking funds on Ethereum ...');

    const resultLockEthereum = await ethWallet.sendTransaction({
      to: await ethContract.getAddress(),
      data: functionData,
      value: balance,
    });

    const transactionReceipt = await resultLockEthereum.wait();
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

    console.log('locking on ethereum succeed, status:', status, '\n\n');
    console.log('Transaction hash locking on Ethereum:', ethereumTransactionHash, '\n\n');

    const computeLockHashFunctionData = encodeFunctionData({
      abi: HTCLAbi,
      functionName: 'computeLockHash',
      args: [ethLockArg],
    });

    const ethLockHash = (await ethWallet.call({
      to: await ethContract.getAddress(),
      data: computeLockHashFunctionData,
    })) as `0x${string}`;

    console.log('ethLockHash', ethLockHash, '\n\n');

    // make call to submit the lock hash

    const submitEthLockResult = await lpClient.submitEthLock(jobId, ethLockHash);
    console.log('submitEthLockResult', submitEthLockResult, '\n\n');

    const { v, r, s } = ethWallet.signingKey.sign(ethLockHash);

    // make a call to get the digest
    console.log('going to make a call to reveal hash ..;', '\n\n');
    const revealHashResult = await lpClient.revealHash(jobId, { v, r, s });
    console.log('revealHashResult', revealHashResult, '\n\n');

    // Query job again to get updated status
    const updatedJob: JobData = await lpClient.queryJob(jobId);
    // make a call to Fuel, to get your funds back

    const fuelLock: LockInput = {
      token: {
        bits: fuelContract.provider.getBaseAssetId(),
      },
      sender: {
        bits: updatedJob.fuelSenderAddress,
      },
      destination: {
        bits: updatedJob.fuelDestinationAddress,
      },
      hash: updatedJob.hash,
      expiryTimeSeconds: updatedJob.expiry_block_fuel,
      balance: bn((balance - fee).toString()),
      fee: bn(0),
    };

    console.log(
      'fuel destination balance before:',
      await fuelContract.provider.getBalance(
        updatedJob.fuelDestinationAddress,
        fuelContract.provider.getBaseAssetId(),
      ),
      '\n\n',
    );

    console.log('going to unlock for destination on Fuel', '\n\n');

    const { transactionId } = await (
      await fuelContract.functions
        .unlock(fuelLock, revealHashResult.digest.data)
        .txParams({
          gasLimit: gasLimit,
        })
        .call()
    ).waitForResult();

    console.log('transaction id for unlock on fuel:', transactionId, '\n\n');

    console.log(
      'fuel destination balance after:',
      await fuelContract.provider.getBalance(
        updatedJob.fuelDestinationAddress,
        fuelContract.provider.getBaseAssetId(),
      ),
      '\n\n',
    );
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();

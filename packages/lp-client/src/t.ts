import express from 'express';
import dotenv from 'dotenv';
import { generateRandom32Bytes, generateRandom32BytesHex, sha256 } from './utils';
import { InMemoryDatabase, type JobData } from './database';
import { Wallet } from 'ethers';
import { ethWallet, fuelContract, fuelWallet } from '../../user-client/src/config';
import { balance, fee, HTCLAbi } from '../../user-client/src/const';
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

const main = async () => {
  const fuelProvider = fuelContract.provider;

  // number of blocks for 1 hour of time to pass
  const ONE_HOUR = 1 * 60 * 60;

  // seet to 1 hour here
  const expiryTimeSeconds = (await fuelContract.provider.getBlockNumber()).add(ONE_HOUR);

  const fuelLock: LockInput = {
    token: { bits: fuelContract.provider.getBaseAssetId() },
    sender: {
      bits: fuelWallet.address.toB256(),
    },
    destination: {
      bits: fuelWallet.address.toB256(),
    },
    hash: sha256(generateRandom32Bytes()),
    expiryTimeSeconds,
    balance: bn(10),
    // balance: bn(balance.toString()).sub(bn(fee.toString())),
    fee: bn(0),
  };

  const contractId = fuelContract.id.toB256();
  const contract = await fuelProvider.getContract(contractId);

  console.log('fuelLock', fuelLock);

  const { value: fuelLockHash } = await fuelContract.functions.compute_lock_hash(fuelLock).get();

  console.log('fuelLockHash:', fuelLockHash);
};

main();

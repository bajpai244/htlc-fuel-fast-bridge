import { expect, test, afterEach, describe } from 'bun:test';
import { launchTestNode } from 'fuels/test-utils';
import { execSync } from 'node:child_process';
import { ContractsFactory } from '../out/index';

import type { LockInput } from '../out/contracts/Contracts';
import { Address, bn, ErrorCode, sha256, toUtf8Bytes, ZeroBytes32 } from 'fuels';
import { sleep } from 'bun';

describe('HTCL tests', async () => {
  afterEach(() => {
    // launched.cleanup()
    try {
      execSync('killall fuel-core');
    } catch (error) {
      console.log('error in execution the command: `killall fuel-core`');
    }
  });

  test('test time lock fail, low balance', async () => {
    const launched = await launchTestNode({
      walletsConfig: {
        count: 5,
        assets: 1,
        amountPerCoin: 10000000,
      },
      contractsConfigs: [
        {
          factory: ContractsFactory,
          walletIndex: 0,
        },
      ],
    });

    const {
      wallets: [sender, destination],
      contracts: [contract],
    } = launched;

    const provider = sender.provider;

    const baseAssetId = provider.getBaseAssetId();
    const txGasLimit = provider.getGasConfig().maxGasPerTx.sub(100000);

    const secret = 'mysecret';
    const hash = sha256(toUtf8Bytes(secret));

    const amountToLock = bn(0);
    const fee = bn(0);

    // number of blocks for 1 hour of time to pass
    const ONE_HOUR = 1 * 60 * 60;

    // seet to 1 hour here
    const expiryTimeSeconds = (await provider.getBlockNumber()).add(ONE_HOUR);

    const lock: LockInput = {
      token: { bits: baseAssetId },
      sender: { bits: sender.address.toB256() },
      destination: { bits: destination.address.toB256() },
      hash,
      balance: amountToLock,
      expiryTimeSeconds,
      fee,
    };

    const { value: lockHash } = await contract.functions.compute_lock_hash(lock).get();
    console.log('lockHash: ', lockHash);

    const previousBalanceOfContract = await contract.getBalance(baseAssetId);
    console.log('previous balance of contract', previousBalanceOfContract);

    try {
      await contract.functions
        .time_lock(lock)
        .callParams({
          forward: [amountToLock, baseAssetId],
        })
        .txParams({
          gasLimit: txGasLimit,
        })
        .call();
    } catch (error) {
      expect(error.message).toBe(
        `The transaction reverted because a "require" statement has thrown "BalanceUnderflow".`,
      );
      expect(error.code).toBe(ErrorCode.SCRIPT_REVERTED);
    }
  });

  test('test time lock fail, fees overflow', async () => {
    const launched = await launchTestNode({
      walletsConfig: {
        count: 5,
        assets: 1,
        amountPerCoin: 10000000,
      },
      contractsConfigs: [
        {
          factory: ContractsFactory,
          walletIndex: 0,
        },
      ],
    });

    const {
      wallets: [sender, destination],
      contracts: [contract],
    } = launched;

    const provider = sender.provider;

    const baseAssetId = provider.getBaseAssetId();
    const txGasLimit = provider.getGasConfig().maxGasPerTx.sub(100000);

    const secret = 'mysecret';
    const hash = sha256(toUtf8Bytes(secret));

    const amountToLock = bn(1000);
    const fee = amountToLock.add(10);

    // number of blocks for 1 hour of time to pass
    const ONE_HOUR = 1 * 60 * 60;

    // seet to 1 hour here
    const expiryTimeSeconds = (await provider.getBlockNumber()).add(ONE_HOUR);

    const lock: LockInput = {
      token: { bits: baseAssetId },
      sender: { bits: sender.address.toB256() },
      destination: { bits: destination.address.toB256() },
      hash,
      balance: amountToLock,
      expiryTimeSeconds,
      fee,
    };

    const { value: lockHash } = await contract.functions.compute_lock_hash(lock).get();
    console.log('lockHash: ', lockHash);

    const previousBalanceOfContract = await contract.getBalance(baseAssetId);
    console.log('previous balance of contract', previousBalanceOfContract);

    try {
      await contract.functions
        .time_lock(lock)
        .callParams({
          forward: [amountToLock, baseAssetId],
        })
        .txParams({
          gasLimit: txGasLimit,
        })
        .call();
    } catch (error) {
      expect(error.message).toBe(
        `The transaction reverted because a "require" statement has thrown "FeeOverflow".`,
      );
      expect(error.code).toBe(ErrorCode.SCRIPT_REVERTED);
    }
  });

  test('test time lock fail, invalid destination', async () => {
    const launched = await launchTestNode({
      walletsConfig: {
        count: 5,
        assets: 1,
        amountPerCoin: 10000000,
      },
      contractsConfigs: [
        {
          factory: ContractsFactory,
          walletIndex: 0,
        },
      ],
    });

    const {
      wallets: [sender],
      contracts: [contract],
    } = launched;

    const provider = sender.provider;

    const baseAssetId = provider.getBaseAssetId();
    const txGasLimit = provider.getGasConfig().maxGasPerTx.sub(100000);

    const secret = 'mysecret';
    const hash = sha256(toUtf8Bytes(secret));

    const amountToLock = bn(1000);
    const fee = bn(10);

    // number of blocks for 1 hour of time to pass
    const ONE_HOUR = 1 * 60 * 60;

    // seet to 1 hour here
    const expiryTimeSeconds = (await provider.getBlockNumber()).add(ONE_HOUR);

    const lock: LockInput = {
      token: { bits: baseAssetId },
      sender: { bits: sender.address.toB256() },
      destination: { bits: ZeroBytes32 },
      hash,
      balance: amountToLock,
      expiryTimeSeconds,
      fee,
    };

    const { value: lockHash } = await contract.functions.compute_lock_hash(lock).get();
    console.log('lockHash: ', lockHash);

    const previousBalanceOfContract = await contract.getBalance(baseAssetId);
    console.log('previous balance of contract', previousBalanceOfContract);

    try {
      await contract.functions
        .time_lock(lock)
        .callParams({
          forward: [amountToLock, baseAssetId],
        })
        .txParams({
          gasLimit: txGasLimit,
        })
        .call();
    } catch (error) {
      expect(error.message).toBe(
        `The transaction reverted because a "require" statement has thrown "InvalidDestination".`,
      );
      expect(error.code).toBe(ErrorCode.SCRIPT_REVERTED);
    }
  });

  test('test time lock fail, release time underflow', async () => {
    const launched = await launchTestNode({
      walletsConfig: {
        count: 5,
        assets: 1,
        amountPerCoin: 10000000,
      },
      contractsConfigs: [
        {
          factory: ContractsFactory,
          walletIndex: 0,
        },
      ],
    });

    const {
      wallets: [sender, destination],
      contracts: [contract],
    } = launched;

    const provider = sender.provider;

    const baseAssetId = provider.getBaseAssetId();
    const txGasLimit = provider.getGasConfig().maxGasPerTx.sub(100000);

    const secret = 'mysecret';
    const hash = sha256(toUtf8Bytes(secret));

    const amountToLock = bn(1000);
    const fee = bn(10);

    // number of blocks for 1 hour of time to pass
    const ONE_HOUR = 1 * 60 * 60;

    // seet to 1 hour here
    const expiryTimeSeconds = bn(0);

    const lock: LockInput = {
      token: { bits: baseAssetId },
      sender: { bits: sender.address.toB256() },
      destination: { bits: destination.address.toB256() },
      hash,
      balance: amountToLock,
      expiryTimeSeconds,
      fee,
    };

    const { value: lockHash } = await contract.functions.compute_lock_hash(lock).get();
    console.log('lockHash: ', lockHash);

    const previousBalanceOfContract = await contract.getBalance(baseAssetId);
    console.log('previous balance of contract', previousBalanceOfContract);

    try {
      await contract.functions
        .time_lock(lock)
        .callParams({
          forward: [amountToLock, baseAssetId],
        })
        .txParams({
          gasLimit: txGasLimit,
        })
        .call();
    } catch (error) {
      expect(error.message).toBe(
        `The transaction reverted because a "require" statement has thrown "ReleaseTimeUnderflow".`,
      );
      expect(error.code).toBe(ErrorCode.SCRIPT_REVERTED);
    }
  });

  test('test time lock fail, wrong asset id passed', async () => {
    const launched = await launchTestNode({
      walletsConfig: {
        count: 5,
        assets: 1,
        amountPerCoin: 10000000,
      },
      contractsConfigs: [
        {
          factory: ContractsFactory,
          walletIndex: 0,
        },
      ],
    });

    const {
      wallets: [sender, destination],
      contracts: [contract],
    } = launched;

    const provider = sender.provider;

    const baseAssetId = provider.getBaseAssetId();

    const wrongAssetId = Address.fromRandom().toAssetId();

    const txGasLimit = provider.getGasConfig().maxGasPerTx.sub(100000);

    const secret = 'mysecret';
    const hash = sha256(toUtf8Bytes(secret));

    const amountToLock = bn(1000);
    const fee = bn(10);

    // number of blocks for 1 hour of time to pass
    const ONE_HOUR = 1 * 60 * 60;

    // seet to 1 hour here
    const expiryTimeSeconds = (await provider.getBlockNumber()).add(ONE_HOUR);

    const lock: LockInput = {
      token: { bits: wrongAssetId.bits },
      sender: { bits: sender.address.toB256() },
      destination: { bits: destination.address.toB256() },
      hash,
      balance: amountToLock,
      expiryTimeSeconds,
      fee,
    };

    const { value: lockHash } = await contract.functions.compute_lock_hash(lock).get();
    console.log('lockHash: ', lockHash);

    const previousBalanceOfContract = await contract.getBalance(baseAssetId);
    console.log('previous balance of contract', previousBalanceOfContract);

    try {
      await contract.functions
        .time_lock(lock)
        .callParams({
          forward: [amountToLock, baseAssetId],
        })
        .txParams({
          gasLimit: txGasLimit,
        })
        .call();
    } catch (error) {
      expect(error.message).toBe(
        `The transaction reverted because a "require" statement has thrown "IncorrectAssetId".`,
      );
      expect(error.code).toBe(ErrorCode.SCRIPT_REVERTED);
    }
  });

  test('test time lock fail, wrong amount passed', async () => {
    const launched = await launchTestNode({
      walletsConfig: {
        count: 5,
        assets: 1,
        amountPerCoin: 10000000,
      },
      contractsConfigs: [
        {
          factory: ContractsFactory,
          walletIndex: 0,
        },
      ],
    });

    const {
      wallets: [sender, destination],
      contracts: [contract],
    } = launched;

    const provider = sender.provider;

    const baseAssetId = provider.getBaseAssetId();

    const txGasLimit = provider.getGasConfig().maxGasPerTx.sub(100000);

    const secret = 'mysecret';
    const hash = sha256(toUtf8Bytes(secret));

    const amountToLock = bn(1000);
    const fee = bn(10);

    // number of blocks for 1 hour of time to pass
    const ONE_HOUR = 1 * 60 * 60;

    // seet to 1 hour here
    const expiryTimeSeconds = (await provider.getBlockNumber()).add(ONE_HOUR);

    const lock: LockInput = {
      token: { bits: baseAssetId },
      sender: { bits: sender.address.toB256() },
      destination: { bits: destination.address.toB256() },
      hash,
      balance: amountToLock.sub(100),
      expiryTimeSeconds,
      fee,
    };

    const { value: lockHash } = await contract.functions.compute_lock_hash(lock).get();
    console.log('lockHash: ', lockHash);

    const previousBalanceOfContract = await contract.getBalance(baseAssetId);
    console.log('previous balance of contract', previousBalanceOfContract);

    try {
      await contract.functions
        .time_lock(lock)
        .callParams({
          forward: [amountToLock, baseAssetId],
        })
        .txParams({
          gasLimit: txGasLimit,
        })
        .call();
    } catch (error) {
      expect(error.message).toBe(
        `The transaction reverted because a "require" statement has thrown "InvalidBalance".`,
      );
      expect(error.code).toBe(ErrorCode.SCRIPT_REVERTED);
    }
  });

  test('test time lock fail, lock already exists', async () => {
    const launched = await launchTestNode({
      walletsConfig: {
        count: 5,
        assets: 1,
        amountPerCoin: 10000000,
      },
      contractsConfigs: [
        {
          factory: ContractsFactory,
          walletIndex: 0,
        },
      ],
    });

    const secret = 'mysecret';
    const hash = sha256(toUtf8Bytes(secret));

    const amountToLock = bn(10000);
    const fee = bn(10);

    // number of blocks for 1 hour of time to pass
    const ONE_HOUR = 1 * 60 * 60;

    const {
      wallets: [sender, destination],
      contracts: [contract],
    } = launched;

    const provider = sender.provider;

    const baseAssetId = provider.getBaseAssetId();
    const txGasLimit = provider.getGasConfig().maxGasPerTx.sub(100000);

    // expressed in block time, block time 1 second
    // seet to 1 hour here
    const expiryTimeSeconds = (await provider.getBlockNumber()).add(ONE_HOUR);

    const lock: LockInput = {
      token: { bits: baseAssetId },
      sender: { bits: sender.address.toB256() },
      destination: { bits: destination.address.toB256() },
      hash,
      balance: amountToLock,
      expiryTimeSeconds,
      fee,
    };

    const { value: lockHash } = await contract.functions.compute_lock_hash(lock).get();
    console.log('lockHash: ', lockHash);

    const previousBalanceOfContract = await contract.getBalance(baseAssetId);
    console.log('previous balance of contract', previousBalanceOfContract);

    const { waitForResult } = await contract.functions
      .time_lock(lock)
      .callParams({
        forward: [amountToLock, baseAssetId],
      })
      .txParams({
        gasLimit: txGasLimit,
      })
      .call();

    const { value, transactionResult } = await waitForResult();

    try {
      await contract.functions
        .time_lock(lock)
        .callParams({
          forward: [amountToLock, baseAssetId],
        })
        .txParams({
          gasLimit: txGasLimit,
        })
        .call();
    } catch (error) {
      expect(error.message).toBe(
        `The transaction reverted because a "require" statement has thrown "LockAlreadyExist".`,
      );
      expect(error.code).toBe(ErrorCode.SCRIPT_REVERTED);
    }
  });

  test('test time lock pass, before expiry', async () => {
    const launched = await launchTestNode({
      walletsConfig: {
        count: 5,
        assets: 1,
        amountPerCoin: 10000000,
      },
      contractsConfigs: [
        {
          factory: ContractsFactory,
          walletIndex: 0,
        },
      ],
    });

    const secret = 'mysecret';
    const hash = sha256(toUtf8Bytes(secret));

    const amountToLock = bn(10000);
    const fee = bn(10);

    // number of blocks for 1 hour of time to pass
    const ONE_HOUR = 1 * 60 * 60;

    const {
      wallets: [sender, destination],
      contracts: [contract],
    } = launched;

    const provider = sender.provider;

    const baseAssetId = provider.getBaseAssetId();
    const txGasLimit = provider.getGasConfig().maxGasPerTx.sub(100000);

    // expressed in block time, block time 1 second
    // seet to 1 hour here
    const expiryTimeSeconds = (await provider.getBlockNumber()).add(ONE_HOUR);

    const lock: LockInput = {
      token: { bits: baseAssetId },
      sender: { bits: sender.address.toB256() },
      destination: { bits: destination.address.toB256() },
      hash,
      balance: amountToLock,
      expiryTimeSeconds,
      fee,
    };

    const { value: lockHash } = await contract.functions.compute_lock_hash(lock).get();
    console.log('lockHash: ', lockHash);

    const previousBalanceOfContract = await contract.getBalance(baseAssetId);
    console.log('previous balance of contract', previousBalanceOfContract);

    const { waitForResult } = await contract.functions
      .time_lock(lock)
      .callParams({
        forward: [amountToLock, baseAssetId],
      })
      .txParams({
        gasLimit: txGasLimit,
      })
      .call();

    const { value, transactionResult } = await waitForResult();

    // console.log('value:', value);
    // console.log('transaction result:', transactionResult.status);
    // console.log('transaction gasUsed:', transactionResult.gasUsed);

    const afterBalanceOfContract = await contract.getBalance(baseAssetId);
    // console.log('after balance of contract', afterBalanceOfContract)
    // console.log('difference in balance', afterBalanceOfContract.sub(previousBalanceOfContract));

    const contractBalanceDifference = afterBalanceOfContract.sub(previousBalanceOfContract);
    expect(contractBalanceDifference.eq(amountToLock), 'invalid contract balance change').toBeTrue;
  });

  // TODO: we need to add a testcases here once fee refunds are working
  // A test case for checking destination gets back the fee is neccessary as well
  // Although the bridge can work fine if only being used for deposit from Ethereum to Fuel { or some other chain to Fuel }
  test('test time unlock pass, after expiry', async () => {
    const launched = await launchTestNode({
      walletsConfig: {
        count: 5,
        assets: 1,
        amountPerCoin: 10000000,
      },
      contractsConfigs: [
        {
          factory: ContractsFactory,
          walletIndex: 0,
        },
      ],
    });

    const secret = 'mysecret';
    const secretBytes = toUtf8Bytes(secret);
    const hash = sha256(secretBytes);

    const amountToLock = bn(10000);
    const fee = bn(10);

    // number of blocks for 1 hour of time to pass
    const ONE_HOUR = 1 * 60 * 60;

    const {
      // NOTE: we making sender here the second wallet, so that we can easily assert that right amount is credited back
      // otherwise we would also have to take in account the gas charged
      // one solution is also to make the gasPrice zero for the node
      wallets: [deployer, sender, destination],
      contracts: [contract],
    } = launched;

    const provider = sender.provider;

    const baseAssetId = provider.getBaseAssetId();
    const txGasLimit = provider.getGasConfig().maxGasPerTx.sub(100000);

    // expressed in block time, block time 1 second
    // seet to 1 hour here
    const expiryTimeSeconds = (await provider.getBlockNumber()).add(100);

    const lock: LockInput = {
      token: { bits: baseAssetId },
      sender: { bits: sender.address.toB256() },
      destination: { bits: destination.address.toB256() },
      hash,
      balance: amountToLock,
      expiryTimeSeconds,
      fee,
    };

    const { value: lockHash } = await contract.functions.compute_lock_hash(lock).get();
    console.log('lockHash: ', lockHash);

    const previousBalanceOfContract = await contract.getBalance(baseAssetId);
    console.log('previous balance of contract', previousBalanceOfContract);

    await (
      await contract.functions
        .time_lock(lock)
        .callParams({
          forward: [amountToLock, baseAssetId],
        })
        .txParams({
          gasLimit: txGasLimit,
        })
        .call()
    ).waitForResult();

    // 1 second
    await sleep(1000);

    await provider.produceBlocks(expiryTimeSeconds.add(1).toNumber());

    console.log('block number', await provider.getBlockNumber());
    console.log('expiry', await expiryTimeSeconds);

    const previousBalanceSender = await sender.getBalance();

    const { value, gasUsed } = await (
      await contract.functions
        .unlock(lock, secretBytes)
        .txParams({
          gasLimit: txGasLimit,
        })
        .call()
    ).waitForResult();

    const afterBalanceDestination = await sender.getBalance();

    const differenceBalanceSender = afterBalanceDestination.sub(previousBalanceSender);

    expect(amountToLock.sub(fee).eq(differenceBalanceSender)).toBeTrue();
  });
});

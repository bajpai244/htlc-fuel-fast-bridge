import { expect, test,afterEach, afterAll , describe, beforeAll } from "bun:test";
import { launchTestNode } from "fuels/test-utils";
import {execSync} from "child_process"
import {ContractsFactory} from "../out/index"

import type {LockInput} from "../out/contracts/Contracts"
import { B256Coder, bn, BN, sha256, StringCoder, toUtf8Bytes } from "fuels";

describe('HTCL tests', async ( )=> {



afterEach(() => {
    // launched.cleanup()
    try {
    execSync('killall fuel-core');
    }
    catch(error) {
        console.log('error in execution the command: `killall fuel-core`');
    }
})

afterAll(async () => {
    // execSync('killall fuel-core');
})

test("test time lock pass", async () => {
    const launched = await launchTestNode({
        walletsConfig: {
            count: 5,
            assets: 1,
            amountPerCoin: 10000000,
        },
        contractsConfigs: [{
         factory: ContractsFactory,
         walletIndex: 0   
        }],
    });

    const secret = "mysecret";
    const hash = sha256(toUtf8Bytes(secret));

    const amountToLock = bn(10000);
    const fee= bn (10);
    
    // number of blocks for 1 hour of time to pass
    const ONE_HOUR = 1 * 60 * 60

    const {wallets: [sender, destination], contracts: [contract]}= launched;

    const provider = sender.provider;

    const baseAssetId = provider.getBaseAssetId();
    const txGasLimit = provider.getGasConfig().maxGasPerTx.sub(100000)

    // expressed in block time, block time 1 second
    // seet to 1 hour here
    const expiryTimeSeconds = (await provider.getBlockNumber()).add(ONE_HOUR);


    const lock: LockInput = {
        token: {bits: baseAssetId},   
        sender: {bits: sender.address.toB256()},
        destination: {bits: destination.address.toB256()},
        hash,
        balance: amountToLock,
        expiryTimeSeconds,
        fee
    };

    const {value: lockHash} = await contract.functions.compute_lock_hash(lock).get();
    console.log('lockHash: ', lockHash);

    const previousBalanceOfContract = await contract.getBalance(baseAssetId);
    console.log('previous balance of contract', previousBalanceOfContract )

    const {waitForResult} = await contract.functions.time_lock(lock).callParams({
        forward: [amountToLock, baseAssetId],
    }).txParams({
        gasLimit: txGasLimit
    }).call();

    const {value, transactionResult} = await waitForResult();

    // console.log('value:', value);
    // console.log('transaction result:', transactionResult.status);
    // console.log('transaction gasUsed:', transactionResult.gasUsed);

    const afterBalanceOfContract = await contract.getBalance(baseAssetId);
    // console.log('after balance of contract', afterBalanceOfContract)
    // console.log('difference in balance', afterBalanceOfContract.sub(previousBalanceOfContract));

    const contractBalanceDifference = afterBalanceOfContract.sub(previousBalanceOfContract);
    expect(contractBalanceDifference.eq(amountToLock), "invalid contract balance change").toBe(true);

});

// test("test compute lock hash 1", () => {
    
// });

})

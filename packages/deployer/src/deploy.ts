import { ethers } from 'ethers';
import { Wallet, Provider } from 'fuels';
import {ContractsFactory} from "../../fuel/out"

import dotenv from 'dotenv';
import {writeFileSync} from 'node:fs';

import { abi, bytecode } from '../../ethereum/out/htcl.sol/HTLC.json';

dotenv.config();

async function main() {
  if (!process.env.ETH_PRIVATE_KEY) {
    throw new Error('ETH_PRIVATE_KEY is not set in the environment variables');
  }
  if (!process.env.ETH_RPC_URL) {
    throw new Error('ETH_RPC_URL is not set in the environment variables');
  }
  if (!process.env.FUEL_PRIVATE_KEY) {
    throw new Error('FUEL_PRIVATE_KEY is not set in the environment variables');
  }
  if (!process.env.FUEL_ENDPOINT) {
    throw new Error('FUEL_ENDPOINT is not set in the environment variables');
  }

  const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
  const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, ethProvider);

  console.log('Ethereum wallet address:', ethWallet.address);
  console.log('Ethereum wallet balance:', ethProvider.getBalance(ethWallet.address));

  const fuelProvider = await Provider.create(process.env.FUEL_ENDPOINT);
  const fuelWallet = Wallet.fromPrivateKey(process.env.FUEL_PRIVATE_KEY, fuelProvider);

  console.log('Fuel wallet address:', fuelWallet.address);
  console.log('Fuel wallet balance:', await fuelWallet.getBalance());

  console.log('Deploying HTLC contract on Ethereum ...');

  const ethFactory = new ethers.ContractFactory(abi, bytecode, ethWallet);
  const ethContract = await ethFactory.deploy();

  await ethContract.waitForDeployment();
  const ethDepolymentAddress = await ethContract.getAddress();

  console.log('HTLC contract deployed on Ethereum to:', ethDepolymentAddress);

  console.log('Depolying HTLC contract to Fuel ...');

  const fuelFactory = new ContractsFactory(fuelWallet);
    
  const {contract: fuelContract} = await (await fuelFactory.deploy()).waitForResult();

  const fuelDeploymentAddress = fuelContract.account?.address.toAddress();

  console.log('HTLC contract deployed on Fuel to:', fuelDeploymentAddress);

  console.log('Saving deployment addresses to deployments.json...');

  const deployments = {
    ethereum: ethDepolymentAddress,
    fuel: fuelDeploymentAddress,
  };

  writeFileSync("./deployments.json", JSON.stringify(deployments, null, 2));
  console.log('Deployment addresses saved successfully to ./deployments.json');
}

main();

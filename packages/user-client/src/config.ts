import { Provider, Wallet } from 'fuels';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

import {
  ethereum as ethereumContractAddress,
  fuel as FuelContractAddress,
} from '../../deployer/deployments.json';

import { Contracts as FuelContract } from '../../fuel/out/index';
import { abi } from '../../ethereum/out/htcl.sol/HTLC.json';
import type { HTLC } from '../../ethereum/types';

dotenv.config();

// Fuel configuration
const FUEL_NETWORK_URL = process.env.FUEL_ENDPOINT;
if (!FUEL_NETWORK_URL) {
  throw new Error('FUEL_ENDPOINT is not set in the environment variables');
}

const FUEL_PRIVATE_KEY = process.env.FUEL_PRIVATE_KEY;
if (!FUEL_PRIVATE_KEY) {
  throw new Error('FUEL_PRIVATE_KEY is not set in the environment variables');
}

// Ethereum configuration
const ETH_NETWORK_URL = process.env.ETH_RPC_URL; // Changed from ETH_NETWORK_URL to ETH_RPC_URL based on .env file
if (!ETH_NETWORK_URL) {
  throw new Error('ETH_RPC_URL is not set in the environment variables');
}

const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY;
if (!ETH_PRIVATE_KEY) {
  throw new Error('ETH_PRIVATE_KEY is not set in the environment variables');
}

if (!FUEL_PRIVATE_KEY || !ETH_PRIVATE_KEY) {
  throw new Error('FUEL_PRIVATE_KEY and ETH_PRIVATE_KEY must be set in the environment variables');
}

// Fuel provider and wallet
export const fuelProvider = await Provider.create(FUEL_NETWORK_URL);
export const fuelWallet = Wallet.fromPrivateKey(FUEL_PRIVATE_KEY, fuelProvider);

// Ethereum provider and wallet
export const ethProvider = new ethers.JsonRpcProvider(ETH_NETWORK_URL);
export const ethWallet = new ethers.Wallet(ETH_PRIVATE_KEY, ethProvider);

export const ethContract = new ethers.Contract(
  ethereumContractAddress,
  abi,
  ethWallet,
) as unknown as HTLC;

export const fuelContract = new FuelContract(FuelContractAddress, fuelWallet);

// Export other configuration variables if needed
export const config = {
  FUEL_NETWORK_URL,
  ETH_NETWORK_URL,
};

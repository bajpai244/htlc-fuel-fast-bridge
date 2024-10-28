import { parseEther } from 'ethers';

export const HTCLAbi = [
  {
    type: 'function',
    name: 'computeLockHash',
    inputs: [
      {
        name: 'lock',
        type: 'tuple',
        internalType: 'struct HTLC.Lock',
        components: [
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'destination',
            type: 'address',
            internalType: 'address payable',
          },
          {
            name: 'sender',
            type: 'address',
            internalType: 'address payable',
          },
          { name: 'hash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'balance', type: 'uint256', internalType: 'uint256' },
          {
            name: 'expiryTimeSeconds',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'fee', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'locks',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'timelock',
    inputs: [
      {
        name: 'lock',
        type: 'tuple',
        internalType: 'struct HTLC.Lock',
        components: [
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'destination',
            type: 'address',
            internalType: 'address payable',
          },
          {
            name: 'sender',
            type: 'address',
            internalType: 'address payable',
          },
          { name: 'hash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'balance', type: 'uint256', internalType: 'uint256' },
          {
            name: 'expiryTimeSeconds',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'fee', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'unlock',
    inputs: [
      {
        name: 'lock',
        type: 'tuple',
        internalType: 'struct HTLC.Lock',
        components: [
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'destination',
            type: 'address',
            internalType: 'address payable',
          },
          {
            name: 'sender',
            type: 'address',
            internalType: 'address payable',
          },
          { name: 'hash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'balance', type: 'uint256', internalType: 'uint256' },
          {
            name: 'expiryTimeSeconds',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'fee', type: 'uint256', internalType: 'uint256' },
        ],
      },
      { name: 'digest', type: 'bytes32', internalType: 'bytes32' },
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct HTLC.Signature',
        components: [
          { name: 'v', type: 'uint8', internalType: 'uint8' },
          { name: 'r', type: 'bytes32', internalType: 'bytes32' },
          { name: 's', type: 'bytes32', internalType: 'bytes32' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Locked',
    inputs: [
      {
        name: 'lock',
        type: 'tuple',
        indexed: false,
        internalType: 'struct HTLC.Lock',
        components: [
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'destination',
            type: 'address',
            internalType: 'address payable',
          },
          {
            name: 'sender',
            type: 'address',
            internalType: 'address payable',
          },
          { name: 'hash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'balance', type: 'uint256', internalType: 'uint256' },
          {
            name: 'expiryTimeSeconds',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'fee', type: 'uint256', internalType: 'uint256' },
        ],
      },
      {
        name: 'lockHash',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Unlocked',
    inputs: [
      {
        name: 'lock',
        type: 'tuple',
        indexed: false,
        internalType: 'struct HTLC.Lock',
        components: [
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'destination',
            type: 'address',
            internalType: 'address payable',
          },
          {
            name: 'sender',
            type: 'address',
            internalType: 'address payable',
          },
          { name: 'hash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'balance', type: 'uint256', internalType: 'uint256' },
          {
            name: 'expiryTimeSeconds',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'fee', type: 'uint256', internalType: 'uint256' },
        ],
      },
      {
        name: 'refunded',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
      {
        name: 'lockHash',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
] as const;

export const balance = parseEther('0.00001');
export const fee = parseEther('0.000001');

// 25 million, 5 million less than the block gas limit
export const gasLimit = 25_000_000;

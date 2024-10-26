/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  BigNumberish,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../../common";
import type {
  MockERC20,
  MockERC20Interface,
} from "../../Counter.t.sol/MockERC20";

const _abi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_name",
        type: "string",
        internalType: "string",
      },
      {
        name: "_symbol",
        type: "string",
        internalType: "string",
      },
      {
        name: "_decimals",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "spender",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      {
        name: "spender",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "mint",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      {
        name: "recipient",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      {
        name: "sender",
        type: "address",
        internalType: "address",
      },
      {
        name: "recipient",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "spender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162000be238038062000be2833981016040819052620000349162000134565b600062000042848262000248565b50600162000051838262000248565b506002805460ff191660ff9290921691909117905550620003149050565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200009757600080fd5b81516001600160401b0380821115620000b457620000b46200006f565b604051601f8301601f19908116603f01168101908282118183101715620000df57620000df6200006f565b81604052838152602092508683858801011115620000fc57600080fd5b600091505b8382101562000120578582018301518183018401529082019062000101565b600093810190920192909252949350505050565b6000806000606084860312156200014a57600080fd5b83516001600160401b03808211156200016257600080fd5b620001708783880162000085565b945060208601519150808211156200018757600080fd5b50620001968682870162000085565b925050604084015160ff81168114620001ae57600080fd5b809150509250925092565b600181811c90821680620001ce57607f821691505b602082108103620001ef57634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156200024357600081815260208120601f850160051c810160208610156200021e5750805b601f850160051c820191505b818110156200023f578281556001016200022a565b5050505b505050565b81516001600160401b038111156200026457620002646200006f565b6200027c81620002758454620001b9565b84620001f5565b602080601f831160018114620002b457600084156200029b5750858301515b600019600386901b1c1916600185901b1785556200023f565b600085815260208120601f198616915b82811015620002e557888601518255948401946001909101908401620002c4565b5085821015620003045787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b6108be80620003246000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c806340c10f191161006657806340c10f191461012857806370a082311461013d57806395d89b4114610166578063a9059cbb1461016e578063dd62ed3e1461018157600080fd5b806306fdde03146100a3578063095ea7b3146100c157806318160ddd146100e457806323b872dd146100f6578063313ce56714610109575b600080fd5b6100ab6101ba565b6040516100b89190610708565b60405180910390f35b6100d46100cf366004610772565b610248565b60405190151581526020016100b8565b6003545b6040519081526020016100b8565b6100d461010436600461079c565b61025f565b6002546101169060ff1681565b60405160ff90911681526020016100b8565b61013b610136366004610772565b61030e565b005b6100e861014b3660046107d8565b6001600160a01b031660009081526004602052604090205490565b6100ab61031c565b6100d461017c366004610772565b610329565b6100e861018f3660046107fa565b6001600160a01b03918216600090815260056020908152604080832093909416825291909152205490565b600080546101c79061082d565b80601f01602080910402602001604051908101604052809291908181526020018280546101f39061082d565b80156102405780601f1061021557610100808354040283529160200191610240565b820191906000526020600020905b81548152906001019060200180831161022357829003601f168201915b505050505081565b6000610255338484610336565b5060015b92915050565b600061026c84848461045a565b6001600160a01b0384166000908152600560209081526040808320338452909152902054828110156102f65760405162461bcd60e51b815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e74206578636565647320616044820152676c6c6f77616e636560c01b60648201526084015b60405180910390fd5b6103038533858403610336565b506001949350505050565b6103188282610629565b5050565b600180546101c79061082d565b600061025533848461045a565b6001600160a01b0383166103985760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b60648201526084016102ed565b6001600160a01b0382166103f95760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b60648201526084016102ed565b6001600160a01b0383811660008181526005602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b0383166104be5760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b60648201526084016102ed565b6001600160a01b0382166105205760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b60648201526084016102ed565b6001600160a01b038316600090815260046020526040902054818110156105985760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b60648201526084016102ed565b6001600160a01b038085166000908152600460205260408082208585039055918516815290812080548492906105cf908490610867565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161061b91815260200190565b60405180910390a350505050565b6001600160a01b03821661067f5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f20616464726573730060448201526064016102ed565b80600360008282546106919190610867565b90915550506001600160a01b038216600090815260046020526040812080548392906106be908490610867565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b600060208083528351808285015260005b8181101561073557858101830151858201604001528201610719565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b038116811461076d57600080fd5b919050565b6000806040838503121561078557600080fd5b61078e83610756565b946020939093013593505050565b6000806000606084860312156107b157600080fd5b6107ba84610756565b92506107c860208501610756565b9150604084013590509250925092565b6000602082840312156107ea57600080fd5b6107f382610756565b9392505050565b6000806040838503121561080d57600080fd5b61081683610756565b915061082460208401610756565b90509250929050565b600181811c9082168061084157607f821691505b60208210810361086157634e487b7160e01b600052602260045260246000fd5b50919050565b8082018082111561025957634e487b7160e01b600052601160045260246000fdfea2646970667358221220e33f3776943871a7b89ecdb707d6e2b1a03247206c99e79e5525b8203f6e4add64736f6c63430008150033";

type MockERC20ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockERC20ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockERC20__factory extends ContractFactory {
  constructor(...args: MockERC20ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    _name: string,
    _symbol: string,
    _decimals: BigNumberish,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(
      _name,
      _symbol,
      _decimals,
      overrides || {}
    );
  }
  override deploy(
    _name: string,
    _symbol: string,
    _decimals: BigNumberish,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(_name, _symbol, _decimals, overrides || {}) as Promise<
      MockERC20 & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): MockERC20__factory {
    return super.connect(runner) as MockERC20__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockERC20Interface {
    return new Interface(_abi) as MockERC20Interface;
  }
  static connect(address: string, runner?: ContractRunner | null): MockERC20 {
    return new Contract(address, _abi, runner) as unknown as MockERC20;
  }
}

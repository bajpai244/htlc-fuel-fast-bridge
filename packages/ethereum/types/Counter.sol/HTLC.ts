/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common";

export declare namespace HTLC {
  export type LockStruct = {
    token: AddressLike;
    destination: AddressLike;
    sender: AddressLike;
    hash: BytesLike;
    balance: BigNumberish;
    expiryTimeSeconds: BigNumberish;
    fee: BigNumberish;
  };

  export type LockStructOutput = [
    token: string,
    destination: string,
    sender: string,
    hash: string,
    balance: bigint,
    expiryTimeSeconds: bigint,
    fee: bigint
  ] & {
    token: string;
    destination: string;
    sender: string;
    hash: string;
    balance: bigint;
    expiryTimeSeconds: bigint;
    fee: bigint;
  };

  export type SignatureStruct = { v: BigNumberish; r: BytesLike; s: BytesLike };

  export type SignatureStructOutput = [v: bigint, r: string, s: string] & {
    v: bigint;
    r: string;
    s: string;
  };
}

export interface HTLCInterface extends Interface {
  getFunction(
    nameOrSignature: "computeLockHash" | "locks" | "timelock" | "unlock"
  ): FunctionFragment;

  getEvent(nameOrSignatureOrTopic: "Locked" | "Unlocked"): EventFragment;

  encodeFunctionData(
    functionFragment: "computeLockHash",
    values: [HTLC.LockStruct]
  ): string;
  encodeFunctionData(functionFragment: "locks", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "timelock",
    values: [HTLC.LockStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "unlock",
    values: [HTLC.LockStruct, BytesLike, HTLC.SignatureStruct, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "computeLockHash",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "locks", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "timelock", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "unlock", data: BytesLike): Result;
}

export namespace LockedEvent {
  export type InputTuple = [lock: HTLC.LockStruct, index: BigNumberish];
  export type OutputTuple = [lock: HTLC.LockStructOutput, index: bigint];
  export interface OutputObject {
    lock: HTLC.LockStructOutput;
    index: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UnlockedEvent {
  export type InputTuple = [
    lock: HTLC.LockStruct,
    refunded: boolean,
    index: BigNumberish
  ];
  export type OutputTuple = [
    lock: HTLC.LockStructOutput,
    refunded: boolean,
    index: bigint
  ];
  export interface OutputObject {
    lock: HTLC.LockStructOutput;
    refunded: boolean;
    index: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface HTLC extends BaseContract {
  connect(runner?: ContractRunner | null): HTLC;
  waitForDeployment(): Promise<this>;

  interface: HTLCInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  computeLockHash: TypedContractMethod<
    [lock: HTLC.LockStruct],
    [string],
    "view"
  >;

  locks: TypedContractMethod<[arg0: BigNumberish], [string], "view">;

  timelock: TypedContractMethod<[lock: HTLC.LockStruct], [void], "payable">;

  unlock: TypedContractMethod<
    [
      lock: HTLC.LockStruct,
      digest: BytesLike,
      intent: HTLC.SignatureStruct,
      index: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "computeLockHash"
  ): TypedContractMethod<[lock: HTLC.LockStruct], [string], "view">;
  getFunction(
    nameOrSignature: "locks"
  ): TypedContractMethod<[arg0: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "timelock"
  ): TypedContractMethod<[lock: HTLC.LockStruct], [void], "payable">;
  getFunction(
    nameOrSignature: "unlock"
  ): TypedContractMethod<
    [
      lock: HTLC.LockStruct,
      digest: BytesLike,
      intent: HTLC.SignatureStruct,
      index: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  getEvent(
    key: "Locked"
  ): TypedContractEvent<
    LockedEvent.InputTuple,
    LockedEvent.OutputTuple,
    LockedEvent.OutputObject
  >;
  getEvent(
    key: "Unlocked"
  ): TypedContractEvent<
    UnlockedEvent.InputTuple,
    UnlockedEvent.OutputTuple,
    UnlockedEvent.OutputObject
  >;

  filters: {
    "Locked(tuple,uint256)": TypedContractEvent<
      LockedEvent.InputTuple,
      LockedEvent.OutputTuple,
      LockedEvent.OutputObject
    >;
    Locked: TypedContractEvent<
      LockedEvent.InputTuple,
      LockedEvent.OutputTuple,
      LockedEvent.OutputObject
    >;

    "Unlocked(tuple,bool,uint256)": TypedContractEvent<
      UnlockedEvent.InputTuple,
      UnlockedEvent.OutputTuple,
      UnlockedEvent.OutputObject
    >;
    Unlocked: TypedContractEvent<
      UnlockedEvent.InputTuple,
      UnlockedEvent.OutputTuple,
      UnlockedEvent.OutputObject
    >;
  };
}

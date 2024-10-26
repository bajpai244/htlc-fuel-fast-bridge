/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type { Script, ScriptInterface } from "../Script";

const _abi = [
  {
    type: "function",
    name: "IS_SCRIPT",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
] as const;

export class Script__factory {
  static readonly abi = _abi;
  static createInterface(): ScriptInterface {
    return new Interface(_abi) as ScriptInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Script {
    return new Contract(address, _abi, runner) as unknown as Script;
  }
}

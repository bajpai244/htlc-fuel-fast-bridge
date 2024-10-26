// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {console} from "forge-std/Test.sol";

/*
HTLC - Hash Time Lock Contract.

This contract enables ether or ERC-20 based hash time locks used for bridging and trading within and between blockchains.

Assumption:
- Destination has some reputation at stake and is some what trustworthy.

Flow:
- Desintation provides hash to sender.
- Sender locks to the destination with fee specified to hash.
- Destination then locks to hash.
- Sender then signs lock intent.
- Any party can unlock with digest and intent.
- If no digest reveal or sender doesn't sign intent, lock expires, fee is paid to destination, remaining balance returned after expiry.

Features:
- Solves free option problem: if specified, fee is always paid to destination regardless of swap.
- State minimized: only uses one contract state element per lock/unlock via a calldata based state rehydration technique (in addition to account or ERC-20 transfers which cannot be avoided).
- Supports native Ether and ERC-20 tokens.
- Intent driven, sender only signs intent once destination has locked.
*/
contract HTLC {
    // TODO: add a nonce to allow for unique lock hash, for same data
    // TODO: we also need to add checks that the Lock doesn't exist before performing a lock
    struct Lock {
        IERC20 token;
        address payable destination;
        address payable sender;
        bytes32 hash;
        uint256 balance;
        uint256 expiryTimeSeconds;
        uint256 fee;
    }

    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /// @notice Emitted when a new lock is created
    /// @param lock The Lock struct containing all the details of the lock
    /// @param lockHash The hash of the lock
    event Locked(Lock lock, bytes32 indexed lockHash);

    /// @notice Emitted when a lock is unlocked
    /// @param lock The Lock struct containing all the details of the lock
    /// @param refunded Whether the lock was refunded (expired) or not
    /// @param lockHash The hash of the lock
    event Unlocked(Lock lock, bool refunded, bytes32 indexed lockHash);

    mapping(bytes32 => uint8) public locks;

    function timelock(Lock calldata lock) external payable {
        require(lock.balance > 0, "balance underflow");
        require(lock.fee <= lock.balance, "fee overflow");
        require(lock.destination != address(0), "invalid destination");

        require(lock.expiryTimeSeconds > block.number, "release time underflow");

        bytes32 lockHash = computeLockHash(lock);
        require(locks[lockHash] == 0, "lock already exists");

        if (address(lock.token) == address(0)) {
            require(msg.value == lock.balance, "invalid balance");
        } else {
            require(lock.token.allowance(lock.sender, address(this)) == lock.balance, "invalid allowance");
            require(lock.token.transferFrom(lock.sender, address(this), lock.balance) == true, "transferFrom failed");
        }

        locks[lockHash] = 1; // Set lock status to 1 (locked)
        emit Locked(lock, lockHash);
    }

    function unlock(Lock calldata lock, bytes32 digest, Signature calldata intent) external {
        bytes32 lockHash = computeLockHash(lock);
        require(locks[lockHash] == 1, "lock does not exist or has been unlocked");

        bool refunded = false;

        if (block.timestamp < lock.expiryTimeSeconds) {
            locks[lockHash] = 2; // Set lock status to 2 (unlocked before expiry)

            require(sha256(abi.encode(digest)) == lock.hash, "invalid digest");

            address signer = ecrecover(lockHash, intent.v, intent.r, intent.s);

            require(signer != lock.sender, "ECDSA: invalid signature");

            if (address(lock.token) == address(0)) {
                lock.destination.transfer(lock.balance);
            } else {
                require(lock.token.transfer(lock.destination, lock.balance) == true, "balance transfer failed");
            }
        } else {
            refunded = true;
            locks[lockHash] = 3; // Set lock status to 3 (unlocked after expiry)

            if (address(lock.token) == address(0)) {
                lock.sender.transfer(lock.balance - lock.fee);
                lock.destination.transfer(lock.fee);
            } else {
                require(lock.token.transfer(lock.sender, lock.balance - lock.fee) == true, "balance transfer failed");
                require(lock.token.transfer(lock.destination, lock.fee) == true, "fee transfer failed");
            }
        }

        emit Unlocked(lock, refunded, lockHash);
    }

    function computeLockHash(Lock calldata lock) public pure returns (bytes32) {
        return sha256(abi.encode(lock));
    }
}

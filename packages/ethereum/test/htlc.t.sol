// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {HTLC} from "../src/htcl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./mocks/MockERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// TODO: we need tests to also check for event emission
contract HTLCTest is Test {
    HTLC public htlc;
    address payable public sender;
    address payable public destination;
    bytes32 public hash;
    uint256 public balance;
    uint256 public expiryTimeSeconds;
    uint256 public fee;
    MockERC20 public mockToken;
    uint256 private destinationPrivateKey;
    bytes32 public secret = sha256(abi.encode("secret"));

    constructor() payable {
        // Make the constructor payable to allow the contract to receive Ether
    }

    function setUp() public {
        htlc = new HTLC();
        sender = payable(address(this));

        destinationPrivateKey = 0xA11CE; // Replace with a proper private key
        destination = payable(vm.addr(destinationPrivateKey));

        console.logAddress(sender);
        console.logAddress(destination);
        console.logString("-----");

        hash = sha256(abi.encode(secret));
        balance = 1 ether;
        expiryTimeSeconds = block.timestamp + 1 hours;
        fee = 0.01 ether;

        mockToken = new MockERC20("Test Token", "TEST", 18);
        mockToken.mint(sender, 1000 ether);

        // Mint some ETH to the HTLC contract
        vm.deal(address(htlc), 1 ether);
    }

    function testTimelockWithEther() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(0)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        htlc.timelock{value: balance}(lock);

        bytes32 lockHash = htlc.computeLockHash(lock);
        assertEq(htlc.locks(lockHash), 1, "Lock status mismatch");
    }

    function testTimelockWithERC20() public {
        // Deploy a mock ERC20 token
        MockERC20 mockToken = new MockERC20("Test Token", "TEST", 18);

        // Mint some tokens to the sender
        mockToken.mint(sender, balance);

        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(mockToken)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        // Approve the HTLC contract to spend tokens
        mockToken.approve(address(htlc), balance);

        htlc.timelock(lock);

        bytes32 lockHash = htlc.computeLockHash(lock);
        assertEq(htlc.locks(lockHash), 1, "Lock status mismatch");
        assertEq(mockToken.balanceOf(address(htlc)), balance, "Token balance mismatch");
    }

    function testTimelockWithEtherInsufficientValue() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(0)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        vm.expectRevert("invalid balance");
        htlc.timelock{value: balance - 1 wei}(lock);
    }

    function testTimelockWithEtherExcessiveValue() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(0)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        vm.expectRevert("invalid balance");
        htlc.timelock{value: balance + 1 wei}(lock);
    }

    function testTimelockWithEtherPastExpiry() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(0)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: block.timestamp - 1,
            fee: fee
        });

        vm.expectRevert("release time underflow");
        htlc.timelock{value: balance}(lock);
    }

    function testTimelockWithEtherZeroBalance() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(0)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: 0,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        vm.expectRevert("balance underflow");
        htlc.timelock{value: 0}(lock);
    }

    function testTimelockWithEtherZeroDestination() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(0)),
            destination: payable(address(0)),
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        vm.expectRevert("invalid destination");
        htlc.timelock{value: balance}(lock);
    }

    function testTimelockWithEtherInvalidFee() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(0)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: balance + 1 // Fee is greater than balance
        });

        vm.expectRevert("fee overflow");
        htlc.timelock{value: balance}(lock);
    }

    function testTimelockWithERC20InsufficientAllowance() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(mockToken)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        mockToken.approve(address(htlc), balance - 1);

        vm.expectRevert("invalid allowance");
        htlc.timelock(lock);
    }

    function testTimelockWithERC20PastExpiry() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(mockToken)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: block.timestamp - 1,
            fee: fee
        });

        mockToken.approve(address(htlc), balance);

        vm.expectRevert("release time underflow");
        htlc.timelock(lock);
    }

    function testTimelockWithERC20ZeroBalance() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(mockToken)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: 0,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        vm.expectRevert("balance underflow");
        htlc.timelock(lock);
    }

    function testTimelockWithERC20ZeroDestination() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(mockToken)),
            destination: payable(address(0)),
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        mockToken.approve(address(htlc), balance);

        vm.expectRevert("invalid destination");
        htlc.timelock(lock);
    }

    function testTimelockWithERC20InvalidFee() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(mockToken)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: balance + 1 // Fee is greater than balance
        });

        mockToken.approve(address(htlc), balance);

        vm.expectRevert("fee overflow");
        htlc.timelock(lock);
    }

    function testUnlockWithEther() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(0)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        htlc.timelock{value: balance}(lock);
        bytes32 lockHash = htlc.computeLockHash(lock);

        uint256 initialBalance = destination.balance;

        HTLC.Signature memory signature = signLockHash(lockHash, destinationPrivateKey);

        vm.prank(destination);
        htlc.unlock(lock, secret, signature);

        assertEq(destination.balance, initialBalance + balance, "Destination balance mismatch");
        assertEq(htlc.locks(lockHash), 2, "Lock status mismatch after unlock");
    }

    function testUnlockWithEtherAfterExpiry() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(0)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: block.timestamp + 1 hours,
            fee: fee
        });

        htlc.timelock{value: balance}(lock);

        bytes32 lockHash = htlc.computeLockHash(lock);

        uint256 initialSenderBalance = sender.balance;
        uint256 initialDestinationBalance = destination.balance;

        HTLC.Signature memory signature = signLockHash(lockHash, destinationPrivateKey);

        // Fast forward time to after expiry
        vm.warp(block.timestamp + 2 hours);

        htlc.unlock(lock, secret, signature);

        assertEq(sender.balance, initialSenderBalance + (balance - fee), "Sender balance mismatch");
        assertEq(destination.balance, initialDestinationBalance + fee, "Destination balance mismatch");
        assertEq(htlc.locks(lockHash), 3, "Lock status mismatch after expired unlock");
    }

    function testUnlockWithEtherInvalidSecret() public {
        bytes32 wrongSecret = sha256(abi.encode("wrongsecret"));

        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(0)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: block.timestamp + 1 hours,
            fee: fee
        });

        htlc.timelock{value: balance}(lock);

        bytes32 lockHash = htlc.computeLockHash(lock);

        uint256 initialSenderBalance = sender.balance;
        uint256 initialDestinationBalance = destination.balance;

        HTLC.Signature memory signature = signLockHash(lockHash, destinationPrivateKey);

        vm.expectRevert("invalid digest");
        htlc.unlock(lock, wrongSecret, signature);
    }

    function testUnlockWithERC20() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(mockToken)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        mockToken.approve(address(htlc), balance);
        htlc.timelock(lock);
        bytes32 lockHash = htlc.computeLockHash(lock);

        uint256 initialBalance = mockToken.balanceOf(destination);

        HTLC.Signature memory signature = signLockHash(lockHash, destinationPrivateKey);

        vm.prank(destination);
        htlc.unlock(lock, secret, signature);

        assertEq(mockToken.balanceOf(destination), initialBalance + balance, "Destination token balance mismatch");
        assertEq(htlc.locks(lockHash), 2, "Lock status mismatch after unlock");
    }

    function testUnlockWithERC20AfterExpiry() public {
        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(mockToken)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: block.timestamp + 1 hours,
            fee: fee
        });

        mockToken.approve(address(htlc), balance);
        htlc.timelock(lock);

        bytes32 lockHash = htlc.computeLockHash(lock);

        uint256 initialSenderBalance = mockToken.balanceOf(sender);
        uint256 initialDestinationBalance = mockToken.balanceOf(destination);

        HTLC.Signature memory signature = signLockHash(lockHash, destinationPrivateKey);

        // Fast forward time to after expiry
        vm.warp(block.timestamp + 2 hours);

        htlc.unlock(lock, secret, signature);

        assertEq(mockToken.balanceOf(sender), initialSenderBalance + (balance - fee), "Sender token balance mismatch");
        assertEq(
            mockToken.balanceOf(destination), initialDestinationBalance + fee, "Destination token balance mismatch"
        );
        assertEq(htlc.locks(lockHash), 3, "Lock status mismatch after expired unlock");
    }

    function testUnlockWithERC20InvalidSecret() public {
        bytes32 wrongSecret = sha256(abi.encode("wrongsecret"));

        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(mockToken)),
            destination: destination,
            sender: sender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: block.timestamp + 1 hours,
            fee: fee
        });

        mockToken.approve(address(htlc), balance);
        htlc.timelock(lock);

        bytes32 lockHash = htlc.computeLockHash(lock);

        HTLC.Signature memory signature = signLockHash(lockHash, destinationPrivateKey);

        vm.expectRevert("invalid digest");
        htlc.unlock(lock, wrongSecret, signature);
    }

    function signLockHash(bytes32 lockHash, uint256 privateKey) internal pure returns (HTLC.Signature memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, lockHash);
        return HTLC.Signature({v: v, r: r, s: s});
    }

    fallback() external payable {}
    receive() external payable {}
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {HTLC} from "../src/htcl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./mocks/MockERC20.sol";

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

    function setUp() public {
        htlc = new HTLC();
        sender = payable(address(this));
        destination = payable(address(0x1234));
        hash = keccak256("secret");
        balance = 1 ether;
        expiryTimeSeconds = block.timestamp + 1 hours;
        fee = 0.01 ether;
        mockToken = new MockERC20("Test Token", "TEST", 18);
        mockToken.mint(sender, 1000 ether);
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

        assertEq(htlc.locks(0), htlc.computeLockHash(lock), "Lock hash mismatch");
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

        assertEq(htlc.locks(0), htlc.computeLockHash(lock), "Lock hash mismatch");
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
            fee: balance +1 // Fee is greater than balance
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

    function testTimelockWithERC20InsufficientBalance() public {
        address payable poorSender = payable(address(0x1111));
        mockToken.mint(poorSender, balance - 1);

        HTLC.Lock memory lock = HTLC.Lock({
            token: IERC20(address(mockToken)),
            destination: destination,
            sender: poorSender,
            hash: hash,
            balance: balance,
            expiryTimeSeconds: expiryTimeSeconds,
            fee: fee
        });

        vm.prank(poorSender);
        mockToken.approve(address(htlc), balance);

        vm.expectRevert("sender must equal msg.sender");
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
}

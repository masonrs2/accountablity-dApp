// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./AccountabilityNFTs.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Accountability is ReentrancyGuard{
    // 1. Stores the the wallet address
    // 2. Amount of time to lock up funds for
    // 3. Amount of funds to lock up
    // 4. Original time the funds were locked up
    struct LockedFunds {
        uint256 amount;
        uint256 time;
        uint256 lockedAt;
    }

     // 1. Store the amount ETH each address has deposited
    mapping(address => LockedFunds) public addressToLockedFunds;

    // Store the NFT collection smart contract in this variable
    AccountabilityNFTs public accountabilityNFTs;
    constructor(
        AccountabilityNFTs _nftCollectionAddress
    ) {
        accountabilityNFTs = _nftCollectionAddress;
    }


    // withdraw function that checks if the user attempting to
    // deposit owns the NFT which allows for a withdrawal

    function lockFunds(uint256 _amount, uint256 _time) public payable {
        // 1. Check if the user has already locked up funds
        require(addressToLockedFunds[msg.sender].amount == 0, "You already have funds locked up");

        // 2. Transfer desired amount of funds to the smart contract
        addressToLockedFunds[msg.sender] = LockedFunds(_amount, _time, block.timestamp);
    }

    /**
     * Withdraw function that checks if the user attempting to 
     * withdraw the funds owns the NFT from AccountabilityNFTs
     * 
     * 1. If they do own the NFT: allow a withdrawal
     * 2. If not, revert the transaction
     */

    function withdrawFunds() public nonReentrant {
        require(addressToLockedFunds[msg.sender].amount > 0, "You do not have any funds locked up");
        require(block.timestamp >= (addressToLockedFunds[msg.sender].lockedAt + addressToLockedFunds[msg.sender].time), "You cannot withdraw your funds yet");
        require(accountabilityNFTs.balanceOf(msg.sender) > 0, "You do not own the NFT");
        payable(msg.sender).transfer(addressToLockedFunds[msg.sender].amount);
        addressToLockedFunds[msg.sender].amount = 0;
    }
}
const { expect } = require('chai');
const { ethers } = require('hardhat');
const {utils} = require("@nomiclabs/hardhat-ethers");

const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")

describe("Accountablity.sol", function () {
    async function deployContractsFixture() {
        const accountabilityNftFactory = await ethers.getContractFactory("AccountabilityNFTs");
        const accountabilityFactory = await ethers.getContractFactory("Accountability");

        const [owner, addr1, addr2] = await ethers.getSigners();

        const accountabilityNfts = await accountabilityNftFactory.deploy(
            "Accountability NFTs",
            "ACCT",
            owner.address,
            0,
            owner.address 
        );
        const accountability = await accountabilityFactory.deploy(accountabilityNfts.address);

        await accountability.deployed();
        console.log("Accountability.sol address: ", accountability.address);

        return { accountability, accountabilityNfts, owner, addr1, addr2 };
    }

    // It Should allow funds to be deposited into the contract 
    it("Should allow funds to be deposited into the contract and updates mapping accordingly", async function () {
        const { accountability, accountabilityNfts, owner, addr1, addr2 } = await loadFixture(deployContractsFixture);
        const CURRENT_TIME = await time.latest();
        const LOCKED_TIME = time.duration.minutes(1)
        const FUND_AMOUNT = ethers.utils.parseEther("1.0");
        await accountability.lockFunds(
            FUND_AMOUNT, 
            LOCKED_TIME
        );

        const ownerMapping = await accountability.addressToLockedFunds(owner.address);

        // Check mapping values of depositor of funds
        expect(ownerMapping.amount).to.equal(FUND_AMOUNT.toString());
        expect(ownerMapping.time).to.equal(LOCKED_TIME.toString());
        expect(ownerMapping.lockedAt).to.equal(await time.latest());
            
    });
    // It should reject a withdrawal if the locked time has not yet passed
    it("Should reject a withdrawal if the locked time has not yet elapsed", async function () {
        const { accountability, accountabilityNfts, owner, addr1, addr2 } = await loadFixture(deployContractsFixture);
        const CURRENT_TIME = await time.latest();
        const LOCKED_TIME = time.duration.minutes(1)
        const FUND_AMOUNT = ethers.utils.parseEther("1.0");

        await accountability.connect(owner).lockFunds(FUND_AMOUNT, LOCKED_TIME);
        
        await accountability.addressToLockedFunds(owner.address);

        await expect(
            accountability.connect(owner).withdrawFunds()
        ).to.be.revertedWith("You cannot withdraw your funds yet");


    })
    // It should reject a withdrawal if the user hasn't received an NFT
    it("Should reject a withdrawal if the user hasn't received an NFT", async function () {
        const { accountability, accountabilityNfts, owner, addr1, addr2 } = await loadFixture(deployContractsFixture);
        const CURRENT_TIME = await time.latest();
        const LOCKED_TIME = time.duration.minutes(1)
        const FUND_AMOUNT = ethers.utils.parseEther("1.0");

        await accountability.connect(owner).lockFunds(FUND_AMOUNT, LOCKED_TIME);
        await accountability.addressToLockedFunds(owner.address);

        await time.increase(time.duration.minutes(1));

        // Should fail since we have not yet received an NFT
        await expect(accountability.connect(owner).withdrawFunds()).to.be.revertedWith("You do not own the NFT");
    })

    it("Should reject a withdrawal if the user has deposited 0 funds", async function () {
        const { accountability, accountabilityNfts, owner, addr1, addr2 } = await loadFixture(deployContractsFixture);
        const CURRENT_TIME = await time.latest();
        const LOCKED_TIME = time.duration.minutes(1)
        const FUND_AMOUNT = ethers.utils.parseEther("0");

        await accountability.connect(owner).lockFunds(FUND_AMOUNT, LOCKED_TIME);
        await accountability.addressToLockedFunds(owner.address);

        await time.increase(time.duration.minutes(1));

        // Should fail since we have not yet deposited any funds
        await expect(accountability.connect(owner).withdrawFunds()).to.be.revertedWith("You do not have any funds locked up");
    })

    // it("Should successfully withdraw funds", async function () {
    //     const { accountability, accountabilityNfts, owner, addr1, addr2 } = await loadFixture(deployContractsFixture);
    //     const LOCKED_TIME = time.duration.minutes(1)
    //     const FUND_AMOUNT = ethers.utils.parseEther("1.0");
        
    //     const walletBalance = await ethers.provider.getBalance(owner.address)

    //     await accountability.connect(owner).lockFunds(FUND_AMOUNT, LOCKED_TIME);
    //     await accountabilityNfts.connect(owner).mintTo(owner.address, 'URI');
        
    //     // Increase time to allow withdrawal and withdraw funds
    //     await time.increase(time.duration.minutes(1));

    //     // expect(await ethers.provider.getBalance(owner.address)).to.equal(walletBalance.toString())
        
    //     await accountability.connect(owner).withdrawFunds();
    //     console.log("FSFSFS")
    //    const lockedFundsMapping = await accountability.addressToLockedFunds(owner.address)
    //    console.log("11111")

    //    expect(lockedFundsMapping.amount).to.equal(ethers.BigNumber.from(0))
    // })


})
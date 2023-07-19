const { expect } = require("chai")
const { ethers } = require("hardhat")

describe.only("LayerzeroPoc", function () {
    beforeEach(async function () {

        const [sender] = await ethers.getSigners();

        // use this chainId
        this.chainIdSrc = 1
        this.chainIdDst = 2

        // create a LayerZero Endpoint mock for testing
        const LZEndpointMock = await ethers.getContractFactory("LZEndpointMock")
        this.layerZeroEndpointMockSrc = await LZEndpointMock.deploy(this.chainIdSrc)
        this.layerZeroEndpointMockDst = await LZEndpointMock.deploy(this.chainIdDst)

        // create two LayerzeroPoc instances
        const LayerzeroPocA = await ethers.getContractFactory("LayerzeroPocA")
        const LayerzeroPocB = await ethers.getContractFactory("LayerzeroPocB")
        this.layerzeroPocA = await LayerzeroPocA.deploy(this.layerZeroEndpointMockSrc.address)
        this.layerzeroPocB = await LayerzeroPocB.deploy(this.layerZeroEndpointMockDst.address)

        // Send funds to contracts
        // await sender.sendTransaction({
        //     to: this.layerzeroPocA.address,
        //     value: ethers.utils.parseEther("0.05") // sending 1 ether
        // });

        // await sender.sendTransaction({
        //     to: this.layerzeroPocB.address,
        //     value: ethers.utils.parseEther("0.05") // sending 1 ether
        // });
        await this.layerZeroEndpointMockSrc.setDestLzEndpoint(this.layerzeroPocB.address, this.layerZeroEndpointMockDst.address)
        await this.layerZeroEndpointMockDst.setDestLzEndpoint(this.layerzeroPocA.address, this.layerZeroEndpointMockSrc.address)

        // set each contracts source address so it can send to each other
        await this.layerzeroPocA.setTrustedRemote(
            this.chainIdDst,
            ethers.utils.solidityPack(["address", "address"], [this.layerzeroPocB.address, this.layerzeroPocA.address])
        )
        await this.layerzeroPocB.setTrustedRemote(
            this.chainIdSrc,
            ethers.utils.solidityPack(["address", "address"], [this.layerzeroPocA.address, this.layerzeroPocB.address])
        )
    })

    it("call c parameter passed function between chain 1 and chain 2", async function () {

        console.log("layerzeroPocA", this.layerzeroPocA.address);
        console.log("layerzeroPocB", this.layerzeroPocB.address);

        const adapterParamV2 = ethers.utils.solidityPack(["uint16", "uint256", "uint256", "address"], [2, 225000, ethers.utils.parseEther("0.015"), this.layerzeroPocB.address])
        const adapterParamV1 = ethers.utils.solidityPack(["uint16", "uint256"], [1, 225000])

        let layerzeroPocA = await ethers.provider.getBalance(this.layerzeroPocA.address)
        let layerzeroPocB = await ethers.provider.getBalance(this.layerzeroPocB.address)

        console.log("Before Balances")
        console.log({layerzeroPocA, layerzeroPocB})

        let nativeFee = (await this.layerzeroPocA.estimateFunctionA(this.chainIdDst, adapterParamV2)).nativeFee
        console.log("Cost of functionA")
        console.log({nativeFee})
        await this.layerzeroPocA.functionA(this.chainIdDst, adapterParamV2, { value: nativeFee })

        console.log("After Balances")
        layerzeroPocA = await ethers.provider.getBalance(this.layerzeroPocA.address)
        layerzeroPocB = await ethers.provider.getBalance(this.layerzeroPocB.address)
        console.log({layerzeroPocA, layerzeroPocB})

        //function called on chain 1 = A and C
        expect(await this.layerzeroPocA.functionACalled()).to.be.equal(true)
        expect(await this.layerzeroPocA.functionCCalled()).to.be.equal(true)

        //function called on chain 2 = B
        expect(await this.layerzeroPocB.functionBCalled()).to.be.equal(true)
    })
})

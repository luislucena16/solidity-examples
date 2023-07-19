// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../lzApp/NonblockingLzApp.sol";

contract LayerzeroPocB is NonblockingLzApp {
    bool public functionBCalled;

    constructor(address _lzEndpoint) NonblockingLzApp(_lzEndpoint) {}

    function _nonblockingLzReceive(uint16 _srcChainId, bytes memory /*_srcAddress*/, uint64 /*_nonce*/, bytes memory _payload) internal override {
        bytes4 functionSelector = abi.decode(_payload, (bytes4));

        functionB(_srcChainId, functionSelector);
    }

    function functionB(uint16 _dstChainId, bytes4 functionSelector) public payable {
        functionBCalled = true;
        bytes memory payload = abi.encode(functionSelector);
        _lzSend(_dstChainId, payload, payable(msg.sender), address(0x0), bytes(""), address(this).balance);
    }

    receive() external payable {}
}

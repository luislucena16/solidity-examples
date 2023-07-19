// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../lzApp/NonblockingLzApp.sol";

contract LayerzeroPocA is NonblockingLzApp {
    bool public functionACalled;
    bool public functionCCalled;

    constructor(address _lzEndpoint) NonblockingLzApp(_lzEndpoint) {}

    function _nonblockingLzReceive(uint16 /*_srcChainId*/, bytes memory /*_srcAddress*/, uint64 /*_nonce*/, bytes memory _payload) internal override {
        bytes4 functionSelector = abi.decode(_payload, (bytes4));

        bytes memory data = abi.encodeWithSelector(functionSelector);
        (bool success, ) = address(this).call(data);
    }

    function functionC() public payable {
        functionCCalled = true;
    }

    function functionA(uint16 _dstChainId) public payable {
        functionACalled = true;
        bytes4 functionSelector = bytes4(keccak256("functionC()"));
        bytes memory payload = abi.encode(functionSelector);

        _lzSend(_dstChainId, payload, payable(msg.sender), address(0x0), bytes(""), address(this).balance);
    }

    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "./CompMock.sol";

contract ComptrollerMock {
    uint256 public constant CLAIM_AMOUNT = 10**18;
    CompMock public comp;

    constructor(address _comp) {
        comp = CompMock(_comp);
    }

    function claimComp(address holder) external {
        comp.mint(holder, CLAIM_AMOUNT);
    }

    function getCompAddress() external view returns (address) {
        return address(comp);
    }
}

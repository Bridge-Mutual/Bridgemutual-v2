// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "./UChildERC20.sol";

contract MATICSTBLMock is UChildERC20 {
    constructor() UChildERC20() {}

    function mintArbitrary(address _to, uint256 _amount) external {
        require(_amount <= 1_000_000 * 10**decimals(), "MATICSTBLMock: Can't mint that amount");

        _mint(_to, _amount);
    }
}

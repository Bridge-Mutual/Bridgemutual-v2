// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "./BEP20USDT.sol";

contract BSCSTBLMock is BEP20USDT {
    constructor() BEP20USDT() {}

    function mintArbitrary(address _to, uint256 _amount) external {
        require(_amount <= 1_000_000 * 10**_decimals, "BSCSTBLMock: Can't mint that amount");

        _mint(_to, _amount);
    }
}

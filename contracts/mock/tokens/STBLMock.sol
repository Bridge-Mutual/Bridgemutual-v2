// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "./TetherToken.sol";

contract STBLMock is TetherToken {
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) TetherToken(1_000_000_000_000 * 10**_decimals, _name, _symbol, _decimals) {}

    function mintArbitrary(address _to, uint256 _amount) external {
        require(_amount <= 1_000_000 * 10**decimals, "STBLMock: Can't mint that amount");

        _issue(_to, _amount);
    }
}

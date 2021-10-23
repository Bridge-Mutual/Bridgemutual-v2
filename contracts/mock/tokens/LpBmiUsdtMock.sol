// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "./AbstractLPTokenMock.sol";

contract LpBmiUsdtMock is AbstractLPTokenMock {
    constructor(string memory _name, string memory _symbol) AbstractLPTokenMock(_name, _symbol) {}
}

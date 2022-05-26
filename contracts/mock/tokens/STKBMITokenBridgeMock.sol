// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract STKBMITokenBridgeMock is ERC20 {
    constructor() ERC20("Bridge Staking BMI", "Bridge-stkBMI") {}

    function mintArbitrary(address _to, uint256 _amount) external {
        require(_amount <= 1_000_000 ether, "STKBMITokenBridgeMock: Can't mint that amount");

        _mint(_to, _amount);
    }
}

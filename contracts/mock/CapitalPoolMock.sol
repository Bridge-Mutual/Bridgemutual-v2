// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../CapitalPool.sol";
import "../interfaces/ILeveragePortfolio.sol";

contract CapitalPoolMock is CapitalPool {
    function addPremium(uint256 premiumAmount) external {
        reinsurancePool.addPolicyPremium(0, premiumAmount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../CapitalPool.sol";
import "../interfaces/ILeveragePortfolio.sol";

contract CapitalPoolMock is CapitalPool {
    uint256 public makeTransaction;

    function addPremium(uint256 premiumAmount) external {
        reinsurancePool.addPolicyPremium(0, premiumAmount);
    }

    function addPremium(uint256 epochsNumber, uint256 premiumAmount) external {
        userLeveragePool.addPolicyPremium(epochsNumber, premiumAmount);
    }

    function setliquidityCushionBalance(uint256 amount) external {
        liquidityCushionBalance = amount;
    }

    function _buildPremiumFactors(
        uint256 stblAmount,
        uint256 premiumDurationInDays,
        uint256 protocolFee,
        uint256 lStblDeployedByLP,
        uint256 vStblDeployedByRP,
        uint256 vStblOfCP
    ) public returns (PremiumFactors memory factors) {
        factors = PremiumFactors(
            stblAmount,
            premiumDurationInDays,
            protocolFee,
            lStblDeployedByLP,
            vStblDeployedByRP,
            vStblOfCP,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        );
    }
}

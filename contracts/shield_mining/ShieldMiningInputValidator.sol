// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "./ShieldMiningModelDependant.sol";

/// @dev THIS CAN BE TURNED INTO A LIBRARY!
contract ShieldMiningInputValidator is ShieldMiningModelDependant, ShieldMiningViewDependant {
    function checkAvailableForShieldMining(address insuredContract) private view {
        AbstractShieldMiningModel shieldMiningModel = getModel(insuredContract);
        bool contractAvailable =
            shieldMiningModel.isContractAvailableForShieldMining(insuredContract);
        require(contractAvailable, "Contract not available for shield mining");
    }

    function checkTokenIsAcceptedAsReward(address insuredContract, address rewardToken)
        private
        view
    {
        AbstractShieldMiningModel shieldMiningModel = getModel(insuredContract);
        bool isTokenAccepted =
            shieldMiningModel.isTokenAcceptedAsReward(insuredContract, rewardToken);
        require(isTokenAccepted, "Such token is not accepted as reward");
    }

    modifier validateSetupReward() {
        require(true, "");
        _;
    }

    modifier validateDepositRewardTokens(
        address insuredContract,
        address rewardToken,
        uint256 rewardTokenAmount
    ) {
        checkTokenIsAcceptedAsReward(insuredContract, rewardToken);

        uint256 minRewardTokenAmount = shieldMiningView.getMinRewardTokenDeposit(insuredContract);
        bool enoughTokensFor1Month = minRewardTokenAmount <= rewardTokenAmount;
        require(enoughTokensFor1Month, "Not enough tokens for 30 day distribution");
        _;
    }

    modifier validateWithdrawRewardTokens(address insuredContract, address rewardToken) {
        checkTokenIsAcceptedAsReward(insuredContract, rewardToken);
        _;
    }
}

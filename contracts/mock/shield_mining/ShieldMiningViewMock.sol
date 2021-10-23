// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../../shield_mining/ShieldMiningView.sol";

contract ShieldMiningViewMock is ShieldMiningView {
    using SafeMath for uint256;
    uint8 dummy = 0;

    function getPolicyBookAddress(address insuredContract)
        public
        override
        returns (address policyBookAddress)
    {
        dummy = 1;
        policyBookAddress = super.getPolicyBookAddress(insuredContract);
    }

    // function getPolicyBook(address insuredContract)
    //     external
    //     view
    //     returns (IPolicyBook coveragePoolModel) {
    // }

    // function getUtilizationRatio(address insuredContract)
    //     external
    //     view
    //     returns (uint256 utilizationRatio) {
    // }

    // function getStakedUsd(address insuredContract)
    //     external
    //     view
    //     returns (uint256 UsdStakedInPolicyBook) {
    // }

    // function getRewardData(address insuredContract, address rewardToken)
    //     external
    //     override
    //     view
    //     returns (
    //         uint256 rewardPerTokenSinceLastUpdate,
    //         uint256 lastRewardPerToken,
    //         uint256 rewardPerTokenFromStart,
    //         uint256 _lastRewardPerTokenAccruedByUser,
    //         uint256 rewardPerTokenOwedToUser,
    //         uint256 rewardTokensOwedToUserSinceLastUpdate,
    //         uint256 rewardTokensOwedToUser        )
    // {
    //     AbstractShieldMiningModel model = getModel(insuredContract);

    //     rewardPerTokenSinceLastUpdate = getRewardPerTokenSinceLastUpdate(
    //         insuredContract,
    //         rewardToken
    //     );
    //     lastRewardPerToken = model.lastRewardPerToken(insuredContract, rewardToken);

    //     rewardPerTokenFromStart = lastRewardPerToken.add(rewardPerTokenSinceLastUpdate);
    //     _lastRewardPerTokenAccruedByUser = model.rewardPerTokenAccruedByUser(
    //         insuredContract,
    //         rewardToken,
    //         msg.sender
    //     );
    //     // require(debug != 1,"getRewardData --> debug == 1");
    //     rewardPerTokenOwedToUser = rewardPerTokenFromStart.sub(_lastRewardPerTokenAccruedByUser);

    //     uint256 usdStakedByUser = getUsdStakedByUser(insuredContract);
    //     rewardTokensOwedToUserSinceLastUpdate = usdStakedByUser.mul(rewardPerTokenOwedToUser).div(
    //         1e18
    //     );
    //     uint256 currentRewardTokensOwedToUser =
    //         model.rewardTokensOwedToUser(insuredContract, rewardToken, msg.sender);
    //     rewardTokensOwedToUser = currentRewardTokensOwedToUser.add(
    //         rewardTokensOwedToUserSinceLastUpdate
    //     );
    // }

    // function getDefaultRewardToken(address insuredContract)
    //     external
    //     view
    //     returns (address defaultToken) {
    // }

    // function getMinRewardTokenDeposit(address insuredContract)
    //     external
    //     view
    //     returns (uint256 minRewardTokenAmount) {
    // }

    // function getMinDaysOfReward(address insuredContract)
    //     external
    //     view
    //     returns (uint256 minDaysOfReward) {
    // }
}

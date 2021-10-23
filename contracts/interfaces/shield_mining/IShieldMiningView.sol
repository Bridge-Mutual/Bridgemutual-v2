// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../IPolicyBook.sol";

interface IShieldMiningView {
    function getPolicyBookAddress(address insuredContract)
        external
        returns (
            //view
            address policyBookAddress
        );

    function getPolicyBook(address insuredContract)
        external
        view
        returns (IPolicyBook coveragePoolModel);

    function getUtilizationRatio(address insuredContract)
        external
        view
        returns (uint256 utilizationRatio);

    function getStakedUsd(address insuredContract) external view returns (uint256 totalLiquidity);

    function getLastRewardPerToken(address insuredContract, address rewardToken)
        external
        view
        returns (uint256 lastRewardPerToken);

    function getRewardData(address insuredContract, address rewardToken)
        external
        view
        returns (
            uint256 rewardPerTokenSinceLastUpdate,
            uint256 lastRewardPerToken,
            uint256 rewardPerTokenFromStart,
            uint256 lastRewardPerTokenAccruedByUser,
            uint256 rewardPerTokenOwedToUser,
            uint256 rewardTokensOwedToUserSinceLastUpdate,
            uint256 rewardTokensOwedToUser
        );

    function getDefaultRewardToken(address insuredContract)
        external
        view
        returns (address defaultToken);

    function getMinRewardTokenDeposit(address insuredContract)
        external
        view
        returns (uint256 minRewardTokenAmount);

    function getMinDaysOfReward(address insuredContract)
        external
        view
        returns (uint256 minDaysOfReward);
}

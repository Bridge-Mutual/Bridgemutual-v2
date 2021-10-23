// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

interface IShieldMiningController {
    function enableShieldMining(address insuredContract) external;

    function setRewardPerDay(
        address insuredContract,
        address rewardToken,
        uint256 rewardPerDay
    ) external;

    function setupReward(
        address insuredContract,
        address rewardToken,
        uint256 rewardPerDay,
        uint256 lastBlockWithRewards
    ) external;

    function depositRewardTokens(
        address insuredContract,
        address rewardToken,
        uint256 rewardTokenAmount
    ) external;

    function withdrawRewardTokens(address insuredContract, address rewardToken) external;

    function updateRewardPerToken(
        address insuredContract,
        address rewardToken,
        uint256 rewardPerTokenFromStart
    ) external;

    function setRewardTokensOwedToUser(
        address insuredContract,
        address rewardToken,
        uint256 rewardTokensOwedToUser
    ) external;

    function setDefaultRewardToken(address insuredContract, address rewardToken) external;

    function setLastBlockWithRewards(
        address insuredContract,
        address rewardToken,
        uint256 _lastBlockWithRewards
    ) external;

    function setMinDaysOfReward(address insuredContract, uint256 _minDaysOfReward) external;
}

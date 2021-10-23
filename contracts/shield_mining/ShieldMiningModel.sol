// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IContractsRegistry.sol";
import "../interfaces/IPolicyBookRegistry.sol";
import "../interfaces/IPolicyBookAdmin.sol";

import "../abstract/shield_mining/AbstractShieldMiningModel.sol";

contract ShieldMiningModel is AbstractShieldMiningModel {
    constructor(address _policyBookRegistryProxyAddress) {
        policyBookRegistryAddress = _policyBookRegistryProxyAddress;
    }

    function enableShieldMining(address insuredContract) external override {
        isContractAvailableForShieldMining[insuredContract] = true;
    }

    function acceptTokenAsReward(address insuredContract, address rewardToken) external override {
        isTokenAcceptedAsReward[insuredContract][rewardToken] = true;
    }

    function setDefaultRewardToken(address insuredContract, address rewardToken)
        external
        override
    {
        defaultRewardToken[insuredContract] = rewardToken;
    }

    function setMinDaysOfReward(uint256 _minDaysOfReward) external override {
        minDaysOfReward = _minDaysOfReward;
    }

    function setRewardPerDay(
        address insuredContract,
        address rewardToken,
        uint256 _rewardPerDay
    ) external override {
        rewardPerDay[insuredContract][rewardToken] = _rewardPerDay;
    }

    function setLastBlockWithRewards(
        address insuredContract,
        address rewardToken,
        uint256 _lastBlockWithRewards
    ) external override {
        lastBlockWithRewards[insuredContract][rewardToken] = _lastBlockWithRewards;
    }

    function recordCurrentBlock(address insuredContract, address rewardToken) public override {
        lastUpdateBlock[insuredContract][rewardToken] = block.number;
    }

    function setLastRewardPerToken(
        address insuredContract,
        address rewardToken,
        uint256 _rewardPerToken
    ) external override {
        lastRewardPerToken[insuredContract][rewardToken] = _rewardPerToken;
    }

    function setRewardPerTokenAccruedByUser(
        address insuredContract,
        address rewardToken,
        address user,
        uint256 _rewardPerTokenAccruedByUser
    ) external override {
        rewardPerTokenAccruedByUser[insuredContract][rewardToken][
            user
        ] = _rewardPerTokenAccruedByUser;
    }

    function setRewardTokensOwedToUser(
        address insuredContract,
        address rewardToken,
        address user,
        uint256 _rewardTokensOwedToUser
    ) external override {
        rewardTokensOwedToUser[insuredContract][rewardToken][user] = _rewardTokensOwedToUser;
    }

    function depositRewardToken(address rewardToken, uint256 rewardTokenAmount)
        external
        override
        returns (bool success)
    {
        success = IERC20(rewardToken).transferFrom(msg.sender, address(this), rewardTokenAmount);
    }

    function withdrawRewardToken(address rewardToken, uint256 rewardTokenAmount)
        external
        override
        returns (bool success)
    {
        success = IERC20(rewardToken).transferFrom(address(this), msg.sender, rewardTokenAmount);
    }

    function setRewardTokensInPool(
        address insuredContract,
        address rewardToken,
        uint256 rewardTokenAmount
    ) external override {
        rewardTokensInPool[insuredContract][rewardToken] = rewardTokenAmount;
    }
}

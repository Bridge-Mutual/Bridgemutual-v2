// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";

import "../interfaces/IContractsRegistry.sol";
import "../interfaces/shield_mining/IShieldMiningController.sol";
import "../abstract/shield_mining/AbstractShieldMiningModel.sol";
import "../abstract/AbstractDependant.sol";

import "./ShieldMiningView.sol";
import "./ShieldMiningInputValidator.sol";

contract ShieldMiningController is
    IShieldMiningController,
    ShieldMiningInputValidator,
    AbstractDependant
{
    using SafeMath for uint256;

    function setDependencies(IContractsRegistry _contractsRegistry)
        public
        override
        onlyInjectorOrZero
    {
        policyBookRegistryAddress = _contractsRegistry.getPolicyBookRegistryContract();
    }

    // ================= enablers =================

    function enableShieldMining(address insuredContract) public override {
        _enableShieldMining(getModel(insuredContract), insuredContract);
    }

    function _enableShieldMining(AbstractShieldMiningModel model, address insuredContract)
        internal
    {
        model.enableShieldMining(insuredContract);
    }

    function setRewardPerDay(
        address insuredContract,
        address rewardToken,
        uint256 rewardPerDay
    ) external override {
        _setRewardPerDay(getModel(insuredContract), insuredContract, rewardToken, rewardPerDay);
    }

    function _setRewardPerDay(
        AbstractShieldMiningModel model,
        address insuredContract,
        address rewardToken,
        uint256 rewardPerDay
    ) internal {
        model.setRewardPerDay(insuredContract, rewardToken, rewardPerDay);
    }

    function setLastBlockWithRewards(
        address insuredContract,
        address rewardToken,
        uint256 lastBlockWithRewards
    ) external override {
        _setLastBlockWithRewards(
            getModel(insuredContract),
            insuredContract,
            rewardToken,
            lastBlockWithRewards
        );
    }

    function _setLastBlockWithRewards(
        AbstractShieldMiningModel model,
        address insuredContract,
        address rewardToken,
        uint256 lastBlockWithRewards
    ) internal {
        model.setLastBlockWithRewards(insuredContract, rewardToken, lastBlockWithRewards);
    }

    // TODO review access restrictions
    function setupReward(
        address insuredContract,
        address rewardToken,
        uint256 rewardPerDay,
        uint256 lastBlockWithRewards
    ) public override validateSetupReward() {
        AbstractShieldMiningModel model = getModel(insuredContract);

        model.acceptTokenAsReward(insuredContract, rewardToken);
        model.setDefaultRewardToken(insuredContract, rewardToken);

        _setRewardPerDay(model, insuredContract, rewardToken, rewardPerDay);
        _enableShieldMining(model, insuredContract);
        _setLastBlockWithRewards(model, insuredContract, rewardToken, lastBlockWithRewards);
    }

    function depositRewardTokens(
        address insuredContract,
        address rewardToken,
        uint256 rewardTokenAmount
    )
        public
        override
        validateDepositRewardTokens(insuredContract, rewardToken, rewardTokenAmount)
    {
        AbstractShieldMiningModel model = getModel(insuredContract);

        bool success = model.depositRewardToken(rewardToken, rewardTokenAmount);
        require(success, "Could not deposit tokens");

        uint256 tokensInPool = model.rewardTokensInPool(insuredContract, rewardToken);
        uint256 updatedTokensInPool = tokensInPool.add(rewardTokenAmount);
        model.setRewardTokensInPool(insuredContract, rewardToken, updatedTokensInPool);
    }

    /// @dev rewardPerToken must start as 0
    function withdrawRewardTokens(address insuredContract, address rewardToken)
        public
        override
        validateWithdrawRewardTokens(insuredContract, rewardToken)
    {
        (, , uint256 rewardPerTokenFromStart, , , , uint256 rewardTokensOwedToUser) =
            shieldMiningView.getRewardData(insuredContract, rewardToken);

        AbstractShieldMiningModel model = getModel(insuredContract);

        bool success = model.withdrawRewardToken(rewardToken, rewardTokensOwedToUser);
        require(success, "withdrawRewardTokens: Could not withdraw tokens");

        uint256 tokensInPool = model.rewardTokensInPool(insuredContract, rewardToken);
        uint256 remainingTokensInPool = tokensInPool.sub(rewardTokensOwedToUser);
        model.setRewardTokensInPool(insuredContract, rewardToken, remainingTokensInPool);

        setRewardTokensOwedToUser(insuredContract, rewardToken, 0);

        updateRewardPerToken(insuredContract, rewardToken, rewardPerTokenFromStart);
    }

    function updateRewardPerToken(
        address insuredContract,
        address rewardToken,
        uint256 rewardPerTokenFromStart
    ) public override {
        AbstractShieldMiningModel shieldMiningModel = getModel(insuredContract);

        shieldMiningModel.recordCurrentBlock(insuredContract, rewardToken);
        shieldMiningModel.setLastRewardPerToken(
            insuredContract,
            rewardToken,
            rewardPerTokenFromStart
        );
        shieldMiningModel.setRewardPerTokenAccruedByUser(
            insuredContract,
            rewardToken,
            msg.sender,
            rewardPerTokenFromStart
        );
    }

    function setRewardTokensOwedToUser(
        address insuredContract,
        address rewardToken,
        uint256 rewardTokensOwedToUser
    ) public override {
        AbstractShieldMiningModel shieldMiningModel = getModel(insuredContract);

        shieldMiningModel.setRewardTokensOwedToUser(
            insuredContract,
            rewardToken,
            msg.sender,
            rewardTokensOwedToUser
        );
    }

    function setDefaultRewardToken(address insuredContract, address rewardToken) public override {
        getModel(insuredContract).setDefaultRewardToken(insuredContract, rewardToken);
    }

    function setMinDaysOfReward(address insuredContract, uint256 _minDaysOfReward)
        public
        override
    {
        getModel(insuredContract).setMinDaysOfReward(_minDaysOfReward);
    }
}

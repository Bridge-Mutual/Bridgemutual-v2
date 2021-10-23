// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IPolicyBook.sol";
import "../interfaces/IPolicyBookRegistry.sol";
import "../interfaces/shield_mining/IShieldMiningView.sol";

import "../abstract/AbstractDependant.sol";

import "../shield_mining/ShieldMiningModelDependant.sol";

import "../Globals.sol";

contract ShieldMiningView is IShieldMiningView, ShieldMiningModelDependant, AbstractDependant {
    using SafeMath for uint256;

    function setDependencies(IContractsRegistry _contractsRegistry)
        public
        override
        onlyInjectorOrZero
    {
        policyBookRegistryAddress = _contractsRegistry.getPolicyBookRegistryContract();
    }

    function getPolicyBookAddress(address insuredContract)
        public
        virtual
        override
        returns (
            //view
            address policyBookAddress
        )
    {
        IPolicyBookRegistry policyBookRegistry = IPolicyBookRegistry(policyBookRegistryAddress);
        // require(false, "getPolicyBookAddress(insuredContract");
        // policyBookAddress = policyBookRegistry.policyBooksByInsuredAddress(insuredContract);
        policyBookAddress = policyBookRegistry.policyBookFor(insuredContract);
    }

    function getPolicyBook(address insuredContract)
        public
        view
        override
        returns (IPolicyBook coveragePoolModel)
    {
        // address policyBookAddress = getPolicyBookAddress(insuredContract);
        IPolicyBookRegistry policyBookRegistry = IPolicyBookRegistry(policyBookRegistryAddress);
        address policyBookAddress =
            policyBookRegistry.policyBooksByInsuredAddress(insuredContract);
        coveragePoolModel = IPolicyBook(policyBookAddress);
    }

    function getUtilizationRatio(address insuredContract)
        public
        view
        override
        returns (uint256 utilizationRatio)
    {
        uint256 totalCoverTokens = getPolicyBook(insuredContract).totalCoverTokens();
        uint256 totalLiquidity = getPolicyBook(insuredContract).totalLiquidity();
        utilizationRatio = totalCoverTokens.mul(PERCENTAGE_100).div(totalLiquidity);
    }

    function getStakedUsd(address insuredContract)
        public
        view
        override
        returns (uint256 totalLiquidity)
    {
        IPolicyBook policyBook = getPolicyBook(insuredContract);
        totalLiquidity = policyBook.totalLiquidity();
    }

    function getRewardPerBlock(address insuredContract, address rewardToken)
        public
        view
        returns (uint256 rewardPerStakedUsdPerBlock)
    {
        uint256 rewardTokensPerStakedToken =
            getModel(insuredContract).rewardPerDay(insuredContract, rewardToken);
        rewardPerStakedUsdPerBlock = rewardTokensPerStakedToken.div(BLOCKS_PER_DAY);
    }

    function getLatestBlockWithRewards(address insuredContract, address rewardToken)
        public
        view
        returns (uint256 latestBlockWithRewards)
    {
        uint256 lastBlockWithRewards =
            getModel(insuredContract).lastBlockWithRewards(insuredContract, rewardToken);
        latestBlockWithRewards = Math.min(block.number, lastBlockWithRewards);
    }

    function getLastUpdateBlock(address insuredContract, address rewardToken)
        external
        view
        returns (uint256 lastUpdateBlock)
    {
        lastUpdateBlock = getModel(insuredContract).lastUpdateBlock(insuredContract, rewardToken);
    }

    function getBlocksSinceLastUpdate(address insuredContract, address rewardToken)
        public
        view
        returns (
            uint256 lastBlockWithRewards,
            uint256 latestBlockWithRewards,
            uint256 lastUpdateBlock,
            uint256 blocksSinceLastUpdate
        )
    {
        AbstractShieldMiningModel model = getModel(insuredContract);
        lastBlockWithRewards = model.lastBlockWithRewards(insuredContract, rewardToken);
        latestBlockWithRewards = Math.min(block.number, lastBlockWithRewards);
        lastUpdateBlock = model.lastUpdateBlock(insuredContract, rewardToken);
        blocksSinceLastUpdate = latestBlockWithRewards.sub(lastUpdateBlock);
    }

    function getInitialRewardPerToken(address insuredContract)
        external
        view
        returns (uint256 initialRewardPerToken)
    {
        initialRewardPerToken = getModel(insuredContract).initialRewardPerToken();
    }

    function getRewardPerTokenSinceLastUpdate(address insuredContract, address rewardToken)
        public
        view
        returns (uint256 rewardPerTokenSinceLastUpdate)
    {
        uint256 stakedUsd = getStakedUsd(insuredContract);
        bool poolIsEmpty = stakedUsd == 0;

        (, , , uint256 blocksSinceLastUpdate) =
            getBlocksSinceLastUpdate(insuredContract, rewardToken);
        uint256 rewardPerBlock = getRewardPerBlock(insuredContract, rewardToken);

        rewardPerTokenSinceLastUpdate = poolIsEmpty
            ? getModel(insuredContract).initialRewardPerToken()
            : blocksSinceLastUpdate.mul(rewardPerBlock).div(stakedUsd);
    }

    function getLastRewardPerToken(address insuredContract, address rewardToken)
        public
        view
        override
        returns (uint256 lastRewardPerToken)
    {
        lastRewardPerToken = getModel(insuredContract).lastRewardPerToken(
            insuredContract,
            rewardToken
        );
    }

    function getLastRewardPerTokenAccruedByUser(
        address insuredContract,
        address rewardToken,
        address user
    ) public view returns (uint256 lastRewardPerTokenAccruedByUser) {
        lastRewardPerTokenAccruedByUser = _getLastRewardPerTokenAccruedByUser(
            getModel(insuredContract),
            insuredContract,
            rewardToken,
            user
        );
    }

    function _getLastRewardPerTokenAccruedByUser(
        AbstractShieldMiningModel model,
        address insuredContract,
        address rewardToken,
        address user
    ) internal view returns (uint256 lastRewardPerTokenAccruedByUser) {
        lastRewardPerTokenAccruedByUser = model.rewardPerTokenAccruedByUser(
            insuredContract,
            rewardToken,
            user
        );
    }

    function getUsdStakedByUser(address insuredContract)
        public
        view
        returns (uint256 usdStakedByUser)
    {
        // address policyBookAddress = getPolicyBookAddress(insuredContract);
        IPolicyBookRegistry policyBookRegistry = IPolicyBookRegistry(policyBookRegistryAddress);
        address policyBookAddress =
            policyBookRegistry.policyBooksByInsuredAddress(insuredContract);
        usdStakedByUser = IERC20(policyBookAddress).balanceOf(tx.origin);
    }

    function getRewardData(address insuredContract, address rewardToken)
        public
        view
        virtual
        override
        returns (
            uint256 rewardPerTokenSinceLastUpdate,
            uint256 lastRewardPerToken,
            uint256 rewardPerTokenFromStart,
            uint256 lastRewardPerTokenAccruedByUser,
            uint256 rewardPerTokenOwedToUser,
            uint256 rewardTokensOwedToUserSinceLastUpdate,
            uint256 rewardTokensOwedToUser
        )
    {
        AbstractShieldMiningModel model = getModel(insuredContract);

        rewardPerTokenSinceLastUpdate = getRewardPerTokenSinceLastUpdate(
            insuredContract,
            rewardToken
        );

        lastRewardPerToken = getLastRewardPerToken(insuredContract, rewardToken);
        rewardPerTokenFromStart = lastRewardPerToken.add(rewardPerTokenSinceLastUpdate);
        lastRewardPerTokenAccruedByUser = model.rewardPerTokenAccruedByUser(
            insuredContract,
            rewardToken,
            tx.origin
        );

        rewardPerTokenOwedToUser = rewardPerTokenFromStart.sub(lastRewardPerTokenAccruedByUser);

        uint256 usdStakedByUser = getUsdStakedByUser(insuredContract);
        rewardTokensOwedToUserSinceLastUpdate = usdStakedByUser.mul(rewardPerTokenOwedToUser).div(
            1e18
        );
        uint256 currentRewardTokensOwedToUser =
            model.rewardTokensOwedToUser(insuredContract, rewardToken, tx.origin);
        rewardTokensOwedToUser = currentRewardTokensOwedToUser.add(
            rewardTokensOwedToUserSinceLastUpdate
        );
    }

    function getDefaultRewardToken(address insuredContract)
        public
        view
        override
        returns (address defaultToken)
    {
        AbstractShieldMiningModel _model = getModel(insuredContract);
        defaultToken = _model.defaultRewardToken(insuredContract);
    }

    function getMinRewardTokenDeposit(address insuredContract)
        public
        view
        override
        returns (uint256 minRewardTokenAmount)
    {
        uint256 minDaysOfReward = getMinDaysOfReward(insuredContract);
        minRewardTokenAmount = getStakedUsd(insuredContract).mul(minDaysOfReward);
    }

    function getMinDaysOfReward(address insuredContract)
        public
        view
        override
        returns (uint256 minDaysOfReward)
    {
        AbstractShieldMiningModel shieldMiningModel = getModel(insuredContract);
        minDaysOfReward = shieldMiningModel.minDaysOfReward();
    }
}

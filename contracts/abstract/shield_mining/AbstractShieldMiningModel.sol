// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../../interfaces/IPolicyBookRegistry.sol";

abstract contract AbstractShieldMiningModel {
    uint256 public constant ONE_WHOLE_TOKEN = 1e18;

    address public policyBookRegistryAddress;

    // ================= enablers =================

    mapping(address => bool) public isContractAvailableForShieldMining;

    function enableShieldMining(address insuredContract) external virtual;

    mapping(address => mapping(address => bool)) public isTokenAcceptedAsReward;

    function acceptTokenAsReward(address insuredContract, address rewardToken) external virtual;

    // ================= enablers =================

    // ================= reward settings =================

    mapping(address => address) public defaultRewardToken;

    function setDefaultRewardToken(address insuredContract, address rewardToken) external virtual;

    uint256 public minDaysOfReward = 30;

    function setMinDaysOfReward(uint256 _minDaysOfReward) external virtual;

    mapping(address => mapping(address => uint256)) public lastBlockWithRewards;

    mapping(address => mapping(address => uint256)) public rewardPerDay;

    function setRewardPerDay(
        address insuredContract,
        address rewardToken,
        uint256 _rewardPerDay
    ) external virtual;

    function setLastBlockWithRewards(
        address insuredContract,
        address rewardToken,
        uint256 _lastBlockWithRewards
    ) external virtual;

    // ================= reward settings =================

    // ================= reward updates =================

    mapping(address => mapping(address => uint256)) public lastUpdateBlock;

    function recordCurrentBlock(address insuredContract, address rewardToken) external virtual;

    // ================= reward updates =================

    // ================= rewards per token =================

    uint256 public initialRewardPerToken;

    mapping(address => mapping(address => uint256)) public lastRewardPerToken;

    function setLastRewardPerToken(
        address insuredContract,
        address rewardToken,
        uint256 _rewardPerToken
    ) external virtual;

    mapping(address => mapping(address => mapping(address => uint256)))
        public rewardPerTokenAccruedByUser;

    function setRewardPerTokenAccruedByUser(
        address insuredContract,
        address rewardToken,
        address user,
        uint256 _rewardPerTokenAccruedByUser
    ) external virtual;

    // ================= rewards per token =================

    // ================= reward token amounts =================

    mapping(address => mapping(address => mapping(address => uint256)))
        public rewardTokensOwedToUser;

    function setRewardTokensOwedToUser(
        address insuredContract,
        address rewardToken,
        address user,
        uint256 _rewardTokensOwedToUser
    ) external virtual;

    // ================= reward token amounts =================

    // ================= token transfers =================

    function depositRewardToken(address rewardToken, uint256 rewardTokenAmount)
        external
        virtual
        returns (bool success);

    function withdrawRewardToken(address rewardToken, uint256 rewardTokenAmount)
        external
        virtual
        returns (bool success);

    // ================= token transfers =================

    // ================= reward pool updates =================

    mapping(address => mapping(address => uint256)) public rewardTokensInPool;

    function setRewardTokensInPool(
        address insuredContract,
        address rewardToken,
        uint256 rewardTokenAmount
    ) external virtual;

    // ================= reward pool udating =================
}

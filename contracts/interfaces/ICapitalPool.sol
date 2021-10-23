// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

interface ICapitalPool {
    /// @notice distributes the hardSTBL income from the purchase of a policybook
    /// @dev distributes the balances acording to the set percentages
    ///      emits PoolBalancedUpdated event
    /// @param _hardSTBLAmount amount hardSTBL ingressed into the system
    /// @param _epochsNumber uint256 the number of epochs which the policy holder will pay a premium for
    function addPolicyHoldersHardSTBL(uint256 _hardSTBLAmount, uint256 _epochsNumber) external;

    /// @notice distributes the hardSTBL from the coverage providers does not specify
    ///     a policyBook
    /// @dev sender cannot be a policyBook
    ///      emits PoolBalancedUpdated event
    /// @param _hardSTBLAmount amount hardSTBL ingressed into the system
    function addCoverageProvidersHardSTBL(uint256 _hardSTBLAmount) external;

    /// @notice rebalances pools acording to v2 specification and dao enforced policies
    /// @dev  emits PoolBalancesUpdated
    function rebalanceLiquidityCushion() external;

    /// @notice deploys liquidity from the reinsurancepool to the yieldGenerator
    /// @dev the amount being transfer must not be greater than the reinsurance pool
    /// @param _sbtAmount uint256, amount of tokens to transfer to the defiGenerator
    function deployFundsToDefi(uint256 _sbtAmount) external;

    /// @notice fullfuls policybook claims being commited
    /// @param _claimer, address of the claimer recieving the withdraw
    /// @param _stblAmount uint256 amount to be withdrawn
    function fundClaim(address _claimer, uint256 _stblAmount) external;
}

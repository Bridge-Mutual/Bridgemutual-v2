// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

interface ICapitalPool {
    // TODO rename Permium for Premium
    struct PremiumFactors {
        uint256 stblAmount;
        uint256 premiumDurationInDays;
        uint256 protocolFee;
        uint256 lStblDeployedByLP;
        uint256 vStblDeployedByRP;
        uint256 vStblOfCP;
        uint256 totalLiqforPremium;
        uint256 premiumPerDay;
        uint256 premiumPerDeployment;
        uint256 poolUtilizationRation;
        uint256 participatedlStblDeployedByLP;
        uint256 reinsurancePoolPremium;
        uint256 userLeveragePoolPremium;
        uint256 coveragePoolPremium;
    }

    function virtualUsdtAccumulatedBalance() external view returns (uint256);

    /// @notice distributes the policybook premiums into pools (CP, ULP , RP)
    /// @dev distributes the balances acording to the established percentages
    /// @param _stblAmount amount hardSTBL ingressed into the system
    /// @param _epochsNumber uint256 the number of epochs which the policy holder will pay a premium for
    /// @param _protocolFee uint256 the amount of protocol fee earned by premium
    function addPolicyHoldersHardSTBL(
        uint256 _stblAmount,
        uint256 _epochsNumber,
        uint256 _protocolFee
    ) external returns (uint256);

    /// @notice distributes the hardSTBL from the coverage providers
    /// @dev emits PoolBalancedUpdated event
    /// @param _stblAmount amount hardSTBL ingressed into the system
    function addCoverageProvidersHardSTBL(uint256 _stblAmount) external;

    /// @notice distributes the hardSTBL from the leverage providers
    /// @dev emits PoolBalancedUpdated event
    /// @param _stblAmount amount hardSTBL ingressed into the system
    function addLeverageProvidersHardSTBL(uint256 _stblAmount) external;

    /// @notice distributes the hardSTBL from the reinsurance pool
    /// @dev emits PoolBalancedUpdated event
    /// @param _stblAmount amount hardSTBL ingressed into the system
    function addReinsurancePoolHardSTBL(uint256 _stblAmount) external;

    /// @notice rebalances pools acording to v2 specification and dao enforced policies
    /// @dev  emits PoolBalancesUpdated
    function rebalanceLiquidityCushion() external;

    /// @notice Fullfils policybook claims by transfering the balance to claimer
    /// @param _claimer, address of the claimer recieving the withdraw
    /// @param _stblAmount uint256 amount to be withdrawn
    function fundClaim(address _claimer, uint256 _stblAmount) external;

    /// @notice Withdraws liquidity from a specific policbybook to the user
    /// @param _sender, address of the user beneficiary of the withdraw
    /// @param _stblAmount uint256 amount to be withdrawn
    /// @param _isLeveragePool bool wether the pool is ULP or CP(policybook)
    function withdrawLiquidity(
        address _sender,
        uint256 _stblAmount,
        bool _isLeveragePool
    ) external;

    /// @notice Sets the duration in time the capital pool reserves liquidity
    /// @param _newDuration uint2566 amount in seconds for the new period
    function setLiquidityCushionDuration(uint256 _newDuration) external;
}

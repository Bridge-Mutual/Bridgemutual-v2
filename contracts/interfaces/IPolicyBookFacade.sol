// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

interface IPolicyBookFacade {
    /// @notice Let user to buy policy by supplying stable coin, access: ANY
    /// @param _epochsNumber period policy will cover
    /// @param _coverTokens amount paid for the coverage
    function buyPolicy(uint256 _epochsNumber, uint256 _coverTokens) external;

    /// @param _buyer who is buying the coverage
    /// @param _epochsNumber period policy will cover
    /// @param _coverTokens amount paid for the coverage
    function buyPolicyFor(
        address _buyer,
        uint256 _epochsNumber,
        uint256 _coverTokens
    ) external;

    function VUreinsurnacePool() external view returns (uint256);

    function LUreinsurnacePool() external view returns (uint256);

    function LUleveragePool() external view returns (uint256);

    function userleveragedMPL() external view returns (uint256);

    function reinsurancePoolMPL() external view returns (uint256);

    /// @param _epochsNumber period policy will cover
    /// @param _coverTokens amount paid for the coverage
    /// @param _distributor if it was sold buy a whitelisted distributor, it is distributor address to receive fee (commission)
    function buyPolicyFromDistributor(
        uint256 _epochsNumber,
        uint256 _coverTokens,
        address _distributor
    ) external;

    /// @param _buyer who is buying the coverage
    /// @param _epochsNumber period policy will cover
    /// @param _coverTokens amount paid for the coverage
    /// @param _distributor if it was sold buy a whitelisted distributor, it is distributor address to receive fee (commission)
    function buyPolicyFromDistributorFor(
        address _buyer,
        uint256 _epochsNumber,
        uint256 _coverTokens,
        address _distributor
    ) external;

    /// @notice Let user to add liquidity by supplying stable coin, access: ANY
    /// @param _liquidityAmount is amount of stable coin tokens to secure
    function addLiquidity(uint256 _liquidityAmount) external;

    /// @notice Let eligible contracts add liqiudity for another user by supplying stable coin
    /// @param _liquidityHolderAddr is address of address to assign cover
    /// @param _liquidityAmount is amount of stable coin tokens to secure
    function addLiquidityFor(address _liquidityHolderAddr, uint256 _liquidityAmount) external;

    /// @notice Let user to add liquidity by supplying stable coin and stake it,
    /// @dev access: ANY
    function addLiquidityAndStake(uint256 _liquidityAmount, uint256 _stakeSTBLAmount) external;

    /// @notice Let user to withdraw deposited liqiudity, access: ANY
    function withdrawLiquidity() external;

    /// @notice fetches all the pools data
    /// @return uint256 VUreinsurnacePool
    /// @return uint256 LUreinsurnacePool
    /// @return uint256 LUleveragePool
    function getPoolsData()
        external
        view
        returns (
            uint256,
            uint256,
            uint56
        );

    /// @notice updates the pools data
    /// @dev only accessible via capitalpool
    /// @param _vUreinsurnacePool uint256 virtual stbl reinsurance pool
    /// @param _lUreinsurnacePool uint256 leverage stbl reinsurance pool
    /// @param _lUleveragePool uint256 leverage stb pool
    function updatePoolsData(
        uint256 _vUreinsurnacePool,
        uint256 _lUreinsurnacePool,
        uint256 _lUleveragePool
    ) external;
}

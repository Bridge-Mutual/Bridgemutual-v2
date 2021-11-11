// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IShieldMining {
    struct ShieldMiningInfo {
        IERC20 rewardsToken;
        uint8 decimals;
        uint256 rewardPerBlock;
        uint256 firstBlockWithReward;
        uint256 lastBlockWithReward;
        uint256 lastUpdateBlock;
        uint256 rewardPerTokenStored;
        uint256 rewardTokensLocked;
        uint256 totalSupply;
    }

    function blocksWithRewardsPassed(address _policyBook) external view returns (uint256);

    function rewardPerToken(address _policyBook) external view returns (uint256);

    function earned(address _policyBook, address _account) external view returns (uint256);

    function updateTotalSupply(
        address _policyBook,
        uint256 newTotalSupply,
        address liquidityProvider
    ) external;

    function createShieldMining(
        address _shieldToken,
        address _policyBook,
        uint256 _amount,
        uint256 _duration
    ) external;

    function refill(
        address _policyBook,
        uint256 _amount,
        uint256 _duration
    ) external;

    function getReward(address _policyBook) external;

    /// @notice returns APY% with 10**5 precision
    function getAPY(address _policyBook, uint256 _liquidityAdded) external view returns (uint256);

    function recoverNonLockedRewardTokens(address _policyBook) external;

    function getShieldTokenAddress(address _policyBook) external view returns (address);
}

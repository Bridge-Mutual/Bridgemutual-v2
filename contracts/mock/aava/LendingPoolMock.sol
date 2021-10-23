// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./ATokenMock.sol";

contract LendingPoolMock {
    using SafeERC20 for ERC20;

    ATokenMock public aToken;

    constructor(address _aTokenAddress) {
        aToken = ATokenMock(_aTokenAddress);
    }

    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external {
        // Transfer asset
        ERC20 token = ERC20(asset);
        token.safeTransferFrom(msg.sender, address(aToken), amount);

        // Mint aTokens
        aToken.mint(onBehalfOf, amount, aToken.liquidityIndex());
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256) {
        // Burn aTokens
        aToken.burn(msg.sender, to, amount, aToken.liquidityIndex());
        return amount;
    }

    function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external {}

    function getReserveNormalizedIncome(address asset) external view returns (uint256) {
        return aToken.liquidityIndex();
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../../interfaces/IContractsRegistry.sol";
import "../../interfaces/IDefiProtocol.sol";

import "../../abstract/AbstractDependant.sol";

contract MPHProtocol is IDefiProtocol, OwnableUpgradeable, AbstractDependant {
    ERC20 public override stablecoin;
    address public yieldGeneratorAddress;

    modifier onlyYieldGenerator() {
        require(_msgSender() == yieldGeneratorAddress, "MP: Not a yield generator contract");
        _;
    }

    function __MPHProtocol_init() external initializer {
        __Ownable_init();
    }

    function setDependencies(IContractsRegistry _contractsRegistry)
        external
        override
        onlyInjectorOrZero
    {
        yieldGeneratorAddress = _contractsRegistry.getYieldGeneratorContract();
    }

    function deposit(uint256 amount) external override onlyYieldGenerator {}

    function withdraw(uint256 amountInUnderlying)
        external
        override
        onlyYieldGenerator
        returns (uint256 actualAmountWithdrawn)
    {}

    function claimRewards() external override onlyYieldGenerator {}

    function totalValue() external override returns (uint256) {}

    function setRewards(address newValue) external override onlyYieldGenerator {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";

import "../CapitalPool.sol";

import "../libraries/DecimalsConverter.sol";

import "../interfaces/ILeveragePortfolio.sol";
import "../interfaces/IPolicyBook.sol";
import "../interfaces/IPolicyBookFacade.sol";

contract CapitalPoolMock is CapitalPool {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;

    uint256 public makeTransaction;

    // constructor() public {
    //     __Ownable_init();
    //     // liquidityCushionDuration = 8 days;
    //     // liquidityCushionWindowSize = 24 hours;
    // }

    function addVirtualUsdtAccumulatedBalance(uint256 stblAmount) external {
        virtualUsdtAccumulatedBalance = virtualUsdtAccumulatedBalance.add(stblAmount);
    }

    function deposit(uint256 amount) external {
        // deployFundsToDefi(amount);
        stblToken.safeApprove(address(yieldGenerator), 0);
        stblToken.safeApprove(address(yieldGenerator), amount);
        yieldGenerator.deposit(amount);
    }

    function withdraw(uint256 amount) external returns (uint256) {
        return yieldGenerator.withdraw(amount);
    }

    function addPremium(uint256 premiumAmount) external {
        reinsurancePool.addPolicyPremium(0, premiumAmount);
    }

    function addPremium(
        uint256 epochsNumber,
        uint256 premiumAmount,
        address userLeveragePool
    ) external {
        ILeveragePortfolio(userLeveragePool).addPolicyPremium(epochsNumber, premiumAmount);
    }

    function setliquidityCushionBalance(uint256 amount) external {
        liquidityCushionBalance = amount;
    }

    function sethardUsdtAccumulatedBalance(uint256 amount) external {
        hardUsdtAccumulatedBalance = amount;
    }

    function setBalances(
        address[] memory policyBookAddresses,
        uint256[] memory regularCoverageBalances,
        address[] memory leveragePoolAddresses,
        uint256[] memory leveragePoolBalances,
        uint256 _reinsurancePoolBalance
    ) public {
        require(
            policyBookAddresses.length == regularCoverageBalances.length &&
                leveragePoolAddresses.length == leveragePoolBalances.length
        );
        for (uint256 i = 0; i < policyBookAddresses.length; i++) {
            regularCoverageBalance[policyBookAddresses[i]] = regularCoverageBalance[
                policyBookAddresses[i]
            ]
                .add(regularCoverageBalances[i]);
        }
        for (uint256 i = 0; i < leveragePoolAddresses.length; i++) {
            leveragePoolBalance[leveragePoolAddresses[i]] = leveragePoolBalance[
                leveragePoolAddresses[i]
            ]
                .add(leveragePoolBalances[i]);
        }
        reinsurancePoolBalance = reinsurancePoolBalance.add(_reinsurancePoolBalance);
    }
}

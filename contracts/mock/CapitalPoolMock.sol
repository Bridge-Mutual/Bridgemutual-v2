// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../CapitalPool.sol";

import "../libraries/DecimalsConverter.sol";

import "../interfaces/ILeveragePortfolio.sol";
import "../interfaces/IPolicyBook.sol";
import "../interfaces/IPolicyBookFacade.sol";

contract CapitalPoolMock is CapitalPool {
    using SafeERC20 for ERC20;
    uint256 public makeTransaction;

    constructor() public {
        __Ownable_init();
        // liquidityCushionDuration = 8 days;
        // liquidityCushionWindowSize = 24 hours;
    }

    function addVirtualUsdtAccumulatedBalance(uint256 stblAmount) external {
        virtualUsdtAccumulatedBalance += stblAmount;
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

    // function testRebalancingTimeWindow(uint256 _time) external view returns (uint256, uint256) {
    //     return _calcRebalancingTimeWindow(_time);
    // }

    function test_calcReinsurancePoolPremium(
        uint256 baseDeployment,
        uint256 vstbldeployed,
        uint256 duration
    ) external view returns (uint256) {
        PremiumFactors memory factors;

        factors.premiumPerDeployment;
        factors.vStblDeployedByRP = vstbldeployed;
        factors.premiumDurationInDays = duration;

        return _calcReinsurancePoolPremium(factors);
    }

    function test_calcUserLeveragePoolPremium(
        uint256 _baseDeployment,
        uint256 stbldeployedByLP,
        uint256 duration
    ) external view returns (uint256) {
        PremiumFactors memory factors;

        factors.premiumPerDeployment = _baseDeployment;
        factors.participatedlStblDeployedByLP = stbldeployedByLP;
        factors.premiumDurationInDays = duration;

        return _calcUserLeveragePoolPremium(factors);
    }

    function test_calcCoveragePoolPremium(
        uint256 baseDeployment,
        uint256 virtualStable,
        uint256 duration
    ) external view returns (uint256) {
        PremiumFactors memory factors;

        factors.premiumPerDeployment;
        factors.vStblOfCP;
        factors.premiumDurationInDays;

        return _calcCoveragePoolPremium(factors);
    }

    function _setupPremiumCalculation(
        uint256 participatedlStblDeployedByLP,
        uint256 premiumDurationInDays,
        uint256 protocolFee,
        uint256 stblAmount,
        uint256 vStblDeployedByRP,
        uint256 vStblOfCP
    ) internal view returns (PremiumFactors memory) {
        PremiumFactors memory factors;

        factors.participatedlStblDeployedByLP = participatedlStblDeployedByLP;
        factors.premiumDurationInDays = premiumDurationInDays;
        //factors.protocolFee = protocolFee;
        factors.stblAmount = stblAmount;
        factors.vStblDeployedByRP = vStblDeployedByRP;
        factors.vStblOfCP = vStblOfCP;

        // TOOD test premium calculation

        return factors;
    }

    function getState(address _pb)
        external
        view
        returns (
            uint256 _reinsurancePoolBalance,
            uint256 _leveragePoolBalance,
            uint256 _regularCoverageBalance,
            uint256 _hardUsdtAccumulatedBalance,
            uint256 _virtualUsdtAccumulatedBalance,
            uint256 _liquidityCushionBalance,
            uint256 _pbVUreinsP,
            uint256 _pbLUreinsP,
            uint256 _pbLULevePool
        )
    {
        IPolicyBook _policyBook = IPolicyBook(_pb);
        address userLeveragePoolAddress;
        (_pbVUreinsP, _pbLUreinsP, _pbLULevePool, userLeveragePoolAddress) = _policyBook
            .policyBookFacade()
            .getPoolsData();

        return (
            reinsurancePoolBalance,
            leveragePoolBalance[userLeveragePoolAddress],
            regularCoverageBalance[_pb],
            hardUsdtAccumulatedBalance,
            virtualUsdtAccumulatedBalance,
            liquidityCushionBalance,
            _pbVUreinsP,
            _pbLUreinsP,
            _pbLULevePool
        );
    }
}

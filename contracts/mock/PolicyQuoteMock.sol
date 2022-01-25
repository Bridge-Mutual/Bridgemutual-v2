// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../interfaces/IPolicyQuote.sol";

contract PolicyQuoteMock is IPolicyQuote {
    uint256 public mockQuote;

    function setQuote(uint256 _quote) external {
        mockQuote = _quote;
    }

    function getQuotePredefined(
        uint256 _durationSeconds,
        uint256 _tokens,
        uint256 _totalCoverTokens,
        uint256 _totalLiquidity,
        uint256 _totalLeveragedLiquidity,
        bool _safePricingModel
    ) external view override returns (uint256, uint256) {
        return (mockQuote, 0);
    }

    function getQuote(
        uint256 _durationSeconds,
        uint256 _tokens,
        address _policyBookAddr
    ) external view override returns (uint256) {
        return mockQuote;
    }

    function setupPricingModel(
        uint256 _riskyAssetThresholdPercentage,
        uint256 _minimumCostPercentage,
        uint256 _minimumInsuranceCost,
        uint256 _lowRiskMaxPercentPremiumCost,
        uint256 _lowRiskMaxPercentPremiumCost100Utilization,
        uint256 _highRiskMaxPercentPremiumCost,
        uint256 _highRiskMaxPercentPremiumCost100Utilization
    ) external override {}

    function getMINUR(bool _safePricingModel) external view override returns (uint256 _minUR) {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../ReinsurancePool.sol";

contract ReinsurancePoolMock is ReinsurancePool {
    using EnumerableSet for EnumerableSet.AddressSet;

    function setVtotalLiquidity(uint256 _vStableTotalLiquidity) external {
        totalLiquidity = _vStableTotalLiquidity;
    }

    function reevaluateProvidedLeverageStable(uint256 amount) external {
        _reevaluateProvidedLeverageStable(LeveragePortfolio.REINSURANCEPOOL, amount);
    }

    function addLiquidity(uint256 amount) external {
        capitalPool.addReinsurancePoolHardSTBL(amount);
    }

    function addInvestedPools(address policyBookAddress) external {
        leveragedCoveragePools.add(policyBookAddress);
    }
}

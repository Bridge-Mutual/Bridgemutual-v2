// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../PolicyBookFacade.sol";

contract PolicyBookFacadeMock is PolicyBookFacade {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    function deployLeverageFundsByLP(address levragePool) external returns (uint256) {
        return
            ILeveragePortfolio(levragePool).deployLeverageStableToCoveragePools(
                ILeveragePortfolio.LeveragePortfolio.USERLEVERAGEPOOL
            );
    }

    function addLeveragePools(address userLeveragePool) external {
        userLeveragePools.add(userLeveragePool);
    }

    function deployLeverageFundsByRP() external returns (uint256) {
        return
            reinsurancePool.deployLeverageStableToCoveragePools(
                ILeveragePortfolio.LeveragePortfolio.REINSURANCEPOOL
            );
    }

    function deployVirtualFundsByRP() external returns (uint256) {
        return reinsurancePool.deployVirtualStableToCoveragePools();
    }
}

interface IPolicyBookFacadeMock {
    function addLeveragePools(address userLeveragePool) external;
}

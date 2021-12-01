// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../PolicyBookFacade.sol";

contract PolicyBookFacadeMock is PolicyBookFacade {
    function deployLeverageFundsByLP(address levragePool) external returns (uint256) {
        return
            ILeveragePortfolio(levragePool).deployLeverageStableToCoveragePools(
                ILeveragePortfolio.LeveragePortfolio.USERLEVERAGEPOOL
            );
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

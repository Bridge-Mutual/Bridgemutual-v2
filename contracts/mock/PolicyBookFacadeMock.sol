// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../PolicyBookFacade.sol";

contract PolicyBookFacadeMock is PolicyBookFacade {
    function deployLeverageFundsByLP() external returns (bool, uint256) {
        return
            userLeveragePool.deployLeverageStableToCoveragePools(
                userleveragedMPL,
                reinsurancePoolMPL
            );
    }

    function deployLeverageFundsByRP() external returns (bool, uint256) {
        return
            reinsurancePool.deployLeverageStableToCoveragePools(
                reinsurancePoolMPL,
                userleveragedMPL
            );
    }

    function deployVirtualFundsByRP() external returns (uint256) {
        return reinsurancePool.deployVirtualStableToCoveragePools();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../ReinsurancePool.sol";

contract ReinsurancePoolMock is ReinsurancePool {
    function setVtotalLiquidity(uint256 _vStableTotalLiquidity) external {
        totalLiquidity = _vStableTotalLiquidity;
    }
}

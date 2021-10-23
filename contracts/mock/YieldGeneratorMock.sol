// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../YieldGenerator.sol";
import "../Globals.sol";

contract YieldGeneratorMock is YieldGenerator {
    function setvStblVolume(uint256 _vStblVolume) public {
        vStblVolume = _vStblVolume;
    }
}

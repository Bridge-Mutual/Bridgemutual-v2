// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../defiprotocols/yearn/YearnProtocol.sol";

contract YearnProtocolMock is YearnProtocol {
    function updatePriceAndBlock() public {
        _updatePriceAndBlock();
    }
}

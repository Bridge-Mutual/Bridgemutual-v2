// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../PolicyRegistry.sol";

contract PolicyRegistryMock is PolicyRegistry {
    function setPolicyTime(
        address userAddr,
        address policyBookAddr,
        uint256 startTime,
        uint256 endTime
    ) external {
        policyInfos[userAddr][policyBookAddr].startTime = startTime;
        policyInfos[userAddr][policyBookAddr].endTime = endTime;
    }
}

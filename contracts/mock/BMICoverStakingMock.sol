// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../BMICoverStaking.sol";

contract BMICoverStakingMock is BMICoverStaking {
    function nftMintId() external view returns (uint256) {
        return _nftMintId;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../UserLeveragePool.sol";
import "./PolicyBookFacadeMock.sol";
import "../interfaces/IPolicyBook.sol";

contract UserLeveragePoolMock is UserLeveragePool {
    using EnumerableSet for EnumerableSet.AddressSet;

    function triggerPremiumsDistribution() external withPremiumsDistribution {}

    function getSTBLToBMIXRatio() external view returns (uint256) {
        (, uint256 currentLiquidity) = getNewCoverAndLiquidity();

        return _getSTBLToBMIXRatio(currentLiquidity);
    }

    function setVtotalLiquidity(uint256 _vStableTotalLiquidity) external {
        totalLiquidity = _vStableTotalLiquidity;
    }

    function mint(uint256 _amountToMint) external {
        _mint(_msgSender(), _amountToMint);
    }

    function burn(uint256 _amountToBurn) external {
        _burn(_msgSender(), _amountToBurn);
    }

    function addInvestedPools(address policyBookAddress) external {
        leveragedCoveragePools.add(policyBookAddress);
        address policyBookFacadeAdd = address(IPolicyBook(policyBookAddress).policyBookFacade());
        IPolicyBookFacadeMock(policyBookFacadeAdd).addLeveragePools(address(this));
    }
}

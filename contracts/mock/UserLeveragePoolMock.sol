// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../UserLeveragePool.sol";

contract UserLeveragePoolMock is UserLeveragePool {
    function __UserLeveragePool_init() external initializer {
        this.__UserLeveragePool_init(
            IPolicyBookFabric.ContractType.VARIOUS,
            "User Leverage Pool",
            "USDT"
        );
    }

    function triggerPremiumsDistribution() external withPremiumsDistribution {}

    function getSTBLToBMIXRatio() external view returns (uint256) {
        uint256 currentLiquidity = getNewLiquidity();

        return _getSTBLToBMIXRatio(currentLiquidity);
    }

    function setVtotalLiquidity(uint256 _vStableTotalLiquidity) external {
        vStableTotalLiquidity = _vStableTotalLiquidity;
    }

    function mint(uint256 _amountToMint) external {
        _mint(_msgSender(), _amountToMint);
    }

    function burn(uint256 _amountToBurn) external {
        _burn(_msgSender(), _amountToBurn);
    }
}

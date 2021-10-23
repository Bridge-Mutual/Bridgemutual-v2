// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

library libTether {
    using SafeERC20 for ERC20;

    /// @notice sets the tether allowance between another contract
    /// @dev stblToken requires allowance to be set to zero before modifying its value
    /// @param _spender, address to modify the allowance
    /// @param _amount, uint256 amount of tokens to allow
    function setTetherAllowance(
        ERC20 _self,
        address _spender,
        uint256 _amount
    ) public {
        uint256 _contractAllowance = _self.allowance(address(this), _spender);

        bool exceedsAllowance = (_amount > _contractAllowance);
        bool allowanceIsZero = (_contractAllowance == 0);

        if (exceedsAllowance) {
            if (!allowanceIsZero) {
                _self.safeDecreaseAllowance(_spender, 0);
            }
            _self.safeIncreaseAllowance(_spender, _amount);
        }
    }
}

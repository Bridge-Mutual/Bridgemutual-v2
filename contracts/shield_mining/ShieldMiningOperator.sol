// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../interfaces/IContractsRegistry.sol";
import "../interfaces/shield_mining/IShieldMiningView.sol";
import "../interfaces/shield_mining/IShieldMiningController.sol";

contract ShieldMiningOperator {
    IShieldMiningView public shieldMiningView;
    IShieldMiningController public shieldMiningController;

    function setShieldMiningViewAndController(IContractsRegistry _contractsRegistry) public {
        shieldMiningView = IShieldMiningView(_contractsRegistry.getShieldMiningViewContract());
        shieldMiningController = IShieldMiningController(
            _contractsRegistry.getShieldMiningControllerContract()
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../interfaces/IContractsRegistry.sol";
import "../interfaces/shield_mining/IShieldMiningView.sol";

contract ShieldMiningViewDependant {
    IShieldMiningView public shieldMiningView;

    function setShieldMiningView(IContractsRegistry _contractsRegistry) external {
        shieldMiningView = IShieldMiningView(_contractsRegistry.getShieldMiningViewContract());
    }
}

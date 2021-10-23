// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "./ShieldMiningViewDependant.sol";

import "../interfaces/IPolicyBook.sol";
import "../interfaces/IPolicyBookRegistry.sol";

import "../abstract/shield_mining/AbstractShieldMiningModel.sol";

contract ShieldMiningModelDependant {
    address public policyBookRegistryAddress;

    function getModel(address insuredContract)
        internal
        view
        returns (AbstractShieldMiningModel shieldMiningModel)
    {
        IPolicyBookRegistry policyBookRegistry = IPolicyBookRegistry(policyBookRegistryAddress);
        IPolicyBook policyBook =
            IPolicyBook(policyBookRegistry.policyBooksByInsuredAddress(insuredContract));
        shieldMiningModel = AbstractShieldMiningModel(policyBook.shieldMiningModel());
    }
}

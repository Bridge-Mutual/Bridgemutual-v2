# `ContractsRegistry`



## Event RoleAdminChanged
## Signature `event` RoleAdminChanged(bytes32,bytes32,bytes32)


Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
`DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
{RoleAdminChanged} not being emitted signaling this.
_Available since v3.1._

**Params**

## Event RoleGranted
## Signature `event` RoleGranted(bytes32,address,address)


Emitted when `account` is granted `role`.
`sender` is the account that originated the contract call, an admin role
bearer except when using {_setupRole}.

**Params**

## Event RoleRevoked
## Signature `event` RoleRevoked(bytes32,address,address)


Emitted when `account` is revoked `role`.
`sender` is the account that originated the contract call:
  - if using `revokeRole`, it is the admin role bearer
  - if using `renounceRole`, it is the role bearer (i.e. `account`)

**Params**


# Function __ContractsRegistry_init

Dev 
## Signature __ContractsRegistry_init()
## `__ContractsRegistry_init()` (external)
*Params**

**Returns**
-----
# Function getUniswapRouterContract

Dev 
## Signature getUniswapRouterContract()
## `getUniswapRouterContract() → address` (external)
*Params**

**Returns**
-----
# Function getUniswapBMIToETHPairContract

Dev 
## Signature getUniswapBMIToETHPairContract()
## `getUniswapBMIToETHPairContract() → address` (external)
*Params**

**Returns**
-----
# Function getUniswapBMIToUSDTPairContract

Dev 
## Signature getUniswapBMIToUSDTPairContract()
## `getUniswapBMIToUSDTPairContract() → address` (external)
*Params**

**Returns**
-----
# Function getSushiswapRouterContract

Dev 
## Signature getSushiswapRouterContract()
## `getSushiswapRouterContract() → address` (external)
*Params**

**Returns**
-----
# Function getSushiswapBMIToETHPairContract

Dev 
## Signature getSushiswapBMIToETHPairContract()
## `getSushiswapBMIToETHPairContract() → address` (external)
*Params**

**Returns**
-----
# Function getSushiswapBMIToUSDTPairContract

Dev 
## Signature getSushiswapBMIToUSDTPairContract()
## `getSushiswapBMIToUSDTPairContract() → address` (external)
*Params**

**Returns**
-----
# Function getSushiSwapMasterChefV2Contract

Dev 
## Signature getSushiSwapMasterChefV2Contract()
## `getSushiSwapMasterChefV2Contract() → address` (external)
*Params**

**Returns**
-----
# Function getWETHContract

Dev 
## Signature getWETHContract()
## `getWETHContract() → address` (external)
*Params**

**Returns**
-----
# Function getUSDTContract

Dev 
## Signature getUSDTContract()
## `getUSDTContract() → address` (external)
*Params**

**Returns**
-----
# Function getBMIContract

Dev 
## Signature getBMIContract()
## `getBMIContract() → address` (external)
*Params**

**Returns**
-----
# Function getPriceFeedContract

Dev 
## Signature getPriceFeedContract()
## `getPriceFeedContract() → address` (external)
*Params**

**Returns**
-----
# Function getPolicyBookRegistryContract

Dev 
## Signature getPolicyBookRegistryContract()
## `getPolicyBookRegistryContract() → address` (external)
*Params**

**Returns**
-----
# Function getPolicyBookFabricContract

Dev 
## Signature getPolicyBookFabricContract()
## `getPolicyBookFabricContract() → address` (external)
*Params**

**Returns**
-----
# Function getBMICoverStakingContract

Dev 
## Signature getBMICoverStakingContract()
## `getBMICoverStakingContract() → address` (external)
*Params**

**Returns**
-----
# Function getBMICoverStakingViewContract

Dev 
## Signature getBMICoverStakingViewContract()
## `getBMICoverStakingViewContract() → address` (external)
*Params**

**Returns**
-----
# Function getLegacyRewardsGeneratorContract

Dev 
## Signature getLegacyRewardsGeneratorContract()
## `getLegacyRewardsGeneratorContract() → address` (external)
*Params**

**Returns**
-----
# Function getRewardsGeneratorContract

Dev 
## Signature getRewardsGeneratorContract()
## `getRewardsGeneratorContract() → address` (external)
*Params**

**Returns**
-----
# Function getBMIUtilityNFTContract

Dev 
## Signature getBMIUtilityNFTContract()
## `getBMIUtilityNFTContract() → address` (external)
*Params**

**Returns**
-----
# Function getNFTStakingContract

Dev 
## Signature getNFTStakingContract()
## `getNFTStakingContract() → address` (external)
*Params**

**Returns**
-----
# Function getLiquidityMiningContract

Dev 
## Signature getLiquidityMiningContract()
## `getLiquidityMiningContract() → address` (external)
*Params**

**Returns**
-----
# Function getClaimingRegistryContract

Dev 
## Signature getClaimingRegistryContract()
## `getClaimingRegistryContract() → address` (external)
*Params**

**Returns**
-----
# Function getPolicyRegistryContract

Dev 
## Signature getPolicyRegistryContract()
## `getPolicyRegistryContract() → address` (external)
*Params**

**Returns**
-----
# Function getLiquidityRegistryContract

Dev 
## Signature getLiquidityRegistryContract()
## `getLiquidityRegistryContract() → address` (external)
*Params**

**Returns**
-----
# Function getClaimVotingContract

Dev 
## Signature getClaimVotingContract()
## `getClaimVotingContract() → address` (external)
*Params**

**Returns**
-----
# Function getReputationSystemContract

Dev 
## Signature getReputationSystemContract()
## `getReputationSystemContract() → address` (external)
*Params**

**Returns**
-----
# Function getReinsurancePoolContract

Dev 
## Signature getReinsurancePoolContract()
## `getReinsurancePoolContract() → address` (external)
*Params**

**Returns**
-----
# Function getUserLeveragePoolContract

Dev 
## Signature getUserLeveragePoolContract()
## `getUserLeveragePoolContract() → address` (external)
*Params**

**Returns**
-----
# Function getYieldGeneratorContract

Dev 
## Signature getYieldGeneratorContract()
## `getYieldGeneratorContract() → address` (external)
*Params**

**Returns**
-----
# Function getCapitalPoolContract

Dev 
## Signature getCapitalPoolContract()
## `getCapitalPoolContract() → address` (external)
*Params**

**Returns**
-----
# Function getPolicyBookAdminContract

Dev 
## Signature getPolicyBookAdminContract()
## `getPolicyBookAdminContract() → address` (external)
*Params**

**Returns**
-----
# Function getPolicyQuoteContract

Dev 
## Signature getPolicyQuoteContract()
## `getPolicyQuoteContract() → address` (external)
*Params**

**Returns**
-----
# Function getLegacyBMIStakingContract

Dev 
## Signature getLegacyBMIStakingContract()
## `getLegacyBMIStakingContract() → address` (external)
*Params**

**Returns**
-----
# Function getBMIStakingContract

Dev 
## Signature getBMIStakingContract()
## `getBMIStakingContract() → address` (external)
*Params**

**Returns**
-----
# Function getSTKBMIContract

Dev 
## Signature getSTKBMIContract()
## `getSTKBMIContract() → address` (external)
*Params**

**Returns**
-----
# Function getLegacyLiquidityMiningStakingContract

Dev 
## Signature getLegacyLiquidityMiningStakingContract()
## `getLegacyLiquidityMiningStakingContract() → address` (external)
*Params**

**Returns**
-----
# Function getLiquidityMiningStakingETHContract

Dev 
## Signature getLiquidityMiningStakingETHContract()
## `getLiquidityMiningStakingETHContract() → address` (external)
*Params**

**Returns**
-----
# Function getLiquidityMiningStakingUSDTContract

Dev 
## Signature getLiquidityMiningStakingUSDTContract()
## `getLiquidityMiningStakingUSDTContract() → address` (external)
*Params**

**Returns**
-----
# Function getVBMIContract

Dev 
## Signature getVBMIContract()
## `getVBMIContract() → address` (external)
*Params**

**Returns**
-----
# Function getAaveProtocolContract

Dev 
## Signature getAaveProtocolContract()
## `getAaveProtocolContract() → address` (external)
*Params**

**Returns**
-----
# Function getAaveLendPoolAddressProvdierContract

Dev 
## Signature getAaveLendPoolAddressProvdierContract()
## `getAaveLendPoolAddressProvdierContract() → address` (external)
*Params**

**Returns**
-----
# Function getAaveATokenContract

Dev 
## Signature getAaveATokenContract()
## `getAaveATokenContract() → address` (external)
*Params**

**Returns**
-----
# Function getCompoundProtocolContract

Dev 
## Signature getCompoundProtocolContract()
## `getCompoundProtocolContract() → address` (external)
*Params**

**Returns**
-----
# Function getCompoundCTokenContract

Dev 
## Signature getCompoundCTokenContract()
## `getCompoundCTokenContract() → address` (external)
*Params**

**Returns**
-----
# Function getCompoundComptrollerContract

Dev 
## Signature getCompoundComptrollerContract()
## `getCompoundComptrollerContract() → address` (external)
*Params**

**Returns**
-----
# Function getYearnProtocolContract

Dev 
## Signature getYearnProtocolContract()
## `getYearnProtocolContract() → address` (external)
*Params**

**Returns**
-----
# Function getYearnVaultContract

Dev 
## Signature getYearnVaultContract()
## `getYearnVaultContract() → address` (external)
*Params**

**Returns**
-----
# Function getMPHProtocolContract

Dev 
## Signature getMPHProtocolContract()
## `getMPHProtocolContract() → address` (external)
*Params**

**Returns**
-----
# Function getBarnBridgeProtocolContract

Dev 
## Signature getBarnBridgeProtocolContract()
## `getBarnBridgeProtocolContract() → address` (external)
*Params**

**Returns**
-----
# Function getShieldMiningContract

Dev 
## Signature getShieldMiningContract()
## `getShieldMiningContract() → address` (external)
*Params**

**Returns**
-----
# Function getContract

Dev 
## Signature getContract(bytes32)
## `getContract(bytes32 name) → address` (public)
*Params**

**Returns**
-----
# Function hasContract

Dev 
## Signature hasContract(bytes32)
## `hasContract(bytes32 name) → bool` (external)
*Params**

**Returns**
-----
# Function injectDependencies

Dev 
## Signature injectDependencies(bytes32)
## `injectDependencies(bytes32 name)` (external)
*Params**

**Returns**
-----
# Function getUpgrader

Dev 
## Signature getUpgrader()
## `getUpgrader() → address` (external)
*Params**

**Returns**
-----
# Function getImplementation

Dev 
## Signature getImplementation(bytes32)
## `getImplementation(bytes32 name) → address` (external)
*Params**

**Returns**
-----
# Function upgradeContract

Dev 
## Signature upgradeContract(bytes32,address)
## `upgradeContract(bytes32 name, address newImplementation)` (external)
*Params**

**Returns**
-----
# Function upgradeContractAndCall
can only call functions that have no parameters
Dev 
## Signature upgradeContractAndCall(bytes32,address,string)
## `upgradeContractAndCall(bytes32 name, address newImplementation, string functionSignature)` (external)
*Params**

**Returns**
-----
# Function _upgradeContract

Dev 
## Signature _upgradeContract(bytes32,address,string)
## `_upgradeContract(bytes32 name, address newImplementation, string functionSignature)` (internal)
*Params**

**Returns**
-----
# Function addContract

Dev 
## Signature addContract(bytes32,address)
## `addContract(bytes32 name, address contractAddress)` (external)
*Params**

**Returns**
-----
# Function addProxyContract

Dev 
## Signature addProxyContract(bytes32,address)
## `addProxyContract(bytes32 name, address contractAddress)` (external)
*Params**

**Returns**
-----
# Function justAddProxyContract

Dev 
## Signature justAddProxyContract(bytes32,address)
## `justAddProxyContract(bytes32 name, address contractAddress)` (external)
*Params**

**Returns**
-----
# Function deleteContract

Dev 
## Signature deleteContract(bytes32)
## `deleteContract(bytes32 name)` (external)
*Params**

**Returns**
-----
# Function __AccessControl_init

Dev 
## Signature __AccessControl_init()
## `__AccessControl_init()` (internal)
*Params**

**Returns**
-----
# Function __AccessControl_init_unchained

Dev 
## Signature __AccessControl_init_unchained()
## `__AccessControl_init_unchained()` (internal)
*Params**

**Returns**
-----
# Function hasRole

Dev Returns `true` if `account` has been granted `role`.
## Signature hasRole(bytes32,address)
## `hasRole(bytes32 role, address account) → bool` (public)
*Params**

**Returns**
-----
# Function getRoleMemberCount

Dev Returns the number of accounts that have `role`. Can be used
together with {getRoleMember} to enumerate all bearers of a role.
## Signature getRoleMemberCount(bytes32)
## `getRoleMemberCount(bytes32 role) → uint256` (public)
*Params**

**Returns**
-----
# Function getRoleMember

Dev Returns one of the accounts that have `role`. `index` must be a
value between 0 and {getRoleMemberCount}, non-inclusive.
Role bearers are not sorted in any particular way, and their ordering may
change at any point.
WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
you perform all queries on the same block. See the following
https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
for more information.
## Signature getRoleMember(bytes32,uint256)
## `getRoleMember(bytes32 role, uint256 index) → address` (public)
*Params**

**Returns**
-----
# Function getRoleAdmin

Dev Returns the admin role that controls `role`. See {grantRole} and
{revokeRole}.
To change a role's admin, use {_setRoleAdmin}.
## Signature getRoleAdmin(bytes32)
## `getRoleAdmin(bytes32 role) → bytes32` (public)
*Params**

**Returns**
-----
# Function grantRole

Dev Grants `role` to `account`.
If `account` had not been already granted `role`, emits a {RoleGranted}
event.
Requirements:
- the caller must have ``role``'s admin role.
## Signature grantRole(bytes32,address)
## `grantRole(bytes32 role, address account)` (public)
*Params**

**Returns**
-----
# Function revokeRole

Dev Revokes `role` from `account`.
If `account` had been granted `role`, emits a {RoleRevoked} event.
Requirements:
- the caller must have ``role``'s admin role.
## Signature revokeRole(bytes32,address)
## `revokeRole(bytes32 role, address account)` (public)
*Params**

**Returns**
-----
# Function renounceRole

Dev Revokes `role` from the calling account.
Roles are often managed via {grantRole} and {revokeRole}: this function's
purpose is to provide a mechanism for accounts to lose their privileges
if they are compromised (such as when a trusted device is misplaced).
If the calling account had been granted `role`, emits a {RoleRevoked}
event.
Requirements:
- the caller must be `account`.
## Signature renounceRole(bytes32,address)
## `renounceRole(bytes32 role, address account)` (public)
*Params**

**Returns**
-----
# Function _setupRole

Dev Grants `role` to `account`.
If `account` had not been already granted `role`, emits a {RoleGranted}
event. Note that unlike {grantRole}, this function doesn't perform any
checks on the calling account.
[WARNING]
====
This function should only be called from the constructor when setting
up the initial roles for the system.
Using this function in any other way is effectively circumventing the admin
system imposed by {AccessControl}.
====
## Signature _setupRole(bytes32,address)
## `_setupRole(bytes32 role, address account)` (internal)
*Params**

**Returns**
-----
# Function _setRoleAdmin

Dev Sets `adminRole` as ``role``'s admin role.
Emits a {RoleAdminChanged} event.
## Signature _setRoleAdmin(bytes32,bytes32)
## `_setRoleAdmin(bytes32 role, bytes32 adminRole)` (internal)
*Params**

**Returns**
-----
# Function __Context_init

Dev 
## Signature __Context_init()
## `__Context_init()` (internal)
*Params**

**Returns**
-----
# Function __Context_init_unchained

Dev 
## Signature __Context_init_unchained()
## `__Context_init_unchained()` (internal)
*Params**

**Returns**
-----
# Function _msgSender

Dev 
## Signature _msgSender()
## `_msgSender() → address payable` (internal)
*Params**

**Returns**
-----
# Function _msgData

Dev 
## Signature _msgData()
## `_msgData() → bytes` (internal)
*Params**

**Returns**
-----


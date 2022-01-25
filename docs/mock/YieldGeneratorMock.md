# `YieldGeneratorMock`



## Event DefiDeposited
## Signature `event` DefiDeposited(uint256,uint256,uint256)




**Params**

## Event DefiWithdrawn
## Signature `event` DefiWithdrawn(uint256,uint256,uint256)




**Params**

## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function __YieldGenerator_init

Dev 
## Signature __YieldGenerator_init()
## `__YieldGenerator_init()` (external)
*Params**

**Returns**
-----
# Function setDependencies

Dev 
## Signature setDependencies(contract IContractsRegistry)
## `setDependencies(contract IContractsRegistry _contractsRegistry)` (external)
*Params**

**Returns**
-----
# Function deposit
deposit stable coin into multiple defi protocols using formulas, access: capital pool

Dev 
## Signature deposit(uint256)
## `deposit(uint256 amount)` (external)
*Params**
 - `amount`: uint256 the amount of stable coin to deposit

**Returns**
-----
# Function withdraw
withdraw stable coin from mulitple defi protocols using formulas, access: capital pool

Dev 
## Signature withdraw(uint256)
## `withdraw(uint256 amount) → uint256` (external)
*Params**
 - `amount`: uint256 the amount of stable coin to withdraw

**Returns**
-----
# Function setProtocolSettings
set the protocol settings for each defi protocol (allocations, whitelisted, threshold), access: owner

Dev 
## Signature setProtocolSettings(bool[],uint256[],bool[])
## `setProtocolSettings(bool[] whitelisted, uint256[] allocations, bool[] threshold)` (external)
*Params**
 - `whitelisted`: bool[] list of whitelisted values for each protocol

 - `allocations`: uint256[] list of allocations value for each protocol

 - `threshold`: bool[] list of threshold values for each protocol

**Returns**
-----
# Function claimRewards
claim rewards for all defi protocols and send them to reinsurance pool, access: owner
Dev 
## Signature claimRewards()
## `claimRewards()` (external)
*Params**

**Returns**
-----
# Function defiProtocol
returns defi protocol info by its index

Dev 
## Signature defiProtocol(uint256)
## `defiProtocol(uint256 index) → struct IYieldGenerator.DefiProtocol _defiProtocol` (external)
*Params**
 - `index`: uint256 the index of the defi protocol

**Returns**
-----
# Function _aggregateDepositWithdrawFunction

Dev 
## Signature _aggregateDepositWithdrawFunction(uint256,bool)
## `_aggregateDepositWithdrawFunction(uint256 amount, bool isDeposit) → uint256 _actualAmountWithdrawn` (internal)
*Params**

**Returns**
-----
# Function _depoist
deposit into defi protocols

Dev 
## Signature _depoist(uint256,uint256,uint256)
## `_depoist(uint256 _protocolIndex, uint256 _amount, uint256 _depositedPercentage)` (internal)
*Params**
 - `_protocolIndex`: uint256 the predefined index of the defi protocol

 - `_amount`: uint256 amount of stable coin to deposit

 - `_depositedPercentage`: uint256 the percentage of deposited amount into the protocol

**Returns**
-----
# Function _withdraw
withdraw from defi protocols

Dev 
## Signature _withdraw(uint256,uint256,uint256)
## `_withdraw(uint256 _protocolIndex, uint256 _amount, uint256 _withdrawnPercentage) → uint256` (internal)
*Params**
 - `_protocolIndex`: uint256 the predefined index of the defi protocol

 - `_amount`: uint256 amount of stable coin to withdraw

 - `_withdrawnPercentage`: uint256 the percentage of withdrawn amount from the protocol

**Returns**
-----
# Function _howManyProtocols
get the number of protocols need to rebalance

Dev 
## Signature _howManyProtocols(uint256,bool)
## `_howManyProtocols(uint256 rebalanceAmount, bool isDeposit) → uint256` (public)
*Params**
 - `rebalanceAmount`: uint256 the amount of stable coin will depsoit or withdraw

**Returns**
-----
# Function _updateDefiProtocols
update defi protocols rebalance weight and threshold status

Dev 
## Signature _updateDefiProtocols(bool)
## `_updateDefiProtocols(bool isDeposit)` (internal)
*Params**
 - `isDeposit`: bool determine the rebalance is for deposit or withdraw

**Returns**
-----
# Function _getProtocolOfMaxWeight
get the defi protocol has max weight to deposit

Dev only select the positive weight from largest to smallest
## Signature _getProtocolOfMaxWeight()
## `_getProtocolOfMaxWeight() → uint256` (internal)
*Params**

**Returns**
-----
# Function _updateProtocolCurrentAllocation
update the current allocation of defi protocol after deposit or withdraw

Dev 
## Signature _updateProtocolCurrentAllocation(uint256,uint256,bool)
## `_updateProtocolCurrentAllocation(uint256 _protocolIndex, uint256 _amount, bool _isDeposit)` (internal)
*Params**
 - `_protocolIndex`: uint256 the predefined index of defi protocol

 - `_amount`: uint256 the amount of stable coin will depsoit or withdraw

 - `_isDeposit`: bool determine the rebalance is for deposit or withdraw

**Returns**
-----
# Function _calcRebalanceAllocation
calc the rebelance allocation % for one protocol for deposit/withdraw

Dev 
## Signature _calcRebalanceAllocation(uint256,uint256)
## `_calcRebalanceAllocation(uint256 _protocolIndex, uint256 _totalWeight) → uint256` (internal)
*Params**
 - `_protocolIndex`: uint256 the predefined index of defi protocol

 - `_totalWeight`: uint256 sum of rebelance weight for all protocols which avaiable for deposit/withdraw

**Returns**
-----
# Function _getCurrentvSTBLVolume

Dev 
## Signature _getCurrentvSTBLVolume()
## `_getCurrentvSTBLVolume() → uint256` (internal)
*Params**

**Returns**
-----
# Function setInjector

Dev 
## Signature setInjector(address)
## `setInjector(address _injector)` (external)
*Params**

**Returns**
-----
# Function injector

Dev 
## Signature injector()
## `injector() → address _injector` (public)
*Params**

**Returns**
-----
# Function __Ownable_init

Dev Initializes the contract setting the deployer as the initial owner.
## Signature __Ownable_init()
## `__Ownable_init()` (internal)
*Params**

**Returns**
-----
# Function __Ownable_init_unchained

Dev 
## Signature __Ownable_init_unchained()
## `__Ownable_init_unchained()` (internal)
*Params**

**Returns**
-----
# Function owner

Dev Returns the address of the current owner.
## Signature owner()
## `owner() → address` (public)
*Params**

**Returns**
-----
# Function renounceOwnership

Dev Leaves the contract without owner. It will not be possible to call
`onlyOwner` functions anymore. Can only be called by the current owner.
NOTE: Renouncing ownership will leave the contract without an owner,
thereby removing any functionality that is only available to the owner.
## Signature renounceOwnership()
## `renounceOwnership()` (public)
*Params**

**Returns**
-----
# Function transferOwnership

Dev Transfers ownership of the contract to a new account (`newOwner`).
Can only be called by the current owner.
## Signature transferOwnership(address)
## `transferOwnership(address newOwner)` (public)
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


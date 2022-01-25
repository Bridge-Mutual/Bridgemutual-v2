# `CompoundProtocol`



## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function __CompoundProtocol_init

Dev 
## Signature __CompoundProtocol_init()
## `__CompoundProtocol_init()` (external)
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
deposit an amount in Compound defi protocol

Dev 
## Signature deposit(uint256)
## `deposit(uint256 amount)` (external)
*Params**
 - `amount`: uint256 the amount of stable coin will deposit

**Returns**
-----
# Function withdraw

Dev 
## Signature withdraw(uint256)
## `withdraw(uint256 amountInUnderlying) → uint256 actualAmountWithdrawn` (external)
*Params**

**Returns**
-----
# Function claimRewards

Dev 
## Signature claimRewards()
## `claimRewards()` (external)
*Params**

**Returns**
-----
# Function totalValue

Dev 
## Signature totalValue()
## `totalValue() → uint256` (external)
*Params**

**Returns**
-----
# Function setRewards

Dev 
## Signature setRewards(address)
## `setRewards(address newValue)` (external)
*Params**

**Returns**
-----
# Function _totalValue

Dev 
## Signature _totalValue()
## `_totalValue() → uint256` (internal)
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
# Function stablecoin

Dev 
## Signature stablecoin()
## `stablecoin() → contract ERC20` (external)
*Params**

**Returns**
 - `ERC20`: the erc20 stable coin which depoisted in the defi protocol
-----


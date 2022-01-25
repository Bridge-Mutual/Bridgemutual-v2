# `ShieldMiningLM`



## Event ShieldMiningAdded
## Signature `event` ShieldMiningAdded(address,address,uint256,uint256,uint256)




**Params**

## Event RewardPaid
## Signature `event` RewardPaid(address,uint256)




**Params**

## Event RewardTokensRecovered
## Signature `event` RewardTokensRecovered(uint256)




**Params**

## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function __LiquidityMiningStaking_init

Dev 
## Signature __LiquidityMiningStaking_init()
## `__LiquidityMiningStaking_init()` (external)
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
# Function blocksWithRewardsPassed

Dev 
## Signature blocksWithRewardsPassed(address)
## `blocksWithRewardsPassed(address _policyBook) → uint256` (public)
*Params**

**Returns**
-----
# Function rewardPerToken

Dev 
## Signature rewardPerToken(address)
## `rewardPerToken(address _policyBook) → uint256` (public)
*Params**

**Returns**
-----
# Function updateTotalSupply

Dev 
## Signature updateTotalSupply(address,uint256,address)
## `updateTotalSupply(address _policyBook, uint256 newTotalSupply, address liquidityProvider)` (external)
*Params**

**Returns**
-----
# Function earned

Dev 
## Signature earned(address,address)
## `earned(address _policyBook, address _account) → uint256` (public)
*Params**

**Returns**
-----
# Function createShieldMining

Dev 
## Signature createShieldMining(address,address,uint256,uint256)
## `createShieldMining(address _shieldToken, address _policyBook, uint256 _amount, uint256 _duration)` (external)
*Params**

**Returns**
-----
# Function refill

Dev 
## Signature refill(address,uint256,uint256)
## `refill(address _policyBook, uint256 _amount, uint256 _duration)` (external)
*Params**

**Returns**
-----
# Function getReward

Dev 
## Signature getReward(address)
## `getReward(address _policyBook)` (public)
*Params**

**Returns**
-----
# Function getAPY
returns APY% with 10**5 precision
Dev 
## Signature getAPY(address)
## `getAPY(address _policyBook) → uint256` (external)
*Params**

**Returns**
-----
# Function recoverNonLockedRewardTokens

Dev 
## Signature recoverNonLockedRewardTokens(address)
## `recoverNonLockedRewardTokens(address _policyBook)` (external)
*Params**

**Returns**
-----
# Function getShieldTokenAddress

Dev 
## Signature getShieldTokenAddress(address)
## `getShieldTokenAddress(address _policyBook) → address` (external)
*Params**

**Returns**
-----
# Function _getUserBalance

Dev 
## Signature _getUserBalance(address,address)
## `_getUserBalance(address _policyBook, address user) → uint256` (internal)
*Params**

**Returns**
-----
# Function _setRewards

Dev 
## Signature _setRewards(address,uint256,uint256,uint256)
## `_setRewards(address _policyBook, uint256 _rewardPerBlock, uint256 _startingBlock, uint256 _blocksAmount)` (internal)
*Params**

**Returns**
-----
# Function _updateReward

Dev 
## Signature _updateReward(address,address)
## `_updateReward(address _policyBook, address account)` (internal)
*Params**

**Returns**
-----
# Function _getFutureRewardTokens

Dev 
## Signature _getFutureRewardTokens(address)
## `_getFutureRewardTokens(address _policyBook) → uint256` (internal)
*Params**

**Returns**
-----
# Function _facadeToBook
 get the address of the policyBook with policyBookFacade address

Dev 
## Signature _facadeToBook(address)
## `_facadeToBook(address _policyBookFacade) → address` (internal)
*Params**

**Returns**
-----
# Function _calculateBlocksLeft

Dev 
## Signature _calculateBlocksLeft(uint256,uint256)
## `_calculateBlocksLeft(uint256 _from, uint256 _to) → uint256` (internal)
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


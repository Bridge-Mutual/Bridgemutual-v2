# `AbstractLiquidityMiningStaking`



## Event RewardsSet
## Signature `event` RewardsSet(uint256,uint256,uint256)




**Params**

## Event Staked
## Signature `event` Staked(address,uint256)




**Params**

## Event Withdrawn
## Signature `event` Withdrawn(address,uint256)




**Params**

## Event RewardPaid
## Signature `event` RewardPaid(address,address,uint256)




**Params**

## Event RewardRestaked
## Signature `event` RewardRestaked(address,uint256)




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
## `__LiquidityMiningStaking_init()` (internal)
*Params**

**Returns**
-----
# Function blocksWithRewardsPassed

Dev 
## Signature blocksWithRewardsPassed()
## `blocksWithRewardsPassed() → uint256` (public)
*Params**

**Returns**
-----
# Function rewardPerToken

Dev 
## Signature rewardPerToken()
## `rewardPerToken() → uint256` (public)
*Params**

**Returns**
-----
# Function earned

Dev 
## Signature earned(address)
## `earned(address _account) → uint256` (public)
*Params**

**Returns**
-----
# Function setRewardMultiplier

Dev 
## Signature setRewardMultiplier(address,uint256)
## `setRewardMultiplier(address _account, uint256 _rewardMultiplier)` (external)
*Params**

**Returns**
-----
# Function getSlashingPercentage

Dev returns percentage multiplied by 10**25
## Signature getSlashingPercentage()
## `getSlashingPercentage() → uint256` (external)
*Params**

**Returns**
-----
# Function earnedSlashed

Dev 
## Signature earnedSlashed(address)
## `earnedSlashed(address _account) → uint256` (external)
*Params**

**Returns**
-----
# Function onSushiReward
djusts the staking of a specific user by staking,  withdrawing or _getReward (harvesting, WandHarvest) on the sushiswap protocol

Dev function required by the sushiswap integration, and only accessible to the masterchef v2 contract of sushi,
sushi will handel all of staking , witdrwa our lp token and get reward (sushi token) of a user , and we tract all the state on top of that,
alongside with  distribute our reward token

## Signature onSushiReward(uint256,address,address,uint256,uint256)
## `onSushiReward(uint256 pid, address user, address recipient, uint256 sushiAmount, uint256 newLpAmount)` (external)
*Params**
 - `pid`: uint256 The index of the sushiswap pool

 - `user`: address  user’s address

 - `recipient`: address Receiver of the LP tokens and SUSHI rewards (may the same user or another user who will get the benefits)

 - `sushiAmount`: uint256 the pending $SUSHI amount by sushi

 - `newLpAmount`: uint256 new lp token amount of the user

**Returns**
-----
# Function _getReward

Dev 
## Signature _getReward(address,address)
## `_getReward(address user, address recipient)` (internal)
*Params**

**Returns**
-----
# Function getAPY
/ @notice returns APY% with 10**5 precision
Dev 
## Signature getAPY()
## `getAPY() → uint256` (external)
*Params**

**Returns**
-----
# Function setRewards

Dev 
## Signature setRewards(uint256,uint256,uint256)
## `setRewards(uint256 _rewardPerBlock, uint256 _startingBlock, uint256 _blocksAmount)` (external)
*Params**

**Returns**
-----
# Function recoverNonLockedRewardTokens

Dev 
## Signature recoverNonLockedRewardTokens()
## `recoverNonLockedRewardTokens()` (external)
*Params**

**Returns**
-----
# Function _updateReward

Dev 
## Signature _updateReward(address)
## `_updateReward(address account)` (internal)
*Params**

**Returns**
-----
# Function _getFutureRewardTokens

Dev 
## Signature _getFutureRewardTokens()
## `_getFutureRewardTokens() → uint256` (internal)
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
# Function getSlashingPercentage

Dev 
## Signature getSlashingPercentage(uint256)
## `getSlashingPercentage(uint256 startTime) → uint256` (public)
*Params**

**Returns**
-----
# Function _applySlashing

Dev 
## Signature _applySlashing(uint256,uint256)
## `_applySlashing(uint256 amount, uint256 startTime) → uint256` (internal)
*Params**

**Returns**
-----
# Function _getSlashed

Dev 
## Signature _getSlashed(uint256,uint256)
## `_getSlashed(uint256 amount, uint256 startTime) → uint256` (internal)
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
# Function setDependencies

Dev has to apply onlyInjectorOrZero() modifier
## Signature setDependencies(contract IContractsRegistry)
## `setDependencies(contract IContractsRegistry)` (external)
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


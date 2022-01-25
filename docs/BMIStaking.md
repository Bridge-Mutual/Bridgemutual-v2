# `BMIStaking`



## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**

## Event StakedBMI
## Signature `event` StakedBMI(uint256,uint256,address)




**Params**

## Event BMIWithdrawn
## Signature `event` BMIWithdrawn(uint256,uint256,address)




**Params**

## Event UnusedRewardPoolRevoked
## Signature `event` UnusedRewardPoolRevoked(address,uint256)




**Params**

## Event RewardPoolRevoked
## Signature `event` RewardPoolRevoked(address,uint256)




**Params**


# Function __BMIStaking_init

Dev 
## Signature __BMIStaking_init(uint256)
## `__BMIStaking_init(uint256 _rewardPerBlock)` (external)
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
# Function stakeWithPermit

Dev 
## Signature stakeWithPermit(uint256,uint8,bytes32,bytes32)
## `stakeWithPermit(uint256 _amountBMI, uint8 _v, bytes32 _r, bytes32 _s)` (external)
*Params**

**Returns**
-----
# Function stakeFor

Dev 
## Signature stakeFor(address,uint256)
## `stakeFor(address _user, uint256 _amountBMI)` (external)
*Params**

**Returns**
-----
# Function stake

Dev 
## Signature stake(uint256)
## `stake(uint256 _amountBMI)` (external)
*Params**

**Returns**
-----
# Function maturityAt
checks when the unlockPeriod expires (90 days)

Dev 
## Signature maturityAt()
## `maturityAt() → uint256` (external)
*Params**

**Returns**
 - `exact`: timestamp of the unlock time or 0 if LME is not started or unlock period is reached
-----
# Function isBMIRewardUnlocked

Dev 
## Signature isBMIRewardUnlocked()
## `isBMIRewardUnlocked() → bool` (public)
*Params**

**Returns**
-----
# Function whenCanWithdrawBMIReward

Dev 
## Signature whenCanWithdrawBMIReward(address)
## `whenCanWithdrawBMIReward(address _address) → uint256` (public)
*Params**

**Returns**
-----
# Function unlockTokensToWithdraw

Dev 
## Signature unlockTokensToWithdraw(uint256)
## `unlockTokensToWithdraw(uint256 _amountBMIUnlock)` (external)
*Params**

**Returns**
-----
# Function withdraw

Dev 
## Signature withdraw()
## `withdraw()` (external)
*Params**

**Returns**
-----
# Function getWithdrawalInfo
Getting withdraw information

Dev 
## Signature getWithdrawalInfo(address)
## `getWithdrawalInfo(address _userAddr) → uint256 _amountBMIRequested, uint256 _amountStkBMI, uint256 _unlockPeriod, uint256 _availableFor` (external)
*Params**

**Returns**
 - `_amountBMIRequested`: is amount of bmi tokens requested to unlock

 - `_amountStkBMI`: is amount of stkBMI that will burn

 - `_unlockPeriod`: is its timestamp when user can withdraw
        returns 0 if it didn't unlocked yet. User has 48hs to withdraw

 - `_availableFor`: is the end date if withdraw period has already begun
        or 0 if it is expired or didn't start
-----
# Function addToPool

Dev 
## Signature addToPool(uint256)
## `addToPool(uint256 _amount)` (external)
*Params**

**Returns**
-----
# Function stakingReward

Dev 
## Signature stakingReward(uint256)
## `stakingReward(uint256 _amount) → uint256` (external)
*Params**

**Returns**
-----
# Function getStakedBMI

Dev 
## Signature getStakedBMI(address)
## `getStakedBMI(address _address) → uint256` (external)
*Params**

**Returns**
-----
# Function getAPY
returns APY% with 10**5 precision
Dev 
## Signature getAPY()
## `getAPY() → uint256` (external)
*Params**

**Returns**
-----
# Function setRewardPerBlock

Dev 
## Signature setRewardPerBlock(uint256)
## `setRewardPerBlock(uint256 _amount)` (external)
*Params**

**Returns**
-----
# Function revokeRewardPool

Dev 
## Signature revokeRewardPool(uint256)
## `revokeRewardPool(uint256 _amount)` (external)
*Params**

**Returns**
-----
# Function revokeUnusedRewardPool

Dev 
## Signature revokeUnusedRewardPool()
## `revokeUnusedRewardPool()` (external)
*Params**

**Returns**
-----
# Function _updateRewardPool

Dev 
## Signature _updateRewardPool()
## `_updateRewardPool()` (internal)
*Params**

**Returns**
-----
# Function _stake

Dev 
## Signature _stake(address,uint256)
## `_stake(address _staker, uint256 _amountBMI)` (internal)
*Params**

**Returns**
-----
# Function _convertToStkBMI

Dev 
## Signature _convertToStkBMI(uint256)
## `_convertToStkBMI(uint256 _amount) → uint256` (internal)
*Params**

**Returns**
-----
# Function _convertToBMI

Dev 
## Signature _convertToBMI(uint256)
## `_convertToBMI(uint256 _amount) → uint256` (internal)
*Params**

**Returns**
-----
# Function _calculateReward

Dev 
## Signature _calculateReward()
## `_calculateReward() → uint256` (internal)
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


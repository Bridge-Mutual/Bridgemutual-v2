# `IBMIStaking`



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

Dev 
## Signature maturityAt()
## `maturityAt() → uint256` (external)
*Params**

**Returns**
-----
# Function isBMIRewardUnlocked

Dev 
## Signature isBMIRewardUnlocked()
## `isBMIRewardUnlocked() → bool` (external)
*Params**

**Returns**
-----
# Function whenCanWithdrawBMIReward

Dev 
## Signature whenCanWithdrawBMIReward(address)
## `whenCanWithdrawBMIReward(address _address) → uint256` (external)
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


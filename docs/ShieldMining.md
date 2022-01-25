# `ShieldMining`

TODO:   manage token unclaim, implement a way to withdraw these token
             in order to not block any token in the contract


## Event ShieldMiningAdded
## Signature `event` ShieldMiningAdded(address,address,uint256,uint256,uint256)


   Emmited when a Shield mining is created or refill

**Params**

## Event RewardsClaimed
## Signature `event` RewardsClaimed(address,address,uint256,uint256)


   Emmitted when an user claims rewards

**Params**

## Event LiquidityUpdated
## Signature `event` LiquidityUpdated(address,address,uint256)


   Emmitted when an user withdraw or add liquidity in the PolicyBook
        Allow to follow the evolution of the total supply on time

**Params**


# Function setDependencies

Dev 
## Signature setDependencies(contract IContractsRegistry)
## `setDependencies(contract IContractsRegistry _contractsRegistry)` (external)
*Params**

**Returns**
-----
# Function createShieldMining
 creation of shield mining


Dev     WARNING: As no restriction is set in this function, any user can link a shield mining
         token to any unset PolicyBook. Can lead to front running attack where malicious
         users wait the new create of a Coverage Pool to link there own token.

         Emit {ShieldMiningAdded} event


## Signature createShieldMining(address,address,uint256,uint256)
## `createShieldMining(address _shieldToken, address _policyBook, uint256 _shieldMiningDeposit, uint256 _duration)` (external)
*Params**
 - `_shieldToken`:  address of the distributed token

 - `_policyBook`:   address of the Coverage Pool

 - `_shieldMiningDeposit`:  amount of tokenX will be distributed in total

 - `_duration`:     number of days for the distribution period


**Returns**
-----
# Function refill
 add new token distribution period for existant SM


Dev     If the SM is in pause, there is no need to proceed to the distribution
         Decorrelated from the total supply

         Emit {ShieldMiningAdded} event


## Signature refill(address,uint256,uint256)
## `refill(address _policyBook, uint256 _shieldMiningDeposit, uint256 _duration)` (external)
*Params**
 - `_policyBook`:   address of the Coverage Pool

 - `_shieldMiningDeposit`:  amount of tokenX will be distributed in total

 - `_duration`:     number of days for the distribution period


**Returns**
-----
# Function resumeShieldMining
 Resume the SM


Dev     This function can be claim only by PolicyBookFacade, but no restriction is set
         because it will not affect current SM states.

         A new start time is set for the last distribution day (which stay unchanged) and become
         the new reference for the calculation of elapsed day in the contract.

         Emit {LiquidityUpdated} event


## Signature resumeShieldMining(uint256,address)
## `resumeShieldMining(uint256 _newTotalSupply, address _coverageProvider)` (external)
*Params**
 - `_newTotalSupply`:   new bmiXtoken total supply to set (as it was at zero)

 - `_coverageProvider`: address of the liquidity provider


**Returns**
-----
# Function updateShieldMiningTotalSupply
 Updated the total supply of bmiXtoken


Dev     the last reward day may be not up to date so we have to set the
         new supply at a specific day

         WARNING: this implementation force the {_coverageProvider} to claim rewards before add
         liquidity the coverage Pool

         Emit {LiquidityUpdated} event


## Signature updateShieldMiningTotalSupply(uint256,address)
## `updateShieldMiningTotalSupply(uint256 _newTotalSupply, address _coverageProvider)` (external)
*Params**
 - `_newTotalSupply`:  delta of the bmiXtoken total supply (can be negative)

 - `_coverageProvider`: address of the liquidity provider


**Returns**
-----
# Function pauseShieldMining
 Pause SM when the CoveragePool fall at zero


Dev     The Coverage Provider must claim his rewards before withdraw lqiuidity
         otherwise the calculation can't be done.

         A distribution is proceeded before set the SM in pause

## Signature pauseShieldMining(address)
## `pauseShieldMining(address _coverageProvider)` (external)
*Params**

**Returns**
-----
# Function claim
 user can claims rewards at any time


Dev     utilisation of the LiquidityRegistry to know if an address is registered as a liquidity provider
         Reward amount is calculated in {_calculateRewardAmount}

         Emit {RewardsClaimed} event


## Signature claim(address)
## `claim(address _policyBook)` (external)
*Params**
 - `_policyBook`:   address of the policyBook


**Returns**
-----
# Function claimFor
 called ONLY by PBF, contains no revert!!

@dev


Dev 
## Signature claimFor(address,address)
## `claimFor(address _policyBook, address user)` (external)
*Params**
 - `_policyBook`:   address of the policyBook


**Returns**
-----
# Function _calculateRewardAmount
 Take amount available in the reward per token pool

@dev


Dev 
## Signature _calculateRewardAmount(address,address)
## `_calculateRewardAmount(address _policyBook, address user) → uint256` (internal)
*Params**
 - `_policyBook`:   address of the Coverage Pool


**Returns**
-----
# Function _updateReward
 WORK only if is NOT in pause!!

@dev


Dev 
## Signature _updateReward(address)
## `_updateReward(address _policyBook)` (internal)
*Params**
 - `_policyBook`:   address of the Coverage Pool


**Returns**
-----
# Function _increaseRewards
 Increase rewards when a SM is added


Dev     Always up to date when this function is called
         Rewards are increased immediately and a end of the
         distribution is set on the timeline
         A check is set to have at least 1000 might of reward per day
         Calculate tokens in excess to not block them in the contract


## Signature _increaseRewards(address,uint256,uint256)
## `_increaseRewards(address _policyBook, uint256 _duration, uint256 _amount) → uint256` (internal)
*Params**
 - `_policyBook`:   address of the Coverage Pool

 - `_duration`:     number of days for the distribution period

 - `_amount`:       amount of tokenX will be distributed in total


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
# Function getShieldTokenAddress

Dev 
## Signature getShieldTokenAddress(address)
## `getShieldTokenAddress(address _policyBook) → address` (external)
*Params**

**Returns**
-----
# Function currentRewardPerBlock

Dev 
## Signature currentRewardPerBlock(address)
## `currentRewardPerBlock(address _policyBook) → uint256` (external)
*Params**

**Returns**
-----
# Function getRewardPerTokenPool

Dev 
## Signature getRewardPerTokenPool(address)
## `getRewardPerTokenPool(address _policyBook) → uint256` (external)
*Params**

**Returns**
-----
# Function userRewardPerTokenPaid

Dev 
## Signature userRewardPerTokenPaid(address,address)
## `userRewardPerTokenPaid(address _policyBook, address account) → uint256` (external)
*Params**

**Returns**
-----
# Function getTotalSupply

Dev 
## Signature getTotalSupply(address)
## `getTotalSupply(address _policyBook) → uint256` (external)
*Params**

**Returns**
-----
# Function getLastUpdateBlock

Dev 
## Signature getLastUpdateBlock(address)
## `getLastUpdateBlock(address _policyBook) → uint256` (external)
*Params**

**Returns**
-----
# Function getEndBlock

Dev 
## Signature getEndBlock(address)
## `getEndBlock(address _policyBook) → uint256` (external)
*Params**

**Returns**
-----
# Function isPaused

Dev 
## Signature isPaused(address)
## `isPaused(address _policyBook) → bool` (external)
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


# `RewardsGenerator`



## Event TokensSent
## Signature `event` TokensSent(address,uint256)




**Params**

## Event TokensRecovered
## Signature `event` TokensRecovered(address,uint256)




**Params**

## Event RewardPerBlockSet
## Signature `event` RewardPerBlockSet(uint256)




**Params**

## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function __RewardsGenerator_init

Dev 
## Signature __RewardsGenerator_init()
## `__RewardsGenerator_init()` (external)
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
# Function recoverTokens
withdraws all underlying BMIs to the owner
Dev 
## Signature recoverTokens()
## `recoverTokens()` (external)
*Params**

**Returns**
-----
# Function sendFundsToBMIStaking

Dev 
## Signature sendFundsToBMIStaking(uint256)
## `sendFundsToBMIStaking(uint256 amount)` (external)
*Params**

**Returns**
-----
# Function sendFundsToBMICoverStaking

Dev 
## Signature sendFundsToBMICoverStaking(uint256)
## `sendFundsToBMICoverStaking(uint256 amount)` (external)
*Params**

**Returns**
-----
# Function setRewardPerBlock

Dev 
## Signature setRewardPerBlock(uint256)
## `setRewardPerBlock(uint256 _rewardPerBlock)` (external)
*Params**

**Returns**
-----
# Function _updateCumulativeSum
updates cumulative sum for a particular PB or for all of them if policyBookAddress is zero
Dev 
## Signature _updateCumulativeSum(address)
## `_updateCumulativeSum(address policyBookAddress)` (internal)
*Params**

**Returns**
-----
# Function _getPBCumulativeReward
emulates a cumulative sum update for a specific PB and returns its accumulated reward (per token)
Dev 
## Signature _getPBCumulativeReward(address)
## `_getPBCumulativeReward(address policyBookAddress) → uint256` (internal)
*Params**

**Returns**
-----
# Function _getNFTCumulativeReward

Dev 
## Signature _getNFTCumulativeReward(uint256,uint256)
## `_getNFTCumulativeReward(uint256 nftIndex, uint256 pbCumulativeReward) → uint256` (internal)
*Params**

**Returns**
-----
# Function updatePolicyBookShare
updates the share of the PB based on the new rewards multiplier (also changes the share of others)
Dev 
## Signature updatePolicyBookShare(uint256)
## `updatePolicyBookShare(uint256 newRewardMultiplier)` (external)
*Params**

**Returns**
-----
# Function aggregate
aggregates specified NFTs into a single one, including the rewards
Dev 
## Signature aggregate(address,uint256[],uint256)
## `aggregate(address policyBookAddress, uint256[] nftIndexes, uint256 nftIndexTo)` (external)
*Params**

**Returns**
-----
# Function _stake

Dev 
## Signature _stake(address,uint256,uint256,uint256)
## `_stake(address policyBookAddress, uint256 nftIndex, uint256 amount, uint256 currentReward)` (internal)
*Params**

**Returns**
-----
# Function migrationStake
rewards multipliers must be set before anyone migrates
Dev 
## Signature migrationStake(address,uint256,uint256,uint256)
## `migrationStake(address policyBookAddress, uint256 nftIndex, uint256 amount, uint256 currentReward)` (external)
*Params**

**Returns**
-----
# Function stake
attaches underlying STBL tokens to an NFT and initiates rewards gain
Dev 
## Signature stake(address,uint256,uint256)
## `stake(address policyBookAddress, uint256 nftIndex, uint256 amount)` (external)
*Params**

**Returns**
-----
# Function getPolicyBookAPY
calculates APY of the specific PB

Dev returns APY% in STBL multiplied by 10**5
## Signature getPolicyBookAPY(address)
## `getPolicyBookAPY(address policyBookAddress) → uint256` (external)
*Params**

**Returns**
-----
# Function getPolicyBookRewardMultiplier
returns policybook's RewardMultiplier multiplied by 10**5
Dev 
## Signature getPolicyBookRewardMultiplier(address)
## `getPolicyBookRewardMultiplier(address policyBookAddress) → uint256` (external)
*Params**

**Returns**
-----
# Function getPolicyBookRewardPerBlock

Dev returns PolicyBook reward per block multiplied by 10**25
## Signature getPolicyBookRewardPerBlock(address)
## `getPolicyBookRewardPerBlock(address policyBookAddress) → uint256` (external)
*Params**

**Returns**
-----
# Function getStakedPolicyBookSTBL
returns how much STBL are using in rewards generation in the specific PB
Dev 
## Signature getStakedPolicyBookSTBL(address)
## `getStakedPolicyBookSTBL(address policyBookAddress) → uint256` (external)
*Params**

**Returns**
-----
# Function getStakedNFTSTBL
returns how much STBL are used by an NFT
Dev 
## Signature getStakedNFTSTBL(uint256)
## `getStakedNFTSTBL(uint256 nftIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function getReward
returns current reward of an NFT
Dev 
## Signature getReward(address,uint256)
## `getReward(address policyBookAddress, uint256 nftIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function _withdraw
withdraws funds/rewards of this NFT
if funds are withdrawn, updates shares of the PBs
Dev 
## Signature _withdraw(address,uint256,bool)
## `_withdraw(address policyBookAddress, uint256 nftIndex, bool onlyReward) → uint256` (internal)
*Params**

**Returns**
-----
# Function withdrawFunds
withdraws funds (rewards + STBL tokens) of this NFT
Dev 
## Signature withdrawFunds(address,uint256)
## `withdrawFunds(address policyBookAddress, uint256 nftIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function withdrawReward
withdraws rewards of this NFT
Dev 
## Signature withdrawReward(address,uint256)
## `withdrawReward(address policyBookAddress, uint256 nftIndex) → uint256` (external)
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


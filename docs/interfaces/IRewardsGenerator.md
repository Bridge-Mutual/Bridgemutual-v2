# `IRewardsGenerator`




# Function updatePolicyBookShare
this function is called every time policybook's STBL to bmiX rate changes
Dev 
## Signature updatePolicyBookShare(uint256)
## `updatePolicyBookShare(uint256 newRewardMultiplier)` (external)
*Params**

**Returns**
-----
# Function aggregate
aggregates specified nfts into a single one
Dev 
## Signature aggregate(address,uint256[],uint256)
## `aggregate(address policyBookAddress, uint256[] nftIndexes, uint256 nftIndexTo)` (external)
*Params**

**Returns**
-----
# Function migrationStake
migrates stake from the LegacyRewardsGenerator (will be called once for each user)
the rewards multipliers must be set in advance
Dev 
## Signature migrationStake(address,uint256,uint256,uint256)
## `migrationStake(address policyBookAddress, uint256 nftIndex, uint256 amount, uint256 currentReward)` (external)
*Params**

**Returns**
-----
# Function stake
informs generator of stake (rewards)
Dev 
## Signature stake(address,uint256,uint256)
## `stake(address policyBookAddress, uint256 nftIndex, uint256 amount)` (external)
*Params**

**Returns**
-----
# Function getPolicyBookAPY
returns policybook's APY multiplied by 10**5
Dev 
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
returns PolicyBook's staked STBL
Dev 
## Signature getStakedPolicyBookSTBL(address)
## `getStakedPolicyBookSTBL(address policyBookAddress) → uint256` (external)
*Params**

**Returns**
-----
# Function getStakedNFTSTBL
returns NFT's staked STBL
Dev 
## Signature getStakedNFTSTBL(uint256)
## `getStakedNFTSTBL(uint256 nftIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function getReward
returns a reward of NFT
Dev 
## Signature getReward(address,uint256)
## `getReward(address policyBookAddress, uint256 nftIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function withdrawFunds
informs generator of withdrawal (all funds)
Dev 
## Signature withdrawFunds(address,uint256)
## `withdrawFunds(address policyBookAddress, uint256 nftIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function withdrawReward
informs generator of withdrawal (rewards)
Dev 
## Signature withdrawReward(address,uint256)
## `withdrawReward(address policyBookAddress, uint256 nftIndex) → uint256` (external)
*Params**

**Returns**
-----


# `INFTStaking`




# Function lockNFT
let user lock NFT, access: ANY

Dev 
## Signature lockNFT(uint256)
## `lockNFT(uint256 _nftId)` (external)
*Params**
 - `_nftId`: is the NFT id which locked

**Returns**
-----
# Function unlockNFT
let user unlcok NFT if enabled, access: ANY

Dev 
## Signature unlockNFT(uint256)
## `unlockNFT(uint256 _nftId)` (external)
*Params**
 - `_nftId`: is the NFT id which unlocked

**Returns**
-----
# Function getUserReductionMultiplier
get user reduction multiplier for policy premium, access: PolicyBook

Dev 
## Signature getUserReductionMultiplier(address)
## `getUserReductionMultiplier(address _user) → uint256` (external)
*Params**
 - `_user`: is the user who locked NFT


**Returns**
 - `reduction`: multiplier of locked NFT by user
-----
# Function enabledlockingNFTs
return enabledlockingNFTs state, access: ANY
if true user can't unlock NFT and vice versa
Dev 
## Signature enabledlockingNFTs()
## `enabledlockingNFTs() → bool` (external)
*Params**

**Returns**
-----
# Function enableLockingNFTs
To enable/disable locking of the NFTs

Dev 
## Signature enableLockingNFTs(bool)
## `enableLockingNFTs(bool _enabledlockingNFTs)` (external)
*Params**
 - `_enabledlockingNFTs`: is a state for enable/disbale locking of the NFT

**Returns**
-----


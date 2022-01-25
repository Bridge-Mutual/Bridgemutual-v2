# `NFTStaking`



## Event Locked
## Signature `event` Locked(address,uint256)




**Params**

## Event Unlocked
## Signature `event` Unlocked(address,uint256)




**Params**

## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function __NFTStaking_init

Dev 
## Signature __NFTStaking_init()
## `__NFTStaking_init()` (external)
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
# Function lockNFT

Dev 
## Signature lockNFT(uint256)
## `lockNFT(uint256 _nftId)` (external)
*Params**

**Returns**
-----
# Function unlockNFT

Dev 
## Signature unlockNFT(uint256)
## `unlockNFT(uint256 _nftId)` (external)
*Params**

**Returns**
-----
# Function getUserReductionMultiplier

Dev 
## Signature getUserReductionMultiplier(address)
## `getUserReductionMultiplier(address user) → uint256` (external)
*Params**

**Returns**
-----
# Function enableLockingNFTs

Dev 
## Signature enableLockingNFTs(bool)
## `enableLockingNFTs(bool _enabledlockingNFTs)` (external)
*Params**

**Returns**
-----
# Function _setLMStakingRewardMultiplier
set reward multiplier for users who staked in LM staking contract based on NFT locked by users
Dev 
## Signature _setLMStakingRewardMultiplier()
## `_setLMStakingRewardMultiplier()` (internal)
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
# Function __ERC1155Holder_init

Dev 
## Signature __ERC1155Holder_init()
## `__ERC1155Holder_init()` (internal)
*Params**

**Returns**
-----
# Function __ERC1155Holder_init_unchained

Dev 
## Signature __ERC1155Holder_init_unchained()
## `__ERC1155Holder_init_unchained()` (internal)
*Params**

**Returns**
-----
# Function onERC1155Received

Dev 
## Signature onERC1155Received(address,address,uint256,uint256,bytes)
## `onERC1155Received(address, address, uint256, uint256, bytes) → bytes4` (public)
*Params**

**Returns**
-----
# Function onERC1155BatchReceived

Dev 
## Signature onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)
## `onERC1155BatchReceived(address, address, uint256[], uint256[], bytes) → bytes4` (public)
*Params**

**Returns**
-----
# Function __ERC1155Receiver_init

Dev 
## Signature __ERC1155Receiver_init()
## `__ERC1155Receiver_init()` (internal)
*Params**

**Returns**
-----
# Function __ERC1155Receiver_init_unchained

Dev 
## Signature __ERC1155Receiver_init_unchained()
## `__ERC1155Receiver_init_unchained()` (internal)
*Params**

**Returns**
-----
# Function __ERC165_init

Dev 
## Signature __ERC165_init()
## `__ERC165_init()` (internal)
*Params**

**Returns**
-----
# Function __ERC165_init_unchained

Dev 
## Signature __ERC165_init_unchained()
## `__ERC165_init_unchained()` (internal)
*Params**

**Returns**
-----
# Function supportsInterface

Dev See {IERC165-supportsInterface}.
Time complexity O(1), guaranteed to always use less than 30 000 gas.
## Signature supportsInterface(bytes4)
## `supportsInterface(bytes4 interfaceId) → bool` (public)
*Params**

**Returns**
-----
# Function _registerInterface

Dev Registers the contract as an implementer of the interface defined by
`interfaceId`. Support of the actual ERC165 interface is automatic and
registering its interface id is not required.
See {IERC165-supportsInterface}.
Requirements:
- `interfaceId` cannot be the ERC165 invalid interface (`0xffffffff`).
## Signature _registerInterface(bytes4)
## `_registerInterface(bytes4 interfaceId)` (internal)
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
# Function enabledlockingNFTs
return enabledlockingNFTs state, access: ANY
if true user can't unlock NFT and vice versa
Dev 
## Signature enabledlockingNFTs()
## `enabledlockingNFTs() → bool` (external)
*Params**

**Returns**
-----


# `BMICoverStaking`



## Event StakingNFTMinted
## Signature `event` StakingNFTMinted(uint256,address,address)




**Params**

## Event StakingNFTBurned
## Signature `event` StakingNFTBurned(uint256,address)




**Params**

## Event StakingBMIProfitWithdrawn
## Signature `event` StakingBMIProfitWithdrawn(uint256,address,address,uint256)




**Params**

## Event StakingFundsWithdrawn
## Signature `event` StakingFundsWithdrawn(uint256,address,address,uint256)




**Params**

## Event TokensRecovered
## Signature `event` TokensRecovered(address,uint256)




**Params**

## Event TransferSingle
## Signature `event` TransferSingle(address,address,address,uint256,uint256)


Emitted when `value` tokens of token type `id` are transferred from `from` to `to` by `operator`.

**Params**

## Event TransferBatch
## Signature `event` TransferBatch(address,address,address,uint256[],uint256[])


Equivalent to multiple {TransferSingle} events, where `operator`, `from` and `to` are the same for all
transfers.

**Params**

## Event ApprovalForAll
## Signature `event` ApprovalForAll(address,address,bool)


Emitted when `account` grants or revokes permission to `operator` to transfer their tokens, according to
`approved`.

**Params**

## Event URI
## Signature `event` URI(string,uint256)


Emitted when the URI for token type `id` changes to `value`, if it is a non-programmatic URI.
If an {URI} event was emitted for `id`, the standard
https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[guarantees] that `value` will equal the value
returned by {IERC1155MetadataURI-uri}.

**Params**

## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function __BMICoverStaking_init

Dev 
## Signature __BMICoverStaking_init()
## `__BMICoverStaking_init()` (external)
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
# Function uri

Dev the output URI will be: "https://token-cdn-domain/<tokenId>"
## Signature uri(uint256)
## `uri(uint256 tokenId) → string` (public)
*Params**

**Returns**
-----
# Function setBaseURI

Dev this is a correct URI: "https://token-cdn-domain/"
## Signature setBaseURI(string)
## `setBaseURI(string newURI)` (external)
*Params**

**Returns**
-----
# Function recoverTokens

Dev 
## Signature recoverTokens()
## `recoverTokens()` (external)
*Params**

**Returns**
-----
# Function _beforeTokenTransfer

Dev 
## Signature _beforeTokenTransfer(address,address,address,uint256[],uint256[],bytes)
## `_beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data)` (internal)
*Params**

**Returns**
-----
# Function _updateLiquidityRegistry

Dev 
## Signature _updateLiquidityRegistry(address,address,address)
## `_updateLiquidityRegistry(address to, address from, address policyBookAddress)` (internal)
*Params**

**Returns**
-----
# Function _mintStake

Dev 
## Signature _mintStake(address,uint256)
## `_mintStake(address staker, uint256 id)` (internal)
*Params**

**Returns**
-----
# Function _burnStake

Dev 
## Signature _burnStake(address,uint256)
## `_burnStake(address staker, uint256 id)` (internal)
*Params**

**Returns**
-----
# Function _mintAggregatedNFT

Dev 
## Signature _mintAggregatedNFT(address,address,uint256[])
## `_mintAggregatedNFT(address staker, address policyBookAddress, uint256[] tokenIds)` (internal)
*Params**

**Returns**
-----
# Function _mintNewNFT

Dev 
## Signature _mintNewNFT(address,uint256,address)
## `_mintNewNFT(address staker, uint256 bmiXAmount, address policyBookAddress)` (internal)
*Params**

**Returns**
-----
# Function aggregateNFTs

Dev 
## Signature aggregateNFTs(address,uint256[])
## `aggregateNFTs(address policyBookAddress, uint256[] tokenIds)` (external)
*Params**

**Returns**
-----
# Function stakeBMIX

Dev 
## Signature stakeBMIX(address,uint256,address)
## `stakeBMIX(address user, uint256 bmiXAmount, address policyBookAddress)` (external)
*Params**

**Returns**
-----
# Function stakeBMIXWithPermit

Dev 
## Signature stakeBMIXWithPermit(uint256,address,uint8,bytes32,bytes32)
## `stakeBMIXWithPermit(uint256 bmiXAmount, address policyBookAddress, uint8 v, bytes32 r, bytes32 s)` (external)
*Params**

**Returns**
-----
# Function stakeBMIXFrom

Dev 
## Signature stakeBMIXFrom(address,uint256)
## `stakeBMIXFrom(address user, uint256 bmiXAmount)` (external)
*Params**

**Returns**
-----
# Function stakeBMIXFromWithPermit

Dev 
## Signature stakeBMIXFromWithPermit(address,uint256,uint8,bytes32,bytes32)
## `stakeBMIXFromWithPermit(address user, uint256 bmiXAmount, uint8 v, bytes32 r, bytes32 s)` (external)
*Params**

**Returns**
-----
# Function _stakeBMIXWithPermit

Dev 
## Signature _stakeBMIXWithPermit(address,uint256,address,uint8,bytes32,bytes32)
## `_stakeBMIXWithPermit(address staker, uint256 bmiXAmount, address policyBookAddress, uint8 v, bytes32 r, bytes32 s)` (internal)
*Params**

**Returns**
-----
# Function _stakeBMIX

Dev 
## Signature _stakeBMIX(address,uint256,address)
## `_stakeBMIX(address user, uint256 bmiXAmount, address policyBookAddress)` (internal)
*Params**

**Returns**
-----
# Function _transferProfit

Dev 
## Signature _transferProfit(uint256,bool)
## `_transferProfit(uint256 tokenId, bool onlyProfit)` (internal)
*Params**

**Returns**
-----
# Function _aggregateForEach

Dev 
## Signature _aggregateForEach(address,address,uint256,uint256,function (uint256) view returns (uint256))
## `_aggregateForEach(address staker, address policyBookAddress, uint256 offset, uint256 limit, function (uint256) view returns (uint256) func) → uint256 total` (internal)
*Params**
 - `staker`: address of the staker account

 - `policyBookAddress`: addres of the policbook

 - `offset`: pagination start up place

 - `limit`: size of the listing page

 - `func`: callback function that returns a uint256


**Returns**
-----
# Function _transferForEach

Dev 
## Signature _transferForEach(address,function (uint256))
## `_transferForEach(address policyBookAddress, function (uint256) func)` (internal)
*Params**

**Returns**
-----
# Function restakeBMIProfit

Dev 
## Signature restakeBMIProfit(uint256)
## `restakeBMIProfit(uint256 tokenId)` (public)
*Params**

**Returns**
-----
# Function restakeStakerBMIProfit

Dev 
## Signature restakeStakerBMIProfit(address)
## `restakeStakerBMIProfit(address policyBookAddress)` (external)
*Params**

**Returns**
-----
# Function withdrawBMIProfit

Dev 
## Signature withdrawBMIProfit(uint256)
## `withdrawBMIProfit(uint256 tokenId)` (public)
*Params**

**Returns**
-----
# Function withdrawStakerBMIProfit

Dev 
## Signature withdrawStakerBMIProfit(address)
## `withdrawStakerBMIProfit(address policyBookAddress)` (external)
*Params**

**Returns**
-----
# Function withdrawFundsWithProfit

Dev 
## Signature withdrawFundsWithProfit(uint256)
## `withdrawFundsWithProfit(uint256 tokenId)` (public)
*Params**

**Returns**
-----
# Function withdrawStakerFundsWithProfit

Dev 
## Signature withdrawStakerFundsWithProfit(address)
## `withdrawStakerFundsWithProfit(address policyBookAddress)` (external)
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
# Function getSlashedBMIProfit

Dev 
## Signature getSlashedBMIProfit(uint256)
## `getSlashedBMIProfit(uint256 tokenId) → uint256` (public)
*Params**

**Returns**
-----
# Function getBMIProfit
retrieves the BMI profit of a tokenId

Dev 
## Signature getBMIProfit(uint256)
## `getBMIProfit(uint256 tokenId) → uint256` (public)
*Params**
 - `tokenId`: numeric id identifier of the token


**Returns**
 - `profit`: amount
-----
# Function getSlashedStakerBMIProfit

Dev 
## Signature getSlashedStakerBMIProfit(address,address,uint256,uint256)
## `getSlashedStakerBMIProfit(address staker, address policyBookAddress, uint256 offset, uint256 limit) → uint256 totalProfit` (external)
*Params**

**Returns**
-----
# Function getStakerBMIProfit

Dev 
## Signature getStakerBMIProfit(address,address,uint256,uint256)
## `getStakerBMIProfit(address staker, address policyBookAddress, uint256 offset, uint256 limit) → uint256` (public)
*Params**

**Returns**
-----
# Function totalStaked

Dev 
## Signature totalStaked(address)
## `totalStaked(address user) → uint256` (external)
*Params**

**Returns**
-----
# Function totalStakedSTBL

Dev 
## Signature totalStakedSTBL(address)
## `totalStakedSTBL(address user) → uint256` (external)
*Params**

**Returns**
-----
# Function policyBookAddrByNFT

Dev 
## Signature policyBookAddrByNFT(uint256)
## `policyBookAddrByNFT(uint256 tokenId) → address` (public)
*Params**

**Returns**
-----
# Function stakedByNFT

Dev 
## Signature stakedByNFT(uint256)
## `stakedByNFT(uint256 tokenId) → uint256` (public)
*Params**

**Returns**
-----
# Function stakedSTBLByNFT

Dev 
## Signature stakedSTBLByNFT(uint256)
## `stakedSTBLByNFT(uint256 tokenId) → uint256` (public)
*Params**

**Returns**
-----
# Function balanceOf
returns number of NFTs on user's account
Dev 
## Signature balanceOf(address)
## `balanceOf(address user) → uint256` (public)
*Params**

**Returns**
-----
# Function ownerOf

Dev 
## Signature ownerOf(uint256)
## `ownerOf(uint256 tokenId) → address` (public)
*Params**

**Returns**
-----
# Function tokenOfOwnerByIndex

Dev 
## Signature tokenOfOwnerByIndex(address,uint256)
## `tokenOfOwnerByIndex(address user, uint256 index) → uint256` (public)
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
# Function injector

Dev 
## Signature injector()
## `injector() → address _injector` (public)
*Params**

**Returns**
-----
# Function __ERC1155_init

Dev See {_setURI}.
## Signature __ERC1155_init(string)
## `__ERC1155_init(string uri_)` (internal)
*Params**

**Returns**
-----
# Function __ERC1155_init_unchained

Dev 
## Signature __ERC1155_init_unchained(string)
## `__ERC1155_init_unchained(string uri_)` (internal)
*Params**

**Returns**
-----
# Function balanceOf

Dev See {IERC1155-balanceOf}.

Requirements:

- `account` cannot be the zero address.
## Signature balanceOf(address,uint256)
## `balanceOf(address account, uint256 id) → uint256` (public)
*Params**

**Returns**
-----
# Function balanceOfBatch

Dev See {IERC1155-balanceOfBatch}.

Requirements:

- `accounts` and `ids` must have the same length.
## Signature balanceOfBatch(address[],uint256[])
## `balanceOfBatch(address[] accounts, uint256[] ids) → uint256[]` (public)
*Params**

**Returns**
-----
# Function setApprovalForAll

Dev See {IERC1155-setApprovalForAll}.
## Signature setApprovalForAll(address,bool)
## `setApprovalForAll(address operator, bool approved)` (public)
*Params**

**Returns**
-----
# Function isApprovedForAll

Dev See {IERC1155-isApprovedForAll}.
## Signature isApprovedForAll(address,address)
## `isApprovedForAll(address account, address operator) → bool` (public)
*Params**

**Returns**
-----
# Function safeTransferFrom

Dev See {IERC1155-safeTransferFrom}.
## Signature safeTransferFrom(address,address,uint256,uint256,bytes)
## `safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)` (public)
*Params**

**Returns**
-----
# Function safeBatchTransferFrom

Dev See {IERC1155-safeBatchTransferFrom}.
## Signature safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)
## `safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)` (public)
*Params**

**Returns**
-----
# Function _setURI

Dev Sets a new URI for all token types, by relying on the token type ID
substitution mechanism
https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].

By this mechanism, any occurrence of the `\{id\}` substring in either the
URI or any of the amounts in the JSON file at said URI will be replaced by
clients with the token type ID.

For example, the `https://token-cdn-domain/\{id\}.json` URI would be
interpreted by clients as
`https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json`
for token type ID 0x4cce0.

See {uri}.

Because these URIs cannot be meaningfully represented by the {URI} event,
this function emits no events.
## Signature _setURI(string)
## `_setURI(string newuri)` (internal)
*Params**

**Returns**
-----
# Function _mint

Dev Creates `amount` tokens of token type `id`, and assigns them to `account`.

Emits a {TransferSingle} event.

Requirements:

- `account` cannot be the zero address.
- If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value.
## Signature _mint(address,uint256,uint256,bytes)
## `_mint(address account, uint256 id, uint256 amount, bytes data)` (internal)
*Params**

**Returns**
-----
# Function _mintBatch

Dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_mint}.

Requirements:

- `ids` and `amounts` must have the same length.
- If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value.
## Signature _mintBatch(address,uint256[],uint256[],bytes)
## `_mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data)` (internal)
*Params**

**Returns**
-----
# Function _burn

Dev Destroys `amount` tokens of token type `id` from `account`

Requirements:

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens of token type `id`.
## Signature _burn(address,uint256,uint256)
## `_burn(address account, uint256 id, uint256 amount)` (internal)
*Params**

**Returns**
-----
# Function _burnBatch

Dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_burn}.

Requirements:

- `ids` and `amounts` must have the same length.
## Signature _burnBatch(address,uint256[],uint256[])
## `_burnBatch(address account, uint256[] ids, uint256[] amounts)` (internal)
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
# Function _stakersPool

Dev 
## Signature _stakersPool(uint256)
## `_stakersPool(uint256 index) → address policyBookAddress, uint256 stakedBMIXAmount` (external)
*Params**

**Returns**
-----


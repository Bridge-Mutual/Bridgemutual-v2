# `ERC1155Upgradeable`


Implementation of the basic standard multi-token.
See https://eips.ethereum.org/EIPS/eip-1155
Originally based on code by Enjin: https://github.com/enjin/erc-1155

_Available since v3.1._

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
# Function uri

Dev See {IERC1155MetadataURI-uri}.

This implementation returns the same URI for *all* token types. It relies
on the token type ID substitution mechanism
https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].

Clients calling this function must replace the `\{id\}` substring with the
actual token type ID.
## Signature uri(uint256)
## `uri(uint256) → string` (public)
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
# Function _beforeTokenTransfer

Dev Hook that is called before any token transfer. This includes minting
and burning, as well as batched variants.

The same hook is called on both single and batched variants. For single
transfers, the length of the `id` and `amount` arrays will be 1.

Calling conditions (for each `id` and `amount` pair):

- When `from` and `to` are both non-zero, `amount` of ``from``'s tokens
of token type `id` will be  transferred to `to`.
- When `from` is zero, `amount` tokens of token type `id` will be minted
for `to`.
- when `to` is zero, `amount` of ``from``'s tokens of token type `id`
will be burned.
- `from` and `to` are never both zero.
- `ids` and `amounts` have the same, non-zero length.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
## Signature _beforeTokenTransfer(address,address,address,uint256[],uint256[],bytes)
## `_beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data)` (internal)
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


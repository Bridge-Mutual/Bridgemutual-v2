# `STKBMITokenMock`



## Event Transfer
## Signature `event` Transfer(address,address,uint256)


Emitted when `value` tokens are moved from one account (`from`) to
another (`to`).
Note that `value` may be zero.

**Params**

## Event Approval
## Signature `event` Approval(address,address,uint256)


Emitted when the allowance of a `spender` for an `owner` is set by
a call to {approve}. `value` is the new allowance.

**Params**


# Function mintArbitrary

Dev 
## Signature mintArbitrary(address,uint256)
## `mintArbitrary(address _to, uint256 _amount)` (external)
*Params**

**Returns**
-----
# Function __STKBMIToken_init

Dev 
## Signature __STKBMIToken_init()
## `__STKBMIToken_init()` (external)
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
# Function mint

Dev 
## Signature mint(address,uint256)
## `mint(address account, uint256 amount)` (public)
*Params**

**Returns**
-----
# Function burn

Dev 
## Signature burn(address,uint256)
## `burn(address account, uint256 amount)` (public)
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
# Function __ERC20Permit_init

Dev Initializes the {EIP712} domain separator using the `name` parameter, and setting `version` to `"1"`.

It's a good idea to use the same `name` that is defined as the ERC20 token name.
## Signature __ERC20Permit_init(string)
## `__ERC20Permit_init(string name)` (internal)
*Params**

**Returns**
-----
# Function __ERC20Permit_init_unchained

Dev 
## Signature __ERC20Permit_init_unchained(string)
## `__ERC20Permit_init_unchained(string name)` (internal)
*Params**

**Returns**
-----
# Function permit

Dev See {IERC20Permit-permit}.
## Signature permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
## `permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` (public)
*Params**

**Returns**
-----
# Function recover

Dev Overload of {ECDSA-recover-bytes32-bytes-} that receives the `v`,
`r` and `s` signature fields separately.
## Signature recover(bytes32,uint8,bytes32,bytes32)
## `recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) → address` (internal)
*Params**

**Returns**
-----
# Function nonces

Dev See {IERC20Permit-nonces}.
/
## Signature nonces(address)
## `nonces(address owner) → uint256` (public)
*Params**

**Returns**
-----
# Function DOMAIN_SEPARATOR

Dev See {IERC20Permit-DOMAIN_SEPARATOR}.
/
## Signature DOMAIN_SEPARATOR()
## `DOMAIN_SEPARATOR() → bytes32` (external)
*Params**

**Returns**
-----
# Function __EIP712_init

Dev Initializes the domain separator and parameter caches.

The meaning of `name` and `version` is specified in
https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator[EIP 712]:

- `name`: the user readable name of the signing domain, i.e. the name of the DApp or the protocol.
- `version`: the current major version of the signing domain.

NOTE: These parameters cannot be changed except through a xref:learn::upgrading-smart-contracts.adoc[smart
contract upgrade].
## Signature __EIP712_init(string,string)
## `__EIP712_init(string name, string version)` (internal)
*Params**

**Returns**
-----
# Function __EIP712_init_unchained

Dev 
## Signature __EIP712_init_unchained(string,string)
## `__EIP712_init_unchained(string name, string version)` (internal)
*Params**

**Returns**
-----
# Function _domainSeparatorV4

Dev Returns the domain separator for the current chain.
## Signature _domainSeparatorV4()
## `_domainSeparatorV4() → bytes32` (internal)
*Params**

**Returns**
-----
# Function _hashTypedDataV4

Dev Given an already https://eips.ethereum.org/EIPS/eip-712#definition-of-hashstruct[hashed struct], this
function returns the hash of the fully encoded EIP712 message for this domain.

This hash can be used together with {ECDSA-recover} to obtain the signer of a message. For example:

```solidity
bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
    keccak256("Mail(address to,string contents)"),
    mailTo,
    keccak256(bytes(mailContents))
)));
address signer = ECDSA.recover(digest, signature);
```
## Signature _hashTypedDataV4(bytes32)
## `_hashTypedDataV4(bytes32 structHash) → bytes32` (internal)
*Params**

**Returns**
-----
# Function _EIP712NameHash

Dev The hash of the name parameter for the EIP712 domain.

NOTE: This function reads from storage by default, but can be redefined to return a constant value if gas costs
are a concern.
## Signature _EIP712NameHash()
## `_EIP712NameHash() → bytes32` (internal)
*Params**

**Returns**
-----
# Function _EIP712VersionHash

Dev The hash of the version parameter for the EIP712 domain.

NOTE: This function reads from storage by default, but can be redefined to return a constant value if gas costs
are a concern.
## Signature _EIP712VersionHash()
## `_EIP712VersionHash() → bytes32` (internal)
*Params**

**Returns**
-----
# Function __ERC20_init

Dev Sets the values for {name} and {symbol}, initializes {decimals} with
a default value of 18.
To select a different value for {decimals}, use {_setupDecimals}.
All three of these values are immutable: they can only be set once during
construction.
## Signature __ERC20_init(string,string)
## `__ERC20_init(string name_, string symbol_)` (internal)
*Params**

**Returns**
-----
# Function __ERC20_init_unchained

Dev 
## Signature __ERC20_init_unchained(string,string)
## `__ERC20_init_unchained(string name_, string symbol_)` (internal)
*Params**

**Returns**
-----
# Function name

Dev Returns the name of the token.
## Signature name()
## `name() → string` (public)
*Params**

**Returns**
-----
# Function symbol

Dev Returns the symbol of the token, usually a shorter version of the
name.
## Signature symbol()
## `symbol() → string` (public)
*Params**

**Returns**
-----
# Function decimals

Dev Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5,05` (`505 / 10 ** 2`).
Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is
called.
NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}.
## Signature decimals()
## `decimals() → uint8` (public)
*Params**

**Returns**
-----
# Function totalSupply

Dev See {IERC20-totalSupply}.
## Signature totalSupply()
## `totalSupply() → uint256` (public)
*Params**

**Returns**
-----
# Function balanceOf

Dev See {IERC20-balanceOf}.
## Signature balanceOf(address)
## `balanceOf(address account) → uint256` (public)
*Params**

**Returns**
-----
# Function transfer

Dev See {IERC20-transfer}.
Requirements:
- `recipient` cannot be the zero address.
- the caller must have a balance of at least `amount`.
## Signature transfer(address,uint256)
## `transfer(address recipient, uint256 amount) → bool` (public)
*Params**

**Returns**
-----
# Function allowance

Dev See {IERC20-allowance}.
## Signature allowance(address,address)
## `allowance(address owner, address spender) → uint256` (public)
*Params**

**Returns**
-----
# Function approve

Dev See {IERC20-approve}.
Requirements:
- `spender` cannot be the zero address.
## Signature approve(address,uint256)
## `approve(address spender, uint256 amount) → bool` (public)
*Params**

**Returns**
-----
# Function transferFrom

Dev See {IERC20-transferFrom}.
Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.
Requirements:
- `sender` and `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.
- the caller must have allowance for ``sender``'s tokens of at least
`amount`.
## Signature transferFrom(address,address,uint256)
## `transferFrom(address sender, address recipient, uint256 amount) → bool` (public)
*Params**

**Returns**
-----
# Function increaseAllowance

Dev Atomically increases the allowance granted to `spender` by the caller.
This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.
Emits an {Approval} event indicating the updated allowance.
Requirements:
- `spender` cannot be the zero address.
## Signature increaseAllowance(address,uint256)
## `increaseAllowance(address spender, uint256 addedValue) → bool` (public)
*Params**

**Returns**
-----
# Function decreaseAllowance

Dev Atomically decreases the allowance granted to `spender` by the caller.
This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.
Emits an {Approval} event indicating the updated allowance.
Requirements:
- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`.
## Signature decreaseAllowance(address,uint256)
## `decreaseAllowance(address spender, uint256 subtractedValue) → bool` (public)
*Params**

**Returns**
-----
# Function _transfer

Dev Moves tokens `amount` from `sender` to `recipient`.
This is internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.
Emits a {Transfer} event.
Requirements:
- `sender` cannot be the zero address.
- `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.
## Signature _transfer(address,address,uint256)
## `_transfer(address sender, address recipient, uint256 amount)` (internal)
*Params**

**Returns**
-----
# Function _mint

Dev Creates `amount` tokens and assigns them to `account`, increasing
the total supply.
Emits a {Transfer} event with `from` set to the zero address.
Requirements:
- `to` cannot be the zero address.
## Signature _mint(address,uint256)
## `_mint(address account, uint256 amount)` (internal)
*Params**

**Returns**
-----
# Function _burn

Dev Destroys `amount` tokens from `account`, reducing the
total supply.
Emits a {Transfer} event with `to` set to the zero address.
Requirements:
- `account` cannot be the zero address.
- `account` must have at least `amount` tokens.
## Signature _burn(address,uint256)
## `_burn(address account, uint256 amount)` (internal)
*Params**

**Returns**
-----
# Function _approve

Dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
This internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.
Emits an {Approval} event.
Requirements:
- `owner` cannot be the zero address.
- `spender` cannot be the zero address.
## Signature _approve(address,address,uint256)
## `_approve(address owner, address spender, uint256 amount)` (internal)
*Params**

**Returns**
-----
# Function _setupDecimals

Dev Sets {decimals} to a value other than the default one of 18.
WARNING: This function should only be called from the constructor. Most
applications that interact with token contracts will not expect
{decimals} to ever change, and may work incorrectly if it does.
## Signature _setupDecimals(uint8)
## `_setupDecimals(uint8 decimals_)` (internal)
*Params**

**Returns**
-----
# Function _beforeTokenTransfer

Dev Hook that is called before any transfer of tokens. This includes
minting and burning.
Calling conditions:
- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
will be to transferred to `to`.
- when `from` is zero, `amount` tokens will be minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens will be burned.
- `from` and `to` are never both zero.
To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
## Signature _beforeTokenTransfer(address,address,uint256)
## `_beforeTokenTransfer(address from, address to, uint256 amount)` (internal)
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


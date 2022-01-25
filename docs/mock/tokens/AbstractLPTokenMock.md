# `AbstractLPTokenMock`



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


# Function constructor

Dev 
## Signature constructor(string,string)
## `constructor(string _name, string _symbol)` (internal)
*Params**

**Returns**
-----
# Function setReserves

Dev 
## Signature setReserves(uint112,uint112)
## `setReserves(uint112 reserve0, uint112 reserve1)` (external)
*Params**

**Returns**
-----
# Function getReserves

Dev 
## Signature getReserves()
## `getReserves() → uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast` (public)
*Params**

**Returns**
-----
# Function mintArbitrary

Dev 
## Signature mintArbitrary(address,uint256)
## `mintArbitrary(address _to, uint256 _amount)` (external)
*Params**

**Returns**
-----
# Function permit

Dev 
## Signature permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
## `permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` (external)
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
required by the EIP. See the note at the beginning of {ERC20};
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
Requirements
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
Requirements
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


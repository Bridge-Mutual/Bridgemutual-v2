# `ISTKBMIToken`



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


# Function mint

Dev 
## Signature mint(address,uint256)
## `mint(address account, uint256 amount)` (external)
*Params**

**Returns**
-----
# Function burn

Dev 
## Signature burn(address,uint256)
## `burn(address account, uint256 amount)` (external)
*Params**

**Returns**
-----
# Function totalSupply

Dev Returns the amount of tokens in existence.
## Signature totalSupply()
## `totalSupply() → uint256` (external)
*Params**

**Returns**
-----
# Function balanceOf

Dev Returns the amount of tokens owned by `account`.
## Signature balanceOf(address)
## `balanceOf(address account) → uint256` (external)
*Params**

**Returns**
-----
# Function transfer

Dev Moves `amount` tokens from the caller's account to `recipient`.
Returns a boolean value indicating whether the operation succeeded.
Emits a {Transfer} event.
## Signature transfer(address,uint256)
## `transfer(address recipient, uint256 amount) → bool` (external)
*Params**

**Returns**
-----
# Function allowance

Dev Returns the remaining number of tokens that `spender` will be
allowed to spend on behalf of `owner` through {transferFrom}. This is
zero by default.
This value changes when {approve} or {transferFrom} are called.
## Signature allowance(address,address)
## `allowance(address owner, address spender) → uint256` (external)
*Params**

**Returns**
-----
# Function approve

Dev Sets `amount` as the allowance of `spender` over the caller's tokens.
Returns a boolean value indicating whether the operation succeeded.
IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender's allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
Emits an {Approval} event.
## Signature approve(address,uint256)
## `approve(address spender, uint256 amount) → bool` (external)
*Params**

**Returns**
-----
# Function transferFrom

Dev Moves `amount` tokens from `sender` to `recipient` using the
allowance mechanism. `amount` is then deducted from the caller's
allowance.
Returns a boolean value indicating whether the operation succeeded.
Emits a {Transfer} event.
## Signature transferFrom(address,address,uint256)
## `transferFrom(address sender, address recipient, uint256 amount) → bool` (external)
*Params**

**Returns**
-----


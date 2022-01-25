# `UniswapV2PairMock`



## Event Approval
## Signature `event` Approval(address,address,uint256)




**Params**

## Event Transfer
## Signature `event` Transfer(address,address,uint256)




**Params**

## Event Mint
## Signature `event` Mint(address,uint256,uint256)




**Params**

## Event Burn
## Signature `event` Burn(address,uint256,uint256,address)




**Params**

## Event Swap
## Signature `event` Swap(address,uint256,uint256,uint256,uint256,address)




**Params**

## Event Sync
## Signature `event` Sync(uint112,uint112)




**Params**


# Function getReserves

Dev 
## Signature getReserves()
## `getReserves() → uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast` (public)
*Params**

**Returns**
-----
# Function initialize

Dev 
## Signature initialize(address,address)
## `initialize(address _token0, address _token1)` (external)
*Params**

**Returns**
-----
# Function mint

Dev 
## Signature mint(address)
## `mint(address to) → uint256 liquidity` (external)
*Params**

**Returns**
-----
# Function burn

Dev 
## Signature burn(address)
## `burn(address to) → uint256 amount0, uint256 amount1` (external)
*Params**

**Returns**
-----
# Function swap

Dev 
## Signature swap(uint256,uint256,address,bytes)
## `swap(uint256 amount0Out, uint256 amount1Out, address to, bytes data)` (external)
*Params**

**Returns**
-----
# Function skim

Dev 
## Signature skim(address)
## `skim(address to)` (external)
*Params**

**Returns**
-----
# Function sync

Dev 
## Signature sync()
## `sync()` (external)
*Params**

**Returns**
-----
# Function mintArbitrary

Dev 
## Signature mintArbitrary(address,uint256)
## `mintArbitrary(address _to, uint256 _amount)` (public)
*Params**

**Returns**
-----
# Function _mint

Dev 
## Signature _mint(address,uint256)
## `_mint(address to, uint256 value)` (internal)
*Params**

**Returns**
-----
# Function _burn

Dev 
## Signature _burn(address,uint256)
## `_burn(address from, uint256 value)` (internal)
*Params**

**Returns**
-----
# Function approve

Dev 
## Signature approve(address,uint256)
## `approve(address spender, uint256 value) → bool` (external)
*Params**

**Returns**
-----
# Function transfer

Dev 
## Signature transfer(address,uint256)
## `transfer(address to, uint256 value) → bool` (external)
*Params**

**Returns**
-----
# Function transferFrom

Dev 
## Signature transferFrom(address,address,uint256)
## `transferFrom(address from, address to, uint256 value) → bool` (external)
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

Dev 
## Signature name()
## `name() → string` (external)
*Params**

**Returns**
-----
# Function symbol

Dev 
## Signature symbol()
## `symbol() → string` (external)
*Params**

**Returns**
-----
# Function decimals

Dev 
## Signature decimals()
## `decimals() → uint8` (external)
*Params**

**Returns**
-----
# Function totalSupply

Dev 
## Signature totalSupply()
## `totalSupply() → uint256` (external)
*Params**

**Returns**
-----
# Function balanceOf

Dev 
## Signature balanceOf(address)
## `balanceOf(address owner) → uint256` (external)
*Params**

**Returns**
-----
# Function allowance

Dev 
## Signature allowance(address,address)
## `allowance(address owner, address spender) → uint256` (external)
*Params**

**Returns**
-----
# Function DOMAIN_SEPARATOR

Dev 
## Signature DOMAIN_SEPARATOR()
## `DOMAIN_SEPARATOR() → bytes32` (external)
*Params**

**Returns**
-----
# Function PERMIT_TYPEHASH

Dev 
## Signature PERMIT_TYPEHASH()
## `PERMIT_TYPEHASH() → bytes32` (external)
*Params**

**Returns**
-----
# Function nonces

Dev 
## Signature nonces(address)
## `nonces(address owner) → uint256` (external)
*Params**

**Returns**
-----
# Function MINIMUM_LIQUIDITY

Dev 
## Signature MINIMUM_LIQUIDITY()
## `MINIMUM_LIQUIDITY() → uint256` (external)
*Params**

**Returns**
-----
# Function factory

Dev 
## Signature factory()
## `factory() → address` (external)
*Params**

**Returns**
-----
# Function token0

Dev 
## Signature token0()
## `token0() → address` (external)
*Params**

**Returns**
-----
# Function token1

Dev 
## Signature token1()
## `token1() → address` (external)
*Params**

**Returns**
-----
# Function price0CumulativeLast

Dev 
## Signature price0CumulativeLast()
## `price0CumulativeLast() → uint256` (external)
*Params**

**Returns**
-----
# Function price1CumulativeLast

Dev 
## Signature price1CumulativeLast()
## `price1CumulativeLast() → uint256` (external)
*Params**

**Returns**
-----
# Function kLast

Dev 
## Signature kLast()
## `kLast() → uint256` (external)
*Params**

**Returns**
-----


# `TetherToken`



## Event Issue
## Signature `event` Issue(uint256)




**Params**

## Event Redeem
## Signature `event` Redeem(uint256)




**Params**

## Event Deprecate
## Signature `event` Deprecate(address)




**Params**

## Event Params
## Signature `event` Params(uint256,uint256)




**Params**

## Event DestroyedBlackFunds
## Signature `event` DestroyedBlackFunds(address,uint256)




**Params**

## Event AddedBlackList
## Signature `event` AddedBlackList(address)




**Params**

## Event RemovedBlackList
## Signature `event` RemovedBlackList(address)




**Params**

## Event Approval
## Signature `event` Approval(address,address,uint256)




**Params**

## Event Transfer
## Signature `event` Transfer(address,address,uint256)




**Params**

## Event Pause
## Signature `event` Pause()




**Params**

## Event Unpause
## Signature `event` Unpause()




**Params**


# Function constructor

Dev 
## Signature constructor(uint256,string,string,uint256)
## `constructor(uint256 _initialSupply, string _name, string _symbol, uint256 _decimals)` (public)
*Params**

**Returns**
-----
# Function transfer

Dev 
## Signature transfer(address,uint256)
## `transfer(address _to, uint256 _value)` (public)
*Params**

**Returns**
-----
# Function transferFrom

Dev 
## Signature transferFrom(address,address,uint256)
## `transferFrom(address _from, address _to, uint256 _value)` (public)
*Params**

**Returns**
-----
# Function balanceOf

Dev 
## Signature balanceOf(address)
## `balanceOf(address who) → uint256` (public)
*Params**

**Returns**
-----
# Function approve

Dev 
## Signature approve(address,uint256)
## `approve(address _spender, uint256 _value)` (public)
*Params**

**Returns**
-----
# Function allowance

Dev 
## Signature allowance(address,address)
## `allowance(address _owner, address _spender) → uint256 remaining` (public)
*Params**

**Returns**
-----
# Function deprecate

Dev 
## Signature deprecate(address)
## `deprecate(address _upgradedAddress)` (public)
*Params**

**Returns**
-----
# Function totalSupply

Dev 
## Signature totalSupply()
## `totalSupply() → uint256` (public)
*Params**

**Returns**
-----
# Function _issue

Dev 
## Signature _issue(address,uint256)
## `_issue(address to, uint256 amount)` (internal)
*Params**

**Returns**
-----
# Function issue

Dev 
## Signature issue(uint256)
## `issue(uint256 amount)` (public)
*Params**

**Returns**
-----
# Function redeem

Dev 
## Signature redeem(uint256)
## `redeem(uint256 amount)` (public)
*Params**

**Returns**
-----
# Function setParams

Dev 
## Signature setParams(uint256,uint256)
## `setParams(uint256 newBasisPoints, uint256 newMaxFee)` (public)
*Params**

**Returns**
-----
# Function getBlackListStatus

Dev 
## Signature getBlackListStatus(address)
## `getBlackListStatus(address _maker) → bool` (external)
*Params**

**Returns**
-----
# Function getOwner

Dev 
## Signature getOwner()
## `getOwner() → address` (external)
*Params**

**Returns**
-----
# Function addBlackList

Dev 
## Signature addBlackList(address)
## `addBlackList(address _evilUser)` (public)
*Params**

**Returns**
-----
# Function removeBlackList

Dev 
## Signature removeBlackList(address)
## `removeBlackList(address _clearedUser)` (public)
*Params**

**Returns**
-----
# Function destroyBlackFunds

Dev 
## Signature destroyBlackFunds(address)
## `destroyBlackFunds(address _blackListedUser)` (public)
*Params**

**Returns**
-----
# Function pause

Dev called by the owner to pause, triggers stopped state
## Signature pause()
## `pause()` (public)
*Params**

**Returns**
-----
# Function unpause

Dev called by the owner to unpause, returns to normal state
## Signature unpause()
## `unpause()` (public)
*Params**

**Returns**
-----
# Function transferOwnership

Dev Allows the current owner to transfer control of the contract to a newOwner.

## Signature transferOwnership(address)
## `transferOwnership(address newOwner)` (public)
*Params**
 - `newOwner`: The address to transfer ownership to.

**Returns**
-----


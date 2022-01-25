# `TetherBlackList`



## Event DestroyedBlackFunds
## Signature `event` DestroyedBlackFunds(address,uint256)




**Params**

## Event AddedBlackList
## Signature `event` AddedBlackList(address)




**Params**

## Event RemovedBlackList
## Signature `event` RemovedBlackList(address)




**Params**

## Event Transfer
## Signature `event` Transfer(address,address,uint256)




**Params**


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
# Function transfer

Dev transfer token for a specified address

## Signature transfer(address,uint256)
## `transfer(address _to, uint256 _value)` (public)
*Params**
 - `_to`: The address to transfer to.

 - `_value`: The amount to be transferred.

**Returns**
-----
# Function balanceOf

Dev Gets the balance of the specified address.

## Signature balanceOf(address)
## `balanceOf(address _owner) → uint256 balance` (public)
*Params**
 - `_owner`: The address to query the the balance of.


**Returns**
 - `balance`: a uint representing the amount owned by the passed address.
-----
# Function totalSupply

Dev 
## Signature totalSupply()
## `totalSupply() → uint256` (public)
*Params**

**Returns**
-----
# Function constructor

Dev The Ownable constructor sets the original `owner` of the contract to the sender
account.
## Signature constructor()
## `constructor()` (public)
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


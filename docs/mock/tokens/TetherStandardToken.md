# `TetherStandardToken`

Implementation of the basic standard token.
https://github.com/ethereum/EIPs/issues/20
Based oncode by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol

## Event Approval
## Signature `event` Approval(address,address,uint256)




**Params**

## Event Transfer
## Signature `event` Transfer(address,address,uint256)




**Params**


# Function transferFrom

Dev Transfer tokens from one address to another

## Signature transferFrom(address,address,uint256)
## `transferFrom(address _from, address _to, uint256 _value)` (public)
*Params**
 - `_from`: address The address which you want to send tokens from

 - `_to`: address The address which you want to transfer to

 - `_value`: uint the amount of tokens to be transferred

**Returns**
-----
# Function approve

Dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.

## Signature approve(address,uint256)
## `approve(address _spender, uint256 _value)` (public)
*Params**
 - `_spender`: The address which will spend the funds.

 - `_value`: The amount of tokens to be spent.

**Returns**
-----
# Function allowance

Dev Function to check the amount of tokens than an owner allowed to a spender.

## Signature allowance(address,address)
## `allowance(address _owner, address _spender) → uint256 remaining` (public)
*Params**
 - `_owner`: address The address which owns the funds.

 - `_spender`: address The address which will spend the funds.


**Returns**
 - `remaining`: a uint specifying the amount of tokens still available for the spender.
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


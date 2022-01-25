# `IDefiProtocol`
Interface for defi protocols (Compound, Aave, bZx, etc.)



# Function totalValue

Dev 
## Signature totalValue()
## `totalValue() → uint256` (external)
*Params**

**Returns**
 - `uint256`: The total value locked in the defi protocol, in terms of the underlying stablecoin
-----
# Function stablecoin

Dev 
## Signature stablecoin()
## `stablecoin() → contract ERC20` (external)
*Params**

**Returns**
 - `ERC20`: the erc20 stable coin which depoisted in the defi protocol
-----
# Function deposit
deposit an amount in defi protocol

Dev 
## Signature deposit(uint256)
## `deposit(uint256 amount)` (external)
*Params**
 - `amount`: uint256 the amount of stable coin will deposit

**Returns**
-----
# Function withdraw
withdraw an amount from defi protocol

Dev 
## Signature withdraw(uint256)
## `withdraw(uint256 amountInUnderlying) → uint256 actualAmountWithdrawn` (external)
*Params**
 - `amountInUnderlying`: uint256 the amount of underlying token to withdraw the deposited stable coin

**Returns**
-----
# Function claimRewards
Claims farmed tokens and sends it to the rewards pool
Dev 
## Signature claimRewards()
## `claimRewards()` (external)
*Params**

**Returns**
-----
# Function setRewards
set the address of receiving rewards

Dev 
## Signature setRewards(address)
## `setRewards(address newValue)` (external)
*Params**
 - `newValue`: address the new address to recieve the rewards

**Returns**
-----


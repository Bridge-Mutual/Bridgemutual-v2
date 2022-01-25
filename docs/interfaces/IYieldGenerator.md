# `IYieldGenerator`




# Function deposit
deposit stable coin into multiple defi protocols using formulas, access: capital pool

Dev 
## Signature deposit(uint256)
## `deposit(uint256 amount)` (external)
*Params**
 - `amount`: uint256 the amount of stable coin to deposit

**Returns**
-----
# Function withdraw
withdraw stable coin from mulitple defi protocols using formulas, access: capital pool

Dev 
## Signature withdraw(uint256)
## `withdraw(uint256 amount) → uint256` (external)
*Params**
 - `amount`: uint256 the amount of stable coin to withdraw

**Returns**
-----
# Function setProtocolSettings
set the protocol settings for each defi protocol (allocations, whitelisted, threshold), access: owner

Dev 
## Signature setProtocolSettings(bool[],uint256[],bool[])
## `setProtocolSettings(bool[] whitelisted, uint256[] allocations, bool[] threshold)` (external)
*Params**
 - `whitelisted`: bool[] list of whitelisted values for each protocol

 - `allocations`: uint256[] list of allocations value for each protocol

 - `threshold`: bool[] list of threshold values for each protocol

**Returns**
-----
# Function claimRewards
Claims farmed tokens and sends it to the reinsurance pool
Dev 
## Signature claimRewards()
## `claimRewards()` (external)
*Params**

**Returns**
-----
# Function defiProtocol
returns defi protocol info by its index

Dev 
## Signature defiProtocol(uint256)
## `defiProtocol(uint256 index) → struct IYieldGenerator.DefiProtocol _defiProtocol` (external)
*Params**
 - `index`: uint256 the index of the defi protocol

**Returns**
-----


# `IPolicyBookAdmin`




# Function getUpgrader

Dev 
## Signature getUpgrader()
## `getUpgrader() → address` (external)
*Params**

**Returns**
-----
# Function getImplementationOfPolicyBook

Dev 
## Signature getImplementationOfPolicyBook(address)
## `getImplementationOfPolicyBook(address policyBookAddress) → address` (external)
*Params**

**Returns**
-----
# Function getCurrentPolicyBooksImplementation

Dev 
## Signature getCurrentPolicyBooksImplementation()
## `getCurrentPolicyBooksImplementation() → address` (external)
*Params**

**Returns**
-----
# Function getCurrentPolicyBooksFacadeImplementation

Dev 
## Signature getCurrentPolicyBooksFacadeImplementation()
## `getCurrentPolicyBooksFacadeImplementation() → address` (external)
*Params**

**Returns**
-----
# Function whitelist
It blacklists or whitelists a PolicyBook. Only whitelisted PolicyBooks can
        receive stakes and funds

Dev 
## Signature whitelist(address,bool)
## `whitelist(address policyBookAddress, bool whitelisted)` (external)
*Params**
 - `policyBookAddress`: PolicyBook address that will be whitelisted or blacklisted

 - `whitelisted`: true to whitelist or false to blacklist a PolicyBook

**Returns**
-----
# Function whitelistDistributor
Whitelist distributor address. Commission fee is 2-5% of the Premium
        It comes from the Protocol’s fee part

Dev If commission fee is 5%, so _distributorFee = 5

## Signature whitelistDistributor(address,uint256)
## `whitelistDistributor(address _distributor, uint256 _distributorFee)` (external)
*Params**
 - `_distributor`: distributor address that will receive funds

 - `_distributorFee`: distributor fee amount

**Returns**
-----
# Function blacklistDistributor
/ @notice Removes a distributor address from the distributor whitelist

Dev 
## Signature blacklistDistributor(address)
## `blacklistDistributor(address _distributor)` (external)
*Params**
 - `_distributor`: distributor address that will be blacklist

**Returns**
-----
# Function isWhitelistedDistributor
/ @notice Distributor commission fee is 2-5% of the Premium
        It comes from the Protocol’s fee part

Dev If max commission fee is 5%, so _distributorFeeCap = 5. Default value is 5

## Signature isWhitelistedDistributor(address)
## `isWhitelistedDistributor(address _distributor) → bool` (external)
*Params**
 - `_distributor`: address of the distributor


**Returns**
 - `true`: if address is a whitelisted distributor
-----
# Function distributorFees
Distributor commission fee is 2-5% of the Premium
        It comes from the Protocol’s fee part

Dev If max commission fee is 5%, so _distributorFeeCap = 5. Default value is 5

## Signature distributorFees(address)
## `distributorFees(address _distributor) → uint256` (external)
*Params**
 - `_distributor`: address of the distributor


**Returns**
 - `distributor`: fee value. It is distributor commission
    f
-----
# Function listDistributors
otice Used to get a list of whitelisted distributors

Dev If max commission fee is 5%, so _distributorFeeCap = 5. Default value is 5

## Signature listDistributors(uint256,uint256)
## `listDistributors(uint256 offset, uint256 limit) → address[] _distributors, uint256[] _distributorsFees` (external)
*Params**

**Returns**
 - `_distributors`: a list containing distritubors addresses

 - `_distributorsFees`: a list containing distritubors fees
    f
-----
# Function countDistributors
otice Returns number of whitelisted distributors, access: ANY
    f
Dev 
## Signature countDistributors()
## `countDistributors() → uint256` (external)
*Params**

**Returns**
-----
# Function setPolicyBookFacadeMPLs
otice sets the policybookFacade mpls values

Dev 
## Signature setPolicyBookFacadeMPLs(address,uint256,uint256)
## `setPolicyBookFacadeMPLs(address _facadeAddress, uint256 _userLeverageMPL, uint256 _reinsuranceLeverageMPL)` (external)
*Params**
 - `_facadeAddress`: address of the policybook facade

 - `_userLeverageMPL`: uint256 value of the user leverage mpl;

 - `_reinsuranceLeverageMPL`: uint256 value of the reinsurance leverage mpl
    f

**Returns**
-----
# Function setPolicyBookFacadeRebalancingThreshold
otice sets the policybookFacade mpls values

Dev 
## Signature setPolicyBookFacadeRebalancingThreshold(address,uint256)
## `setPolicyBookFacadeRebalancingThreshold(address _facadeAddress, uint256 _newRebalancingThreshold)` (external)
*Params**
 - `_facadeAddress`: address of the policybook facade

 - `_newRebalancingThreshold`: uint256 value of the reinsurance leverage mpl
    f

**Returns**
-----


# `IPolicyBookFabric`




# Function DEFAULT_MPL_VALUE

Dev 
## Signature DEFAULT_MPL_VALUE()
## `DEFAULT_MPL_VALUE() → uint256` (external)
*Params**

**Returns**
-----
# Function create
Create new Policy Book contract, access: ANY

Dev 
## Signature create(address,enum IPolicyBookFabric.ContractType,string,string,uint256)
## `create(address _contract, enum IPolicyBookFabric.ContractType _contractType, string _description, string _projectSymbol, uint256 _initialDeposit) → address` (external)
*Params**
 - `_contract`: is Contract to create policy book for

 - `_contractType`: is Contract to create policy book for

 - `_description`: is bmiXCover token desription for this policy book

 - `_projectSymbol`: replaces x in bmiXCover token symbol

 - `_initialDeposit`: is an amount user deposits on creation (addLiquidity())


**Returns**
 - `_policyBook`: is address of created contract
-----


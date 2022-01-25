# `IPolicyBookFacade`




# Function buyPolicy
Let user to buy policy by supplying stable coin, access: ANY

Dev 
## Signature buyPolicy(uint256,uint256)
## `buyPolicy(uint256 _epochsNumber, uint256 _coverTokens)` (external)
*Params**
 - `_epochsNumber`: period policy will cover

 - `_coverTokens`: amount paid for the coverage

**Returns**
-----
# Function buyPolicyFor

Dev 
## Signature buyPolicyFor(address,uint256,uint256)
## `buyPolicyFor(address _buyer, uint256 _epochsNumber, uint256 _coverTokens)` (external)
*Params**
 - `_buyer`: who is buying the coverage

 - `_epochsNumber`: period policy will cover

 - `_coverTokens`: amount paid for the coverage

**Returns**
-----
# Function policyBook

Dev 
## Signature policyBook()
## `policyBook() → contract IPolicyBook` (external)
*Params**

**Returns**
-----
# Function VUreinsurnacePool

Dev 
## Signature VUreinsurnacePool()
## `VUreinsurnacePool() → uint256` (external)
*Params**

**Returns**
-----
# Function LUreinsurnacePool

Dev 
## Signature LUreinsurnacePool()
## `LUreinsurnacePool() → uint256` (external)
*Params**

**Returns**
-----
# Function LUuserLeveragePool

Dev 
## Signature LUuserLeveragePool()
## `LUuserLeveragePool() → uint256` (external)
*Params**

**Returns**
-----
# Function userleveragedMPL

Dev 
## Signature userleveragedMPL()
## `userleveragedMPL() → uint256` (external)
*Params**

**Returns**
-----
# Function reinsurancePoolMPL

Dev 
## Signature reinsurancePoolMPL()
## `reinsurancePoolMPL() → uint256` (external)
*Params**

**Returns**
-----
# Function rebalancingThreshold

Dev 
## Signature rebalancingThreshold()
## `rebalancingThreshold() → uint256` (external)
*Params**

**Returns**
-----
# Function __PolicyBookFacade_init
policyBookFacade initializer

Dev 
## Signature __PolicyBookFacade_init(address)
## `__PolicyBookFacade_init(address pbProxy)` (external)
*Params**
 - `pbProxy`: polciybook address upgreadable cotnract.

**Returns**
-----
# Function buyPolicyFromDistributor

Dev 
## Signature buyPolicyFromDistributor(uint256,uint256,address)
## `buyPolicyFromDistributor(uint256 _epochsNumber, uint256 _coverTokens, address _distributor)` (external)
*Params**
 - `_epochsNumber`: period policy will cover

 - `_coverTokens`: amount paid for the coverage

 - `_distributor`: if it was sold buy a whitelisted distributor, it is distributor address to receive fee (commission)

**Returns**
-----
# Function buyPolicyFromDistributorFor

Dev 
## Signature buyPolicyFromDistributorFor(address,uint256,uint256,address)
## `buyPolicyFromDistributorFor(address _buyer, uint256 _epochsNumber, uint256 _coverTokens, address _distributor)` (external)
*Params**
 - `_buyer`: who is buying the coverage

 - `_epochsNumber`: period policy will cover

 - `_coverTokens`: amount paid for the coverage

 - `_distributor`: if it was sold buy a whitelisted distributor, it is distributor address to receive fee (commission)

**Returns**
-----
# Function addLiquidity
Let user to add liquidity by supplying stable coin, access: ANY

Dev 
## Signature addLiquidity(uint256)
## `addLiquidity(uint256 _liquidityAmount)` (external)
*Params**
 - `_liquidityAmount`: is amount of stable coin tokens to secure

**Returns**
-----
# Function addLiquidityFor
Let eligible contracts add liqiudity for another user by supplying stable coin

Dev 
## Signature addLiquidityFor(address,uint256)
## `addLiquidityFor(address _liquidityHolderAddr, uint256 _liquidityAmount)` (external)
*Params**
 - `_liquidityHolderAddr`: is address of address to assign cover

 - `_liquidityAmount`: is amount of stable coin tokens to secure

**Returns**
-----
# Function addLiquidityAndStake
Let user to add liquidity by supplying stable coin and stake it,

Dev access: ANY
## Signature addLiquidityAndStake(uint256,uint256)
## `addLiquidityAndStake(uint256 _liquidityAmount, uint256 _stakeSTBLAmount)` (external)
*Params**

**Returns**
-----
# Function withdrawLiquidity
Let user to withdraw deposited liqiudity, access: ANY
Dev 
## Signature withdrawLiquidity()
## `withdrawLiquidity()` (external)
*Params**

**Returns**
-----
# Function getPolicyBookAddr

Dev 
## Signature getPolicyBookAddr()
## `getPolicyBookAddr() → address` (external)
*Params**

**Returns**
-----
# Function getUserStakedAmount

Dev 
## Signature getUserStakedAmount(address)
## `getUserStakedAmount(address user) → uint256` (external)
*Params**

**Returns**
-----
# Function getPoolsData
fetches all the pools data

Dev 
## Signature getPoolsData()
## `getPoolsData() → uint256, uint256, uint256` (external)
*Params**

**Returns**
 - `uint256`: VUreinsurnacePool

 - `uint256`: LUreinsurnacePool

 - `uint256`: LUleveragePool
-----
# Function setMPLs
set the MPL for the user leverage and the reinsurance leverage

Dev 
## Signature setMPLs(uint256,uint256)
## `setMPLs(uint256 _userLeverageMPL, uint256 _reinsuranceLeverageMPL)` (external)
*Params**
 - `_userLeverageMPL`: uint256 value of the user leverage MPL

 - `_reinsuranceLeverageMPL`: uint256  value of the reinsurance leverage MPL

**Returns**
-----
# Function setRebalancingThreshold
sets the rebalancing threshold value

Dev 
## Signature setRebalancingThreshold(uint256)
## `setRebalancingThreshold(uint256 _newRebalancingThreshold)` (external)
*Params**
 - `_newRebalancingThreshold`: uint256 rebalancing threshhold value

**Returns**
-----
# Function getClaimApprovalAmount
returns how many BMI tokens needs to approve in order to submit a claim
Dev 
## Signature getClaimApprovalAmount(address)
## `getClaimApprovalAmount(address user) → uint256` (external)
*Params**

**Returns**
-----
# Function requestWithdrawal
upserts a withdraw request

Dev prevents adding a request if an already pending or ready request is open.

## Signature requestWithdrawal(uint256)
## `requestWithdrawal(uint256 _tokensToWithdraw)` (external)
*Params**
 - `_tokensToWithdraw`: uint256 amount of tokens to withdraw

**Returns**
-----


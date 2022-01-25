# `PolicyBookFacadeMock`



## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function deployLeverageFundsByLP

Dev 
## Signature deployLeverageFundsByLP()
## `deployLeverageFundsByLP() → bool, uint256` (external)
*Params**

**Returns**
-----
# Function deployLeverageFundsByRP

Dev 
## Signature deployLeverageFundsByRP()
## `deployLeverageFundsByRP() → bool, uint256` (external)
*Params**

**Returns**
-----
# Function deployVirtualFundsByPR

Dev 
## Signature deployVirtualFundsByPR()
## `deployVirtualFundsByPR() → uint256` (external)
*Params**

**Returns**
-----
# Function __PolicyBookFacade_init

Dev 
## Signature __PolicyBookFacade_init(address)
## `__PolicyBookFacade_init(address pbProxy)` (external)
*Params**

**Returns**
-----
# Function setDependencies

Dev 
## Signature setDependencies(contract IContractsRegistry)
## `setDependencies(contract IContractsRegistry contractsRegistry)` (external)
*Params**

**Returns**
-----
# Function buyPolicy
Let user to buy policy by supplying stable coin, access: ANY

Dev 
## Signature buyPolicy(uint256,uint256)
## `buyPolicy(uint256 _epochsNumber, uint256 _coverTokens)` (external)
*Params**
 - `_epochsNumber`: is number of seconds to cover

 - `_coverTokens`: is number of tokens to cover

**Returns**
-----
# Function buyPolicyFor

Dev 
## Signature buyPolicyFor(address,uint256,uint256)
## `buyPolicyFor(address _buyer, uint256 _epochsNumber, uint256 _coverTokens)` (external)
*Params**

**Returns**
-----
# Function buyPolicyFromDistributor

Dev 
## Signature buyPolicyFromDistributor(uint256,uint256,address)
## `buyPolicyFromDistributor(uint256 _epochsNumber, uint256 _coverTokens, address _distributor)` (external)
*Params**

**Returns**
-----
# Function buyPolicyFromDistributorFor
Let user to buy policy by supplying stable coin, access: ANY

Dev 
## Signature buyPolicyFromDistributorFor(address,uint256,uint256,address)
## `buyPolicyFromDistributorFor(address _buyer, uint256 _epochsNumber, uint256 _coverTokens, address _distributor)` (external)
*Params**
 - `_buyer`: address user the policy is being "bought for"

 - `_epochsNumber`: is number of seconds to cover

 - `_coverTokens`: is number of tokens to cover

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
# Function withdrawFundsWithProfit

Dev 
## Signature withdrawFundsWithProfit(uint256)
## `withdrawFundsWithProfit(uint256 tokenId)` (external)
*Params**

**Returns**
-----
# Function stakeBMIX

Dev 
## Signature stakeBMIX(uint256,address)
## `stakeBMIX(uint256 bmiXAmount, address policyBookAddress)` (external)
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
# Function _addLiquidity
Let user to withdraw deposited liqiudity, access: ANY
Dev 
## Signature _addLiquidity(address,uint256,uint256)
## `_addLiquidity(address _liquidityHolderAddr, uint256 _liquidityAmount, uint256 _stakeSTBLAmount)` (internal)
*Params**

**Returns**
-----
# Function _buyPolicy

Dev 
## Signature _buyPolicy(address,uint256,uint256,uint256,address)
## `_buyPolicy(address _policyHolderAddr, uint256 _epochsNumber, uint256 _coverTokens, uint256 _distributorFee, address _distributor)` (internal)
*Params**

**Returns**
-----
# Function _checkRebalancingThreshold

Dev 
## Signature _checkRebalancingThreshold(uint256)
## `_checkRebalancingThreshold(uint256 newAmount) → bool` (internal)
*Params**

**Returns**
-----
# Function _deployLeveragedFunds

Dev 
## Signature _deployLeveragedFunds(uint256)
## `_deployLeveragedFunds(uint256 newAmount)` (internal)
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
# Function getClaimApprovalAmount

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
# Function setInjector

Dev 
## Signature setInjector(address)
## `setInjector(address _injector)` (external)
*Params**

**Returns**
-----
# Function injector

Dev 
## Signature injector()
## `injector() → address _injector` (public)
*Params**

**Returns**
-----
# Function __Ownable_init

Dev Initializes the contract setting the deployer as the initial owner.
## Signature __Ownable_init()
## `__Ownable_init()` (internal)
*Params**

**Returns**
-----
# Function __Ownable_init_unchained

Dev 
## Signature __Ownable_init_unchained()
## `__Ownable_init_unchained()` (internal)
*Params**

**Returns**
-----
# Function owner

Dev Returns the address of the current owner.
## Signature owner()
## `owner() → address` (public)
*Params**

**Returns**
-----
# Function renounceOwnership

Dev Leaves the contract without owner. It will not be possible to call
`onlyOwner` functions anymore. Can only be called by the current owner.
NOTE: Renouncing ownership will leave the contract without an owner,
thereby removing any functionality that is only available to the owner.
## Signature renounceOwnership()
## `renounceOwnership()` (public)
*Params**

**Returns**
-----
# Function transferOwnership

Dev Transfers ownership of the contract to a new account (`newOwner`).
Can only be called by the current owner.
## Signature transferOwnership(address)
## `transferOwnership(address newOwner)` (public)
*Params**

**Returns**
-----
# Function __Context_init

Dev 
## Signature __Context_init()
## `__Context_init()` (internal)
*Params**

**Returns**
-----
# Function __Context_init_unchained

Dev 
## Signature __Context_init_unchained()
## `__Context_init_unchained()` (internal)
*Params**

**Returns**
-----
# Function _msgSender

Dev 
## Signature _msgSender()
## `_msgSender() → address payable` (internal)
*Params**

**Returns**
-----
# Function _msgData

Dev 
## Signature _msgData()
## `_msgData() → bytes` (internal)
*Params**

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


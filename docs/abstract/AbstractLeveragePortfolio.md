# `AbstractLeveragePortfolio`



## Event LeverageStableDeployed
## Signature `event` LeverageStableDeployed(address,uint256,bool)




**Params**

## Event VirtualStableDeployed
## Signature `event` VirtualStableDeployed(address,uint256)




**Params**

## Event ProvidedLeverageReevaluated
## Signature `event` ProvidedLeverageReevaluated(enum ILeveragePortfolio.LeveragePortfolio)




**Params**

## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function __LeveragePortfolio_init

Dev 
## Signature __LeveragePortfolio_init()
## `__LeveragePortfolio_init()` (internal)
*Params**

**Returns**
-----
# Function deployLeverageStableToCoveragePools
deploy lStable from user leverage pool or reinsurance pool using 2 formulas: access by policybook.

Dev if function call from LP then the MPL is of LP and secondMPL is of RP and vise versa

## Signature deployLeverageStableToCoveragePools(uint256,uint256)
## `deployLeverageStableToCoveragePools(uint256 mpl, uint256 secondMPL) → bool, uint256` (external)
*Params**
 - `mpl`: uint256 the MPL of policy book for LP or RP

 - `mpl`: uint256 the MPL of policy book for LP or RP


**Returns**
 - `isLeverage`: bool is leverage or deleverage , _deployedAmount uint256 the amount of lStable to leverage or deleverage
-----
# Function deployVirtualStableToCoveragePools
deploy the vStable from RP in v2 and for next versions it will be from RP and LP : access by policybook.

Dev 
## Signature deployVirtualStableToCoveragePools(uint256)
## `deployVirtualStableToCoveragePools(uint256 mpl) → uint256` (external)
*Params**
 - `mpl`: uint256 reinsurance pool MPL


**Returns**
 - `the`: amount of vstable to deploy
-----
# Function addPolicyPremium
add the portion of 80% of premium to user leverage pool where the leverage provide lstable : access policybook
add the 20% of premium + portion of 80% of premium where reisnurance pool participate in coverage pools (vStable)  : access policybook

Dev 
## Signature addPolicyPremium(uint256,uint256)
## `addPolicyPremium(uint256 epochsNumber, uint256 premiumAmount)` (external)
*Params**
 - `epochsNumber`: uint256 the number of epochs which the policy holder will pay a premium for , zero for RP

 - `premiumAmount`: uint256 the premium amount which is a portion of 80% of the premium

**Returns**
-----
# Function calcM
calc M factor by formual M = min( abs((1/ (Tur-UR))*d) /a, max)

Dev 
## Signature calcM(uint256)
## `calcM(uint256 poolUR) → uint256` (external)
*Params**
 - `poolUR`: uint256 utitilization ratio for a coverage pool


**Returns**
 - `uint256`: M facotr
-----
# Function _calcM

Dev 
## Signature _calcM(uint256)
## `_calcM(uint256 poolUR) → uint256` (internal)
*Params**

**Returns**
-----
# Function setThreshold
set the threshold % for re-evaluation of the lStable provided across all Coverage pools

Dev 
## Signature setThreshold(uint256)
## `setThreshold(uint256 _threshold)` (external)
*Params**
 - `_threshold`: uint256 is the reevaluatation threshold

**Returns**
-----
# Function setProtocolConstant
set the protocol constant
set the protocol constant : access by owner

Dev 
## Signature setProtocolConstant(uint256,uint256,uint256,uint256)
## `setProtocolConstant(uint256 _targetUR, uint256 _d_ProtocolConstant, uint256 _a_ProtocolConstant, uint256 _max_ProtocolConstant)` (external)
*Params**
 - `_targetUR`: uint256 target utitlization ration

 - `_d_ProtocolConstant`: uint256 D protocol constant

 - `_a_ProtocolConstant`: uint256 A protocol constant

 - `_max_ProtocolConstant`: uint256 the max % included

**Returns**
-----
# Function listleveragedCoveragePools
Used to get a list of coverage pools which get leveraged , use with count()

Dev 
## Signature listleveragedCoveragePools(uint256,uint256)
## `listleveragedCoveragePools(uint256 offset, uint256 limit) → address[] _coveragePools` (external)
*Params**

**Returns**
 - `_coveragePools`: a list containing policybook addresses
-----
# Function countleveragedCoveragePools
get count of coverage pools which get leveraged
Dev 
## Signature countleveragedCoveragePools()
## `countleveragedCoveragePools() → uint256` (external)
*Params**

**Returns**
-----
# Function _deployLeverageStableToCoveragePools

Dev using two formulas , if formula 1 get zero then use the formula 2 otherwise get the min value of both
calculate the net mpl for the other pool RP or LP
## Signature _deployLeverageStableToCoveragePools(uint256,uint256,address)
## `_deployLeverageStableToCoveragePools(uint256 mpl, uint256 secondMPL, address policyBookAddress) → bool isLeverage, uint256 deployedAmount` (internal)
*Params**

**Returns**
-----
# Function calcMaxLevFunds

Dev 
## Signature calcMaxLevFunds(struct ILeveragePortfolio.LevFundsFactors)
## `calcMaxLevFunds(struct ILeveragePortfolio.LevFundsFactors factors) → uint256` (internal)
*Params**

**Returns**
-----
# Function _reevaluateProvidedLeverageStable
reevaluate all pools provided by the leverage stable upon threshold

Dev 
## Signature _reevaluateProvidedLeverageStable(enum ILeveragePortfolio.LeveragePortfolio,uint256)
## `_reevaluateProvidedLeverageStable(enum ILeveragePortfolio.LeveragePortfolio leveragePool, uint256 newAmount)` (internal)
*Params**
 - `leveragePool`: LeveragePortfolio is determine the pool which call the function

 - `newAmount`: the new amount added or subtracted from the pool

**Returns**
-----
# Function _rebalanceProvidedLeverageStable
rebalance all pools provided by the leverage stable

Dev 
## Signature _rebalanceProvidedLeverageStable(enum ILeveragePortfolio.LeveragePortfolio)
## `_rebalanceProvidedLeverageStable(enum ILeveragePortfolio.LeveragePortfolio leveragePool)` (internal)
*Params**
 - `leveragePool`: LeveragePortfolio is determine the pool which call the function

**Returns**
-----
# Function _calcvStableFormulaforAllPools

Dev 
## Signature _calcvStableFormulaforAllPools()
## `_calcvStableFormulaforAllPools() → uint256` (internal)
*Params**

**Returns**
-----
# Function _calcvStableFormulaforOnePool

Dev 
## Signature _calcvStableFormulaforOnePool(address)
## `_calcvStableFormulaforOnePool(address _policybookAddress) → uint256` (internal)
*Params**

**Returns**
-----
# Function _getPolicyBookFacade
Returns the policybook facade that stores the leverage storage from a policybook

Dev 
## Signature _getPolicyBookFacade(address)
## `_getPolicyBookFacade(address _policybookAddress) → contract IPolicyBookFacade _coveragePool` (internal)
*Params**
 - `_policybookAddress`: address of the policybook


**Returns**
-----
# Function setInjector

Dev 
## Signature setInjector(address)
## `setInjector(address _injector)` (external)
*Params**

**Returns**
-----
# Function setDependencies

Dev has to apply onlyInjectorOrZero() modifier
## Signature setDependencies(contract IContractsRegistry)
## `setDependencies(contract IContractsRegistry)` (external)
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
# Function vStableTotalLiquidity

Dev 
## Signature vStableTotalLiquidity()
## `vStableTotalLiquidity() → uint256` (external)
*Params**

**Returns**
 - `uint256`: the amount of vStable stored in the pool
-----


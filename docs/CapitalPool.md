# `CapitalPool`



## Event PoolBalancesUpdated
## Signature `event` PoolBalancesUpdated(uint256,uint256,uint256,uint256,uint256)




**Params**

## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function __CapitalPool_init

Dev 
## Signature __CapitalPool_init()
## `__CapitalPool_init()` (external)
*Params**

**Returns**
-----
# Function setDependencies

Dev 
## Signature setDependencies(contract IContractsRegistry)
## `setDependencies(contract IContractsRegistry _contractsRegistry)` (external)
*Params**

**Returns**
-----
# Function _setOrIncreaseTetherAllowance
sets the tether allowance between another contract

Dev stblToken requires allowance to be set to zero before modifying its value

## Signature _setOrIncreaseTetherAllowance(address,uint256)
## `_setOrIncreaseTetherAllowance(address _contractAddress, uint256 _stbAmount)` (internal)
*Params**
 - `address`: to modify the allowance

 - `uint256`: amount of tokens to allow

**Returns**
-----
# Function addPolicyHoldersHardSTBL
distributes the policybook premiums into pools (CP, ULP , RP)

Dev distributes the balances acording to the established percentages

## Signature addPolicyHoldersHardSTBL(uint256,uint256,uint256)
## `addPolicyHoldersHardSTBL(uint256 _stblAmount, uint256 _epochsNumber, uint256 _protocolFee) → uint256` (external)
*Params**
 - `_stblAmount`: amount hardSTBL ingressed into the system

 - `_epochsNumber`: uint256 the number of epochs which the policy holder will pay a premium for

 - `_protocolFee`: uint256 the amount of protocol fee earned by premium

**Returns**
-----
# Function _calcPermiumForAllPools

Dev 
## Signature _calcPermiumForAllPools(struct ICapitalPool.PermiumFactors)
## `_calcPermiumForAllPools(struct ICapitalPool.PermiumFactors factors) → uint256 reinsurancePoolPermium, uint256 userLeveragePoolPermium, uint256 coveragePoolPermium` (internal)
*Params**

**Returns**
-----
# Function addCoverageProvidersHardSTBL
distributes the hardSTBL from the coverage providers

Dev emits PoolBalancedUpdated event

## Signature addCoverageProvidersHardSTBL(uint256)
## `addCoverageProvidersHardSTBL(uint256 _stblAmount)` (external)
*Params**
 - `_stblAmount`: amount hardSTBL ingressed into the system

**Returns**
-----
# Function addLeverageProvidersHardSTBL

Dev emits PoolBalancedUpdated event

## Signature addLeverageProvidersHardSTBL(uint256)
## `addLeverageProvidersHardSTBL(uint256 _stblAmount)` (external)
*Params**
 - `_stblAmount`: amount hardSTBL ingressed into the system

**Returns**
-----
# Function addReinsurancePoolHardSTBL
distributes the hardSTBL from the reinsurance pool

Dev emits PoolBalancedUpdated event

## Signature addReinsurancePoolHardSTBL(uint256)
## `addReinsurancePoolHardSTBL(uint256 _stblAmount)` (external)
*Params**
 - `_stblAmount`: amount hardSTBL ingressed into the system

**Returns**
-----
# Function rebalanceLiquidityCushion
TODO if user not withdraw the amount after request withdraw , should the amount returned back to capital pool
rebalances pools acording to v2 specification and dao enforced policies

Dev  emits PoolBalancesUpdated
## Signature rebalanceLiquidityCushion()
## `rebalanceLiquidityCushion()` (public)
*Params**

**Returns**
-----
# Function deployFundsToDefi
deploys liquidity from the reinsurance pool to the yieldGenerator

Dev the amount being transfer must not be greater than the reinsurance pool

## Signature deployFundsToDefi(uint256)
## `deployFundsToDefi(uint256 _stblAmount)` (internal)
*Params**
 - `_stblAmount`: uint256, amount of tokens to transfer to the defiGenerator

**Returns**
-----
# Function fundClaim
Fullfils policybook claims by transfering the balance to claimer

Dev 
## Signature fundClaim(address,uint256)
## `fundClaim(address _claimer, uint256 _stblAmount)` (external)
*Params**
 - `address`: of the claimer recieving the withdraw

 - `_stblAmount`: uint256 amount to be withdrawn

**Returns**
-----
# Function withdrawLiquidity
Withdraws liquidity from a specific policbybook to the user

Dev 
## Signature withdrawLiquidity(address,uint256,bool)
## `withdrawLiquidity(address _sender, uint256 _stblAmount, bool _isLeveragePool)` (external)
*Params**
 - `address`: of the user beneficiary of the withdraw

 - `_stblAmount`: uint256 amount to be withdrawn

**Returns**
-----
# Function setLiquidityCushionDuration
Sets the duration in time the capital pool reserves liquidity

Dev 
## Signature setLiquidityCushionDuration(uint256)
## `setLiquidityCushionDuration(uint256 _newDuration)` (external)
*Params**
 - `_newDuration`: uint256 amount in seconds for the new period

**Returns**
-----
# Function _withdrawFromLiquidityCushion

Dev 
## Signature _withdrawFromLiquidityCushion(address,uint256)
## `_withdrawFromLiquidityCushion(address _sender, uint256 _stblAmount)` (internal)
*Params**

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
# Function virtualUsdtAccumulatedBalance

Dev 
## Signature virtualUsdtAccumulatedBalance()
## `virtualUsdtAccumulatedBalance() → uint256` (external)
*Params**

**Returns**
-----


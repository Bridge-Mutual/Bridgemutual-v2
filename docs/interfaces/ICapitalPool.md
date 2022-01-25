# `ICapitalPool`




# Function virtualUsdtAccumulatedBalance

Dev 
## Signature virtualUsdtAccumulatedBalance()
## `virtualUsdtAccumulatedBalance() → uint256` (external)
*Params**

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
distributes the hardSTBL from the leverage providers

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
rebalances pools acording to v2 specification and dao enforced policies

Dev  emits PoolBalancesUpdated
## Signature rebalanceLiquidityCushion()
## `rebalanceLiquidityCushion()` (external)
*Params**

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

 - `_isLeveragePool`: bool wether the pool is ULP or CP(policybook)

**Returns**
-----
# Function setLiquidityCushionDuration
Sets the duration in time the capital pool reserves liquidity

Dev 
## Signature setLiquidityCushionDuration(uint256)
## `setLiquidityCushionDuration(uint256 _newDuration)` (external)
*Params**
 - `_newDuration`: uint2566 amount in seconds for the new period

**Returns**
-----


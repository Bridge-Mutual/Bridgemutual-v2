# `ILeveragePortfolio`




# Function deployLeverageStableToCoveragePools
deploy lStable from user leverage pool or reinsurance pool using 2 formulas: access by policybook.

Dev if function call from LP then the MPL is of LP and secondMPL is of RP and vise versa

## Signature deployLeverageStableToCoveragePools(uint256,uint256)
## `deployLeverageStableToCoveragePools(uint256 mpl, uint256 secondMPL) → bool, uint256` (external)
*Params**
 - `mpl`: uint256 the MPL of policy book for LP or RP

 - `mpl`: uint256 the MPL of policy book for LP or RP


**Returns**
 - `bool`: is leverage or deleverage , uint256 the amount of lStable
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
# Function setThreshold
set the threshold % for re-evaluation of the lStable provided across all Coverage pools : access by owner

Dev 
## Signature setThreshold(uint256)
## `setThreshold(uint256 threshold)` (external)
*Params**
 - `threshold`: uint256 is the reevaluatation threshold

**Returns**
-----
# Function setProtocolConstant
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
# Function vStableTotalLiquidity

Dev 
## Signature vStableTotalLiquidity()
## `vStableTotalLiquidity() → uint256` (external)
*Params**

**Returns**
 - `uint256`: the amount of vStable stored in the pool
-----
# Function addPolicyPremium
add the portion of 80% of premium to user leverage pool where the leverage provide lstable : access policybook
add the 20% of premium + portion of 80% of premium where reisnurance pool participate in coverage pools (vStable)  : access policybook

Dev 
## Signature addPolicyPremium(uint256,uint256)
## `addPolicyPremium(uint256 epochsNumber, uint256 premiumAmount)` (external)
*Params**
 - `epochsNumber`: uint256 the number of epochs which the policy holder will pay a premium for

 - `premiumAmount`: uint256 the premium amount which is a portion of 80% of the premium

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


# `IUserLeveragePool`




# Function contractType
Returns type of contract this PolicyBook covers, access: ANY

Dev 
## Signature contractType()
## `contractType() → enum IPolicyBookFabric.ContractType _type` (external)
*Params**

**Returns**
 - `_type`: is type of contract
-----
# Function EPOCH_DURATION

Dev 
## Signature EPOCH_DURATION()
## `EPOCH_DURATION() → uint256` (external)
*Params**

**Returns**
-----
# Function READY_TO_WITHDRAW_PERIOD

Dev 
## Signature READY_TO_WITHDRAW_PERIOD()
## `READY_TO_WITHDRAW_PERIOD() → uint256` (external)
*Params**

**Returns**
-----
# Function epochStartTime

Dev 
## Signature epochStartTime()
## `epochStartTime() → uint256` (external)
*Params**

**Returns**
-----
# Function withdrawalsInfo

Dev 
## Signature withdrawalsInfo(address)
## `withdrawalsInfo(address _userAddr) → uint256 _withdrawalAmount, uint256 _readyToWithdrawDate, bool _withdrawalAllowed` (external)
*Params**

**Returns**
-----
# Function __UserLeveragePool_init

Dev 
## Signature __UserLeveragePool_init(enum IPolicyBookFabric.ContractType,string,string)
## `__UserLeveragePool_init(enum IPolicyBookFabric.ContractType _contractType, string _description, string _projectSymbol)` (external)
*Params**

**Returns**
-----
# Function getEpoch

Dev 
## Signature getEpoch(uint256)
## `getEpoch(uint256 time) → uint256` (external)
*Params**

**Returns**
-----
# Function convertBMIXToSTBL
get STBL equivalent
Dev 
## Signature convertBMIXToSTBL(uint256)
## `convertBMIXToSTBL(uint256 _amount) → uint256` (external)
*Params**

**Returns**
-----
# Function convertSTBLToBMIX
get BMIX equivalent
Dev 
## Signature convertSTBLToBMIX(uint256)
## `convertSTBLToBMIX(uint256 _amount) → uint256` (external)
*Params**

**Returns**
-----
# Function forceUpdateBMICoverStakingRewardMultiplier
forces an update of RewardsGenerator multiplier
Dev 
## Signature forceUpdateBMICoverStakingRewardMultiplier()
## `forceUpdateBMICoverStakingRewardMultiplier()` (external)
*Params**

**Returns**
-----
# Function getNewLiquidity
function to get precise current cover and liquidity
Dev 
## Signature getNewLiquidity()
## `getNewLiquidity() → uint256 newTotalLiquidity` (external)
*Params**

**Returns**
-----
# Function updateEpochsInfo

Dev 
## Signature updateEpochsInfo()
## `updateEpochsInfo()` (external)
*Params**

**Returns**
-----
# Function secondsToEndCurrentEpoch

Dev 
## Signature secondsToEndCurrentEpoch()
## `secondsToEndCurrentEpoch() → uint256` (external)
*Params**

**Returns**
-----
# Function addLiquidity
Let user to add liquidity by supplying stable coin, access: ANY

Dev 
## Signature addLiquidity(uint256)
## `addLiquidity(uint256 _liqudityAmount)` (external)
*Params**
 - `_liqudityAmount`: is amount of stable coin tokens to secure

**Returns**
-----
# Function addLiquidityFor
Let eligible contracts add liqiudity for another user by supplying stable coin

Dev 
## Signature addLiquidityFor(address,uint256)
## `addLiquidityFor(address _liquidityHolderAddr, uint256 _liqudityAmount)` (external)
*Params**
 - `_liquidityHolderAddr`: is address of address to assign cover

 - `_liqudityAmount`: is amount of stable coin tokens to secure

**Returns**
-----
# Function addLiquidityAndStake

Dev 
## Signature addLiquidityAndStake(uint256,uint256)
## `addLiquidityAndStake(uint256 _liquidityAmount, uint256 _stakeSTBLAmount)` (external)
*Params**

**Returns**
-----
# Function getAvailableBMIXWithdrawableAmount

Dev 
## Signature getAvailableBMIXWithdrawableAmount(address)
## `getAvailableBMIXWithdrawableAmount(address _userAddr) → uint256` (external)
*Params**

**Returns**
-----
# Function getWithdrawalStatus

Dev 
## Signature getWithdrawalStatus(address)
## `getWithdrawalStatus(address _userAddr) → enum IUserLeveragePool.WithdrawalStatus` (external)
*Params**

**Returns**
-----
# Function requestWithdrawal

Dev 
## Signature requestWithdrawal(uint256)
## `requestWithdrawal(uint256 _tokensToWithdraw)` (external)
*Params**

**Returns**
-----
# Function requestWithdrawalWithPermit

Dev 
## Signature requestWithdrawalWithPermit(uint256,uint8,bytes32,bytes32)
## `requestWithdrawalWithPermit(uint256 _tokensToWithdraw, uint8 _v, bytes32 _r, bytes32 _s)` (external)
*Params**

**Returns**
-----
# Function unlockTokens

Dev 
## Signature unlockTokens()
## `unlockTokens()` (external)
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
# Function getAPY

Dev 
## Signature getAPY()
## `getAPY() → uint256` (external)
*Params**

**Returns**
-----
# Function whitelisted

Dev 
## Signature whitelisted()
## `whitelisted() → bool` (external)
*Params**

**Returns**
-----
# Function whitelist

Dev 
## Signature whitelist(bool)
## `whitelist(bool _whitelisted)` (external)
*Params**

**Returns**
-----
# Function setMaxCapacities
set max total liquidity for the pool

Dev 
## Signature setMaxCapacities(uint256)
## `setMaxCapacities(uint256 _maxCapacities)` (external)
*Params**
 - `_maxCapacities`: uint256 the max total liquidity

**Returns**
-----
# Function numberStats
Getting number stats, access: ANY

Dev 
## Signature numberStats()
## `numberStats() → uint256 _maxCapacities, uint256 _totalSTBLLiquidity, uint256 _stakedSTBL, uint256 _annualProfitYields, uint256 _annualInsuranceCost, uint256 _bmiXRatio` (external)
*Params**

**Returns**
 - `_maxCapacities`: is a max liquidity of the pool

 - `_totalSTBLLiquidity`: is PolicyBook's liquidity

 - `_stakedSTBL`: is how much stable coin are staked on this PolicyBook

 - `_annualProfitYields`: is its APY

 - `_annualInsuranceCost`: is becuase to follow the same function in policy book

 - `_bmiXRatio`: is multiplied by 10**18. To get STBL representation
-----
# Function info
Getting info, access: ANY

Dev 
## Signature info()
## `info() → string _symbol, address _insuredContract, enum IPolicyBookFabric.ContractType _contractType, bool _whitelisted` (external)
*Params**

**Returns**
 - `_symbol`: is the symbol of PolicyBook (bmiXCover)

 - `_insuredContract`: is an addres of insured contract

 - `_contractType`: is becuase to follow the same function in policy book

 - `_whitelisted`: is a state of whitelisting
-----


# `IPolicyBook`




# Function policyHolders

Dev 
## Signature policyHolders(address)
## `policyHolders(address _holder) → uint256, uint256, uint256, uint256, uint256` (external)
*Params**

**Returns**
-----
# Function policyBookFacade

Dev 
## Signature policyBookFacade()
## `policyBookFacade() → contract IPolicyBookFacade` (external)
*Params**

**Returns**
-----
# Function setPolicyBookFacade

Dev 
## Signature setPolicyBookFacade(address)
## `setPolicyBookFacade(address _policyBookFacade)` (external)
*Params**

**Returns**
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
# Function whitelisted

Dev 
## Signature whitelisted()
## `whitelisted() → bool` (external)
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
# Function insuranceContractAddress
Returns address of contract this PolicyBook covers, access: ANY

Dev 
## Signature insuranceContractAddress()
## `insuranceContractAddress() → address _contract` (external)
*Params**

**Returns**
 - `_contract`: is address of covered contract
-----
# Function contractType
Returns type of contract this PolicyBook covers, access: ANY

Dev 
## Signature contractType()
## `contractType() → enum IPolicyBookFabric.ContractType _type` (external)
*Params**

**Returns**
 - `_type`: is type of contract
-----
# Function totalLiquidity

Dev 
## Signature totalLiquidity()
## `totalLiquidity() → uint256` (external)
*Params**

**Returns**
-----
# Function totalCoverTokens

Dev 
## Signature totalCoverTokens()
## `totalCoverTokens() → uint256` (external)
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
# Function __PolicyBook_init

Dev 
## Signature __PolicyBook_init(address,enum IPolicyBookFabric.ContractType,string,string)
## `__PolicyBook_init(address _insuranceContract, enum IPolicyBookFabric.ContractType _contractType, string _description, string _projectSymbol)` (external)
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
# Function submitClaimAndInitializeVoting
submits new claim of the policy book
Dev 
## Signature submitClaimAndInitializeVoting(string)
## `submitClaimAndInitializeVoting(string evidenceURI)` (external)
*Params**

**Returns**
-----
# Function submitAppealAndInitializeVoting
submits new appeal claim of the policy book
Dev 
## Signature submitAppealAndInitializeVoting(string)
## `submitAppealAndInitializeVoting(string evidenceURI)` (external)
*Params**

**Returns**
-----
# Function commitClaim
updates info on claim acceptance
Dev 
## Signature commitClaim(address,uint256,uint256,enum IClaimingRegistry.ClaimStatus)
## `commitClaim(address claimer, uint256 claimAmount, uint256 claimEndTime, enum IClaimingRegistry.ClaimStatus status)` (external)
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
# Function getNewCoverAndLiquidity
function to get precise current cover and liquidity
Dev 
## Signature getNewCoverAndLiquidity()
## `getNewCoverAndLiquidity() → uint256 newTotalCoverTokens, uint256 newTotalLiquidity` (external)
*Params**

**Returns**
-----
# Function getPolicyPrice
view function to get precise policy price

Dev 
## Signature getPolicyPrice(uint256,uint256,address)
## `getPolicyPrice(uint256 _epochsNumber, uint256 _coverTokens, address _buyer) → uint256 totalSeconds, uint256 totalPrice` (external)
*Params**
 - `_epochsNumber`: is number of epochs to cover

 - `_coverTokens`: is number of tokens to cover

 - `_buyer`: address of the user who buy the policy


**Returns**
 - `totalSeconds`: is number of seconds to cover

 - `totalPrice`: is the policy price which will pay by the buyer
-----
# Function buyPolicy
Let user to buy policy by supplying stable coin, access: ANY

Dev 
## Signature buyPolicy(address,uint256,uint256,uint256,address)
## `buyPolicy(address _buyer, uint256 _epochsNumber, uint256 _coverTokens, uint256 _distributorFee, address _distributor) → uint256` (external)
*Params**
 - `_buyer`: who is buying the coverage

 - `_epochsNumber`: period policy will cover

 - `_coverTokens`: amount paid for the coverage

 - `_distributorFee`: distributor fee (commission). It can't be greater than PROTOCOL_PERCENTAGE

 - `_distributor`: if it was sold buy a whitelisted distributor, it is distributor address to receive fee (commission)

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
# Function addLiquidity
Let user to add liquidity by supplying stable coin, access: ANY

Dev 
## Signature addLiquidity(address,uint256,uint256)
## `addLiquidity(address _liquidityAmount, uint256 _liqudityAmount, uint256 _stakeSTBLAmount)` (external)
*Params**
 - `_liqudityAmount`: is amount of stable coin tokens to secure

 - `_liquidityAmount`: uint256 amount to be added on behalf the sender

 - `_stakeSTBLAmount`: uint256 the staked amount if add liq and stake

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
## `getWithdrawalStatus(address _userAddr) → enum IPolicyBook.WithdrawalStatus` (external)
*Params**

**Returns**
-----
# Function requestWithdrawal

Dev 
## Signature requestWithdrawal(uint256,address)
## `requestWithdrawal(uint256 _tokensToWithdraw, address _user)` (external)
*Params**

**Returns**
-----
# Function deployLeverageFunds
deploy leverage funds (RP vStable, RP lStable, ULP lStable)

Dev 
## Signature deployLeverageFunds(uint256,bool)
## `deployLeverageFunds(uint256 deployedAmount, bool isLeverage)` (external)
*Params**
 - `deployedAmount`: uint256 the deployed amount to be added or substracted from the total liquidity

 - `isLeverage`: bool true for increase , false for decrease

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
## Signature withdrawLiquidity(address)
## `withdrawLiquidity(address sender) → uint256` (external)
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
# Function userStats
Getting user stats, access: ANY
Dev 
## Signature userStats(address)
## `userStats(address _user) → struct IPolicyBook.PolicyHolder` (external)
*Params**

**Returns**
-----
# Function numberStats
Getting number stats, access: ANY

Dev 
## Signature numberStats()
## `numberStats() → uint256 _maxCapacities, uint256 _totalSTBLLiquidity, uint256 _stakedSTBL, uint256 _annualProfitYields, uint256 _annualInsuranceCost, uint256 _bmiXRatio` (external)
*Params**

**Returns**
 - `_maxCapacities`: is a max token amount that a user can buy

 - `_totalSTBLLiquidity`: is PolicyBook's liquidity

 - `_stakedSTBL`: is how much stable coin are staked on this PolicyBook

 - `_annualProfitYields`: is its APY

 - `_annualInsuranceCost`: is percentage of cover tokens that is required to be paid for 1 year of insurance
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

 - `_contractType`: is a type of insured contract

 - `_whitelisted`: is a state of whitelisting
-----


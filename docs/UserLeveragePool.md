# `UserLeveragePool`



## Event LiquidityAdded
## Signature `event` LiquidityAdded(address,uint256,uint256)




**Params**

## Event WithdrawalRequested
## Signature `event` WithdrawalRequested(address,uint256,uint256)




**Params**

## Event LiquidityWithdrawn
## Signature `event` LiquidityWithdrawn(address,uint256,uint256)




**Params**

## Event Transfer
## Signature `event` Transfer(address,address,uint256)


Emitted when `value` tokens are moved from one account (`from`) to
another (`to`).
Note that `value` may be zero.

**Params**

## Event Approval
## Signature `event` Approval(address,address,uint256)


Emitted when the allowance of a `spender` for an `owner` is set by
a call to {approve}. `value` is the new allowance.

**Params**

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


# Function __UserLeveragePool_init

Dev 
## Signature __UserLeveragePool_init(enum IPolicyBookFabric.ContractType,string,string)
## `__UserLeveragePool_init(enum IPolicyBookFabric.ContractType _contractType, string _description, string _projectSymbol)` (external)
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
# Function getEpoch

Dev 
## Signature getEpoch(uint256)
## `getEpoch(uint256 time) → uint256` (public)
*Params**

**Returns**
-----
# Function _getPremiumDistributionEpoch

Dev 
## Signature _getPremiumDistributionEpoch()
## `_getPremiumDistributionEpoch() → uint256` (internal)
*Params**

**Returns**
-----
# Function _getSTBLToBMIXRatio

Dev 
## Signature _getSTBLToBMIXRatio(uint256)
## `_getSTBLToBMIXRatio(uint256 currentLiquidity) → uint256` (internal)
*Params**

**Returns**
-----
# Function convertBMIXToSTBL

Dev 
## Signature convertBMIXToSTBL(uint256)
## `convertBMIXToSTBL(uint256 _amount) → uint256` (public)
*Params**

**Returns**
-----
# Function convertSTBLToBMIX

Dev 
## Signature convertSTBLToBMIX(uint256)
## `convertSTBLToBMIX(uint256 _amount) → uint256` (public)
*Params**

**Returns**
-----
# Function _getPremiumsDistribution

Dev 
## Signature _getPremiumsDistribution(uint256,uint256)
## `_getPremiumsDistribution(uint256 lastEpoch, uint256 currentEpoch) → int256 currentDistribution, uint256 distributionEpoch, uint256 newTotalLiquidity` (internal)
*Params**

**Returns**
-----
# Function _distributePremiums

Dev 
## Signature _distributePremiums()
## `_distributePremiums()` (internal)
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
# Function forceUpdateBMICoverStakingRewardMultiplier

Dev 
## Signature forceUpdateBMICoverStakingRewardMultiplier()
## `forceUpdateBMICoverStakingRewardMultiplier()` (public)
*Params**

**Returns**
-----
# Function calcBMIMultiplier

Dev 
## Signature calcBMIMultiplier(struct IUserLeveragePool.BMIMultiplierFactors)
## `calcBMIMultiplier(struct IUserLeveragePool.BMIMultiplierFactors factors) → uint256` (internal)
*Params**

**Returns**
-----
# Function getNewLiquidity

Dev 
## Signature getNewLiquidity()
## `getNewLiquidity() → uint256 newTotalLiquidity` (public)
*Params**

**Returns**
-----
# Function addPolicyPremium
add the portion of 80% of premium to user leverage pool where the leverage provide lstable : access policybook

Dev 
## Signature addPolicyPremium(uint256,uint256)
## `addPolicyPremium(uint256 epochsNumber, uint256 premiumAmount)` (external)
*Params**
 - `epochsNumber`: uint256 the number of epochs which the policy holder will pay a premium for

 - `premiumAmount`: uint256 the premium amount which is a portion of 80% of the premium

**Returns**
-----
# Function _addPolicyPremiumToDistributions

Dev no need to cap epochs because the maximum policy duration is 1 year
## Signature _addPolicyPremiumToDistributions(uint256,uint256)
## `_addPolicyPremiumToDistributions(uint256 _totalSeconds, uint256 _distributedAmount)` (internal)
*Params**

**Returns**
-----
# Function updateEpochsInfo

Dev 
## Signature updateEpochsInfo()
## `updateEpochsInfo()` (public)
*Params**

**Returns**
-----
# Function secondsToEndCurrentEpoch

Dev 
## Signature secondsToEndCurrentEpoch()
## `secondsToEndCurrentEpoch() → uint256` (public)
*Params**

**Returns**
-----
# Function addLiquidity

Dev 
## Signature addLiquidity(uint256)
## `addLiquidity(uint256 _liquidityAmount)` (external)
*Params**

**Returns**
-----
# Function addLiquidityFor

Dev 
## Signature addLiquidityFor(address,uint256)
## `addLiquidityFor(address _liquidityHolderAddr, uint256 _liquidityAmount)` (external)
*Params**

**Returns**
-----
# Function addLiquidityAndStake

Dev 
## Signature addLiquidityAndStake(uint256,uint256)
## `addLiquidityAndStake(uint256 _liquidityAmount, uint256 _stakeSTBLAmount)` (external)
*Params**

**Returns**
-----
# Function _addLiquidity

Dev 
## Signature _addLiquidity(address,uint256)
## `_addLiquidity(address _liquidityHolderAddr, uint256 _liquidityAmount)` (internal)
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
# Function _getUserAvailableSTBL

Dev 
## Signature _getUserAvailableSTBL(address)
## `_getUserAvailableSTBL(address _userAddr) → uint256` (internal)
*Params**

**Returns**
-----
# Function getWithdrawalStatus

Dev 
## Signature getWithdrawalStatus(address)
## `getWithdrawalStatus(address _userAddr) → enum IUserLeveragePool.WithdrawalStatus` (public)
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
# Function requestWithdrawal

Dev 
## Signature requestWithdrawal(uint256)
## `requestWithdrawal(uint256 _tokensToWithdraw)` (public)
*Params**

**Returns**
-----
# Function _lockTokens

Dev 
## Signature _lockTokens(address,uint256)
## `_lockTokens(address _userAddr, uint256 _neededTokensToLock)` (internal)
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

Dev 
## Signature withdrawLiquidity()
## `withdrawLiquidity()` (external)
*Params**

**Returns**
-----
# Function getAPY
returns APY% with 10**5 precision
Dev 
## Signature getAPY()
## `getAPY() → uint256` (public)
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
# Function __ERC20Permit_init

Dev Initializes the {EIP712} domain separator using the `name` parameter, and setting `version` to `"1"`.

It's a good idea to use the same `name` that is defined as the ERC20 token name.
## Signature __ERC20Permit_init(string)
## `__ERC20Permit_init(string name)` (internal)
*Params**

**Returns**
-----
# Function __ERC20Permit_init_unchained

Dev 
## Signature __ERC20Permit_init_unchained(string)
## `__ERC20Permit_init_unchained(string name)` (internal)
*Params**

**Returns**
-----
# Function permit

Dev See {IERC20Permit-permit}.
## Signature permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
## `permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` (public)
*Params**

**Returns**
-----
# Function recover

Dev Overload of {ECDSA-recover-bytes32-bytes-} that receives the `v`,
`r` and `s` signature fields separately.
## Signature recover(bytes32,uint8,bytes32,bytes32)
## `recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) → address` (internal)
*Params**

**Returns**
-----
# Function nonces

Dev See {IERC20Permit-nonces}.
/
## Signature nonces(address)
## `nonces(address owner) → uint256` (public)
*Params**

**Returns**
-----
# Function DOMAIN_SEPARATOR

Dev See {IERC20Permit-DOMAIN_SEPARATOR}.
/
## Signature DOMAIN_SEPARATOR()
## `DOMAIN_SEPARATOR() → bytes32` (external)
*Params**

**Returns**
-----
# Function __EIP712_init

Dev Initializes the domain separator and parameter caches.

The meaning of `name` and `version` is specified in
https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator[EIP 712]:

- `name`: the user readable name of the signing domain, i.e. the name of the DApp or the protocol.
- `version`: the current major version of the signing domain.

NOTE: These parameters cannot be changed except through a xref:learn::upgrading-smart-contracts.adoc[smart
contract upgrade].
## Signature __EIP712_init(string,string)
## `__EIP712_init(string name, string version)` (internal)
*Params**

**Returns**
-----
# Function __EIP712_init_unchained

Dev 
## Signature __EIP712_init_unchained(string,string)
## `__EIP712_init_unchained(string name, string version)` (internal)
*Params**

**Returns**
-----
# Function _domainSeparatorV4

Dev Returns the domain separator for the current chain.
## Signature _domainSeparatorV4()
## `_domainSeparatorV4() → bytes32` (internal)
*Params**

**Returns**
-----
# Function _hashTypedDataV4

Dev Given an already https://eips.ethereum.org/EIPS/eip-712#definition-of-hashstruct[hashed struct], this
function returns the hash of the fully encoded EIP712 message for this domain.

This hash can be used together with {ECDSA-recover} to obtain the signer of a message. For example:

```solidity
bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
    keccak256("Mail(address to,string contents)"),
    mailTo,
    keccak256(bytes(mailContents))
)));
address signer = ECDSA.recover(digest, signature);
```
## Signature _hashTypedDataV4(bytes32)
## `_hashTypedDataV4(bytes32 structHash) → bytes32` (internal)
*Params**

**Returns**
-----
# Function _EIP712NameHash

Dev The hash of the name parameter for the EIP712 domain.

NOTE: This function reads from storage by default, but can be redefined to return a constant value if gas costs
are a concern.
## Signature _EIP712NameHash()
## `_EIP712NameHash() → bytes32` (internal)
*Params**

**Returns**
-----
# Function _EIP712VersionHash

Dev The hash of the version parameter for the EIP712 domain.

NOTE: This function reads from storage by default, but can be redefined to return a constant value if gas costs
are a concern.
## Signature _EIP712VersionHash()
## `_EIP712VersionHash() → bytes32` (internal)
*Params**

**Returns**
-----
# Function __ERC20_init

Dev Sets the values for {name} and {symbol}, initializes {decimals} with
a default value of 18.
To select a different value for {decimals}, use {_setupDecimals}.
All three of these values are immutable: they can only be set once during
construction.
## Signature __ERC20_init(string,string)
## `__ERC20_init(string name_, string symbol_)` (internal)
*Params**

**Returns**
-----
# Function __ERC20_init_unchained

Dev 
## Signature __ERC20_init_unchained(string,string)
## `__ERC20_init_unchained(string name_, string symbol_)` (internal)
*Params**

**Returns**
-----
# Function name

Dev Returns the name of the token.
## Signature name()
## `name() → string` (public)
*Params**

**Returns**
-----
# Function symbol

Dev Returns the symbol of the token, usually a shorter version of the
name.
## Signature symbol()
## `symbol() → string` (public)
*Params**

**Returns**
-----
# Function decimals

Dev Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5,05` (`505 / 10 ** 2`).
Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is
called.
NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}.
## Signature decimals()
## `decimals() → uint8` (public)
*Params**

**Returns**
-----
# Function totalSupply

Dev See {IERC20-totalSupply}.
## Signature totalSupply()
## `totalSupply() → uint256` (public)
*Params**

**Returns**
-----
# Function balanceOf

Dev See {IERC20-balanceOf}.
## Signature balanceOf(address)
## `balanceOf(address account) → uint256` (public)
*Params**

**Returns**
-----
# Function transfer

Dev See {IERC20-transfer}.
Requirements:
- `recipient` cannot be the zero address.
- the caller must have a balance of at least `amount`.
## Signature transfer(address,uint256)
## `transfer(address recipient, uint256 amount) → bool` (public)
*Params**

**Returns**
-----
# Function allowance

Dev See {IERC20-allowance}.
## Signature allowance(address,address)
## `allowance(address owner, address spender) → uint256` (public)
*Params**

**Returns**
-----
# Function approve

Dev See {IERC20-approve}.
Requirements:
- `spender` cannot be the zero address.
## Signature approve(address,uint256)
## `approve(address spender, uint256 amount) → bool` (public)
*Params**

**Returns**
-----
# Function transferFrom

Dev See {IERC20-transferFrom}.
Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.
Requirements:
- `sender` and `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.
- the caller must have allowance for ``sender``'s tokens of at least
`amount`.
## Signature transferFrom(address,address,uint256)
## `transferFrom(address sender, address recipient, uint256 amount) → bool` (public)
*Params**

**Returns**
-----
# Function increaseAllowance

Dev Atomically increases the allowance granted to `spender` by the caller.
This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.
Emits an {Approval} event indicating the updated allowance.
Requirements:
- `spender` cannot be the zero address.
## Signature increaseAllowance(address,uint256)
## `increaseAllowance(address spender, uint256 addedValue) → bool` (public)
*Params**

**Returns**
-----
# Function decreaseAllowance

Dev Atomically decreases the allowance granted to `spender` by the caller.
This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.
Emits an {Approval} event indicating the updated allowance.
Requirements:
- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`.
## Signature decreaseAllowance(address,uint256)
## `decreaseAllowance(address spender, uint256 subtractedValue) → bool` (public)
*Params**

**Returns**
-----
# Function _transfer

Dev Moves tokens `amount` from `sender` to `recipient`.
This is internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.
Emits a {Transfer} event.
Requirements:
- `sender` cannot be the zero address.
- `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.
## Signature _transfer(address,address,uint256)
## `_transfer(address sender, address recipient, uint256 amount)` (internal)
*Params**

**Returns**
-----
# Function _mint

Dev Creates `amount` tokens and assigns them to `account`, increasing
the total supply.
Emits a {Transfer} event with `from` set to the zero address.
Requirements:
- `to` cannot be the zero address.
## Signature _mint(address,uint256)
## `_mint(address account, uint256 amount)` (internal)
*Params**

**Returns**
-----
# Function _burn

Dev Destroys `amount` tokens from `account`, reducing the
total supply.
Emits a {Transfer} event with `to` set to the zero address.
Requirements:
- `account` cannot be the zero address.
- `account` must have at least `amount` tokens.
## Signature _burn(address,uint256)
## `_burn(address account, uint256 amount)` (internal)
*Params**

**Returns**
-----
# Function _approve

Dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
This internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.
Emits an {Approval} event.
Requirements:
- `owner` cannot be the zero address.
- `spender` cannot be the zero address.
## Signature _approve(address,address,uint256)
## `_approve(address owner, address spender, uint256 amount)` (internal)
*Params**

**Returns**
-----
# Function _setupDecimals

Dev Sets {decimals} to a value other than the default one of 18.
WARNING: This function should only be called from the constructor. Most
applications that interact with token contracts will not expect
{decimals} to ever change, and may work incorrectly if it does.
## Signature _setupDecimals(uint8)
## `_setupDecimals(uint8 decimals_)` (internal)
*Params**

**Returns**
-----
# Function _beforeTokenTransfer

Dev Hook that is called before any transfer of tokens. This includes
minting and burning.
Calling conditions:
- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
will be to transferred to `to`.
- when `from` is zero, `amount` tokens will be minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens will be burned.
- `from` and `to` are never both zero.
To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
## Signature _beforeTokenTransfer(address,address,uint256)
## `_beforeTokenTransfer(address from, address to, uint256 amount)` (internal)
*Params**

**Returns**
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
# Function whitelisted

Dev 
## Signature whitelisted()
## `whitelisted() → bool` (external)
*Params**

**Returns**
-----
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


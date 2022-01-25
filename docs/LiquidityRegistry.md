# `LiquidityRegistry`



## Event PolicyBookAdded
## Signature `event` PolicyBookAdded(address,address)




**Params**

## Event PolicyBookRemoved
## Signature `event` PolicyBookRemoved(address,address)




**Params**


# Function setDependencies

Dev 
## Signature setDependencies(contract IContractsRegistry)
## `setDependencies(contract IContractsRegistry _contractsRegistry)` (external)
*Params**

**Returns**
-----
# Function tryToAddPolicyBook

Dev 
## Signature tryToAddPolicyBook(address,address)
## `tryToAddPolicyBook(address _userAddr, address _policyBookAddr)` (external)
*Params**

**Returns**
-----
# Function tryToRemovePolicyBook

Dev 
## Signature tryToRemovePolicyBook(address,address)
## `tryToRemovePolicyBook(address _userAddr, address _policyBookAddr)` (external)
*Params**

**Returns**
-----
# Function getPolicyBooksArrLength

Dev 
## Signature getPolicyBooksArrLength(address)
## `getPolicyBooksArrLength(address _userAddr) → uint256` (external)
*Params**

**Returns**
-----
# Function getPolicyBooksArr

Dev 
## Signature getPolicyBooksArr(address)
## `getPolicyBooksArr(address _userAddr) → address[] _resultArr` (external)
*Params**

**Returns**
-----
# Function getLiquidityInfos
_bmiXRatio comes with 10**18 precision
Dev 
## Signature getLiquidityInfos(address,uint256,uint256)
## `getLiquidityInfos(address _userAddr, uint256 _offset, uint256 _limit) → struct ILiquidityRegistry.LiquidityInfo[] _resultArr` (external)
*Params**

**Returns**
-----
# Function getWithdrawalRequests

Dev 
## Signature getWithdrawalRequests(address,uint256,uint256)
## `getWithdrawalRequests(address _userAddr, uint256 _offset, uint256 _limit) → uint256 _arrLength, struct ILiquidityRegistry.WithdrawalRequestInfo[] _resultArr` (external)
*Params**

**Returns**
-----
# Function getWithdrawalSet

Dev 
## Signature getWithdrawalSet(address,uint256,uint256)
## `getWithdrawalSet(address _userAddr, uint256 _offset, uint256 _limit) → uint256 _arrLength, struct ILiquidityRegistry.WithdrawalSetInfo[] _resultArr` (external)
*Params**

**Returns**
-----
# Function isLiquidityProvider

Dev    Returns true is {_userAddr} is a liquidity provider in {_policyBookAddr}
## Signature isLiquidityProvider(address,address)
## `isLiquidityProvider(address _userAddr, address _policyBookAddr) → bool` (external)
*Params**

**Returns**
-----
# Function registerWithdrawl
Register's coverages Withdrawals in chronological order

Dev Requires withdrawls to be serialized according to their withdrawl date

## Signature registerWithdrawl(address,address)
## `registerWithdrawl(address _policyBook, address _user)` (external)
*Params**
 - `_policyBook`: address of the policybook with requested withdrawl

 - `_user`: address user addres requesting withdrawl

**Returns**
-----
# Function getWithdrawalRequestsInWindowTime
fetches the withdrawal data and amounts across all policybooks given a time contrain

Dev 
## Signature getWithdrawalRequestsInWindowTime(uint256,uint256)
## `getWithdrawalRequestsInWindowTime(uint256 _startTime, uint256 _endTime) → address[] _pbooks, address[] _users, uint256 _acumulatedAmount, uint256 _count` (external)
*Params**
 - `_startTime`: uint256 withdrawal window time window start

 - `_endTime`: uint256 withdrawal window time window end


**Returns**
 - `_pbooks`: address[] list of policies withdrawls

 - `_users`: address[] list of users withdrawls

 - `_acumulatedAmount`: uint256 collected withdrawl amount in window

 - `_count`: uint256 number of results retunred
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


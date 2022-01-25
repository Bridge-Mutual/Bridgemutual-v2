# `ILiquidityRegistry`




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

Dev 
## Signature isLiquidityProvider(address,address)
## `isLiquidityProvider(address _userAddr, address _policyBookAddr) → bool` (external)
*Params**

**Returns**
-----
# Function registerWithdrawl

Dev 
## Signature registerWithdrawl(address,address)
## `registerWithdrawl(address _policyBook, address _users)` (external)
*Params**

**Returns**
-----
# Function getWithdrawalRequestsInWindowTime

Dev 
## Signature getWithdrawalRequestsInWindowTime(uint256,uint256)
## `getWithdrawalRequestsInWindowTime(uint256 _startTime, uint256 _endTime) → address[] _pbooks, address[] _users, uint256 _acumulatedAmount, uint256 _count` (external)
*Params**

**Returns**
-----


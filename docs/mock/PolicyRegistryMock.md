# `PolicyRegistryMock`



## Event PolicyAdded
## Signature `event` PolicyAdded(address,address,uint256)




**Params**

## Event PolicyRemoved
## Signature `event` PolicyRemoved(address,address)




**Params**


# Function setPolicyEndTime

Dev 
## Signature setPolicyEndTime(address,address,uint256)
## `setPolicyEndTime(address userAddr, address policyBookAddr, uint256 endTime)` (external)
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
# Function getPoliciesLength

Dev 
## Signature getPoliciesLength(address)
## `getPoliciesLength(address _userAddr) → uint256` (external)
*Params**

**Returns**
-----
# Function policyExists

Dev 
## Signature policyExists(address,address)
## `policyExists(address _userAddr, address _policyBookAddr) → bool` (external)
*Params**

**Returns**
-----
# Function isPolicyActive

Dev 
## Signature isPolicyActive(address,address)
## `isPolicyActive(address _userAddr, address _policyBookAddr) → bool` (public)
*Params**

**Returns**
-----
# Function policyStartTime

Dev 
## Signature policyStartTime(address,address)
## `policyStartTime(address _userAddr, address _policyBookAddr) → uint256` (public)
*Params**

**Returns**
-----
# Function policyEndTime

Dev 
## Signature policyEndTime(address,address)
## `policyEndTime(address _userAddr, address _policyBookAddr) → uint256` (public)
*Params**

**Returns**
-----
# Function getPoliciesInfo

Dev use with getPoliciesLength()
## Signature getPoliciesInfo(address,bool,uint256,uint256)
## `getPoliciesInfo(address _userAddr, bool _isActive, uint256 _offset, uint256 _limit) → uint256 _policiesCount, address[] _policyBooksArr, struct IPolicyRegistry.PolicyInfo[] _policiesArr, enum IClaimingRegistry.ClaimStatus[] _policyStatuses` (external)
*Params**

**Returns**
-----
# Function getUsersInfo

Dev 
## Signature getUsersInfo(address[],address[])
## `getUsersInfo(address[] _users, address[] _policyBooks) → struct IPolicyRegistry.PolicyUserInfo[] _usersInfos` (external)
*Params**

**Returns**
-----
# Function getPoliciesArr

Dev 
## Signature getPoliciesArr(address)
## `getPoliciesArr(address _userAddr) → address[] _arr` (external)
*Params**

**Returns**
-----
# Function addPolicy

Dev 
## Signature addPolicy(address,uint256,uint256,uint256)
## `addPolicy(address _userAddr, uint256 _coverAmount, uint256 _premium, uint256 _durationSeconds)` (external)
*Params**

**Returns**
-----
# Function removePolicy

Dev 
## Signature removePolicy(address)
## `removePolicy(address _userAddr)` (external)
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
# Function STILL_CLAIMABLE_FOR

Dev 
## Signature STILL_CLAIMABLE_FOR()
## `STILL_CLAIMABLE_FOR() → uint256` (external)
*Params**

**Returns**
-----


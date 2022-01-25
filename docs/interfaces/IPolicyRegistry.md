# `IPolicyRegistry`




# Function STILL_CLAIMABLE_FOR

Dev 
## Signature STILL_CLAIMABLE_FOR()
## `STILL_CLAIMABLE_FOR() → uint256` (external)
*Params**

**Returns**
-----
# Function getPoliciesLength
Returns the number of the policy for the user, access: ANY

Dev 
## Signature getPoliciesLength(address)
## `getPoliciesLength(address _userAddr) → uint256` (external)
*Params**
 - `_userAddr`: Policy holder address


**Returns**
 - `the`: number of police in the array
-----
# Function policyExists
Shows whether the user has a policy, access: ANY

Dev 
## Signature policyExists(address,address)
## `policyExists(address _userAddr, address _policyBookAddr) → bool` (external)
*Params**
 - `_userAddr`: Policy holder address

 - `_policyBookAddr`: Address of policy book


**Returns**
 - `true`: if user has policy in specific policy book
-----
# Function isPolicyActive
Returns information about current policy, access: ANY

Dev 
## Signature isPolicyActive(address,address)
## `isPolicyActive(address _userAddr, address _policyBookAddr) → bool` (external)
*Params**
 - `_userAddr`: Policy holder address

 - `_policyBookAddr`: Address of policy book


**Returns**
 - `true`: if user has active policy in specific policy book
-----
# Function policyStartTime
returns current policy start time or zero
Dev 
## Signature policyStartTime(address,address)
## `policyStartTime(address _userAddr, address _policyBookAddr) → uint256` (external)
*Params**

**Returns**
-----
# Function policyEndTime
returns current policy end time or zero
Dev 
## Signature policyEndTime(address,address)
## `policyEndTime(address _userAddr, address _policyBookAddr) → uint256` (external)
*Params**

**Returns**
-----
# Function getPoliciesInfo
Returns the array of the policy itself , access: ANY

Dev 
## Signature getPoliciesInfo(address,bool,uint256,uint256)
## `getPoliciesInfo(address _userAddr, bool _isActive, uint256 _offset, uint256 _limit) → uint256 _policiesCount, address[] _policyBooksArr, struct IPolicyRegistry.PolicyInfo[] _policies, enum IClaimingRegistry.ClaimStatus[] _policyStatuses` (external)
*Params**
 - `_userAddr`: Policy holder address

 - `_isActive`: If true, then returns an array with information about active policies, if false, about inactive


**Returns**
 - `_policiesCount`: is the number of police in the array

 - `_policyBooksArr`: is the array of policy books addresses

 - `_policies`: is the array of policies

 - `_policyStatuses`: parameter will show which button to display on the dashboard
-----
# Function getUsersInfo
Getting stats from users of policy books, access: ANY
Dev 
## Signature getUsersInfo(address[],address[])
## `getUsersInfo(address[] _users, address[] _policyBooks) → struct IPolicyRegistry.PolicyUserInfo[] _stats` (external)
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
Adds a new policy to the list , access: ONLY POLICY BOOKS

Dev 
## Signature addPolicy(address,uint256,uint256,uint256)
## `addPolicy(address _userAddr, uint256 _coverAmount, uint256 _premium, uint256 _durationDays)` (external)
*Params**
 - `_userAddr`: is the user's address

 - `_coverAmount`: is the number of insured tokens

 - `_premium`: is the name of PolicyBook

 - `_durationDays`: is the number of days for which the insured

**Returns**
-----
# Function removePolicy
Removes the policy book from the list, access: ONLY POLICY BOOKS

Dev 
## Signature removePolicy(address)
## `removePolicy(address _userAddr)` (external)
*Params**
 - `_userAddr`: is the user's address

**Returns**
-----


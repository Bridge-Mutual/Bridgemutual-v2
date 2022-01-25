# `IReputationSystem`




# Function setNewReputation
sets new reputation for the voter
Dev 
## Signature setNewReputation(address,uint256)
## `setNewReputation(address voter, uint256 newReputation)` (external)
*Params**

**Returns**
-----
# Function getNewReputation
returns voter's new reputation
Dev 
## Signature getNewReputation(address,uint256)
## `getNewReputation(address voter, uint256 percentageWithPrecision) → uint256` (external)
*Params**

**Returns**
-----
# Function getNewReputation
alternative way of knowing new reputation
Dev 
## Signature getNewReputation(uint256,uint256)
## `getNewReputation(uint256 voterReputation, uint256 percentageWithPrecision) → uint256` (external)
*Params**

**Returns**
-----
# Function hasVotedOnce
returns true if the user voted at least once
Dev 
## Signature hasVotedOnce(address)
## `hasVotedOnce(address user) → bool` (external)
*Params**

**Returns**
-----
# Function isTrustedVoter
returns true if user's reputation is grater than or equal to trusted voter threshold
Dev 
## Signature isTrustedVoter(address)
## `isTrustedVoter(address user) → bool` (external)
*Params**

**Returns**
-----
# Function getTrustedVoterReputationThreshold
this function returns reputation threshold multiplied by 10**25
Dev 
## Signature getTrustedVoterReputationThreshold()
## `getTrustedVoterReputationThreshold() → uint256` (external)
*Params**

**Returns**
-----
# Function reputation
this function returns reputation multiplied by 10**25
Dev 
## Signature reputation(address)
## `reputation(address user) → uint256` (external)
*Params**

**Returns**
-----


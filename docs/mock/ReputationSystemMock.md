# `ReputationSystemMock`



## Event ReputationSet
## Signature `event` ReputationSet(address,uint256)




**Params**


# Function setNewReputationNoCheck

Dev 
## Signature setNewReputationNoCheck(address,uint256)
## `setNewReputationNoCheck(address user, uint256 newReputation)` (external)
*Params**

**Returns**
-----
# Function __ReputationSystem_init

Dev 
## Signature __ReputationSystem_init(address[])
## `__ReputationSystem_init(address[] team)` (external)
*Params**

**Returns**
-----
# Function _initTeamReputation

Dev 
## Signature _initTeamReputation(address[])
## `_initTeamReputation(address[] team)` (internal)
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
# Function setNewReputation

Dev 
## Signature setNewReputation(address,uint256)
## `setNewReputation(address voter, uint256 newReputation)` (external)
*Params**

**Returns**
-----
# Function _setNewReputation

Dev 
## Signature _setNewReputation(address,uint256)
## `_setNewReputation(address voter, uint256 newReputation)` (internal)
*Params**

**Returns**
-----
# Function _recalculateTrustedVoterReputationThreshold

Dev 
## Signature _recalculateTrustedVoterReputationThreshold()
## `_recalculateTrustedVoterReputationThreshold()` (internal)
*Params**

**Returns**
-----
# Function getNewReputation

Dev 
## Signature getNewReputation(address,uint256)
## `getNewReputation(address voter, uint256 percentageWithPrecision) → uint256` (external)
*Params**

**Returns**
-----
# Function getNewReputation

Dev 
## Signature getNewReputation(uint256,uint256)
## `getNewReputation(uint256 voterReputation, uint256 percentageWithPrecision) → uint256` (public)
*Params**

**Returns**
-----
# Function hasVotedOnce

Dev 
## Signature hasVotedOnce(address)
## `hasVotedOnce(address user) → bool` (external)
*Params**

**Returns**
-----
# Function isTrustedVoter

Dev this function will count voters as trusted that have initial reputation >= 2.0
regardless of how many times have they voted
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


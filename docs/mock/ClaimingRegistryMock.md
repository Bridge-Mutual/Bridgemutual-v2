# `ClaimingRegistryMock`



## Event AppealPending
## Signature `event` AppealPending(address,address,uint256)




**Params**

## Event ClaimPending
## Signature `event` ClaimPending(address,address,uint256)




**Params**

## Event ClaimAccepted
## Signature `event` ClaimAccepted(address,address,uint256,uint256)




**Params**

## Event ClaimRejected
## Signature `event` ClaimRejected(address,address,uint256)




**Params**

## Event AppealRejected
## Signature `event` AppealRejected(address,address,uint256)




**Params**


# Function updateStatus

Dev 
## Signature updateStatus(address,address,enum IClaimingRegistry.ClaimStatus)
## `updateStatus(address user, address policyBook, enum IClaimingRegistry.ClaimStatus status)` (external)
*Params**

**Returns**
-----
# Function hasClaim

Dev 
## Signature hasClaim(address,address)
## `hasClaim(address claimer, address policyBookAddress) → bool` (external)
*Params**

**Returns**
-----
# Function __ClaimingRegistry_init

Dev 
## Signature __ClaimingRegistry_init()
## `__ClaimingRegistry_init()` (external)
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
# Function _isClaimAwaitingCalculation

Dev 
## Signature _isClaimAwaitingCalculation(uint256)
## `_isClaimAwaitingCalculation(uint256 index) → bool` (internal)
*Params**

**Returns**
-----
# Function _isClaimAppealExpired

Dev 
## Signature _isClaimAppealExpired(uint256)
## `_isClaimAppealExpired(uint256 index) → bool` (internal)
*Params**

**Returns**
-----
# Function anonymousVotingDuration

Dev 
## Signature anonymousVotingDuration(uint256)
## `anonymousVotingDuration(uint256 index) → uint256` (public)
*Params**

**Returns**
-----
# Function votingDuration

Dev 
## Signature votingDuration(uint256)
## `votingDuration(uint256 index) → uint256` (public)
*Params**

**Returns**
-----
# Function anyoneCanCalculateClaimResultAfter

Dev 
## Signature anyoneCanCalculateClaimResultAfter(uint256)
## `anyoneCanCalculateClaimResultAfter(uint256 index) → uint256` (public)
*Params**

**Returns**
-----
# Function canBuyNewPolicy

Dev 
## Signature canBuyNewPolicy(address,address)
## `canBuyNewPolicy(address buyer, address policyBookAddress) → bool` (external)
*Params**

**Returns**
-----
# Function submitClaim

Dev 
## Signature submitClaim(address,address,string,uint256,bool)
## `submitClaim(address claimer, address policyBookAddress, string evidenceURI, uint256 cover, bool appeal) → uint256 _newClaimIndex` (external)
*Params**

**Returns**
-----
# Function claimExists

Dev 
## Signature claimExists(uint256)
## `claimExists(uint256 index) → bool` (public)
*Params**

**Returns**
-----
# Function claimSubmittedTime

Dev 
## Signature claimSubmittedTime(uint256)
## `claimSubmittedTime(uint256 index) → uint256` (external)
*Params**

**Returns**
-----
# Function claimEndTime

Dev 
## Signature claimEndTime(uint256)
## `claimEndTime(uint256 index) → uint256` (external)
*Params**

**Returns**
-----
# Function isClaimAnonymouslyVotable

Dev 
## Signature isClaimAnonymouslyVotable(uint256)
## `isClaimAnonymouslyVotable(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function isClaimExposablyVotable

Dev 
## Signature isClaimExposablyVotable(uint256)
## `isClaimExposablyVotable(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function isClaimVotable

Dev 
## Signature isClaimVotable(uint256)
## `isClaimVotable(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function canClaimBeCalculatedByAnyone

Dev 
## Signature canClaimBeCalculatedByAnyone(uint256)
## `canClaimBeCalculatedByAnyone(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function isClaimPending

Dev 
## Signature isClaimPending(uint256)
## `isClaimPending(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function countPolicyClaimerClaims

Dev 
## Signature countPolicyClaimerClaims(address)
## `countPolicyClaimerClaims(address claimer) → uint256` (external)
*Params**

**Returns**
-----
# Function countPendingClaims

Dev 
## Signature countPendingClaims()
## `countPendingClaims() → uint256` (external)
*Params**

**Returns**
-----
# Function countClaims

Dev 
## Signature countClaims()
## `countClaims() → uint256` (external)
*Params**

**Returns**
-----
# Function claimOfOwnerIndexAt
Gets the the claim index for for the users claim at an indexed position

Dev 
## Signature claimOfOwnerIndexAt(address,uint256)
## `claimOfOwnerIndexAt(address claimer, uint256 orderIndex) → uint256` (external)
*Params**
 - `claimer`: address of of the user

 - `orderIndex`: uint256, numeric value for index


**Returns**
-----
# Function pendingClaimIndexAt

Dev 
## Signature pendingClaimIndexAt(uint256)
## `pendingClaimIndexAt(uint256 orderIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function claimIndexAt

Dev 
## Signature claimIndexAt(uint256)
## `claimIndexAt(uint256 orderIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function claimIndex

Dev 
## Signature claimIndex(address,address)
## `claimIndex(address claimer, address policyBookAddress) → uint256` (external)
*Params**

**Returns**
-----
# Function isClaimAppeal

Dev 
## Signature isClaimAppeal(uint256)
## `isClaimAppeal(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function policyStatus

Dev 
## Signature policyStatus(address,address)
## `policyStatus(address claimer, address policyBookAddress) → enum IClaimingRegistry.ClaimStatus` (external)
*Params**

**Returns**
-----
# Function claimStatus

Dev 
## Signature claimStatus(uint256)
## `claimStatus(uint256 index) → enum IClaimingRegistry.ClaimStatus` (public)
*Params**

**Returns**
-----
# Function claimOwner

Dev 
## Signature claimOwner(uint256)
## `claimOwner(uint256 index) → address` (external)
*Params**

**Returns**
-----
# Function claimPolicyBook
Gets the policybook address of a claim with a certain index

Dev 
## Signature claimPolicyBook(uint256)
## `claimPolicyBook(uint256 index) → address` (external)
*Params**
 - `index`: uint256, numeric index value


**Returns**
-----
# Function claimInfo
gets the full claim information at a particular index.

Dev 
## Signature claimInfo(uint256)
## `claimInfo(uint256 index) → struct IClaimingRegistry.ClaimInfo _claimInfo` (external)
*Params**
 - `index`: uint256, numeric index value


**Returns**
 - `_claimInfo`: ClaimInfo
-----
# Function getClaimableIndexes
gets the list of accepted claims

Dev selects claims with ACCEPTED status

## Signature getClaimableIndexes()
## `getClaimableIndexes() → uint256[], uint256 _lenght` (external)
*Params**

**Returns**
-----
# Function getClaimableAmounts
gets the claiming balance from a list of claim indexes

Dev 
## Signature getClaimableAmounts(uint256[])
## `getClaimableAmounts(uint256[] _claimIndexes) → uint256` (external)
*Params**
 - `_claimIndexes`: uint256[], list of claimIndexes


**Returns**
-----
# Function _modifyClaim

Dev 
## Signature _modifyClaim(uint256,bool)
## `_modifyClaim(uint256 index, bool accept)` (internal)
*Params**

**Returns**
-----
# Function acceptClaim

Dev 
## Signature acceptClaim(uint256)
## `acceptClaim(uint256 index)` (external)
*Params**

**Returns**
-----
# Function rejectClaim

Dev 
## Signature rejectClaim(uint256)
## `rejectClaim(uint256 index)` (external)
*Params**

**Returns**
-----
# Function updateImageUriOfClaim
Update Image Uri in case it contains material that is ilegal
        or offensive.

Dev Only the owner of the PolicyBookAdmin can erase/update evidenceUri.

## Signature updateImageUriOfClaim(uint256,string)
## `updateImageUriOfClaim(uint256 _claimIndex, string _newEvidenceURI)` (external)
*Params**
 - `_claimIndex`: Claim Index that is going to be updated

 - `_newEvidenceURI`: New evidence uri. It can be blank.

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


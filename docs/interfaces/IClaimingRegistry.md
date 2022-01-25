# `IClaimingRegistry`




# Function anonymousVotingDuration
returns anonymous voting duration
Dev 
## Signature anonymousVotingDuration(uint256)
## `anonymousVotingDuration(uint256 index) → uint256` (external)
*Params**

**Returns**
-----
# Function votingDuration
returns the whole voting duration
Dev 
## Signature votingDuration(uint256)
## `votingDuration(uint256 index) → uint256` (external)
*Params**

**Returns**
-----
# Function anyoneCanCalculateClaimResultAfter
returns how many time should pass before anyone could calculate a claim result
Dev 
## Signature anyoneCanCalculateClaimResultAfter(uint256)
## `anyoneCanCalculateClaimResultAfter(uint256 index) → uint256` (external)
*Params**

**Returns**
-----
# Function canBuyNewPolicy
returns true if a user can buy new policy of specified PolicyBook
Dev 
## Signature canBuyNewPolicy(address,address)
## `canBuyNewPolicy(address buyer, address policyBookAddress) → bool` (external)
*Params**

**Returns**
-----
# Function submitClaim
submits new PolicyBook claim for the user
Dev 
## Signature submitClaim(address,address,string,uint256,bool)
## `submitClaim(address user, address policyBookAddress, string evidenceURI, uint256 cover, bool appeal) → uint256` (external)
*Params**

**Returns**
-----
# Function claimExists
returns true if the claim with this index exists
Dev 
## Signature claimExists(uint256)
## `claimExists(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function claimSubmittedTime
returns claim submition time
Dev 
## Signature claimSubmittedTime(uint256)
## `claimSubmittedTime(uint256 index) → uint256` (external)
*Params**

**Returns**
-----
# Function claimEndTime
returns claim end time or zero in case it is pending
Dev 
## Signature claimEndTime(uint256)
## `claimEndTime(uint256 index) → uint256` (external)
*Params**

**Returns**
-----
# Function isClaimAnonymouslyVotable
returns true if the claim is anonymously votable
Dev 
## Signature isClaimAnonymouslyVotable(uint256)
## `isClaimAnonymouslyVotable(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function isClaimExposablyVotable
returns true if the claim is exposably votable
Dev 
## Signature isClaimExposablyVotable(uint256)
## `isClaimExposablyVotable(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function isClaimVotable
returns true if claim is anonymously votable or exposably votable
Dev 
## Signature isClaimVotable(uint256)
## `isClaimVotable(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function canClaimBeCalculatedByAnyone
returns true if a claim can be calculated by anyone
Dev 
## Signature canClaimBeCalculatedByAnyone(uint256)
## `canClaimBeCalculatedByAnyone(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function isClaimPending
returns true if this claim is pending or awaiting
Dev 
## Signature isClaimPending(uint256)
## `isClaimPending(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function countPolicyClaimerClaims
returns how many claims the holder has
Dev 
## Signature countPolicyClaimerClaims(address)
## `countPolicyClaimerClaims(address user) → uint256` (external)
*Params**

**Returns**
-----
# Function countPendingClaims
returns how many pending claims are there
Dev 
## Signature countPendingClaims()
## `countPendingClaims() → uint256` (external)
*Params**

**Returns**
-----
# Function countClaims
returns how many claims are there
Dev 
## Signature countClaims()
## `countClaims() → uint256` (external)
*Params**

**Returns**
-----
# Function claimOfOwnerIndexAt
returns a claim index of it's claimer and an ordinal number
Dev 
## Signature claimOfOwnerIndexAt(address,uint256)
## `claimOfOwnerIndexAt(address claimer, uint256 orderIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function pendingClaimIndexAt
returns pending claim index by its ordinal index
Dev 
## Signature pendingClaimIndexAt(uint256)
## `pendingClaimIndexAt(uint256 orderIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function claimIndexAt
returns claim index by its ordinal index
Dev 
## Signature claimIndexAt(uint256)
## `claimIndexAt(uint256 orderIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function claimIndex
returns current active claim index by policybook and claimer
Dev 
## Signature claimIndex(address,address)
## `claimIndex(address claimer, address policyBookAddress) → uint256` (external)
*Params**

**Returns**
-----
# Function isClaimAppeal
returns true if the claim is appealed
Dev 
## Signature isClaimAppeal(uint256)
## `isClaimAppeal(uint256 index) → bool` (external)
*Params**

**Returns**
-----
# Function policyStatus
returns current status of a claim
Dev 
## Signature policyStatus(address,address)
## `policyStatus(address claimer, address policyBookAddress) → enum IClaimingRegistry.ClaimStatus` (external)
*Params**

**Returns**
-----
# Function claimStatus
returns current status of a claim
Dev 
## Signature claimStatus(uint256)
## `claimStatus(uint256 index) → enum IClaimingRegistry.ClaimStatus` (external)
*Params**

**Returns**
-----
# Function claimOwner
returns the claim owner (claimer)
Dev 
## Signature claimOwner(uint256)
## `claimOwner(uint256 index) → address` (external)
*Params**

**Returns**
-----
# Function claimPolicyBook
returns the claim PolicyBook
Dev 
## Signature claimPolicyBook(uint256)
## `claimPolicyBook(uint256 index) → address` (external)
*Params**

**Returns**
-----
# Function claimInfo
returns claim info by its index
Dev 
## Signature claimInfo(uint256)
## `claimInfo(uint256 index) → struct IClaimingRegistry.ClaimInfo _claimInfo` (external)
*Params**

**Returns**
-----
# Function getClaimableIndexes

Dev 
## Signature getClaimableIndexes()
## `getClaimableIndexes() → uint256[], uint256` (external)
*Params**

**Returns**
-----
# Function getClaimableAmounts

Dev 
## Signature getClaimableAmounts(uint256[])
## `getClaimableAmounts(uint256[] _claimIndexes) → uint256` (external)
*Params**

**Returns**
-----
# Function acceptClaim
marks the user's claim as Accepted
Dev 
## Signature acceptClaim(uint256)
## `acceptClaim(uint256 index)` (external)
*Params**

**Returns**
-----
# Function rejectClaim
marks the user's claim as Rejected
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


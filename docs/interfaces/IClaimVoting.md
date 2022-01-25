# `IClaimVoting`




# Function initializeVoting
starts the voting process
Dev 
## Signature initializeVoting(address,string,uint256,bool)
## `initializeVoting(address claimer, string evidenceURI, uint256 coverTokens, bool appeal)` (external)
*Params**

**Returns**
-----
# Function canWithdraw
returns true if the user has no PENDING votes
Dev 
## Signature canWithdraw(address)
## `canWithdraw(address user) → bool` (external)
*Params**

**Returns**
-----
# Function canVote
returns true if the user has no AWAITING_CALCULATION votes
Dev 
## Signature canVote(address)
## `canVote(address user) → bool` (external)
*Params**

**Returns**
-----
# Function countVotes
returns how many votes the user has
Dev 
## Signature countVotes(address)
## `countVotes(address user) → uint256` (external)
*Params**

**Returns**
-----
# Function voteStatus
returns status of the vote
Dev 
## Signature voteStatus(uint256)
## `voteStatus(uint256 index) → enum IClaimVoting.VoteStatus` (external)
*Params**

**Returns**
-----
# Function whatCanIVoteFor
returns a list of claims that are votable for msg.sender
Dev 
## Signature whatCanIVoteFor(uint256,uint256)
## `whatCanIVoteFor(uint256 offset, uint256 limit) → uint256 _claimsCount, struct IClaimVoting.PublicClaimInfo[] _votablesInfo` (external)
*Params**

**Returns**
-----
# Function allClaims
returns info list of ALL claims
Dev 
## Signature allClaims(uint256,uint256)
## `allClaims(uint256 offset, uint256 limit) → struct IClaimVoting.AllClaimInfo[] _allClaimsInfo` (external)
*Params**

**Returns**
-----
# Function myClaims
returns info list of claims of msg.sender
Dev 
## Signature myClaims(uint256,uint256)
## `myClaims(uint256 offset, uint256 limit) → struct IClaimVoting.MyClaimInfo[] _myClaimsInfo` (external)
*Params**

**Returns**
-----
# Function myVotes
returns info list of claims that are voted by msg.sender
Dev 
## Signature myVotes(uint256,uint256)
## `myVotes(uint256 offset, uint256 limit) → struct IClaimVoting.MyVoteInfo[] _myVotesInfo` (external)
*Params**

**Returns**
-----
# Function myVotesUpdates
returns an array of votes that can be calculated + update information
Dev 
## Signature myVotesUpdates(uint256,uint256)
## `myVotesUpdates(uint256 offset, uint256 limit) → uint256 _votesUpdatesCount, uint256[] _claimIndexes, struct IClaimVoting.VotesUpdatesInfo _myVotesUpdatesInfo` (external)
*Params**

**Returns**
-----
# Function anonymouslyVoteBatch
anonymously votes (result used later in exposeVote())
the claims have to be PENDING, the voter can vote only once for a specific claim

Dev 
## Signature anonymouslyVoteBatch(uint256[],bytes32[],string[])
## `anonymouslyVoteBatch(uint256[] claimIndexes, bytes32[] finalHashes, string[] encryptedVotes)` (external)
*Params**
 - `claimIndexes`: are the indexes of the claims the voter is voting on
    (each one is unique for each claim and appeal)

 - `finalHashes`: are the hashes produced by the encryption algorithm.
    They will be verified onchain in expose function

 - `encryptedVotes`: are the AES encrypted values that represent the actual vote

**Returns**
-----
# Function exposeVoteBatch
exposes votes of anonymous votings
the vote has to be voted anonymously prior

Dev 
## Signature exposeVoteBatch(uint256[],uint256[],bytes32[])
## `exposeVoteBatch(uint256[] claimIndexes, uint256[] suggestedClaimAmounts, bytes32[] hashedSignaturesOfClaims)` (external)
*Params**
 - `claimIndexes`: are the indexes of the claims to expose votes for

 - `suggestedClaimAmounts`: are the actual vote values.
    They must match the decrypted values in anonymouslyVoteBatch function

 - `hashedSignaturesOfClaims`: are the validation data needed to construct proper finalHashes

**Returns**
-----
# Function calculateVoterResultBatch
calculates results of votes
Dev 
## Signature calculateVoterResultBatch(uint256[])
## `calculateVoterResultBatch(uint256[] claimIndexes)` (external)
*Params**

**Returns**
-----
# Function calculateVotingResultBatch
calculates results of claims
Dev 
## Signature calculateVotingResultBatch(uint256[])
## `calculateVotingResultBatch(uint256[] claimIndexes)` (external)
*Params**

**Returns**
-----


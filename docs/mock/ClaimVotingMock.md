# `ClaimVotingMock`



## Event AnonymouslyVoted
## Signature `event` AnonymouslyVoted(uint256)




**Params**

## Event VoteExposed
## Signature `event` VoteExposed(uint256,address,uint256)




**Params**

## Event VoteCalculated
## Signature `event` VoteCalculated(uint256,address,enum IClaimVoting.VoteStatus)




**Params**

## Event RewardsForVoteCalculationSent
## Signature `event` RewardsForVoteCalculationSent(address,uint256)




**Params**

## Event RewardsForClaimCalculationSent
## Signature `event` RewardsForClaimCalculationSent(address,uint256)




**Params**

## Event ClaimCalculated
## Signature `event` ClaimCalculated(uint256,address)




**Params**


# Function getVotingResult

Dev 
## Signature getVotingResult(uint256)
## `getVotingResult(uint256 claimIndex) → struct IClaimVoting.VotingResult` (external)
*Params**

**Returns**
-----
# Function voteIndex

Dev 
## Signature voteIndex(uint256)
## `voteIndex(uint256 claimIndex) → uint256` (external)
*Params**

**Returns**
-----
# Function vote

Dev 
## Signature vote(uint256,uint256)
## `vote(uint256 claimIndex, uint256 suggestedClaimAmount)` (external)
*Params**

**Returns**
-----
# Function _isVoteAwaitingCalculation

Dev 
## Signature _isVoteAwaitingCalculation(uint256)
## `_isVoteAwaitingCalculation(uint256 index) → bool` (internal)
*Params**

**Returns**
-----
# Function _isVoteAwaitingExposure

Dev 
## Signature _isVoteAwaitingExposure(uint256)
## `_isVoteAwaitingExposure(uint256 index) → bool` (internal)
*Params**

**Returns**
-----
# Function _isVoteExpired

Dev 
## Signature _isVoteExpired(uint256)
## `_isVoteExpired(uint256 index) → bool` (internal)
*Params**

**Returns**
-----
# Function __ClaimVoting_init

Dev 
## Signature __ClaimVoting_init()
## `__ClaimVoting_init()` (external)
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
# Function initializeVoting
this function needs user's BMI approval of this address (check policybook)
Dev 
## Signature initializeVoting(address,string,uint256,bool)
## `initializeVoting(address claimer, string evidenceURI, uint256 coverTokens, bool appeal)` (external)
*Params**

**Returns**
-----
# Function canWithdraw

Dev check in BMIStaking when withdrawing, if true -> can withdraw
## Signature canWithdraw(address)
## `canWithdraw(address user) → bool` (external)
*Params**

**Returns**
-----
# Function canVote

Dev check when anonymously voting, if true -> can vote
## Signature canVote(address)
## `canVote(address user) → bool` (public)
*Params**

**Returns**
-----
# Function countVotes

Dev 
## Signature countVotes(address)
## `countVotes(address user) → uint256` (external)
*Params**

**Returns**
-----
# Function voteStatus

Dev 
## Signature voteStatus(uint256)
## `voteStatus(uint256 index) → enum IClaimVoting.VoteStatus` (public)
*Params**

**Returns**
-----
# Function whatCanIVoteFor

Dev use with claimingRegistry.countPendingClaims()
## Signature whatCanIVoteFor(uint256,uint256)
## `whatCanIVoteFor(uint256 offset, uint256 limit) → uint256 _claimsCount, struct IClaimVoting.PublicClaimInfo[] _votablesInfo` (external)
*Params**

**Returns**
-----
# Function allClaims

Dev use with claimingRegistry.countClaims()
## Signature allClaims(uint256,uint256)
## `allClaims(uint256 offset, uint256 limit) → struct IClaimVoting.AllClaimInfo[] _allClaimsInfo` (external)
*Params**

**Returns**
-----
# Function myClaims

Dev use with claimingRegistry.countPolicyClaimerClaims()
## Signature myClaims(uint256,uint256)
## `myClaims(uint256 offset, uint256 limit) → struct IClaimVoting.MyClaimInfo[] _myClaimsInfo` (external)
*Params**

**Returns**
-----
# Function myVotes

Dev use with countVotes()
## Signature myVotes(uint256,uint256)
## `myVotes(uint256 offset, uint256 limit) → struct IClaimVoting.MyVoteInfo[] _myVotesInfo` (external)
*Params**

**Returns**
-----
# Function myVotesUpdates

Dev use with countVotes()
## Signature myVotesUpdates(uint256,uint256)
## `myVotesUpdates(uint256 offset, uint256 limit) → uint256 _votesUpdatesCount, uint256[] _claimIndexes, struct IClaimVoting.VotesUpdatesInfo _myVotesUpdatesInfo` (external)
*Params**

**Returns**
-----
# Function _calculateAverages

Dev 
## Signature _calculateAverages(uint256,uint256,uint256,uint256,bool)
## `_calculateAverages(uint256 claimIndex, uint256 stakedBMI, uint256 suggestedClaimAmount, uint256 reputationWithPrecision, bool votedFor)` (internal)
*Params**

**Returns**
-----
# Function _modifyExposedVote

Dev 
## Signature _modifyExposedVote(address,uint256,uint256,uint256,bool)
## `_modifyExposedVote(address voter, uint256 claimIndex, uint256 suggestedClaimAmount, uint256 stakedBMI, bool accept)` (internal)
*Params**

**Returns**
-----
# Function _addAnonymousVote

Dev 
## Signature _addAnonymousVote(address,uint256,bytes32,string)
## `_addAnonymousVote(address voter, uint256 claimIndex, bytes32 finalHash, string encryptedVote)` (internal)
*Params**

**Returns**
-----
# Function anonymouslyVoteBatch

Dev 
## Signature anonymouslyVoteBatch(uint256[],bytes32[],string[])
## `anonymouslyVoteBatch(uint256[] claimIndexes, bytes32[] finalHashes, string[] encryptedVotes)` (external)
*Params**

**Returns**
-----
# Function exposeVoteBatch

Dev 
## Signature exposeVoteBatch(uint256[],uint256[],bytes32[])
## `exposeVoteBatch(uint256[] claimIndexes, uint256[] suggestedClaimAmounts, bytes32[] hashedSignaturesOfClaims)` (external)
*Params**

**Returns**
-----
# Function _getRewardRatio

Dev 
## Signature _getRewardRatio(uint256,address,uint256)
## `_getRewardRatio(uint256 claimIndex, address voter, uint256 votedStakedBMIAmountWithReputation) → uint256` (internal)
*Params**

**Returns**
-----
# Function _calculateMajorityYesVote

Dev 
## Signature _calculateMajorityYesVote(uint256,address,uint256)
## `_calculateMajorityYesVote(uint256 claimIndex, address voter, uint256 oldReputation) → uint256 _stblAmount, uint256 _bmiAmount, uint256 _newReputation` (internal)
*Params**

**Returns**
-----
# Function _calculateMajorityNoVote

Dev 
## Signature _calculateMajorityNoVote(uint256,address,uint256)
## `_calculateMajorityNoVote(uint256 claimIndex, address voter, uint256 oldReputation) → uint256 _bmiAmount, uint256 _newReputation` (internal)
*Params**

**Returns**
-----
# Function _calculateMinorityVote

Dev 
## Signature _calculateMinorityVote(uint256,address,uint256)
## `_calculateMinorityVote(uint256 claimIndex, address voter, uint256 oldReputation) → uint256 _bmiPenalty, uint256 _newReputation` (internal)
*Params**

**Returns**
-----
# Function calculateVoterResultBatch

Dev 
## Signature calculateVoterResultBatch(uint256[])
## `calculateVoterResultBatch(uint256[] claimIndexes)` (external)
*Params**

**Returns**
-----
# Function _getBMIRewardForCalculation

Dev 
## Signature _getBMIRewardForCalculation(uint256)
## `_getBMIRewardForCalculation(uint256 claimIndex) → uint256` (internal)
*Params**

**Returns**
-----
# Function _sendRewardsForCalculationTo

Dev 
## Signature _sendRewardsForCalculationTo(uint256,address)
## `_sendRewardsForCalculationTo(uint256 claimIndex, address calculator)` (internal)
*Params**

**Returns**
-----
# Function calculateVotingResultBatch

Dev 
## Signature calculateVotingResultBatch(uint256[])
## `calculateVotingResultBatch(uint256[] claimIndexes)` (external)
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


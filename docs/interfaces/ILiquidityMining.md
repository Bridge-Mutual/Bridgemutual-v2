# `ILiquidityMining`




# Function startLiquidityMiningTime

Dev 
## Signature startLiquidityMiningTime()
## `startLiquidityMiningTime() → uint256` (external)
*Params**

**Returns**
-----
# Function getTopTeams

Dev 
## Signature getTopTeams()
## `getTopTeams() → struct ILiquidityMining.TeamDetails[] teams` (external)
*Params**

**Returns**
-----
# Function getTopUsers

Dev 
## Signature getTopUsers()
## `getTopUsers() → struct ILiquidityMining.UserInfo[] users` (external)
*Params**

**Returns**
-----
# Function getAllTeamsLength

Dev 
## Signature getAllTeamsLength()
## `getAllTeamsLength() → uint256` (external)
*Params**

**Returns**
-----
# Function getAllTeamsDetails

Dev 
## Signature getAllTeamsDetails(uint256,uint256)
## `getAllTeamsDetails(uint256 _offset, uint256 _limit) → struct ILiquidityMining.TeamDetails[] _teamDetailsArr` (external)
*Params**

**Returns**
-----
# Function getMyTeamsLength

Dev 
## Signature getMyTeamsLength()
## `getMyTeamsLength() → uint256` (external)
*Params**

**Returns**
-----
# Function getMyTeamMembers

Dev 
## Signature getMyTeamMembers(uint256,uint256)
## `getMyTeamMembers(uint256 _offset, uint256 _limit) → address[] _teamMembers, uint256[] _memberStakedAmount` (external)
*Params**

**Returns**
-----
# Function getAllUsersLength

Dev 
## Signature getAllUsersLength()
## `getAllUsersLength() → uint256` (external)
*Params**

**Returns**
-----
# Function getAllUsersInfo

Dev 
## Signature getAllUsersInfo(uint256,uint256)
## `getAllUsersInfo(uint256 _offset, uint256 _limit) → struct ILiquidityMining.UserInfo[] _userInfos` (external)
*Params**

**Returns**
-----
# Function getMyTeamInfo

Dev 
## Signature getMyTeamInfo()
## `getMyTeamInfo() → struct ILiquidityMining.MyTeamInfo _myTeamInfo` (external)
*Params**

**Returns**
-----
# Function getRewardsInfo

Dev 
## Signature getRewardsInfo(address)
## `getRewardsInfo(address user) → struct ILiquidityMining.UserRewardsInfo userRewardInfo` (external)
*Params**

**Returns**
-----
# Function createTeam

Dev 
## Signature createTeam(string)
## `createTeam(string _teamName)` (external)
*Params**

**Returns**
-----
# Function deleteTeam

Dev 
## Signature deleteTeam()
## `deleteTeam()` (external)
*Params**

**Returns**
-----
# Function joinTheTeam

Dev 
## Signature joinTheTeam(address)
## `joinTheTeam(address _referralLink)` (external)
*Params**

**Returns**
-----
# Function getSlashingPercentage

Dev 
## Signature getSlashingPercentage()
## `getSlashingPercentage() → uint256` (external)
*Params**

**Returns**
-----
# Function investSTBL

Dev 
## Signature investSTBL(uint256,address)
## `investSTBL(uint256 _tokensAmount, address _policyBookAddr)` (external)
*Params**

**Returns**
-----
# Function distributeNFT

Dev 
## Signature distributeNFT()
## `distributeNFT()` (external)
*Params**

**Returns**
-----
# Function checkPlatinumNFTReward

Dev 
## Signature checkPlatinumNFTReward(address)
## `checkPlatinumNFTReward(address _userAddr) → uint256` (external)
*Params**

**Returns**
-----
# Function checkMainNFTReward

Dev 
## Signature checkMainNFTReward(address)
## `checkMainNFTReward(address _userAddr) → uint256` (external)
*Params**

**Returns**
-----
# Function distributeBMIReward

Dev 
## Signature distributeBMIReward()
## `distributeBMIReward()` (external)
*Params**

**Returns**
-----
# Function getTotalUserBMIReward

Dev 
## Signature getTotalUserBMIReward(address)
## `getTotalUserBMIReward(address _userAddr) → uint256` (external)
*Params**

**Returns**
-----
# Function checkAvailableBMIReward

Dev 
## Signature checkAvailableBMIReward(address)
## `checkAvailableBMIReward(address _userAddr) → uint256` (external)
*Params**

**Returns**
-----
# Function isLMLasting
checks if liquidity mining event is lasting (startLiquidityMining() has been called)

Dev 
## Signature isLMLasting()
## `isLMLasting() → bool` (external)
*Params**

**Returns**
 - `true`: if LM is started and not ended, false otherwise
-----
# Function isLMEnded
checks if liquidity mining event is finished. In order to be finished, it has to be started

Dev 
## Signature isLMEnded()
## `isLMEnded() → bool` (external)
*Params**

**Returns**
 - `true`: if LM is finished, false if event is still going or not started
-----
# Function getEndLMTime

Dev 
## Signature getEndLMTime()
## `getEndLMTime() → uint256` (external)
*Params**

**Returns**
-----


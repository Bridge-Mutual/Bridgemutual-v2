# `LiquidityMiningMock`



## Event TeamCreated
## Signature `event` TeamCreated(address,string)




**Params**

## Event TeamDeleted
## Signature `event` TeamDeleted(address,string)




**Params**

## Event MemberAdded
## Signature `event` MemberAdded(address,address,uint256)




**Params**

## Event TeamInvested
## Signature `event` TeamInvested(address,address,uint256)




**Params**

## Event LeaderboardUpdated
## Signature `event` LeaderboardUpdated(uint256,address,address)




**Params**

## Event TopUsersUpdated
## Signature `event` TopUsersUpdated(uint256,address,address)




**Params**

## Event RewardSent
## Signature `event` RewardSent(address,address,uint256)




**Params**

## Event NFTSent
## Signature `event` NFTSent(address,uint256)




**Params**

## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function setStartTime

Dev 
## Signature setStartTime(uint256)
## `setStartTime(uint256 time)` (external)
*Params**

**Returns**
-----
# Function getStartTime

Dev 
## Signature getStartTime()
## `getStartTime() → uint256` (external)
*Params**

**Returns**
-----
# Function getTeamLeaders

Dev 
## Signature getTeamLeaders(address)
## `getTeamLeaders(address _referralLink) → address[]` (external)
*Params**

**Returns**
-----
# Function __LiquidityMining_init

Dev 
## Signature __LiquidityMining_init()
## `__LiquidityMining_init()` (external)
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
# Function startLiquidityMining

Dev 
## Signature startLiquidityMining()
## `startLiquidityMining()` (external)
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
# Function _getTeamDetails

Dev 
## Signature _getTeamDetails(address)
## `_getTeamDetails(address _teamAddr) → struct ILiquidityMining.TeamDetails _teamDetails` (internal)
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
## `getSlashingPercentage() → uint256` (public)
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
## `checkPlatinumNFTReward(address _userAddr) → uint256` (public)
*Params**

**Returns**
-----
# Function checkMainNFTReward

Dev 
## Signature checkMainNFTReward(address)
## `checkMainNFTReward(address _userAddr) → uint256` (public)
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
## `getTotalUserBMIReward(address _userAddr) → uint256` (public)
*Params**

**Returns**
-----
# Function checkAvailableBMIReward

Dev 
## Signature checkAvailableBMIReward(address)
## `checkAvailableBMIReward(address _userAddr) → uint256` (public)
*Params**

**Returns**
-----
# Function isLMLasting

Dev 
## Signature isLMLasting()
## `isLMLasting() → bool` (public)
*Params**

**Returns**
-----
# Function isLMEnded

Dev 
## Signature isLMEnded()
## `isLMEnded() → bool` (public)
*Params**

**Returns**
-----
# Function getEndLMTime

Dev 
## Signature getEndLMTime()
## `getEndLMTime() → uint256` (public)
*Params**

**Returns**
-----
# Function _getMainNFTReward

Dev 
## Signature _getMainNFTReward(uint256)
## `_getMainNFTReward(uint256 place) → uint256` (internal)
*Params**

**Returns**
-----
# Function _sendMainNFT

Dev NFT indices have to change when external ERC1155 is used
## Signature _sendMainNFT(uint256,address)
## `_sendMainNFT(uint256 _index, address _userAddr)` (internal)
*Params**

**Returns**
-----
# Function _sendPlatinumNFT

Dev 
## Signature _sendPlatinumNFT(address)
## `_sendPlatinumNFT(address _userAddr)` (internal)
*Params**

**Returns**
-----
# Function _calculatePercentage

Dev 
## Signature _calculatePercentage(uint256,uint256)
## `_calculatePercentage(uint256 _part, uint256 _amount) → uint256` (internal)
*Params**

**Returns**
-----
# Function _getTeamReward

Dev 
## Signature _getTeamReward(uint256)
## `_getTeamReward(uint256 place) → uint256` (internal)
*Params**

**Returns**
-----
# Function _getAvailableMonthForReward

Dev 
## Signature _getAvailableMonthForReward(address)
## `_getAvailableMonthForReward(address _userAddr) → uint256` (internal)
*Params**

**Returns**
-----
# Function _getIndexInTopUsers

Dev 
## Signature _getIndexInTopUsers(address)
## `_getIndexInTopUsers(address _userAddr) → uint256` (internal)
*Params**

**Returns**
-----
# Function _getIndexInTheGroupLeaders

Dev 
## Signature _getIndexInTheGroupLeaders(address)
## `_getIndexInTheGroupLeaders(address _userAddr) → uint256` (internal)
*Params**

**Returns**
-----
# Function _getIndexInTheLeaderboard

Dev 
## Signature _getIndexInTheLeaderboard(address)
## `_getIndexInTheLeaderboard(address _referralLink) → uint256` (internal)
*Params**

**Returns**
-----
# Function _updateLeaderboard

Dev 
## Signature _updateLeaderboard(address)
## `_updateLeaderboard(address _referralLink)` (internal)
*Params**

**Returns**
-----
# Function _updateTopUsers

Dev 
## Signature _updateTopUsers()
## `_updateTopUsers()` (internal)
*Params**

**Returns**
-----
# Function _updateGroupLeaders

Dev 
## Signature _updateGroupLeaders(address)
## `_updateGroupLeaders(address _referralLink)` (internal)
*Params**

**Returns**
-----
# Function onERC1155Received

Dev 
## Signature onERC1155Received(address,address,uint256,uint256,bytes)
## `onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes data) → bytes4` (external)
*Params**

**Returns**
-----
# Function onERC1155BatchReceived

Dev 
## Signature onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)
## `onERC1155BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data) → bytes4` (external)
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
# Function constructor

Dev 
## Signature constructor()
## `constructor()` (internal)
*Params**

**Returns**
-----
# Function supportsInterface

Dev See {IERC165-supportsInterface}.
Time complexity O(1), guaranteed to always use less than 30 000 gas.
## Signature supportsInterface(bytes4)
## `supportsInterface(bytes4 interfaceId) → bool` (public)
*Params**

**Returns**
-----
# Function _registerInterface

Dev Registers the contract as an implementer of the interface defined by
`interfaceId`. Support of the actual ERC165 interface is automatic and
registering its interface id is not required.
See {IERC165-supportsInterface}.
Requirements:
- `interfaceId` cannot be the ERC165 invalid interface (`0xffffffff`).
## Signature _registerInterface(bytes4)
## `_registerInterface(bytes4 interfaceId)` (internal)
*Params**

**Returns**
-----
# Function __Ownable_init

Dev Initializes the contract setting the deployer as the initial owner.
## Signature __Ownable_init()
## `__Ownable_init()` (internal)
*Params**

**Returns**
-----
# Function __Ownable_init_unchained

Dev 
## Signature __Ownable_init_unchained()
## `__Ownable_init_unchained()` (internal)
*Params**

**Returns**
-----
# Function owner

Dev Returns the address of the current owner.
## Signature owner()
## `owner() → address` (public)
*Params**

**Returns**
-----
# Function renounceOwnership

Dev Leaves the contract without owner. It will not be possible to call
`onlyOwner` functions anymore. Can only be called by the current owner.
NOTE: Renouncing ownership will leave the contract without an owner,
thereby removing any functionality that is only available to the owner.
## Signature renounceOwnership()
## `renounceOwnership()` (public)
*Params**

**Returns**
-----
# Function transferOwnership

Dev Transfers ownership of the contract to a new account (`newOwner`).
Can only be called by the current owner.
## Signature transferOwnership(address)
## `transferOwnership(address newOwner)` (public)
*Params**

**Returns**
-----
# Function __Context_init

Dev 
## Signature __Context_init()
## `__Context_init()` (internal)
*Params**

**Returns**
-----
# Function __Context_init_unchained

Dev 
## Signature __Context_init_unchained()
## `__Context_init_unchained()` (internal)
*Params**

**Returns**
-----
# Function _msgSender

Dev 
## Signature _msgSender()
## `_msgSender() → address payable` (internal)
*Params**

**Returns**
-----
# Function _msgData

Dev 
## Signature _msgData()
## `_msgData() → bytes` (internal)
*Params**

**Returns**
-----
# Function startLiquidityMiningTime

Dev 
## Signature startLiquidityMiningTime()
## `startLiquidityMiningTime() → uint256` (external)
*Params**

**Returns**
-----


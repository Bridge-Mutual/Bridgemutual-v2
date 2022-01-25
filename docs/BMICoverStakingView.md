# `BMICoverStakingView`




# Function setDependencies

Dev 
## Signature setDependencies(contract IContractsRegistry)
## `setDependencies(contract IContractsRegistry _contractsRegistry)` (external)
*Params**

**Returns**
-----
# Function getPolicyBookAPY
Retunrs the APY of a policybook address

Dev returns 0 for non whitelisted policybooks

## Signature getPolicyBookAPY(address)
## `getPolicyBookAPY(address policyBookAddress) → uint256` (public)
*Params**
 - `policyBookAddress`: address of the policybook


**Returns**
 - `uint256`: apy amount
-----
# Function policyBookByNFT
gets the policy addres given an nft token id

Dev 
## Signature policyBookByNFT(uint256)
## `policyBookByNFT(uint256 tokenId) → address` (external)
*Params**
 - `tokenId`: uint256 numeric id of the nft token


**Returns**
-----
# Function stakingInfoByStaker
exhaustive information about staker's stakes

Dev 
## Signature stakingInfoByStaker(address,address[],uint256,uint256)
## `stakingInfoByStaker(address staker, address[] policyBooksAddresses, uint256 offset, uint256 limit) → struct IBMICoverStaking.PolicyBookInfo[] policyBooksInfo, struct IBMICoverStaking.UserInfo[] usersInfo, uint256[] nftsCount, struct IBMICoverStaking.NFTsInfo[][] nftsInfo` (external)
*Params**
 - `staker`: is a user to return information for

 - `policyBooksAddresses`: is an array of PolicyBooks to check the stakes in

 - `offset`: is a starting ordinal number of user's NFT

 - `limit`: is a number of NFTs to check per function's call


**Returns**
 - `policyBooksInfo`: - an array of infos (totalStakedSTBL, rewardPerBlock (in BMI), stakingAPY, liquidityAPY)

 - `usersInfo`: - an array of user's info per PolicyBook (totalStakedBMIX, totalStakedSTBL, totalBmiReward)

 - `nftsCount`: - number of NFTs for each respective PolicyBook

 - `nftsInfo`: - 2 dimensional array of NFTs info per each PolicyBook
    (nftIndex, uri, stakedBMIXAmount, stakedSTBLAmount, reward (in BMI))
-----
# Function stakingInfoByToken
Returns a StakingInfo (policyBookAdress and stakedBMIXAmount) for a given nft index

Dev 
## Signature stakingInfoByToken(uint256)
## `stakingInfoByToken(uint256 tokenId) → struct IBMICoverStaking.StakingInfo _stakingInfo` (external)
*Params**
 - `tokenId`: numeric id of the nft index


**Returns**
 - `_stakingInfo`: IBMICoverStaking.StakingInfo
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


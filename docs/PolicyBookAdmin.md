# `PolicyBookAdmin`



## Event PolicyBookWhitelisted
## Signature `event` PolicyBookWhitelisted(address,bool)




**Params**

## Event DistributorWhitelisted
## Signature `event` DistributorWhitelisted(address,uint256)




**Params**

## Event DistributorBlacklisted
## Signature `event` DistributorBlacklisted(address)




**Params**

## Event UpdatedImageURI
## Signature `event` UpdatedImageURI(uint256,string,string)




**Params**

## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function __PolicyBookAdmin_init
TODO can't init contract after upgrade , workaround to set policyfacade impl
Dev 
## Signature __PolicyBookAdmin_init(address,address)
## `__PolicyBookAdmin_init(address _policyBookImplementationAddress, address _policyBookFacadeImplementationAddress)` (external)
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
# Function injectDependenciesToExistingPolicies

Dev 
## Signature injectDependenciesToExistingPolicies(uint256,uint256)
## `injectDependenciesToExistingPolicies(uint256 offset, uint256 limit)` (external)
*Params**

**Returns**
-----
# Function getUpgrader

Dev 
## Signature getUpgrader()
## `getUpgrader() → address` (external)
*Params**

**Returns**
-----
# Function getImplementationOfPolicyBook

Dev 
## Signature getImplementationOfPolicyBook(address)
## `getImplementationOfPolicyBook(address policyBookAddress) → address` (external)
*Params**

**Returns**
-----
# Function getCurrentPolicyBooksImplementation

Dev 
## Signature getCurrentPolicyBooksImplementation()
## `getCurrentPolicyBooksImplementation() → address` (external)
*Params**

**Returns**
-----
# Function getCurrentPolicyBooksFacadeImplementation

Dev 
## Signature getCurrentPolicyBooksFacadeImplementation()
## `getCurrentPolicyBooksFacadeImplementation() → address` (external)
*Params**

**Returns**
-----
# Function _setPolicyBookImplementation

Dev 
## Signature _setPolicyBookImplementation(address)
## `_setPolicyBookImplementation(address policyBookImpl)` (internal)
*Params**

**Returns**
-----
# Function upgradePolicyBooks

Dev 
## Signature upgradePolicyBooks(address,uint256,uint256)
## `upgradePolicyBooks(address policyBookImpl, uint256 offset, uint256 limit)` (external)
*Params**

**Returns**
-----
# Function upgradePolicyBooksAndCall
can only call functions that have no parameters
Dev 
## Signature upgradePolicyBooksAndCall(address,uint256,uint256,string)
## `upgradePolicyBooksAndCall(address policyBookImpl, uint256 offset, uint256 limit, string functionSignature)` (external)
*Params**

**Returns**
-----
# Function _upgradePolicyBooks

Dev 
## Signature _upgradePolicyBooks(address,uint256,uint256,string)
## `_upgradePolicyBooks(address policyBookImpl, uint256 offset, uint256 limit, string functionSignature)` (internal)
*Params**

**Returns**
-----
# Function whitelist
It blacklists or whitelists a PolicyBook. Only whitelisted PolicyBooks can
        receive stakes and funds

Dev 
## Signature whitelist(address,bool)
## `whitelist(address policyBookAddress, bool whitelisted)` (public)
*Params**
 - `policyBookAddress`: PolicyBook address that will be whitelisted or blacklisted

 - `whitelisted`: true to whitelist or false to blacklist a PolicyBook

**Returns**
-----
# Function whitelistDistributor
Whitelist distributor address and respective fees

Dev 
## Signature whitelistDistributor(address,uint256)
## `whitelistDistributor(address _distributor, uint256 _distributorFee)` (external)
*Params**
 - `_distributor`: distributor address that will receive funds

 - `_distributorFee`: distributor fee amount (passed with its precision : _distributorFee * 10**24)

**Returns**
-----
# Function blacklistDistributor
Removes a distributor address from the distributor whitelist

Dev 
## Signature blacklistDistributor(address)
## `blacklistDistributor(address _distributor)` (external)
*Params**
 - `_distributor`: distributor address that will be blacklist

**Returns**
-----
# Function isWhitelistedDistributor
Distributor commission fee is 2-5% of the Premium.
        It comes from the Protocol’s fee part

Dev 
## Signature isWhitelistedDistributor(address)
## `isWhitelistedDistributor(address _distributor) → bool` (external)
*Params**
 - `_distributor`: address of the distributor


**Returns**
 - `true`: if address is a whitelisted distributor
-----
# Function listDistributors

Dev 
## Signature listDistributors(uint256,uint256)
## `listDistributors(uint256 offset, uint256 limit) → address[] _distributors, uint256[] _distributorsFees` (external)
*Params**

**Returns**
-----
# Function _listDistributors
/ @notice Used to get a list of whitelisted distributors

Dev 
## Signature _listDistributors(uint256,uint256,struct EnumerableSet.AddressSet)
## `_listDistributors(uint256 offset, uint256 limit, struct EnumerableSet.AddressSet set) → address[] _distributors, uint256[] _distributorsFees` (internal)
*Params**

**Returns**
 - `_distributors`: a list containing distritubors addresses

 - `_distributorsFees`: a list containing distritubors fees
-----
# Function countDistributors

Dev 
## Signature countDistributors()
## `countDistributors() → uint256` (external)
*Params**

**Returns**
-----
# Function whitelistBatch

Dev 
## Signature whitelistBatch(address[],bool[])
## `whitelistBatch(address[] policyBooksAddresses, bool[] whitelists)` (external)
*Params**

**Returns**
-----
# Function updateImageUriOfClaim
/ @notice Update Image Uri in case it contains material that is ilegal
        or offensive.

Dev Only the owner can erase/update evidenceUri.

## Signature updateImageUriOfClaim(uint256,string)
## `updateImageUriOfClaim(uint256 _claimIndex, string _newEvidenceURI)` (public)
*Params**
 - `_claimIndex`: Claim Index that is going to be updated

 - `_newEvidenceURI`: New evidence uri. It can be blank.

**Returns**
-----
# Function setPolicyBookFacadeMPLs
/ @notice sets the policybookFacade mpls values

Dev 
## Signature setPolicyBookFacadeMPLs(address,uint256,uint256)
## `setPolicyBookFacadeMPLs(address _facadeAddress, uint256 _userLeverageMPL, uint256 _reinsuranceLeverageMPL)` (external)
*Params**
 - `_facadeAddress`: address of the policybook facade

 - `_userLeverageMPL`: uint256 value of the user leverage mpl;

 - `_reinsuranceLeverageMPL`: uint256 value of the reinsurance leverage mpl

**Returns**
-----
# Function setPolicyBookFacadeRebalancingThreshold
/ @notice sets the policybookFacade mpls values

Dev 
## Signature setPolicyBookFacadeRebalancingThreshold(address,uint256)
## `setPolicyBookFacadeRebalancingThreshold(address _facadeAddress, uint256 _newRebalancingThreshold)` (external)
*Params**
 - `_facadeAddress`: address of the policybook facade

 - `_newRebalancingThreshold`: uint256 value of the reinsurance leverage mpl

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
# Function distributorFees
Distributor commission fee is 2-5% of the Premium
        It comes from the Protocol’s fee part

Dev If max commission fee is 5%, so _distributorFeeCap = 5. Default value is 5

## Signature distributorFees(address)
## `distributorFees(address _distributor) → uint256` (external)
*Params**
 - `_distributor`: address of the distributor


**Returns**
 - `distributor`: fee value. It is distributor commission
    f
-----


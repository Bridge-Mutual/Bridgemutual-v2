# `IPolicyBookRegistry`




# Function policyBooksByInsuredAddress

Dev 
## Signature policyBooksByInsuredAddress(address)
## `policyBooksByInsuredAddress(address insuredContract) → address` (external)
*Params**

**Returns**
-----
# Function policyBookFacades

Dev 
## Signature policyBookFacades(address)
## `policyBookFacades(address insuredContract) → address` (external)
*Params**

**Returns**
-----
# Function add
Adds PolicyBook to registry, access: PolicyFabric
Dev 
## Signature add(address,enum IPolicyBookFabric.ContractType,address,address)
## `add(address insuredContract, enum IPolicyBookFabric.ContractType contractType, address policyBook, address facadeAddress)` (external)
*Params**

**Returns**
-----
# Function add

Dev 
## Signature add(enum IPolicyBookFabric.ContractType,address)
## `add(enum IPolicyBookFabric.ContractType contractType, address policyBook)` (external)
*Params**

**Returns**
-----
# Function whitelist

Dev 
## Signature whitelist(address,bool)
## `whitelist(address policyBookAddress, bool whitelisted)` (external)
*Params**

**Returns**
-----
# Function getPoliciesPrices
returns required allowances for the policybooks
Dev 
## Signature getPoliciesPrices(address[],uint256[],uint256[])
## `getPoliciesPrices(address[] policyBooks, uint256[] epochsNumbers, uint256[] coversTokens) → uint256[] _durations, uint256[] _allowances` (external)
*Params**

**Returns**
-----
# Function buyPolicyBatch
Buys a batch of policies
Dev 
## Signature buyPolicyBatch(address[],uint256[],uint256[])
## `buyPolicyBatch(address[] policyBooks, uint256[] epochsNumbers, uint256[] coversTokens)` (external)
*Params**

**Returns**
-----
# Function buyPolicyBatchFromDistributor
Buys a batch of policies from distributor
Dev 
## Signature buyPolicyBatchFromDistributor(address[],uint256[],uint256[],address)
## `buyPolicyBatchFromDistributor(address[] policyBooks, uint256[] epochsNumbers, uint256[] coversTokens, address distributor)` (external)
*Params**

**Returns**
-----
# Function isPolicyBook
Checks if provided address is a PolicyBook
Dev 
## Signature isPolicyBook(address)
## `isPolicyBook(address policyBook) → bool` (external)
*Params**

**Returns**
-----
# Function isPolicyBookFacade
Checks if provided address is a policyBookFacade
Dev 
## Signature isPolicyBookFacade(address)
## `isPolicyBookFacade(address _facadeAddress) → bool` (external)
*Params**

**Returns**
-----
# Function countByType
Returns number of registered PolicyBooks with certain contract type
Dev 
## Signature countByType(enum IPolicyBookFabric.ContractType)
## `countByType(enum IPolicyBookFabric.ContractType contractType) → uint256` (external)
*Params**

**Returns**
-----
# Function count
Returns number of registered PolicyBooks, access: ANY
Dev 
## Signature count()
## `count() → uint256` (external)
*Params**

**Returns**
-----
# Function countByTypeWhitelisted

Dev 
## Signature countByTypeWhitelisted(enum IPolicyBookFabric.ContractType)
## `countByTypeWhitelisted(enum IPolicyBookFabric.ContractType contractType) → uint256` (external)
*Params**

**Returns**
-----
# Function countWhitelisted

Dev 
## Signature countWhitelisted()
## `countWhitelisted() → uint256` (external)
*Params**

**Returns**
-----
# Function listByType
Listing registered PolicyBooks with certain contract type, access: ANY

Dev 
## Signature listByType(enum IPolicyBookFabric.ContractType,uint256,uint256)
## `listByType(enum IPolicyBookFabric.ContractType contractType, uint256 offset, uint256 limit) → address[] _policyBooksArr` (external)
*Params**

**Returns**
 - `_policyBooksArr`: is array of registered PolicyBook addresses with certain contract type
-----
# Function list
Listing registered PolicyBooks, access: ANY

Dev 
## Signature list(uint256,uint256)
## `list(uint256 offset, uint256 limit) → address[] _policyBooksArr` (external)
*Params**

**Returns**
 - `_policyBooksArr`: is array of registered PolicyBook addresses
-----
# Function listByTypeWhitelisted

Dev 
## Signature listByTypeWhitelisted(enum IPolicyBookFabric.ContractType,uint256,uint256)
## `listByTypeWhitelisted(enum IPolicyBookFabric.ContractType contractType, uint256 offset, uint256 limit) → address[] _policyBooksArr` (external)
*Params**

**Returns**
-----
# Function listWhitelisted

Dev 
## Signature listWhitelisted(uint256,uint256)
## `listWhitelisted(uint256 offset, uint256 limit) → address[] _policyBooksArr` (external)
*Params**

**Returns**
-----
# Function listWithStatsByType
Listing registered PolicyBooks with stats and certain contract type, access: ANY
Dev 
## Signature listWithStatsByType(enum IPolicyBookFabric.ContractType,uint256,uint256)
## `listWithStatsByType(enum IPolicyBookFabric.ContractType contractType, uint256 offset, uint256 limit) → address[] _policyBooksArr, struct IPolicyBookRegistry.PolicyBookStats[] _stats` (external)
*Params**

**Returns**
-----
# Function listWithStats
Listing registered PolicyBooks with stats, access: ANY
Dev 
## Signature listWithStats(uint256,uint256)
## `listWithStats(uint256 offset, uint256 limit) → address[] _policyBooksArr, struct IPolicyBookRegistry.PolicyBookStats[] _stats` (external)
*Params**

**Returns**
-----
# Function listWithStatsByTypeWhitelisted

Dev 
## Signature listWithStatsByTypeWhitelisted(enum IPolicyBookFabric.ContractType,uint256,uint256)
## `listWithStatsByTypeWhitelisted(enum IPolicyBookFabric.ContractType contractType, uint256 offset, uint256 limit) → address[] _policyBooksArr, struct IPolicyBookRegistry.PolicyBookStats[] _stats` (external)
*Params**

**Returns**
-----
# Function listWithStatsWhitelisted

Dev 
## Signature listWithStatsWhitelisted(uint256,uint256)
## `listWithStatsWhitelisted(uint256 offset, uint256 limit) → address[] _policyBooksArr, struct IPolicyBookRegistry.PolicyBookStats[] _stats` (external)
*Params**

**Returns**
-----
# Function stats
Getting stats from policy books, access: ANY

Dev 
## Signature stats(address[])
## `stats(address[] policyBooks) → struct IPolicyBookRegistry.PolicyBookStats[] _stats` (external)
*Params**
 - `policyBooks`: is list of PolicyBooks addresses

**Returns**
-----
# Function policyBookFor
Return existing Policy Book contract, access: ANY

Dev 
## Signature policyBookFor(address)
## `policyBookFor(address insuredContract) → address` (external)
*Params**
 - `insuredContract`: is contract address to lookup for created IPolicyBook

**Returns**
-----
# Function statsByInsuredContracts
Getting stats from policy books, access: ANY

Dev 
## Signature statsByInsuredContracts(address[])
## `statsByInsuredContracts(address[] insuredContracts) → struct IPolicyBookRegistry.PolicyBookStats[] _stats` (external)
*Params**
 - `insuredContracts`: is list of insuredContracts in registry

**Returns**
-----


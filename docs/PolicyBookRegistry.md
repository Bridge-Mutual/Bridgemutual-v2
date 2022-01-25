# `PolicyBookRegistry`



## Event Added
## Signature `event` Added(address,address)




**Params**


# Function setDependencies

Dev 
## Signature setDependencies(contract IContractsRegistry)
## `setDependencies(contract IContractsRegistry _contractsRegistry)` (external)
*Params**

**Returns**
-----
# Function add

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

Dev 
## Signature getPoliciesPrices(address[],uint256[],uint256[])
## `getPoliciesPrices(address[] policyBooks, uint256[] epochsNumbers, uint256[] coversTokens) → uint256[] _durations, uint256[] _allowances` (external)
*Params**

**Returns**
-----
# Function buyPolicyBatch

Dev 
## Signature buyPolicyBatch(address[],uint256[],uint256[])
## `buyPolicyBatch(address[] policyBooks, uint256[] epochsNumbers, uint256[] coversTokens)` (external)
*Params**

**Returns**
-----
# Function buyPolicyBatchFromDistributor

Dev 
## Signature buyPolicyBatchFromDistributor(address[],uint256[],uint256[],address)
## `buyPolicyBatchFromDistributor(address[] policyBooks, uint256[] epochsNumbers, uint256[] coversTokens, address distributor)` (external)
*Params**

**Returns**
-----
# Function isPolicyBook

Dev 
## Signature isPolicyBook(address)
## `isPolicyBook(address policyBook) → bool` (public)
*Params**

**Returns**
-----
# Function isPolicyBookFacade

Dev 
## Signature isPolicyBookFacade(address)
## `isPolicyBookFacade(address _facadeAddress) → bool` (public)
*Params**

**Returns**
-----
# Function countByType

Dev 
## Signature countByType(enum IPolicyBookFabric.ContractType)
## `countByType(enum IPolicyBookFabric.ContractType contractType) → uint256` (external)
*Params**

**Returns**
-----
# Function count

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
use with countByType()
Dev 
## Signature listByType(enum IPolicyBookFabric.ContractType,uint256,uint256)
## `listByType(enum IPolicyBookFabric.ContractType contractType, uint256 offset, uint256 limit) → address[] _policyBooksArr` (public)
*Params**

**Returns**
-----
# Function list
use with count()
Dev 
## Signature list(uint256,uint256)
## `list(uint256 offset, uint256 limit) → address[] _policyBooksArr` (public)
*Params**

**Returns**
-----
# Function listByTypeWhitelisted
use with countByTypeWhitelisted()
Dev 
## Signature listByTypeWhitelisted(enum IPolicyBookFabric.ContractType,uint256,uint256)
## `listByTypeWhitelisted(enum IPolicyBookFabric.ContractType contractType, uint256 offset, uint256 limit) → address[] _policyBooksArr` (public)
*Params**

**Returns**
-----
# Function listWhitelisted
use with countWhitelisted()
Dev 
## Signature listWhitelisted(uint256,uint256)
## `listWhitelisted(uint256 offset, uint256 limit) → address[] _policyBooksArr` (public)
*Params**

**Returns**
-----
# Function listWithStatsByType

Dev 
## Signature listWithStatsByType(enum IPolicyBookFabric.ContractType,uint256,uint256)
## `listWithStatsByType(enum IPolicyBookFabric.ContractType contractType, uint256 offset, uint256 limit) → address[] _policyBooksArr, struct IPolicyBookRegistry.PolicyBookStats[] _stats` (external)
*Params**

**Returns**
-----
# Function listWithStats

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
# Function _listByType

Dev 
## Signature _listByType(enum IPolicyBookFabric.ContractType,uint256,uint256,mapping(enum IPolicyBookFabric.ContractType => struct EnumerableSet.AddressSet))
## `_listByType(enum IPolicyBookFabric.ContractType contractType, uint256 offset, uint256 limit, mapping(enum IPolicyBookFabric.ContractType => struct EnumerableSet.AddressSet) map) → address[] _policyBooksArr` (internal)
*Params**

**Returns**
-----
# Function _list

Dev 
## Signature _list(uint256,uint256,struct EnumerableSet.AddressSet)
## `_list(uint256 offset, uint256 limit, struct EnumerableSet.AddressSet set) → address[] _policyBooksArr` (internal)
*Params**

**Returns**
-----
# Function stats

Dev 
## Signature stats(address[])
## `stats(address[] policyBooks) → struct IPolicyBookRegistry.PolicyBookStats[] _stats` (public)
*Params**

**Returns**
-----
# Function policyBookFor

Dev 
## Signature policyBookFor(address)
## `policyBookFor(address insuredContract) → address` (external)
*Params**

**Returns**
-----
# Function statsByInsuredContracts

Dev 
## Signature statsByInsuredContracts(address[])
## `statsByInsuredContracts(address[] insuredContracts) → struct IPolicyBookRegistry.PolicyBookStats[] _stats` (external)
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


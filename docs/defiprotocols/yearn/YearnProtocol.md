# `YearnProtocol`



## Event OwnershipTransferred
## Signature `event` OwnershipTransferred(address,address)




**Params**


# Function __YearnProtocol_init

Dev 
## Signature __YearnProtocol_init()
## `__YearnProtocol_init()` (external)
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
# Function deposit
Deposit an amount of stablecoin in defi protocol in exchange of shares.
    @dev
        We deposit in the Vault an amount of stablecoin.
        This amount is registered in totalDeposit (as an investment).
        The Vault gives shares in return.
        Shares are the representation of the underlying stablecoin in Vault, their price may change.
    @param amount uint256 the amount of stablecoin deposited
Dev 
## Signature deposit(uint256)
## `deposit(uint256 amount)` (external)
*Params**

**Returns**
-----
# Function withdraw
Withdraw an amount of stablecoin in defi protocol in exchange of shares.
    @dev 
        The withdraw function is called with an amount of underlying stablecoin.
        This amount should be inferior to the totalDeposit to ensure that we don't withdraw yield but only investment.
        Then this amount is converted to shares thanks to pricePerShare() function in Vault.
        The amount in shares is sent to the Vault in exchange of an amount of underlying stablecoin sent directly to the capitalPool.
        This amount of stablecoin should equals amountInUnderlying.
    @param amountInUnderlying uint256 the amount of underlying token to withdraw the deposited stable coin
    @return actualAmountWithdrawn : The amount of underlying stablecoin withdrawn (sould equals amountInUnderlying)
Dev 
## Signature withdraw(uint256)
## `withdraw(uint256 amountInUnderlying) → uint256 actualAmountWithdrawn` (external)
*Params**

**Returns**
-----
# Function claimRewards
Claim rewards and send it to reinsurance pool
    @dev 
        We want to withdraw only the yield. 
        First, we compare the amount totalValue (see totalValue()) and the totalDeposit.
        The reward is the difference between totalValue and totalDeposit.
        The rewards is converted in shares thanks to pricePerShare() function in Vault.
        The reward in shares is sent to the Vault in exchange of an amount of underlying stablecoin sent directly to the reinsurancePool.
Dev 
## Signature claimRewards()
## `claimRewards()` (external)
*Params**

**Returns**
-----
# Function totalValue
The totalValue represent the amount of stablecoin locked in the Vault.
    @dev 
        We want to know how much underlying stablecoin is locked in the Vault.
        First we get the balance of this contract to get the quantity of shares.
        Then we get the price of a share (which is evolving).
        The total amount of stablecoin we could withdraw is the quatity of shares * the unit price.
        @return uint256 the total value locked in the defi protocol, in terms of stablecoin
Dev 
## Signature totalValue()
## `totalValue() → uint256` (external)
*Params**

**Returns**
-----
# Function _totalValue

Dev 
## Signature _totalValue()
## `_totalValue() → uint256` (internal)
*Params**

**Returns**
-----
# Function setRewards

Dev 
## Signature setRewards(address)
## `setRewards(address newValue)` (external)
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
# Function stablecoin

Dev 
## Signature stablecoin()
## `stablecoin() → contract ERC20` (external)
*Params**

**Returns**
 - `ERC20`: the erc20 stable coin which depoisted in the defi protocol
-----


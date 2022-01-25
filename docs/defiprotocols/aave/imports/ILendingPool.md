# `ILendingPool`




# Function deposit

Dev Deposits an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
- E.g. User deposits 100 USDC and gets in return 100 aUSDC

## Signature deposit(address,uint256,address,uint16)
## `deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)` (external)
*Params**
 - `asset`: The address of the underlying asset to deposit

 - `amount`: The amount to be deposited

 - `onBehalfOf`: The address that will receive the aTokens, same as msg.sender if the user
  wants to receive them on his own wallet, or a different address if the beneficiary of aTokens
  is a different wallet

 - `referralCode`: Code used to register the integrator originating the operation, for potential rewards.
  0 if the action is executed directly by the user, without any middle-man


**Returns**
-----
# Function withdraw

Dev Withdraws an `amount` of underlying asset from the reserve, burning the equivalent aTokens owned
E.g. User has 100 aUSDC, calls withdraw() and receives 100 USDC, burning the 100 aUSDC

## Signature withdraw(address,uint256,address)
## `withdraw(address asset, uint256 amount, address to) → uint256` (external)
*Params**
 - `asset`: The address of the underlying asset to withdraw

 - `amount`: The underlying amount to be withdrawn
  - Send the value type(uint256).max in order to withdraw the whole aToken balance

 - `to`: Address that will receive the underlying, same as msg.sender if the user
  wants to receive it on his own wallet, or a different address if the beneficiary is a
  different wallet


**Returns**
 - `The`: final amount withdrawn

-----
# Function setUserUseReserveAsCollateral

Dev Allows depositors to enable/disable a specific deposited asset as collateral

## Signature setUserUseReserveAsCollateral(address,bool)
## `setUserUseReserveAsCollateral(address asset, bool useAsCollateral)` (external)
*Params**
 - `asset`: The address of the underlying asset deposited

 - `useAsCollateral`: `true` if the user wants to use the deposit as collateral, `false` otherwise


**Returns**
-----
# Function getReserveNormalizedIncome

Dev Returns the normalized income normalized income of the reserve

## Signature getReserveNormalizedIncome(address)
## `getReserveNormalizedIncome(address asset) → uint256` (external)
*Params**
 - `asset`: The address of the underlying asset of the reserve


**Returns**
 - `The`: reserve's normalized income
-----
# Function getReserveData

Dev Returns the state and configuration of the reserve

## Signature getReserveData(address)
## `getReserveData(address asset) → struct DataTypes.ReserveData` (external)
*Params**
 - `asset`: The address of the underlying asset of the reserve


**Returns**
 - `The`: state of the reserve

-----


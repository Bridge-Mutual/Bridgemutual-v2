# `IPolicyQuote`




# Function getQuotePredefined
Let user to calculate policy cost in stable coin, access: ANY

Dev 
## Signature getQuotePredefined(uint256,uint256,uint256,uint256,bool)
## `getQuotePredefined(uint256 _durationSeconds, uint256 _tokens, uint256 _totalCoverTokens, uint256 _totalLiquidity, bool _safePolicyBook) → uint256` (external)
*Params**
 - `_durationSeconds`: is number of seconds to cover

 - `_tokens`: is a number of tokens to cover

 - `_totalCoverTokens`: is a number of covered tokens

 - `_totalLiquidity`: is a liquidity amount


**Returns**
 - `amount`: of stable coin policy costs
-----
# Function getQuote
Let user to calculate policy cost in stable coin, access: ANY

Dev 
## Signature getQuote(uint256,uint256,address)
## `getQuote(uint256 _durationSeconds, uint256 _tokens, address _policyBookAddr) → uint256` (external)
*Params**
 - `_durationSeconds`: is number of seconds to cover

 - `_tokens`: is number of tokens to cover

 - `_policyBookAddr`: is address of policy book


**Returns**
 - `amount`: of stable coin policy costs
-----


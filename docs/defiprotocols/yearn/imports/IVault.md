# `IVault`




# Function balanceOf

Dev Returns the amount of tokens owned by `account`.
## Signature balanceOf(address)
## `balanceOf(address account) → uint256 balance` (external)
*Params**

**Returns**
-----
# Function pricePerShare
Gives the price for a single Vault share.
    @dev See dev note on `withdraw`.
    @return singleShareValue : The value of a single share.
Dev 
## Signature pricePerShare()
## `pricePerShare() → uint256 singleShareValue` (external)
*Params**

**Returns**
-----
# Function deposit
@notice
        Deposits `_amount` `token`, issuing shares to `recipient`. If the
        Vault is in Emergency Shutdown, deposits will not be accepted and this
        call will fail.
    @dev
        Measuring quantity of shares to issues is based on the total
        outstanding debt that this contract has ("expected value") instead
        of the total balance sheet it has ("estimated value") has important
        security considerations, and is done intentionally. If this value were
        measured against external systems, it could be purposely manipulated by
        an attacker to withdraw more assets than they otherwise should be able
        to claim by redeeming their shares.
        On deposit, this means that shares are issued against the total amount
        that the deposited capital can be given in service of the debt that
        Strategies assume. If that number were to be lower than the "expected
        value" at some future point, depositing shares via this method could
        entitle the depositor to *less* than the deposited value once the
        "realized value" is updated from further reports by the Strategies
        to the Vaults.
        Care should be taken by integrators to account for this discrepancy,
        by using the view-only methods of this contract (both off-chain and
        on-chain) to determine if depositing into the Vault is a "good idea".
    @param _amount : The quantity of tokens to deposit, defaults to all.
    @return issuedShares : The issued Vault shares.
Dev 
## Signature deposit(uint256)
## `deposit(uint256 _amount) → uint256 issuedShares` (external)
*Params**

**Returns**
-----
# Function withdraw
@notice
        Withdraws the calling account's tokens from this Vault, redeeming
        amount `_shares` for an appropriate amount of tokens.
        See note on `setWithdrawalQueue` for further details of withdrawal
        ordering and behavior.
    @dev
        Measuring the value of shares is based on the total outstanding debt
        that this contract has ("expected value") instead of the total balance
        sheet it has ("estimated value") has important security considerations,
        and is done intentionally. If this value were measured against external
        systems, it could be purposely manipulated by an attacker to withdraw
        more assets than they otherwise should be able to claim by redeeming
        their shares.
        On withdrawal, this means that shares are redeemed against the total
        amount that the deposited capital had "realized" since the point it
        was deposited, up until the point it was withdrawn. If that number
        were to be higher than the "expected value" at some future point,
        withdrawing shares via this method could entitle the depositor to
more* than the expected value once the "realized value" is updated
        from further reports by the Strategies to the Vaults.
        Under exceptional scenarios, this could cause earlier withdrawals to
        earn "more" of the underlying assets than Users might otherwise be
        entitled to, if the Vault's estimated value were otherwise measured
        through external means, accounting for whatever exceptional scenarios
        exist for the Vault (that aren't covered by the Vault's own design.)
        In the situation where a large withdrawal happens, it can empty the
        vault balance and the strategies in the withdrawal queue.
        Strategies not in the withdrawal queue will have to be harvested to
        rebalance the funds and make the funds available again to withdraw.
    @param _shares : How many shares to try and redeem for tokens, defaults to all.
    @param recipient : The address to issue the shares in this Vault to. Defaults to the
        caller's address.
    @return value : The quantity of tokens redeemed for `_shares`.
Dev 
## Signature withdraw(uint256,address)
## `withdraw(uint256 _shares, address recipient) → uint256 value` (external)
*Params**

**Returns**
-----


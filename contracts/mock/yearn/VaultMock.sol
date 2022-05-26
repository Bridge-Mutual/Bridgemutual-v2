// SPDX-License-Identifier: MIT

pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract VaultMock is ERC20 {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    ERC20 public usdt;

    uint256 private _pricePerShare;

    uint256 public constant PRECESSION = 10**6;

    constructor(address _usdt) ERC20("yToken", "yToken") {
        _setupDecimals(6);
        _pricePerShare = 1047129;
        usdt = ERC20(_usdt);
    }

    function pricePerShare() external view returns (uint256 singleShareValue) {
        /*
        uint256 nativeTokenBalance = usdt.balanceOf(address(this));
        uint256 yTokenTotalSupply = totalSupply();
        return singleShareValue = nativeTokenBalance.div(yTokenTotalSupply);
        */
        return _pricePerShare;
    }

    function deposit(uint256 amount) external returns (uint256 issuedShares) {
        // Transfer asset
        usdt.safeTransferFrom(msg.sender, address(this), amount);
        // get issuedShare amount
        issuedShares = amount.mul(_pricePerShare).div(PRECESSION);
        // Mint issued amount of shares yToken
        _mint(msg.sender, issuedShares);

        _pricePerShare = _pricePerShare.add(10000);
    }

    function withdraw(uint256 shares, address pool) external returns (uint256 value) {
        // Burn issued amount of shares yToken
        value = burn(msg.sender, pool, shares);
        return value;
    }

    function burn(
        address account,
        address pool,
        uint256 shares
    ) internal returns (uint256 value) {
        // Burn issued amount of shares yToken
        _burn(account, shares);
        // get value represented by shares
        value = shares.mul(_pricePerShare).div(PRECESSION);
        // transfer amountInUnderlying to the msg.sender
        usdt.safeTransfer(pool, value);
        return value;
    }

    function setPricePerShare(uint256 newPricePerShare) public {
        _pricePerShare = newPricePerShare;
    }
}

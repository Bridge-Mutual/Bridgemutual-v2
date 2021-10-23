// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract CERC20Mock is ERC20 {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    // 1 * 10 ^ (18 + underlyingDecimals(6) - cTokenDecimals(8) + 2 (convert from underlyingDecimals to cTokenDecimals)
    uint256 internal constant COMPOUND_EXCHANGE_RATE_PRECISION = 10**18;

    uint256 public constant CTOKEN_DECIMALS = 8;
    ERC20 public stblToken;

    uint256 internal exchangeRate;
    mapping(address => uint256) public userDeposited;

    constructor(address _stblToken) ERC20("cUSDT", "cUSDT") {
        _setupDecimals(8);
        stblToken = ERC20(_stblToken);
        // default exchange rate
        exchangeRate = 20070 * 10**10; // 0.020070
    }

    function mint(uint256 amount) public returns (uint256) {
        stblToken.safeTransferFrom(msg.sender, address(this), amount);
        userDeposited[msg.sender] = userDeposited[msg.sender].add(amount);
        _mint(msg.sender, amount.mul(COMPOUND_EXCHANGE_RATE_PRECISION).div(exchangeRate));
        return 0;
    }

    function redeemUnderlying(uint256 amount) external returns (uint256) {
        _burn(msg.sender, amount.mul(COMPOUND_EXCHANGE_RATE_PRECISION).div(exchangeRate));
        stblToken.safeTransfer(msg.sender, amount);
        userDeposited[msg.sender] = userDeposited[msg.sender].sub(amount);
        return 0;
    }

    function mintInterest(address user) external {
        uint256 cTokenUserBalance = super.balanceOf(user);
        uint256 accumlatedUserBalance =
            cTokenUserBalance.mul(exchangeRate).div(COMPOUND_EXCHANGE_RATE_PRECISION);

        uint256 rewards = accumlatedUserBalance.sub(userDeposited[user]);

        stblToken.safeTransferFrom(msg.sender, address(this), rewards);
    }

    function exchangeRateCurrent() external view returns (uint256) {
        return exchangeRate;
    }

    function setExchangeRateStored(uint256 _rate) external {
        exchangeRate = _rate;
    }
}
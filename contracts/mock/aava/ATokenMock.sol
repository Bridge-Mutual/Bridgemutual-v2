// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./LendingPoolMock.sol";
import "./IncentivizedERC20.sol";

contract ATokenMock is IncentivizedERC20 {
    using SafeMath for uint256;
    using SafeERC20 for IncentivizedERC20;

    uint256 public constant PRECISION = 10**27;

    uint256 public liquidityIndex;

    IncentivizedERC20 public usdt;
    LendingPoolMock public lendingPool;

    constructor(address _usdt, uint256 _liquidityIndex) IncentivizedERC20("aUSDT", "aUSDT") {
        _setupDecimals(6);
        usdt = IncentivizedERC20(_usdt);
        liquidityIndex = _liquidityIndex;
    }

    function mint(
        address _user,
        uint256 _amount,
        uint256 index
    ) public {
        uint256 amountScaled = _amount.mul(PRECISION).div(index);
        require(amountScaled != 0, "LPM: Invalid mint amount");
        _mint(_user, amountScaled);
    }

    function burn(
        address _user,
        address receiverOfUnderlying,
        uint256 _amount,
        uint256 index
    ) external {
        uint256 amountScaled = _amount.mul(PRECISION).div(index);
        require(amountScaled != 0, "LPM: Invalid mint amount");

        _burn(_user, amountScaled);
        usdt.safeTransfer(receiverOfUnderlying, _amount);
    }

    function balanceOf(address user) public view override returns (uint256) {
        return
            super.balanceOf(user).mul(lendingPool.getReserveNormalizedIncome(address(usdt))).div(
                PRECISION
            );
    }

    function mintInterest(address user) external {
        uint256 userBalance = super.balanceOf(user);
        uint256 accumlatedUserBalance =
            userBalance.mul(lendingPool.getReserveNormalizedIncome(address(usdt))).div(PRECISION);
        uint256 rewards = accumlatedUserBalance.sub(userBalance);
        usdt.safeTransferFrom(msg.sender, address(this), rewards);
    }

    function setLiquidityIndex(uint256 _liquidityIndex) external {
        liquidityIndex = _liquidityIndex;
    }

    function setPool(address _pool) external {
        lendingPool = LendingPoolMock(_pool);
    }
}

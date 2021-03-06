// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../interfaces/IContractsRegistry.sol";
import "../interfaces/IDefiProtocol.sol";

contract DefiProtocolMock is IDefiProtocol {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using Math for uint256;

    uint256 public totalDeposit;

    ERC20 public override stablecoin;
    address public yieldGeneratorAddress;
    address public capitalPool;
    bool private isProfitable;

    constructor(
        address _yieldGeneratorAddress,
        address _capitalPool,
        address _stablecoin,
        bool _isProfitable
    ) {
        yieldGeneratorAddress = _yieldGeneratorAddress;
        stablecoin = ERC20(_stablecoin);
        capitalPool = _capitalPool;
        isProfitable = _isProfitable;
    }

    modifier onlyYieldGenerator() {
        require(msg.sender == yieldGeneratorAddress, "AP: Not a yield generator contract");
        _;
    }

    function deposit(uint256 amount) external override onlyYieldGenerator {
        //stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        totalDeposit = totalDeposit.add(amount);
    }

    function withdraw(uint256 amount)
        external
        override
        onlyYieldGenerator
        returns (uint256 actualAmountWithdrawn)
    {
        stablecoin.safeTransfer(capitalPool, amount);

        totalDeposit = totalDeposit.sub(amount);

        return amount;
    }

    function claimRewards() external override onlyYieldGenerator {}

    function totalValue() external view override returns (uint256) {
        if (isProfitable) return totalDeposit.add(10 * 10**6);
        else {
            if (totalDeposit > 0) {
                // 500 stable as lost amount for each protocol
                return totalDeposit.sub(500 * 10**6);
            }
        }
    }

    function setRewards(address newValue) external override onlyYieldGenerator {}

    function getOneDayGain() external pure override returns (uint256) {
        return 843779409435308892532;
    }

    function updateTotalValue() external override onlyYieldGenerator returns (uint256) {}

    function updateTotalDeposit(uint256 _lostAmount) external override onlyYieldGenerator {
        totalDeposit = totalDeposit.sub(_lostAmount);
    }
}

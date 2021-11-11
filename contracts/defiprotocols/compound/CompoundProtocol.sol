// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./imports/ICERC20.sol";
import "./imports/IComptroller.sol";
import "../../libraries/DecimalsConverter.sol";

import "../../interfaces/IContractsRegistry.sol";
import "../../interfaces/IReinsurancePool.sol";
import "../../interfaces/IDefiProtocol.sol";

import "../../abstract/AbstractDependant.sol";

contract CompoundProtocol is IDefiProtocol, OwnableUpgradeable, AbstractDependant {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using Math for uint256;

    uint256 internal constant ERRCODE_OK = 0;
    // 1 * 10 ^ (18 + underlyingDecimals(6) - cTokenDecimals(8) + 2 (convert from underlyingDecimals to cTokenDecimals)
    uint256 internal constant COMPOUND_EXCHANGE_RATE_PRECISION = 10**18;

    uint256 public totalDeposit;
    uint256 public totalRewards;
    uint256 public stblDecimals;

    ERC20 public override stablecoin;
    ICERC20 public cToken;
    IComptroller comptroller;
    IReinsurancePool public reinsurancePool;

    address public yieldGeneratorAddress;
    address public capitalPoolAddress;

    modifier onlyYieldGenerator() {
        require(_msgSender() == yieldGeneratorAddress, "CP: Not a yield generator contract");
        _;
    }

    function __CompoundProtocol_init() external initializer {
        __Ownable_init();
    }

    function setDependencies(IContractsRegistry _contractsRegistry)
        external
        override
        onlyInjectorOrZero
    {
        stablecoin = ERC20(_contractsRegistry.getUSDTContract());
        cToken = ICERC20(_contractsRegistry.getCompoundCTokenContract());
        comptroller = IComptroller(_contractsRegistry.getCompoundComptrollerContract());
        yieldGeneratorAddress = _contractsRegistry.getYieldGeneratorContract();
        reinsurancePool = IReinsurancePool(_contractsRegistry.getReinsurancePoolContract());
        capitalPoolAddress = _contractsRegistry.getCapitalPoolContract();
        stblDecimals = stablecoin.decimals();
    }

    /// @notice deposit an amount in Compound defi protocol
    /// @param amount uint256 the amount of stable coin will deposit
    function deposit(uint256 amount) external override onlyYieldGenerator {
        // Approve `amount` stablecoin to cToken
        /// TODO reset the allowance for TetherA
        stablecoin.safeIncreaseAllowance(address(cToken), amount);

        // Deposit `amount` stablecoin to cToken
        uint256 res = cToken.mint(amount);
        if (res == ERRCODE_OK) {
            totalDeposit = totalDeposit.add(amount);
        }
    }

    function withdraw(uint256 amountInUnderlying)
        external
        override
        onlyYieldGenerator
        returns (uint256 actualAmountWithdrawn)
    {
        if (totalDeposit >= amountInUnderlying) {
            // Withdraw `amountInUnderlying` stablecoin from cToken
            // Transfer `amountInUnderlying` stablecoin to capital pool
            uint256 res = cToken.redeemUnderlying(amountInUnderlying);
            if (res == ERRCODE_OK) {
                stablecoin.safeTransfer(capitalPoolAddress, amountInUnderlying);

                totalDeposit = totalDeposit.sub(amountInUnderlying);
            }
        }
        return amountInUnderlying;
    }

    function claimRewards() external override onlyYieldGenerator {
        uint256 _accumaltedAmount = _totalValue().sub(totalDeposit);

        if (_accumaltedAmount > 0) {
            uint256 res = cToken.redeemUnderlying(_accumaltedAmount);

            if (res == ERRCODE_OK) {
                stablecoin.safeTransfer(capitalPoolAddress, _accumaltedAmount);
                reinsurancePool.addInterestFromDefiProtocols(_accumaltedAmount);

                // get comp reward on top of farming and send it to reinsurance pool
                comptroller.claimComp(address(this));

                ///TODO decide for comp token, where should transfer it
                // ERC20 comp = ERC20(comptroller.getCompAddress());
                // comp.safeTransfer(address(reinsurancePool), comp.balanceOf(address(this)));

                totalRewards = totalRewards.add(_accumaltedAmount);
            }
        }
    }

    function totalValue() external override returns (uint256) {
        return _totalValue();
    }

    function setRewards(address newValue) external override onlyYieldGenerator {}

    function _totalValue() internal returns (uint256) {
        uint256 cTokenBalance = cToken.balanceOf(address(this));
        // Amount of stablecoin units that 1 unit of cToken can be exchanged for, scaled by 10^18
        uint256 cTokenPrice = cToken.exchangeRateCurrent();

        return cTokenBalance.mul(cTokenPrice).div(COMPOUND_EXCHANGE_RATE_PRECISION);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./libraries/DecimalsConverter.sol";

import "./interfaces/ICapitalPool.sol";
import "./interfaces/IClaimingRegistry.sol";
import "./interfaces/IContractsRegistry.sol";
import "./interfaces/ILeveragePortfolio.sol";
import "./interfaces/ILiquidityRegistry.sol";
import "./interfaces/IPolicyBook.sol";
import "./interfaces/IPolicyBookFacade.sol";
import "./interfaces/IPolicyBookRegistry.sol";
import "./interfaces/IYieldGenerator.sol";

import "./abstract/AbstractDependant.sol";

import "./Globals.sol";

contract CapitalPool is ICapitalPool, OwnableUpgradeable, AbstractDependant {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;

    uint256 public constant EPOCH_DURATION_IN_DAYS = 7 days;

    IClaimingRegistry public claimingRegistry;
    IPolicyBookRegistry public policyBookRegistry;
    IYieldGenerator public yieldGenerator;
    ILeveragePortfolio public reinsurancePool;
    ILeveragePortfolio public userLeveragePool;
    ILiquidityRegistry public liquidityRegistry;
    ERC20 public stblToken;

    // reisnurance pool vStable balance updated by(premium, interest from defi)
    uint256 public reinsurancePoolBalance;
    // user leverage pool vStable balance updated by(premium, addliq, withdraw liq)
    uint256 public leveragePoolBalance;
    // policy books vStable balances updated by(premium, addliq, withdraw liq)
    mapping(address => uint256) public regularCoverageBalance;
    // all hStable capital balance , updated by (all pool transfer + deposit to dfi + liq cushion)
    uint256 public hardUsdtAccumulatedBalance;
    // all vStable capital balance , updated by (all pool transfer + withdraw from liq cushion)
    uint256 public override virtualUsdtAccumulatedBalance;
    // pool balances tracking
    uint256 public liquidityCushionBalance;
    uint256 public liquidityCushionDuration;

    event PoolBalancesUpdated(
        uint256 newhardUsdtAccumulatedBalance,
        uint256 newvirtualUsdtAccumulatedBalance,
        uint256 newliquidityCushionBalance,
        uint256 newreinsurancePoolBalance,
        uint256 newleveragePoolBalance
    );

    modifier broadcastBalancing() {
        _;
        emit PoolBalancesUpdated(
            hardUsdtAccumulatedBalance,
            virtualUsdtAccumulatedBalance,
            liquidityCushionBalance,
            reinsurancePoolBalance,
            leveragePoolBalance
        );
    }

    modifier onlyPolicyBook() {
        require(policyBookRegistry.isPolicyBook(msg.sender), "CAPL: Not a PolicyBook");
        _;
    }

    modifier onlyReinsurancePool() {
        require(
            address(reinsurancePool) == _msgSender(),
            "RP: Caller is not a reinsurance pool contract"
        );
        _;
    }

    function __CapitalPool_init() external initializer {
        __Ownable_init();
        liquidityCushionDuration = 24 hours;
    }

    function setDependencies(IContractsRegistry _contractsRegistry)
        external
        override
        onlyInjectorOrZero
    {
        claimingRegistry = IClaimingRegistry(_contractsRegistry.getClaimingRegistryContract());
        policyBookRegistry = IPolicyBookRegistry(
            _contractsRegistry.getPolicyBookRegistryContract()
        );
        stblToken = ERC20(_contractsRegistry.getUSDTContract());
        yieldGenerator = IYieldGenerator(_contractsRegistry.getYieldGeneratorContract());
        reinsurancePool = ILeveragePortfolio(_contractsRegistry.getReinsurancePoolContract());
        userLeveragePool = ILeveragePortfolio(_contractsRegistry.getUserLeveragePoolContract());
        liquidityRegistry = ILiquidityRegistry(_contractsRegistry.getLiquidityRegistryContract());
    }

    /// @notice sets the tether allowance between another contract
    /// @dev stblToken requires allowance to be set to zero before modifying its value
    /// @param _contractAddress, address to modify the allowance
    /// @param _stbAmount, uint256 amount of tokens to allow
    function _setOrIncreaseTetherAllowance(address _contractAddress, uint256 _stbAmount) internal {
        uint256 _contractAllowance = stblToken.allowance(address(this), _contractAddress);

        bool exceedsAllowance = (_stbAmount > _contractAllowance);
        bool allowanceIsZero = (_contractAllowance == 0);

        if (exceedsAllowance) {
            if (!allowanceIsZero) {
                stblToken.safeDecreaseAllowance(_contractAddress, 0);
            }
            stblToken.safeIncreaseAllowance(_contractAddress, _stbAmount);
        }
    }

    /// @notice distributes the policybook premiums into pools (CP, ULP , RP)
    /// @dev distributes the balances acording to the established percentages
    /// @param _stblAmount amount hardSTBL ingressed into the system
    /// @param _epochsNumber uint256 the number of epochs which the policy holder will pay a premium for
    /// @param _protocolFee uint256 the amount of protocol fee earned by premium
    function addPolicyHoldersHardSTBL(
        uint256 _stblAmount,
        uint256 _epochsNumber,
        uint256 _protocolFee
    ) external override onlyPolicyBook broadcastBalancing returns (uint256) {
        uint256 reinsurancePoolPermium;
        uint256 userLeveragePoolPermium;
        uint256 coveragePoolPermium;
        uint256 _lStblDeployedByLP;
        uint256 _vStblDeployedByRP;
        uint256 _vStblOfCP = regularCoverageBalance[_msgSender()];

        (_vStblDeployedByRP, , _lStblDeployedByLP) = (
            IPolicyBookFacade(IPolicyBook(msg.sender).policyBookFacade())
        )
            .getPoolsData();
        (
            reinsurancePoolPermium,
            userLeveragePoolPermium,
            coveragePoolPermium
        ) = _calcPermiumForAllPools(
            PermiumFactors(
                _stblAmount,
                _epochsNumber.mul(EPOCH_DURATION_IN_DAYS),
                _protocolFee,
                _lStblDeployedByLP,
                _vStblDeployedByRP,
                _vStblOfCP
            )
        );

        // update the pools with the new balance
        reinsurancePoolBalance += reinsurancePoolPermium;
        leveragePoolBalance += userLeveragePoolPermium;
        regularCoverageBalance[_msgSender()] += coveragePoolPermium;
        hardUsdtAccumulatedBalance += _stblAmount;
        virtualUsdtAccumulatedBalance += _stblAmount;

        // added the premium to the pools
        reinsurancePool.addPolicyPremium(_epochsNumber, reinsurancePoolPermium);
        userLeveragePool.addPolicyPremium(_epochsNumber, userLeveragePoolPermium);
        return coveragePoolPermium;
    }

    function _calcPermiumForAllPools(PermiumFactors memory factors)
        internal
        returns (
            uint256 reinsurancePoolPermium,
            uint256 userLeveragePoolPermium,
            uint256 coveragePoolPermium
        )
    {
        uint256 _poolUR =
            (IPolicyBook(_msgSender())).totalCoverTokens().mul(PERCENTAGE_100).div(
                factors.vStblOfCP
            );

        uint256 _participatedlStblDeployedByLP =
            factors.lStblDeployedByLP.mul(userLeveragePool.calcM(_poolUR));

        // pool liq + part of pool leverage + reinsurance pool virtual deployed
        uint256 totalLiqforPremium =
            factors.vStblOfCP.add(factors.vStblDeployedByRP).add(_participatedlStblDeployedByLP);

        uint256 _premiumPerDay =
            (
                (factors.stblAmount.sub(factors.protocolFee)).mul(PRECISION).div(
                    factors.permiumDurationInDays
                )
            )
                .div(PRECISION);

        uint256 _premiumEach =
            (totalLiqforPremium.mul(PRECISION).div(_premiumPerDay)).div(PRECISION);

        reinsurancePoolPermium = (
            _premiumEach.mul(factors.vStblDeployedByRP).mul(factors.permiumDurationInDays)
        )
            .add(factors.protocolFee);
        userLeveragePoolPermium = _premiumEach.mul(_participatedlStblDeployedByLP).mul(
            factors.permiumDurationInDays
        );
        coveragePoolPermium = _premiumEach.mul(factors.vStblOfCP).mul(
            factors.permiumDurationInDays
        );
    }

    /// @notice distributes the hardSTBL from the coverage providers
    /// @dev emits PoolBalancedUpdated event
    /// @param _stblAmount amount hardSTBL ingressed into the system
    function addCoverageProvidersHardSTBL(uint256 _stblAmount)
        external
        override
        onlyPolicyBook
        broadcastBalancing
    {
        regularCoverageBalance[_msgSender()] += _stblAmount;
        hardUsdtAccumulatedBalance += _stblAmount;
        virtualUsdtAccumulatedBalance += _stblAmount;
    }

    //// @notice distributes the hardSTBL from the leverage providers
    /// @dev emits PoolBalancedUpdated event
    /// @param _stblAmount amount hardSTBL ingressed into the system
    function addLeverageProvidersHardSTBL(uint256 _stblAmount)
        external
        override
        onlyPolicyBook
        broadcastBalancing
    {
        leveragePoolBalance += _stblAmount;
        hardUsdtAccumulatedBalance += _stblAmount;
        virtualUsdtAccumulatedBalance += _stblAmount;
    }

    /// @notice distributes the hardSTBL from the reinsurance pool
    /// @dev emits PoolBalancedUpdated event
    /// @param _stblAmount amount hardSTBL ingressed into the system
    function addReinsurancePoolHardSTBL(uint256 _stblAmount)
        external
        override
        onlyReinsurancePool
        broadcastBalancing
    {
        reinsurancePoolBalance += _stblAmount;
        hardUsdtAccumulatedBalance += _stblAmount;
        virtualUsdtAccumulatedBalance += _stblAmount;
    }

    /// TODO if user not withdraw the amount after request withdraw , should the amount returned back to capital pool
    /// @notice rebalances pools acording to v2 specification and dao enforced policies
    /// @dev  emits PoolBalancesUpdated
    function rebalanceLiquidityCushion() public override broadcastBalancing onlyOwner {
        (uint256[] memory _claimIndexes, uint256 _lenght) = claimingRegistry.getClaimableIndexes();

        uint256[] memory _pendingClaimsIndexes = new uint256[](_lenght);

        for (uint256 i = 0; i < _lenght; i++) {
            if (claimingRegistry.isClaimPending(_claimIndexes[i])) {
                _pendingClaimsIndexes[_pendingClaimsIndexes.length] = _claimIndexes[i];
            }
        }

        uint256 _pendingClaimAmount = claimingRegistry.getClaimableAmounts(_pendingClaimsIndexes);

        uint256 lastCompletedDay =
            (block.timestamp.mul(PRECISION).div(1 days).mul(PRECISION)).sub(8);

        uint256 _startTime = lastCompletedDay.mul(1 days);
        uint256 _endTime = lastCompletedDay.mul(1 days).add(liquidityCushionDuration);

        /// TODO include user leverage pool withrawal request
        (, , uint256 _requiredLiquidity, ) =
            liquidityRegistry.getWithdrawalRequestsInWindowTime(_startTime, _endTime);

        _requiredLiquidity = _requiredLiquidity.add(_pendingClaimAmount);

        if (_requiredLiquidity <= hardUsdtAccumulatedBalance) {
            liquidityCushionBalance += _requiredLiquidity;
            hardUsdtAccumulatedBalance -= _requiredLiquidity;
            deployFundsToDefi(hardUsdtAccumulatedBalance);
        } else {
            /// TODO fixing  if the withdraw amount from defi is less than the reuqired amount by a small portion
            yieldGenerator.withdraw(_requiredLiquidity.sub(hardUsdtAccumulatedBalance));
            hardUsdtAccumulatedBalance = 0;
            liquidityCushionBalance += _requiredLiquidity;
        }
    }

    /// @notice deploys liquidity from the reinsurance pool to the yieldGenerator
    /// @dev the amount being transfer must not be greater than the reinsurance pool
    /// @param _stblAmount uint256, amount of tokens to transfer to the defiGenerator
    function deployFundsToDefi(uint256 _stblAmount) internal {
        if (_stblAmount == 0) return;

        uint256 _currentApproval = stblToken.allowance(address(this), address(yieldGenerator));
        uint256 _newApproval = _currentApproval.add(_stblAmount);
        _setOrIncreaseTetherAllowance(address(yieldGenerator), _newApproval);

        yieldGenerator.deposit(_stblAmount);
    }

    /// @notice Fullfils policybook claims by transfering the balance to claimer
    /// @param _claimer, address of the claimer recieving the withdraw
    /// @param _stblAmount uint256 amount to be withdrawn
    function fundClaim(address _claimer, uint256 _stblAmount) external override onlyPolicyBook {
        _withdrawFromLiquidityCushion(_claimer, _stblAmount);
        regularCoverageBalance[_msgSender()] -= _stblAmount;
    }

    /// @notice Withdraws liquidity from a specific policbybook to the user
    /// @param _sender, address of the user beneficiary of the withdraw
    /// @param _stblAmount uint256 amount to be withdrawn
    function withdrawLiquidity(
        address _sender,
        uint256 _stblAmount,
        bool _isLeveragePool
    ) external override onlyPolicyBook broadcastBalancing {
        _withdrawFromLiquidityCushion(_sender, _stblAmount);

        if (_isLeveragePool) {
            leveragePoolBalance -= _stblAmount;
        } else {
            regularCoverageBalance[_msgSender()] -= _stblAmount;
        }
    }

    /// @notice Sets the duration in time the capital pool reserves liquidity
    /// @param _newDuration uint256 amount in seconds for the new period
    function setLiquidityCushionDuration(uint256 _newDuration) external override onlyOwner {
        require(_newDuration > 0, "CP: duration is too small");
        liquidityCushionDuration = _newDuration;
    }

    function _withdrawFromLiquidityCushion(address _sender, uint256 _stblAmount)
        internal
        broadcastBalancing
    {
        require(liquidityCushionBalance >= _stblAmount, "LC: insuficient liquidity");

        liquidityCushionBalance = liquidityCushionBalance.sub(_stblAmount);
        virtualUsdtAccumulatedBalance -= _stblAmount;

        stblToken.safeTransfer(_sender, _stblAmount);
    }
}

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
import "./interfaces/IPolicyBook.sol";
import "./interfaces/IPolicyBookFacade.sol";
import "./interfaces/IPolicyBookRegistry.sol";
import "./interfaces/IYieldGenerator.sol";
import "./interfaces/ILeveragePortfolio.sol";

import "./abstract/AbstractDependant.sol";

import "./Globals.sol";

contract CapitalPool is ICapitalPool, OwnableUpgradeable, AbstractDependant {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;

    IClaimingRegistry public claimingRegistry;
    IPolicyBookRegistry public policyBookRegistry;
    IYieldGenerator public yieldGenerator;
    ILeveragePortfolio public reinsurancePool;
    ILeveragePortfolio public userLeveragePool;
    ERC20 public stblToken;

    uint256 public reinsurancePoolBalance;
    uint256 public rewardPoolBalance;
    uint256 public leveragePoolBalance;
    uint256 public hardUsdtAccumulatedBalance;

    // pool balances tracking
    uint256 public liquidityCushionBalance;
    // virtualSTBL
    uint256 public regularCoverageBalance;
    // leverageSTBL
    uint256 public leveragedCoverageBalance;

    event PoolBalancesUpdated(
        uint256 newLiquidityCushion,
        uint256 newLeveragedCoverage,
        uint256 newRegularCoverage
    );

    modifier broadcastBalancing() {
        _;
        emit PoolBalancesUpdated(
            liquidityCushionBalance,
            regularCoverageBalance,
            leveragedCoverageBalance
        );
    }

    modifier onlyPolicyBook() {
        require(policyBookRegistry.isPolicyBook(msg.sender), "CAPL: Not a PolicyBook");
        _;
    }

    function __CapitalPool_init() external initializer {
        __Ownable_init();
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
    }

    /// @notice distributes the the policybook premiums into pools
    /// @dev distributes the balances acording to the established percentages
    /// emits PoolBalancedUpdated event
    /// @param _stblAmount amount hardSTBL ingressed into the system
    /// @param _epochsNumber uint256 the number of epochs which the policy holder will pay a premium for
    function addPolicyHoldersHardSTBL(uint256 _stblAmount, uint256 _epochsNumber)
        external
        override
        onlyPolicyBook
        broadcastBalancing
    {
        // 20% of the policy premiums
        uint256 _reinsuranceShare = _stblAmount.mul(PROTOCOL_PERCENTAGE).div(PERCENTAGE_100);
        // 80% to be used for rewards
        uint256 _rewardPoolShare = _stblAmount.sub(_reinsuranceShare);

        // TODO add portion of the portion of 80% of premium participation
        // _reinsuranceShare =

        reinsurancePoolBalance += _reinsuranceShare;
        rewardPoolBalance += _rewardPoolShare;
        hardUsdtAccumulatedBalance += _stblAmount;
        leveragePoolBalance += _stblAmount;

        uint256 _totalLiquidity = IPolicyBook(msg.sender).totalLiquidity();
        IPolicyBookFacade facade = IPolicyBookFacade(IPolicyBook(msg.sender).policyBookFacade());
        uint256 _reinsurancePoolMPL = facade.reinsurancePoolMPL();
        uint256 _userLeverageMPL = facade.userleveragedMPL();

        reinsurancePool.addPolicyPremium(_epochsNumber, _reinsuranceShare);

        uint256 _vStblDeployedByRP =
            reinsurancePool.deployVirtualStableToCoveragePools(_reinsurancePoolMPL);
        (, uint256 _lStblDeployedByUP) =
            userLeveragePool.deployLeverageStableToCoveragePools(
                _reinsurancePoolMPL,
                _userLeverageMPL
            );

        uint256 totalLiqforPremium = _totalLiquidity.add(_vStblDeployedByRP);
        totalLiqforPremium = totalLiqforPremium.add(_lStblDeployedByUP);

        uint256 _premiumPerDay =
            (_rewardPoolShare.mul(PRECISION).div(_epochsNumber)).div(PRECISION);
        uint256 _premiumEach =
            (totalLiqforPremium.mul(PRECISION).div(_premiumPerDay)).div(PRECISION);

        reinsurancePool.addPolicyPremium(
            _epochsNumber,
            (_premiumEach.mul(_vStblDeployedByRP)).add(_rewardPoolShare)
        );
        userLeveragePool.addPolicyPremium(_epochsNumber, _premiumEach.mul(_lStblDeployedByUP));
        // IPolicyBook(msg.sender).addPolicyPremium(_epochsNumber, _premiumEach.mul(_totalLiquidity));

        // uint256 _totalCover = IPolicyBook(msg.sender).totalCoverTokens();
        // uint256 _uitilizationRatio = _totalCover.mul(PERCENTAGE_100).div(_totalLiquidity);
        // uint256 _m = reinsurancePool.calcM(_uitilizationRatio);
        // uint256 _participationPortion =  _rewardPoolShare.mul(_m).div(PERCENTAGE_100);
        //# 80% to user leverage
        // userLeveragePool.addPolicyPremium(_epochsNumber , _participationPortion);
    }

    /// @notice distributes the hardSTBL from the coverage providers does not specify
    /// a policyBook
    /// @dev sender cannot be a policyBook
    /// emits PoolBalancedUpdated event
    /// @param _stblAmount amount hardSTBL ingressed into the system
    function addCoverageProvidersHardSTBL(uint256 _stblAmount)
        external
        override
        onlyPolicyBook
        broadcastBalancing
    {
        regularCoverageBalance += _stblAmount;
        hardUsdtAccumulatedBalance += _stblAmount;
        _increasePools(msg.sender, _stblAmount, _stblAmount, _stblAmount);
    }

    /// @notice increases the values of the differnt pools
    /// @dev send 0 to keep a value un changed
    /// @param _policyBookAddress address of the policybook
    /// @param _vReinsurancdePool uint256 amount of virtual stbl to add to the reinsurancePool
    /// @param _lReinsurancePool uint amount of the leverage stbl to add to the reinsurancePool
    /// @param _lLeveragePool uint256 amount of of stbl to add to the leverage pool description
    function _increasePools(
        address _policyBookAddress,
        uint256 _vReinsurancdePool,
        uint256 _lReinsurancePool,
        uint256 _lLeveragePool
    ) internal {
        address _coverageFacade = address(IPolicyBook(_policyBookAddress).policyBookFacade());
        (
            uint256 _virtaulReinsurancePool,
            uint256 _leverageReinsurancePool,
            uint256 _leveragePool
        ) = IPolicyBookFacade(_coverageFacade).getPoolsData();

        IPolicyBookFacade(_coverageFacade).updatePoolsData(
            _virtaulReinsurancePool.add(_vReinsurancdePool),
            _leverageReinsurancePool.add(_lReinsurancePool),
            _leveragePool.add(_lLeveragePool)
        );
    }

    /// @notice rebalances pools acording to v2 specification and dao enforced policies
    /// @dev  emits PoolBalancesUpdated
    function rebalanceLiquidityCushion() public override broadcastBalancing {
        // TODO add missing code
        (uint256[] memory _claimIndexes, uint256 _lenght) = claimingRegistry.getClaimableIndexes();
        uint256 pendingClaimAmount = claimingRegistry.getClaimableAmounts(_claimIndexes);
    }

    /// @notice deploys liquidity from the reinsurance pool to the yieldGenerator
    /// @dev the amount being transfer must not be greater than the reinsurance pool
    /// @param _stblAmount uint256, amount of tokens to transfer to the defiGenerator
    function deployFundsToDefi(uint256 _stblAmount) public override {
        require(_stblAmount <= regularCoverageBalance, "CAPL: insufficient funds");

        regularCoverageBalance = regularCoverageBalance.sub(_stblAmount);
        hardUsdtAccumulatedBalance = hardUsdtAccumulatedBalance.sub(_stblAmount);

        _setOrIncreaseTetherAllowance(address(yieldGenerator), _stblAmount);

        yieldGenerator.deposit(_stblAmount);
    }

    /// @notice fullfuls policybook claims being commited
    /// @param _claimer, address of the claimer recieving the withdraw
    /// @param _stblAmount uint256 amount to be withdrawn
    function fundClaim(address _claimer, uint256 _stblAmount)
        external
        override
        onlyPolicyBook
        broadcastBalancing
    {
        stblToken.safeTransfer(_claimer, _stblAmount);
    }
}

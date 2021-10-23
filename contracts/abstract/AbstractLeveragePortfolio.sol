// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

import "../libraries/DecimalsConverter.sol";

import "../interfaces/IPolicyBookRegistry.sol";
import "../interfaces/IContractsRegistry.sol";
import "../interfaces/ILeveragePortfolio.sol";
import "../interfaces/IPolicyBook.sol";

import "./AbstractDependant.sol";

import "../Globals.sol";

abstract contract AbstractLeveragePortfolio is
    ILeveragePortfolio,
    OwnableUpgradeable,
    AbstractDependant
{
    using SafeMath for uint256;
    using Math for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public constant MIN_UR = 2 * PRECISION;

    address public capitalPoolAddress;
    IPolicyBookRegistry public policyBookRegistry;
    ILeveragePortfolio public leveragePortfolio;

    uint256 public targetUR;
    uint256 public d_ProtocolConstant;
    uint256 public a_ProtocolConstant;
    uint256 public max_ProtocolConstant;

    uint256 public override vStableTotalLiquidity;
    uint256 public reevaluateThreshold;

    mapping(address => uint256) public poolsDeployedAmount;
    EnumerableSet.AddressSet internal leveragedCoveragePools;

    event LeverageStableDeployed(address policyBook, uint256 deployedAmount, bool isLeveraged);
    event VirtualStableDeployed(address policyBook, uint256 deployedAmount);
    event ProvidedLeverageReevaluated(LeveragePortfolio leveragePool);

    modifier onlyPolicyBooks() {
        require(policyBookRegistry.isPolicyBook(_msgSender()), "LP: No access");
        _;
    }

    modifier onlyCapitalPool() {
        require(_msgSender() == address(capitalPoolAddress), "PB: No access");
        _;
    }

    function __LeveragePortfolio_init() internal initializer {
        __Ownable_init();
    }

    /// @notice deploy lStable from user leverage pool or reinsurance pool using 2 formulas: access by policybook.
    /// @dev if function call from LP then the MPL is of LP and secondMPL is of RP and vise versa
    /// @param mpl uint256 the MPL of policy book for LP or RP
    /// @param mpl uint256 the MPL of policy book for LP or RP
    /// @return isLeverage bool is leverage or deleverage , _deployedAmount uint256 the amount of lStable to leverage or deleverage
    function deployLeverageStableToCoveragePools(uint256 mpl, uint256 secondMPL)
        external
        override
        onlyPolicyBooks
        returns (bool, uint256)
    {
        return _deployLeverageStableToCoveragePools(mpl, secondMPL, _msgSender());
    }

    /// @notice deploy the vStable from RP in v2 and for next versions it will be from RP and LP : access by policybook.
    /// @param mpl uint256 reinsurance pool MPL
    /// @return the amount of vstable to deploy
    function deployVirtualStableToCoveragePools(uint256 mpl)
        external
        override
        onlyPolicyBooks
        returns (uint256)
    {
        uint256 value = _calcvStableFormulaforOnePool(_msgSender());
        uint256 _currentDeployedAmount = poolsDeployedAmount[_msgSender()];

        uint256 _deployedAmount =
            value.mul(vStableTotalLiquidity).div(_calcvStableFormulaforAllPools()).div(
                PERCENTAGE_100
            );

        uint256 _totalAmount = _deployedAmount.add(_currentDeployedAmount);
        uint256 _maxAmount = mpl.mul(vStableTotalLiquidity).div(PERCENTAGE_100);

        if (_totalAmount > _maxAmount) {
            _deployedAmount = _maxAmount.sub(_totalAmount);
        }
        poolsDeployedAmount[_msgSender()] += _deployedAmount;
        emit VirtualStableDeployed(_msgSender(), _deployedAmount);
        return _deployedAmount;
    }

    /// @notice add the portion of 80% of premium to user leverage pool where the leverage provide lstable : access policybook
    /// add the 20% of premium + portion of 80% of premium where reisnurance pool participate in coverage pools (vStable)  : access policybook
    /// @param epochsNumber uint256 the number of epochs which the policy holder will pay a premium for , zero for RP
    /// @param  premiumAmount uint256 the premium amount which is a portion of 80% of the premium
    function addPolicyPremium(uint256 epochsNumber, uint256 premiumAmount)
        external
        virtual
        override;

    /// @notice calc M factor by formual M = min( abs((1/ (Tur-UR))*d) /a, max)
    /// @param poolUR uint256 utitilization ratio for a coverage pool
    /// @return uint256 M facotr
    function calcM(uint256 poolUR) external view override returns (uint256) {
        return _calcM(poolUR);
    }

    function _calcM(uint256 poolUR) internal view returns (uint256) {
        uint256 _ur;
        uint256 const = 1;
        if (targetUR.div(PERCENTAGE_100) > poolUR) {
            _ur = targetUR.sub(poolUR);
        } else {
            _ur = poolUR.sub(targetUR);
        }

        uint256 _multiplier =
            Math.min(
                (const.div(_ur)).mul(d_ProtocolConstant).div(a_ProtocolConstant),
                max_ProtocolConstant.div(PERCENTAGE_100)
            );
        return _multiplier;
    }

    /// @notice set the threshold % for re-evaluation of the lStable provided across all Coverage pools
    /// @param _threshold uint256 is the reevaluatation threshold
    function setThreshold(uint256 _threshold) external override onlyOwner {
        reevaluateThreshold = _threshold;
    }

    /// @notice set the protocol constant
    /// @notice set the protocol constant : access by owner
    /// @param _targetUR uint256 target utitlization ration
    /// @param _d_ProtocolConstant uint256 D protocol constant
    /// @param  _a_ProtocolConstant uint256 A protocol constant
    /// @param _max_ProtocolConstant uint256 the max % included
    function setProtocolConstant(
        uint256 _targetUR,
        uint256 _d_ProtocolConstant,
        uint256 _a_ProtocolConstant,
        uint256 _max_ProtocolConstant
    ) external override onlyOwner {
        targetUR = _targetUR;
        d_ProtocolConstant = _d_ProtocolConstant;
        a_ProtocolConstant = _a_ProtocolConstant;
        max_ProtocolConstant = _max_ProtocolConstant;
    }

    /// @notice Used to get a list of coverage pools which get leveraged , use with count()
    /// @return _coveragePools a list containing policybook addresses
    function listleveragedCoveragePools(uint256 offset, uint256 limit)
        external
        view
        override
        returns (address[] memory _coveragePools)
    {
        uint256 to = (offset.add(limit)).min(leveragedCoveragePools.length()).max(offset);

        _coveragePools = new address[](to - offset);

        for (uint256 i = offset; i < to; i++) {
            _coveragePools[i - offset] = leveragedCoveragePools.at(i);
        }
    }

    /// @notice get count of coverage pools which get leveraged
    function countleveragedCoveragePools() external view override returns (uint256) {
        return leveragedCoveragePools.length();
    }

    /// @dev using two formulas , if formula 1 get zero then use the formula 2 otherwise get the min value of both
    /// calculate the net mpl for the other pool RP or LP
    function _deployLeverageStableToCoveragePools(
        uint256 mpl,
        uint256 secondMPL,
        address policyBookAddress
    ) internal returns (bool isLeverage, uint256 deployedAmount) {
        IPolicyBook _coveragepool = IPolicyBook(policyBookAddress);
        uint256 _poolTotalLiquidity = _coveragepool.totalLiquidity();

        uint256 _currentDeployedAmount = poolsDeployedAmount[policyBookAddress];

        uint256 _poolUR =
            _coveragepool.totalCoverTokens().mul(PERCENTAGE_100).div(_poolTotalLiquidity);

        uint256 _netMPL = vStableTotalLiquidity.mul(mpl).div(PERCENTAGE_100);

        uint256 _netMPL2 =
            leveragePortfolio.vStableTotalLiquidity().mul(secondMPL).div(PERCENTAGE_100);

        uint256 _amountToDeploy =
            calcMaxLevFunds(LevFundsFactors(_netMPL, _netMPL2, _poolTotalLiquidity, _poolUR));

        if (_amountToDeploy > _currentDeployedAmount) {
            if (!leveragedCoveragePools.contains(policyBookAddress)) {
                leveragedCoveragePools.add(policyBookAddress);
            }
            isLeverage = true;
            deployedAmount = _amountToDeploy.sub(_currentDeployedAmount);

            _currentDeployedAmount += deployedAmount;
        } else if (_currentDeployedAmount > _amountToDeploy) {
            isLeverage = false;
            deployedAmount = _currentDeployedAmount.sub(_amountToDeploy);

            _currentDeployedAmount -= deployedAmount;
        }

        poolsDeployedAmount[policyBookAddress] = _currentDeployedAmount;

        if (_currentDeployedAmount == 0) {
            leveragedCoveragePools.remove(policyBookAddress);
        }

        emit LeverageStableDeployed(policyBookAddress, deployedAmount, isLeverage);
    }

    function calcMaxLevFunds(LevFundsFactors memory factors) internal pure returns (uint256) {
        uint256 _res = factors.poolUR.mul(factors.poolTotalLiquidity).div(PERCENTAGE_100);
        uint256 _ur = Math.max(factors.poolUR, MIN_UR);

        uint256 _formula2 =
            (_ur.mul(factors.poolTotalLiquidity).div(MIN_UR).sub(factors.poolTotalLiquidity))
                .mul(factors.netMPL)
                .div(factors.netMPL.add(factors.netMPL2));

        if (_res > factors.netMPL) {
            uint256 _formula1 = _res.sub(factors.netMPL);
            return Math.min(_formula1, _formula2);
        } else {
            return _formula2;
        }
    }

    /// @notice reevaluate all pools provided by the leverage stable upon threshold
    /// @param leveragePool LeveragePortfolio is determine the pool which call the function
    /// @param newAmount the new amount added or subtracted from the pool
    function _reevaluateProvidedLeverageStable(LeveragePortfolio leveragePool, uint256 newAmount)
        internal
    {
        uint256 _newAmountPercentage = newAmount.mul(PERCENTAGE_100).div(vStableTotalLiquidity);
        if (_newAmountPercentage > reevaluateThreshold) {
            _rebalanceProvidedLeverageStable(leveragePool);
            emit ProvidedLeverageReevaluated(leveragePool);
        }
    }

    /// @notice rebalance all pools provided by the leverage stable
    /// @param leveragePool LeveragePortfolio is determine the pool which call the function
    function _rebalanceProvidedLeverageStable(LeveragePortfolio leveragePool) internal {
        uint256 mpl;
        uint256 secondMPL;
        for (uint256 i = 0; i < leveragedCoveragePools.length(); i++) {
            IPolicyBookFacade _coveragepool = _getCoveragePool(leveragedCoveragePools.at(i));
            if (leveragePool == LeveragePortfolio.USERLEVERAGEPOOL) {
                mpl = _coveragepool.userleveragedMPL();
                secondMPL = _coveragepool.reinsurancePoolMPL();
            } else {
                mpl = _coveragepool.reinsurancePoolMPL();
                secondMPL = _coveragepool.userleveragedMPL();
            }
            _deployLeverageStableToCoveragePools(mpl, secondMPL, leveragedCoveragePools.at(i));

            //TODO  call a function in policybook contract to leverage or delervage the amount of rebalance
        }
    }

    function _calcvStableFormulaforAllPools() internal view returns (uint256) {
        uint256 _coveragePoolCount = policyBookRegistry.count();
        address[] memory _coveragePools = policyBookRegistry.list(0, _coveragePoolCount);
        uint256 sum;
        for (uint256 i = 0; i < _coveragePools.length; i++) {
            sum += _calcvStableFormulaforOnePool(_coveragePools[i]);
        }
        return sum;
    }

    function _calcvStableFormulaforOnePool(address _policybookAddress)
        internal
        view
        returns (uint256)
    {
        uint256 res;
        IPolicyBook _policyBook = IPolicyBook(_policybookAddress);
        IPolicyBookFacade _coveragepool = IPolicyBookFacade(_policyBook.policyBookFacade());

        if (_coveragepool.reinsurancePoolMPL() > 0) {
            uint256 _poolTotalLiquidity = _policyBook.totalLiquidity();
            uint256 _poolUR =
                _policyBook.totalCoverTokens().mul(PERCENTAGE_100).div(_poolTotalLiquidity);
            res = (_poolUR).mul(_poolUR).mul(_poolTotalLiquidity);
        }
        return res;
    }

    /// @notice Returns the policybook facade that stores the leverage storage from a policybook
    /// @param _policybookAddress address of the policybook
    /// @return _coveragePool
    function _getCoveragePool(address _policybookAddress)
        internal
        view
        returns (IPolicyBookFacade _coveragePool)
    {
        IPolicyBook _policyBook = IPolicyBook(_policybookAddress);
        _coveragePool = IPolicyBookFacade(_policyBook.policyBookFacade());
    }
}

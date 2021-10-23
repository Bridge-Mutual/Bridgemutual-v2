// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IContractsRegistry.sol";
import "./interfaces/IYieldGenerator.sol";
import "./interfaces/IDefiProtocol.sol";

import "./abstract/AbstractDependant.sol";

import "./Globals.sol";

contract YieldGenerator is IYieldGenerator, OwnableUpgradeable, AbstractDependant {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using Math for uint256;

    uint256 public constant DEPOSIT_SAFETY_MARGIN = 15 * 10**24; //1.5
    uint256 public constant PROTOCOLS_NUMBER = 5;

    ERC20 public stblToken;
    address public capitalPoolAddress;

    uint256 public totalDeposit;
    uint256 public whitelistedProtocols;
    // TODO read the virtual stable volume from capital pool instead of it
    uint256 internal vStblVolume;

    // index => defi protocol
    mapping(uint256 => DefiProtocol) internal defiProtocols;
    // index => defi protocol addresses
    mapping(uint256 => address) internal defiProtocolsAddresses;
    // available protcols to deposit/withdraw (weighted and threshold is true)
    uint256[] internal availableProtocols;
    // selected protocols for multiple deposit/withdraw
    uint256[] internal _selectedProtocols;

    event DefiDeposited(
        uint256 indexed protocolIndex,
        uint256 amount,
        uint256 depositedPercentage
    );
    event DefiWithdrawn(uint256 indexed protocolIndex, uint256 amount, uint256 withdrawPercentage);

    modifier onlyCapitalPool() {
        require(_msgSender() == capitalPoolAddress, "YG: Not a capital pool contract");
        _;
    }

    modifier updateDefiProtocols(bool isDeposit) {
        _updateDefiProtocols(isDeposit);
        _;
    }

    function __YieldGenerator_init() external initializer {
        __Ownable_init();
    }

    function setDependencies(IContractsRegistry _contractsRegistry)
        external
        override
        onlyInjectorOrZero
    {
        stblToken = ERC20(_contractsRegistry.getUSDTContract());
        capitalPoolAddress = _contractsRegistry.getCapitalPoolContract();

        defiProtocolsAddresses[uint256(DefiProtocols.AAVE)] = _contractsRegistry
            .getAaveProtocolContract();
        defiProtocolsAddresses[uint256(DefiProtocols.COMPOUND)] = _contractsRegistry
            .getCompoundProtocolContract();
        defiProtocolsAddresses[uint256(DefiProtocols.YEARN)] = _contractsRegistry
            .getYearnProtocolContract();
        defiProtocolsAddresses[uint256(DefiProtocols.MPH)] = _contractsRegistry
            .getMPHProtocolContract();
        defiProtocolsAddresses[uint256(DefiProtocols.BARNBRIDGE)] = _contractsRegistry
            .getBarnBridgeProtocolContract();
    }

    /// @notice deposit stable coin into multiple defi protocols using formulas, access: capital pool
    /// @param amount uint256 the amount of stable coin to deposit
    function deposit(uint256 amount) external override onlyCapitalPool {
        _aggregateDepositWithdrawFunction(amount, true);
    }

    /// @notice withdraw stable coin from mulitple defi protocols using formulas, access: capital pool
    /// @param amount uint256 the amount of stable coin to withdraw
    function withdraw(uint256 amount) external override onlyCapitalPool {
        _aggregateDepositWithdrawFunction(amount, false);
    }

    /// @notice set the protocol settings for each defi protocol (allocations, whitelisted, threshold), access: owner
    /// @param whitelisted bool[] list of whitelisted values for each protocol
    /// @param allocations uint256[] list of allocations value for each protocol
    /// @param threshold bool[] list of threshold values for each protocol
    function setProtocolSettings(
        bool[] calldata whitelisted,
        uint256[] calldata allocations,
        bool[] calldata threshold
    ) external override onlyOwner {
        require(
            whitelisted.length == PROTOCOLS_NUMBER &&
                allocations.length == PROTOCOLS_NUMBER &&
                threshold.length == PROTOCOLS_NUMBER,
            "YG: Invlaid arr length"
        );

        whitelistedProtocols = 0;
        bool _whiteListed;
        for (uint256 i = 0; i < PROTOCOLS_NUMBER; i++) {
            _whiteListed = whitelisted[i];

            if (_whiteListed) {
                whitelistedProtocols = whitelistedProtocols.add(1);
            }

            defiProtocols[i].targetAllocation = allocations[i] * PRECISION;

            defiProtocols[i].whiteListed = _whiteListed;
            defiProtocols[i].threshold = threshold[i];
        }
    }

    /// @notice claim rewards for all defi protocols and send them to reinsurance pool, access: owner
    function claimRewards() external override onlyOwner {
        for (uint256 i = 0; i < PROTOCOLS_NUMBER; i++) {
            IDefiProtocol(defiProtocolsAddresses[i]).claimRewards();
        }
    }

    /// @notice returns defi protocol info by its index
    /// @param index uint256 the index of the defi protocol
    function defiProtocol(uint256 index)
        external
        view
        override
        returns (DefiProtocol memory _defiProtocol)
    {
        _defiProtocol = DefiProtocol(
            defiProtocols[index].targetAllocation,
            defiProtocols[index].currentAllocation,
            defiProtocols[index].rebalanceWeight,
            defiProtocols[index].depositedAmount,
            defiProtocols[index].whiteListed,
            defiProtocols[index].threshold
        );
    }

    function _aggregateDepositWithdrawFunction(uint256 amount, bool isDeposit)
        internal
        updateDefiProtocols(isDeposit)
    {
        uint256 _protocolIndex;
        uint256 _protocolsNo = _howManyProtocols(amount, isDeposit);
        if (_protocolsNo == 1) {
            if (availableProtocols.length == 0) {
                return;
            }
            _protocolIndex = _getProtocolOfMaxWeight();
            if (isDeposit) {
                // deposit 100% to this protocol
                _depoist(_protocolIndex, amount, PERCENTAGE_100);
            } else {
                // withdraw 100% from this protocol
                _withdraw(_protocolIndex, amount, PERCENTAGE_100);
            }
        } else if (_protocolsNo > 1) {
            delete _selectedProtocols;

            uint256 _totalWeight;

            for (uint256 i = 0; i < _protocolsNo; i++) {
                if (availableProtocols.length == 0) {
                    break;
                }
                _protocolIndex = _getProtocolOfMaxWeight();
                _totalWeight = _totalWeight.add(defiProtocols[_protocolIndex].rebalanceWeight);
                _selectedProtocols.push(_protocolIndex);
            }

            if (_selectedProtocols.length > 0) {
                for (uint256 i = 0; i < _selectedProtocols.length; i++) {
                    uint256 _protocolRebalanceAllocation =
                        _calcRebalanceAllocation(_selectedProtocols[i], _totalWeight);

                    if (isDeposit) {
                        // deposit % allocation to this protocol
                        _depoist(
                            _selectedProtocols[i],
                            amount.mul(_protocolRebalanceAllocation).div(PERCENTAGE_100),
                            _protocolRebalanceAllocation
                        );
                    } else {
                        _withdraw(
                            _selectedProtocols[i],
                            amount.mul(_protocolRebalanceAllocation).div(PERCENTAGE_100),
                            _protocolRebalanceAllocation
                        );
                    }
                }
            }
        }
    }

    /// @notice deposit into defi protocols
    /// @param _protocolIndex uint256 the predefined index of the defi protocol
    /// @param _amount uint256 amount of stable coin to deposit
    /// @param _depositedPercentage uint256 the percentage of deposited amount into the protocol
    function _depoist(
        uint256 _protocolIndex,
        uint256 _amount,
        uint256 _depositedPercentage
    ) internal {
        // should approve yield to transfer from the capital pool
        stblToken.safeTransferFrom(_msgSender(), defiProtocolsAddresses[_protocolIndex], _amount);

        IDefiProtocol(defiProtocolsAddresses[_protocolIndex]).deposit(_amount);

        // update protocol current allocation
        _updateProtocolCurrentAllocation(_protocolIndex, _amount, true);

        totalDeposit = totalDeposit.add(_amount);

        emit DefiDeposited(_protocolIndex, _amount, _depositedPercentage);
    }

    /// @notice withdraw from defi protocols
    /// @param _protocolIndex uint256 the predefined index of the defi protocol
    /// @param _amount uint256 amount of stable coin to withdraw
    /// @param _withdrawnPercentage uint256 the percentage of withdrawn amount from the protocol
    function _withdraw(
        uint256 _protocolIndex,
        uint256 _amount,
        uint256 _withdrawnPercentage
    ) internal {
        uint256 allocatedFunds = defiProtocols[_protocolIndex].depositedAmount;

        if (allocatedFunds == 0) return;

        if (allocatedFunds < _amount) {
            _amount = defiProtocols[_protocolIndex].depositedAmount;
        }

        uint256 _actualAmountWithdrawn =
            IDefiProtocol(defiProtocolsAddresses[_protocolIndex]).withdraw(_amount);

        // update protocol current allocation
        _updateProtocolCurrentAllocation(_protocolIndex, _actualAmountWithdrawn, false);

        totalDeposit = totalDeposit.sub(_actualAmountWithdrawn);

        emit DefiWithdrawn(_protocolIndex, _actualAmountWithdrawn, _withdrawnPercentage);
    }

    /// @notice get the number of protocols need to rebalance
    /// @param rebalanceAmount uint256 the amount of stable coin will depsoit or withdraw
    function _howManyProtocols(uint256 rebalanceAmount, bool isDeposit)
        public
        view
        returns (uint256)
    {
        uint256 _no1;
        if (isDeposit) {
            _no1 = whitelistedProtocols.mul(rebalanceAmount);
        } else {
            _no1 = PROTOCOLS_NUMBER.mul(rebalanceAmount);
        }

        uint256 _no2 = vStblVolume;

        return _no1.add(_no2 - 1).div(_no2);
        //return _no1.div(_no2).add(_no1.mod(_no2) == 0 ? 0 : 1);
    }

    /// @notice update defi protocols rebalance weight and threshold status
    /// @param isDeposit bool determine the rebalance is for deposit or withdraw
    function _updateDefiProtocols(bool isDeposit) internal {
        delete availableProtocols;

        for (uint256 i = 0; i < PROTOCOLS_NUMBER; i++) {
            uint256 _targetAllocation = defiProtocols[i].targetAllocation;
            uint256 _currentAllocation = defiProtocols[i].currentAllocation;
            uint256 _diffAllocation;

            if (isDeposit) {
                if (_targetAllocation > _currentAllocation) {
                    _diffAllocation = _targetAllocation.sub(_currentAllocation);
                } else if (_currentAllocation >= _targetAllocation) {
                    _diffAllocation = 0;
                }
            } else {
                if (_currentAllocation > _targetAllocation) {
                    _diffAllocation = _currentAllocation.sub(_targetAllocation);
                } else if (_targetAllocation >= _currentAllocation) {
                    _diffAllocation = 0;
                }
            }

            // update rebalance weight
            defiProtocols[i].rebalanceWeight = _diffAllocation.mul(vStblVolume).div(
                PERCENTAGE_100
            );

            if (
                defiProtocols[i].rebalanceWeight > 0 &&
                (isDeposit ? defiProtocols[i].whiteListed && defiProtocols[i].threshold : true)
            ) {
                availableProtocols.push(i);
            }
        }
    }

    /// @notice get the defi protocol has max weight to deposit
    /// @dev only select the positive weight from largest to smallest
    function _getProtocolOfMaxWeight() internal returns (uint256) {
        uint256 _largest;
        uint256 _protocolIndex;
        uint256 _indexToDelete;

        for (uint256 i = 0; i < availableProtocols.length; i++) {
            if (defiProtocols[availableProtocols[i]].rebalanceWeight > _largest) {
                _largest = defiProtocols[availableProtocols[i]].rebalanceWeight;
                _protocolIndex = availableProtocols[i];
                _indexToDelete = i;
            }
        }

        availableProtocols[_indexToDelete] = availableProtocols[availableProtocols.length - 1];
        availableProtocols.pop();

        return _protocolIndex;
    }

    /// @notice update the current allocation of defi protocol after deposit or withdraw
    /// @param _protocolIndex uint256 the predefined index of defi protocol
    /// @param _amount uint256 the amount of stable coin will depsoit or withdraw
    /// @param _isDeposit bool determine the rebalance is for deposit or withdraw
    function _updateProtocolCurrentAllocation(
        uint256 _protocolIndex,
        uint256 _amount,
        bool _isDeposit
    ) internal {
        uint256 _depositedAmount = defiProtocols[_protocolIndex].depositedAmount;
        if (_isDeposit) {
            _depositedAmount = _depositedAmount.add(_amount);
        } else {
            _depositedAmount = _depositedAmount.sub(_amount);
        }
        defiProtocols[_protocolIndex].depositedAmount = _depositedAmount;
        defiProtocols[_protocolIndex].currentAllocation = _depositedAmount.mul(PERCENTAGE_100).div(
            vStblVolume
        );
    }

    /// @notice calc the rebelance allocation % for one protocol for deposit/withdraw
    /// @param _protocolIndex uint256 the predefined index of defi protocol
    /// @param _totalWeight uint256 sum of rebelance weight for all protocols which avaiable for deposit/withdraw
    function _calcRebalanceAllocation(uint256 _protocolIndex, uint256 _totalWeight)
        internal
        view
        returns (uint256)
    {
        return defiProtocols[_protocolIndex].rebalanceWeight.mul(PERCENTAGE_100).div(_totalWeight);
    }

    // TODO:
    // add interface
    // reinusrancepool
    // leverage portfolio
    // policy premiums (20%)
    // function stableBalance() public view returns(uint258) {
    //     return regularCoverageBalance.plus(
    // }
}

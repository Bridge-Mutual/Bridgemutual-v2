// SPDX-Licene-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./libraries/DecimalsConverter.sol";

import "./interfaces/IContractsRegistry.sol";
import "./interfaces/ILeveragePortfolio.sol";
import "./interfaces/ILiquidityRegistry.sol";
import "./interfaces/IPolicyBookAdmin.sol";
import "./interfaces/IPolicyBookFacade.sol";
import "./interfaces/helpers/IPriceFeed.sol";

import "./abstract/AbstractDependant.sol";

import "./Globals.sol";

contract PolicyBookFacade is IPolicyBookFacade, AbstractDependant, Initializable {
    uint256 public constant override DEFAULT_REBALANCING_THRESHOLD = 1 * PRECISION;

    IPolicyBookAdmin public policyBookAdmin;
    ILeveragePortfolio public reinsurancePool;
    ILeveragePortfolio public userLeveragePool;
    IPolicyBook public override policyBook;

    using SafeMath for uint256;

    ILiquidityRegistry public liquidityRegistry;

    address public liquidityMiningAddress;
    address public policyBookFabricAddress;
    address public capitalPoolAddress;
    address public priceFeed;

    uint256 public override VUreinsurnacePool;
    uint256 public override LUreinsurnacePool;
    uint256 public override LUuserLeveragePool;

    uint256 public override userleveragedMPL;
    uint256 public override reinsurancePoolMPL;

    uint256 public override rebalancingThreshold;

    modifier onlyCapitalPool() {
        require(msg.sender == capitalPoolAddress, "PBFC: only CapitalPool");
        _;
    }

    modifier onlyLiquidityAdders() {
        require(
            msg.sender == address(liquidityMiningAddress) || msg.sender == policyBookFabricAddress,
            "PB: Not allowed"
        );
        _;
    }

    modifier onlyPolicyBookAdmin() {
        require(msg.sender == address(policyBookAdmin), "PB: Not a PBA");
        _;
    }

    function __PolicyBookFacade_init(address pbProxy) external override initializer {
        policyBook = IPolicyBook(pbProxy);
        rebalancingThreshold = DEFAULT_REBALANCING_THRESHOLD;
    }

    function setDependencies(IContractsRegistry contractsRegistry)
        external
        override
        onlyInjectorOrZero
    {
        IContractsRegistry _contractsRegistry = IContractsRegistry(contractsRegistry);

        policyBookFabricAddress = _contractsRegistry.getPolicyBookFabricContract();
        capitalPoolAddress = IContractsRegistry(_contractsRegistry).getCapitalPoolContract();
        liquidityMiningAddress = _contractsRegistry.getLiquidityMiningContract();
        policyBookAdmin = IPolicyBookAdmin(_contractsRegistry.getPolicyBookAdminContract());
        priceFeed = IContractsRegistry(_contractsRegistry).getPriceFeedContract();
        reinsurancePool = ILeveragePortfolio(_contractsRegistry.getReinsurancePoolContract());
        userLeveragePool = ILeveragePortfolio(_contractsRegistry.getUserLeveragePoolContract());
    }

    /// @notice Let user to buy policy by supplying stable coin, access: ANY
    /// @param _epochsNumber is number of seconds to cover
    /// @param _coverTokens is number of tokens to cover
    function buyPolicy(uint256 _epochsNumber, uint256 _coverTokens) external override {
        _buyPolicy(msg.sender, _epochsNumber, _coverTokens, 0, address(0));
    }

    function buyPolicyFor(
        address _buyer,
        uint256 _epochsNumber,
        uint256 _coverTokens
    ) external override {
        _buyPolicy(_buyer, _epochsNumber, _coverTokens, 0, address(0));
    }

    function buyPolicyFromDistributor(
        uint256 _epochsNumber,
        uint256 _coverTokens,
        address _distributor
    ) external override {
        uint256 _distributorFee = policyBookAdmin.distributorFees(_distributor);
        require(_distributorFee > 0, "PB: distributor not whitelisted");
        _buyPolicy(msg.sender, _epochsNumber, _coverTokens, _distributorFee, _distributor);
    }

    /// @notice Let user to buy policy by supplying stable coin, access: ANY
    /// @param _buyer address user the policy is being "bought for"
    /// @param _epochsNumber is number of seconds to cover
    /// @param _coverTokens is number of tokens to cover
    function buyPolicyFromDistributorFor(
        address _buyer,
        uint256 _epochsNumber,
        uint256 _coverTokens,
        address _distributor
    ) external override {
        uint256 _distributorFee = policyBookAdmin.distributorFees(_distributor);
        require(_distributorFee > 0, "PB: distributor not whitelisted");
        _buyPolicy(_buyer, _epochsNumber, _coverTokens, _distributorFee, _distributor);
    }

    /// @notice Let user to add liquidity by supplying stable coin, access: ANY
    /// @param _liquidityAmount is amount of stable coin tokens to secure
    function addLiquidity(uint256 _liquidityAmount) external override {
        _addLiquidity(msg.sender, _liquidityAmount, 0);
    }

    /// @notice Let eligible contracts add liqiudity for another user by supplying stable coin
    /// @param _liquidityHolderAddr is address of address to assign cover
    /// @param _liquidityAmount is amount of stable coin tokens to secure
    function addLiquidityFor(address _liquidityHolderAddr, uint256 _liquidityAmount)
        external
        override
        onlyLiquidityAdders
    {
        _addLiquidity(_liquidityHolderAddr, _liquidityAmount, 0);
    }

    /// @notice Let user to add liquidity by supplying stable coin and stake it,
    /// @dev access: ANY
    function addLiquidityAndStake(uint256 _liquidityAmount, uint256 _stakeSTBLAmount)
        external
        override
    {
        _addLiquidity(msg.sender, _liquidityAmount, _stakeSTBLAmount);
    }

    function _addLiquidity(
        address _liquidityHolderAddr,
        uint256 _liquidityAmount,
        uint256 _stakeSTBLAmount
    ) internal {
        policyBook.addLiquidity(_liquidityHolderAddr, _liquidityAmount, _stakeSTBLAmount);
        _deployLeveragedFunds(_liquidityAmount);
    }

    function _buyPolicy(
        address _policyHolderAddr,
        uint256 _epochsNumber,
        uint256 _coverTokens,
        uint256 _distributorFee,
        address _distributor
    ) internal {
        uint256 _premium =
            policyBook.buyPolicy(
                _policyHolderAddr,
                _epochsNumber,
                _coverTokens,
                _distributorFee,
                _distributor
            );

        _deployLeveragedFunds(_premium);
    }

    function _checkRebalancingThreshold(uint256 newAmount) internal view returns (bool) {
        uint256 _newAmountPercentage =
            newAmount.mul(PERCENTAGE_100).div(policyBook.totalLiquidity());
        return _newAmountPercentage > rebalancingThreshold ? true : false;
    }

    function _deployLeveragedFunds(uint256 newAmount) internal {
        if (_checkRebalancingThreshold(newAmount)) {
            uint256 _deployedAmount;
            bool _isLeverage;

            _deployedAmount = reinsurancePool.deployVirtualStableToCoveragePools(
                reinsurancePoolMPL
            );
            policyBook.deployLeverageFunds(_deployedAmount, true);
            VUreinsurnacePool += _deployedAmount;

            (_isLeverage, _deployedAmount) = reinsurancePool.deployLeverageStableToCoveragePools(
                reinsurancePoolMPL,
                userleveragedMPL
            );
            policyBook.deployLeverageFunds(_deployedAmount, _isLeverage);
            LUreinsurnacePool = _isLeverage
                ? LUreinsurnacePool.add(_deployedAmount)
                : LUreinsurnacePool.sub(_deployedAmount);

            (_isLeverage, _deployedAmount) = userLeveragePool.deployLeverageStableToCoveragePools(
                userleveragedMPL,
                reinsurancePoolMPL
            );
            policyBook.deployLeverageFunds(_deployedAmount, _isLeverage);
            LUuserLeveragePool = _isLeverage
                ? LUuserLeveragePool.add(_deployedAmount)
                : LUuserLeveragePool.sub(_deployedAmount);
        }
    }

    /// @notice Let user to withdraw deposited liqiudity, access: ANY
    function withdrawLiquidity() external override {
        uint256 _withdrawAmount = policyBook.withdrawLiquidity(msg.sender);
        _deployLeveragedFunds(_withdrawAmount);
    }

    /// @notice set the MPL for the user leverage and the reinsurance leverage
    /// @param _userLeverageMPL uint256 value of the user leverage MPL
    /// @param _reinsuranceLeverageMPL uint256  value of the reinsurance leverage MPL
    function setMPLs(uint256 _userLeverageMPL, uint256 _reinsuranceLeverageMPL)
        external
        override
        onlyPolicyBookAdmin
    {
        userleveragedMPL = _userLeverageMPL;
        reinsurancePoolMPL = _reinsuranceLeverageMPL;
    }

    /// @notice sets the rebalancing threshold value
    /// @param _newRebalancingThreshold uint256 rebalancing threshhold value
    function setRebalancingThreshold(uint256 _newRebalancingThreshold)
        external
        override
        onlyPolicyBookAdmin
    {
        require(_newRebalancingThreshold > 0, "PBF: threshold can not be 0");
        rebalancingThreshold = _newRebalancingThreshold;
    }

    /// @notice fetches all the pools data
    /// @return uint256 VUreinsurnacePool
    /// @return uint256 LUreinsurnacePool
    /// @return uint256 LUleveragePool
    function getPoolsData()
        external
        view
        override
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        return (VUreinsurnacePool, LUreinsurnacePool, LUuserLeveragePool);
    }

    // TODO possible sandwich attack or allowance fluctuation
    function getClaimApprovalAmount(address user) external view override returns (uint256) {
        (uint256 _coverTokens, , , , ) = policyBook.policyHolders(user);
        _coverTokens = DecimalsConverter.convertFrom18(_coverTokens.div(100), 6);

        return IPriceFeed(priceFeed).howManyBMIsInUSDT(_coverTokens);
    }

    /// @notice upserts a withdraw request
    /// @dev prevents adding a request if an already pending or ready request is open.
    /// @param _tokensToWithdraw uint256 amount of tokens to withdraw
    function requestWithdrawal(uint256 _tokensToWithdraw) external override {
        IPolicyBook.WithdrawalStatus _withdrawlStatus = policyBook.getWithdrawalStatus(msg.sender);

        require(
            _withdrawlStatus == IPolicyBook.WithdrawalStatus.NONE ||
                _withdrawlStatus == IPolicyBook.WithdrawalStatus.EXPIRED,
            "PBf: ongoing withdrawl request"
        );

        policyBook.requestWithdrawal(_tokensToWithdraw, msg.sender);

        liquidityRegistry.registerWithdrawl(address(this), msg.sender);
    }
}

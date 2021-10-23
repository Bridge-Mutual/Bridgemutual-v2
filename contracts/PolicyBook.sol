// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./libraries/DecimalsConverter.sol";

import "./tokens/erc20permit-upgradeable/ERC20PermitUpgradeable.sol";

import "./interfaces/helpers/IPriceFeed.sol";
import "./interfaces/IPolicyBook.sol";
import "./interfaces/IBMICoverStaking.sol";
import "./interfaces/ICapitalPool.sol";
import "./interfaces/IBMICoverStakingView.sol";
import "./interfaces/IContractsRegistry.sol";
import "./interfaces/IPolicyRegistry.sol";
import "./interfaces/IClaimVoting.sol";
import "./interfaces/IClaimingRegistry.sol";
import "./interfaces/ILiquidityMining.sol";
import "./interfaces/IPolicyQuote.sol";
import "./interfaces/IRewardsGenerator.sol";
import "./interfaces/ILiquidityRegistry.sol";
import "./interfaces/INFTStaking.sol";

import "./abstract/AbstractDependant.sol";

import "./Globals.sol";

contract PolicyBook is IPolicyBook, ERC20PermitUpgradeable, AbstractDependant {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using Math for uint256;

    uint256 public constant MINUMUM_COVERAGE = 100 * DECIMALS18; // 100 STBL
    uint256 public constant ANNUAL_COVERAGE_TOKENS = MINUMUM_COVERAGE * 10; // 1000 STBL

    uint256 public constant RISKY_UTILIZATION_RATIO = 80 * PRECISION;
    uint256 public constant MODERATE_UTILIZATION_RATIO = 50 * PRECISION;

    uint256 public constant PREMIUM_DISTRIBUTION_EPOCH = 1 days;
    uint256 public constant MAX_PREMIUM_DISTRIBUTION_EPOCHS = 90;

    uint256 public constant MINIMUM_REWARD = 15 * PRECISION; // 0.15
    uint256 public constant MAXIMUM_REWARD = 2 * PERCENTAGE_100; // 2.0
    uint256 public constant BASE_REWARD = PERCENTAGE_100; // 1.0

    uint256 public constant override EPOCH_DURATION = 1 weeks;
    uint256 public constant MAXIMUM_EPOCHS = SECONDS_IN_THE_YEAR / EPOCH_DURATION;
    uint256 public constant VIRTUAL_EPOCHS = 2;

    uint256 public constant WITHDRAWAL_PERIOD = 8 days;
    uint256 public constant override READY_TO_WITHDRAW_PERIOD = 2 days;

    bool public override whitelisted;

    uint256 public override epochStartTime;
    uint256 public lastDistributionEpoch;

    uint256 public lastPremiumDistributionEpoch;
    int256 public lastPremiumDistributionAmount;

    address public override insuranceContractAddress;
    IPolicyBookFabric.ContractType public override contractType;

    IPriceFeed public priceFeed;
    ERC20 public stblToken;
    IPolicyRegistry public policyRegistry;
    IBMICoverStaking public bmiCoverStaking;
    IBMICoverStakingView public bmiCoverStakingView;
    IRewardsGenerator public rewardsGenerator;
    ILiquidityMining public liquidityMining;
    IClaimVoting public claimVoting;
    IClaimingRegistry public claimingRegistry;
    ILiquidityRegistry public liquidityRegistry;
    address public reinsurancePoolAddress;
    ICapitalPool public capitalPool;
    IPolicyQuote public policyQuote;
    address public policyBookAdmin;
    address public policyBookRegistry;
    address public policyBookFabricAddress;
    IPolicyBookFacade public override policyBookFacade;
    AbstractShieldMiningModel public override shieldMiningModel;

    uint256 public override totalLiquidity;
    uint256 public override totalCoverTokens;

    mapping(address => WithdrawalInfo) public override withdrawalsInfo;
    mapping(address => PolicyHolder) public policyHolders;
    mapping(address => uint256) public liquidityFromLM;
    mapping(uint256 => uint256) public epochAmounts;
    mapping(uint256 => int256) public premiumDistributionDeltas;

    uint256 public stblDecimals;

    INFTStaking public nftStaking;

    event LiquidityAdded(
        address _liquidityHolder,
        uint256 _liquidityAmount,
        uint256 _newTotalLiquidity
    );
    event WithdrawalRequested(
        address _liquidityHolder,
        uint256 _tokensToWithdraw,
        uint256 _readyToWithdrawDate
    );
    event LiquidityWithdrawn(
        address _liquidityHolder,
        uint256 _tokensToWithdraw,
        uint256 _newTotalLiquidity
    );
    event PolicyBought(
        address _policyHolder,
        uint256 _coverTokens,
        uint256 _price,
        uint256 _newTotalCoverTokens,
        address _distributor
    );
    event CoverageChanged(uint256 _newTotalCoverTokens);

    modifier onlyClaimVoting() {
        require(_msgSender() == address(claimVoting), "PB: Not a CV");
        _;
    }

    modifier onlyPolicyBookFacade() {
        require(_msgSender() == address(policyBookFacade), "PB: Not a PBFc");
        _;
    }

    modifier onlyPolicyBookFabric() {
        require(_msgSender() == policyBookFabricAddress, "PB: Not PBF");
        _;
    }

    modifier onlyPolicyBookAdmin() {
        require(_msgSender() == policyBookAdmin, "PB: Not a PBA");
        _;
    }

    modifier onlyLiquidityAdders() {
        require(
            _msgSender() == address(liquidityMining) ||
                _msgSender() == address(policyBookFacade) ||
                _msgSender() == policyBookFabricAddress,
            "PB: Not allowed"
        );
        _;
    }

    modifier updateBMICoverStakingReward() {
        _;
        forceUpdateBMICoverStakingRewardMultiplier();
    }

    modifier withPremiumsDistribution() {
        _distributePremiums();
        _;
    }

    function _distributePremiums() internal {
        uint256 lastEpoch = lastPremiumDistributionEpoch;
        uint256 currentEpoch = _getPremiumDistributionEpoch();

        if (currentEpoch > lastEpoch) {
            (
                lastPremiumDistributionAmount,
                lastPremiumDistributionEpoch,
                totalLiquidity
            ) = _getPremiumsDistribution(lastEpoch, currentEpoch);
        }
    }

    function __PolicyBook_init(
        address _insuranceContract,
        IPolicyBookFabric.ContractType _contractType,
        string calldata _description,
        string calldata _projectSymbol
    ) external override initializer {
        string memory fullSymbol = string(abi.encodePacked("bmi", _projectSymbol, "Cover"));
        __ERC20Permit_init(fullSymbol);
        __ERC20_init(_description, fullSymbol);

        insuranceContractAddress = _insuranceContract;
        contractType = _contractType;

        epochStartTime = block.timestamp;
        lastDistributionEpoch = 1;

        lastPremiumDistributionEpoch = _getPremiumDistributionEpoch();
    }

    function setPolicyBookFacade(address _policyBookFacade)
        external
        override
        onlyPolicyBookFabric
    {
        policyBookFacade = IPolicyBookFacade(_policyBookFacade);
    }

    function setShieldMiningModel(address _shieldMiningModel)
        external
        override
        onlyPolicyBookFabric
    {
        shieldMiningModel = AbstractShieldMiningModel(_shieldMiningModel);
    }

    function setDependencies(IContractsRegistry _contractsRegistry)
        external
        override
        onlyInjectorOrZero
    {
        priceFeed = IPriceFeed(_contractsRegistry.getPriceFeedContract());
        stblToken = ERC20(_contractsRegistry.getUSDTContract());
        bmiCoverStaking = IBMICoverStaking(_contractsRegistry.getBMICoverStakingContract());
        bmiCoverStakingView = IBMICoverStakingView(
            _contractsRegistry.getBMICoverStakingViewContract()
        );
        rewardsGenerator = IRewardsGenerator(_contractsRegistry.getRewardsGeneratorContract());
        liquidityMining = ILiquidityMining(_contractsRegistry.getLiquidityMiningContract());
        claimVoting = IClaimVoting(_contractsRegistry.getClaimVotingContract());
        policyRegistry = IPolicyRegistry(_contractsRegistry.getPolicyRegistryContract());
        reinsurancePoolAddress = _contractsRegistry.getReinsurancePoolContract();
        capitalPool = ICapitalPool(_contractsRegistry.getCapitalPoolContract());
        policyQuote = IPolicyQuote(_contractsRegistry.getPolicyQuoteContract());
        claimingRegistry = IClaimingRegistry(_contractsRegistry.getClaimingRegistryContract());
        liquidityRegistry = ILiquidityRegistry(_contractsRegistry.getLiquidityRegistryContract());
        policyBookAdmin = _contractsRegistry.getPolicyBookAdminContract();
        policyBookRegistry = _contractsRegistry.getPolicyBookRegistryContract();
        policyBookFabricAddress = _contractsRegistry.getPolicyBookFabricContract();
        nftStaking = INFTStaking(_contractsRegistry.getNFTStakingContract());
        stblDecimals = stblToken.decimals();
    }

    function whitelist(bool _whitelisted)
        external
        override
        onlyPolicyBookAdmin
        updateBMICoverStakingReward
    {
        whitelisted = _whitelisted;
    }

    function getEpoch(uint256 time) public view override returns (uint256) {
        return time.sub(epochStartTime).div(EPOCH_DURATION) + 1;
    }

    function _getPremiumDistributionEpoch() internal view returns (uint256) {
        return block.timestamp / PREMIUM_DISTRIBUTION_EPOCH;
    }

    function _getSTBLToBMIXRatio(uint256 currentLiquidity) internal view returns (uint256) {
        uint256 _currentTotalSupply = totalSupply();

        if (_currentTotalSupply == 0) {
            return PERCENTAGE_100;
        }

        return currentLiquidity.mul(PERCENTAGE_100).div(_currentTotalSupply);
    }

    function convertBMIXToSTBL(uint256 _amount) public view override returns (uint256) {
        (, uint256 currentLiquidity) = getNewCoverAndLiquidity();

        return _amount.mul(_getSTBLToBMIXRatio(currentLiquidity)).div(PERCENTAGE_100);
    }

    function convertSTBLToBMIX(uint256 _amount) public view override returns (uint256) {
        (, uint256 currentLiquidity) = getNewCoverAndLiquidity();

        return _amount.mul(PERCENTAGE_100).div(_getSTBLToBMIXRatio(currentLiquidity));
    }

    // TODO possible sandwich attack or allowance fluctuation
    function getClaimApprovalAmount(address user) external view override returns (uint256) {
        return
            priceFeed.howManyBMIsInUSDT(
                DecimalsConverter.convertFrom18(
                    policyHolders[user].coverTokens.div(100),
                    stblDecimals
                )
            );
    }

    function _submitClaimAndInitializeVoting(string memory evidenceURI, bool appeal) internal {
        uint256 cover = policyHolders[_msgSender()].coverTokens;
        uint256 virtualEndEpochNumber =
            policyHolders[_msgSender()].endEpochNumber + VIRTUAL_EPOCHS;

        /// @dev "lock" claim and appeal tokens
        if (!appeal) {
            epochAmounts[virtualEndEpochNumber] = epochAmounts[virtualEndEpochNumber].sub(cover);
        } else {
            uint256 claimIndex = claimingRegistry.claimIndex(_msgSender(), address(this));
            uint256 endLockEpoch =
                Math.max(
                    getEpoch(claimingRegistry.claimEndTime(claimIndex)) + 1,
                    virtualEndEpochNumber
                );

            epochAmounts[endLockEpoch] = epochAmounts[endLockEpoch].sub(cover);
        }

        /// @dev if appeal period expired, this would fail in case of appeal (no button is displayed on FE)
        claimVoting.initializeVoting(_msgSender(), evidenceURI, cover, appeal);
    }

    function submitClaimAndInitializeVoting(string calldata evidenceURI) external override {
        _submitClaimAndInitializeVoting(evidenceURI, false);
    }

    function submitAppealAndInitializeVoting(string calldata evidenceURI) external override {
        _submitClaimAndInitializeVoting(evidenceURI, true);
    }

    function commitClaim(
        address claimer,
        uint256 claimAmount,
        uint256 claimEndTime,
        IClaimingRegistry.ClaimStatus status
    ) external override onlyClaimVoting withPremiumsDistribution updateBMICoverStakingReward {
        updateEpochsInfo();

        if (status == IClaimingRegistry.ClaimStatus.ACCEPTED) {
            uint256 newTotalCover = totalCoverTokens.sub(claimAmount);

            totalCoverTokens = newTotalCover;
            uint256 liquidity = totalLiquidity.sub(claimAmount);
            totalLiquidity = liquidity;

            // TODO replace with fundClaim
            // stblToken.safeTransfer(
            //     claimer,
            //     DecimalsConverter.convertFrom18(claimAmount, stblDecimals)
            // );

            capitalPool.fundClaim(
                claimer,
                DecimalsConverter.convertFrom18(claimAmount, stblDecimals)
            );
            // TODO: verify
            // check additional state changes other than transfer

            emit LiquidityWithdrawn(claimer, claimAmount, liquidity);

            delete policyHolders[claimer];
            policyRegistry.removePolicy(claimer);
        } else if (status == IClaimingRegistry.ClaimStatus.REJECTED_CAN_APPEAL) {
            uint256 endUnlockEpoch =
                Math.max(
                    getEpoch(claimEndTime) + 1,
                    policyHolders[claimer].endEpochNumber + VIRTUAL_EPOCHS
                );

            epochAmounts[endUnlockEpoch] = epochAmounts[endUnlockEpoch].add(
                policyHolders[claimer].coverTokens
            );
        } else {
            uint256 virtualEndEpochNumber =
                policyHolders[claimer].endEpochNumber.add(VIRTUAL_EPOCHS);

            if (lastDistributionEpoch <= virtualEndEpochNumber) {
                epochAmounts[virtualEndEpochNumber] = epochAmounts[virtualEndEpochNumber].add(
                    policyHolders[claimer].coverTokens
                );
            } else {
                uint256 newTotalCover = totalCoverTokens.sub(claimAmount);
                totalCoverTokens = newTotalCover;

                emit CoverageChanged(newTotalCover);
            }
        }
    }

    function _getPremiumsDistribution(uint256 lastEpoch, uint256 currentEpoch)
        internal
        view
        returns (
            int256 currentDistribution,
            uint256 distributionEpoch,
            uint256 newTotalLiquidity
        )
    {
        currentDistribution = lastPremiumDistributionAmount;
        newTotalLiquidity = totalLiquidity;
        distributionEpoch = Math.min(
            currentEpoch,
            lastEpoch + MAX_PREMIUM_DISTRIBUTION_EPOCHS + 1
        );

        for (uint256 i = lastEpoch + 1; i <= distributionEpoch; i++) {
            currentDistribution += premiumDistributionDeltas[i];
            newTotalLiquidity = newTotalLiquidity.add(uint256(currentDistribution));
        }
    }

    function forceUpdateBMICoverStakingRewardMultiplier() public override {
        uint256 rewardMultiplier;

        if (whitelisted) {
            rewardMultiplier = MINIMUM_REWARD;
            uint256 liquidity = totalLiquidity;
            uint256 coverTokens = totalCoverTokens;

            if (coverTokens > 0 && liquidity > 0) {
                rewardMultiplier = BASE_REWARD;

                uint256 utilizationRatio = coverTokens.mul(PERCENTAGE_100).div(liquidity);

                if (utilizationRatio < MODERATE_UTILIZATION_RATIO) {
                    rewardMultiplier = Math
                        .max(utilizationRatio, PRECISION)
                        .sub(PRECISION)
                        .mul(BASE_REWARD.sub(MINIMUM_REWARD))
                        .div(MODERATE_UTILIZATION_RATIO)
                        .add(MINIMUM_REWARD);
                } else if (utilizationRatio > RISKY_UTILIZATION_RATIO) {
                    rewardMultiplier = MAXIMUM_REWARD
                        .sub(BASE_REWARD)
                        .mul(utilizationRatio.sub(RISKY_UTILIZATION_RATIO))
                        .div(PERCENTAGE_100.sub(RISKY_UTILIZATION_RATIO))
                        .add(BASE_REWARD);
                }
            }
        }

        rewardsGenerator.updatePolicyBookShare(rewardMultiplier.div(10**22)); // 5 decimal places or zero
    }

    function getNewCoverAndLiquidity()
        public
        view
        override
        returns (uint256 newTotalCoverTokens, uint256 newTotalLiquidity)
    {
        newTotalLiquidity = totalLiquidity;
        newTotalCoverTokens = totalCoverTokens;

        uint256 lastEpoch = lastPremiumDistributionEpoch;
        uint256 currentEpoch = _getPremiumDistributionEpoch();

        if (currentEpoch > lastEpoch) {
            (, , newTotalLiquidity) = _getPremiumsDistribution(lastEpoch, currentEpoch);
        }

        uint256 newDistributionEpoch = Math.min(getEpoch(block.timestamp), MAXIMUM_EPOCHS);

        for (uint256 i = lastDistributionEpoch; i < newDistributionEpoch; i++) {
            newTotalCoverTokens = newTotalCoverTokens.sub(epochAmounts[i]);
        }
    }

    function getPolicyPrice(
        uint256 _epochsNumber,
        uint256 _coverTokens,
        address _buyer
    ) public view override returns (uint256 totalSeconds, uint256 totalPrice) {
        require(_coverTokens >= MINUMUM_COVERAGE, "PB: Wrong cover");
        require(_epochsNumber > 0 && _epochsNumber <= MAXIMUM_EPOCHS, "PB: Wrong epoch duration");

        (uint256 newTotalCoverTokens, uint256 newTotalLiquidity) = getNewCoverAndLiquidity();

        totalSeconds = secondsToEndCurrentEpoch().add(_epochsNumber.sub(1).mul(EPOCH_DURATION));
        totalPrice = policyQuote.getQuotePredefined(
            totalSeconds,
            _coverTokens,
            newTotalCoverTokens,
            newTotalLiquidity,
            whitelisted
        );

        // reduce premium by reward NFT locked by user
        uint256 _reductionMultiplier = nftStaking.getUserReductionMultiplier(_buyer);
        if (_reductionMultiplier > 0) {
            totalPrice = totalPrice.sub(totalPrice.mul(_reductionMultiplier).div(PERCENTAGE_100));
        }
    }

    function buyPolicy(
        address _buyer,
        uint256 _epochsNumber,
        uint256 _coverTokens,
        uint256 _distributorFee,
        address _distributor
    ) external override onlyPolicyBookFacade {
        _buyPolicy(_buyer, _epochsNumber, _coverTokens, _distributorFee, _distributor);
    }

    function _buyPolicy(
        address _buyer,
        uint256 _epochsNumber,
        uint256 _coverTokens,
        uint256 _distributorFee,
        address _distributor
    ) internal withPremiumsDistribution updateBMICoverStakingReward {
        require(
            !policyRegistry.isPolicyActive(_buyer, address(this)),
            "PB: The holder already exists"
        );
        require(claimingRegistry.canBuyNewPolicy(_buyer, address(this)), "PB: Claim is pending");

        updateEpochsInfo();

        totalCoverTokens = totalCoverTokens.add(_coverTokens);

        require(totalLiquidity >= totalCoverTokens, "PB: Not enough liquidity");

        (uint256 _totalSeconds, uint256 _totalPrice) =
            getPolicyPrice(_epochsNumber, _coverTokens, _buyer);

        // Partners are rewarded with X% of the Premium, coming from the Protocol’s fee part.
        // It's a part of 20% initially send to the Reinsurance pool
        // (the other 80% of the Premium is a yield for coverage providers).

        uint256 _distributorFeeAmount;
        if (_distributorFee > 0) {
            _distributorFeeAmount = _distributorFee.mul(_totalPrice).div(PERCENTAGE_100);
        }

        uint256 _reinsurancePrice =
            _totalPrice.mul(PROTOCOL_PERCENTAGE).div(PERCENTAGE_100).sub(_distributorFeeAmount);

        uint256 _price = _totalPrice.sub(_reinsurancePrice).sub(_distributorFeeAmount);

        uint256 _currentEpochNumber = getEpoch(block.timestamp);
        uint256 _endEpochNumber = _currentEpochNumber.add(_epochsNumber.sub(1));
        uint256 _virtualEndEpochNumber = _endEpochNumber + VIRTUAL_EPOCHS;

        policyHolders[_buyer] = PolicyHolder(
            _coverTokens,
            _currentEpochNumber,
            _endEpochNumber,
            _totalPrice,
            _reinsurancePrice
        );

        epochAmounts[_virtualEndEpochNumber] = epochAmounts[_virtualEndEpochNumber].add(
            _coverTokens
        );

        stblToken.safeTransferFrom(
            _buyer,
            reinsurancePoolAddress,
            DecimalsConverter.convertFrom18(_reinsurancePrice, stblDecimals)
        );

        if (_distributorFeeAmount > 0) {
            stblToken.safeTransferFrom(
                _buyer,
                _distributor,
                DecimalsConverter.convertFrom18(_distributorFeeAmount, stblDecimals)
            );
        }
        stblToken.safeTransferFrom(
            _buyer,
            address(this),
            DecimalsConverter.convertFrom18(_price, stblDecimals)
        );
        // capitalPool.addPolicyHoldersHardSTBL(_totalPrice, _epochsNumber);

        _addPolicyPremiumToDistributions(
            _totalSeconds.add(VIRTUAL_EPOCHS * EPOCH_DURATION),
            _price
        );

        policyRegistry.addPolicy(_buyer, _coverTokens, _price, _totalSeconds);

        emit PolicyBought(_buyer, _coverTokens, _totalPrice, totalCoverTokens, _distributor);
    }

    /// @dev no need to cap epochs because the maximum policy duration is 1 year
    function _addPolicyPremiumToDistributions(uint256 _totalSeconds, uint256 _distributedAmount)
        internal
    {
        uint256 distributionEpochs = _totalSeconds.add(1).div(PREMIUM_DISTRIBUTION_EPOCH).max(1);

        int256 distributedPerEpoch = int256(_distributedAmount.div(distributionEpochs));
        uint256 nextEpoch = _getPremiumDistributionEpoch() + 1;

        premiumDistributionDeltas[nextEpoch] += distributedPerEpoch;
        premiumDistributionDeltas[nextEpoch + distributionEpochs] -= distributedPerEpoch;
    }

    function updateEpochsInfo() public override {
        uint256 _lastDistributionEpoch = lastDistributionEpoch;
        uint256 _newDistributionEpoch =
            Math.min(getEpoch(block.timestamp), _lastDistributionEpoch + MAXIMUM_EPOCHS);

        if (_lastDistributionEpoch < _newDistributionEpoch) {
            uint256 _newTotalCoverTokens = totalCoverTokens;

            for (uint256 i = _lastDistributionEpoch; i < _newDistributionEpoch; i++) {
                _newTotalCoverTokens = _newTotalCoverTokens.sub(epochAmounts[i]);
                delete epochAmounts[i];
            }

            lastDistributionEpoch = _newDistributionEpoch;
            totalCoverTokens = _newTotalCoverTokens;

            emit CoverageChanged(_newTotalCoverTokens);
        }
    }

    function secondsToEndCurrentEpoch() public view override returns (uint256) {
        uint256 epochNumber = block.timestamp.sub(epochStartTime).div(EPOCH_DURATION) + 1;

        return epochNumber.mul(EPOCH_DURATION).sub(block.timestamp.sub(epochStartTime));
    }

    function addLiquidityFor(address _liquidityHolderAddr, uint256 _liquidityAmount)
        external
        override
        onlyLiquidityAdders
    {
        addLiquidity(_liquidityHolderAddr, _liquidityAmount);
    }

    function addLiquidityAndStake(
        uint256 _liquidityAmount,
        uint256 _stakeSTBLAmount,
        address _sender
    ) external override onlyLiquidityAdders {
        require(_stakeSTBLAmount <= _liquidityAmount, "PB: Wrong staking amount");

        addLiquidity(_sender, _liquidityAmount);
        bmiCoverStaking.stakeBMIXFrom(_sender, convertSTBLToBMIX(_stakeSTBLAmount));
    }

    /// @notice adds liquidity on behalf of a sender
    /// @dev only allowed to be called from its facade
    /// @param _liquidityHolderAddr, address  of the sender
    /// @param _liquidityAmount, uint256 amount to be added on behalf the sender
    function addLiquidity(address _liquidityHolderAddr, uint256 _liquidityAmount)
        public
        override
        onlyLiquidityAdders
        withPremiumsDistribution
        updateBMICoverStakingReward
    {
        uint256 stblLiquidity = DecimalsConverter.convertFrom18(_liquidityAmount, stblDecimals);
        require(stblLiquidity > 0, "PB: Liquidity amount is zero");

        updateEpochsInfo();

        /// @dev PBF already sent stable tokens
        /// TODO: track PB sblIngress individually ? or only the _mint
        if (_msgSender() != policyBookFabricAddress) {
            // virtualUsdt += stblLiquidity;
            stblToken.safeTransferFrom(_liquidityHolderAddr, address(capitalPool), stblLiquidity);
            capitalPool.addCoverageProvidersHardSTBL(stblLiquidity);
        }

        /// @dev have to add to LM liquidity
        // TODO confirm changes to the liquidity mininign event
        if (_msgSender() == address(liquidityMining)) {
            liquidityFromLM[_liquidityHolderAddr] = liquidityFromLM[_liquidityHolderAddr].add(
                _liquidityAmount
            );
        }

        _mint(_liquidityHolderAddr, convertSTBLToBMIX(_liquidityAmount));
        uint256 liquidity = totalLiquidity.add(_liquidityAmount);
        totalLiquidity = liquidity;

        liquidityRegistry.tryToAddPolicyBook(_liquidityHolderAddr, address(this));

        emit LiquidityAdded(_liquidityHolderAddr, _liquidityAmount, liquidity);
    }

    function getAvailableBMIXWithdrawableAmount(address _userAddr)
        external
        view
        override
        returns (uint256)
    {
        (uint256 newTotalCoverTokens, uint256 newTotalLiquidity) = getNewCoverAndLiquidity();

        return
            convertSTBLToBMIX(
                Math.min(
                    newTotalLiquidity.sub(newTotalCoverTokens),
                    _getUserAvailableSTBL(_userAddr)
                )
            );
    }

    function _getUserAvailableSTBL(address _userAddr) internal view returns (uint256) {
        uint256 availableSTBL =
            convertBMIXToSTBL(
                balanceOf(_userAddr).add(withdrawalsInfo[_userAddr].withdrawalAmount)
            );

        if (block.timestamp < liquidityMining.getEndLMTime()) {
            uint256 lmLiquidity = liquidityFromLM[_userAddr];

            availableSTBL = availableSTBL <= lmLiquidity ? 0 : availableSTBL - lmLiquidity;
        }

        return availableSTBL;
    }

    function getWithdrawalStatus(address _userAddr)
        public
        view
        override
        returns (WithdrawalStatus)
    {
        uint256 readyToWithdrawDate = withdrawalsInfo[_userAddr].readyToWithdrawDate;

        if (readyToWithdrawDate == 0) {
            return WithdrawalStatus.NONE;
        }

        if (block.timestamp < readyToWithdrawDate) {
            return WithdrawalStatus.PENDING;
        }

        if (
            block.timestamp >= readyToWithdrawDate.add(READY_TO_WITHDRAW_PERIOD) &&
            !withdrawalsInfo[_userAddr].withdrawalAllowed
        ) {
            return WithdrawalStatus.EXPIRED;
        }

        return WithdrawalStatus.READY;
    }

    function requestWithdrawalWithPermit(
        uint256 _tokensToWithdraw,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external override {
        permit(_msgSender(), address(this), _tokensToWithdraw, MAX_INT, _v, _r, _s);

        requestWithdrawal(_tokensToWithdraw);
    }

    function requestWithdrawal(uint256 _tokensToWithdraw)
        public
        override
        withPremiumsDistribution
    {
        require(_tokensToWithdraw > 0, "PB: Amount is zero");

        uint256 _stblTokensToWithdraw = convertBMIXToSTBL(_tokensToWithdraw);
        uint256 _availableSTBLBalance = _getUserAvailableSTBL(_msgSender());

        require(_availableSTBLBalance >= _stblTokensToWithdraw, "PB: Wrong announced amount");

        updateEpochsInfo();

        require(
            totalLiquidity >= totalCoverTokens.add(_stblTokensToWithdraw),
            "PB: Not enough free liquidity"
        );

        _lockTokens(_msgSender(), _tokensToWithdraw);

        uint256 _readyToWithdrawDate = block.timestamp.add(WITHDRAWAL_PERIOD);

        withdrawalsInfo[_msgSender()] = WithdrawalInfo(
            _tokensToWithdraw,
            _readyToWithdrawDate,
            false
        );

        emit WithdrawalRequested(_msgSender(), _tokensToWithdraw, _readyToWithdrawDate);
    }

    function _lockTokens(address _userAddr, uint256 _neededTokensToLock) internal {
        uint256 _currentLockedTokens = withdrawalsInfo[_userAddr].withdrawalAmount;

        if (_currentLockedTokens > _neededTokensToLock) {
            this.transfer(_userAddr, _currentLockedTokens - _neededTokensToLock);
        } else if (_currentLockedTokens < _neededTokensToLock) {
            this.transferFrom(
                _userAddr,
                address(this),
                _neededTokensToLock - _currentLockedTokens
            );
        }
    }

    function unlockTokens() external override {
        uint256 _lockedAmount = withdrawalsInfo[_msgSender()].withdrawalAmount;

        require(_lockedAmount > 0, "PB: Amount is zero");

        this.transfer(_msgSender(), _lockedAmount);
        delete withdrawalsInfo[_msgSender()];
    }

    function withdrawLiquidity()
        external
        override
        withPremiumsDistribution
        updateBMICoverStakingReward
    {
        require(
            getWithdrawalStatus(_msgSender()) == WithdrawalStatus.READY,
            "PB: Withdrawal is not ready"
        );

        updateEpochsInfo();

        uint256 liquidity = totalLiquidity;
        uint256 _currentWithdrawalAmount = withdrawalsInfo[_msgSender()].withdrawalAmount;
        uint256 _tokensToWithdraw =
            Math.min(_currentWithdrawalAmount, convertSTBLToBMIX(liquidity.sub(totalCoverTokens)));

        uint256 _stblTokensToWithdraw = convertBMIXToSTBL(_tokensToWithdraw);
        stblToken.safeTransfer(
            _msgSender(),
            DecimalsConverter.convertFrom18(_stblTokensToWithdraw, stblDecimals)
        );

        _burn(address(this), _tokensToWithdraw);
        liquidity = liquidity.sub(_stblTokensToWithdraw);

        _currentWithdrawalAmount = _currentWithdrawalAmount.sub(_tokensToWithdraw);

        if (_currentWithdrawalAmount == 0) {
            delete withdrawalsInfo[_msgSender()];
            liquidityRegistry.tryToRemovePolicyBook(_msgSender(), address(this));
        } else {
            withdrawalsInfo[_msgSender()].withdrawalAllowed = true;
            withdrawalsInfo[_msgSender()].withdrawalAmount = _currentWithdrawalAmount;
        }

        totalLiquidity = liquidity;

        emit LiquidityWithdrawn(_msgSender(), _stblTokensToWithdraw, liquidity);
    }

    /// @notice returns APY% with 10**5 precision
    function getAPY() public view override returns (uint256) {
        uint256 lastEpoch = lastPremiumDistributionEpoch;
        uint256 currentEpoch = _getPremiumDistributionEpoch();
        int256 premiumDistributionAmount = lastPremiumDistributionAmount;

        // simulates addLiquidity()
        if (currentEpoch > lastEpoch) {
            (premiumDistributionAmount, currentEpoch, ) = _getPremiumsDistribution(
                lastEpoch,
                currentEpoch
            );
        }

        premiumDistributionAmount += premiumDistributionDeltas[currentEpoch + 1];

        return
            uint256(premiumDistributionAmount).mul(365).mul(10**7).div(
                convertBMIXToSTBL(totalSupply()).add(APY_TOKENS)
            );
    }

    function userStats(address _user) external view override returns (PolicyHolder memory) {
        return policyHolders[_user];
    }

    /// @notice _annualProfitYields is multiplied by 10**5
    /// @notice _annualInsuranceCost is calculated for 1000 STBL cover (or _maxCapacities if it is less)
    /// @notice _bmiXRatio is multiplied by 10**18. To get STBL representation,
    ///     multiply BMIX tokens by this value and then divide by 10**18
    function numberStats()
        external
        view
        override
        returns (
            uint256 _maxCapacities,
            uint256 _totalSTBLLiquidity,
            uint256 _stakedSTBL,
            uint256 _annualProfitYields,
            uint256 _annualInsuranceCost,
            uint256 _bmiXRatio
        )
    {
        uint256 newTotalCoverTokens;

        (newTotalCoverTokens, _totalSTBLLiquidity) = getNewCoverAndLiquidity();
        _maxCapacities = _totalSTBLLiquidity - newTotalCoverTokens;

        _stakedSTBL = rewardsGenerator.getStakedPolicyBookSTBL(address(this));
        _annualProfitYields = getAPY().add(bmiCoverStakingView.getPolicyBookAPY(address(this)));

        uint256 possibleCoverage = Math.min(ANNUAL_COVERAGE_TOKENS, _maxCapacities);

        if (possibleCoverage >= MINUMUM_COVERAGE) {
            _annualInsuranceCost = policyQuote.getQuotePredefined(
                SECONDS_IN_THE_YEAR,
                possibleCoverage,
                newTotalCoverTokens,
                _totalSTBLLiquidity,
                whitelisted
            );

            _annualInsuranceCost = _annualInsuranceCost
                .mul(ANNUAL_COVERAGE_TOKENS.mul(PRECISION).div(possibleCoverage))
                .div(PRECISION)
                .div(10);
        }

        _bmiXRatio = convertBMIXToSTBL(10**18);
    }

    function info()
        external
        view
        override
        returns (
            string memory _symbol,
            address _insuredContract,
            IPolicyBookFabric.ContractType _contractType,
            bool _whitelisted
        )
    {
        return (symbol(), insuranceContractAddress, contractType, whitelisted);
    }
}

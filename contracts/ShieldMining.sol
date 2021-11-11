// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IContractsRegistry.sol";
import "./interfaces/IPolicyBookFacade.sol";
import "./interfaces/IPolicyBook.sol";
import "./interfaces/IPolicyBookRegistry.sol";
import "./interfaces/IShieldMining.sol";

import "./abstract/AbstractDependant.sol";

import "./Globals.sol";

contract ShieldMining is IShieldMining, OwnableUpgradeable, ReentrancyGuard, AbstractDependant {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IPolicyBookRegistry public policyBookRegistry;

    mapping(address => ShieldMiningInfo) public shieldMiningInfo;
    mapping(address => mapping(address => uint256)) public userRewardPerTokenPaid;
    mapping(address => mapping(address => uint256)) internal _rewards;

    event ShieldMiningAdded(
        address indexed policyBook,
        address indexed shieldToken,
        uint256 rewardPerBlock,
        uint256 firstBlockWithReward,
        uint256 lastBlockWithReward
    );
    event RewardPaid(address indexed user, uint256 reward);
    event RewardTokensRecovered(uint256 amount);

    /// @dev    Check if the address for the policyBook correspond to an existing and whitelisted policyBook
    modifier whitelistedPolicyBook(address _policyBook) {
        require(policyBookRegistry.isPolicyBook(_policyBook), "SM: inexistant policyBook");
        IPolicyBook policyBook = IPolicyBook(_policyBook);
        require(policyBook.whitelisted() == true, "SM: policyBook not whitelisted");
        _;
    }

    modifier updateReward(address _policyBook, address account) {
        _updateReward(_policyBook, account);
        _;
    }

    function __ShieldMining_init() external initializer {
        __Ownable_init();
    }

    function setDependencies(IContractsRegistry _contractsRegistry)
        external
        override
        onlyInjectorOrZero
    {
        policyBookRegistry = IPolicyBookRegistry(_contractsRegistry.getPolicyRegistryContract());
    }

    function blocksWithRewardsPassed(address _policyBook) public view override returns (uint256) {
        uint256 from =
            Math.max(
                shieldMiningInfo[_policyBook].lastUpdateBlock,
                shieldMiningInfo[_policyBook].firstBlockWithReward
            );
        uint256 to = Math.min(block.number, shieldMiningInfo[_policyBook].lastBlockWithReward);

        return from >= to ? 0 : to.sub(from);
    }

    function rewardPerToken(address _policyBook) public view override returns (uint256) {
        uint256 totalPoolStaked = shieldMiningInfo[_policyBook].totalSupply;

        if (totalPoolStaked == 0) {
            return shieldMiningInfo[_policyBook].rewardPerTokenStored;
        }

        uint256 accumulatedReward =
            blocksWithRewardsPassed(_policyBook)
                .mul(shieldMiningInfo[_policyBook].rewardPerBlock)
                .mul(10**uint256(shieldMiningInfo[_policyBook].decimals))
                .div(totalPoolStaked);

        return shieldMiningInfo[_policyBook].rewardPerTokenStored.add(accumulatedReward);
    }

    function updateTotalSupply(
        address _policyBook,
        uint256 newTotalSupply,
        address liquidityProvider
    ) external override updateReward(_policyBook, liquidityProvider) {
        require(policyBookRegistry.isPolicyBookFacade(_msgSender()), "SM: No access");
        shieldMiningInfo[_policyBook].totalSupply = newTotalSupply;
    }

    function earned(address _policyBook, address _account) public view override returns (uint256) {
        uint256 rewardsDifference =
            rewardPerToken(_policyBook).sub(userRewardPerTokenPaid[_account][_policyBook]);

        IPolicyBookFacade pbFacade = IPolicyBook(_policyBook).policyBookFacade();

        uint256 newlyAccumulated =
            pbFacade.userLiquidity(_account).mul(rewardsDifference).div(
                10**uint256(shieldMiningInfo[_policyBook].decimals)
            );

        return _rewards[_account][_policyBook].add(newlyAccumulated);
    }

    function createShieldMining(
        address _shieldToken,
        address _policyBook,
        uint256 _amount,
        uint256 _duration
    ) external override whitelistedPolicyBook(_policyBook) {
        require(_amount > 0, "SM: cannot deposit zero");
        require(
            address(shieldMiningInfo[_policyBook].rewardsToken) == address(0),
            "SM: shieldMining already set"
        );
        require(_duration >= 30, "SM: below the minimum duration");

        shieldMiningInfo[_policyBook].totalSupply = IERC20(_policyBook).totalSupply();
        shieldMiningInfo[_policyBook].rewardsToken = IERC20(_shieldToken);
        shieldMiningInfo[_policyBook].decimals = ERC20(_shieldToken).decimals();

        uint256 _rewardPerBlock =
            _amount.div(_duration).mul(PRECISION).div(BLOCKS_PER_DAY).div(PRECISION);
        uint256 blocksAmount = _duration.mul(BLOCKS_PER_DAY);

        shieldMiningInfo[_policyBook].rewardsToken.safeTransferFrom(
            _msgSender(),
            address(this),
            _amount
        );

        _setRewards(_policyBook, _rewardPerBlock, block.number, blocksAmount);
    }

    function refill(
        address _policyBook,
        uint256 _amount,
        uint256 _duration
    ) external override {
        require(_amount > 0, "SM: cannot deposit zero");
        require(_duration >= 30, "SM: below the minimum duration");
        address tokenAddress = address(shieldMiningInfo[_policyBook].rewardsToken);
        require(tokenAddress != address(0), "SM: inexistant shield mining");

        uint256 _rewardPerBlock =
            _amount.div(_duration).mul(PRECISION).div(BLOCKS_PER_DAY).div(PRECISION);
        uint256 blocksAmount = _duration.mul(BLOCKS_PER_DAY);

        shieldMiningInfo[_policyBook].rewardsToken.safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        _setRewards(_policyBook, _rewardPerBlock, block.number, blocksAmount);
    }

    function getReward(address _policyBook)
        public
        override
        nonReentrant
        updateReward(_policyBook, _msgSender())
    {
        uint256 reward = _rewards[_msgSender()][_policyBook];

        if (reward > 0) {
            delete _rewards[_msgSender()][_policyBook];

            // transfer profit to the user
            shieldMiningInfo[_policyBook].rewardsToken.safeTransfer(_msgSender(), reward);

            shieldMiningInfo[_policyBook].rewardTokensLocked = shieldMiningInfo[_policyBook]
                .rewardTokensLocked
                .sub(reward);

            emit RewardPaid(_msgSender(), reward);
        }
    }

    /// @notice returns APY% with 10**5 precision
    function getAPY(address _policyBook, uint256 liquidityAdded_)
        external
        view
        override
        returns (uint256)
    {
        uint256 blockLeft =
            _calculateBlocksLeft(block.number, shieldMiningInfo[_policyBook].lastBlockWithReward);

        uint256 futureReward = blockLeft.mul(shieldMiningInfo[_policyBook].rewardPerBlock);
        return
            futureReward.mul(10**5).div(
                shieldMiningInfo[_policyBook].totalSupply.add(liquidityAdded_)
            );
    }

    function recoverNonLockedRewardTokens(address _policyBook) external override onlyOwner {
        uint256 nonLockedTokens =
            shieldMiningInfo[_policyBook].rewardsToken.balanceOf(address(this)).sub(
                shieldMiningInfo[_policyBook].rewardTokensLocked
            );

        shieldMiningInfo[_policyBook].rewardsToken.safeTransfer(owner(), nonLockedTokens);

        emit RewardTokensRecovered(nonLockedTokens);
    }

    function getShieldTokenAddress(address _policyBook) external view override returns (address) {
        return address(shieldMiningInfo[_policyBook].rewardsToken);
    }

    function getShieldMiningInfo(address _policyBook)
        external
        view
        returns (ShieldMiningInfo memory _shieldMiningInfo)
    {
        _shieldMiningInfo = ShieldMiningInfo(
            shieldMiningInfo[_policyBook].rewardsToken,
            shieldMiningInfo[_policyBook].decimals,
            shieldMiningInfo[_policyBook].rewardPerBlock,
            shieldMiningInfo[_policyBook].firstBlockWithReward,
            shieldMiningInfo[_policyBook].lastBlockWithReward,
            shieldMiningInfo[_policyBook].lastUpdateBlock,
            shieldMiningInfo[_policyBook].rewardPerTokenStored,
            shieldMiningInfo[_policyBook].rewardTokensLocked,
            shieldMiningInfo[_policyBook].totalSupply
        );
    }

    function _setRewards(
        address _policyBook,
        uint256 _rewardPerBlock,
        uint256 _startingBlock,
        uint256 _blocksAmount
    ) internal updateReward(_policyBook, address(0)) {
        uint256 unlockedTokens = _getFutureRewardTokens(_policyBook);

        shieldMiningInfo[_policyBook].rewardPerBlock = _rewardPerBlock;
        shieldMiningInfo[_policyBook].firstBlockWithReward = _startingBlock;
        shieldMiningInfo[_policyBook].lastBlockWithReward = _startingBlock.add(_blocksAmount).sub(
            1
        );

        uint256 lockedTokens = _getFutureRewardTokens(_policyBook);
        shieldMiningInfo[_policyBook].rewardTokensLocked = shieldMiningInfo[_policyBook]
            .rewardTokensLocked
            .sub(unlockedTokens)
            .add(lockedTokens);

        require(
            shieldMiningInfo[_policyBook].rewardTokensLocked <=
                shieldMiningInfo[_policyBook].rewardsToken.balanceOf(address(this)),
            "SM: Not enough tokens for the rewards"
        );

        emit ShieldMiningAdded(
            _policyBook,
            address(shieldMiningInfo[_policyBook].rewardsToken),
            _rewardPerBlock,
            _startingBlock,
            shieldMiningInfo[_policyBook].lastBlockWithReward
        );
    }

    function _updateReward(address _policyBook, address account) internal {
        uint256 currentRewardPerToken = rewardPerToken(_policyBook);

        shieldMiningInfo[_policyBook].rewardPerTokenStored = currentRewardPerToken;
        shieldMiningInfo[_policyBook].lastUpdateBlock = block.number;

        if (account != address(0)) {
            _rewards[account][_policyBook] = earned(_policyBook, account);
            userRewardPerTokenPaid[account][_policyBook] = currentRewardPerToken;
        }
    }

    function _getFutureRewardTokens(address _policyBook) internal view returns (uint256) {
        uint256 blocksLeft =
            _calculateBlocksLeft(
                shieldMiningInfo[_policyBook].firstBlockWithReward,
                shieldMiningInfo[_policyBook].lastBlockWithReward
            );

        return blocksLeft.mul(shieldMiningInfo[_policyBook].rewardPerBlock);
    }

    function _calculateBlocksLeft(uint256 _from, uint256 _to) internal view returns (uint256) {
        if (block.number >= _to) return 0;

        if (block.number < _from) return _to.sub(_from).add(1);

        return _to.sub(block.number);
    }
}

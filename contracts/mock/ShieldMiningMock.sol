// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../ShieldMining.sol";

contract ShieldMiningMock is ShieldMining {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    function mockFillShieldMining(
        address _policyBook,
        uint256 _amount,
        uint256 _duration
    ) external shieldMiningEnabled(_policyBook) {
        uint256 _blocksAmount = _duration.mul(BLOCKS_PER_DAY).div(PRECISION).sub(1);

        uint256 _rewardPerBlock = _amount.div(_blocksAmount);

        require(_rewardPerBlock > 0, "SM: deposit too low");

        uint256 _tokenDecimals = shieldMiningInfo[_policyBook].decimals;

        shieldMiningInfo[_policyBook].rewardsToken.safeTransferFrom(
            _msgSender(),
            address(this),
            DecimalsConverter.convertFrom18(_amount, _tokenDecimals)
        );

        shieldMiningInfo[_policyBook].rewardTokensLocked = shieldMiningInfo[_policyBook]
            .rewardTokensLocked
            .add(_amount);

        uint256 _lastBlockWithReward =
            _setRewards(_policyBook, _rewardPerBlock, block.number, _blocksAmount);

        emit ShieldMiningFilled(
            _policyBook,
            address(shieldMiningInfo[_policyBook].rewardsToken),
            _msgSender(),
            _amount,
            _lastBlockWithReward
        );
    }

    function rewards(address policyBook, address staker) external view returns (uint256) {
        return _rewards[staker][policyBook];
    }
}

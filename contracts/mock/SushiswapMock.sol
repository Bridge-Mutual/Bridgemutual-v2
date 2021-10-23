// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/helpers/IRewarder.sol";

contract SushiswapMock {
    using SafeMath for uint256;

    IRewarder public rewarder;
    mapping(address => uint256) public staked;

    constructor(address _rewarder) {
        rewarder = IRewarder(_rewarder);
    }

    function deposit(uint256 amount, address to) external {
        staked[to] = staked[to].add(amount);
        rewarder.onSushiReward(0, to, to, 0, staked[to]);
    }

    function withdraw(uint256 amount, address to) external {
        staked[msg.sender] = staked[msg.sender].sub(amount);
        rewarder.onSushiReward(0, msg.sender, to, 0, staked[msg.sender]);
    }

    function harvest(address to) external {
        rewarder.onSushiReward(0, msg.sender, to, 0, staked[msg.sender]);
    }

    function withdrawAndHarvest(uint256 amount, address to) external {
        staked[msg.sender] = staked[msg.sender].sub(amount);
        rewarder.onSushiReward(0, msg.sender, to, 10, staked[msg.sender]);
    }

    function emergencyWithdraw(address to) external {
        delete staked[msg.sender];
        rewarder.onSushiReward(0, msg.sender, to, 0, 0);
    }
}

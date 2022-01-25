module.exports = async function (shieldMiningViewMock, insuranceContract, rewardToken, address) {
  try {
    let stakedUsd = await shieldMiningViewMock.getStakedUsd.call(insuranceContract, { from: address });
    console.log(`stakedUsd                          ${stakedUsd}`);

    let blocksSinceLastUpdate = await shieldMiningViewMock.getBlocksSinceLastUpdate.call(
      insuranceContract,
      rewardToken.address,
      { from: address }
    );
    console.log(`blocksSinceLastUpdate              ${JSON.stringify(blocksSinceLastUpdate)}`);

    let rewardPerBlock = await shieldMiningViewMock.getRewardPerBlock.call(insuranceContract, rewardToken.address, {
      from: address,
    });
    console.log(`rewardPerBlock                     ${rewardPerBlock}`);

    let latestBlockWithRewards = await shieldMiningViewMock.getLatestBlockWithRewards.call(
      insuranceContract,
      rewardToken.address,
      { from: address }
    );
    console.log(`latestBlockWithRewards             ${latestBlockWithRewards}`);

    let rewardPerTokenSinceLastUpdate = await shieldMiningViewMock.getRewardPerTokenSinceLastUpdate.call(
      insuranceContract,
      rewardToken.address,
      { from: address }
    );
    console.log(`rewardPerTokenSinceLastUpdate      ${rewardPerTokenSinceLastUpdate.toString()}`);

    let lastRewardPerToken = await shieldMiningViewMock.getLastRewardPerToken.call(
      insuranceContract,
      rewardToken.address,
      { from: address }
    );
    console.log(`lastRewardPerToken                 ${lastRewardPerToken.toString()}`);

    let rewardPerTokenFromStart = lastRewardPerToken.add(rewardPerTokenSinceLastUpdate);
    console.log(`rewardPerTokenFromStart            ${rewardPerTokenFromStart}`);

    let lastRewardPerTokenAccruedByUser = await shieldMiningViewMock.getLastRewardPerTokenAccruedByUser.call(
      insuranceContract,
      rewardToken.address,
      address,
      { from: address }
    );
    console.log(`lastRewardPerTokenAccruedByUser    ${lastRewardPerTokenAccruedByUser}`);
  } catch (e) {
    process.exit(0);
  }
};

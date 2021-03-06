const { logTransaction } = require("./helpers/logger.js");
const { toBN } = require("./helpers/utils.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const BMIToken = artifacts.require("BMIMock");

const BMICoverStaking = artifacts.require("BMICoverStaking");
const RewardsGenerator = artifacts.require("RewardsGenerator");
const BMIStaking = artifacts.require("BMIStaking");
const LiquidityMiningStakingETH = artifacts.require("LiquidityMiningStakingETH");
const LiquidityMiningStakingUSDT = artifacts.require("LiquidityMiningStakingUSDT");

const wei = web3.utils.toWei;
const blockNumber = web3.eth.getBlockNumber;

const BMICoverStakingSupply = wei("5000000"); // 5 mil
const BMICoverStakingRewardPerBlock = wei("3"); // 3 BMI

const BMIStakingSupply = wei("5000000"); // 5 mil
const BMIStakingRewardPerBlock = wei("1"); // 1 BMI

const LiquidityMiningStakingSupply = wei("5000000"); // 5 mil
const LiquidityMiningStakingRewardPerBlock = wei("1"); // 1 BMI
const LiquidityMiningStakingStartBlockOffset = 10;
const LiquidityMiningStakingBlocksDuration = 4000000;

module.exports = async (deployer, network) => {
  if (["mainnet", "bsc_mainnet", "polygon_mainnet"].includes(network)) {
    return;
  }

  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  const bmiToken = await BMIToken.at(await contractsRegistry.getBMIContract());

  const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
  const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());

  logTransaction(
    await bmiToken.transfer(bmiCoverStaking.address, BMICoverStakingSupply),
    "Transfer BMIs to BMICoverStaking"
  );

  logTransaction(
    await rewardsGenerator.setRewardPerBlock(BMICoverStakingRewardPerBlock),
    "Set BMICoverStaking reward per block"
  );

  if (["ropsten", "rinkeby", "development"].includes(network)) {
    const bmiStaking = await BMIStaking.at(await contractsRegistry.getBMIStakingContract());
    const liquidityMiningStakingETH = await LiquidityMiningStakingETH.at(
      await contractsRegistry.getLiquidityMiningStakingETHContract()
    );
    const liquidityMiningStakingUSDT = await LiquidityMiningStakingUSDT.at(
      await contractsRegistry.getLiquidityMiningStakingUSDTContract()
    );

    logTransaction(await bmiToken.transfer(bmiStaking.address, BMIStakingSupply), "Transfer BMIs to BMIStaking");
    logTransaction(
      await bmiToken.transfer(liquidityMiningStakingETH.address, LiquidityMiningStakingSupply),
      "Transfer BMIs to LiquidityMiningStakingETH"
    );

    logTransaction(
      await bmiToken.transfer(liquidityMiningStakingUSDT.address, LiquidityMiningStakingSupply),
      "Transfer BMIs to LiquidityMiningStakingUSDT"
    );

    logTransaction(await bmiStaking.setRewardPerBlock(BMIStakingRewardPerBlock), "Set BMIStaking reward per block");

    const startBlock = toBN(await blockNumber()).plus(LiquidityMiningStakingStartBlockOffset);

    logTransaction(
      await liquidityMiningStakingETH.setRewards(
        LiquidityMiningStakingRewardPerBlock,
        startBlock,
        LiquidityMiningStakingBlocksDuration
      ),
      "Set LiquidityMiningStakingETH reward per block and start from " + startBlock.toString() + " block"
    );

    logTransaction(
      await liquidityMiningStakingUSDT.setRewards(
        LiquidityMiningStakingRewardPerBlock,
        startBlock,
        LiquidityMiningStakingBlocksDuration
      ),
      "Set LiquidityMiningStakingUSDT reward per block and start from " + startBlock.toString() + " block"
    );
  }
};

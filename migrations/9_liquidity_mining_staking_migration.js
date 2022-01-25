const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const LiquidityMiningStakingETH = artifacts.require("LiquidityMiningStakingETH");

// TODO validate finality of data below
//const legacyLiquidityMiningStakingAddress = "0xeE4c79dfFB0123e7A04021B2a934b9B34fab52a4";

// TODO validate finality of data below
const sushiswapMasterChefV2Address = "0xef0881ec094552b2e128cf945ef17a6752b4ec5d";

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(LiquidityMiningStakingETH);
  await LiquidityMiningStakingETH.deployed();

  logTransaction(
    await contractsRegistry.addContract(
      await contractsRegistry.SUSHI_SWAP_MASTER_CHEF_V2_NAME(),
      sushiswapMasterChefV2Address
    ),
    "Add sushiswapMasterChefV2Address"
  );

  logTransaction(
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(),
      LiquidityMiningStakingETH.address
    ),
    "AddProxy LiquidityMiningStakingETH"
  );
};

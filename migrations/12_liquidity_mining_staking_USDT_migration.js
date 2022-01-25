const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const LiquidityMiningStakingUSDT = artifacts.require("LiquidityMiningStakingUSDT");

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(LiquidityMiningStakingUSDT);
  await LiquidityMiningStakingUSDT.deployed();

  logTransaction(
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(),
      LiquidityMiningStakingUSDT.address
    ),
    "AddProxy LiquidityMiningStakingUSDT"
  );
};

const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const ShieldMining = artifacts.require("ShieldMining");

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(ShieldMining);
  const shieldMining = await ShieldMining.deployed();

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.SHIELD_MINING_NAME(), shieldMining.address),
    "Add Shield Mining"
  );
};

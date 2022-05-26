const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const ReinsurancePool = artifacts.require("ReinsurancePool");
const CapitalPool = artifacts.require("CapitalPool");

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(ReinsurancePool);
  const reinsurancePool = await ReinsurancePool.deployed();

  await deployer.deploy(CapitalPool);
  const capitalPool = await CapitalPool.deployed();

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.REINSURANCE_POOL_NAME(), reinsurancePool.address),
    "AddProxy ReinsurancePool"
  );
  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.CAPITAL_POOL_NAME(), capitalPool.address),
    "AddProxy CapitalPool"
  );
};

const { logTransaction } = require("./helpers/logger.js");
const { mainnet } = require("./helpers/AddressCatalog.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const BMIStaking = artifacts.require("BMIStaking");

module.exports = async (deployer, network) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);
  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    await deployer.deploy(BMIStaking);
    const bmiStaking = await BMIStaking.deployed();

    logTransaction(
      await contractsRegistry.addProxyContract(await contractsRegistry.BMI_STAKING_NAME(), bmiStaking.address),
      "AddProxy BMIStaking"
    );
  }
};

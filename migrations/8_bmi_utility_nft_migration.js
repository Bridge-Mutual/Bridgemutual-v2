const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(BMIUtilityNFT);
  const bmiUtilityNFT = await BMIUtilityNFT.deployed();

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.BMI_UTILITY_NFT_NAME(), bmiUtilityNFT.address),
    "Add BMIUtilityNFT"
  );
};

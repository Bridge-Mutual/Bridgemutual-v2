const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const NFTStaking = artifacts.require("NFTStaking");

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(NFTStaking);
  const nftStaking = await NFTStaking.deployed();

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.NFT_STAKING_NAME(), nftStaking.address),
    "Add NFTStaking"
  );
};

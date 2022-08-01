const { logTransaction, logAddress } = require("./helpers/logger.js");
const { mainnet } = require("./helpers/AddressCatalog.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const BMIProxyAdmin = artifacts.require("BMIProxyAdmin");

let proxy;
module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(ContractsRegistry);
  const contractsRegistry = await ContractsRegistry.deployed();

  if (["mainnet"].includes(network)) {
    proxy = mainnet.proxy_admin;
  } else {
    await deployer.deploy(BMIProxyAdmin);
    proxy = (await BMIProxyAdmin.deployed()).address;
    logAddress("BMIProxyAdmin", proxy);
  }

  await deployer.deploy(Proxy, contractsRegistry.address, proxy, []);
  proxy = await Proxy.deployed();

  logTransaction(
    await (await ContractsRegistry.at(proxy.address)).__ContractsRegistry_init(),
    "Init ContractsRegistry"
  );
};

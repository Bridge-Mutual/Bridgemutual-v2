const { logTransaction } = require("./helpers/logger.js");
const { mainnet, bsc, polygon } = require("./helpers/AddressCatalog.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const UniswaprouterMock = artifacts.require("UniswapRouterMock");

const PriceFeed = artifacts.require("PriceFeed");

let ammRouterContractAdd;
let priceFeedContractAdd;

module.exports = async (deployer, network) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  if (!["mainnet", "bsc_mainnet", "polygon_mainnet"].includes(network)) {
    await deployer.deploy(UniswaprouterMock);
    ammRouterContractAdd = (await UniswaprouterMock.deployed()).address;
  }

  await deployer.deploy(PriceFeed);
  priceFeedContractAdd = (await PriceFeed.deployed()).address;

  if (["mainnet"].includes(network)) {
    ammRouterContractAdd = mainnet.amm_router;
  }

  if (["bsc_mainnet"].includes(network)) {
    ammRouterContractAdd = bsc.amm_router;
  }

  if (["polygon_mainnet"].includes(network)) {
    ammRouterContractAdd = polygon.amm_router;
  }

  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.AMM_ROUTER_NAME(), ammRouterContractAdd),
    "Add AMMRouter"
  );

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), priceFeedContractAdd),
    "AddProxy PriceFeed"
  );
};

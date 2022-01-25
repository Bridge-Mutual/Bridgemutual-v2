const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const UniswaprouterMock = artifacts.require("UniswapRouterMock");
const SushiswaprouterMock = artifacts.require("UniswapRouterMock");
const PriceFeed = artifacts.require("PriceFeed");

// TODO validate finality of data below
const uniswapRouterV2Address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

// TODO validate finality of data below
const sushiswapRouterV2Address = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(UniswaprouterMock);
  const uniswapRouterMock = await UniswaprouterMock.deployed();

  await deployer.deploy(SushiswaprouterMock);
  const sushiswapRouterMock = await SushiswaprouterMock.deployed();

  await deployer.deploy(PriceFeed);
  const priceFeed = await PriceFeed.deployed();

  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.UNISWAP_ROUTER_NAME(), uniswapRouterMock.address),
    "Add UniswapRouter"
  );

  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.SUSHISWAP_ROUTER_NAME(), sushiswapRouterMock.address),
    "Add SushiswapRouter"
  );

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.PRICE_FEED_NAME(), priceFeed.address),
    "AddProxy PriceFeed"
  );
};

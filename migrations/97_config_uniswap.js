const { logTransaction } = require("./helpers/logger.js");
const { toBN } = require("./helpers/utils.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const LpBmiEthMock = artifacts.require("LpBmiEthMock");
const LpBmiUsdtMock = artifacts.require("LpBmiUsdtMock");
const UniswapRouterMock = artifacts.require("UniswapRouterMock");
const SushiswapRouterMock = artifacts.require("UniswapRouterMock");

const wei = web3.utils.toWei;

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  const lpBmiEthTokenMock = await LpBmiEthMock.at(await contractsRegistry.getUniswapBMIToETHPairContract());
  const lpBmiUsdtTokenMock = await LpBmiUsdtMock.at(await contractsRegistry.getUniswapBMIToUSDTPairContract());

  const lpSushiBmiEthTokenMock = await LpBmiEthMock.at(await contractsRegistry.getSushiswapBMIToETHPairContract());
  const lpSushiBmiUsdtTokenMock = await LpBmiUsdtMock.at(await contractsRegistry.getSushiswapBMIToUSDTPairContract());

  const uniswapRouterMock = await UniswapRouterMock.at(await contractsRegistry.getUniswapRouterContract());
  const sushiswapRouterMock = await SushiswapRouterMock.at(await contractsRegistry.getSushiswapRouterContract());

  console.log();

  logTransaction(
    await lpBmiEthTokenMock.setReserves(wei(toBN(10 ** 8).toString()), wei(toBN(10 ** 7).toString())),
    "Set BMI/ETH reserves"
  );

  logTransaction(
    await lpBmiUsdtTokenMock.setReserves(wei(toBN(10 ** 8).toString()), wei(toBN(10 ** 7).toString(), "mwei")),
    "Set BMI/USDT reserves"
  );

  logTransaction(
    await uniswapRouterMock.setReserve(await contractsRegistry.getUSDTContract(), wei(toBN(10 ** 3).toString())),
    "Set USDT reserve"
  );
  logTransaction(
    await uniswapRouterMock.setReserve(await contractsRegistry.getBMIContract(), wei(toBN(10 ** 15).toString())),
    "Set BMI reserve"
  );
  logTransaction(
    await uniswapRouterMock.setReserve(await contractsRegistry.getWETHContract(), wei(toBN(10 ** 15).toString())),
    "Set WETH reserve"
  );

  // sushsi config
  logTransaction(
    await lpSushiBmiEthTokenMock.setReserves(wei(toBN(10 ** 8).toString()), wei(toBN(10 ** 7).toString())),
    "Set BMI/ETH reserves"
  );

  logTransaction(
    await lpSushiBmiUsdtTokenMock.setReserves(wei(toBN(10 ** 8).toString()), wei(toBN(10 ** 7).toString(), "mwei")),
    "Set BMI/USDT reserves"
  );

  logTransaction(
    await sushiswapRouterMock.setReserve(await contractsRegistry.getUSDTContract(), wei(toBN(10 ** 3).toString())),
    "Set USDT reserve"
  );
  logTransaction(
    await sushiswapRouterMock.setReserve(await contractsRegistry.getBMIContract(), wei(toBN(10 ** 15).toString())),
    "Set BMI reserve"
  );
  logTransaction(
    await sushiswapRouterMock.setReserve(await contractsRegistry.getWETHContract(), wei(toBN(10 ** 15).toString())),
    "Set WETH reserve"
  );
};

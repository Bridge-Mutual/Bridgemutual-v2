const { logTransaction } = require("./helpers/logger.js");
const { toBN } = require("./helpers/utils.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const LpBmiEthMock = artifacts.require("LpBmiEthMock");
const LpBmiUsdtMock = artifacts.require("LpBmiUsdtMock");

const SushiswapRouterMock = artifacts.require("UniswapRouterMock");

const wei = web3.utils.toWei;

module.exports = async (deployer, network) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  const sushiswapRouterMock = await SushiswapRouterMock.at(await contractsRegistry.getAMMRouterContract());

  if (["ropsten", "rinkeby", "development", "polygon_test", "polygon_development"].includes(network)) {
    if (["ropsten", "rinkeby", "development"].includes(network)) {
      const lpBmiEthTokenMock = await LpBmiEthMock.at(await contractsRegistry.getAMMBMIToETHPairContract());
      const lpBmiUsdtTokenMock = await LpBmiUsdtMock.at(await contractsRegistry.getAMMBMIToUSDTPairContract());

      logTransaction(
        await lpBmiEthTokenMock.setReserves(wei(toBN(10 ** 8).toString()), wei(toBN(10 ** 7).toString())),
        "Set BMI/ETH reserves"
      );

      logTransaction(
        await lpBmiUsdtTokenMock.setReserves(wei(toBN(10 ** 8).toString()), wei(toBN(10 ** 7).toString(), "mwei")),
        "Set BMI/USDT reserves"
      );
    }
    // sushsi config

    logTransaction(
      await sushiswapRouterMock.setReserve(await contractsRegistry.getUSDTContract(), wei(toBN(10 ** 3).toString())),
      "Set USDT reserve"
    );
    logTransaction(
      await sushiswapRouterMock.setReserve(await contractsRegistry.getBMIContract(), wei(toBN(10 ** 15).toString())),
      "Set BMI reserve"
    );
    logTransaction(
      await sushiswapRouterMock.setReserve(
        await contractsRegistry.getWrappedTokenContract(),
        wei(toBN(10 ** 15).toString())
      ),
      "Set Wrapped reserve"
    );
  } else if (["bsc_test", "bsc_development"].includes(network)) {
    logTransaction(
      await sushiswapRouterMock.setReserve(await contractsRegistry.getUSDTContract(), wei(toBN(10 ** 15).toString())),
      "Set USDT reserve"
    );
    logTransaction(
      await sushiswapRouterMock.setReserve(await contractsRegistry.getBMIContract(), wei(toBN(10 ** 15).toString())),
      "Set BMI reserve"
    );
    logTransaction(
      await sushiswapRouterMock.setReserve(
        await contractsRegistry.getWrappedTokenContract(),
        wei(toBN(10 ** 15).toString())
      ),
      "Set Wrapped reserve"
    );
  }
};

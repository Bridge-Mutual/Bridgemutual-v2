const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const LeveragePortfolioView = artifacts.require("LeveragePortfolioView");

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(LeveragePortfolioView);
  const leveragePortfolioView = await LeveragePortfolioView.deployed();

  logTransaction(
    await contractsRegistry.addProxyContract(
      await contractsRegistry.LEVERAGE_PORTFOLIO_VIEW_NAME(),
      leveragePortfolioView.address
    ),
    "AddProxy LeveragePortfolioView"
  );
};

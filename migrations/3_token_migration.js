const { logTransaction } = require("./helpers/logger.js");
const { getRegisteredContracts } = require("../test/helpers/utils.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const STBLMock = artifacts.require("STBLMock");
const BMIMock = artifacts.require("BMIMock");
const WETHMock = artifacts.require("WETHMock");
const LpBmiEthMock = artifacts.require("LpBmiEthMock");
const LpBmiUsdtMock = artifacts.require("LpBmiUsdtMock");
const STKBMIToken = artifacts.require("STKBMIToken");

// TODO validate finality of data below
const bmiAddress = "0x725c263e32c72ddc3a19bea12c5a0479a81ee688";
const usdtAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const bmiToEthUniswapPairAddress = "0xa9bd7eef0c7affbdbdae92105712e9ff8b06ed49";
// TODO Set up correct address
const bmiToUSDTUniswapPairAddress = "<-paste correct address->";

module.exports = async (deployer, network, accounts) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  await deployer.deploy(BMIMock, accounts[0]);
  const bmiMock = await BMIMock.deployed();

  await deployer.deploy(STBLMock, "mockSTBL", "MSTBL", 6);
  const stblMock = await STBLMock.deployed();

  await deployer.deploy(WETHMock, "mockWETH", "MWETH");
  const wethMock = await WETHMock.deployed();

  await deployer.deploy(LpBmiEthMock, "mockBmiEthLP", "MBELP");
  const lpBmiEthTokenMock = await LpBmiEthMock.deployed();

  await deployer.deploy(LpBmiUsdtMock, "mockBmiUsdtLP", "MBULP");
  const lpBmiUsdtTokenMock = await LpBmiUsdtMock.deployed();

  await deployer.deploy(STKBMIToken);
  const stkBMIToken = await STKBMIToken.deployed();

  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.WETH_NAME(), wethMock.address),
    "Add WETH"
  );
  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stblMock.address),
    "Add USDT"
  );
  logTransaction(await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmiMock.address), "Add BMI");
  logTransaction(
    await contractsRegistry.addContract(
      await contractsRegistry.UNISWAP_BMI_TO_ETH_PAIR_NAME(),
      lpBmiEthTokenMock.address
    ),
    "Add UniswapBMIToETHPair"
  );

  logTransaction(
    await contractsRegistry.addContract(
      await contractsRegistry.UNISWAP_BMI_TO_USDT_PAIR_NAME(),
      lpBmiUsdtTokenMock.address
    ),
    "Add UniswapBMIToUSDTPair"
  );

  logTransaction(
    await contractsRegistry.addContract(
      await contractsRegistry.SUSHISWAP_BMI_TO_ETH_PAIR_NAME(),
      lpBmiEthTokenMock.address
    ),
    "Add SushiswapBMIToETHPair"
  );

  logTransaction(
    await contractsRegistry.addContract(
      await contractsRegistry.SUSHISWAP_BMI_TO_USDT_PAIR_NAME(),
      lpBmiUsdtTokenMock.address
    ),
    "Add SushiswapBMIToUSDTPair"
  );

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_NAME(), stkBMIToken.address),
    "AddProxy STKBMI"
  );
};

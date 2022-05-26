const { logTransaction } = require("./helpers/logger.js");
const { mainnet, bsc, polygon } = require("./helpers/AddressCatalog.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const STBLMock = artifacts.require("STBLMock");
const BSCSTBLMock = artifacts.require("BSCSTBLMock");
const MATICSTBLMock = artifacts.require("MATICSTBLMock");
const BMIMock = artifacts.require("BMIMock");
const WrappedTokenMock = artifacts.require("WrappedTokenMock");
const LpBmiEthMock = artifacts.require("LpBmiEthMock");
const LpBmiUsdtMock = artifacts.require("LpBmiUsdtMock");
const STKBMIToken = artifacts.require("STKBMIToken");
const STKBMITokenBridgeMock = artifacts.require("STKBMITokenBridgeMock");

let bmiContractAdd;
let stblContractAdd;
let wrappedTokenContractAdd;
let stkBMITokenContractAdd;
let lpBmiEthTokenContractAdd;
let lpBmiUsdtTokenContractAdd;

module.exports = async (deployer, network, accounts) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  if (!["mainnet", "bsc_mainnet", "polygon_mainnet"].includes(network)) {
    await deployer.deploy(BMIMock, accounts[0]);
    bmiContractAdd = (await BMIMock.deployed()).address;
  }

  if (["ropsten", "rinkeby", "development"].includes(network)) {
    await deployer.deploy(STBLMock, "mockSTBL", "MSTBL", 6);
    stblContractAdd = (await STBLMock.deployed()).address;

    await deployer.deploy(WrappedTokenMock, "mockWETH", "MWETH");
    wrappedTokenContractAdd = (await WrappedTokenMock.deployed()).address;

    await deployer.deploy(LpBmiEthMock, "mockBmiEthLP", "MBELP");
    lpBmiEthTokenContractAdd = (await LpBmiEthMock.deployed()).address;

    await deployer.deploy(LpBmiUsdtMock, "mockBmiUsdtLP", "MBULP");
    lpBmiUsdtTokenContractAdd = (await LpBmiUsdtMock.deployed()).address;
  }
  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    await deployer.deploy(STKBMIToken);
    stkBMITokenContractAdd = (await STKBMIToken.deployed()).address;
  }

  if (["bsc_test", "bsc_development"].includes(network)) {
    await deployer.deploy(BSCSTBLMock);
    stblContractAdd = (await BSCSTBLMock.deployed()).address;

    await deployer.deploy(WrappedTokenMock, "mockWBNB", "MWBNB");
    wrappedTokenContractAdd = (await WrappedTokenMock.deployed()).address;

    await deployer.deploy(STKBMITokenBridgeMock);
    stkBMITokenContractAdd = (await STKBMITokenBridgeMock.deployed()).address;
  }

  if (["polygon_test", "polygon_development"].includes(network)) {
    await deployer.deploy(MATICSTBLMock);
    const maticStbl = await MATICSTBLMock.deployed();
    await maticStbl.initialize("mockSTBL", "MSTBL", 6, accounts[0]);
    stblContractAdd = maticStbl.address;

    await deployer.deploy(WrappedTokenMock, "mockWMATIC", "MWMATIC");
    wrappedTokenContractAdd = (await WrappedTokenMock.deployed()).address;

    await deployer.deploy(STKBMITokenBridgeMock);
    stkBMITokenContractAdd = (await STKBMITokenBridgeMock.deployed()).address;
  }

  if (["mainnet"].includes(network)) {
    bmiContractAdd = mainnet.bmi_token;
    stblContractAdd = mainnet.usdt_token;
    wrappedTokenContractAdd = mainnet.weth_token;
    lpBmiEthTokenContractAdd = mainnet.amm_bmiEth;
  }

  if (["bsc_mainnet"].includes(network)) {
    bmiContractAdd = bsc.bmi_token;
    stblContractAdd = bsc.usdt_token;
    wrappedTokenContractAdd = bsc.wbnb_token;
    stkBMITokenContractAdd = bsc.stkbmi_token;
  }

  if (["polygon_mainnet"].includes(network)) {
    bmiContractAdd = polygon.bmi_token;
    stblContractAdd = polygon.usdt_token;
    wrappedTokenContractAdd = polygon.wmatic_token;
    stkBMITokenContractAdd = polygon.stkbmi_token;
  }

  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.WRAPPEDTOKEN_NAME(), wrappedTokenContractAdd),
    "Add wrappedToken"
  );
  logTransaction(await contractsRegistry.addContract(await contractsRegistry.USDT_NAME(), stblContractAdd), "Add USDT");

  logTransaction(await contractsRegistry.addContract(await contractsRegistry.BMI_NAME(), bmiContractAdd), "Add BMI");

  if (
    ["bsc_test", "bsc_development", "bsc_mainnet", "polygon_test", "polygon_development", "polygon_mainnet"].includes(
      network
    )
  ) {
    logTransaction(
      await contractsRegistry.addContract(await contractsRegistry.STKBMI_NAME(), stkBMITokenContractAdd),
      "Add STKBMI"
    );
  } else {
    logTransaction(
      await contractsRegistry.addProxyContract(await contractsRegistry.STKBMI_NAME(), stkBMITokenContractAdd),
      "AddProxy STKBMI"
    );
  }

  if (lpBmiEthTokenContractAdd != undefined) {
    logTransaction(
      await contractsRegistry.addContract(await contractsRegistry.AMM_BMI_TO_ETH_PAIR_NAME(), lpBmiEthTokenContractAdd),
      "Add AMMBMIToETHPair"
    );
  }

  if (lpBmiUsdtTokenContractAdd != undefined) {
    logTransaction(
      await contractsRegistry.addContract(
        await contractsRegistry.AMM_BMI_TO_USDT_PAIR_NAME(),
        lpBmiUsdtTokenContractAdd
      ),
      "Add AMMBMIToUSDTPair"
    );
  }
};

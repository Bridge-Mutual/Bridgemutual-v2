const { logTransaction, logAddress } = require("./helpers/logger.js");
const { toBN } = require("./helpers/utils.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const IERC20 = artifacts.require("IERC20");

const BMIToken = artifacts.require("BMIMock");

const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyBook = artifacts.require("PolicyBook");

const ContractType = {
  CONTRACT: 0,
  STABLECOIN: 1,
  SERVICE: 2,
  EXCHANGE: 3,
  VARIOUS: 4,
};

const wei = web3.utils.toWei;
const fromWei = web3.utils.fromWei;

const PRECISION = toBN(10).pow(25);

module.exports = async (deployer, network) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  const stblMock = await IERC20.at(await contractsRegistry.getUSDTContract());
  const bmiToken = await BMIToken.at(await contractsRegistry.getBMIContract());
  const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
  const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
  const policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());

  const smallLiquidity = wei("1000");
  const mediumLiquidity = wei("10000");
  const bigLiquidity = wei("1000000");
  let allowance;

  logTransaction(
    await policyBookAdmin.setupPricingModel(
      PRECISION.times(80),
      PRECISION.times(80),
      PRECISION.times(2),
      PRECISION.times(2),
      wei("10"),
      PRECISION.times(10),
      PRECISION.times(50),
      PRECISION.times(25),
      PRECISION.times(100)
    ),
    "setup pricing model"
  );

  if (["mainnet", "bsc_mainnet", "polygon_mainnet"].includes(network)) {
    return;
  }

  if (["ropsten", "rinkeby", "development", "polygon_test", "polygon_development"].includes(network)) {
    allowance = fromWei(toBN(smallLiquidity).plus(mediumLiquidity).plus(bigLiquidity).toFixed(), "microether");
  } else if (["bsc_test", "bsc_development"].includes(network)) {
    allowance = toBN(smallLiquidity).plus(mediumLiquidity).plus(bigLiquidity).toFixed();
  }
  await stblMock.approve(policyBookFabric.address, allowance);

  const mockInsuranceContractAddress1 = "0x0000000000000000000000000000000000000001";
  const mockInsuranceContractAddress2 = "0x0000000000000000000000000000000000000002";
  const mockInsuranceContractAddress3 = "0x0000000000000000000000000000000000000003";
  const mockInsuranceContractAddress4 = "0x0000000000000000000000000000000000000004";
  const mockInsuranceContractAddress5 = "0x0000000000000000000000000000000000000005";
  const mockInsuranceContractAddress6 = "0x0000000000000000000000000000000000000006";

  // TESTNET START

  logTransaction(
    await policyBookFabric.createLeveragePools(
      mockInsuranceContractAddress4,
      ContractType.VARIOUS,
      "LeveragePortfolio1",
      "LevPf1"
    ),
    "Create User Leverage Pool1"
  );

  logTransaction(
    await policyBookFabric.createLeveragePools(
      mockInsuranceContractAddress5,
      ContractType.VARIOUS,
      "LeveragePortfolio2",
      "LevPf2"
    ),
    "Create User Leverage Pool2"
  );

  logTransaction(
    await policyBookFabric.createLeveragePools(
      mockInsuranceContractAddress6,
      ContractType.VARIOUS,
      "LeveragePortfolio3",
      "LevPf3"
    ),
    "Create User Leverage Pool3"
  );
  logTransaction(
    await policyBookFabric.create(
      mockInsuranceContractAddress1,
      ContractType.CONTRACT,
      "mock1",
      "1",
      smallLiquidity,
      bmiToken.address
    ),
    "Create PolicyBook1"
  );
  logTransaction(
    await policyBookFabric.create(
      mockInsuranceContractAddress2,
      ContractType.CONTRACT,
      "mock2",
      "2",
      mediumLiquidity,
      bmiToken.address
    ),
    "Create PolicyBook2"
  );
  logTransaction(
    await policyBookFabric.create(
      mockInsuranceContractAddress3,
      ContractType.CONTRACT,
      "mock3",
      "3",
      bigLiquidity,
      bmiToken.address
    ),
    "Create PolicyBook3"
  );

  const smallPolicyBookAddress = await policyBookRegistry.policyBookFor(mockInsuranceContractAddress1);
  const mediumPolicyBookAddress = await policyBookRegistry.policyBookFor(mockInsuranceContractAddress2);
  const bigPolicyBookAddress = await policyBookRegistry.policyBookFor(mockInsuranceContractAddress3);
  const userLeveragePoolAddress = await policyBookRegistry.listByType(ContractType.VARIOUS, 0, 3);

  console.log();

  logAddress("PolicyBook with " + smallLiquidity + " liquidity", smallPolicyBookAddress);
  logAddress("PolicyBook with " + mediumLiquidity + " liquidity", mediumPolicyBookAddress);
  logAddress("PolicyBook with " + bigLiquidity + " liquidity", bigPolicyBookAddress);

  logTransaction(await policyBookAdmin.whitelist(smallPolicyBookAddress, true), "whitelisting  pb mock 1");
  logTransaction(await policyBookAdmin.whitelist(mediumPolicyBookAddress, true), "whitelisting  pb mock 2");
  logTransaction(await policyBookAdmin.whitelist(bigPolicyBookAddress, true), "whitelisting  pb mock 3");
  logTransaction(await policyBookAdmin.whitelist(userLeveragePoolAddress[0], true), "whitelisting  user leverage1");
  logTransaction(await policyBookAdmin.whitelist(userLeveragePoolAddress[1], true), "whitelisting  user leverage2");
  logTransaction(await policyBookAdmin.whitelist(userLeveragePoolAddress[2], true), "whitelisting  user leverage3");

  let facadeMock1 = await (await PolicyBook.at(smallPolicyBookAddress)).policyBookFacade();
  let facadeMock2 = await (await PolicyBook.at(mediumPolicyBookAddress)).policyBookFacade();
  let facadeMock3 = await (await PolicyBook.at(bigPolicyBookAddress)).policyBookFacade();

  // Reinsurance MPL
  rMpl1 = PRECISION.times(30);
  rMpl2 = PRECISION.times(40); // 30*10**25
  // User Leverage MPL
  uMpl1 = PRECISION.times(80); // 80*10**25
  uMpl2 = PRECISION.times(70);

  logTransaction(await policyBookAdmin.setPolicyBookFacadeMPLs(facadeMock1, uMpl1, rMpl1), "MPL's set for mock 1");
  logTransaction(await policyBookAdmin.setPolicyBookFacadeMPLs(facadeMock2, uMpl1, rMpl1), "MPL's set for mock 2");
  logTransaction(await policyBookAdmin.setPolicyBookFacadeMPLs(facadeMock3, uMpl2, rMpl2), "MPL's set for mock 3");
};

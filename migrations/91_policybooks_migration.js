const { logTransaction, logAddress } = require("./helpers/logger.js");
const { toBN } = require("./helpers/utils.js");
const BigNumber = require("bignumber.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const STBLMock = artifacts.require("STBLMock");

const PolicyBookFabric = artifacts.require("PolicyBookFabric");
const PolicyBookRegistry = artifacts.require("PolicyBookRegistry");
const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const PolicyBook = artifacts.require("PolicyBook");
const UserLeveragePool = artifacts.require("UserLeveragePool");

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

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  const stblMock = await STBLMock.at(await contractsRegistry.getUSDTContract());
  const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());
  const policyBookRegistry = await PolicyBookRegistry.at(await contractsRegistry.getPolicyBookRegistryContract());
  const policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());

  const smallLiquidity = wei("1000");
  const mediumLiquidity = wei("10000");
  const bigLiquidity = wei("1000000");

  const allowance = fromWei(toBN(smallLiquidity).plus(mediumLiquidity).plus(bigLiquidity).toFixed(), "microether");

  await stblMock.approve(policyBookFabric.address, allowance);

  const mockInsuranceContractAddress1 = "0x0000000000000000000000000000000000000001";
  const mockInsuranceContractAddress2 = "0x0000000000000000000000000000000000000002";
  const mockInsuranceContractAddress3 = "0x0000000000000000000000000000000000000003";

  // TESTNET START
  console.log(mockInsuranceContractAddress1, ContractType.STABLECOIN, "mock1", "1", smallLiquidity);

  logTransaction(
    await policyBookFabric.createLeveragePools(ContractType.VARIOUS, " LeveragePortfolio", "LevPf1"),
    "Create User Leverage Pool1"
  );
  logTransaction(
    await policyBookFabric.create(
      mockInsuranceContractAddress1,
      ContractType.STABLECOIN,
      "mock1",
      "1",
      smallLiquidity,
      stblMock.address
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
      stblMock.address
    ),
    "Create PolicyBook2"
  );
  logTransaction(
    await policyBookFabric.create(
      mockInsuranceContractAddress3,
      ContractType.EXCHANGE,
      "mock3",
      "3",
      bigLiquidity,
      stblMock.address
    ),
    "Create PolicyBook3"
  );

  const smallPolicyBookAddress = await policyBookRegistry.policyBookFor(mockInsuranceContractAddress1);
  const mediumPolicyBookAddress = await policyBookRegistry.policyBookFor(mockInsuranceContractAddress2);
  const bigPolicyBookAddress = await policyBookRegistry.policyBookFor(mockInsuranceContractAddress3);
  const userLeveragePoolAddress = await policyBookRegistry.listByType(ContractType.VARIOUS, 0, 1);

  console.log();

  logAddress("PolicyBook with " + smallLiquidity + " liquidity", smallPolicyBookAddress);
  logAddress("PolicyBook with " + mediumLiquidity + " liquidity", mediumPolicyBookAddress);
  logAddress("PolicyBook with " + bigLiquidity + " liquidity", bigPolicyBookAddress);

  logTransaction(await policyBookAdmin.whitelist(smallPolicyBookAddress, true), "whitelisting  pb mock 1");
  logTransaction(await policyBookAdmin.whitelist(mediumPolicyBookAddress, true), "whitelisting  pb mock 2");
  logTransaction(await policyBookAdmin.whitelist(bigPolicyBookAddress, true), "whitelisting  pb mock 3");
  logTransaction(await policyBookAdmin.whitelist(userLeveragePoolAddress[0], true), "whitelisting  user leverage");

  let facadeMock1 = await (await PolicyBook.at(smallPolicyBookAddress)).policyBookFacade();
  let facadeMock2 = await (await PolicyBook.at(mediumPolicyBookAddress)).policyBookFacade();
  let facadeMock3 = await (await PolicyBook.at(bigPolicyBookAddress)).policyBookFacade();

  // Reinsurance MPL
  rMpl = PRECISION.times(30); // 30*10**25
  // User Leverage MPL
  uMpl = PRECISION.times(80); // 80*10**25

  logTransaction(await policyBookAdmin.setPolicyBookFacadeMPLs(facadeMock1, uMpl, rMpl), "MPL's set for mock 1");
  logTransaction(await policyBookAdmin.setPolicyBookFacadeMPLs(facadeMock2, uMpl, rMpl), "MPL's set for mock 2");
  logTransaction(await policyBookAdmin.setPolicyBookFacadeMPLs(facadeMock3, uMpl, rMpl), "MPL's set for mock 3");

  logTransaction(
    await policyBookAdmin.setupPricingModel(
      PRECISION.times(80),
      PRECISION.times(2),
      wei("10"),
      PRECISION.times(10),
      PRECISION.times(50),
      PRECISION.times(25),
      PRECISION.times(100)
    ),
    "setup pricing model"
  );
};

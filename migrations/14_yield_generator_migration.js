const { logTransaction } = require("./helpers/logger.js");
const BigNumber = require("bignumber.js");
const { mainnet } = require("./helpers/AddressCatalog.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const YieldGenerator = artifacts.require("YieldGenerator");

const STBLMock = artifacts.require("STBLMock");

// AAVE
const AaveProtocol = artifacts.require("AaveProtocol");

// AAVE MOCKS
const LendingPoolMock = artifacts.require("LendingPoolMock");
const LendingPoolAddressesProviderMock = artifacts.require("LendingPoolAddressesProviderMock");
const ATokenMock = artifacts.require("ATokenMock");

// COMPOUND
const CompoundProtocol = artifacts.require("CompoundProtocol");

// COMPOUND MOCKS
const ComptrollerMock = artifacts.require("ComptrollerMock");
const CompMock = artifacts.require("CompMock");
const CTokenMock = artifacts.require("CERC20Mock");

// YEARN
const YearnProtocol = artifacts.require("YearnProtocol");

// YEARN MOCKS
const VaultMock = artifacts.require("VaultMock");

function toBN(number) {
  return new BigNumber(number);
}

let aTokenAdd;
let lendingPoolAddressesProviderAdd;
let comptrollerAdd;
let cTokenAdd;
let vaultAdd;
let aaveProtocolAdd;
let compoundProtocolAdd;
let yearnProtocolAdd;

module.exports = async (deployer, network) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);
  const stblMock = await STBLMock.at(await contractsRegistry.getUSDTContract());

  await deployer.deploy(YieldGenerator);
  const yieldGenerator = await YieldGenerator.deployed();

  if (["ropsten", "rinkeby", "development"].includes(network)) {
    // DEPLOY MOCKS
    await deployer.deploy(ATokenMock, stblMock.address, toBN(10).pow(27));
    aTokenAdd = (await ATokenMock.deployed()).address;

    await deployer.deploy(LendingPoolMock, aTokenAdd);
    const lendingPoolMock = await LendingPoolMock.deployed();

    await deployer.deploy(LendingPoolAddressesProviderMock, lendingPoolMock.address);
    lendingPoolAddressesProviderAdd = (await LendingPoolAddressesProviderMock.deployed()).address;

    await deployer.deploy(CompMock);
    const compMock = await CompMock.deployed();

    await deployer.deploy(ComptrollerMock, compMock.address);
    comptrollerAdd = (await ComptrollerMock.deployed()).address;

    await deployer.deploy(CTokenMock, stblMock.address);
    cTokenAdd = (await CTokenMock.deployed()).address;

    await deployer.deploy(VaultMock, stblMock.address);
    vaultAdd = (await VaultMock.deployed()).address;
  }

  if (["mainnet"].includes(network)) {
    aTokenAdd = mainnet.aave_token;
    lendingPoolAddressesProviderAdd = mainnet.aave_lendingPool;
    comptrollerAdd = mainnet.comp_comptroller;
    cTokenAdd = mainnet.comp_cUSDT;
    vaultAdd = mainnet.yearn_vault;
  }

  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    // DEPLOY PROTOCOLS
    await deployer.deploy(AaveProtocol);
    aaveProtocolAdd = (await AaveProtocol.deployed()).address;

    await deployer.deploy(CompoundProtocol);
    compoundProtocolAdd = (await CompoundProtocol.deployed()).address;

    await deployer.deploy(YearnProtocol);
    yearnProtocolAdd = (await YearnProtocol.deployed()).address;

    logTransaction(
      await contractsRegistry.addContract(await contractsRegistry.AAVE_ATOKEN_NAME(), aTokenAdd),
      "Add AToken"
    );
    logTransaction(
      await contractsRegistry.addContract(
        await contractsRegistry.AAVE_LENDPOOL_ADDRESS_PROVIDER_NAME(),
        lendingPoolAddressesProviderAdd
      ),
      "Add LendingPoolAddressesProvider"
    );
    logTransaction(
      await contractsRegistry.addContract(await contractsRegistry.COMPOUND_COMPTROLLER_NAME(), comptrollerAdd),
      "Add Comptroller"
    );
    logTransaction(
      await contractsRegistry.addContract(await contractsRegistry.COMPOUND_CTOKEN_NAME(), cTokenAdd),
      "Add CToken"
    );
    logTransaction(
      await contractsRegistry.addContract(await contractsRegistry.YEARN_VAULT_NAME(), vaultAdd),
      "Add Vault"
    );

    logTransaction(
      await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_1_NAME(), aaveProtocolAdd),
      "AddProxy AaveProtocol"
    );
    logTransaction(
      await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_2_NAME(), compoundProtocolAdd),
      "AddProxy CompoundProtocol"
    );
    logTransaction(
      await contractsRegistry.addProxyContract(await contractsRegistry.DEFI_PROTOCOL_3_NAME(), yearnProtocolAdd),
      "AddProxy YearnProtocol"
    );
  }

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), yieldGenerator.address),
    "AddProxy YieldGenerator"
  );
};

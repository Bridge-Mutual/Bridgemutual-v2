const { logTransaction } = require("./helpers/logger.js");
const BigNumber = require("bignumber.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const YieldGenerator = artifacts.require("YieldGenerator");

const STBLMock = artifacts.require("STBLMock");

// AAVE
const AaveProtocol = artifacts.require("AaveProtocol");
/* mainnet addresses
const lendingPoolAddressesProviderAddress = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";
const aTokenAddress = "0xe91D55AB2240594855aBd11b3faAE801Fd4c4687";
*/
// AAVE MOCKS
const LendingPoolMock = artifacts.require("LendingPoolMock");
const LendingPoolAddressesProviderMock = artifacts.require("LendingPoolAddressesProviderMock");
const ATokenMock = artifacts.require("ATokenMock");

// COMPOUND
const CompoundProtocol = artifacts.require("CompoundProtocol");
/* mainnet addresses
const comptrollerAddress = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b";
const cTokenAddress = "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9";
*/
// COMPOUND MOCKS
const ComptrollerMock = artifacts.require("ComptrollerMock");
const CompMock = artifacts.require("CompMock");
const CTokenMock = artifacts.require("CERC20Mock");

// YEARN
const YearnProtocol = artifacts.require("YearnProtocol");
/* mainnet addresses
const vaultAddress = "0x7Da96a3891Add058AdA2E826306D812C638D87a7";
*/
// YEARN MOCKS
const VaultMock = artifacts.require("VaultMock");

function toBN(number) {
  return new BigNumber(number);
}

module.exports = async (deployer) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);
  const stblMock = await STBLMock.at(await contractsRegistry.getUSDTContract());

  // DEPLOY MOCKS
  await deployer.deploy(ATokenMock, stblMock.address, toBN(10).pow(27));
  const atokenMock = await ATokenMock.deployed();

  await deployer.deploy(LendingPoolMock, atokenMock.address);
  const lendingPoolMock = await LendingPoolMock.deployed();

  await deployer.deploy(LendingPoolAddressesProviderMock, lendingPoolMock.address);
  const lendingPoolAddressesProviderMock = await LendingPoolAddressesProviderMock.deployed();

  await deployer.deploy(CompMock);
  const compMock = await CompMock.deployed();

  await deployer.deploy(ComptrollerMock, compMock.address);
  const comptrollerMock = await ComptrollerMock.deployed();

  await deployer.deploy(CTokenMock, stblMock.address);
  const cTokenMock = await CTokenMock.deployed();

  await deployer.deploy(VaultMock, stblMock.address);
  const vaultMock = await VaultMock.deployed();

  // DEPLOY PROTOCOLS
  await deployer.deploy(YieldGenerator);
  const yieldGenerator = await YieldGenerator.deployed();

  await deployer.deploy(AaveProtocol);
  const aaveProtocol = await AaveProtocol.deployed();

  await deployer.deploy(CompoundProtocol);
  const compoundProtocol = await CompoundProtocol.deployed();

  await deployer.deploy(YearnProtocol);
  const yearnProtocol = await YearnProtocol.deployed();

  // SET UP CONTRACTS REGISTERY
  /* mainnet set up
  logTransaction(
    await contractsRegistry.addContract(
      await contractsRegistry.AAVE_LENDPOOL_ADDRESS_PROVIDER_NAME(),
      lendingPoolAddressesProviderAddress
    ),
    "Add LendingPoolAddressesProvider"
  );
  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.AAVE_ATOKEN_NAME(), aTokenAddress),
    "Add AToken"
  );

  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_COMPTROLLER_NAME(), comptrollerAddress),
    "Add Comptroller"
  );
  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_CTOKEN_NAME(), cTokenAddress),
    "Add CToken"
  );

  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.YEARN_VAULT_NAME(), vaultAddress),
    "Add Vault"
  );
*/
  // SET UP CONTRACTS REGISTRY FOR MOCKS

  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.AAVE_ATOKEN_NAME(), atokenMock.address),
    "Add AToken"
  );
  logTransaction(
    await contractsRegistry.addContract(
      await contractsRegistry.AAVE_LENDPOOL_ADDRESS_PROVIDER_NAME(),
      lendingPoolAddressesProviderMock.address
    ),
    "Add LendingPoolAddressesProvider"
  );
  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_COMPTROLLER_NAME(), comptrollerMock.address),
    "Add Comptroller"
  );
  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.COMPOUND_CTOKEN_NAME(), cTokenMock.address),
    "Add CToken"
  );
  logTransaction(
    await contractsRegistry.addContract(await contractsRegistry.YEARN_VAULT_NAME(), vaultMock.address),
    "Add Vault"
  );

  // SET UP PROXY

  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.YIELD_GENERATOR_NAME(), yieldGenerator.address),
    "AddProxy YieldGenerator"
  );
  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.AAVE_PROTOCOL_NAME(), aaveProtocol.address),
    "AddProxy AaveProtocol"
  );
  logTransaction(
    await contractsRegistry.addProxyContract(
      await contractsRegistry.COMPOUND_PROTOCOL_NAME(),
      compoundProtocol.address
    ),
    "AddProxy CompoundProtocol"
  );
  logTransaction(
    await contractsRegistry.addProxyContract(await contractsRegistry.YEARN_PROTOCOL_NAME(), yearnProtocol.address),
    "AddProxy YearnProtocol"
  );
};

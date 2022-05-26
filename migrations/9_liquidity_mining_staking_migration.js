const { mainnet } = require("./helpers/AddressCatalog.js");
const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");
const LiquidityMiningStakingETH = artifacts.require("LiquidityMiningStakingETH");
const LiquidityMiningStakingUSDT = artifacts.require("LiquidityMiningStakingUSDT");
const SushiswapMock = artifacts.require("SushiswapMock");

let liquidityMiningStakingETHContractAdd;
let liquidityMiningStakingUSDTContractAdd;
let SushiswapMockContractAdd;

module.exports = async (deployer, network) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);

  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    await deployer.deploy(LiquidityMiningStakingETH);
    liquidityMiningStakingETHContractAdd = (await LiquidityMiningStakingETH.deployed()).address;

    await deployer.deploy(LiquidityMiningStakingUSDT);
    liquidityMiningStakingUSDTContractAdd = (await LiquidityMiningStakingUSDT.deployed()).address;

    logTransaction(
      await contractsRegistry.addProxyContract(
        await contractsRegistry.LIQUIDITY_MINING_STAKING_ETH_NAME(),
        liquidityMiningStakingETHContractAdd
      ),
      "AddProxy LiquidityMiningStakingETH"
    );

    logTransaction(
      await contractsRegistry.addProxyContract(
        await contractsRegistry.LIQUIDITY_MINING_STAKING_USDT_NAME(),
        liquidityMiningStakingUSDTContractAdd
      ),
      "AddProxy LiquidityMiningStakingUSDT"
    );

    if (["mainnet"].includes(network)) {
      SushiswapMockContractAdd = mainnet.sushiswap_V2MasterChef;
    } else {
      // TODO deploye another instance from mock for USDT liq mining staking for test
      await deployer.deploy(SushiswapMock, await contractsRegistry.getLiquidityMiningStakingETHContract());
      SushiswapMockContractAdd = (await SushiswapMock.deployed()).address;
    }

    logTransaction(
      await contractsRegistry.addContract(
        await contractsRegistry.SUSHI_SWAP_MASTER_CHEF_V2_NAME(),
        SushiswapMockContractAdd
      ),
      "Add sushiswapMasterChefV2Address"
    );
  }
};

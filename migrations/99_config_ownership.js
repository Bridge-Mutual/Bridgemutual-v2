const { logTransaction } = require("./helpers/logger.js");

const Proxy = artifacts.require("TransparentUpgradeableProxy");
const ContractsRegistry = artifacts.require("ContractsRegistry");

const BMICoverStaking = artifacts.require("BMICoverStaking");
const RewardsGenerator = artifacts.require("RewardsGenerator");

const BMIStaking = artifacts.require("BMIStaking");

const BMIUtilityNFT = artifacts.require("BMIUtilityNFT");

const CapitalPool = artifacts.require("CapitalPool");
const PolicyBookFabric = artifacts.require("PolicyBookFabric");

const LiquidityMiningStakingETH = artifacts.require("LiquidityMiningStakingETH");
const LiquidityMiningStakingUSDT = artifacts.require("LiquidityMiningStakingUSDT");

const ReinsurancePool = artifacts.require("ReinsurancePool");

const PolicyBookAdmin = artifacts.require("PolicyBookAdmin");
const AaveProtocol = artifacts.require("AaveProtocol");
const CompoundProtocol = artifacts.require("CompoundProtocol");
const YearnProtocol = artifacts.require("YearnProtocol");
const YieldGenerator = artifacts.require("YieldGenerator");
const NFTStaking = artifacts.require("NFTStaking");
const ShieldMining = artifacts.require("ShieldMining");

// TODO validate finality of data below
const ownerAddress = "0xc97773E1Df2cC54e51a005DFF7cBBb6480aE2767"; // Mike's address
//const ownerAddress = "0xaa5e721A6a8B1F61e5976a30B908D7F7f0798677"; // Amr's address
//const contractRegistryAddress = "0xdbD45F257581c0C9d7f34B66057//c60920C426073";

let bmiStaking;
let liquidityMiningStakingETH;
let liquidityMiningStakingUSDT;
let aaveProtocol;
let compoundProtocol;
let yearnProtocol;
module.exports = async (deployer, network, accounts) => {
  const contractsRegistry = await ContractsRegistry.at((await Proxy.deployed()).address);
  //const contractsRegistry = await ContractsRegistry.at(contractRegistryAddress);

  const bmiCoverStaking = await BMICoverStaking.at(await contractsRegistry.getBMICoverStakingContract());
  const rewardsGenerator = await RewardsGenerator.at(await contractsRegistry.getRewardsGeneratorContract());
  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    bmiStaking = await BMIStaking.at(await contractsRegistry.getBMIStakingContract());

    liquidityMiningStakingETH = await LiquidityMiningStakingETH.at(
      await contractsRegistry.getLiquidityMiningStakingETHContract()
    );

    liquidityMiningStakingUSDT = await LiquidityMiningStakingUSDT.at(
      await contractsRegistry.getLiquidityMiningStakingUSDTContract()
    );

    aaveProtocol = await AaveProtocol.at(await contractsRegistry.getDefiProtocol1Contract());
    compoundProtocol = await CompoundProtocol.at(await contractsRegistry.getDefiProtocol2Contract());
    yearnProtocol = await YearnProtocol.at(await contractsRegistry.getDefiProtocol3Contract());
  }

  const bmiUtilityNFT = await BMIUtilityNFT.at(await contractsRegistry.getBMIUtilityNFTContract());

  const reinsurancePool = await ReinsurancePool.at(await contractsRegistry.getReinsurancePoolContract());

  const policyBookAdmin = await PolicyBookAdmin.at(await contractsRegistry.getPolicyBookAdminContract());

  const capitalPool = await CapitalPool.at(await contractsRegistry.getCapitalPoolContract());

  const policyBookFabric = await PolicyBookFabric.at(await contractsRegistry.getPolicyBookFabricContract());

  const yieldGenerator = await YieldGenerator.at(await contractsRegistry.getYieldGeneratorContract());

  const shieldMining = await ShieldMining.at(await contractsRegistry.getShieldMiningContract());
  const nftStaking = await NFTStaking.at(await contractsRegistry.getNFTStakingContract());

  ////////////////////////////////////////////////////////////

  console.log();

  logTransaction(await bmiCoverStaking.transferOwnership(ownerAddress), "Ownership BMICoverStaking");
  logTransaction(await rewardsGenerator.transferOwnership(ownerAddress), "Ownership RewardsGenerator");
  if (["ropsten", "rinkeby", "development", "mainnet"].includes(network)) {
    logTransaction(await bmiStaking.transferOwnership(ownerAddress), "Ownership BMIStaking");
    logTransaction(
      await liquidityMiningStakingETH.transferOwnership(ownerAddress),
      "Ownership LiquidityMiningStakingETH"
    );

    logTransaction(
      await liquidityMiningStakingUSDT.transferOwnership(ownerAddress),
      "Ownership LiquidityMiningStakingUSDT"
    );
    logTransaction(await aaveProtocol.transferOwnership(ownerAddress), "Ownership aaveProtocol");

    logTransaction(await compoundProtocol.transferOwnership(ownerAddress), "Ownership compoundProtocol");

    logTransaction(await yearnProtocol.transferOwnership(ownerAddress), "Ownership yearnProtocol");
  }

  logTransaction(await nftStaking.transferOwnership(ownerAddress), "Ownership nftStaking");

  logTransaction(await bmiUtilityNFT.transferOwnership(ownerAddress), "Ownership BMIUtilityNFT");

  logTransaction(await reinsurancePool.transferOwnership(ownerAddress), "Ownership ReinsurancePool");

  logTransaction(await policyBookAdmin.transferOwnership(ownerAddress), "Ownership PolicyBookAdmin");

  logTransaction(await capitalPool.transferOwnership(ownerAddress), "Ownership CapitalPool");

  logTransaction(await policyBookFabric.transferOwnership(ownerAddress), "Ownership PolicyBookFabric");

  logTransaction(await yieldGenerator.transferOwnership(ownerAddress), "Ownership yieldGenerator");

  logTransaction(await shieldMining.transferOwnership(ownerAddress), "Ownership shieldMining");

  ////////////////////////////////////////////////////////////

  console.log();

  logTransaction(
    await contractsRegistry.grantRole(await contractsRegistry.REGISTRY_ADMIN_ROLE(), ownerAddress),
    "Granting admin role of ContractsRegistry"
  );

  logTransaction(
    await contractsRegistry.renounceRole(await contractsRegistry.REGISTRY_ADMIN_ROLE(), accounts[0]),
    "Renouncing deployer's admin role of ContractsRegistry"
  );
};
